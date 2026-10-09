// Helpers shared by the shop (app.js), the palette page (palettes.js) and the feed (social/social.js).

import { label } from './lib/taxonomy.mjs';
import { decodeProduct, detailsPath } from './lib/feed.mjs';

export const REPO = 'mikaelsto/personal_shopper';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const sek = (n) => (n == null ? '–' : `${Math.round(n).toLocaleString('sv-SE')} kr`);
export const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

export const catLabel = (p) => (p.subcategory && p.subcategory !== 'other' ? `${label(p.category)} › ${label(p.subcategory)}` : 'Other');
export const displayTitle = (p) => (p.colors.length === 1 ? `${p.title} – ${p.colors[0]}` : p.title);

// Use smaller image variants where the store's image server offers them.
export const thumb = (url, w = 500) => {
  if (!url) return url;
  if (url.includes('cdn.shopify.com')) return `${url}${url.includes('?') ? '&' : '?'}width=${w}`;
  if (url.includes('images.ka-yo.com/product/1000f1239/') && w <= 500) return url.replace('/1000f1239/', '/300f371/');
  return url;
};

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
// Paths resolve from this module, so pages in subfolders (social/) find the data too.
const dataUrl = (path) => new URL(`data/${path}`, import.meta.url);
let feedVersion = ''; // feed.json's generatedAt: keeps details files from the same build

// -> { generatedAt, products } with every product in the shape of products.json, minus details.
export async function loadFeed() {
  const feed = await fetch(dataUrl('feed.json')).then((r) => r.json());
  feedVersion = feed.generatedAt;
  return { generatedAt: feed.generatedAt, products: feed.products.map((p) => decodeProduct(p, feed.stores)) };
}

// Merges a product's description, materials, all photos and price history (p.history) into it,
// fetched once. Products that already have them (p.details, e.g. loaded live from Shopify) resolve as is.
const pendingDetails = new Map();
export function loadDetails(p) {
  if (p.details) return Promise.resolve(p);
  if (!pendingDetails.has(p.id)) {
    pendingDetails.set(p.id, fetch(dataUrl(`${detailsPath(p.id)}?v=${encodeURIComponent(feedVersion)}`))
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => Object.assign(p, {
        description: d.description ?? '', materials: d.materials ?? [], images: [...p.images.slice(0, 1), ...(d.images ?? [])],
        history: d.history ?? [], lastSeen: d.lastSeen, details: true,
      }))
      .finally(() => pendingDetails.delete(p.id))); // offline: tried again next time
  }
  return pendingDetails.get(p.id);
}

// { productId: "words from its description, store category and materials" }, fetched once.
let searchWords = null;
export const loadSearchWords = () => (searchWords ??= fetch(dataUrl(`feed-search.json?v=${encodeURIComponent(feedVersion)}`))
  .then((r) => r.json()).catch(() => { searchWords = null; return {}; }));
