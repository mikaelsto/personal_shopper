// Assembles the static site into _site/ (web/ + data/) for GitHub Pages.
import { cp, rm, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = `${root}_site`;

await rm(out, { recursive: true, force: true });
await mkdir(`${out}/data`, { recursive: true });
await cp(`${root}web`, out, { recursive: true });
for (const f of ['products.json', 'price-history.json', 'meta.json']) {
  await cp(`${root}data/${f}`, `${out}/data/${f}`);
}
console.log(`Site built in ${out}`);
