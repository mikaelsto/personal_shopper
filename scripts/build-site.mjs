// Assembles the static site into _site/ for GitHub Pages:
//   web/*                   -> _site/
//   data/*.json (public)    -> _site/data/
//   scripts/lib (browser)   -> _site/lib/   (shared taxonomy, Shopify mapping, colours/palettes)
//   slim feed for social/   -> _site/data/feed.json + _site/data/feed/<store>/<id>.json
import { cp, rm, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFeed } from './lib/feed.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = `${root}_site`;

export const DATA_FILES = ['products.json', 'price-history.json', 'meta.json', 'stores.json', 'color-names.json'];
export const BROWSER_LIBS = ['normalize.mjs', 'taxonomy.mjs', 'shopify-map.mjs', 'colors.mjs', 'palettes.mjs', 'palette-match.mjs', 'feed.mjs'];

await rm(out, { recursive: true, force: true });
await mkdir(`${out}/data`, { recursive: true });
await mkdir(`${out}/lib`, { recursive: true });
await cp(`${root}web`, out, { recursive: true });
for (const f of DATA_FILES) await cp(`${root}data/${f}`, `${out}/data/${f}`);
for (const f of BROWSER_LIBS) await cp(`${root}scripts/lib/${f}`, `${out}/lib/${f}`);

const readData = async (f) => JSON.parse(await readFile(`${root}data/${f}`, 'utf8'));
const [{ products, generatedAt }, history] = await Promise.all([readData('products.json'), readData('price-history.json')]);
const { feed, details } = buildFeed(products, history, generatedAt);
await writeFile(`${out}/data/feed.json`, JSON.stringify(feed));
for (const dir of new Set(details.map(([path]) => dirname(path)))) await mkdir(`${out}/data/${dir}`, { recursive: true });
await Promise.all(details.map(([path, d]) => writeFile(`${out}/data/${path}`, JSON.stringify(d))));

// Cache-busting: GitHub Pages lets browsers cache files for 10 minutes, so after a deploy a
// new page could run with the previous CSS/JS. Stamp every local CSS/JS reference with the build.
const version = (process.env.GITHUB_SHA ?? Date.now().toString(36)).slice(0, 10);
const stamp = (text) => text
  .replace(/((?:href|src)=")([\w./-]+\.(?:css|m?js))"/g, `$1$2?v=${version}"`)
  .replace(/((?:from\s*|import\s*\(\s*)['"])(\.{1,2}\/[^'"?]+\.m?js)(['"])/g, `$1$2?v=${version}$3`);
for (const f of await readdir(out, { recursive: true })) {
  if (!/\.(html|m?js)$/.test(f) || f.startsWith('data')) continue;
  const file = `${out}/${f}`;
  await writeFile(file, stamp(await readFile(file, 'utf8')));
}
console.log(`Site built in ${out} (v=${version}, feed: ${feed.products.length} products)`);
