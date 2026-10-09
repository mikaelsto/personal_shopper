// Finds the photo that shows each product being worn (or used) by a person, so the feed can lead
// with it instead of the store's packshot. Claude (vision) looks at up to MAX_PHOTOS photos per
// product. Results are cached in data/worn-photos.json by product id, with the photos they were
// read from, so a product is only sent again when its photos change.
// Runs only when ANTHROPIC_API_KEY is set (GitHub secret). The feed uses the result through
// `worn` (an index into images) in products.json; see site/src/feed.rs.

import Anthropic from '@anthropic-ai/sdk';
import { analysisUrl } from './ai-image-colors.mjs';

const MODEL = 'claude-opus-5-5';
const PRODUCTS_PER_REQUEST = 6;
const MAX_PHOTOS = 5; // the first few: stores put their best photos first
const CONCURRENCY = 4;
const MAX_PER_RUN = Number(process.env.MAX_WORN_PHOTOS) || 2000;

const SYSTEM = `You look at the photos of products from running and outdoor clothing stores. For each product, pick the photo where a person is wearing or using it, to lead a social-media style feed.
- worn: the number of the best such photo: the product is clearly visible and is the focus (a full or upper/lower body shot is ideal), not a close-up detail of fabric or a logo.
- Shoes and socks count when they're on someone's feet; bags, caps, watches and bottles when someone carries, wears or uses them.
- Use -1 when no photo shows a person with the product (packshots, flat lays, mannequins and invisible-mannequin shots don't count).`;

const SCHEMA = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: { i: { type: 'integer' }, worn: { type: 'integer' } },
        required: ['i', 'worn'],
        additionalProperties: false,
      },
    },
  },
  required: ['results'],
  additionalProperties: false,
};

const photosOf = (p) => p.images.slice(0, MAX_PHOTOS);
const sameKey = (entry, p) => entry && entry.photos.length === photosOf(p).length && entry.photos.every((u, k) => u === p.images[k]);

async function analyse(client, batch) {
  const content = batch.flatMap((p, i) => [
    { type: 'text', text: `Product ${i}: ${p.brand ?? ''} ${p.title}. Photos 0-${photosOf(p).length - 1}:` },
    ...photosOf(p).map((url) => ({ type: 'image', source: { type: 'url', url: analysisUrl(url) } })),
  ]);
  content.push({ type: 'text', text: `Pick the worn photo for products 0-${batch.length - 1}.` });
  const res = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: 'user', content }],
  });
  if (res.stop_reason === 'refusal') return [];
  const text = res.content.find((b) => b.type === 'text')?.text ?? '{}';
  return JSON.parse(text).results ?? [];
}

const store = (cache, p, worn) => {
  const photos = photosOf(p);
  cache[p.id] = { photos, worn: Number.isInteger(worn) && worn >= 0 && worn < photos.length ? worn : -1 };
};

// Sends products with more than one photo and no (current) reading to Claude; mutates `cache`
// ({ productId: { photos, worn } }).
export async function aiWornPhotos(products, cache, log = console.log) {
  const todo = products.filter((p) => p.images.length > 1 && !sameKey(cache[p.id], p)).slice(0, MAX_PER_RUN);
  if (!todo.length) return 0;
  if (!process.env.ANTHROPIC_API_KEY) {
    log(`  ${todo.length} products have no worn-photo reading; set ANTHROPIC_API_KEY to read them with Claude`);
    return 0;
  }

  const client = new Anthropic();
  const batches = [];
  for (let i = 0; i < todo.length; i += PRODUCTS_PER_REQUEST) batches.push(todo.slice(i, i + PRODUCTS_PER_REQUEST));
  let done = 0;
  let authFailed = false;

  const runBatch = async (batch) => {
    try {
      for (const r of await analyse(client, batch)) if (batch[r.i]) { store(cache, batch[r.i], r.worn); done++; }
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError) { authFailed = true; return; }
      if (err instanceof Anthropic.BadRequestError && batch.length > 1) {
        // Usually a photo the API couldn't download: retry one by one, skip the broken one.
        for (const p of batch) {
          try {
            for (const r of await analyse(client, [p])) { store(cache, p, r.worn); done++; }
          } catch (e) {
            if (e instanceof Anthropic.BadRequestError) store(cache, p, -1); // unreadable photos
            else if (e instanceof Anthropic.APIError) log(`  Claude API error ${e.status} on a product's photos; retrying next run`);
            else throw e;
          }
        }
        return;
      }
      if (err instanceof Anthropic.APIError) { log(`  Claude API error ${err.status}: ${err.message}; retrying these products next run`); return; }
      throw err;
    }
  };

  let next = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (next < batches.length && !authFailed) await runBatch(batches[next++]);
  }));
  if (authFailed) log('  Claude: invalid ANTHROPIC_API_KEY; skipping worn photos');
  log(`  Claude looked for a worn photo on ${done} products (${todo.filter((p) => cache[p.id]?.worn >= 0).length} found)`);
  return done;
}

// Copies cached readings onto products as `worn` (every run, since products are re-normalised).
export function applyWornPhotos(products, cache) {
  for (const p of products) {
    const c = cache[p.id];
    if (sameKey(c, p) && c.worn >= 0) p.worn = c.worn;
    else delete p.worn;
  }
}
