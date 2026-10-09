// Generic adapter for stores without a product feed: reads the sitemap, then the
// schema.org JSON-LD (Product / ProductGroup) embedded in each product page.
// Slower than a feed, so it is capped at `store.max` product pages per run.

import { BROWSER_UA, getText, mapLimit } from '../lib/http.mjs';
import { normalizeProduct } from '../lib/normalize.mjs';

const DEFAULT_PATTERN = '/(p|product|products|produkt|produkter)/';

export async function fetchJsonLd(store) {
  const pattern = new RegExp(store.productPattern ?? DEFAULT_PATTERN, 'i');
  const urls = (await sitemapUrls(store.sitemaps, store.base))
    .filter((u) => pattern.test(new URL(u).pathname))
    .slice(0, store.max ?? 1000);
  if (!urls.length) throw new Error('No product URLs found in sitemap');

  const pages = await mapLimit(urls, 3, 300, async (url) => parseProductPage(store, url, await getText(url, { ua: BROWSER_UA })));
  // Colour variants often have their own URL but the same product group: keep one per group.
  const products = [...new Map(pages.filter((p) => p && !p.error).map((p) => [p.id, p])).values()];
  const failed = pages.filter((p) => p?.error).length;
  if (!products.length) throw new Error(`No JSON-LD products found (${failed} pages failed)`);
  if (failed) console.warn(`  ${store.name}: ${failed}/${urls.length} pages failed`);
  return products;
}

// Reads sitemap(s), following sitemap indexes. Only keeps URLs under `base`.
export async function sitemapUrls(sitemaps, base, depth = 0) {
  const out = [];
  for (const sm of sitemaps) {
    let xml;
    try {
      xml = await getText(sm, { ua: BROWSER_UA });
    } catch {
      continue;
    }
    const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
    if (/<sitemapindex/i.test(xml) && depth < 2) {
      // Prefer product sitemaps when the index separates them.
      const productMaps = locs.filter((l) => /product/i.test(l));
      out.push(...(await sitemapUrls(productMaps.length ? productMaps : locs, base, depth + 1)));
    } else {
      out.push(...locs.filter((l) => l.startsWith(base)));
    }
  }
  return [...new Set(out)];
}

export function jsonLdNodes(html) {
  const nodes = [];
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1].trim());
      const stack = Array.isArray(data) ? [...data] : [data];
      while (stack.length) {
        const n = stack.shift();
        if (!n || typeof n !== 'object') continue;
        if (Array.isArray(n['@graph'])) stack.push(...n['@graph']);
        nodes.push(n);
      }
    } catch {
      // ignore malformed blocks
    }
  }
  return nodes;
}

const isType = (n, t) => [].concat(n['@type'] ?? []).includes(t);
const asArray = (x) => (x == null ? [] : [].concat(x));
const imageUrls = (img) => asArray(img).map((i) => (typeof i === 'string' ? i : i?.url ?? i?.contentUrl)).filter(Boolean);

export function parseProductPage(store, url, html) {
  const nodes = jsonLdNodes(html);
  const group = nodes.find((n) => isType(n, 'ProductGroup'));
  const items = group ? asArray(group.hasVariant) : nodes.filter((n) => isType(n, 'Product'));
  if (!items.length) return null;
  const head = group ?? items[0];

  const variants = items.map((it, i) => {
    const offer = asArray(it.offers).flatMap((o) => (isType(o, 'AggregateOffer') ? asArray(o.offers).concat(o) : o))[0] ?? {};
    const price = Number(offer.price ?? offer.lowPrice);
    return {
      id: String(it.sku ?? it.gtin ?? i),
      size: it.size?.name ?? it.size ?? null,
      color: it.color ?? null,
      available: /InStock|LimitedAvailability|PreOrder/i.test(String(offer.availability ?? '')),
      price: Number.isFinite(price) ? price : null,
      compareAt: null,
      sku: it.sku ? String(it.sku) : null,
    };
  });

  return normalizeProduct({
    store,
    sourceId: String(head.productGroupID ?? head.inProductGroupWithID ?? url),
    title: head.name,
    brand: head.brand?.name ?? (typeof head.brand === 'string' ? head.brand : store.name),
    url: group?.url ?? url,
    productType: head.category ?? '',
    sourceTags: [],
    descriptionHtml: head.description ?? '',
    images: [...new Set(items.flatMap((it) => imageUrls(it.image)).concat(imageUrls(head.image)))],
    variants,
    currency: asArray(items[0].offers)[0]?.priceCurrency ?? 'SEK',
    cart: null,
  });
}
