// Local preview on http://localhost:8080 — serves web/, data/ and scripts/lib/ live (no rebuild needed).
// The slim data (data/feed.json, data/feed/…, data/feed-search.json) comes from the Rust build
// (site/), which runs again when products.json or price-history.json is newer than its output.
// Markets (/en-se/ …) are served like the root, as on Vercel; there's no redirect by country here.
// The start page shows the spinner instead of pre-rendered products: run `npm run build` and
// serve _site/ to see exactly what's deployed. Product pages (/p/…) come from the last build.
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2' };
const port = Number(process.env.PORT) || 8080;

function resolve(path) {
  if (/^\/data\/feed[-./]/.test(path)) return join(root, '_site', path);
  if (path.startsWith('/p/')) return join(root, '_site', `${path}.html`); // product pages: run `npm run build` first
  if (path.startsWith('/data/')) return join(root, path);
  if (path.startsWith('/lib/')) return join(root, 'scripts', path);
  return join(root, 'web', path.endsWith('/') ? `${path}index.html` : path);
}

// rustup's cargo, also when this server is started without the shell profile that puts it on PATH.
const cargo = existsSync(join(homedir(), '.cargo/bin/cargo')) ? join(homedir(), '.cargo/bin/cargo') : 'cargo';
const mtime = (f) => stat(f).then((s) => s.mtimeMs, () => 0);
let building = null;
async function ensureFeed() {
  const built = await mtime(join(root, '_site/data/feed.json'));
  const sources = await Promise.all(['products.json', 'price-history.json'].map((f) => mtime(join(root, 'data', f))));
  if (built > Math.max(...sources)) return;
  building ??= Promise.resolve().then(() => {
    console.log('Building the feed with the Rust build (site/)…');
    execFileSync(cargo, ['run', '--release', '--quiet', '--manifest-path', join(root, 'site/Cargo.toml')], { stdio: 'inherit' });
  }).finally(() => { building = null; });
  await building;
}

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '')
    // /en-se/…, /en-eu/… and /en-us/… are the same site (the rewrite in vercel.json).
    .replace(/^\/en-(se|eu|us)(?=\/|$)/, '') || '/';
  const file = resolve(path);
  try {
    if (/^\/data\/feed[-./]/.test(path)) await ensureFeed();
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(port, () => console.log(`Preview: http://localhost:${port}`));
