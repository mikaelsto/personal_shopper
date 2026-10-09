// Classifies products the keyword rules could only guess at (generic or no match)
// into the master taxonomy, using Claude. Results are cached in
// data/ai-categories.json, so each product is only sent once.
// Runs only when ANTHROPIC_API_KEY is set (GitHub secret); otherwise the rules' guess stays.

import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'node:crypto';
import { TAXONOMY, ALL_SUBCATEGORIES, OTHER, department } from './taxonomy.mjs';

const MODEL = 'claude-opus-5-5';
const BATCH_SIZE = 50;

export const aiKey = (p) =>
  createHash('sha1').update(`${p.store}|${p.productType ?? ''}|${p.title}`).digest('hex').slice(0, 16);

const SYSTEM = `You classify retail products (mostly running and outdoor apparel, often with Swedish store texts) into a fixed taxonomy.

Taxonomy (subcategory id: label):
${TAXONOMY.map((d) => `${d.label}\n${d.subs.map((s) => `  ${s.id}: ${s.label}`).join('\n')}`).join('\n')}

For each product, pick the single best subcategory id. Use "${OTHER}" only if nothing fits.
Hints: "vest" in a running context is usually a singlet; "väst" (Swedish) is a gilet. A hydration vest is accessories/hydration.
Brand names and collection names are not product types.`;

const SCHEMA = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          i: { type: 'integer' },
          subcategory: { type: 'string', enum: [...ALL_SUBCATEGORIES, OTHER] },
        },
        required: ['i', 'subcategory'],
        additionalProperties: false,
      },
    },
  },
  required: ['results'],
  additionalProperties: false,
};

// Sends uncached generic products to Claude; mutates `cache` ({ key: subcategory }).
export async function aiClassify(products, cache, log = console.log) {
  const todo = [...new Map(products.filter((p) => p.categoryGeneric && !(aiKey(p) in cache)).map((p) => [aiKey(p), p])).values()];
  if (!todo.length) return 0;
  if (!process.env.ANTHROPIC_API_KEY) {
    log(`  ${todo.length} products have only a rule-based guess; set ANTHROPIC_API_KEY to classify them with Claude`);
    return 0;
  }

  const client = new Anthropic();
  let done = 0;
  for (let start = 0; start < todo.length; start += BATCH_SIZE) {
    const batch = todo.slice(start, start + BATCH_SIZE);
    const items = batch.map((p, i) => ({
      i,
      title: p.title,
      brand: p.brand,
      storeCategory: p.productType ?? '',
      ruleGuess: p.subcategory,
      description: p.description.slice(0, 300),
    }));
    try {
      const res = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 8000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
        system: SYSTEM,
        messages: [{ role: 'user', content: JSON.stringify(items) }],
      });
      if (res.stop_reason === 'refusal') {
        log(`  Claude declined a batch (${res.stop_details?.category ?? 'unknown'}); keeping rule guesses`);
        continue;
      }
      const text = res.content.find((b) => b.type === 'text')?.text ?? '{}';
      for (const { i, subcategory } of JSON.parse(text).results ?? []) {
        if (batch[i] && (ALL_SUBCATEGORIES.includes(subcategory) || subcategory === OTHER)) {
          cache[aiKey(batch[i])] = subcategory;
          done++;
        }
      }
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError) {
        log('  Claude: invalid ANTHROPIC_API_KEY; skipping AI classification');
        return done;
      }
      if (err instanceof Anthropic.APIError) {
        log(`  Claude API error ${err.status}: ${err.message}; keeping rule guesses for this batch`);
        continue;
      }
      throw err;
    }
  }
  log(`  Claude classified ${done} products`);
  return done;
}

// Applies cached AI classifications to products (every run, since products are re-normalised).
export function applyAiCategories(products, cache) {
  for (const p of products) {
    const sub = cache[aiKey(p)];
    if (!sub) continue;
    p.subcategory = sub;
    p.category = department(sub);
    p.categoryGeneric = false;
    p.categorySource = 'ai';
    if (sub === 'tops/long-sleeve' && !p.features.includes('long-sleeve')) p.features.push('long-sleeve');
  }
}
