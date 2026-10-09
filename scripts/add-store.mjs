// Adds a store to data/stores.json after detecting how to read it.
//
// Usage: node scripts/add-store.mjs <url> [name]
// In the GitHub "Add store" workflow the URL/name come from the issue (env ISSUE_TITLE / ISSUE_BODY).
// Writes a markdown summary to $SUMMARY_FILE (posted as an issue comment) and the
// new store id to $GITHUB_OUTPUT.

import { readFile, writeFile, appendFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { detectStore } from './lib/detect.mjs';

const STORES_FILE = fileURLToPath(new URL('../data/stores.json', import.meta.url));

const text = `${process.env.ISSUE_TITLE ?? ''}\n${process.env.ISSUE_BODY ?? ''}`;
const rawUrl = process.argv[2] || text.match(/https?:\/\/[^\s)>"']+/)?.[0];
const name = process.argv[3] || text.match(/^name:\s*(.+)$/im)?.[1]?.trim();

async function finish(summary, id = '') {
  console.log(summary);
  if (process.env.SUMMARY_FILE) await writeFile(process.env.SUMMARY_FILE, summary);
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `store_id=${id}\n`);
}

if (!rawUrl) {
  await finish('❌ No store URL found. Use a title like `Add store: https://example.com`.');
  process.exit(0);
}

const stores = JSON.parse(await readFile(STORES_FILE, 'utf8'));
const url = new URL(rawUrl);
const existing = stores.find((s) => new URL(s.base).hostname === url.hostname);
if (existing) {
  await finish(`ℹ️ **${existing.name}** is already in the list (platform: \`${existing.platform}\`).`);
  process.exit(0);
}

const { log, ...store } = await detectStore(url.href, name);
let id = store.id;
for (let n = 2; stores.some((s) => s.id === id); n++) id = `${store.id}${n}`;
store.id = id;
store.addedAt = new Date().toISOString().slice(0, 10);
stores.push(store);
await writeFile(STORES_FILE, JSON.stringify(stores, null, 2) + '\n');

const how = {
  shopify: 'Shopify product feed: fully automatic, with cart links.',
  geins: 'Geins storefront API: fully automatic.',
  jsonld: 'Sitemap + product-page data: automatic (up to 1000 products per run).',
  import: 'No automatic source found. Ask Claude to collect the products with Claude in Chrome into `data/imports/' + id + '.json`.',
}[store.platform];

await finish(
  [`✅ Added **${store.name}** (\`${id}\`)`, '', `**Method:** ${how}`, '', '<details><summary>Detection log</summary>', '', ...log.map((l) => `- ${l}`), '', '</details>'].join('\n'),
  store.platform === 'import' ? '' : id,
);
