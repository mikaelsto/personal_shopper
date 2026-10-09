// Fetches all stores and writes the product database:
//   data/products.json       current catalog (what the site reads)
//   data/price-history.json  { productId: [[date, price], ...] } — appended on change
//   data/meta.json           last run time, counts and errors per store
//
// Usage: node scripts/update.mjs [storeId,storeId]   (or env STORES=...)
// A store that fails keeps its previous products, so one broken site never wipes data.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { fetchStore } from './adapters/index.mjs';
import { upgradeProduct } from './lib/normalize.mjs';
import { aiClassify, applyAiCategories } from './lib/ai-classify.mjs';
import { aiResolveColors } from './lib/ai-colors.mjs';
import { aiImageColors, applyImageColors } from './lib/ai-image-colors.mjs';
import { sekRates, toSek } from './lib/fx.mjs';

const DATA = fileURLToPath(new URL('../data', import.meta.url));
const today = new Date().toISOString().slice(0, 10);

const readJson = async (file, fallback) => {
  try {
    return JSON.parse(await readFile(`${DATA}/${file}`, 'utf8'));
  } catch {
    return fallback;
  }
};

const STORES = await readJson('stores.json', []);
const selected = (process.argv[2] || process.env.STORES || '')
  .split(',').map((s) => s.trim()).filter(Boolean);
const stores = selected.length ? STORES.filter((s) => selected.includes(s.id)) : STORES;

const previous = await readJson('products.json', { products: [] });
const history = await readJson('price-history.json', {});
const meta = await readJson('meta.json', { stores: {} });
const prevById = new Map(previous.products.map((p) => [p.id, p]));

const fresh = new Map(); // storeId -> products[]
for (const store of stores) {
  const started = Date.now();
  try {
    const products = await fetchStore(store, DATA);
    if (products === null) {
      console.log(`- ${store.name}: no data source yet, skipped`);
      continue;
    }
    fresh.set(store.id, products);
    meta.stores[store.id] = { ok: true, count: products.length, updatedAt: new Date().toISOString() };
    console.log(`✓ ${store.name}: ${products.length} products (${((Date.now() - started) / 1000).toFixed(1)}s)`);
  } catch (err) {
    meta.stores[store.id] = { ...meta.stores[store.id], ok: false, error: String(err.message ?? err), failedAt: new Date().toISOString() };
    console.error(`✗ ${store.name}: ${err.message ?? err} — keeping previous data`);
  }
}

// Prices in other currencies (stores selling to Sweden in EUR, USD…) are converted to SEK.
const foreign = [...fresh.values()].flat().filter((p) => p.currency && p.currency !== 'SEK');
if (foreign.length) {
  const fx = await sekRates(await readJson('fx-rates.json', null));
  if (fx) await writeFile(`${DATA}/fx-rates.json`, JSON.stringify(fx, null, 1) + '\n');
  const missed = foreign.filter((p) => !toSek(p, fx));
  console.log(`  Converted ${foreign.length - missed.length} prices to SEK (rates of ${fx?.date ?? '–'})`);
  if (missed.length) console.error(`  No exchange rate for ${[...new Set(missed.map((p) => p.currency))].join(', ')}: prices shown as is`);
}

// Merge: refreshed stores replace their products; others are kept as-is.
// Products from stores no longer in stores.json are dropped.
const registered = new Set(STORES.map((s) => s.id));
const merged = previous.products.filter((p) => !fresh.has(p.store) && registered.has(p.store)).map(upgradeProduct);
for (const products of fresh.values()) {
  for (const p of products) {
    const old = prevById.get(p.id);
    p.firstSeen = old?.firstSeen ?? today;
    p.lastSeen = today;
    if (p.price != null) {
      // Converted prices move with the exchange rate every day, so only the store's own price
      // counts as a change; it's kept as a third value: [date, SEK, own price].
      const h = (history[p.id] ??= []);
      const own = p.local?.price ?? p.price;
      const last = h.at(-1);
      if (!last || (last[2] ?? last[1]) !== own) h.push(p.local ? [today, p.price, own] : [today, p.price]);
    }
    merged.push(p);
  }
}
merged.sort((a, b) => a.store.localeCompare(b.store) || a.title.localeCompare(b.title));

// Taxonomy: products the rules could only guess at are classified by Claude (cached).
const aiCache = await readJson('ai-categories.json', {});
await aiClassify(merged, aiCache);
applyAiCategories(merged, aiCache);

// Palette filter: colour names the dictionary can't read are resolved by Claude (cached).
const colorNames = await readJson('color-names.json', {});
await aiResolveColors(merged, colorNames);
// …and the real colour is read from each product photo (cached by image URL).
const imageColors = await readJson('image-colors.json', {});
await aiImageColors(merged, imageColors);
applyImageColors(merged, imageColors);

// Store categories that still end up as "other" — candidates for new taxonomy rules.
meta.unmapped = Object.fromEntries(
  Object.entries(
    merged.filter((p) => p.subcategory === 'other').reduce((acc, p) => {
      const k = `${p.store}: ${p.productType || '(none)'}`;
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]),
);

for (const id of Object.keys(meta.stores)) if (!registered.has(id)) delete meta.stores[id];
meta.lastRun = new Date().toISOString();
meta.total = merged.length;

await mkdir(DATA, { recursive: true });
await writeFile(`${DATA}/products.json`, JSON.stringify({ generatedAt: meta.lastRun, products: merged }));
await writeFile(`${DATA}/price-history.json`, JSON.stringify(history));
await writeFile(`${DATA}/ai-categories.json`, JSON.stringify(aiCache, null, 1) + '\n');
await writeFile(`${DATA}/image-colors.json`, JSON.stringify(imageColors) + '\n');
await writeFile(`${DATA}/color-names.json`, JSON.stringify(colorNames, null, 1) + '\n');
await writeFile(`${DATA}/meta.json`, JSON.stringify(meta, null, 2) + '\n');
console.log(`Wrote ${merged.length} products.`);

if (stores.length && stores.every((s) => meta.stores[s.id]?.ok === false)) process.exit(1);
