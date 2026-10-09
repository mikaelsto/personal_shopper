// Turns a store-specific product into the unified product shape used by the site,
// and derives category, gender, function features, fibres and materials from the text.

import { classify, department } from './taxonomy.mjs';
import { isBrand, normalizeBrand } from './brands.mjs';

// Function keywords (English + Swedish). Categories live in taxonomy.mjs, fibres in FABRICS below.
const FEATURES = [
  ['insulated', /\b(thermal|brushed|fleece|grid ?fleece|warm\w*|insulat\w*|winter|primaloft|polartec|alpha|thermo\w*|cold[- ]weather|varm|varma|värmande|fodrad|vinter\w*|termo\w*)\b/],
  ['windproof', /\b(windproof|wind[- ]?resistant|wind ?block\w*|wind ?jacket|windbreaker|wind ?shell|vindtät|vindavvisande|vindjacka)\b/],
  ['water-resistant', /\b(waterproof|water[- ]?(repellent|resistant)|gore-?tex|rain|dwr|pertex|vattentät|vattenavvisande|regn\w*)\b/],
  ['reflective', /\b(reflective|reflex|hi-?vis|reflexer|reflekterande)\b/],
];

// Fibre families (English + Swedish), shown as the Material filter. `recycled` and `organic`
// are sourcing labels that sit alongside the fibres.
export const FABRICS = [
  ['wool', 'Wool & merino', /\b(merino\w*|wool|ull|ullblandning|ullfrotté|alpa(c|ck)a|cashmere|kashmir|mohair|yak)\b/],
  ['cotton', 'Cotton', /\b(cotton|bomull\w*)\b/],
  ['linen', 'Linen', /\b(linen|lin|linnetyg)\b(?!\w)/],
  ['hemp', 'Hemp', /\b(hemp|hampa)\b/],
  ['cellulose', 'Lyocell & viscose', /\b(tencel|lyocell|modal|viscose|viskos|cupro|rayon)\b/],
  ['polyester', 'Polyester', /\b(polyester|recycled polyester|pes)\b/],
  ['nylon', 'Nylon & polyamide', /\b(nylon|polyamid\w*|cordura)\b/],
  ['down', 'Down', /\b(goose down|duck down|down fill|down insulat\w*|\d{3} ?(fp|fill ?power|cuin)|dun|gåsdun|anddun|dunjacka|dunväst)\b/],
  ['leather', 'Leather & suede', /\b(leather|suede|läder|mocka)\b/],
  ['recycled', 'Recycled', /\b(recycled|återvunn\w*|återvinn\w*)\b/],
  ['organic', 'Organic', /\b(organic|ekologisk\w*|gots)\b/],
];
export const fabricLabel = (id) => FABRICS.find(([f]) => f === id)?.[1] ?? id;

// Fibre composition ("80% merino wool, 20% nylon") is trusted over loose mentions in the text,
// which often talk about other products ("pair it with a cotton tee").
const COMPOSITION = /\d{1,3}\s?%\s?[^\n,.;]{2,40}/gi;
export function detectFabrics(text) {
  const t = String(text).toLowerCase();
  const comp = (t.match(COMPOSITION) ?? []).join(' ');
  const source = comp && FABRICS.some(([, , re]) => re.test(comp)) ? `${comp} ${t.match(/[^\n]*\b(recycled|återvunn\w*|organic|ekologisk\w*|gots)\b[^\n]*/g)?.join(' ') ?? ''}` : t;
  return FABRICS.filter(([, , re]) => re.test(source)).map(([f]) => f);
}

export const detectFeatures = (text) => FEATURES.filter(([, re]) => re.test(String(text).toLowerCase())).map(([f]) => f);

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

// A product without a brand of its own gets the store's (`brand` in stores.json, else its name).
const storeBrand = (store) => store?.brand ?? store?.name ?? null;

// Brings a product saved by an older version up to date (stores that failed keep their old data).
export function upgradeProduct(p, store) {
  if (!isBrand(p.brand)) Object.assign(p, normalizeBrand(null, storeBrand(store) ?? p.storeName));
  if (p.fabrics) return p;
  const text = `${p.title} ${p.productType ?? ''} ${p.description ?? ''}`;
  return Object.assign(p, { features: detectFeatures(text), fabrics: detectFabrics(text) });
}

const uniq = (xs) => [...new Set(xs.filter(Boolean))];

export function normalizeProduct(p) {
  const description = htmlToText(p.descriptionHtml);
  // Only use human-readable tags for classification (skip codes like "FW25ESN").
  const readableTags = p.sourceTags.filter((t) => /[a-z]/.test(t) && t.length < 40);
  const { subcategory, generic } = classify({ title: p.title, storeCategory: p.productType ?? '', tags: readableTags });
  const featureText = `${p.title} ${p.productType} ${readableTags.join(' ')} ${description}`;
  const features = detectFeatures(featureText);

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
    ...normalizeBrand(p.brand, storeBrand(p.store)), // brand (display), brandKey (filter), brandLine (sub-line, e.g. "Nike ACG")
    url: p.url,
    productType: p.productType || null,
    category: department(subcategory), // master taxonomy department, e.g. "tops"
    subcategory, // e.g. "tops/long-sleeve"
    categoryGeneric: generic, // true = rule match was only a best guess (refined by Claude when enabled)
    gender: p.gender ?? detectGender(`${p.title} ${readableTags.join(' ')}`),
    features,
    materials: extractMaterials(description),
    fabrics: detectFabrics(featureText),
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
