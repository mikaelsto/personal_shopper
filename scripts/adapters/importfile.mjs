// Import adapter: reads products collected outside the GitHub job
// (e.g. by Claude in Chrome) from data/imports/<store-id>.json.
//
// File format: { "collectedAt": "2026-10-09", "products": [ <product> ] }
// where <product> has: sourceId, title, brand, url, productType?, tags?,
// description (text or HTML), images[], currency ("SEK"),
// variants[]: { id?, size, color?, available, price, compareAt? }

import { readFile } from 'node:fs/promises';
import { normalizeProduct } from '../normalize.mjs';

export async function fetchImport(store, dataDir) {
  let file;
  try {
    file = JSON.parse(await readFile(`${dataDir}/imports/${store.id}.json`, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return null; // nothing collected yet
    throw err;
  }
  return file.products.map((p) =>
    normalizeProduct({
      store,
      sourceId: String(p.sourceId ?? p.url),
      title: p.title,
      brand: p.brand ?? store.name,
      url: p.url,
      productType: p.productType ?? '',
      sourceTags: p.tags ?? [],
      descriptionHtml: p.description ?? '',
      images: p.images ?? [],
      variants: (p.variants ?? []).map((v, i) => ({
        id: v.id ? String(v.id) : String(i),
        size: v.size ?? null,
        color: v.color ?? null,
        available: v.available !== false,
        price: Number(v.price),
        compareAt: v.compareAt ? Number(v.compareAt) : null,
        sku: v.sku ?? null,
      })),
      currency: p.currency ?? 'SEK',
      cart: null,
      collectedAt: file.collectedAt,
    }),
  );
}
