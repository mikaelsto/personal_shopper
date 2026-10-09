# Runnista

One place to browse running and fashion apparel from several stores. It has a shared category taxonomy, filters, side-by-side compare, price history, "find it elsewhere" links and per-store cart links.

**Site:** https://runnista.com (hosted on Vercel)

The start page is the **feed**: mobile-first and Reels-style. You see one product per screen and swipe up for the next. Drag the photo left for its details. ☰ in the photo's footer opens saved products, colours, categories and sizes. The product page opens in a new tab, from the photo or from "To the product page". On a phone you can add it to the home screen, and it opens full screen like an app. The icon is `web/icon.svg`; after changing it, regenerate the PNGs (`icon-180.png` for iPhone, `icon-192.png` and `icon-512.png` for Android) with `swift scripts/render-icon.swift web/icon.svg web 180 192 512` on a Mac.

The classic **grid** (filters, search, compare, add a store) is at [`grid.html`](https://runnista.com/grid.html). Old `/social/` links redirect to the start page and keep their filters.

## Stores

Stores are listed in `data/stores.json`. Defaults: **Satisfy**, **UVU**, **KA-YO**, **Löplabbet**, **Passa Sports** (running shoes, clothes and socks only), **Incylence** (running collection), **SAYSKY**, **SOAR**, **ACT Running**, **Bandit**, **District Vision**, **DOXA**, **SUMS**, **YMR Track Club**.

They're all checked by default. Uncheck a store (Stores in the shop, or Categories in the feed) to hide its products. The choice is remembered in your browser, is shared by the shop and the feed, and isn't cleared by Reset. **All** / **None** check or uncheck every store.

Prices are shown in SEK. Stores that sell to Sweden in another currency (Incylence, SAYSKY, DOXA and SUMS in EUR, District Vision in USD) are converted with the day's ECB rate, cached in `data/fx-rates.json`. These prices show as "≈ 268 kr", and the store's own price appears in the product details. Their price history records a change only when the store's own price changes, not when the exchange rate moves.

### Adding a store

Click **+** next to the store chips on the site and enter the store's URL.

1. **Shopify stores** load right away in your browser, in the background.
2. To keep the store, submit the GitHub issue that opens (`Add store: <url>`). The **Add store** workflow then:
   - detects how to read the store,
   - adds it to `stores.json`,
   - fetches its products,
   - redeploys the site,
   - replies on the issue.

   Only issues opened by the repo owner are processed.

How a store is read, tried in this order:

| Platform | How | Example |
|---|---|---|
| `shopify` | Public `products.json` feed for the Swedish market. A locale in the URL sets the language (`/en-se`), and `collection` narrows the catalogue (default `all`) | Satisfy, UVU, Incylence (`running`) |
| `geins` | The storefront's own product API, using the public key in the page | KA-YO |
| `intersport` | Intersport-group storefront: listing pages embed the full search result (in-stock items only, no per-size stock) | Löplabbet |
| `jsonld` | Sitemap, then the structured product data on each page (max 1000 pages per run) | On |
| `import` | Nothing automatic works: collect the products with Claude in Chrome into `data/imports/<id>.json` | Passa Sports |

### Refreshing Passa Sports (Claude in Chrome)

Passa Sports is behind Cloudflare, so the daily job can't fetch it; it re-uses the last collected file.
To refresh it, ask Claude to re-run the Passa collector. What happens:

1. `node scripts/import-server.mjs` starts a receiver on localhost:8787.
2. `scripts/collectors/passasports.js` runs in a passasports.se tab in Chrome. It reads Löparskor, Löparkläder and Löparstrumpor (about 190 pages) and posts the result to the receiver.
3. The receiver writes `data/imports/passasports.json`.
4. Commit that file, and the next update includes it.

The first time, Chrome asks whether passasports.se may access apps on this device; allow it.

## Taxonomy

Every store category is mapped onto one master tree (department › subcategory). The tree and the per-store mapping are listed in [TAXONOMY.md](TAXONOMY.md).

- The rules live in `scripts/lib/taxonomy.mjs` and cover English and Swedish keywords.
- Gender, function and material are separate filters, not categories.
- "Gear & lifestyle" items (furniture, knives, cookware…) are hidden unless you select that category.
- Products the rules can only guess at are classified by **Claude**. Results are cached in `data/ai-categories.json`, so each product is sent only once.

  To enable this, add the repository secret `ANTHROPIC_API_KEY` (Settings → Secrets and variables → Actions). Without it, the rules' best guess is kept.

## How it works

- `scripts/update.mjs` fetches every store and writes the database in `data/`:
  - `products.json`: the current catalog
  - `price-history.json`: one entry per price change
  - `meta.json`: the last run, plus per-store status and store categories that are still unmapped

  If a store fails, its previous data is kept.
- `.github/workflows/update.yml` runs this **daily** and commits the data. Vercel rebuilds the site on every push to `main`, so the new data goes live a few minutes later.
  - **Manual update:** Actions → "Update products & deploy site" → Run workflow. You can optionally limit it to some stores, e.g. `kayo`.
- `web/` is the static site: plain HTML, CSS and JavaScript modules.
- `site/` is the **Rust build** that turns `web/` and `data/` into the deployed site (`_site/`) in about 2 seconds:
  - **Compact feed.** `feed.json` is about 3.3 MB (615 KB gzipped), down from 9.5 MB (876 KB gzipped) as plain JSON. Each product is one row. Brands, categories, sizes, colours and dates are shared through one word table. Links and photos are stored without the prefix they share within a store. `scripts/lib/feed.mjs` decodes it in the browser.
  - **Details on demand.** Each product's description, photos, price history and cart variant ids sit in their own small file (`feed/<store>/<id>.json`). It's fetched when the product is on screen or opened. Search words (`feed-search.json`) load the first time you search.
  - **Pre-rendered start page.** The first three products of the day's feed are written into `index.html`, so a phone shows a product before any script or data has loaded. When the feed arrives, the page takes them over and keeps their photos. If you have your own filters, they're hidden and you see the spinner instead.
  - **Fewer round trips.** The feed's CSS is inline. Every script the page imports, nested ones included, is preloaded. `feed.json` and the photo hosts are fetched early. Phones load photos at the width their screen needs (`srcset`).
  - **Cache-busting.** Every local CSS/JS reference gets `?v=<commit>`.
- `scripts/lib/` holds the taxonomy and Shopify mapping, shared by the update job and the site.
- `scripts/lib/` holds the taxonomy and Shopify mapping, shared by the update job and the site.

## Run locally

```bash
npm install
npm run update     # fetch products
npm run dev        # http://localhost:8080, live from web/ (the feed data comes from the Rust build)
npm run build      # the deployed site in _site/ (Rust)
npm run test:site  # the Rust build's tests
npm run taxonomy   # regenerate TAXONOMY.md
```

Requires Node 22+ and Rust (install with [rustup](https://rustup.rs)). `npm run dev` serves `web/` as is, so the start page shows a spinner instead of pre-rendered products. To see exactly what's deployed, run `npm run build` and serve `_site/`, e.g. `python3 -m http.server 8090 --directory _site`.
