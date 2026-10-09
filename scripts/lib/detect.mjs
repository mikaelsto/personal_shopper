// Works out how to read a store's products from just its URL.
// Tries, in order: Shopify feed → Geins storefront API → sitemap + JSON-LD → manual import.

import { BROWSER_UA, get, getJson, getText } from './http.mjs';
import { sitemapUrls, parseProductPage } from '../adapters/jsonld.mjs';
import { fetchGeins } from '../adapters/geins.mjs';
import { extractSearchResult } from '../adapters/intersport.mjs';

export function storeId(hostname) {
  const label = hostname.replace(/^www\./, '').split('.')[0];
  return label.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

export async function detectStore(rawUrl, name) {
  const url = new URL(rawUrl);
  const origin = url.origin;
  const base = `${origin}${url.pathname.replace(/\/+$/, '')}`;
  const common = { id: storeId(url.hostname), name: name || null, origin };
  const log = [];

  // 1. Shopify
  try {
    const data = await getJson(`${origin}/products.json?limit=1`);
    if (Array.isArray(data.products)) {
      return { ...common, platform: 'shopify', base: origin, country: 'SE', log: [...log, 'Shopify feed found'] };
    }
  } catch (err) {
    log.push(`Not Shopify (${err.message})`);
  }

  // 2. Geins (public storefront key in the page config)
  let html = '';
  try {
    html = await getText(base, { ua: BROWSER_UA });
  } catch (err) {
    log.push(`Could not load the page (${err.message})`);
  }
  const siteName = html.match(/property=["']og:site_name["'][^>]*content=["']([^"']+)/i)?.[1];
  common.name ||= siteName || url.hostname.replace(/^www\./, '').split('.')[0].toUpperCase();

  // Config is a JS object literal in the page (keys may be unquoted, "/" escaped as \u002F).
  const page = html.replace(/\\u002F/g, '/');
  const conf = (key) => page.match(new RegExp(`["']?${key}["']?\\s*:\\s*["']([^"']+)["']`))?.[1];
  const geinsKey = /merchantapi\.geins\.io/.test(page) && conf('apiKey');
  if (geinsKey) {
    const market = url.pathname.split('/')[1] || conf('fallbackMarketAlias') || 'se';
    const lang = url.pathname.split('/')[2];
    const store = {
      ...common,
      platform: 'geins',
      base,
      apiKey: geinsKey,
      channelId: conf('fallbackChannelId') ?? '1|com',
      market,
      language: lang && /^[a-z]{2}$/.test(lang) ? `${lang}-${market.toUpperCase()}` : 'sv-SE',
      imageBase: conf('imageServer') ?? origin,
    };
    try {
      const sample = await fetchGeins(store, { maxProducts: 5 });
      if (sample.length) return { ...store, log: [...log, `Geins API found (${sample.length} products)`] };
    } catch (err) {
      log.push(`Geins API failed (${err.message})`);
    }
  }

  // 2b. Intersport-group storefront (Löplabbet, …): listings embed `window.searchResult`.
  if (/cdn\.intersport\.se|window\.searchResult\s*=|window\.__INITIAL__STATE__\s*=/.test(page)) {
    const path = url.pathname.replace(/\/+$/, '');
    const candidates = path ? [path] : ['/herr', '/dam', '/barn'];
    const listings = [];
    for (const l of candidates) {
      try {
        const result = extractSearchResult(await getText(`${origin}${l}?hits=1`, { ua: BROWSER_UA }));
        if (result?.stats?.totalHits) listings.push(l);
      } catch {
        // listing missing on this store
      }
    }
    if (listings.length) {
      return { ...common, platform: 'intersport', base: origin, listings, log: [...log, `Intersport storefront: listings ${listings.join(', ')}`] };
    }
    log.push('Intersport storefront detected, but no product listings found');
  }

  // 3. Sitemap + JSON-LD on product pages
  try {
    const robots = await getText(`${origin}/robots.txt`, { ua: BROWSER_UA }).catch(() => '');
    const sitemaps = [...robots.matchAll(/^sitemap:\s*(\S+)/gim)].map((m) => m[1]);
    if (!sitemaps.length) sitemaps.push(`${origin}/sitemap.xml`);
    const urls = (await sitemapUrls(sitemaps, base)).filter((u) => /\/(p|product|products|produkt|produkter)\//i.test(new URL(u).pathname));
    log.push(`Sitemap: ${urls.length} product URLs under ${base}`);
    for (const u of urls.slice(0, 3)) {
      const res = await get(u, { ua: BROWSER_UA });
      if (!res.ok) {
        log.push(`Product page blocked (HTTP ${res.status})`);
        continue;
      }
      const product = parseProductPage({ ...common, base }, u, await res.text());
      if (product) {
        return { ...common, platform: 'jsonld', base, sitemaps, max: 1000, log: [...log, 'JSON-LD product data found'] };
      }
    }
  } catch (err) {
    log.push(`Sitemap/JSON-LD failed (${err.message})`);
  }

  // 4. Nothing worked: products must be collected manually (e.g. Claude in Chrome).
  return { ...common, platform: 'import', base, log: [...log, 'No automatic source; needs manual import'] };
}
