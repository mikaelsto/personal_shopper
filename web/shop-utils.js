// Helpers shared by the feed (feed.js, the start page), the grid (app.js) and the palette page (palettes.js).

import { label } from './lib/taxonomy.mjs';
import { decodeProduct, detailsPath } from './lib/feed.mjs';

export const REPO = 'mikaelsto/personal_shopper';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const sek = (n) => (n == null ? '–' : `${Math.round(n).toLocaleString('sv-SE')} kr`);
export const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// The market this page is in, from the address: /en-se/, /en-eu/ or /en-us/ (see vercel.json:
// every market serves the same files for now). `home` is its start page ("/" outside a market,
// as on `npm run dev`'s localhost:8080/). The market is kept in a cookie, so runnista.com/ takes
// you back to it instead of going by your location.
export const MARKETS = ['en-se', 'en-eu', 'en-us'];
export const market = MARKETS.find((m) => new RegExp(`^/${m}(/|$)`).test(location.pathname)) ?? '';
export const home = market ? `/${market}/` : '/';
if (market) document.cookie = `market=${market}; path=/; max-age=31536000; samesite=lax; secure`;

// Stores you've unchecked, shared by the shop and the feed. Saved as the hidden ones, so a store
// added later shows up checked.
export const loadHiddenStores = () => new Set(store.get('hiddenStores', []));
export const saveHiddenStores = (ids) => store.set('hiddenStores', [...ids]);

// Stores that sell to Sweden in EUR, USD… have their prices converted to SEK by the update job;
// p.local is the store's own price.
const money = (n, currency) => n.toLocaleString('sv-SE', { style: 'currency', currency, maximumFractionDigits: n % 1 ? 2 : 0 });
export const approx = (p) => (p.local ? '≈ ' : '');
export const localPrice = (p) => (p.local ? `${money(p.local.price, p.local.currency)} at ${p.storeName}, converted to kronor` : '');

export const catLabel = (p) => (p.subcategory && p.subcategory !== 'other' ? `${label(p.category)} › ${label(p.subcategory)}` : 'Other');
export const displayTitle = (p) => (p.colors.length === 1 ? `${p.title} – ${p.colors[0]}` : p.title);

// Use smaller image variants where the store's image server offers them.
const isShopify = (url) => url?.includes('cdn.shopify.com');
export const thumb = (url, w = 500) => {
  if (!url) return url;
  if (isShopify(url)) return `${url}${url.includes('?') ? '&' : '?'}width=${w}`;
  if (url.includes('images.ka-yo.com/product/1000f1239/') && w <= 500) return url.replace('/1000f1239/', '/300f371/');
  return url;
};

// A srcset for full-screen photos, so phones load the width their screen needs (Shopify only).
export const srcset = (url) => (isShopify(url) ? [540, 828, 1080, 1440].map((w) => `${thumb(url, w)} ${w}w`).join(', ') : '');

// Normalise size labels like "Size 1 (S)" or "Medium" to S/M/L…
export function sizeLetter(s) {
  if (!s) return null;
  const m = String(s).toUpperCase().match(/\b(XXS|XS|S|M|L|XL|XXL|2XL|3XL)\b/);
  if (m) return m[1] === '2XL' ? 'XXL' : m[1];
  const word = { SMALL: 'S', MEDIUM: 'M', LARGE: 'L' }[String(s).toUpperCase().trim()];
  return word ?? null;
}

// Compact label for cards: "Size 1 (S)" -> "S", "US M8 / UK 7½ / EU 41⅓" -> "EU 41⅓".
export const shortSize = (s) => sizeLetter(s) ?? (String(s).match(/EU\s*([\d½⅓⅔.,]+)/)?.[0].replace(/\s+/, ' ')) ?? s;

// Price history as a sparkline plus "date: price → …"; h = [[date, price], …].
export function historyHtml(h) {
  if (h.length < 2) return esc(h.length ? `${sek(h[0][1])} since ${h[0][0]} (no changes yet)` : 'No history yet');
  const prices = h.map(([, v]) => v);
  const lo = Math.min(...prices), hi = Math.max(...prices);
  const pts = h.map(([, v], i) => `${(i / (h.length - 1)) * 300},${55 - ((v - lo) / (hi - lo || 1)) * 50}`).join(' ');
  return `<svg viewBox="0 0 300 60" preserveAspectRatio="none"><polyline fill="none" stroke="var(--accent)" stroke-width="2" points="${pts}"/></svg>
    ${h.map(([d, v]) => `${esc(d)}: ${sek(v)}`).join(' → ')}`;
}

// ---------- Product data (see scripts/lib/feed.mjs) ----------
// Paths resolve from this module, so pages in subfolders find the data too.
const dataUrl = (path) => new URL(`data/${path}`, import.meta.url);
// The build stamps its version into the page; feed.json is fetched with it, so the request
// matches the page's preload and a new deploy never gets yesterday's cached feed.
const build = globalThis.document?.querySelector('meta[name="build"]')?.content;
let feedVersion = ''; // feed.json's generatedAt: keeps details files from the same build

// -> { generatedAt, day, products } with every product in the shape of products.json, minus details.
export async function loadFeed() {
  const feed = await fetch(dataUrl(`feed.json${build ? `?v=${build}` : ''}`)).then((r) => r.json());
  feedVersion = feed.generatedAt;
  return { generatedAt: feed.generatedAt, day: feed.day, products: feed.products.map((row) => decodeProduct(row, feed)) };
}

// Merges a product's description, materials, all photos, price history (p.history) and the
// variants' ids (for cart links) into it, fetched once. Products that already have them (p.details, e.g. loaded live from Shopify) resolve as is.
const pendingDetails = new Map();
export function loadDetails(p) {
  if (p.details) return Promise.resolve(p);
  if (!pendingDetails.has(p.id)) {
    pendingDetails.set(p.id, fetch(dataUrl(`${detailsPath(p.id)}?v=${encodeURIComponent(feedVersion)}`))
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => {
        d.variantIds?.forEach((id, i) => { if (p.variants[i]) p.variants[i].id = id; });
        return Object.assign(p, {
          description: d.description ?? '', materials: d.materials ?? [], images: [...p.images.slice(0, 1), ...(d.images ?? [])],
          history: d.history ?? [], lastSeen: d.lastSeen, details: true,
        });
      })
      .finally(() => pendingDetails.delete(p.id))); // offline: tried again next time
  }
  return pendingDetails.get(p.id);
}

// { productId: "words from its description, store category and materials" }, fetched once.
let searchWords = null;
export const loadSearchWords = () => (searchWords ??= fetch(dataUrl(`feed-search.json?v=${encodeURIComponent(feedVersion)}`))
  .then((r) => r.json()).catch(() => { searchWords = null; return {}; }));

// ---------- Saved products (♥) ----------
// No login, so the list lives in this browser's localStorage, as a session that lasts 30 days
// from your last visit (each visit or change starts the 30 days again). Each entry keeps a small
// snapshot, so a product that later leaves the feed can still be shown (and opened at the store).
const SAVED_DAYS = 30;
const renewSaved = () => store.set('savedUntil', Date.now() + SAVED_DAYS * 864e5);
export function loadSaved() { // [{ id, at, title, brand, storeName, price, image, url }], newest first
  if (Date.now() > store.get('savedUntil', Infinity)) store.set('savedProducts', []);
  renewSaved();
  return store.get('savedProducts', []);
}
export const isSaved = (list, id) => list.some((x) => x.id === id);
export function toggleSaved(list, p) {
  const next = isSaved(list, p.id)
    ? list.filter((x) => x.id !== p.id)
    : [{ id: p.id, at: new Date().toISOString().slice(0, 10), title: displayTitle(p), brand: p.brand, storeName: p.storeName, price: p.price, image: p.images[0], url: p.url }, ...list];
  store.set('savedProducts', next);
  renewSaved();
  return next;
}
