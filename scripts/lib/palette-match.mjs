// Matches products to a palette selection. Shared by the site (palette filter + picker) and
// scripts/palette-eval.mjs, which scores this logic against your 👍/👎 labels.
//
// A product's colours come from its photo when Claude has read it (p.photoColor), otherwise
// from the store's colour names. Matches are split into signature colours and neutrals, so
// results can show "your colours" first and the everyday black/navy/cream after. A colour
// that is closer to one of the season's "avoid" colours than to its palette colour is no match.

import { hexToLab, deltaE, resolveColor } from './colors.mjs';
import { PALETTES, BASIC_COLORS, paletteById, allColors } from './palettes.mjs';

export const TOLERANCE = { close: 10, broad: 16 }; // CIEDE2000

// All named colours, so a single picked hex can be shown with its name.
const NAMED = new Map([...PALETTES.flatMap(allColors), ...BASIC_COLORS].map((c) => [c.hex.toLowerCase(), c.name]));
export const colorName = (hex) => NAMED.get(hex.toLowerCase()) ?? hex;

const NEUTRAL_CHROMA = 12;
const chroma = ([, a, b]) => Math.hypot(a, b);
const avoidLabs = Object.fromEntries(PALETTES.map((p) => [p.id, p.avoid.map((c) => ({ ...c, lab: hexToLab(c.hex) }))]));

// The colours a product is compared against: { name, hex, lab, neutral, palette?, group }.
// Near-greyless palette colours (black, white, ivory, charcoal) count as neutrals in any group;
// a colour you picked yourself always counts as one of your colours.
export function targetColors(sel) {
  const seasonal = sel.palettes.flatMap((id) => allColors(paletteById[id]).map((c) => {
    const lab = hexToLab(c.hex);
    return { ...c, lab, neutral: !!c.neutral || chroma(lab) < NEUTRAL_CHROMA, palette: id };
  }));
  return [
    ...seasonal.filter((c) => sel.neutrals || !c.neutral),
    ...sel.colors.map((hex) => ({ name: colorName(hex), hex, lab: hexToLab(hex), neutral: false, group: 'picked' })),
  ];
}

// Adds p._swatches = [{ name, hex, lab, source }] (one per colourway). The photo shows the
// first colourway, so its colour (read by Claude) replaces that colourway's name guess.
export function attachSwatches(products, overrides = {}) {
  for (const p of products) {
    const fromNames = p.colors.map((name) => {
      const hex = resolveColor(name, overrides);
      return hex ? { name, hex, lab: hexToLab(hex), source: 'name' } : null;
    });
    const photo = p.photoColor?.main;
    if (photo) fromNames[0] = { name: p.colors[0] ?? p.photoColor.name, hex: photo, lab: hexToLab(photo), source: 'photo' };
    p._swatches = fromNames.filter(Boolean);
  }
  return products;
}

// Everyday colours you can exclude (e.g. "no black or white"), tested on the colour's
// lightness L, chroma C and hue h (CIELAB). An excluded colourway is ignored; a product is
// hidden only when all its readable colourways are excluded.
const lch = ([L, a, b]) => ({ L, C: Math.hypot(a, b), h: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360 });
export const EXCLUDABLE = [
  { id: 'black', label: 'Black', hex: '#141414', test: ({ L, C }) => L < 22 && C < 10 },
  { id: 'white', label: 'White', hex: '#f7f7f5', test: ({ L, C }) => L > 90 && C < 6 },
  { id: 'offwhite', label: 'Off-white & cream', hex: '#efe6d2', test: ({ L, C, h }) => L > 84 && C >= 6 && C < 22 && h > 50 && h < 110 },
  // Washed/pigment-dyed blacks and very dark greys: their own chip, so "Black" stays true black.
  { id: 'charcoal', label: 'Dark grey & charcoal', hex: '#3e3f42', test: ({ L, C }) => L >= 22 && L < 45 && C < 10 },
  { id: 'grey', label: 'Grey', hex: '#8c8c8c', test: ({ L, C }) => L >= 45 && L <= 90 && C < 7 },
  { id: 'navy', label: 'Navy', hex: '#1c2541', test: ({ L, C, h }) => L < 32 && C >= 8 && h > 230 && h < 320 },
  { id: 'beige', label: 'Beige & khaki', hex: '#c8b48e', test: ({ L, C, h }) => L >= 55 && L <= 84 && C >= 8 && C < 32 && h > 50 && h < 100 },
  { id: 'brown', label: 'Brown', hex: '#6b4a30', test: ({ L, C, h }) => L >= 15 && L < 55 && C >= 8 && h > 25 && h < 90 },
];
const EXCLUDE_BY_ID = Object.fromEntries(EXCLUDABLE.map((x) => [x.id, x]));
export const isExcluded = (swatch, exclude = []) => exclude.some((id) => EXCLUDE_BY_ID[id]?.test(lch(swatch.lab)));
// A product's colourways minus the excluded ones.
export const visibleSwatches = (p, exclude = []) => (exclude.length ? (p._swatches ?? []).filter((s) => !isExcluded(s, exclude)) : p._swatches ?? []);
// False when every readable colourway is excluded (products without a readable colour stay).
export const passesExclude = (p, exclude = []) => !exclude.length || !p._swatches?.length || visibleSwatches(p, exclude).length > 0;

// In close mode a pure neutral (white, grey, black) doesn't match a tinted one (cream,
// mushroom, camel): that warm/cool difference is the point of a palette.
const sameTint = (x, y) => !((chroma(x) < 5 && chroma(y) > 10) || (chroma(y) < 5 && chroma(x) > 10));
const fits = (s, t, match) => {
  const d = deltaE(s.lab, t.lab);
  if (d > TOLERANCE[match] || (match !== 'broad' && !sameTint(s.lab, t.lab))) return null;
  // Closer to a colour this season should avoid (e.g. black for a Spring) -> not a match.
  if (t.palette && avoidLabs[t.palette].some((a) => deltaE(s.lab, a.lab) < d)) return null;
  return d;
};

// Best match of a product: { kind: 'signature'|'neutral', dE, swatch, target } or null.
// Signature wins over neutral; within a kind the closest colour wins.
export function matchInfo(p, targets, match = 'close', exclude = []) {
  let best = null;
  for (const s of visibleSwatches(p, exclude)) {
    for (const t of targets) {
      const d = fits(s, t, match);
      if (d == null) continue;
      const kind = t.neutral ? 'neutral' : 'signature';
      if (!best || (kind === 'signature' && best.kind === 'neutral') || (kind === best.kind && d < best.dE)) {
        best = { kind, dE: d, swatch: s, target: t };
      }
    }
  }
  return best;
}

// Colourways of a product that fall inside the selection (for the dots on cards).
export function matchingColorways(p, targets, match = 'close', exclude = []) {
  return visibleSwatches(p, exclude).filter((s) => targets.some((t) => fits(s, t, match) != null));
}
