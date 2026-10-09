// Helpers shared by the shop (app.js) and the feed (social/social.js).

import { label } from './lib/taxonomy.mjs';

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
