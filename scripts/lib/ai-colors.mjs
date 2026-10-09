// Resolves store colour names the dictionary in colors.mjs can't read ("Gulfstream",
// "Star Anise") to a hex colour, using Claude. Results are cached in data/color-names.json
// ({ cleanName: "#hex" | null }), so each name is only sent once; the site reads that file.
// Runs only when ANTHROPIC_API_KEY is set (GitHub secret).

import Anthropic from '@anthropic-ai/sdk';
import { cleanColorName, resolveColor } from './colors.mjs';

const MODEL = 'claude-opus-5-5';
const BATCH_SIZE = 150;

const SYSTEM = `You map apparel colour names (from running and outdoor stores, sometimes brand-specific like "Falcon" or "Fallen Rock") to the hex colour a shopper would see.
For multi-part names ("black/summit white") give the main colour (the first part).
Use the brand context to recall the real shade when you know it. Return null for strings that aren't colours (descriptions, sizes, "multi", "new sku").`;

const SCHEMA = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          i: { type: 'integer' },
          hex: { anyOf: [{ type: 'string', pattern: '^#[0-9a-fA-F]{6}$' }, { type: 'null' }] },
        },
        required: ['i', 'hex'],
        additionalProperties: false,
      },
    },
  },
  required: ['results'],
  additionalProperties: false,
};

// Sends unresolved, uncached colour names to Claude; mutates `cache`.
export async function aiResolveColors(products, cache, log = console.log) {
  const todo = new Map(); // cleanName -> brand (context)
  for (const p of products) {
    for (const c of p.colors) {
      const name = cleanColorName(c);
      if (name && name.length <= 60 && !(name in cache) && !resolveColor(name)) todo.set(name, p.brand);
    }
  }
  if (!todo.size) return 0;
  if (!process.env.ANTHROPIC_API_KEY) {
    log(`  ${todo.size} colour names aren't in the colour dictionary; set ANTHROPIC_API_KEY to resolve them with Claude`);
    return 0;
  }

  const client = new Anthropic();
  const entries = [...todo];
  let done = 0;
  for (let start = 0; start < entries.length; start += BATCH_SIZE) {
    const batch = entries.slice(start, start + BATCH_SIZE);
    try {
      const res = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 8000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
        system: SYSTEM,
        messages: [{ role: 'user', content: JSON.stringify(batch.map(([name, brand], i) => ({ i, name, brand }))) }],
      });
      if (res.stop_reason === 'refusal') continue;
      const text = res.content.find((b) => b.type === 'text')?.text ?? '{}';
      for (const { i, hex } of JSON.parse(text).results ?? []) {
        if (!batch[i]) continue;
        cache[batch[i][0]] = hex ? hex.toLowerCase() : null;
        done++;
      }
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError) {
        log('  Claude: invalid ANTHROPIC_API_KEY; skipping colour names');
        return done;
      }
      if (err instanceof Anthropic.APIError) {
        log(`  Claude API error ${err.status}: ${err.message}; skipping this batch of colour names`);
        continue;
      }
      throw err;
    }
  }
  log(`  Claude resolved ${done} colour names`);
  return done;
}
