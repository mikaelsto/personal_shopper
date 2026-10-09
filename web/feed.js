// Runnista as a feed: one product per screen, swipe up for the next one (like Reels and
// TikTok) and drag the photo left for its details. The photo's footer is the navigation: ☰ opens
// a layer with saved products (♥), colours, categories (and stores) and sizes. Same data, palette matching and
// unchecked stores as the grid (grid.html).
// The product page opens in a new tab, from the photo or the "To the product page" link.
// This is the start page: the Rust build (site/) pre-renders its first products into index.html,
// and rebuild() takes them over (keeping their photos) once the feed has loaded.

import { TAXONOMY, label } from './lib/taxonomy.mjs';
import { fabricLabel } from './lib/normalize.mjs';
import { PALETTES, FAMILIES, paletteById } from './lib/palettes.mjs';
import {
  loadSelection, saveSelection, isActive, targetColors, attachSwatches, matchingColorways, matchInfo,
  loadColorOverrides, colorName, EXCLUDABLE, passesExclude, voteKey, FEEDBACK_LINES_PER_ISSUE, sendVotes,
} from './palette-filter.js';
import {
  esc, sek, store, catLabel, displayTitle, thumb, srcset, sizeLetter, shortSize, historyHtml, loadFeed, loadDetails,
  loadHiddenStores, saveHiddenStores, approx, localPrice, loadSaved, isSaved, toggleSaved,
} from './shop-utils.js';

const BATCH = 6; // slides added at a time, a few ahead of the one on screen
const HIDDEN_DEPTS = TAXONOMY.filter((d) => d.hidden).map((d) => d.id);
const wide = matchMedia('(min-width: 900px)'); // photo and details side by side, no dragging
const motion = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

const ICON = {
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
  out: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 16L17 7M9 7h8v8"/></svg>',
  heart: '<svg class="heart" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-9.3-9.2C1.4 7.4 3.6 4 7 4c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.4 0 5.6 3.4 4.3 6.8C19.5 15.4 12 20 12 20z"/></svg>',
};

// ---------- Sizes ----------
// "Your sizes" per size system. A product is only filtered on the systems it's sized in, so
// picking M doesn't hide shoes and picking US 9 doesn't hide T-shirts or one-size caps.
const range = (from, to, step) => Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => String(from + i * step));
const SIZE_GROUPS = [
  { id: 'letter', label: 'Clothing', prefix: '', sizes: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'] },
  { id: 'us', label: 'Shoes · US', prefix: 'US ', sizes: range(4, 14, 0.5) },
  { id: 'eu', label: 'Shoes · EU', prefix: 'EU ', sizes: range(35, 48, 1) },
];
const FRACTIONS = { '½': 0.5, '⅓': 0.33, '⅔': 0.67 };
const toNum = (s) => parseFloat(s.replace(',', '.')) + (FRACTIONS[s.slice(-1)] ?? 0);

// A variant's size per system: { letter: 'M' }, { us: '9.5' }, { eu: '42' } or both us + eu
// ("US M8 / US W9 / UK 7½ / EU 41"). EU halves and thirds count as the whole size below.
function sizeOf(raw, gender) {
  const s = String(raw ?? '').trim();
  const letter = sizeLetter(s);
  if (letter) return { letter };
  const us = s.match(gender === 'women' ? /US W\s*([\d.,]+½?)/ : /US M\s*([\d.,]+½?)/)?.[1];
  const eu = s.match(/EU\s*([\d.,]+[½⅓⅔]?)/)?.[1];
  if (us || eu) return { us: us && String(toNum(us)), eu: eu && String(Math.floor(toNum(eu))) };
  const plain = s.match(/^(\d+(?:[.,]5)?)(?:\s+(?:\d?E|[A-D]))?$/i)?.[1]; // "9.5", "10 2E", "42"
  if (!plain) return {};
  const n = toNum(plain);
  return n < 20 ? { us: String(n) } : n <= 50 ? { eu: String(Math.floor(n)) } : {};
}
const isMine = (sz) => SIZE_GROUPS.some((g) => sz[g.id] && state.sizes[g.id].includes(sz[g.id]));

// ---------- State ----------
const emptySizes = () => Object.fromEntries(SIZE_GROUPS.map((g) => [g.id, []]));
const saved = store.get('feedFilters', {});
const state = {
  category: saved.category ?? '',
  gender: saved.gender ?? '',
  sizes: { ...emptySizes(), ...saved.sizes },
  tab: saved.tab ?? 'colours',
};
readUrl();

let all = [];
let stores = []; // [{ id, name }] from the products, by name
let hiddenStores = loadHiddenStores(); // unchecked in the shop or here
let filtered = [];
let rendered = 0; // slides in the DOM
let current = 0; // slide on screen
let palette = loadSelection(); // shared with the shop and the palette page
let targets = targetColors(palette);
let dirty = false; // filters changed while the navigation layer was open
const votes = store.get('paletteVotes', {}); // 👍/👎 "in my palette?", shared with the shop
const voteOf = (p) => votes[`${p.id} ${voteKey(palette)}`]?.v ?? 0;
let savedList = loadSaved(); // ♥ products, shared with the shop
const byId = new Map();

// Shared links: ?cat=tops/t-shirts&for=men&size=M,US9.5,EU42 (palette params are handled by palette-filter.js).
function readUrl() {
  const q = new URLSearchParams(location.search);
  if (q.has('cat')) state.category = q.get('cat');
  if (q.has('for')) state.gender = ['men', 'women'].includes(q.get('for')) ? q.get('for') : '';
  if (q.has('size')) {
    state.sizes = emptySizes();
    for (const raw of q.get('size').split(',')) {
      const [, sys, val] = raw.match(/^(US|EU)?\s*(.+)$/i) ?? [];
      const g = SIZE_GROUPS.find((x) => x.id === (sys ? sys.toLowerCase() : 'letter'));
      const v = g?.id === 'letter' ? val?.toUpperCase() : val;
      if (g?.sizes.includes(v)) state.sizes[g.id].push(v);
    }
  }
}

function saveFilters() {
  store.set('feedFilters', state);
  const q = new URLSearchParams(location.search);
  const sizes = SIZE_GROUPS.flatMap((g) => state.sizes[g.id].map((s) => `${g.prefix.trim()}${s}`));
  for (const [k, v] of [['cat', state.category], ['for', state.gender], ['size', sizes.join(',')]]) v ? q.set(k, v) : q.delete(k);
  history.replaceState(null, '', `${location.pathname}${q.size ? `?${q}` : ''}`);
}

// ---------- Filtering ----------
const inCategory = (p, value) =>
  value ? value.split('+').some((v) => p.category === v || p.subcategory === v) : !HIDDEN_DEPTS.includes(p.category);
const inPalette = (p) => passesExclude(p, palette.exclude) && (!targets.length || !!p._pm);
const forGender = (p) => !state.gender || p.gender === state.gender || p.gender === 'unisex';
const inStores = (p) => !hiddenStores.has(p.store);
const fitsSizes = (p) => SIZE_GROUPS.every(({ id }) => {
  const want = state.sizes[id];
  if (!want.length || !p._sz.some((v) => v[id])) return true;
  return p._sz.some((v) => v.available && want.includes(v[id]));
});
// Everything except the category, so the category list can show what each one would give.
const passesBase = (p) => p.available && inStores(p) && inPalette(p) && forGender(p) && fitsSizes(p);

function computeMatches() {
  for (const p of all) p._pm = targets.length ? matchInfo(p, targets, palette.match, palette.exclude) : null;
}

// A fresh order every day that stays put while you browse. With a palette: signature colours,
// then neutrals, then products you rated 👎; closest matches first, mixed within each step.
// The day is the build's (feed.json), so the order matches the pre-rendered first products.
const TODAY = new Date().toISOString().slice(0, 10);
let DAY = TODAY;
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
const group = (p) => (voteOf(p) < 0 ? 2 : p._pm?.kind === 'neutral' ? 1 : 0);

function apply() {
  filtered = all.filter((p) => passesBase(p) && inCategory(p, state.category));
  filtered.sort(targets.length
    ? (a, b) => group(a) - group(b) || Math.floor(a._pm.dE / 4) - Math.floor(b._pm.dE / 4) || a._rnd - b._rnd
    : (a, b) => a._rnd - b._rnd);
}

// ---------- Init ----------
const $ = (s, el = document) => el.querySelector(s);
const feed = $('#feed');
const sheet = $('#sheet');

init();

async function init() {
  try {
    const [data, overrides] = await Promise.all([loadFeed(), loadColorOverrides()]);
    all = attachSwatches(data.products.filter((p) => p.images.length), overrides);
    DAY = data.day ?? TODAY;
    stores = [...new Map(all.map((p) => [p.store, { id: p.store, name: p.storeName }])).values()]
      .sort((a, b) => a.name.localeCompare(b.name, 'sv'));
  } catch (err) {
    console.error(err);
    $('#loading').textContent = 'Could not load products. Try again in a minute.';
    return;
  }
  for (const p of all) {
    p._sz = p.variants.map((v) => ({ ...sizeOf(v.size, p.gender), available: v.available }));
    p._rnd = hash(`${DAY} ${p.id}`);
    byId.set(p.id, p);
  }
  computeMatches();
  apply();
  rebuild();
  $('#loading').remove();
  bindFeed();
  bindSheet();
}

// ---------- Feed ----------
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    const slide = e.target;
    if (e.intersectionRatio >= 0.6) {
      current = Number(slide.dataset.i);
      if (current >= rendered - 3) appendBatch();
      fetchDetails(current);
      fetchDetails(current + 1);
    } else if (!e.isIntersecting) {
      // Back on the photo when you return to a product.
      const pager = $('.pager', slide);
      if (pager?.scrollLeft) pager.scrollLeft = 0;
    }
  }
}, { root: feed, threshold: [0, 0.6] });

let footer = ''; // the same navigation footer on every photo
function rebuild() {
  io.disconnect();
  // The build's pre-rendered first products: when they're the same products in the same order,
  // their photos (already loaded) move into the new slides and you stay where you scrolled to.
  const pre = [...feed.querySelectorAll('.slide[data-pre]')];
  const same = pre.length > 0 && pre.every((s, i) => s.dataset.id === filtered[i]?.id);
  const top = feed.scrollTop;
  rendered = 0;
  current = 0;
  footer = footerHtml();
  feed.innerHTML = filtered.length ? '' : emptyHtml();
  appendBatch();
  if (same) {
    for (const [i, s] of pre.entries()) {
      const img = $('.shot img', s);
      $('.shot img', slideAt(i)).replaceWith(img);
      fit(img);
    }
  }
  feed.scrollTo({ top: same ? top : 0 });
}

function appendBatch() {
  if (rendered >= filtered.length) return;
  const end = Math.min(rendered + BATCH, filtered.length);
  const html = filtered.slice(rendered, end).map((p, k) => slideHtml(p, rendered + k)).join('');
  feed.insertAdjacentHTML('beforeend', html + (end === filtered.length ? endHtml() : ''));
  feed.querySelectorAll('.slide[data-i]:not([data-seen])').forEach((s) => { s.dataset.seen = ''; io.observe(s); });
  rendered = end;
}

const slideAt = (i) => feed.querySelector(`.slide[data-i="${i}"]`);
function goTo(i) {
  if (i < 0 || i >= filtered.length) return;
  while (rendered <= i) appendBatch();
  feed.scrollTo({ top: slideAt(i).offsetTop, behavior: motion() });
}
const showDetails = (slide) => { const pager = $('.pager', slide); pager?.scrollTo({ left: pager.scrollWidth, behavior: motion() }); };
const showPhoto = (slide) => $('.pager', slide)?.scrollTo({ left: 0, behavior: motion() });
const onDetails = (slide) => !wide.matches && $('.pager', slide)?.scrollLeft > 0;

function priceHtml(p) {
  const title = p.local ? ` title="${esc(localPrice(p))}"` : '';
  if (!p.compareAt) return `<span class="price"${title}>${approx(p)}${sek(p.price)}</span>`;
  return `<span class="price sale"${title}>${approx(p)}${sek(p.price)}</span><s>${sek(p.compareAt)}</s><span class="off">−${Math.round((1 - p.price / p.compareAt) * 100)}%</span>`;
}

function dotsHtml(p, max = 6) {
  if (!p._swatches?.length) return '';
  const hits = new Set(targets.length ? matchingColorways(p, targets, palette.match, palette.exclude).map((s) => s.name) : []);
  return `<span class="dots">${p._swatches.slice(0, max).map((s) =>
    `<i class="dot ${hits.has(s.name) ? 'hit' : ''}" style="background:${esc(s.hex)}" title="${esc(s.name)}"></i>`).join('')}${p._swatches.length > max ? `<span class="more">+${p._swatches.length - max}</span>` : ''}</span>`;
}

// Sizes in stock, yours in bold: "S · M · L".
function stockSizesHtml(p, max = 8) {
  const sizes = new Map();
  p.variants.forEach((v, i) => {
    if (!v.available) return;
    const s = v.size && !/^(one ?size|os|no size)$/i.test(v.size) ? shortSize(v.size) : 'One size';
    sizes.set(s, sizes.get(s) || isMine(p._sz[i]));
  });
  const list = [...sizes];
  return list.slice(0, max).map(([s, mine]) => (mine ? `<b>${esc(s)}</b>` : esc(s))).join(' · ') +
    (list.length > max ? ` · +${list.length - max}` : '');
}

function slideHtml(p, i) {
  const img = p.images[0];
  const title = displayTitle(p);
  const pos = `${i + 1} / ${filtered.length}`;
  const m = p._pm;
  const hint = i === 0 && !wide.matches && !store.get('feedHintSeen', false);
  return `
  <article class="slide ${hint ? 'hint' : ''}" data-i="${i}" data-id="${esc(p.id)}" aria-roledescription="product" aria-label="${esc(title)}, ${pos}">
    <div class="pager">
      <section class="pane media">
        <a class="shot" href="${esc(p.url)}" target="_blank" rel="noopener" draggable="false" title="To the product page at ${esc(p.storeName)}">
          <img src="${esc(thumb(img, 1080))}" ${srcset(img) ? `srcset="${esc(srcset(img))}" sizes="(min-width: 900px) 57vw, 100vw"` : ''} alt="${esc(title)}" draggable="false" ${i < 2 ? 'fetchpriority="high"' : 'loading="lazy"'}>
        </a>
        <span class="pos" aria-hidden="true">${pos}</span>
        <button class="peek" data-action="details" aria-label="Product details">${ICON.left}</button>
        ${saveBtnHtml(p, 'save')}
        ${hint ? '<span class="coach" aria-hidden="true">Drag the photo left for details</span>' : ''}
        <div class="caption">
          <p class="who"><span class="store-tag">${esc(p.storeName)}</span>${esc(p.brand)}</p>
          <h2 class="title">${esc(title)}</h2>
          <p class="price-row">${priceHtml(p)}</p>
          <p class="meta">${dotsHtml(p)}${m ? `<span class="match">≈ ${esc(m.target.name)}</span>` : ''}<span class="stock">${stockSizesHtml(p)}</span></p>
        </div>
        ${footer}
      </section>
      <section class="pane info" aria-label="Details">${infoHtml(p, pos)}</section>
    </div>
  </article>`;
}

function infoHtml(p, pos) {
  const canCart = p.cart === 'shopify';
  const lens = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(p.images[0])}`;
  const shopping = `https://www.google.com/search?tbm=shop&gl=se&q=${encodeURIComponent(`${p.brand} ${p.title}`)}`;
  const m = p._pm;
  const tags = [catLabel(p), p.gender !== 'unisex' ? p.gender : null, ...p.features, ...(p.fabrics ?? []).map(fabricLabel)].filter(Boolean);
  const size = (v, i) => {
    const text = `${esc(v.size ?? 'One size')}${p.colors.length > 1 && v.color ? ` · ${esc(v.color)}` : ''}`;
    const cls = `size ${isMine(p._sz[i]) ? 'mine' : ''}`;
    return canCart
      ? `<button class="${cls}" data-variant="${i}" ${v.available ? '' : 'disabled'} aria-pressed="false">${text}</button>`
      : `<span class="${cls} ${v.available ? '' : 'out'}">${text}</span>`;
  };
  return `
    <header class="info-top">
      <button class="back" data-action="photo">${ICON.left}Photo</button>
      <span class="pos">${pos}</span>
      ${saveBtnHtml(p, 'save small')}
    </header>
    <p class="who"><span class="store-tag">${esc(p.storeName)}</span>${esc(p.brand)}</p>
    <h2 class="info-title">${esc(displayTitle(p))}</h2>
    <p class="price-row big">${priceHtml(p)}</p>
    ${p.local ? `<p class="note">${esc(localPrice(p))}</p>` : ''}
    <a class="cta" href="${esc(p.url)}" target="_blank" rel="noopener">To the product page ${ICON.out}</a>

    ${p._swatches?.length || p.colors.length ? `<section>
      <h3>Colour</h3>
      <div class="colour-row">${dotsHtml(p, 12)}<span>${esc(p.colors.join(', ') || colorName(p._swatches[0].hex))}</span></div>
      ${m ? `<p class="note">${m.kind === 'neutral' ? 'A neutral' : 'A signature colour'} in your palette: ${esc(m.swatch.name)} ≈ ${esc(m.target.name)}${m.swatch.source === 'photo' ? ' (colour read from the photo)' : ''}</p>` : ''}
      ${targets.length ? `<div class="vote" data-id="${esc(p.id)}"><span>In your palette?</span>
        <button data-vote="1" aria-pressed="${voteOf(p) > 0}" aria-label="Yes, my colour">👍</button>
        <button data-vote="-1" aria-pressed="${voteOf(p) < 0}" aria-label="No, not my colour">👎</button></div>` : ''}
    </section>` : ''}

    <section>
      <h3>Sizes</h3>
      <div class="sizes">${p.variants.map(size).join('')}</div>
      ${canCart ? `<a class="cta ghost cart" target="_blank" rel="noopener" aria-disabled="true">Pick a size to add it to the cart</a>
        <p class="note">Opens ${esc(p.storeName)}'s own cart with the size added. Checkout happens on their site.</p>` : ''}
    </section>

    <section>
      <h3>About</h3>
      <div class="tags">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      ${detailsHtml(p)}
    </section>

    <section>
      <h3>Find it elsewhere</h3>
      <div class="links">
        <a class="cta ghost" href="${esc(lens)}" target="_blank" rel="noopener">Google Lens ${ICON.out}</a>
        <a class="cta ghost" href="${esc(shopping)}" target="_blank" rel="noopener">Google Shopping ${ICON.out}</a>
      </div>
    </section>

    <button class="next" data-action="next">Next product ${ICON.down}</button>`;
}

const saveBtnHtml = (p, cls) => {
  const on = isSaved(savedList, p.id);
  return `<button class="${cls}" data-save="${esc(p.id)}" aria-pressed="${on}" aria-label="${on ? 'Remove from' : 'Save to'} your saved products">${ICON.heart}</button>`;
};
const savedCountHtml = () => (savedList.length ? `<span class="count">${savedList.length}</span>` : '');

// The photo's footer: ☰, ♥ (saved products), then one pill per section, showing what's chosen.
function footerHtml() {
  const s = summary();
  const pill = (tab, text, on, extra = '') =>
    `<button class="pill ${on ? 'on' : ''}" data-sheet="${tab}">${extra}<span>${esc(text)}</span></button>`;
  const strip = s.season ? `<span class="strip">${s.season.colors.map((c) => `<i style="background:${esc(c.hex)}"></i>`).join('')}</span>` : '';
  return `
    <footer class="bar">
      <button class="menu" data-sheet="" aria-label="Open navigation: saved, colours, categories and sizes">${ICON.menu}</button>
      <button class="saved-btn ${savedList.length ? 'on' : ''}" data-sheet="saved" aria-label="Saved products (${savedList.length})">${ICON.heart}${savedCountHtml()}</button>
      ${pill('colours', s.colours ?? 'Colours', !!s.colours, strip)}
      ${pill('categories', s.categories ?? 'Categories', !!s.categories)}
      ${pill('sizes', s.sizes ?? 'Sizes', !!s.sizes)}
    </footer>`;
}

function summary() {
  const out = {};
  const seasons = palette.palettes.map((id) => paletteById[id]).filter(Boolean);
  if (seasons.length) {
    out.season = seasons[0];
    out.colours = seasons.length > 1 ? `${seasons[0].label} +${seasons.length - 1}` : seasons[0].label;
  } else if (palette.colors.length) out.colours = `${palette.colors.length} colour${palette.colors.length > 1 ? 's' : ''}`;
  else if (palette.exclude?.length) out.colours = `Hiding ${palette.exclude.length}`;
  const cat = state.category === 'tops+midlayers' ? 'Tops & mid layers'
    : state.category ? (TAXONOMY.find((d) => d.id === state.category) ? `All ${label(state.category).toLowerCase()}` : label(state.category)) : null;
  const who = { men: 'Men', women: 'Women' }[state.gender];
  if (cat || who) out.categories = [cat, who].filter(Boolean).join(' · ');
  const sizes = SIZE_GROUPS.flatMap((g) => state.sizes[g.id].map((s) => `${g.prefix}${s}`));
  if (sizes.length) out.sizes = sizes.join(', ');
  return out;
}

function emptyHtml() {
  return `
  <article class="slide end">
    <div class="end-card">
      <p class="big">Nothing matches</p>
      <p>No products in stock for these colours, categories and sizes${hiddenStores.size ? ` in the stores you've checked (under Categories)` : ''}.</p>
      <button class="btn primary" data-sheet="">Change filters</button>
      <button class="btn ghost" data-action="clear">Clear all</button>
    </div>
  </article>`;
}

function endHtml() {
  return `
  <article class="slide end">
    <div class="end-card">
      <p class="big">That's all</p>
      <p>You've seen all ${filtered.length} products for these filters.</p>
      <button class="btn primary" data-action="top">Back to the first</button>
      <button class="btn ghost" data-sheet="">Change filters</button>
      <a class="classic" href="grid.html">Classic grid view</a>
    </div>
  </article>`;
}

// Show the whole photo on white (most product shots are packshots on white) unless it nearly
// fills the screen anyway, then it fills edge to edge.
function fit(img) {
  const pane = img.closest('.media');
  if (!pane || !img.naturalWidth) return;
  const ratio = (img.naturalHeight / img.naturalWidth) / (pane.clientHeight / pane.clientWidth);
  img.classList.toggle('fill', Math.abs(ratio - 1) < 0.06);
}

// The part of the details that comes from the product's own file (placeholder until it's loaded).
function detailsHtml(p) {
  if (!p.details) return '<div class="details" data-details><p class="note">Loading the description…</p></div>';
  return `<div class="details">
    ${p.materials.length ? `<p class="materials">${esc(p.materials.join(', '))}</p>` : ''}
    ${p.description ? `<p class="desc">${esc(p.description)}</p>` : ''}
    ${p.images.length > 1 ? `<section>
      <h3>More photos</h3>
      <div class="photos">${p.images.slice(1).map((src) =>
        `<a href="${esc(p.url)}" target="_blank" rel="noopener" draggable="false"><img src="${esc(thumb(src, 400))}" alt="" loading="lazy" draggable="false"></a>`).join('')}</div>
    </section>` : ''}
    <section>
      <h3>Price history</h3>
      <div class="history">${historyHtml(p.history ?? [])}</div>
      <p class="note">First seen ${esc(p.firstSeen ?? '–')} · last checked ${esc(p.lastSeen ?? '–')}</p>
    </section>
  </div>`;
}

// Fetched for the product on screen and the next one.
function fetchDetails(i) {
  const p = filtered[i];
  if (!p || p.details) return;
  loadDetails(p).then(() => {
    feed.querySelectorAll(`.slide[data-id="${CSS.escape(p.id)}"] [data-details]`).forEach((el) => { el.outerHTML = detailsHtml(p); });
  }, () => {}); // offline: tried again next time it's on screen
}

// ♥ on or off: every copy of the product's button, the footer counts and the Saved tab follow.
function save(id) {
  const p = byId.get(id) ?? savedList.find((x) => x.id === id);
  if (!p) return;
  savedList = toggleSaved(savedList, p);
  const on = isSaved(savedList, id);
  document.querySelectorAll(`[data-save="${CSS.escape(id)}"]`).forEach((b) => {
    b.setAttribute('aria-pressed', on);
    b.setAttribute('aria-label', `${on ? 'Remove from' : 'Save to'} your saved products`);
  });
  footer = footerHtml();
  feed.querySelectorAll('.saved-btn').forEach((b) => {
    b.classList.toggle('on', savedList.length > 0);
    b.setAttribute('aria-label', `Saved products (${savedList.length})`);
    b.innerHTML = ICON.heart + savedCountHtml();
  });
  if (sheet.open) renderSheet();
}

function vote(slide, btn) {
  const box = btn.closest('.vote');
  const key = `${box.dataset.id} ${voteKey(palette)}`;
  const v = Number(btn.dataset.vote);
  if (votes[key]?.v === v) delete votes[key];
  else votes[key] = { v, at: TODAY, sent: false };
  store.set('paletteVotes', votes);
  // Not re-sorted now (the feed would jump); a 👎 product moves to the end next time.
  box.querySelectorAll('[data-vote]').forEach((b) => b.setAttribute('aria-pressed', votes[key]?.v === Number(b.dataset.vote)));
}

// The variants' ids (for the cart link) come with the product's details file.
async function pickSize(slide, btn) {
  const p = filtered[Number(slide.dataset.i)];
  slide.querySelectorAll('.size[data-variant]').forEach((b) => b.setAttribute('aria-pressed', b === btn));
  const cart = $('.cart', slide);
  try { await loadDetails(p); } catch { return; }
  const id = p.variants[Number(btn.dataset.variant)]?.id;
  if (!id || btn.getAttribute('aria-pressed') !== 'true') return;
  cart.href = `${p.storeBase}/cart/${id}:1?storefront=true`;
  cart.innerHTML = `Add to cart at ${esc(p.storeName)} ${ICON.out}`;
  cart.removeAttribute('aria-disabled');
}

function bindFeed() {
  let suppressClick = false;
  feed.addEventListener('click', (e) => {
    if (suppressClick) { suppressClick = false; e.preventDefault(); e.stopPropagation(); return; }
    const slide = e.target.closest('.slide');
    const t = e.target.closest('[data-action], [data-sheet], [data-save], [data-vote], .size[data-variant], .cart[aria-disabled]');
    if (!t) return;
    if (t.matches('.cart')) return e.preventDefault();
    if (t.dataset.sheet != null) return openSheet(t.dataset.sheet || state.tab);
    if (t.dataset.save) return save(t.dataset.save);
    if (t.dataset.vote) return vote(slide, t);
    if (t.dataset.variant) return pickSize(slide, t);
    const action = t.dataset.action;
    if (action === 'details') showDetails(slide);
    else if (action === 'photo') showPhoto(slide);
    else if (action === 'next') goTo(Number(slide.dataset.i) + 1);
    else if (action === 'top') feed.scrollTo({ top: 0, behavior: motion() });
    else if (action === 'clear') clearAll();
  }, true);

  // Scroll events don't bubble, but they can be caught on the way down.
  feed.addEventListener('scroll', (e) => {
    const pager = e.target;
    if (!pager.classList?.contains('pager') || pager.scrollLeft < 20) return;
    if (!store.get('feedHintSeen', false)) {
      store.set('feedHintSeen', true);
      feed.querySelectorAll('.slide.hint').forEach((s) => s.classList.remove('hint'));
    }
    if (pager.scrollLeft > pager.clientWidth / 2) fetchDetails(Number(pager.closest('.slide').dataset.i));
  }, { capture: true, passive: true });

  feed.addEventListener('load', (e) => { if (e.target.matches?.('.shot img')) fit(e.target); }, true);
  feed.addEventListener('error', (e) => { if (e.target.matches?.('.shot img')) e.target.closest('.media').classList.add('no-img'); }, true);
  let t;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => feed.querySelectorAll('.shot img').forEach(fit), 150); });
  wide.addEventListener('change', () => feed.querySelectorAll('.pager').forEach((p) => { p.scrollLeft = 0; }));

  // Mouse: drag the photo sideways like a finger would (touch and trackpads scroll natively).
  let drag = null;
  feed.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || wide.matches) return;
    const pane = e.target.closest('.media');
    if (!pane || e.target.closest('button')) return;
    const pager = pane.parentElement;
    drag = { pager, x: e.clientX, left: pager.scrollLeft, moved: false, id: e.pointerId };
  });
  feed.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) < 6) return;
    if (!drag.moved) { drag.moved = true; drag.pager.classList.add('dragging'); drag.pager.setPointerCapture(drag.id); }
    drag.pager.scrollLeft = drag.left - dx;
  });
  const endDrag = (e) => {
    if (!drag) return;
    const { pager, moved, x, left } = drag;
    drag = null;
    if (!moved) return;
    suppressClick = e.type === 'pointerup';
    const w = pager.clientWidth;
    const dx = e.clientX - x;
    pager.scrollTo({ left: dx < -w * 0.15 ? w : dx > w * 0.15 ? 0 : Math.round(left / w) * w, behavior: motion() });
    setTimeout(() => pager.classList.remove('dragging'), 450);
    setTimeout(() => { suppressClick = false; }, 0);
  };
  feed.addEventListener('pointerup', endDrag);
  feed.addEventListener('pointercancel', endDrag);

  document.addEventListener('keydown', (e) => {
    if (sheet.open || e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.('input, select, textarea')) return;
    const slide = slideAt(current);
    const reading = slide && onDetails(slide); // arrow keys scroll the details text
    switch (e.key) {
      case 'ArrowDown': if (reading) return; // fallthrough
      case 'PageDown': case 'j': goTo(current + 1); break;
      case 'ArrowUp': if (reading) return; // fallthrough
      case 'PageUp': case 'k': goTo(current - 1); break;
      case 'ArrowRight': case 'l': if (slide) showDetails(slide); break;
      case 'ArrowLeft': case 'h': case 'Escape': if (slide) showPhoto(slide); break;
      case 'm': openSheet(state.tab); break;
      case 's': if (filtered[current]) save(filtered[current].id); break;
      default: return;
    }
    e.preventDefault();
  });
}

// ---------- Navigation layer ----------
function openSheet(tab) {
  state.tab = tab;
  renderSheet();
  sheet.showModal();
  $('.sheet-body', sheet).scrollTop = 0;
}

function bindSheet() {
  sheet.addEventListener('click', (e) => {
    if (e.target === sheet || e.target.closest('[data-close]')) return sheet.close();
    const t = e.target.closest('button, input');
    if (!t) return;
    const d = t.dataset;
    if (d.tab) { state.tab = d.tab; saveFilters(); renderSheet(); $('.sheet-body', sheet).scrollTop = 0; return; }
    if (d.save) return save(d.save);
    if (d.goto) { const i = filtered.findIndex((p) => p.id === d.goto); sheet.close(); return goTo(i); }
    if (t.id === 'saved-clear') { if (confirm(`Remove all ${savedList.length} saved products?`)) [...savedList].forEach((x) => save(x.id)); return; }
    if (d.season) {
      const ids = palette.palettes;
      return setPalette({ palettes: ids.includes(d.season) ? ids.filter((x) => x !== d.season) : [...ids, d.season] });
    }
    if (d.uncolor) return setPalette({ colors: palette.colors.filter((h) => h !== d.uncolor) });
    if (d.exclude) {
      const ex = palette.exclude ?? [];
      return setPalette({ exclude: ex.includes(d.exclude) ? ex.filter((x) => x !== d.exclude) : [...ex, d.exclude] });
    }
    if (d.match) return setPalette({ match: d.match });
    if (t.id === 'neutrals') return setPalette({ neutrals: t.checked });
    if (t.id === 'send-votes') { sendVotes(votes); return renderSheet(); }
    if (d.cat != null) return setFilters({ category: d.cat });
    if (d.gender != null) return setFilters({ gender: d.gender });
    if (d.store) {
      const hidden = new Set(hiddenStores);
      hidden.has(d.store) ? hidden.delete(d.store) : hidden.add(d.store);
      return setStores(hidden);
    }
    if (t.id === 'stores-all') return setStores([]);
    if (t.id === 'stores-none') return setStores(stores.map((x) => x.id));
    if (d.size) {
      const [g, v] = d.size.split(':');
      const list = state.sizes[g];
      return setFilters({ sizes: { ...state.sizes, [g]: list.includes(v) ? list.filter((x) => x !== v) : [...list, v] } });
    }
    if (t.id === 'clear-all') clearAll();
  });
  sheet.addEventListener('close', () => { if (dirty) { dirty = false; rebuild(); } });

  // Drag the sheet down by its top edge to close it.
  const head = [$('.sheet-grab', sheet), $('.sheet-head', sheet)];
  let start = null;
  for (const el of head) {
    el.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      start = e.clientY;
      el.setPointerCapture(e.pointerId);
      sheet.classList.add('dragging');
    });
  }
  sheet.addEventListener('pointermove', (e) => { if (start != null) sheet.style.transform = `translateY(${Math.max(0, e.clientY - start)}px)`; });
  const end = (e) => {
    if (start == null) return;
    const dy = e.clientY - start;
    start = null;
    sheet.classList.remove('dragging');
    sheet.style.transform = '';
    if (dy > 90) sheet.close();
  };
  sheet.addEventListener('pointerup', end);
  sheet.addEventListener('pointercancel', end);
}

function setPalette(change) {
  palette = { ...palette, ...change };
  targets = targetColors(palette);
  computeMatches();
  saveSelection(palette);
  changed();
}

function setStores(ids) {
  hiddenStores = new Set(ids);
  saveHiddenStores(hiddenStores);
  changed();
}

function setFilters(change) {
  Object.assign(state, change);
  saveFilters();
  changed();
}

function clearAll() {
  palette = { ...palette, palettes: [], colors: [], exclude: [] };
  targets = [];
  computeMatches();
  saveSelection(palette);
  Object.assign(state, { category: '', gender: '', sizes: emptySizes() });
  saveFilters();
  changed();
}

// Filters apply live (the count on the button follows); the feed is rebuilt when the layer closes.
function changed() {
  apply();
  if (sheet.open) { dirty = true; renderSheet(); } else rebuild();
}

function renderSheet() {
  const body = $('.sheet-body', sheet);
  const top = body.scrollTop;
  sheet.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === state.tab));
  body.setAttribute('aria-labelledby', `tab-${state.tab}`);
  body.innerHTML = ({ saved: savedHtml, colours: coloursHtml, categories: categoriesHtml, sizes: sizesHtml }[state.tab] ?? coloursHtml)();
  body.scrollTop = top;
  $('#clear-all').hidden = state.tab === 'saved'; // it clears filters, not the saved list
  $('#show').textContent = filtered.length ? `Show ${filtered.length.toLocaleString('sv-SE')} products` : 'No products match';
}

// Saved products, newest first. Live data when the product is still in the feed, otherwise the
// snapshot taken when it was saved.
function savedHtml() {
  if (!savedList.length) return `
    <section class="group empty-saved">
      <p class="big-heart">${ICON.heart}</p>
      <h3>No saved products yet</h3>
      <p class="hint">Tap ♥ on a product to save it here. The list is kept in this browser for 30 days after your last visit, no account needed.</p>
    </section>`;
  const row = (x) => {
    const p = byId.get(x.id);
    const i = p ? filtered.indexOf(p) : -1;
    const status = !p ? 'No longer listed' : !p.available ? 'Sold out' : '';
    const price = p ? `${approx(p)}${sek(p.price)}${p.compareAt ? ` <s>${sek(p.compareAt)}</s>` : ''}` : sek(x.price);
    return `<li class="saved-row ${status ? 'gone' : ''}">
      <a class="saved-link" href="${esc(p?.url ?? x.url)}" target="_blank" rel="noopener" title="To the product page at ${esc(p?.storeName ?? x.storeName)}">
        <img src="${esc(thumb(p?.images[0] ?? x.image, 200))}" alt="" loading="lazy">
        <span class="saved-text">
          <span class="who"><span class="store-tag">${esc(p?.storeName ?? x.storeName)}</span>${esc(p?.brand ?? x.brand)}</span>
          <span class="saved-title">${esc(p ? displayTitle(p) : x.title)}</span>
          <span class="saved-price ${p?.compareAt ? 'sale' : ''}">${price}${status ? ` · <em>${status}</em>` : ''}</span>
        </span>
      </a>
      <span class="saved-actions">
        ${i >= 0 ? `<button class="link" data-goto="${esc(x.id)}">In the feed</button>` : ''}
        <button class="save small" data-save="${esc(x.id)}" aria-pressed="true" aria-label="Remove from your saved products">${ICON.heart}</button>
      </span>
    </li>`;
  };
  return `
    <section class="group">
      <div class="group-head">
        <h3>Saved · ${savedList.length}</h3>
        <button id="saved-clear" class="link">Remove all</button>
      </div>
      <ul class="saved-list">${savedList.map(row).join('')}</ul>
      <p class="hint">Kept in this browser on this device for 30 days after your last visit.</p>
    </section>`;
}

function coloursHtml() {
  const tile = (p) => `<button class="season" data-season="${esc(p.id)}" aria-pressed="${palette.palettes.includes(p.id)}">
      <span class="strip">${p.colors.map((c) => `<i style="background:${esc(c.hex)}"></i>`).join('')}</span>
      <span class="name">${esc(p.label)}</span>
    </button>`;
  const ex = palette.exclude ?? [];
  const list = Object.values(votes);
  const unsent = list.filter((x) => !x.sent).length;
  const up = list.filter((x) => x.v > 0).length;
  return `
    <section class="group">
      <h3>Your colour season</h3>
      <p class="hint">Only show products in your season's colours. Pick one or more.</p>
      ${FAMILIES.map((f) => `<div class="family">
        <span class="family-name">${esc(f.label)} <span class="muted">${esc(f.blurb)}</span></span>
        <div class="seasons">${PALETTES.filter((p) => p.family === f.id).map(tile).join('')}</div>
      </div>`).join('')}
      ${palette.colors.length ? `<div class="chips">${palette.colors.map((h) =>
        `<button class="chip" data-uncolor="${esc(h)}" aria-label="Remove ${esc(colorName(h))}"><i class="dot" style="background:${esc(h)}"></i>${esc(colorName(h))} ×</button>`).join('')}</div>` : ''}
      ${isActive(palette) ? `<div class="options">
        <label class="toggle"><input type="checkbox" id="neutrals" ${palette.neutrals ? 'checked' : ''}> Include neutrals</label>
        <div class="seg" role="group" aria-label="Colour match">
          <button data-match="close" aria-pressed="${palette.match === 'close'}">Close match</button>
          <button data-match="broad" aria-pressed="${palette.match === 'broad'}">Broad</button>
        </div>
      </div>` : ''}
    </section>
    <section class="group">
      <h3>Hide colours</h3>
      <div class="chips">${EXCLUDABLE.map((x) => `<button class="chip ex" data-exclude="${esc(x.id)}" aria-pressed="${ex.includes(x.id)}">
        <i class="dot" style="background:${esc(x.hex)}"></i>${esc(x.label)}</button>`).join('')}</div>
    </section>
    ${list.length ? `<section class="group feedback">
      <p>Your ratings: ${up} 👍 · ${list.length - up} 👎</p>
      ${unsent ? `<button id="send-votes" class="link">Send ${Math.min(unsent, FEEDBACK_LINES_PER_ISSUE)} to improve matching ↗</button>` : '<p class="muted">All sent, thanks!</p>'}
    </section>` : ''}
    <a class="classic" href="palettes.html">Every season's colours ↗</a>`;
}

function categoriesHtml() {
  const pool = all.filter(passesBase);
  const counts = {};
  for (const p of pool) {
    counts[p.category] = (counts[p.category] ?? 0) + 1;
    counts[p.subcategory] = (counts[p.subcategory] ?? 0) + 1;
  }
  const visible = pool.filter((p) => !HIDDEN_DEPTS.includes(p.category)).length;
  const chip = (value, text, n) =>
    `<button class="chip" data-cat="${esc(value)}" aria-pressed="${state.category === value}">${esc(text)}${n != null ? ` <span class="n">${n}</span>` : ''}</button>`;
  return `
    <section class="group">
      <h3>For</h3>
      <div class="seg" role="group" aria-label="For">
        ${[['', 'Everyone'], ['men', 'Men'], ['women', 'Women']].map(([v, t]) =>
          `<button data-gender="${v}" aria-pressed="${state.gender === v}">${t}</button>`).join('')}
      </div>
      <p class="hint">Unisex products show for both.</p>
    </section>
    <section class="group">
      <h3>Category</h3>
      <div class="chips">
        ${chip('', 'Everything', visible)}
        ${chip('tops+midlayers', 'Tops & mid layers', (counts.tops ?? 0) + (counts.midlayers ?? 0))}
      </div>
      ${TAXONOMY.filter((d) => counts[d.id] || state.category.startsWith(d.id)).map((d) => `<div class="dept">
        <h4>${esc(d.label)}${d.hidden ? ' <span class="muted">hidden from Everything</span>' : ''}</h4>
        <div class="chips">
          ${chip(d.id, `All ${d.label.toLowerCase()}`, counts[d.id] ?? 0)}
          ${d.subs.filter((s) => counts[s.id] || state.category === s.id).map((s) => chip(s.id, s.label, counts[s.id] ?? 0)).join('')}
        </div>
      </div>`).join('')}
    </section>
    ${storesHtml()}`;
}

// Every store is checked unless you uncheck it; the counts follow the other filters.
function storesHtml() {
  const counts = {};
  for (const p of all) {
    if (p.available && inPalette(p) && forGender(p) && fitsSizes(p) && inCategory(p, state.category)) counts[p.store] = (counts[p.store] ?? 0) + 1;
  }
  return `
    <section class="group">
      <div class="group-head">
        <h3>Stores</h3>
        <span><button id="stores-all" class="link">All</button> · <button id="stores-none" class="link">None</button></span>
      </div>
      <div class="chips">${stores.map((x) => `<button class="chip check" data-store="${esc(x.id)}" aria-pressed="${!hiddenStores.has(x.id)}">${esc(x.name)} <span class="n">${counts[x.id] ?? 0}</span></button>`).join('')}</div>
    </section>`;
}

function sizesHtml() {
  return `
    <section class="group">
      <h3>Your sizes</h3>
      <p class="hint">Only show products in stock in your sizes. Products sized another way still show: one-size items, and shoes when you only pick clothing sizes.</p>
    </section>
    ${SIZE_GROUPS.map((g) => `<section class="group">
      <h3>${esc(g.label)}</h3>
      <div class="chips sizes-pick">${g.sizes.map((s) =>
        `<button class="chip" data-size="${g.id}:${esc(s)}" aria-pressed="${state.sizes[g.id].includes(s)}">${esc(s)}</button>`).join('')}</div>
    </section>`).join('')}`;
}
