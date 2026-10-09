# Runnista

Live at https://runnista.com. Source: GitHub `mikaelsto/personal_shopper` (cloned here).

## Deploying
- Vercel builds on every push to `main` (`vercel.json` → `scripts/vercel-build.sh` → Rust build into `_site/`). Pushing to `main` = going live, so only push when asked.
- `.github/workflows/update.yml` commits fresh product data to `main` daily — `git pull --rebase` before pushing.

## Supabase
- Project "runnista" (eu-north-1), URL and publishable key in `web/config.js`. Used only for signed-in ♥ saved products and palette votes (`web/sync.js`).
- Schema lives in `supabase/schema.sql`; changes there must be run by hand in the Supabase SQL Editor (no migrations/CLI set up). Never put the secret key in the repo.

## Working locally
- `npm run dev` serves `web/` live (preview config: `.claude/launch.json`, name `runnista-dev`).
- `npm run build` + `npm run test:site` before pushing changes that touch `site/` or the feed format.
- See README.md for the full architecture.
