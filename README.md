# Personal Shopper

One place to browse running and fashion apparel from several stores. It has a shared category taxonomy, filters, side-by-side compare, price history, "find it elsewhere" links and per-store cart links.

**Site:** https://mikaelsto.github.io/personal_shopper/

**Feed:** https://mikaelsto.github.io/personal_shopper/social/ is a mobile-first, Reels-style version. You see one product per screen and swipe up for the next. Drag the photo left for its details. ☰ in the photo's footer opens colours, categories and sizes. The product page opens in a new tab, from the photo or from "To the product page".

## Stores

Stores are listed in `data/stores.json`. Defaults: **Satisfy**, **UVU**, **KA-YO**.

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
| `shopify` | Public `products.json` feed, with prices in SEK | Satisfy, UVU |
| `geins` | The storefront's own product API, using the public key in the page | KA-YO |
| `jsonld` | Sitemap, then the structured product data on each page (max 1000 pages per run) | On |
| `import` | Nothing automatic works: collect the products with Claude in Chrome into `data/imports/<id>.json` | adidas |

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
- `.github/workflows/update.yml` runs this **daily**, then commits the data and deploys to GitHub Pages.
  - **Manual update:** Actions → "Update products & deploy site" → Run workflow. You can optionally limit it to some stores, e.g. `kayo`.
- `web/` is the static site, with no build step.
- `scripts/lib/` holds the taxonomy and Shopify mapping, shared by the update job and the site.

## Run locally

```bash
npm install
npm run update     # fetch products
npm run dev        # http://localhost:8080
npm run taxonomy   # regenerate TAXONOMY.md
```

Requires Node 22+.
