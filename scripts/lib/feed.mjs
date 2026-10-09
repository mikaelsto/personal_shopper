// Slim data for the feed (web/social/), built from data/products.json at deploy time
// (scripts/build-site.mjs) and on the fly by the local preview (scripts/serve.mjs).
//
//   feed.json                 what a slide and the filters need, for products in stock with a photo
//   feed/<store>/<id>.json    one product's details (description, materials, more photos, price
//                             history), fetched only for the products you actually look at
//
// Pure ES module: also loaded by the browser to decode the feed and find a product's details.

// "kayo:16844" -> "feed/kayo/16844.json" (ids are "<store>:<store's own id>").
export function detailsPath(id) {
  const [store, ...rest] = id.split(':');
  return `feed/${store}/${rest.join(':').replace(/[^\w-]/g, '_')}.json`;
}

// -> { feed, details: [[path, details], …] }
export function buildFeed(products, history = {}, generatedAt = new Date().toISOString()) {
  const live = products.filter((p) => p.available && p.images?.length);
  const stores = {};
  const details = [];
  const items = live.map((p) => {
    stores[p.store] ??= { name: p.storeName, base: p.storeBase, cart: p.cart ?? null };
    details.push([detailsPath(p.id), {
      id: p.id,
      description: p.description || undefined,
      materials: p.materials?.length ? p.materials : undefined,
      images: p.images.length > 1 ? p.images.slice(1) : undefined,
      history: history[p.id],
      firstSeen: p.firstSeen,
      lastSeen: p.lastSeen ?? p.collectedAt,
    }]);
    const multiColour = p.colors.length > 1;
    const cart = p.cart === 'shopify';
    return {
      id: p.id, store: p.store, title: p.title, brand: p.brand, url: p.url,
      category: p.category, subcategory: p.subcategory, gender: p.gender,
      features: p.features?.length ? p.features : undefined,
      fabrics: p.fabrics?.length ? p.fabrics : undefined,
      price: p.price, compareAt: p.compareAt ?? undefined, colors: p.colors, image: p.images[0],
      // [size, in stock, colour (only when there are several), variant id (only for cart links)]
      variants: p.variants.map((v) => {
        const row = [v.size ?? null, v.available ? 1 : 0];
        if (multiColour || cart) row.push(multiColour ? v.color ?? null : null);
        if (cart) row.push(v.id);
        return row;
      }),
      photoColor: p.photoColor?.main ? { main: p.photoColor.main, name: p.photoColor.name } : undefined,
    };
  });
  return { feed: { generatedAt, stores, products: items }, details };
}

// feed.json product -> the product shape the site uses (as in products.json, minus the details).
export function decodeProduct(p, stores) {
  const s = stores[p.store] ?? {};
  return {
    ...p,
    storeName: s.name, storeBase: s.base, cart: s.cart,
    features: p.features ?? [], fabrics: p.fabrics ?? [], compareAt: p.compareAt ?? null,
    images: [p.image], available: true,
    variants: p.variants.map(([size, available, color, id]) =>
      ({ size, available: !!available, color: p.colors.length > 1 ? color ?? null : p.colors[0] ?? null, id })),
  };
}
