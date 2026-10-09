// Palette selection shared by the shop (index.html) and the palette picker (palettes.html).
// A selection is { palettes: [id], colors: ['#hex'], neutrals: bool, match: 'close'|'broad' },
// kept in the URL (?palette=…&color=…) so it can be shared, and in localStorage so it's remembered.

import { hexToLab, deltaE, resolveColor } from './lib/colors.mjs';
import { PALETTES, BASIC_COLORS, paletteById, paletteSwatches } from './lib/palettes.mjs';

export const TOLERANCE = { close: 10, broad: 16 }; // CIEDE2000
const KEY = 'paletteSelection';

export const emptySelection = () => ({ palettes: [], colors: [], neutrals: true, match: 'close' });
export const isActive = (sel) => sel.palettes.length > 0 || sel.colors.length > 0;

export function loadSelection() {
  const q = new URLSearchParams(location.search);
  if (q.has('palette') || q.has('color')) {
    return {
      palettes: (q.get('palette') ?? '').split(',').filter((id) => paletteById[id]),
      colors: (q.get('color') ?? '').split(',').filter((h) => /^[0-9a-f]{6}$/i.test(h)).map((h) => `#${h.toLowerCase()}`),
      neutrals: q.get('neutrals') !== '0',
      match: q.get('match') === 'broad' ? 'broad' : 'close',
    };
  }
  try { return { ...emptySelection(), ...JSON.parse(localStorage.getItem(KEY)) }; } catch { return emptySelection(); }
}

export function selectionParams(sel) {
  const q = new URLSearchParams();
  if (sel.palettes.length) q.set('palette', sel.palettes.join(','));
  if (sel.colors.length) q.set('color', sel.colors.map((h) => h.slice(1)).join(','));
  if (isActive(sel) && !sel.neutrals) q.set('neutrals', '0');
  if (isActive(sel) && sel.match === 'broad') q.set('match', 'broad');
  return q;
}

export function saveSelection(sel) {
  try { localStorage.setItem(KEY, JSON.stringify(sel)); } catch {}
  const q = new URLSearchParams(location.search);
  for (const k of ['palette', 'color', 'neutrals', 'match']) q.delete(k);
  for (const [k, v] of selectionParams(sel)) q.set(k, v);
  history.replaceState(null, '', `${location.pathname}${q.size ? `?${q}` : ''}${location.hash}`);
}

// All named colours, so a single picked hex can be shown with its name.
const NAMED = new Map([...PALETTES.flatMap((p) => paletteSwatches(p)), ...BASIC_COLORS].map((c) => [c.hex.toLowerCase(), c.name]));
export const colorName = (hex) => NAMED.get(hex.toLowerCase()) ?? hex;

// The colours a product is compared against.
export function targetColors(sel) {
  const list = [
    ...sel.palettes.flatMap((id) => paletteSwatches(paletteById[id], sel.neutrals)),
    ...sel.colors.map((hex) => ({ name: colorName(hex), hex })),
  ];
  const seen = new Set();
  return list.filter((c) => !seen.has(c.hex.toLowerCase()) && seen.add(c.hex.toLowerCase())).map((c) => ({ ...c, lab: hexToLab(c.hex) }));
}

// Adds p._swatches = [{ name, hex, lab }] (one per readable colourway).
export function attachSwatches(products, overrides = {}) {
  for (const p of products) {
    p._swatches = p.colors.flatMap((name) => {
      const hex = resolveColor(name, overrides);
      return hex ? [{ name, hex, lab: hexToLab(hex) }] : [];
    });
  }
  return products;
}

// In close mode a pure neutral (white, grey, black) doesn't match a tinted one (cream,
// mushroom, camel): that warm/cool difference is the point of a palette.
const chroma = ([, a, b]) => Math.hypot(a, b);
const sameTint = (x, y) => !((chroma(x) < 5 && chroma(y) > 10) || (chroma(y) < 5 && chroma(x) > 10));

// Colourways of a product that fall inside the selection (empty = no match).
export function matchingColorways(p, targets, match = 'close') {
  const max = TOLERANCE[match];
  return (p._swatches ?? []).filter((s) =>
    targets.some((t) => deltaE(s.lab, t.lab) <= max && (match === 'broad' || sameTint(s.lab, t.lab))));
}

export const loadColorOverrides = () => fetch('data/color-names.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
