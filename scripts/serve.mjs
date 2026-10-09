// Local preview on http://localhost:8080 — serves web/, data/ and scripts/lib/ live (no rebuild needed).
// The feed's data (data/feed.json, data/feed/…) is built on the fly from data/products.json.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFeed } from './lib/feed.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const port = Number(process.env.PORT) || 8080;

function resolve(path) {
  if (path.startsWith('/data/')) return join(root, path);
  if (path.startsWith('/lib/')) return join(root, 'scripts', path);
  return join(root, 'web', path.endsWith('/') ? `${path}index.html` : path);
}

// Rebuilt when products.json or price-history.json changes.
let feedCache = null;
async function feedFile(path) {
  const files = ['products.json', 'price-history.json'].map((f) => join(root, 'data', f));
  const stamp = (await Promise.all(files.map((f) => stat(f)))).map((s) => s.mtimeMs).join();
  if (feedCache?.stamp !== stamp) {
    const [{ products, generatedAt }, history] = await Promise.all(files.map(async (f) => JSON.parse(await readFile(f, 'utf8'))));
    const { feed, details } = buildFeed(products, history, generatedAt);
    feedCache = { stamp, files: new Map([['feed.json', feed], ...details]) };
  }
  const data = feedCache.files.get(path.slice('/data/'.length));
  if (!data) throw new Error('Not found');
  return JSON.stringify(data);
}

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  const file = resolve(path);
  try {
    const body = /^\/data\/feed[./]/.test(path) ? await feedFile(path) : await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(port, () => console.log(`Preview: http://localhost:${port}`));
