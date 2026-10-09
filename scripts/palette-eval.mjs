// Scores the palette matching against your 👍/👎 labels (data/palette-labels.json).
// Usage: node scripts/palette-eval.mjs   (prints a markdown report)
//
// Labels are votes on products the site *showed* for a palette, so the main number is
// precision: of the products a setup would show, how many did you say fit? "Kept 👍" is how
// many of your 👍 products a setup still shows (stricter setups lose some).

import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { attachSwatches, targetColors, matchInfo } from './lib/palette-match.mjs';
import { paletteById } from './lib/palettes.mjs';

const DATA = fileURLToPath(new URL('../data', import.meta.url));
const readJson = async (f, d) => { try { return JSON.parse(await readFile(`${DATA}/${f}`, 'utf8')); } catch { return d; } };

export function parseSelection(sel) {
  const q = new URLSearchParams(sel);
  return {
    palettes: (q.get('palette') ?? '').split(',').filter((id) => paletteById[id]),
    colors: (q.get('color') ?? '').split(',').filter((h) => /^[0-9a-f]{6}$/i.test(h)).map((h) => `#${h.toLowerCase()}`),
    neutrals: q.get('neutrals') !== '0',
    match: q.get('match') === 'broad' ? 'broad' : 'close',
  };
}

const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '–');

export function evaluate(labels, products, overrides = {}) {
  const byId = new Map(products.map((p) => [p.id, p]));
  const withPhoto = attachSwatches(products.map((p) => ({ ...p })), overrides);
  const namesOnly = attachSwatches(products.map(({ photoColor, ...p }) => p), overrides);
  const photoById = new Map(withPhoto.map((p) => [p.id, p]));
  const namesById = new Map(namesOnly.map((p) => [p.id, p]));

  const rows = labels.filter((l) => byId.has(l.id)).map((l) => ({ ...l, sel: parseSelection(l.sel) }));
  if (!rows.length) return '_No labels yet: rate products with 👍/👎 on the site, then send them._';
  const up = rows.filter((l) => l.vote > 0).length;

  const setups = [
    ['Colour names only, close', namesById, 'close', false],
    ['Photo colour, close (current)', photoById, 'close', false],
    ['Photo colour, broad', photoById, 'broad', false],
    ['Photo colour, close, signature colours only', photoById, 'close', true],
  ];
  const table = setups.map(([name, source, match, signatureOnly]) => {
    let shown = 0, good = 0;
    for (const l of rows) {
      const m = matchInfo(source.get(l.id), targetColors({ ...l.sel, match }), match);
      if (!m || (signatureOnly && m.kind !== 'signature')) continue;
      shown++;
      if (l.vote > 0) good++;
    }
    return `| ${name} | ${pct(good, shown)} (${good}/${shown}) | ${pct(good, up)} |`;
  });

  // Current setup split by match kind and colour source.
  const split = {};
  const misses = [];
  for (const l of rows) {
    const m = matchInfo(photoById.get(l.id), targetColors(l.sel), l.sel.match);
    if (!m) continue;
    const k = `${m.kind} · ${m.swatch.source === 'photo' ? 'photo' : 'name'}`;
    (split[k] ??= { n: 0, good: 0 }).n++;
    if (l.vote > 0) split[k].good++;
    else misses.push({ l, m });
  }
  misses.sort((a, b) => a.m.dE - b.m.dE);

  const p = (id) => byId.get(id);
  return [
    `**${rows.length} labels** (${up} 👍, ${rows.length - up} 👎) on ${new Set(rows.map((l) => l.id)).size} products.`,
    '',
    '| Setup | Precision (👍 of shown) | Kept 👍 |',
    '|---|---|---|',
    ...table,
    '',
    '| Current setup, by match | Precision |',
    '|---|---|',
    ...Object.entries(split).sort().map(([k, v]) => `| ${k} | ${pct(v.good, v.n)} (${v.good}/${v.n}) |`),
    '',
    misses.length ? '**Closest wrong matches** (👎 but matched; fix these first):' : '',
    ...misses.slice(0, 10).map(({ l, m }) =>
      `- ${p(l.id).brand} ${p(l.id).title}: ${m.swatch.name} \`${m.swatch.hex}\` (${m.swatch.source}) ≈ ${m.target.name} \`${m.target.hex}\`, ΔE ${m.dE.toFixed(1)}, ${[...l.sel.palettes, ...l.sel.colors].join(', ')}`),
  ].join('\n');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [labels, data, overrides] = await Promise.all([
    readJson('palette-labels.json', []), readJson('products.json', { products: [] }), readJson('color-names.json', {}),
  ]);
  console.log(evaluate(labels, data.products, overrides));
}
