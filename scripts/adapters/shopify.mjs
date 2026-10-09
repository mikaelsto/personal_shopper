// Shopify adapter: pages through /collections/all/products.json.
// `country` switches prices to that market's currency (SE -> SEK).

import { getJson, sleep } from '../lib/http.mjs';
import { fromShopify, isGiftCard, shopifyPageUrl } from '../lib/shopify-map.mjs';

const MAX_PAGES = 40;

export async function fetchShopify(store) {
  const raw = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { products } = await getJson(shopifyPageUrl(store, page));
    if (!products?.length) break;
    raw.push(...products);
    await sleep(1000); // be polite
  }
  return raw.filter((p) => !isGiftCard(p)).map((p) => fromShopify(store, p));
}
