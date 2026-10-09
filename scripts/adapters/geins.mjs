// Geins adapter (e.g. KA-YO): the storefront's own GraphQL API, using the public
// API key the site ships to every visitor. Detected and configured by add-store.mjs.

import { USER_AGENT, sleep } from '../lib/http.mjs';
import { normalizeProduct } from '../lib/normalize.mjs';

const ENDPOINT = 'https://merchantapi.geins.io/graphql';
const PAGE_SIZE = 200; // API maximum

const QUERY = `query Products($skip: Int, $take: Int, $channelId: String, $languageId: String, $marketId: String) {
  # A fixed sort keeps pagination stable (the default order shifts between requests).
  products(skip: $skip, take: $take, filter: { sort: ALPHABETICAL }, channelId: $channelId, languageId: $languageId, marketId: $marketId) {
    count
    products {
      productId name canonicalUrl
      brand { name }
      primaryCategory { name }
      unitPrice { sellingPriceIncVat regularPriceIncVat isDiscounted }
      productImages { fileName }
      skus { skuId name stock { totalStock } }
      texts { text1 text2 }
    }
  }
}`;

async function query(store, variables) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-ApiKey': store.apiKey,
      'User-Agent': USER_AGENT,
      Origin: store.origin,
      Referer: `${store.origin}/`,
    },
    body: JSON.stringify({ query: QUERY, variables }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`Geins API -> HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(`Geins API: ${json.errors[0].message}`);
  return json.data.products;
}

export async function fetchGeins(store, { maxProducts = Infinity } = {}) {
  const take = Math.min(PAGE_SIZE, maxProducts);
  const vars = { channelId: store.channelId, languageId: store.language, marketId: store.market, take };
  const out = [];
  let total = Infinity;
  for (let skip = 0; skip < Math.min(total, maxProducts); skip += take) {
    const page = await query(store, { ...vars, skip });
    total = page.count;
    out.push(...page.products);
    if (!page.products.length) break;
    await sleep(500);
  }
  const unique = [...new Map(out.map((p) => [p.productId, p])).values()];
  return unique.map((p) => fromGeins(store, p));
}

function fromGeins(store, p) {
  const price = p.unitPrice.sellingPriceIncVat;
  const compareAt = p.unitPrice.isDiscounted ? p.unitPrice.regularPriceIncVat : null;
  const color = p.texts?.text2 || null;
  const path = p.canonicalUrl ?? '';
  return normalizeProduct({
    store,
    sourceId: String(p.productId),
    title: p.name,
    brand: p.brand?.name ?? store.name,
    url: `${store.origin}${path}`,
    productType: p.primaryCategory?.name ?? '',
    sourceTags: [],
    descriptionHtml: p.texts?.text1 ?? '',
    images: (p.productImages ?? []).map((i) => `${store.imageBase}/product/1000f1239/${i.fileName}`),
    variants: (p.skus ?? []).map((s) => ({
      id: String(s.skuId),
      size: s.name || null,
      color,
      available: (s.stock?.totalStock ?? 0) > 0,
      price,
      compareAt,
      sku: String(s.skuId),
    })),
    currency: 'SEK',
    cart: null,
    gender: /\/(dam|women|damer)\//i.test(path) ? 'women' : /\/(herr|men|herrar)\//i.test(path) ? 'men' : undefined,
  });
}
