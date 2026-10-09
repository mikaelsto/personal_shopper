// Slim product data for the site. The Rust build (site/src/feed.rs) writes it from
// data/products.json; this module is the browser's side: it decodes the feed and finds a
// product's details file.
//
//   feed.json                 every product, with what cards, slides and filters need
//   feed/<store>/<id>.json    one product's details (description, materials, all photos, price
//                             history, cart variant ids), fetched only for the products you open
//                             or look at
//   feed-search.json          words from each product's description, store category and materials,
//                             fetched the first time you search
//
// feed.json is compact: { v: 2, generatedAt, day, stores, words, products }.
//   stores    [{ id, name, base, cart, url, img }]: url and img are prefixes that the store's
//             product links and photos start with (stored without them)
//   words     shared strings (brands, categories, sizes, colours, dates…); words[0] is null
//   products  one row each, in the order of ROW below; trailing empty fields are left out
//   day       the build's date: the feed's daily order (and the pre-rendered first products)
//   name      the clean name (site/src/names.rs), only where it differs from the store's title
//   worn      1 when the photo (the first in images) shows the product being worn
//
// Pure ES module: no DOM, so the browser and Node scripts can both load it.

export const ROW = [
  'id', 'store', 'title', 'url', 'image', 'price', 'available', 'brand', 'brandKey', 'category', 'subcategory',
  'gender', 'firstSeen', 'colors', 'sizes', 'stock', 'variantColors', 'features', 'fabrics', 'compareAt', 'local',
  'photoColor', 'brandLine', 'name', 'worn',
];

// "kayo:16844" -> "feed/kayo/16844.json" (ids are "<store>:<store's own id>").
export function detailsPath(id) {
  const [store, ...rest] = id.split(':');
  return `feed/${store}/${rest.join(':').replace(/[^\w-]/g, '_')}.json`;
}

// A product's own page: "p/<store>/<slug>-<id>", e.g. "p/loplabbet/nike-alphafly-next-3-kolfiberskor-156650213".
// The Rust build writes one per product (product_path() in site/src/product.rs, which must agree).
const FOLD = { å: 'a', ä: 'a', á: 'a', à: 'a', â: 'a', ã: 'a', æ: 'ae', ç: 'c', é: 'e', è: 'e', ê: 'e', ë: 'e', í: 'i', ì: 'i',
  î: 'i', ï: 'i', ñ: 'n', ö: 'o', ø: 'o', ó: 'o', ò: 'o', ô: 'o', õ: 'o', ß: 'ss', ú: 'u', ù: 'u', û: 'u', ü: 'u' };
export function slug(text, max = 70) {
  let s = '';
  for (const c of text.toLowerCase().replace(/['’]/g, '')) s += FOLD[c] ?? (/[a-z0-9]/.test(c) ? c : '-');
  s = s.replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (s.length > max) s = s.slice(0, max).replace(/-[^-]*$/, '') || s.slice(0, max);
  return s;
}
export function productPath(p) {
  const [store, ...rest] = p.id.split(':');
  const file = rest.join(':').replace(/[^\w-]/g, '_');
  const name = slug(fullName(p));
  return `p/${store}/${name ? `${name}-` : ''}${file}`;
}
// "Nike Alphafly Next% 3": the clean name with the brand in front, unless it's in it (full_name() in product.rs).
export const fullName = (p) => {
  const name = p.name ?? p.title;
  return p.brand && !name.toLowerCase().includes(p.brand.toLowerCase()) ? `${p.brand} ${name}` : name;
};

const withPrefix =(prefix, s) => (!s || /^https?:/.test(s) ? s : prefix + s);

// One feed.json row -> the product shape the site uses (as in products.json). Until its details
// file is merged in (p.details = true), description and materials are empty, images has one
// photo and variants have no ids.
export function decodeProduct(row, feed) {
  const [id, si, title, url, image, price, available, brand, brandKey, category, subcategory, gender, firstSeen,
    colors = [], sizes = [], stock = '', variantColors = 0, features = 0, fabrics = 0, compareAt = 0, local = 0,
    photoColor = 0, brandLine = 0, name = 0, worn = 0] = row;
  const s = feed.stores[si];
  const w = (i) => feed.words[i] ?? null;
  const colorNames = colors.map(w);
  const variants = sizes.map((size, i) => ({
    size: w(size),
    available: stock[i] === '1',
    color: colorNames.length > 1 ? (variantColors ? w(variantColors[i]) : null) : colorNames[0] ?? null,
  }));
  return {
    id: `${s.id}:${id}`, store: s.id, storeName: s.name, storeBase: s.base, cart: s.cart,
    title, name: name || title, worn: worn === 1, url: withPrefix(s.url, url), brand: w(brand), brandKey: w(brandKey), brandLine: w(brandLine),
    category: w(category), subcategory: w(subcategory), gender: w(gender),
    features: features ? features.map(w) : [], fabrics: fabrics ? fabrics.map(w) : [],
    price, compareAt: compareAt || null, available: available === 1,
    local: local ? { currency: w(local[0]), price: local[1] } : undefined,
    colors: colorNames,
    images: image ? [withPrefix(s.img, image)] : [], description: '', materials: [],
    variants,
    sizesInStock: [...new Set(variants.filter((v) => v.available && v.size).map((v) => v.size))],
    photoColor: photoColor ? { main: photoColor[0], name: w(photoColor[1]) } : undefined,
    firstSeen: w(firstSeen),
  };
}
