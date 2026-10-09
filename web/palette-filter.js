// Palette selection (URL + localStorage) shared by the shop (index.html) and the palette picker (palettes.html).
// A selection is { palettes: [id], colors: ['#hex'], neutrals: bool, match: 'close'|'broad', exclude: [id] },
// kept in the URL (?palette=…&color=…&exclude=black,white) so it can be shared, and in localStorage so it's remembered.

import { paletteById } from './lib/palettes.mjs';
import { REPO, store } from './shop-utils.js';

// Matching itself lives in lib/palette-match.mjs (shared with scripts/palette-eval.mjs).
export {
  TOLERANCE, EXCLUDABLE, colorName, targetColors, attachSwatches, matchInfo, matchingColorways, isExcluded, passesExclude,
} from './lib/palette-match.mjs';
import { EXCLUDABLE } from './lib/palette-match.mjs';

const KEY = 'paletteSelection';

export const emptySelection = () => ({ palettes: [], colors: [], neutrals: true, match: 'close', exclude: [] });
export const isActive = (sel) => sel.palettes.length > 0 || sel.colors.length > 0;

export function loadSelection() {
  const q = new URLSearchParams(location.search);
  if (q.has('palette') || q.has('color') || q.has('exclude')) {
    return {
      palettes: (q.get('palette') ?? '').split(',').filter((id) => paletteById[id]),
      colors: (q.get('color') ?? '').split(',').filter((h) => /^[0-9a-f]{6}$/i.test(h)).map((h) => `#${h.toLowerCase()}`),
      neutrals: q.get('neutrals') !== '0',
      match: q.get('match') === 'broad' ? 'broad' : 'close',
      exclude: (q.get('exclude') ?? '').split(',').filter((id) => EXCLUDABLE.some((x) => x.id === id)),
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
  if (sel.exclude?.length) q.set('exclude', sel.exclude.join(','));
  return q;
}

export function saveSelection(sel) {
  try { localStorage.setItem(KEY, JSON.stringify(sel)); } catch {}
  const q = new URLSearchParams(location.search);
  for (const k of ['palette', 'color', 'neutrals', 'match', 'exclude']) q.delete(k);
  for (const [k, v] of selectionParams(sel)) q.set(k, v);
  history.replaceState(null, '', `${location.pathname}${q.size ? `?${q}` : ''}${location.hash}`);
}

// Resolved from this module, so pages in subfolders (social/) find the data too.
export const loadColorOverrides = () => fetch(new URL('data/color-names.json', import.meta.url)).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));

// 👍/👎 "is this in my palette?" votes are keyed "<productId> <voteKey>". Votes are about
// palette fit, so the colour exclusions aren't part of the key.
export const voteKey = (sel) => { const q = selectionParams(sel); q.delete('exclude'); return q.toString(); };
export const FEEDBACK_LINES_PER_ISSUE = 120; // keeps the pre-filled issue URL under GitHub's limit

// Opens a pre-filled GitHub issue with unsent votes; the "Palette feedback" workflow
// adds them to data/palette-labels.json and replies with the current matching accuracy.
export function sendVotes(votes) {
  const unsent = Object.entries(votes).filter(([, x]) => !x.sent).slice(0, FEEDBACK_LINES_PER_ISSUE);
  if (!unsent.length) return;
  const lines = unsent.map(([key, x]) => `${x.v > 0 ? '+' : '-'} ${key}`);
  const url = `https://github.com/${REPO}/issues/new?` + new URLSearchParams({
    title: `Palette feedback: ${unsent.length} votes`,
    body: `Votes from Personal Shopper ("is this product in my palette?"). Submit the issue; a workflow saves them as labels.\n\n\`\`\`\n${lines.join('\n')}\n\`\`\``,
  });
  for (const [key] of unsent) votes[key].sent = true;
  store.set('paletteVotes', votes);
  window.open(url, '_blank', 'noopener');
}
