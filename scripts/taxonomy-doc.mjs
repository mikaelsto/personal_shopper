// Writes TAXONOMY.md: the master taxonomy plus how each store's own categories map onto it.
// Run after an update: npm run taxonomy

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { TAXONOMY, label } from './lib/taxonomy.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const { products } = JSON.parse(await readFile(`${root}data/products.json`, 'utf8'));

const lines = [
  '# Master taxonomy',
  '',
  'Every store category is mapped onto this tree (department › subcategory).',
  'Gender, warmth (merino/wool, warm, wind, water-resistant) and material are separate filters, not categories.',
  'Rules live in `scripts/lib/taxonomy.mjs`; products the rules can only guess are classified by Claude (`data/ai-categories.json`).',
  '',
];
for (const d of TAXONOMY) {
  lines.push(`## ${d.label}${d.hidden ? ' _(hidden by default)_' : ''}`, '');
  const counts = (id) => products.filter((p) => p.subcategory === id).length;
  for (const s of d.subs) lines.push(`- **${s.label}** \`${s.id}\` · ${counts(s.id)} products`);
  lines.push('');
}

lines.push('## Store category mapping', '', '| Store | Store category | Mapped to |', '|---|---|---|');
const map = new Map();
for (const p of products) {
  const k = `${p.storeName}\t${p.productType || '(none)'}`;
  const m = map.get(k) ?? {};
  m[p.subcategory] = (m[p.subcategory] ?? 0) + 1;
  map.set(k, m);
}
for (const [k, m] of [...map].sort()) {
  const [store, cat] = k.split('\t');
  const targets = Object.entries(m).sort((a, b) => b[1] - a[1]).map(([id, n]) => `${label(id.split('/')[0])} › ${label(id)} (${n})`);
  lines.push(`| ${store} | ${cat} | ${targets.join(', ')} |`);
}

await writeFile(`${root}TAXONOMY.md`, lines.join('\n') + '\n');
console.log('Wrote TAXONOMY.md');
