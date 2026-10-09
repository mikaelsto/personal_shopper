// Saves 👍/👎 palette votes from a "Palette feedback" GitHub issue into data/palette-labels.json,
// then writes the updated accuracy report to $SUMMARY_FILE (posted as the issue reply).
// Issue body lines look like: "+ kayo:16844 palette=soft-autumn" (vote, product id, selection).

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { evaluate } from './palette-eval.mjs';

const DATA = fileURLToPath(new URL('../data', import.meta.url));
const readJson = async (f, d) => { try { return JSON.parse(await readFile(`${DATA}/${f}`, 'utf8')); } catch { return d; } };

const [labels, data, overrides] = await Promise.all([
  readJson('palette-labels.json', []), readJson('products.json', { products: [] }), readJson('color-names.json', {}),
]);
const byId = new Map(data.products.map((p) => [p.id, p]));
const today = new Date().toISOString().slice(0, 10);

const incoming = [...String(process.env.ISSUE_BODY ?? '').matchAll(/^([+-])\s+(\S+)\s+(\S+)\s*$/gm)]
  .map(([, v, id, sel]) => ({ id, sel, vote: v === '+' ? 1 : -1 }));

// One label per product + selection; the newest vote wins.
const key = (l) => `${l.id} ${l.sel}`;
const merged = new Map(labels.map((l) => [key(l), l]));
for (const l of incoming) {
  const p = byId.get(l.id);
  merged.set(key(l), { ...l, at: today, title: p ? `${p.brand} ${p.title}` : undefined, photoColor: p?.photoColor?.main });
}
const out = [...merged.values()];
await writeFile(`${DATA}/palette-labels.json`, JSON.stringify(out, null, 1) + '\n');

const summary = incoming.length
  ? `✅ Saved ${incoming.length} votes (${out.length} labels in total).\n\n${evaluate(out, data.products, overrides)}`
  : '❌ No votes found in this issue. Lines should look like `+ kayo:16844 palette=soft-autumn`.';
console.log(summary);
if (process.env.SUMMARY_FILE) await writeFile(process.env.SUMMARY_FILE, summary);
