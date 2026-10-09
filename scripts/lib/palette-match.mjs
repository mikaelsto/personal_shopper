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
export function matchInfo(p, targets, match = 'close') {
  let best = null;
  for (const s of p._swatches ?? []) {
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
export function matchingColorways(p, targets, match = 'close') {
  return (p._swatches ?? []).filter((s) => targets.some((t) => fits(s, t, match) != null));
}
