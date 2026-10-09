// Runnista grid (grid.html). Reads data/feed.json (a slim products.json, see scripts/lib/feed.mjs)
// + data/stores.json, built by the GitHub job. Details and search words load when needed.
// Newly added Shopify stores are also fetched live in the browser until the job has added them.

import { TAXONOMY, label } from './lib/taxonomy.mjs';
import { fromShopify, isGiftCard, shopifyPageUrl, shopifyLocation } from './lib/shopify-map.mjs';
import { FABRICS, fabricLabel } from './lib/normalize.mjs';
import { PALETTES, FAMILIES, paletteById } from './lib/palettes.mjs';
import {
  loadSelection, saveSelection, selectionParams, isActive, targetColors, attachSwatches,
  matchingColorways, matchInfo, loadColorOverrides, colorName, EXCLUDABLE, isExcluded, passesExclude,
  voteKey, FEEDBACK_LINES_PER_ISSUE, sendVotes,
} from './palette-filter.js';
import {
  REPO, esc, sek, store, catLabel, displayTitle, thumb, sizeLetter, shortSize, historyHtml, loadFeed, loadDetails, loadSearchWords,
  loadHiddenStores, saveHiddenStores, approx, localPrice,
} from './shop-utils.js';

const PAGE = 60;
// Sourcing labels narrow the fibre choice ("recycled" AND any chosen fibre) instead of widening it.
const SOURCING = ['recycled', 'organic'];
const HIDDEN_DEPTS = TAXONOMY.filter((d) => d.hidden).map((d) => d.id);

const $ = (s) => document.querySelector(s);

let all = [];
let stores = []; // registered stores (data/stores.json) + pending ones added in this browser
const liveStatus = new Map(); // storeId -> "loading 250…" | "error" while fetching in the browser
let filtered = [];
let shown = PAGE;
const compare = new Set(store.get('compare', []));
let colorOverrides = {}; // data/color-names.json
let palette = loadSelection(); // chosen seasons/colours; filters every category
let targets = targetColors(palette);
// 👍/👎 "is this in my palette?" votes: { "<productId> <selection>": { v: 1|-1, at, sent } }.
// Sent to GitHub as labels that scripts/palette-eval.mjs scores the matching against.
const votes = store.get('paletteVotes', {});

const state = {
  // Every store is checked unless you uncheck it (remembered in this browser, also used by the feed).
  q: '', hiddenStores: loadHiddenStores(), category: '', features: new Set(), fabrics: new Set(), brands: new Set(),
  gender: '', size: store.get('size', ''), min: '', max: '', stock: true, sale: false, sort: 'relevance',
};

init();

const withText = (p) => ({ ...p, _text: `${p.title} ${p.brand} ${p.brandLine ?? ''} ${p.storeName} ${label(p.category)} ${label(p.subcategory)} ${p.productType ?? ''} ${p.features.join(' ')} ${p.colors.join(' ')} ${p.description}`.toLowerCase() });

async function init() {
  const [data, registered, overrides] = await Promise.all([
    loadFeed(),
    fetch('data/stores.json').then((r) => r.json()).catch(() => []),
    loadColorOverrides(),
  ]);
  colorOverrides = overrides;
  all = attachSwatches(data.products.map(withText), colorOverrides);
  computeMatches(all);
  $('#meta').textContent = `updated ${new Date(data.generatedAt).toLocaleDateString('sv-SE')}`;

  // Pending stores live in this browser until the GitHub job has added them to stores.json.
  const hosts = new Set(registered.map((s) => new URL(s.base).hostname));
  const pending = store.get('pendingStores', []).filter((s) => !hosts.has(new URL(s.base).hostname));
  store.set('pendingStores', pending);
  stores = [...registered, ...pending.map((s) => ({ ...s, pending: true }))];

  buildFilters();
  bind();
  apply();
  for (const s of pending) if (s.platform === 'shopify') loadLive(s);
}

function renderStoreChips() {
  const counts = all.reduce((a, p) => ((a[p.store] = (a[p.store] ?? 0) + 1), a), {});
  $('#f-stores').innerHTML = stores.map((s) => {
    const status = liveStatus.get(s.id);
    const note = status ?? (s.pending ? (counts[s.id] ? `${counts[s.id]} · not saved` : 'not saved') : counts[s.id] ?? 0);
    return `<button class="chip check ${s.pending ? 'pending' : ''}" data-store="${esc(s.id)}" aria-pressed="${!state.hiddenStores.has(s.id)}" title="${esc(s.base)}">${esc(s.name)} <span class="n">${esc(note)}</span>${s.pending ? `<span class="x" data-remove="${esc(s.id)}" title="Remove">×</span>` : ''}</button>`;
  }).join('') + `<button class="chip add" id="add-store-btn" title="Add a store" aria-label="Add a store">+</button>`;
}

function buildFilters() {
  renderStoreChips();
  renderPaletteFilter();
  renderExcludeFilter();
  const counts = all.filter(inPalette).reduce((a, p) => {
    a[p.category] = (a[p.category] ?? 0) + 1;
    a[p.subcategory] = (a[p.subcategory] ?? 0) + 1;
    return a;
  }, {});
  const opt = (value, text, n) => `<option value="${value}">${esc(text)}${n ? ` (${n})` : ''}</option>`;
  $('#f-category').innerHTML =
    opt('', isActive(palette) ? 'All categories in your palette' : 'All categories') +
    opt('tops+midlayers', 'Tops & mid layers') +
    TAXONOMY.map((d) => `<optgroup label="${esc(d.label)}${d.hidden ? ' (hidden by default)' : ''}">` +
      opt(d.id, `All ${d.label.toLowerCase()}`, counts[d.id]) +
      d.subs.filter((s) => counts[s.id]).map((s) => opt(s.id, s.label, counts[s.id])).join('') +
      '</optgroup>').join('') +
    (counts.other ? opt('other', 'Other / uncategorised', counts.other) : '');

  const tally = (key) => all.filter(inPalette).reduce((a, p) => { for (const v of p[key] ?? []) a[v] = (a[v] ?? 0) + 1; return a; }, {});
  const fabricCounts = tally('fabrics');
  $('#f-fabrics').innerHTML = FABRICS.filter(([f]) => fabricCounts[f] || state.fabrics.has(f)).map(([f, text]) =>
    `<button class="chip" data-fabric="${esc(f)}" aria-pressed="${state.fabrics.has(f)}">${esc(text)} <span class="n">${fabricCounts[f] ?? 0}</span></button>`).join('');
  const featCounts = tally('features');
  $('#f-features').innerHTML = Object.keys(featCounts).sort().map((f) =>
    `<button class="chip" data-feature="${esc(f)}" aria-pressed="${state.features.has(f)}">${esc(f)} <span class="n">${featCounts[f]}</span></button>`).join('');
  $('#f-size').value = state.size;
  $('#f-category').value = state.category;
}

function bind() {
  let t;
  $('#q').addEventListener('input', (e) => {
    clearTimeout(t);
    t = setTimeout(() => { state.q = e.target.value.trim().toLowerCase(); if (state.q) addSearchWords(); apply(); }, 150);
  });
  $('#f-stores').addEventListener('click', (e) => {
    if (e.target.closest('#add-store-btn')) return openAddStore();
    const remove = e.target.closest('[data-remove]');
    if (remove) return removePending(remove.dataset.remove);
    const b = e.target.closest('[data-store]');
    if (!b) return;
    const hidden = new Set(state.hiddenStores);
    hidden.has(b.dataset.store) ? hidden.delete(b.dataset.store) : hidden.add(b.dataset.store);
    setHiddenStores(hidden);
  });
  $('#stores-all').addEventListener('click', () => setHiddenStores([]));
  $('#stores-none').addEventListener('click', () => setHiddenStores(stores.map((s) => s.id)));
  $('#f-features').addEventListener('click', (e) => toggleChip(e, 'feature', state.features));
  $('#f-fabrics').addEventListener('click', (e) => toggleChip(e, 'fabric', state.fabrics));
  $('#f-brands').addEventListener('click', (e) => {
    const b = e.target.closest('[data-brand]');
    if (!b) return;
    const k = b.dataset.brand;
    state.brands.has(k) ? state.brands.delete(k) : state.brands.add(k);
    apply();
  });
  $('#f-brand-q').addEventListener('input', () => renderBrandFilter());
  $('#f-brands-more').addEventListener('click', () => { brandsExpanded = !brandsExpanded; renderBrandFilter(); });
  $('#f-palette').addEventListener('click', (e) => {
    const tile = e.target.closest('[data-season]');
    const rm = e.target.closest('[data-uncolor]');
    if (tile) {
      const id = tile.dataset.season;
      setPalette({ palettes: palette.palettes.includes(id) ? palette.palettes.filter((x) => x !== id) : [...palette.palettes, id] });
    }
    else if (rm?.dataset.uncolor) setPalette({ colors: palette.colors.filter((h) => h !== rm.dataset.uncolor) });
    else if (e.target.closest('#pal-clear-all')) setPalette({ palettes: [], colors: [] });
    else if (e.target.closest('#pal-send')) sendFeedback();
  });
  $('#f-exclude').addEventListener('click', (e) => {
    const b = e.target.closest('[data-exclude]');
    if (!b) return;
    const id = b.dataset.exclude;
    const ex = palette.exclude ?? [];
    setPalette({ exclude: ex.includes(id) ? ex.filter((x) => x !== id) : [...ex, id] });
  });
  $('#f-palette').addEventListener('change', (e) => {
    if (e.target.id === 'pal-neutrals') setPalette({ neutrals: e.target.checked });
    if (e.target.id === 'pal-match') setPalette({ match: e.target.value });
  });
  const on = (id, key, prop = 'value', after) => $(id).addEventListener('change', (e) => { state[key] = e.target[prop]; after?.(); apply(); });
  on('#f-category', 'category');
  on('#f-gender', 'gender');
  on('#f-size', 'size', 'value', () => store.set('size', state.size));
  on('#f-min', 'min');
  on('#f-max', 'max');
  on('#f-stock', 'stock', 'checked');
  on('#f-sale', 'sale', 'checked');
  on('#sort', 'sort');
  $('#more').addEventListener('click', () => { shown += PAGE; render(); });
  $('#reset').addEventListener('click', reset);
  $('#toggle-filters').addEventListener('click', () => $('#filters').classList.toggle('open'));

  $('#grid').addEventListener('click', (e) => {
    const cmp = e.target.closest('.cmp');
    const card = e.target.closest('.card');
    if (!card) return;
    const v = e.target.closest('[data-vote]');
    if (v) { e.stopPropagation(); return vote(card.dataset.id, Number(v.dataset.vote)); }
    if (cmp) {
      e.stopPropagation();
      toggleCompare(card.dataset.id, cmp.querySelector('input'));
      return;
    }
    openDetail(card.dataset.id);
  });
  $('#compare-open').addEventListener('click', openCompare);
  $('#compare-clear').addEventListener('click', () => { compare.clear(); saveCompare(); render(); });
  for (const d of ['#detail', '#compare', '#add-store']) {
    $(d).addEventListener('click', (e) => { if (e.target === e.currentTarget || e.target.closest('.close')) e.currentTarget.close(); });
  }
}

// Descriptions aren't in feed.json: the first search fetches their words and adds them to _text.
let searchWordsAdded = false;
function addSearchWords() {
  if (searchWordsAdded) return;
  searchWordsAdded = true;
  loadSearchWords().then((words) => {
    if (!Object.keys(words).length) { searchWordsAdded = false; return; } // offline: next search tries again
    for (const p of all) if (words[p.id]) p._text += ` ${words[p.id]}`;
    if (state.q) apply();
  });
}

function toggleChip(e, attr, set) {
  const b = e.target.closest(`[data-${attr}]`);
  if (!b) return;
  const v = b.dataset[attr];
  set.has(v) ? set.delete(v) : set.add(v);
  b.setAttribute('aria-pressed', set.has(v));
  apply();
}

function setHiddenStores(ids) {
  state.hiddenStores = new Set(ids);
  saveHiddenStores(state.hiddenStores);
  syncControls();
  apply();
}

// Your stores stay as they are, like your size: they're a setting more than a filter.
function reset(run = true) {
  Object.assign(state, { q: '', category: '', gender: '', min: '', max: '', stock: true, sale: false });
  state.features.clear();
  state.fabrics.clear();
  state.brands.clear();
  $('#f-brand-q').value = '';
  $('#q').value = '';
  syncControls();
  if (run) apply();
}

function syncControls() {
  $('#f-category').value = state.category;
  $('#f-gender').value = state.gender;
  $('#f-min').value = state.min;
  $('#f-max').value = state.max;
  $('#f-stock').checked = state.stock;
  $('#f-sale').checked = state.sale;
  document.querySelectorAll('[data-store]').forEach((b) => b.setAttribute('aria-pressed', !state.hiddenStores.has(b.dataset.store)));
  document.querySelectorAll('[data-fabric]').forEach((b) => b.setAttribute('aria-pressed', state.fabrics.has(b.dataset.fabric)));
  document.querySelectorAll('[data-feature]').forEach((b) => b.setAttribute('aria-pressed', state.features.has(b.dataset.feature)));
}

// ---------- Palette filter ----------
// p._pm = best match { kind: 'signature'|'neutral', dE, swatch, target } for the current selection.
function computeMatches(list) {
  for (const p of list) p._pm = targets.length ? matchInfo(p, targets, palette.match, palette.exclude) : null;
}
// In the palette (if one is chosen) and not only in excluded colours (e.g. "no black or white").
const inPalette = (p) => passesExclude(p, palette.exclude) && (!targets.length || !!p._pm);

const selKey = () => voteKey(palette);
const voteOf = (p) => votes[`${p.id} ${selKey()}`]?.v ?? 0;

function vote(id, v) {
  const key = `${id} ${selKey()}`;
  if (votes[key]?.v === v) delete votes[key];
  else votes[key] = { v, at: new Date().toISOString().slice(0, 10), sent: false };
  store.set('paletteVotes', votes);
  renderPaletteFilter();
  // Update the card in place (re-sorting now would make it jump); 👎 moves it to the end next time.
  const card = document.querySelector(`.card[data-id="${CSS.escape(id)}"]`);
  card?.querySelectorAll('[data-vote]').forEach((b) => b.setAttribute('aria-pressed', votes[key]?.v === Number(b.dataset.vote)));
  card?.classList.toggle('rated-down', votes[key]?.v === -1);
}

function sendFeedback() {
  sendVotes(votes);
  renderPaletteFilter();
}

function setPalette(change) {
  palette = { ...palette, ...change };
  targets = targetColors(palette);
  computeMatches(all);
  saveSelection(palette);
  buildFilters(); // category counts follow the palette
  apply();
}

function renderPaletteFilter() {
  const q = selectionParams(palette);
  const pickerUrl = `palettes.html${q.size ? `?${q}` : ''}`;
  $('#nav-palette').href = pickerUrl;
  $('#pal-advanced').href = pickerUrl;
  // Season grid: one row per family, click a tile to toggle that season.
  const tile = (p) => `<button class="pal-tile" data-season="${esc(p.id)}" aria-pressed="${palette.palettes.includes(p.id)}" title="${esc(p.label)} – ${esc(p.blurb)}">
      <span class="pal-tile-strip">${p.colors.map((c) => `<i style="background:${esc(c.hex)}"></i>`).join('')}</span>
      <span class="pal-tile-name">${esc(p.label.split(' ')[0])}</span>
    </button>`;
  $('#f-palette').innerHTML = `
    ${isActive(palette) ? '' : '<p class="muted pal-empty">Pick your season to see only products in your colours.</p>'}
    ${FAMILIES.map((f) => `<div class="pal-fam">
      <span class="pal-fam-name">${esc(f.label)}</span>
      <div class="pal-tiles">${PALETTES.filter((p) => p.family === f.id).map(tile).join('')}</div>
    </div>`).join('')}
    ${palette.colors.length ? `<div class="chips">
      ${palette.colors.map((h) => `<button class="chip on" data-uncolor="${esc(h)}" title="Remove"><i class="dot" style="background:${esc(h)}"></i>${esc(colorName(h))} <span class="x">×</span></button>`).join('')}
    </div>` : ''}
    ${isActive(palette) ? `
      <label class="check"><input type="checkbox" id="pal-neutrals" ${palette.neutrals ? 'checked' : ''}> Include neutrals</label>
      <label class="check">Match <select id="pal-match" class="inline">
        <option value="close" ${palette.match === 'close' ? 'selected' : ''}>close</option>
        <option value="broad" ${palette.match === 'broad' ? 'selected' : ''}>broad</option>
      </select></label>
      <div class="pal-links"><button id="pal-clear-all" class="link">Clear palette</button></div>` : ''}
    ${feedbackHtml()}`;
}

// "Exclude colours" chips; the count is how many products (in the current palette) each one hides.
function renderExcludeFilter() {
  const ex = palette.exclude ?? [];
  const shown = all.filter((p) => inPalette(p) && inCategory(p, state.category));
  // Would excluding x hide p? Either all its colours are excluded, or (with a palette) the
  // colourway it matched on is excluded and no other colourway matches.
  const hidesP = (p, more) => !passesExclude(p, more) ||
    (!!p._pm && isExcluded(p._pm.swatch, more) && !matchInfo(p, targets, palette.match, more));
  $('#f-exclude').innerHTML = EXCLUDABLE.map((x) => {
    const hides = ex.includes(x.id) ? null : shown.filter((p) => hidesP(p, [...ex, x.id])).length;
    return `<button class="chip ex-chip" data-exclude="${esc(x.id)}" aria-pressed="${ex.includes(x.id)}" title="${ex.includes(x.id) ? 'Show' : 'Hide'} products that only come in ${esc(x.label.toLowerCase())}">
      <i class="dot" style="background:${esc(x.hex)}"></i>${esc(x.label)}${hides != null ? ` <span class="n">${hides}</span>` : ''}</button>`;
  }).join('');
}

function feedbackHtml() {
  const all = Object.values(votes);
  if (!all.length) return isActive(palette) ? '<p class="note">Tip: rate products with 👍/👎 to help improve colour matching.</p>' : '';
  const up = all.filter((x) => x.v > 0).length;
  const unsent = all.filter((x) => !x.sent).length;
  return `<div class="pal-feedback">
    <span>Your ratings: ${up} 👍 · ${all.length - up} 👎</span>
    ${unsent ? `<button id="pal-send" class="link">Send ${Math.min(unsent, FEEDBACK_LINES_PER_ISSUE)} to improve matching ↗</button>` : '<span class="muted">All sent, thanks!</span>'}
  </div>`;
}

// Category filter value: "" (all except hidden departments), a department, a subcategory, or "a+b".
const inCategory = (p, value) =>
  value ? value.split('+').some((v) => p.category === v || p.subcategory === v) : !HIDDEN_DEPTS.includes(p.category);
function hasFabric(p) {
  if (!state.fabrics.size) return true;
  const own = p.fabrics ?? [];
  const fibres = [...state.fabrics].filter((f) => !SOURCING.includes(f));
  return [...state.fabrics].filter((f) => SOURCING.includes(f)).every((f) => own.includes(f)) &&
    (!fibres.length || fibres.some((f) => own.includes(f)));
}
const hasSize = (p, size) => p.variants.some((v) => v.available && sizeLetter(v.size) === size);

// Every filter except Brand; brand counts are computed on this set, so they follow the other filters.
function matchesExceptBrand(p, words, min, max) {
  return (
    !state.hiddenStores.has(p.store) &&
    inPalette(p) &&
    inCategory(p, state.category) &&
    [...state.features].every((f) => p.features.includes(f)) &&
    hasFabric(p) &&
    (!state.gender || p.gender === state.gender || p.gender === 'unisex') &&
    (!state.stock || p.available) &&
    (!state.sale || p.compareAt) &&
    (!state.size || hasSize(p, state.size)) &&
    (p.price ?? 0) >= min && (p.price ?? 0) <= max &&
    words.every((w) => p._text.includes(w))
  );
}

function apply() {
  const words = state.q.split(/\s+/).filter(Boolean);
  const min = Number(state.min) || 0;
  const max = Number(state.max) || Infinity;
  const base = all.filter((p) => matchesExceptBrand(p, words, min, max));
  filtered = state.brands.size ? base.filter((p) => state.brands.has(p.brandKey)) : base;
  renderBrandFilter(base);

  const score = (p) => (p.available ? 1 : 0) + (p.title.toLowerCase().includes(state.q) && state.q ? 3 : 0);
  const discount = (p) => (p.compareAt ? 1 - p.price / p.compareAt : 0);
  const sorters = {
    relevance: (a, b) => score(b) - score(a),
    'price-asc': (a, b) => (a.price ?? 1e9) - (b.price ?? 1e9),
    'price-desc': (a, b) => (b.price ?? 0) - (a.price ?? 0),
    discount: (a, b) => discount(b) - discount(a),
    newest: (a, b) => String(b.firstSeen).localeCompare(String(a.firstSeen)),
  };
  // With a palette: signature colours first, then neutrals, then products you rated 👎;
  // within a group by colour closeness (relevance) or the chosen sort.
  const group = (p) => (voteOf(p) < 0 ? 2 : p._pm?.kind === 'neutral' ? 1 : 0);
  const byMatch = (a, b) => (a._pm?.dE ?? 99) - (b._pm?.dE ?? 99) || score(b) - score(a);
  const sorter = sorters[state.sort];
  filtered.sort(targets.length
    ? (a, b) => group(a) - group(b) || (state.sort === 'relevance' ? byMatch(a, b) : sorter(a, b))
    : sorter);
  shown = PAGE;
  renderExcludeFilter(); // its counts follow the category
  render();
}


// ---------- Brand filter ----------
const BRANDS_SHOWN = 15;
let brandsExpanded = false;
let brandBase = [];

function renderBrandFilter(base = brandBase) {
  brandBase = base;
  const counts = new Map(); // brandKey -> { name, n }
  for (const p of base) {
    if (!p.brandKey) continue;
    const c = counts.get(p.brandKey) ?? { name: p.brand, n: 0 };
    c.n++;
    counts.set(p.brandKey, c);
  }
  for (const k of state.brands) if (!counts.has(k)) counts.set(k, { name: all.find((p) => p.brandKey === k)?.brand ?? k, n: 0 });
  const q = $('#f-brand-q').value.trim().toLowerCase();
  const list = [...counts].filter(([, c]) => !q || c.name.toLowerCase().includes(q))
    .sort(([ka, a], [kb, b]) => state.brands.has(kb) - state.brands.has(ka) || b.n - a.n || a.name.localeCompare(b.name, 'sv'));
  const visible = q || brandsExpanded ? list : list.slice(0, Math.max(BRANDS_SHOWN, state.brands.size));
  $('#f-brands').innerHTML = visible.map(([k, c]) =>
    `<button class="chip" data-brand="${esc(k)}" aria-pressed="${state.brands.has(k)}">${esc(c.name)} <span class="n">${c.n}</span></button>`).join('') ||
    '<span class="muted">No brands match</span>';
  const more = $('#f-brands-more');
  more.hidden = !!q || list.length <= BRANDS_SHOWN;
  more.textContent = brandsExpanded ? 'Show fewer' : `Show all ${list.length} brands`;
}

function priceHtml(p) {
  const title = p.local ? ` title="${esc(localPrice(p))}"` : '';
  return p.compareAt
    ? `<span class="price sale"${title}>${approx(p)}${sek(p.price)}<s>${sek(p.compareAt)}</s></span>`
    : `<span class="price"${title}>${approx(p)}${sek(p.price)}</span>`;
}

// Colour dots per colourway; colourways in the chosen palette are ringed.
function swatchesHtml(p) {
  if (!p._swatches?.length) return '';
  const hits = new Set(targets.length ? matchingColorways(p, targets, palette.match, palette.exclude).map((s) => s.name) : []);
  const dots = p._swatches.slice(0, 8).map((s) => `<i class="dot ${hits.has(s.name) ? 'hit' : ''}" style="background:${esc(s.hex)}" title="${esc(s.name)}"></i>`).join('');
  const m = p._pm;
  const label = m
    ? `<span class="hit-label" title="${esc(`${m.swatch.name} (${m.swatch.source === 'photo' ? 'colour read from photo' : 'from colour name'}) ≈ ${m.target.name}, ΔE ${m.dE.toFixed(1)}`)}">≈ ${esc(m.target.name)}</span>`
    : '';
  return `<span class="dots">${dots}${p._swatches.length > 8 ? '<span class="muted">+</span>' : ''}${label}</span>`;
}

const SECTIONS = ['Your signature colours', 'Your neutrals', 'Rated not my colour'];

function render() {
  const groups = [0, 0, 0];
  for (const p of filtered) groups[voteOf(p) < 0 ? 2 : p._pm?.kind === 'neutral' ? 1 : 0]++;
  $('#count').textContent = targets.length
    ? `${filtered.length} products in your palette · ${groups[0]} in signature colours · ${groups[1]} neutrals`
    : `${filtered.length} products`;
  let lastGroup = -1;
  $('#grid').innerHTML = filtered.slice(0, shown).map((p) => {
    const g = voteOf(p) < 0 ? 2 : p._pm?.kind === 'neutral' ? 1 : 0;
    const head = targets.length && g !== lastGroup ? `<h2 class="grid-section">${SECTIONS[g]} <span class="muted">${groups[g]}</span></h2>` : '';
    lastGroup = g;
    return head + cardHtml(p);
  }).join('');
  $('#more').hidden = shown >= filtered.length;
  updateCompareBar();
}

function voteHtml(p) {
  if (!targets.length) return '';
  const v = voteOf(p);
  return `<div class="vote"><span>In your palette?</span>
    <button data-vote="1" aria-pressed="${v > 0}" title="Yes, my colour">👍</button>
    <button data-vote="-1" aria-pressed="${v < 0}" title="No, not my colour">👎</button></div>`;
}

function cardHtml(p) {
  return `
    <article class="card ${p.available ? '' : 'oos'} ${targets.length && voteOf(p) < 0 ? 'rated-down' : ''}" data-id="${esc(p.id)}">
      <div class="img">${p.images[0] ? `<img loading="lazy" src="${esc(thumb(p.images[0]))}" alt="">` : ''}</div>
      ${p.compareAt ? `<span class="badge">−${Math.round((1 - p.price / p.compareAt) * 100)}%</span>` : ''}
      <label class="cmp"><input type="checkbox" ${compare.has(p.id) ? 'checked' : ''}> Compare</label>
      <div class="body">
        <span class="store">${esc(p.storeName)} · ${esc(p.brandLine ?? p.brand)}</span>
        <span class="title">${esc(displayTitle(p))}</span>
        <span class="sub">${esc(catLabel(p))}${p.features.length ? ` · ${esc(p.features.join(', '))}` : ''}</span>
        ${priceHtml(p)}
        ${swatchesHtml(p)}
        <span class="sub">${p.available ? `Sizes: ${esc([...new Set(p.sizesInStock.map(shortSize))].join(' ') || 'one size')}` : 'Sold out'}</span>
        ${voteHtml(p)}
      </div>
    </article>`;
}

// ---------- Compare ----------
function saveCompare() { store.set('compare', [...compare]); updateCompareBar(); }
function toggleCompare(id, input) {
  if (compare.has(id)) compare.delete(id);
  else if (compare.size >= 4) { alert('You can compare up to 4 products.'); input.checked = false; return; }
  else compare.add(id);
  input.checked = compare.has(id);
  saveCompare();
}
function updateCompareBar() {
  $('#compare-bar').hidden = compare.size === 0;
  $('#compare-count').textContent = `${compare.size} selected`;
}
async function openCompare() {
  const items = [...compare].map((id) => all.find((p) => p.id === id)).filter(Boolean);
  await Promise.all(items.map((p) => loadDetails(p).catch(() => p))); // materials + descriptions
  const row = (label, fn) => `<tr><th>${label}</th>${items.map((p) => `<td>${fn(p)}</td>`).join('')}</tr>`;
  $('#compare').innerHTML = `
    <div class="dlg-head"><h2>Compare</h2><button class="close" aria-label="Close">×</button></div>
    <div class="cmp-table"><table>
      ${row('', (p) => `<img src="${esc(thumb(p.images[0], 400))}" alt="">`)}
      ${row('Product', (p) => `<strong>${esc(displayTitle(p))}</strong><br><span class="muted">${esc(p.brand)} @ ${esc(p.storeName)}</span>`)}
      ${row('Price', priceHtml)}
      ${row('Category', (p) => esc(catLabel(p)))}
      ${row('Features', (p) => p.features.map((f) => `<span class="tag">${esc(f)}</span>`).join('') || '–')}
      ${row('Material', (p) => [(p.fabrics ?? []).map((f) => `<span class="tag">${esc(fabricLabel(f))}</span>`).join(''), esc(p.materials.join(', '))].filter(Boolean).join('<br>') || '–')}
      ${row('Sizes in stock', (p) => esc([...new Set(p.sizesInStock.map(shortSize))].join(' ')) || 'Sold out')}
      ${row('Description', (p) => `<div class="desc">${esc(p.description.slice(0, 600))}</div>`)}
      ${row('', (p) => `<button class="btn ghost" data-open="${esc(p.id)}">Details</button> <a class="btn ghost" href="${esc(p.url)}" target="_blank" rel="noopener">Store ↗</a>`)}
    </table></div>`;
  $('#compare').querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => { $('#compare').close(); openDetail(b.dataset.open); }));
  $('#compare').showModal();
}

// ---------- Detail ----------
async function openDetail(id) {
  const p = all.find((x) => x.id === id);
  if (!p) return;
  let selected = null;
  const canCart = p.cart === 'shopify';
  const lens = p.images[0] ? `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(p.images[0])}` : null;
  const shopping = `https://www.google.com/search?tbm=shop&gl=se&q=${encodeURIComponent(`${p.brand} ${p.title}`)}`;

  const d = $('#detail');
  d.innerHTML = `
    <div class="dlg-head"><h2>${esc(displayTitle(p))}</h2><button class="close" aria-label="Close">×</button></div>
    <div class="detail">
      <div class="gallery">
        <div class="main"><img id="main-img" src="${esc(thumb(p.images[0], 1000))}" alt=""></div>
        <div class="thumbs">${thumbsHtml(p)}</div>
      </div>
      <div class="info">
        <div class="muted">${esc(p.brand)} · sold by <strong>${esc(p.storeName)}</strong></div>
        ${priceHtml(p)}
        ${p.local ? `<div class="muted">${esc(localPrice(p))}</div>` : ''}
        <div>${p.features.map((f) => `<span class="tag">${esc(f)}</span>`).join('')}${(p.fabrics ?? []).map((f) => `<span class="tag">${esc(fabricLabel(f))}</span>`).join('')}<span class="tag">${esc(catLabel(p))}</span>${p.gender !== 'unisex' ? `<span class="tag">${p.gender}</span>` : ''}</div>
        ${p.colors.length ? `<h3>Colour</h3><div>${swatchesHtml(p) || esc(p.colors.join(', '))}${p._swatches.length ? `<div class="muted">${esc(p.colors.join(', '))}</div>` : ''}</div>` : ''}
        <h3>Size</h3>
        <div class="sizes">${p.variants.map((v, i) => `<button class="size" data-variant="${i}" ${v.available ? '' : 'disabled'} aria-pressed="false">${esc(v.size ?? 'One size')}${p.colors.length > 1 && v.color ? ` · ${esc(v.color)}` : ''}</button>`).join('')}</div>
        <div class="actions">
          ${canCart ? `<a id="add-cart" class="btn" target="_blank" rel="noopener" aria-disabled="true">Select a size</a>` : ''}
          <a class="btn ${canCart ? 'ghost' : ''}" href="${esc(p.url)}" target="_blank" rel="noopener">View at ${esc(p.storeName)} ↗</a>
        </div>
        ${canCart ? `<p class="note">Opens ${esc(p.storeName)}'s own cart with the size added. Checkout happens on their site.</p>` : ''}
        <h3>Find it elsewhere</h3>
        <div class="actions" style="margin-top:0">
          ${lens ? `<a class="btn ghost" href="${esc(lens)}" target="_blank" rel="noopener">Google Lens (image) ↗</a>` : ''}
          <a class="btn ghost" href="${esc(shopping)}" target="_blank" rel="noopener">Google Shopping ↗</a>
        </div>
        <div id="d-material"></div>
        <h3>Description</h3>
        <div class="desc">Loading…</div>
        <h3>Price history</h3>
        <div class="history" id="history">Loading…</div>
        <p class="note" id="d-seen"></p>
      </div>
    </div>`;

  d.querySelector('.thumbs').addEventListener('click', (e) => {
    const img = e.target.closest('img');
    if (!img) return;
    d.querySelectorAll('.thumbs img').forEach((i) => i.classList.toggle('on', i === img));
    d.querySelector('#main-img').src = thumb(img.dataset.src, 1000);
  });
  d.querySelector('.sizes').addEventListener('click', async (e) => {
    const b = e.target.closest('.size:not([disabled])');
    if (!b) return;
    d.querySelectorAll('.size').forEach((x) => x.setAttribute('aria-pressed', x === b));
    try { await loadDetails(p); } catch { return; } // the variants' ids come with the details file
    if (b.getAttribute('aria-pressed') !== 'true') return;
    selected = p.variants[Number(b.dataset.variant)]?.id;
    const cart = d.querySelector('#add-cart');
    if (cart && selected) {
      cart.href = `${p.storeBase}/cart/${selected}:1?storefront=true`;
      cart.textContent = `Add to cart at ${p.storeName} ↗`;
      cart.removeAttribute('aria-disabled');
    }
  });
  d.querySelector('#add-cart')?.addEventListener('click', (e) => { if (!selected) e.preventDefault(); });
  d.dataset.id = p.id;
  d.showModal();

  try { await loadDetails(p); } catch { $('#history').textContent = 'Could not load the details. Try again in a moment.'; return; }
  if (d.open && d.dataset.id === p.id) fillDetail(p);
}

const thumbsHtml = (p) => p.images.map((src, i) => `<img data-src="${esc(src)}" class="${i ? '' : 'on'}" src="${esc(thumb(src, 150))}" alt="">`).join('');

// The parts that come from the product's details file (all photos, material, description, price history).
function fillDetail(p) {
  const d = $('#detail');
  d.querySelector('.thumbs').innerHTML = thumbsHtml(p);
  d.querySelector('#d-material').innerHTML = p.materials.length ? `<h3>Material</h3><div>${esc(p.materials.join(', '))}</div>` : '';
  d.querySelector('.desc').textContent = p.description || '–';
  d.querySelector('#history').innerHTML = historyHtml(p.history ?? []);
  d.querySelector('#d-seen').textContent = `First seen ${p.firstSeen ?? '–'} · last checked ${p.lastSeen ?? p.collectedAt ?? '–'}`;
}

// ---------- Add store ----------
// 1. Shopify stores can be read straight from the browser (their feed allows it), so products
//    show up right away. 2. To keep the store, a pre-filled GitHub issue is opened; the
//    "Add store" workflow detects the platform, adds it to stores.json and redeploys.
function openAddStore() {
  const d = $('#add-store');
  d.innerHTML = `
    <div class="dlg-head"><h2>Add a store</h2><button class="close" aria-label="Close">×</button></div>
    <form class="add-form" method="dialog">
      <label>Store URL <input name="url" type="text" inputmode="url" required placeholder="https://www.example.com/se/" autocomplete="off"></label>
      <label>Name (optional) <input name="name" placeholder="e.g. Runners Lab" autocomplete="off"></label>
      <div class="actions"><button class="btn" type="submit">Add store</button></div>
      <div id="add-result" class="add-result"></div>
    </form>`;
  d.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    await addStore(String(f.get('url')).trim(), String(f.get('name') ?? '').trim());
  });
  d.showModal();
  d.querySelector('input[name=url]').focus();
}

async function addStore(rawUrl, name) {
  const out = $('#add-result');
  let url;
  try {
    url = new URL(/^https?:\/\//.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
  } catch {
    out.innerHTML = '<p class="warn">That doesn\'t look like a web address.</p>';
    return;
  }
  const existing = stores.find((s) => new URL(s.base).hostname === url.hostname);
  if (existing) {
    out.innerHTML = `<p><strong>${esc(existing.name)}</strong> is already in your list.</p>`;
    return;
  }

  out.innerHTML = '<p class="muted">Checking the store…</p>';
  const id = url.hostname.replace(/^www\./, '').split('.')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
  const displayName = name || url.hostname.replace(/^www\./, '').split('.')[0].replace(/^./, (c) => c.toUpperCase());
  const isShopify = await fetch(`${url.origin}/products.json?limit=1`)
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => Array.isArray(j?.products))
    .catch(() => false);

  const pending = {
    id, name: displayName, base: url.href.replace(/\/+$/, ''), ...(isShopify ? shopifyLocation(url) : {}),
    origin: url.origin, platform: isShopify ? 'shopify' : 'unknown', country: 'SE', addedAt: new Date().toISOString().slice(0, 10),
  };
  store.set('pendingStores', [...store.get('pendingStores', []), pending]);
  stores.push({ ...pending, pending: true });
  renderStoreChips();
  if (isShopify) loadLive(pending);

  const issue = `https://github.com/${REPO}/issues/new?` + new URLSearchParams({
    title: `Add store: ${url.href}`,
    body: `name: ${displayName}\n\nOpened from Runnista. The "Add store" workflow detects how to read this store, adds it to data/stores.json and refreshes the site.`,
  });
  out.innerHTML = `
    ${isShopify
      ? `<p>✅ <strong>${esc(displayName)}</strong> is a Shopify store: its products are loading in the background now.</p>`
      : `<p>ℹ️ <strong>${esc(displayName)}</strong> can't be read directly from the browser. The GitHub job will work out how to fetch it (store API, sitemap, or a Claude in Chrome import).</p>`}
    <p><strong>Save it permanently:</strong> submit the GitHub issue that opens. The daily job will then include this store.</p>
    <a class="btn" href="${esc(issue)}" target="_blank" rel="noopener">Open GitHub issue ↗</a>`;
}

// Removes a store added in this browser (it stays in stores.json if the GitHub issue was submitted).
function removePending(id) {
  store.set('pendingStores', store.get('pendingStores', []).filter((s) => s.id !== id));
  stores = stores.filter((s) => !(s.pending && s.id === id));
  state.hiddenStores.delete(id);
  saveHiddenStores(state.hiddenStores);
  liveStatus.delete(id);
  all = all.filter((p) => p.store !== id);
  buildFilters();
  apply();
}

// Fetches a Shopify store's products in the browser and merges them into the list.
async function loadLive(s) {
  const fetched = [];
  try {
    for (let page = 1; page <= 40; page++) {
      liveStatus.set(s.id, `loading ${fetched.length}…`);
      renderStoreChips();
      const res = await fetch(shopifyPageUrl(s, page));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { products } = await res.json();
      if (!products?.length) break;
      fetched.push(...attachSwatches(products.filter((p) => !isGiftCard(p)).map((p) => withText({ ...fromShopify(s, p), live: true, details: true })), colorOverrides));
    }
    liveStatus.delete(s.id);
  } catch (err) {
    console.warn(`Live fetch failed for ${s.name}:`, err);
    liveStatus.set(s.id, 'error');
  }
  computeMatches(fetched);
  all = all.filter((p) => p.store !== s.id).concat(fetched);
  buildFilters();
  apply();
}
