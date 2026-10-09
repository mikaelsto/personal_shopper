// Turns a store-specific product into the unified product shape used by the site,
// and derives category, gender, cold-weather features and materials from the text.

import { classify, department } from './taxonomy.mjs';

// Attribute keywords (English + Swedish). Categories live in taxonomy.mjs.
const FEATURES = [
  ['merino/wool', /\b(merino\w*|wool|ull|ullblandning)\b/],
  ['warm', /\b(thermal|brushed|fleece|grid ?fleece|warm\w*|insulat\w*|winter|primaloft|polartec|alpha|thermo\w*|cold[- ]weather|varm|varma|värmande|fodrad|vinter\w*|termo\w*)\b/],
  ['wind', /\b(windproof|wind[- ]?resistant|wind ?block\w*|wind ?jacket|windbreaker|wind ?shell|vindtät|vindavvisande|vindjacka)\b/],
  ['water-resistant', /\b(waterproof|water[- ]?(repellent|resistant)|gore-?tex|rain|dwr|pertex|vattentät|vattenavvisande|regn\w*)\b/],
  ['reflective', /\b(reflective|reflex|hi-?vis|reflexer|reflekterande)\b/],
  ['long-sleeve', /\b(long ?sleeves?|l\/s|longsleeves?|långärmad|långärmade)\b/],
];

export function htmlToText(html) {
  return String(html)
    .replace(/<\s*(br|\/p|\/div|\/h\d)\s*\/?>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '\n• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

function detectGender(text) {
  const t = text.toLowerCase();
  const women = /\b(women'?s?|woman|wmns?|female|dam)\b/.test(t);
  const men = /\b(men'?s?|man|male|herr)\b/.test(t);
  if (women && !men) return 'women';
  if (men && !women) return 'men';
  return 'unisex';
}

function extractMaterials(text) {
  const found = text.match(/\d{1,3}\s?%\s?(recycled\s)?[A-Za-zÀ-ÿ-]+(\s(wool|polyester|polyamide|nylon|elastane))?/gi) ?? [];
  if (found.length) return [...new Set(found.map((m) => m.replace(/\s+/g, ' ').trim()))].slice(0, 6);
  // No percentages: fall back to the first line describing the fabric.
  const line = text.split('\n').find((l) => /fabric|knit|jersey|merino|wool|polyester|polyamide|nylon|cotton|gsm|polartec|pertex/i.test(l));
  return line ? [line.replace(/^[-•\s]+/, '').slice(0, 140)] : [];
}

const uniq = (xs) => [...new Set(xs.filter(Boolean))];

export function normalizeProduct(p) {
  const description = htmlToText(p.descriptionHtml);
  // Only use human-readable tags for classification (skip codes like "FW25ESN").
  const readableTags = p.sourceTags.filter((t) => /[a-z]/.test(t) && t.length < 40);
  const { subcategory, generic } = classify({ title: p.title, storeCategory: p.productType ?? '', tags: readableTags });
  const featureText = `${p.title} ${p.productType} ${readableTags.join(' ')} ${description}`.toLowerCase();
  const features = FEATURES.filter(([, re]) => re.test(featureText)).map(([f]) => f);
  if (subcategory === 'tops/long-sleeve' && !features.includes('long-sleeve')) features.push('long-sleeve');

  const available = p.variants.filter((v) => v.available);
  const priced = (available.length ? available : p.variants).filter((v) => Number.isFinite(v.price));
  const price = priced.length ? Math.min(...priced.map((v) => v.price)) : null;
  const compareAt = Math.max(0, ...priced.map((v) => v.compareAt ?? 0)) || null;

  return {
    id: `${p.store.id}:${p.sourceId}`,
    store: p.store.id,
    storeName: p.store.name,
    storeBase: p.store.base,
    cart: p.cart, // "shopify" -> cart permalink supported
    title: p.title,
    brand: p.brand,
    url: p.url,
    productType: p.productType || null,
    category: department(subcategory), // master taxonomy department, e.g. "tops"
    subcategory, // e.g. "tops/long-sleeve"
    categoryGeneric: generic, // true = rule match was only a best guess (refined by Claude when enabled)
    gender: p.gender ?? detectGender(`${p.title} ${readableTags.join(' ')}`),
    features,
    materials: extractMaterials(description),
    description,
    images: uniq(p.images).slice(0, 10),
    currency: p.currency,
    price,
    compareAt: compareAt && price && compareAt > price ? compareAt : null,
    available: available.length > 0,
    colors: uniq(p.variants.map((v) => v.color)),
    sizes: uniq(p.variants.map((v) => v.size)),
    sizesInStock: uniq(available.map((v) => v.size)),
    variants: p.variants,
    ...(p.collectedAt ? { collectedAt: p.collectedAt } : {}),
  };
}
