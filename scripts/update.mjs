// Fetches all stores and writes the product database:
//   data/products.json       current catalog (what the site reads)
//   data/price-history.json  { productId: [[date, price], ...] } — appended on change
//   data/meta.json           last run time, counts and errors per store
//
// Usage: node scripts/update.mjs [storeId,storeId]   (or env STORES=...)
// A store that fails keeps its previous products, so one broken site never wipes data.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { STORES } from './stores.mjs';
import { fetchShopify } from './adapters/shopify.mjs';
import { fetchImport } from './adapters/importfile.mjs';

const DATA = fileURLToPath(new URL('../data', import.meta.url));
const today = new Date().toISOString().slice(0, 10);

const readJson = async (file, fallback) => {
  try {
    return JSON.parse(await readFile(`${DATA}/${file}`, 'utf8'));
  } catch {
    return fallback;
  }
};

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
    const products =
      store.platform === 'shopify' ? await fetchShopify(store)
      : store.platform === 'import' ? await fetchImport(store, DATA)
      : null;
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

// Merge: refreshed stores replace their products; others are kept as-is.
const merged = previous.products.filter((p) => !fresh.has(p.store));
for (const products of fresh.values()) {
  for (const p of products) {
    const old = prevById.get(p.id);
    p.firstSeen = old?.firstSeen ?? today;
    p.lastSeen = today;
    if (p.price != null) {
      const h = (history[p.id] ??= []);
      if (!h.length || h.at(-1)[1] !== p.price) h.push([today, p.price]);
    }
    merged.push(p);
  }
}
merged.sort((a, b) => a.store.localeCompare(b.store) || a.title.localeCompare(b.title));

meta.lastRun = new Date().toISOString();
meta.total = merged.length;

await mkdir(DATA, { recursive: true });
await writeFile(`${DATA}/products.json`, JSON.stringify({ generatedAt: meta.lastRun, products: merged }));
await writeFile(`${DATA}/price-history.json`, JSON.stringify(history));
await writeFile(`${DATA}/meta.json`, JSON.stringify(meta, null, 2) + '\n');
console.log(`Wrote ${merged.length} products.`);

if ([...stores].every((s) => meta.stores[s.id]?.ok === false)) process.exit(1);
