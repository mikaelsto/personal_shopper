// Intersport-group storefront (e.g. Löplabbet): category listing pages embed the full
// search result as `window.searchResult`, and `?hits=500&offset=N` pages through it.
// Listings only contain products in stock; per-size stock is not exposed, so every listed
// size is treated as available.

import { BROWSER_UA, getText, sleep } from '../lib/http.mjs';
import { normalizeProduct } from '../lib/normalize.mjs';

const HITS = 500;
const IMAGE_BASE = 'https://cdn.intersport.se/productimages/1080/';

// "Kläder/T-shirt & Toppar" -> "klader/t-shirt-toppar" (matches the site's URL slugs)
const slug = (s) =>
  s.toLowerCase().replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/é/g, 'e')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Extracts the `window.searchResult = {...}` object literal (valid JSON) from a page.
export function extractSearchResult(html) {
  const i = html.indexOf('window.searchResult =');
  if (i < 0) return null;
  const start = html.indexOf('{', i);
  let depth = 0;
  let inStr = false;
  let escaped = false;
  for (let e = start; e < html.length; e++) {
    const c = html[e];
    if (inStr) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return JSON.parse(html.slice(start, e + 1));
  }
  return null;
}

export async function fetchIntersport(store) {
  const docs = new Map();
  for (const listing of store.listings) {
    for (let offset = 0; ; offset += HITS) {
      const html = await getText(`${store.origin}${listing}?hits=${HITS}&offset=${offset}`, { ua: BROWSER_UA, timeout: 90000 });
      const result = extractSearchResult(html);
      if (!result) throw new Error(`${listing}: no search result in page`);
      const page = result.products?.documents ?? [];
      for (const d of page) docs.set(d.itemnumber, d);
      await sleep(1500);
      if (page.length < HITS || offset + HITS >= result.stats.totalHits) break;
    }
  }
  return [...docs.values()].filter((d) => d.categories?.length).map((d) => fromDoc(store, d));
}

function fromDoc(store, d) {
  const price = Number(d.price?.price);
  const regular = Number(d.price?.regularprice);
  const material = d.specification?.categories
    ?.flatMap((c) => c.attributes ?? [])
    .find((a) => a.name === 'Material' && a.value)?.value;
  const color = d.colordescription
    ? d.colordescription.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
    : null;
  const category = d.categories[0];
  const audience = (d.targetaudience ?? []).join(' ').toLowerCase();
  const urlSlug = d.article_urlslug?.[0] ?? '';

  return normalizeProduct({
    store,
    sourceId: d.itemnumber,
    title: d.commercialname || d.productname,
    brand: d.brand ?? store.name,
    url: `${store.origin}/${category.split('/').map(slug).join('/')}/${urlSlug}/${d.colordescription_urlslug || slug(d.colordescription ?? '')}`,
    // Most specific path first: "Herr/Kläder/T-Shirt & Toppar/T-Shirt funktion" or "Löparskor/Distans"
    productType: [].concat(d.targetGroupTaxonomy ?? [])[0]?.replace(/^(herr|dam|barn|junior|unisex)\//i, '') || category,
    sourceTags: [...(d.categories ?? []), ...(d.sports ?? [])],
    descriptionHtml: [
      d.description ?? d.shortdescription ?? '',
      ...(d.usp ?? []).map((u) => `<li>${u}</li>`),
      material ? `<p>Material: ${material}</p>` : '',
    ].join('\n'),
    images: (d.itemimages ?? []).map((f) => IMAGE_BASE + f),
    variants: (d.productsizerange?.length ? d.productsizerange : [null]).map((size) => ({
      id: `${d.itemnumber}-${size ?? 'one'}`,
      size,
      color,
      available: true,
      price,
      compareAt: regular > price ? regular : null,
      sku: d.itemnumber,
    })),
    currency: 'SEK',
    cart: null,
    gender: /herr/.test(audience) && !/dam/.test(audience) ? 'men'
      : /dam/.test(audience) && !/herr/.test(audience) ? 'women'
      : /-herr$/.test(urlSlug) ? 'men' : /-dam$/.test(urlSlug) ? 'women' : undefined,
  });
}
