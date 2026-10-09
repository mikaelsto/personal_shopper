// Assembles the static site into _site/ for GitHub Pages:
//   web/*                   -> _site/
//   data/*.json (public)    -> _site/data/
//   scripts/lib (browser)   -> _site/lib/   (shared taxonomy + Shopify mapping)
import { cp, rm, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = `${root}_site`;

export const DATA_FILES = ['products.json', 'price-history.json', 'meta.json', 'stores.json'];
export const BROWSER_LIBS = ['normalize.mjs', 'taxonomy.mjs', 'shopify-map.mjs'];

await rm(out, { recursive: true, force: true });
await mkdir(`${out}/data`, { recursive: true });
await mkdir(`${out}/lib`, { recursive: true });
await cp(`${root}web`, out, { recursive: true });
for (const f of DATA_FILES) await cp(`${root}data/${f}`, `${out}/data/${f}`);
for (const f of BROWSER_LIBS) await cp(`${root}scripts/lib/${f}`, `${out}/lib/${f}`);
console.log(`Site built in ${out}`);
