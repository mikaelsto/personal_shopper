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
//
// Pure ES module: no DOM, so the browser and Node scripts can both load it.

export const ROW = [
  'id', 'store', 'title', 'url', 'image', 'price', 'available', 'brand', 'brandKey', 'category', 'subcategory',
  'gender', 'firstSeen', 'colors', 'sizes', 'stock', 'variantColors', 'features', 'fabrics', 'compareAt', 'local',
  'photoColor', 'brandLine',
];

// "kayo:16844" -> "feed/kayo/16844.json" (ids are "<store>:<store's own id>").
export function detailsPath(id) {
  const [store, ...rest] = id.split(':');
  return `feed/${store}/${rest.join(':').replace(/[^\w-]/g, '_')}.json`;
}

const withPrefix = (prefix, s) => (!s || /^https?:/.test(s) ? s : prefix + s);

// One feed.json row -> the product shape the site uses (as in products.json). Until its details
// file is merged in (p.details = true), description and materials are empty, images has one
// photo and variants have no ids.
export function decodeProduct(row, feed) {
  const [id, si, title, url, image, price, available, brand, brandKey, category, subcategory, gender, firstSeen,
    colors = [], sizes = [], stock = '', variantColors = 0, features = 0, fabrics = 0, compareAt = 0, local = 0,
    photoColor = 0, brandLine = 0] = row;
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
    title, url: withPrefix(s.url, url), brand: w(brand), brandKey: w(brandKey), brandLine: w(brandLine),
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
