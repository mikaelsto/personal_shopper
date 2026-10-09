// Shopify adapter: pages through /collections/all/products.json.
// `country` switches prices to that market's currency (SE -> SEK).

import { USER_AGENT } from '../stores.mjs';
import { normalizeProduct } from '../normalize.mjs';

const PAGE_SIZE = 250;
const MAX_PAGES = 40;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function fetchShopify(store) {
  const raw = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `${store.base}/collections/all/products.json?limit=${PAGE_SIZE}&page=${page}&country=${store.country}`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
    if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
    const { products } = await res.json();
    if (!products?.length) break;
    raw.push(...products);
    await sleep(1000); // be polite
  }
  return raw.filter((p) => !/gift ?card/i.test(`${p.product_type} ${p.title}`)).map((p) => fromShopify(store, p));
}

function fromShopify(store, p) {
  const optionIndex = (re) => p.options?.findIndex((o) => re.test(o.name)) ?? -1;
  const colorIdx = optionIndex(/colou?r|färg/i);
  // Size option is sometimes unnamed ("Title"), so fall back to the first non-colour option.
  let sizeIdx = optionIndex(/size|storlek/i);
  if (sizeIdx < 0) {
    sizeIdx = p.options?.findIndex((o, i) => i !== colorIdx && !(o.values.length === 1 && o.values[0] === 'Default Title')) ?? -1;
  }
  const opt = (v, i) => (i >= 0 ? v[`option${i + 1}`] : null);
  // Stores with one product per colour (e.g. UVU) put the colour in the handle: "uvu-t-shirt-navy".
  const handleColor = colorIdx < 0 ? colorFromHandle(p.title, p.handle) : null;

  const variants = p.variants.map((v) => ({
    id: String(v.id),
    size: opt(v, sizeIdx),
    color: opt(v, colorIdx) ?? handleColor,
    available: v.available,
    price: Number(v.price),
    compareAt: v.compare_at_price ? Number(v.compare_at_price) : null,
    sku: v.sku || null,
  }));

  return normalizeProduct({
    store,
    sourceId: String(p.id),
    title: p.title,
    brand: p.vendor,
    url: `${store.base}/products/${p.handle}`,
    productType: p.product_type,
    sourceTags: p.tags ?? [],
    descriptionHtml: p.body_html ?? '',
    images: (p.images ?? []).map((i) => i.src),
    variants,
    currency: 'SEK',
    cart: 'shopify',
  });
}

function colorFromHandle(title, handle) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!handle.startsWith(`${slug}-`)) return null;
  const rest = handle.slice(slug.length + 1).replace(/-\d+$/, '');
  return rest ? rest.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : null;
}
