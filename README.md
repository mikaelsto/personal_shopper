# Personal Shopper

One place to browse running and fashion apparel from several stores. It has filters, side-by-side compare, price history, "find it elsewhere" links and per-store cart links.

**Site:** https://mikaelsto.github.io/personal_shopper/

## Stores

| Store | Source | Status |
|---|---|---|
| Satisfy | Shopify product feed, prices in SEK | automatic |
| UVU | Shopify product feed, prices in SEK | automatic |
| KA-YO | `data/imports/kayo.json` | planned |
| On | `data/imports/on.json` | planned |
| adidas | `data/imports/adidas.json`, collected via Claude in Chrome | planned |

## How it works

- `scripts/update.mjs` fetches every store and writes the "database" in `data/`:
  - `products.json`: the current catalog
  - `price-history.json`: a price point is added whenever a price changes
  - `meta.json`: the last run, plus counts and errors per store

  If a store fails, its previous data is kept.
- `.github/workflows/update.yml` runs this **daily**, commits the data and deploys the site to GitHub Pages.
  - **Manual update:** go to Actions → "Update products & deploy site" → Run workflow. You can optionally limit it to some stores, e.g. `satisfy`.
  - **Code push to `main`:** only redeploys the site.
- `web/` is the static site, with no build step and no dependencies.

### Stores without a scrapable feed

Some sites block scripts (e.g. adidas). For these, products are collected manually, e.g. with Claude in Chrome, into `data/imports/<store>.json`; the format is described in `scripts/adapters/importfile.mjs`. The daily job merges them in.

## Run locally

```bash
npm run update   # fetch products
npm run dev      # http://localhost:8080
```

Requires Node 22+.
