// Passa Sports collector — run in a passasports.se tab (Claude in Chrome), with
// `node scripts/import-server.mjs` running locally. The site is behind Cloudflare, so the
// GitHub job can't fetch it; this reads the same listing pages the browser shows.
//
// Only the running categories the user chose: Löparskor, Löparkläder, Löparstrumpor.
// Each listing page embeds its products in <catalog-category-view :catalog-data="…">
// (sizes, in-stock sizes, regular + sale price, images); descriptions come from JSON-LD.
(async () => {
  const LISTINGS = [
    ['/running/loparskor', 'Löparskor'],
    ['/running/loparklader', 'Löparkläder'],
    ['/running/loparstrumpor', 'Löparstrumpor'],
  ];
  const CDN = 'https://cdn.sportshop.com/catalog/product/558/558';
  const RECEIVER = 'http://localhost:8787/import/passasports';
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const status = (s) => { window.__collectStatus = s; };

  async function readPage(path, page) {
    const html = await (await fetch(`${path}?page=${page}`, { credentials: 'include' })).text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const data = JSON.parse(doc.querySelector('catalog-category-view').getAttribute(':catalog-data'));
    const desc = {};
    for (const s of doc.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const j = JSON.parse(s.textContent);
        if (j['@type'] === 'Product' && j.url) desc[j.url.split('/').pop()] = j.description;
      } catch { /* not product data */ }
    }
    return { data, desc };
  }

  try {
    const products = new Map();
    for (const [path, label] of LISTINGS) {
      let last = 1;
      for (let page = 1; page <= last; page++) {
        const { data, desc } = await readPage(path, page);
        last = Number(data.last_page) || 1;
        for (const p of data.items) {
          if (products.has(p.sku)) continue;
          const inStock = new Set(p.in_stock_sizes ?? []);
          const sizes = p.size?.length ? p.size : [null];
          products.set(p.sku, {
            sourceId: p.sku,
            title: p.name,
            brand: p.manufacturer,
            url: `https://www.passasports.se/${p.url_key}`,
            productType: [label, p.product_category].filter(Boolean).join('/'),
            description: desc[p.url_key] ?? '',
            images: (p.media_gallery ?? []).filter((m) => m.type === 'image').slice(0, 6).map((m) => CDN + m.raw_url),
            currency: 'SEK',
            variants: sizes.map((size) => ({
              id: `${p.sku}-${size ?? 'one'}`,
              size,
              color: p.color ?? null,
              available: !!p.is_saleable && (size ? inStock.has(size) : !!p.is_in_stock),
              price: p.final_price_incl_tax,
              compareAt: p.price_incl_tax > p.final_price_incl_tax ? p.price_incl_tax : null,
            })),
          });
        }
        status(`${label}: page ${page}/${last} · ${products.size} products`);
        await sleep(700); // be polite
      }
    }
    status(`uploading ${products.size} products…`);
    const body = JSON.stringify({ collectedAt: new Date().toISOString().slice(0, 10), source: 'Claude in Chrome', products: [...products.values()] });
    const r = await fetch(RECEIVER, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    status(`done: ${products.size} products · upload ${r.status} ${await r.text()}`);
  } catch (err) {
    status(`error: ${err.message}`);
  }
})();
