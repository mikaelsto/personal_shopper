// Palette selection (URL + localStorage) shared by the shop (index.html) and the palette picker (palettes.html).
// A selection is { palettes: [id], colors: ['#hex'], neutrals: bool, match: 'close'|'broad' },
// kept in the URL (?palette=…&color=…) so it can be shared, and in localStorage so it's remembered.

import { paletteById } from './lib/palettes.mjs';

// Matching itself lives in lib/palette-match.mjs (shared with scripts/palette-eval.mjs).
export { TOLERANCE, colorName, targetColors, attachSwatches, matchInfo, matchingColorways } from './lib/palette-match.mjs';
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

export const loadColorOverrides = () => fetch('data/color-names.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
