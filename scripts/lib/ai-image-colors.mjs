// Reads each product's real colour from its main photo with Claude (vision), for the palette
// filter: the store's colour name is often a brand word ("Falcon") or missing, the photo isn't.
// Results are cached in data/image-colors.json by image URL, so each photo is only sent once.
// Runs only when ANTHROPIC_API_KEY is set (GitHub secret).

import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-opus-5-5';
const BATCH_SIZE = 20; // photos per request
const CONCURRENCY = 4;
const MAX_PER_RUN = Number(process.env.MAX_IMAGE_COLORS) || 4000;

// A small, consistent rendition of the photo (fewer tokens, same colour).
export function analysisUrl(url) {
  if (!url) return null;
  if (url.includes('cdn.shopify.com')) return `${url}${url.includes('?') ? '&' : '?'}width=400`;
  if (url.includes('images.ka-yo.com/product/1000f1239/')) return url.replace('/1000f1239/', '/300f371/');
  return url;
}

const SYSTEM = `You look at product photos from clothing and outdoor stores and report the colour of the product itself, for a personal-colour-analysis shop ("which season palette does this suit?").
For each photo:
- Look only at the product being sold (named in the text before the photo). Ignore the background, skin, hair and other garments a model wears.
- main: the hex of the product's dominant colour as it would look in daylight, corrected for studio lighting (a white tee on a grey background is white, not grey).
- name: a plain colour name for main (e.g. "warm beige", "dusty rose", "charcoal").
- secondary: up to 2 hex colours that also cover a noticeable part of the product (prints, colour blocks, contrast panels). Empty when solid. Ignore small logos and zips.
- pattern: solid, heather (melange), print (camo, tie-dye, graphic all-over), or colorblock.
- undertone: warm (yellow/golden base), cool (blue/pink base) or neutral.
- value: light, medium or dark. chroma: bright (clear, saturated) or muted (greyed, dusty).
- productVisible: false if the photo doesn't clearly show the product (lifestyle shot, size chart, logo); then give your best guess anyway.`;

const SCHEMA = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          i: { type: 'integer' },
          productVisible: { type: 'boolean' },
          main: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
          name: { type: 'string' },
          secondary: { type: 'array', items: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' } },
          pattern: { type: 'string', enum: ['solid', 'heather', 'print', 'colorblock'] },
          undertone: { type: 'string', enum: ['warm', 'cool', 'neutral'] },
          value: { type: 'string', enum: ['light', 'medium', 'dark'] },
          chroma: { type: 'string', enum: ['bright', 'muted'] },
        },
        required: ['i', 'productVisible', 'main', 'name', 'secondary', 'pattern', 'undertone', 'value', 'chroma'],
        additionalProperties: false,
      },
    },
  },
  required: ['results'],
  additionalProperties: false,
};

async function analyse(client, batch) {
  const content = batch.flatMap((p, i) => [
    { type: 'text', text: `Photo ${i}: ${p.brand} ${p.title} (store colour name: ${p.colors[0] ?? 'none'})` },
    { type: 'image', source: { type: 'url', url: analysisUrl(p.images[0]) } },
  ]);
  content.push({ type: 'text', text: `Report the product colour for photos 0-${batch.length - 1}.` });
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

const store = (cache, p, r) => {
  const { i, ...rest } = r;
  cache[p.images[0]] = { ...rest, main: rest.main.toLowerCase(), secondary: rest.secondary.map((h) => h.toLowerCase()) };
};

// Sends photos without a cached colour to Claude; mutates `cache` ({ imageUrl: result | null }).
export async function aiImageColors(products, cache, log = console.log) {
  const todo = [...new Map(products.filter((p) => p.images[0] && !(p.images[0] in cache)).map((p) => [p.images[0], p])).values()]
    .slice(0, MAX_PER_RUN);
  if (!todo.length) return 0;
  if (!process.env.ANTHROPIC_API_KEY) {
    log(`  ${todo.length} product photos have no colour reading; set ANTHROPIC_API_KEY to read them with Claude`);
    return 0;
  }

  const client = new Anthropic();
  const batches = [];
  for (let i = 0; i < todo.length; i += BATCH_SIZE) batches.push(todo.slice(i, i + BATCH_SIZE));
  let done = 0;
  let authFailed = false;

  const runBatch = async (batch) => {
    try {
      for (const r of await analyse(client, batch)) if (batch[r.i]) { store(cache, batch[r.i], r); done++; }
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError) { authFailed = true; return; }
      if (err instanceof Anthropic.BadRequestError && batch.length > 1) {
        // Usually one photo the API couldn't download: retry one by one, skip the broken one.
        for (const p of batch) {
          try {
            for (const r of await analyse(client, [p])) { store(cache, p, r); done++; }
          } catch (e) {
            if (e instanceof Anthropic.BadRequestError) cache[p.images[0]] = null; // unreadable photo
            else if (e instanceof Anthropic.APIError) log(`  Claude API error ${e.status} on a photo; retrying next run`);
            else throw e;
          }
        }
        return;
      }
      if (err instanceof Anthropic.APIError) { log(`  Claude API error ${err.status}: ${err.message}; retrying these photos next run`); return; }
      throw err;
    }
  };

  // A few requests in parallel keeps the first full run to minutes instead of an hour.
  let next = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (next < batches.length && !authFailed) await runBatch(batches[next++]);
  }));
  if (authFailed) log('  Claude: invalid ANTHROPIC_API_KEY; skipping photo colours');
  log(`  Claude read the colour of ${done} product photos`);
  return done;
}

// Copies cached photo colours onto products (every run, since products are re-normalised).
export function applyImageColors(products, cache) {
  for (const p of products) {
    const c = p.images[0] && cache[p.images[0]];
    if (c) p.photoColor = c;
    else delete p.photoColor;
  }
}
