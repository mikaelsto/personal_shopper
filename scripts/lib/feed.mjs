// Slim data for the site, built from data/products.json at deploy time (scripts/build-site.mjs)
// and on the fly by the local preview (scripts/serve.mjs):
//
//   feed.json                 every product, with what cards, slides and filters need
//   feed/<store>/<id>.json    one product's details (description, materials, all photos, price
//                             history), fetched only for the products you open or look at
//   feed-search.json          words from each product's description, store category and materials,
//                             fetched the first time you search
//
// Pure ES module: also loaded by the browser to decode the feed and find a product's details.

// "kayo:16844" -> "feed/kayo/16844.json" (ids are "<store>:<store's own id>").
export function detailsPath(id) {
  const [store, ...rest] = id.split(':');
  return `feed/${store}/${rest.join(':').replace(/[^\w-]/g, '_')}.json`;
}

// Each distinct word once, lower case, punctuation trimmed ("t-shirt" and "100%" stay whole).
const searchWords = (text) => [...new Set(text.toLowerCase().split(/\s+/)
  .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}%]+$/gu, '')).filter((w) => w.length > 1))].join(' ');

// -> { feed, details: [[path, details], …], search: { productId: words } }
export function buildFeed(products, history = {}, generatedAt = new Date().toISOString()) {
  const stores = {};
  const details = [];
  const search = {};
  const items = products.map((p) => {
    stores[p.store] ??= { name: p.storeName, base: p.storeBase, cart: p.cart ?? null };
    details.push([detailsPath(p.id), {
      id: p.id,
      description: p.description || undefined,
      materials: p.materials?.length ? p.materials : undefined,
      images: p.images.length > 1 ? p.images.slice(1) : undefined,
      history: history[p.id],
      lastSeen: p.lastSeen ?? p.collectedAt,
    }]);
    search[p.id] = searchWords(`${p.productType ?? ''} ${(p.materials ?? []).join(' ')} ${p.description ?? ''}`);
    const multiColour = p.colors.length > 1;
    const cart = p.cart === 'shopify';
    return {
      id: p.id, store: p.store, title: p.title, brand: p.brand, brandKey: p.brandKey, brandLine: p.brandLine ?? undefined, url: p.url,
      category: p.category, subcategory: p.subcategory, gender: p.gender,
      features: p.features?.length ? p.features : undefined,
      fabrics: p.fabrics?.length ? p.fabrics : undefined,
      price: p.price, compareAt: p.compareAt ?? undefined, available: p.available,
      local: p.local ? { currency: p.local.currency, price: p.local.price } : undefined, // converted from this
      colors: p.colors, image: p.images[0],
      // [size, in stock, colour (only when there are several), variant id (only for cart links)]
      variants: p.variants.map((v) => {
        const row = [v.size ?? null, v.available ? 1 : 0];
        if (multiColour || cart) row.push(multiColour ? v.color ?? null : null);
        if (cart) row.push(v.id);
        return row;
      }),
      photoColor: p.photoColor?.main ? { main: p.photoColor.main, name: p.photoColor.name } : undefined,
      firstSeen: p.firstSeen,
    };
  });
  return { feed: { generatedAt, stores, products: items }, details, search };
}

// feed.json product -> the product shape the site uses (as in products.json). Until its details
// file is merged in (p.details = true), description and materials are empty and images has one photo.
export function decodeProduct(p, stores) {
  const s = stores[p.store] ?? {};
  const variants = p.variants.map(([size, available, color, id]) =>
    ({ size, available: !!available, color: p.colors.length > 1 ? color ?? null : p.colors[0] ?? null, id }));
  return {
    ...p,
    storeName: s.name, storeBase: s.base, cart: s.cart,
    features: p.features ?? [], fabrics: p.fabrics ?? [], compareAt: p.compareAt ?? null,
    images: p.image ? [p.image] : [], description: '', materials: [],
    variants,
    sizesInStock: [...new Set(variants.filter((v) => v.available && v.size).map((v) => v.size))],
  };
}
