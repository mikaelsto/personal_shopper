// Turns a store-specific product into the unified product shape used by the site,
// and derives category, gender, cold-weather features and materials from the text.

const CATEGORIES = [
  // [category, regex] — first match wins, so order matters.
  ['socks', /\bsocks?\b/],
  ['shoes', /\b(shoes?|sneakers?|trainers?|footwear|spikes?|boots?|slides?|adizero|adios|boston \d|cloud\w*)\b/],
  ['bra', /\bbras?\b/],
  ['headwear', /\b(caps?|hats?|beanies?|headbands?|visors?|neck ?warmers?|buffs?|balaclavas?|balaklavas?|bandanas?|tubes?)\b/],
  ['gloves', /\b(gloves?|mittens?|mitts?)\b/],
  ['jacket', /\b(jackets?|shells?|anoraks?|windbreakers?|wind ?jackets?|gilets?|outerwear|parkas?|coats?|vests? jacket)\b/],
  ['midlayer', /\b(hoodies?|sweatshirts?|sweaters?|fleeces?|half[- ]?zips?|quarter[- ]?zips?|1\/4[- ]?zip|1\/2[- ]?zip|mid ?layers?|pullovers?|crew ?necks?|sweats?)\b/],
  ['tights', /\b(tights?|leggings?)\b/],
  ['pants', /\b(pants?|trousers?|joggers?|sweatpants?)\b/],
  ['shorts', /\b(shorts?|half ?tights?)\b/],
  ['long-sleeve', /\b(long ?sleeves?|l\/s|ls tee|longsleeves?|longtee|long tee|base ?layers?)\b/],
  ['singlet', /\b(singlets?|tanks?|tank ?tops?|crop ?tops?|vests?|cut-? ?offs?|muscle)\b/],
  ['t-shirt', /\b(t-?shirts?|tees?|tops?|shirts?|jerseys?)\b/],
  ['accessories', /\b(bags?|belts?|bottles?|flasks?|packs?|accessor\w*|sunglasses|oakley|watch|coros|towels?|repair kit|magazines?|photo ?books?|arm ?sleeves?|bands?)\b/],
];

export const CATEGORY_GROUPS = {
  tops: ['t-shirt', 'long-sleeve', 'singlet', 'midlayer'],
};

const FEATURES = [
  ['merino/wool', /\b(merino|wool|ull)\b/],
  ['warm', /\b(thermal|brushed|fleece|grid ?fleece|warm\w*|insulat\w*|winter|primaloft|polartec|alpha|thermo\w*|cold[- ]weather)\b/],
  ['wind', /\b(windproof|wind[- ]?resistant|wind ?block\w*|wind ?jacket|windbreaker|wind ?shell)\b/],
  ['water-resistant', /\b(waterproof|water[- ]?(repellent|resistant)|gore-?tex|rain|dwr|pertex)\b/],
  ['reflective', /\b(reflective|reflex|hi-?vis)\b/],
  ['long-sleeve', /\b(long ?sleeves?|l\/s|longsleeves?)\b/],
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

function classify(title, productType, tags) {
  // Title and product type are most reliable; tags fill in the rest.
  const primary = `${title} ${productType}`.toLowerCase();
  const secondary = tags.join(' ').toLowerCase();
  for (const text of [primary, secondary]) {
    for (const [cat, re] of CATEGORIES) if (re.test(text)) return cat;
  }
  return 'other';
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
  let category = classify(p.title, p.productType, readableTags);
  const featureText = `${p.title} ${p.productType} ${readableTags.join(' ')} ${description}`.toLowerCase();
  const features = FEATURES.filter(([, re]) => re.test(featureText)).map(([f]) => f);
  if (category === 't-shirt' && features.includes('long-sleeve') && /long ?sleeve/i.test(`${p.title} ${readableTags.join(' ')}`)) {
    category = 'long-sleeve';
  }

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
    category,
    gender: detectGender(`${p.title} ${readableTags.join(' ')}`),
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
