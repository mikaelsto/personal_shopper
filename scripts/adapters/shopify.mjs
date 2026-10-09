// Shopify adapter: pages through /collections/<collection, default all>/products.json.
// `country` switches prices to that market's currency (SE -> SEK for most stores). Stores that
// sell to Sweden in another currency (EUR, USD…) are converted to SEK by update.mjs.

import { BROWSER_UA, getJson, getText, sleep } from '../lib/http.mjs';
import { fromShopify, isGiftCard, shopifyPageUrl } from '../lib/shopify-map.mjs';

const MAX_PAGES = 40;

export async function fetchShopify(store) {
  const currency = await marketCurrency(store);
  const raw = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { products } = await getJson(shopifyPageUrl(store, page));
    if (!products?.length) break;
    raw.push(...products);
    await sleep(1000); // be polite
  }
  return raw.filter((p) => !isGiftCard(p)).map((p) => fromShopify({ ...store, currency }, p));
}

// products.json has no currency; the storefront page says which one the market uses.
async function marketCurrency(store) {
  try {
    const html = await getText(`${store.base}/?country=${store.country ?? 'SE'}`, { ua: BROWSER_UA });
    return html.match(/Shopify\.currency\s*=\s*\{\s*"active"\s*:\s*"([A-Z]{3})"/)?.[1] ?? store.currency ?? 'SEK';
  } catch {
    return store.currency ?? 'SEK';
  }
}
