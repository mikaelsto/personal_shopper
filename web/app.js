// Personal Shopper front-end. Reads data/products.json + data/stores.json (built by the GitHub job).
// Newly added Shopify stores are also fetched live in the browser until the job has added them.

import { TAXONOMY, label } from './lib/taxonomy.mjs';
import { fromShopify, isGiftCard, shopifyPageUrl } from './lib/shopify-map.mjs';

const REPO = 'mikaelsto/personal_shopper';
const PAGE = 60;
const COLD_FEATURES = ['long-sleeve', 'warm', 'merino/wool'];
const COLD_SUBS = ['tops/long-sleeve', 'tops/base-layers'];
const HIDDEN_DEPTS = TAXONOMY.filter((d) => d.hidden).map((d) => d.id);
const catLabel = (p) => (p.subcategory && p.subcategory !== 'other' ? `${label(p.category)} › ${label(p.subcategory)}` : 'Other');

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sek = (n) => (n == null ? '–' : `${Math.round(n).toLocaleString('sv-SE')} kr`);
const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// Use smaller image variants where the store's image server offers them.
const thumb = (url, w = 500) => {
  if (!url) return url;
  if (url.includes('cdn.shopify.com')) return `${url}${url.includes('?') ? '&' : '?'}width=${w}`;
  if (url.includes('images.ka-yo.com/product/1000f1239/') && w <= 500) return url.replace('/1000f1239/', '/300f371/');
  return url;
};

// Normalise size labels like "Size 1 (S)" or "Medium" to S/M/L…
function sizeLetter(s) {
  if (!s) return null;
  const m = String(s).toUpperCase().match(/\b(XXS|XS|S|M|L|XL|XXL|2XL|3XL)\b/);
  if (m) return m[1] === '2XL' ? 'XXL' : m[1];
  const word = { SMALL: 'S', MEDIUM: 'M', LARGE: 'L' }[String(s).toUpperCase().trim()];
  return word ?? null;
}

// Compact label for cards: "Size 1 (S)" -> "S", "US M8 / UK 7½ / EU 41⅓" -> "EU 41⅓".
const shortSize = (s) => sizeLetter(s) ?? (String(s).match(/EU\s*([\d½⅓⅔.,]+)/)?.[0].replace(/\s+/, ' ')) ?? s;

let all = [];
let stores = []; // registered stores (data/stores.json) + pending ones added in this browser
const liveStatus = new Map(); // storeId -> "loading 250…" | "error" while fetching in the browser
let filtered = [];
let shown = PAGE;
let history = null;
const compare = new Set(store.get('compare', []));

const state = {
  q: '', stores: new Set(), category: '', features: new Set(), cold: false,
  gender: '', size: store.get('size', ''), min: '', max: '', stock: true, sale: false, sort: 'relevance',
};

init();

const withText = (p) => ({ ...p, _text: `${p.title} ${p.brand} ${p.storeName} ${label(p.category)} ${label(p.subcategory)} ${p.productType ?? ''} ${p.features.join(' ')} ${p.colors.join(' ')} ${p.description}`.toLowerCase() });

async function init() {
  const [data, registered] = await Promise.all([
    fetch('data/products.json').then((r) => r.json()),
    fetch('data/stores.json').then((r) => r.json()).catch(() => []),
  ]);
  all = data.products.map(withText);
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
    return `<button class="chip ${s.pending ? 'pending' : ''}" data-store="${esc(s.id)}" aria-pressed="${state.stores.has(s.id)}" title="${esc(s.base)}">${esc(s.name)} <span class="n">${esc(note)}</span>${s.pending ? `<span class="x" data-remove="${esc(s.id)}" title="Remove">×</span>` : ''}</button>`;
  }).join('') + `<button class="chip add" id="add-store-btn" title="Add a store" aria-label="Add a store">+</button>`;
}

function buildFilters() {
  renderStoreChips();
  const counts = all.reduce((a, p) => {
    a[p.category] = (a[p.category] ?? 0) + 1;
    a[p.subcategory] = (a[p.subcategory] ?? 0) + 1;
    return a;
  }, {});
  const opt = (value, text, n) => `<option value="${value}">${esc(text)}${n ? ` (${n})` : ''}</option>`;
  $('#f-category').innerHTML =
    opt('', 'All categories') +
    opt('tops+midlayers', 'Tops & mid layers') +
    TAXONOMY.map((d) => `<optgroup label="${esc(d.label)}${d.hidden ? ' (hidden by default)' : ''}">` +
      opt(d.id, `All ${d.label.toLowerCase()}`, counts[d.id]) +
      d.subs.filter((s) => counts[s.id]).map((s) => opt(s.id, s.label, counts[s.id])).join('') +
      '</optgroup>').join('') +
    (counts.other ? opt('other', 'Other / uncategorised', counts.other) : '');

  const feats = [...new Set(all.flatMap((p) => p.features))].sort();
  $('#f-features').innerHTML = feats.map((f) => `<button class="chip" data-feature="${esc(f)}" aria-pressed="${state.features.has(f)}">${esc(f)}</button>`).join('');
  $('#f-size').value = state.size;
  $('#f-category').value = state.category;
}

function bind() {
  let t;
  $('#q').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { state.q = e.target.value.trim().toLowerCase(); apply(); }, 150); });
  $('#f-stores').addEventListener('click', (e) => {
    if (e.target.closest('#add-store-btn')) return openAddStore();
    const remove = e.target.closest('[data-remove]');
    if (remove) return removePending(remove.dataset.remove);
    toggleChip(e, 'store', state.stores);
  });
  $('#f-features').addEventListener('click', (e) => toggleChip(e, 'feature', state.features));
  const on = (id, key, prop = 'value', after) => $(id).addEventListener('change', (e) => { state[key] = e.target[prop]; after?.(); apply(); });
  on('#f-category', 'category');
  on('#f-cold', 'cold', 'checked');
  on('#f-gender', 'gender');
  on('#f-size', 'size', 'value', () => store.set('size', state.size));
  on('#f-min', 'min');
  on('#f-max', 'max');
  on('#f-stock', 'stock', 'checked');
  on('#f-sale', 'sale', 'checked');
  on('#sort', 'sort');
  $('#more').addEventListener('click', () => { shown += PAGE; render(); });
  $('#reset').addEventListener('click', reset);
  $('#preset-cold').addEventListener('click', () => {
    reset(false);
    Object.assign(state, { category: 'tops+midlayers', cold: true, stock: true });
    syncControls();
    apply();
  });
  $('#toggle-filters').addEventListener('click', () => $('#filters').classList.toggle('open'));

  $('#grid').addEventListener('click', (e) => {
    const cmp = e.target.closest('.cmp');
    const card = e.target.closest('.card');
    if (!card) return;
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

function toggleChip(e, attr, set) {
  const b = e.target.closest(`[data-${attr}]`);
  if (!b) return;
  const v = b.dataset[attr];
  set.has(v) ? set.delete(v) : set.add(v);
  b.setAttribute('aria-pressed', set.has(v));
  apply();
}

function reset(run = true) {
  Object.assign(state, { q: '', category: '', cold: false, gender: '', min: '', max: '', stock: true, sale: false });
  state.stores.clear();
  state.features.clear();
  $('#q').value = '';
  syncControls();
  if (run) apply();
}

function syncControls() {
  $('#f-category').value = state.category;
  $('#f-cold').checked = state.cold;
  $('#f-gender').value = state.gender;
  $('#f-min').value = state.min;
  $('#f-max').value = state.max;
  $('#f-stock').checked = state.stock;
  $('#f-sale').checked = state.sale;
  document.querySelectorAll('[data-store]').forEach((b) => b.setAttribute('aria-pressed', state.stores.has(b.dataset.store)));
  document.querySelectorAll('[data-feature]').forEach((b) => b.setAttribute('aria-pressed', state.features.has(b.dataset.feature)));
}

const isCold = (p) => COLD_SUBS.includes(p.subcategory) || p.category === 'midlayers' || p.features.some((f) => COLD_FEATURES.includes(f));
// Category filter value: "" (all except hidden departments), a department, a subcategory, or "a+b".
const inCategory = (p, value) =>
  value ? value.split('+').some((v) => p.category === v || p.subcategory === v) : !HIDDEN_DEPTS.includes(p.category);
const hasSize = (p, size) => p.variants.some((v) => v.available && sizeLetter(v.size) === size);

function apply() {
  const words = state.q.split(/\s+/).filter(Boolean);
  const min = Number(state.min) || 0;
  const max = Number(state.max) || Infinity;
  filtered = all.filter((p) =>
    (!state.stores.size || state.stores.has(p.store)) &&
    inCategory(p, state.category) &&
    [...state.features].every((f) => p.features.includes(f)) &&
    (!state.cold || isCold(p)) &&
    (!state.gender || p.gender === state.gender || p.gender === 'unisex') &&
    (!state.stock || p.available) &&
    (!state.sale || p.compareAt) &&
    (!state.size || hasSize(p, state.size)) &&
    (p.price ?? 0) >= min && (p.price ?? 0) <= max &&
    words.every((w) => p._text.includes(w)),
  );

  const score = (p) => (state.cold ? p.features.filter((f) => COLD_FEATURES.includes(f)).length * 2 : 0) + (p.available ? 1 : 0) + (p.title.toLowerCase().includes(state.q) && state.q ? 3 : 0);
  const discount = (p) => (p.compareAt ? 1 - p.price / p.compareAt : 0);
  const sorters = {
    relevance: (a, b) => score(b) - score(a),
    'price-asc': (a, b) => (a.price ?? 1e9) - (b.price ?? 1e9),
    'price-desc': (a, b) => (b.price ?? 0) - (a.price ?? 0),
    discount: (a, b) => discount(b) - discount(a),
    newest: (a, b) => String(b.firstSeen).localeCompare(String(a.firstSeen)),
  };
  filtered.sort(sorters[state.sort]);
  shown = PAGE;
  render();
}

const displayTitle = (p) => (p.colors.length === 1 ? `${p.title} – ${p.colors[0]}` : p.title);

function priceHtml(p) {
  return p.compareAt
    ? `<span class="price sale">${sek(p.price)}<s>${sek(p.compareAt)}</s></span>`
    : `<span class="price">${sek(p.price)}</span>`;
}

function render() {
  $('#count').textContent = `${filtered.length} products`;
  $('#grid').innerHTML = filtered.slice(0, shown).map((p) => `
    <article class="card ${p.available ? '' : 'oos'}" data-id="${esc(p.id)}">
      <div class="img">${p.images[0] ? `<img loading="lazy" src="${esc(thumb(p.images[0]))}" alt="">` : ''}</div>
      ${p.compareAt ? `<span class="badge">−${Math.round((1 - p.price / p.compareAt) * 100)}%</span>` : ''}
      <label class="cmp"><input type="checkbox" ${compare.has(p.id) ? 'checked' : ''}> Compare</label>
      <div class="body">
        <span class="store">${esc(p.storeName)} · ${esc(p.brand)}</span>
        <span class="title">${esc(displayTitle(p))}</span>
        <span class="sub">${esc(catLabel(p))}${p.features.length ? ` · ${esc(p.features.join(', '))}` : ''}</span>
        ${priceHtml(p)}
        <span class="sub">${p.available ? `Sizes: ${esc([...new Set(p.sizesInStock.map(shortSize))].join(' ') || 'one size')}` : 'Sold out'}</span>
      </div>
    </article>`).join('');
  $('#more').hidden = shown >= filtered.length;
  updateCompareBar();
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
function openCompare() {
  const items = [...compare].map((id) => all.find((p) => p.id === id)).filter(Boolean);
  const row = (label, fn) => `<tr><th>${label}</th>${items.map((p) => `<td>${fn(p)}</td>`).join('')}</tr>`;
  $('#compare').innerHTML = `
    <div class="dlg-head"><h2>Compare</h2><button class="close" aria-label="Close">×</button></div>
    <div class="cmp-table"><table>
      ${row('', (p) => `<img src="${esc(thumb(p.images[0], 400))}" alt="">`)}
      ${row('Product', (p) => `<strong>${esc(displayTitle(p))}</strong><br><span class="muted">${esc(p.brand)} @ ${esc(p.storeName)}</span>`)}
      ${row('Price', priceHtml)}
      ${row('Category', (p) => esc(catLabel(p)))}
      ${row('Features', (p) => p.features.map((f) => `<span class="tag">${esc(f)}</span>`).join('') || '–')}
      ${row('Material', (p) => esc(p.materials.join(', ')) || '–')}
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
        <div class="thumbs">${p.images.map((src, i) => `<img data-src="${esc(src)}" class="${i ? '' : 'on'}" src="${esc(thumb(src, 150))}" alt="">`).join('')}</div>
      </div>
      <div class="info">
        <div class="muted">${esc(p.brand)} · sold by <strong>${esc(p.storeName)}</strong></div>
        ${priceHtml(p)}
        <div>${p.features.map((f) => `<span class="tag">${esc(f)}</span>`).join('')}<span class="tag">${esc(catLabel(p))}</span>${p.gender !== 'unisex' ? `<span class="tag">${p.gender}</span>` : ''}</div>
        ${p.colors.length ? `<h3>Colour</h3><div>${esc(p.colors.join(', '))}</div>` : ''}
        <h3>Size</h3>
        <div class="sizes">${p.variants.map((v) => `<button class="size" data-variant="${esc(v.id)}" ${v.available ? '' : 'disabled'} aria-pressed="false">${esc(v.size ?? 'One size')}${p.colors.length > 1 && v.color ? ` · ${esc(v.color)}` : ''}</button>`).join('')}</div>
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
        ${p.materials.length ? `<h3>Material</h3><div>${esc(p.materials.join(', '))}</div>` : ''}
        <h3>Description</h3>
        <div class="desc">${esc(p.description) || '–'}</div>
        <h3>Price history</h3>
        <div class="history" id="history">Loading…</div>
        <p class="note">First seen ${esc(p.firstSeen ?? '–')} · last checked ${esc(p.lastSeen ?? p.collectedAt ?? '–')}</p>
      </div>
    </div>`;

  d.querySelector('.thumbs').addEventListener('click', (e) => {
    const img = e.target.closest('img');
    if (!img) return;
    d.querySelectorAll('.thumbs img').forEach((i) => i.classList.toggle('on', i === img));
    d.querySelector('#main-img').src = thumb(img.dataset.src, 1000);
  });
  d.querySelector('.sizes').addEventListener('click', (e) => {
    const b = e.target.closest('.size:not([disabled])');
    if (!b) return;
    selected = b.dataset.variant;
    d.querySelectorAll('.size').forEach((x) => x.setAttribute('aria-pressed', x === b));
    const cart = d.querySelector('#add-cart');
    if (cart) {
      cart.href = `${p.storeBase}/cart/${selected}:1?storefront=true`;
      cart.textContent = `Add to cart at ${p.storeName} ↗`;
      cart.removeAttribute('aria-disabled');
    }
  });
  d.querySelector('#add-cart')?.addEventListener('click', (e) => { if (!selected) e.preventDefault(); });
  d.showModal();

  history ??= await fetch('data/price-history.json').then((r) => r.json()).catch(() => ({}));
  renderHistory(history[p.id] ?? []);
}

function renderHistory(h) {
  const el = $('#history');
  if (!el) return;
  if (h.length < 2) {
    el.textContent = h.length ? `${sek(h[0][1])} since ${h[0][0]} (no changes yet)` : 'No history yet';
    return;
  }
  const prices = h.map(([, v]) => v);
  const lo = Math.min(...prices), hi = Math.max(...prices);
  const pts = h.map(([, v], i) => `${(i / (h.length - 1)) * 300},${55 - ((v - lo) / (hi - lo || 1)) * 50}`).join(' ');
  el.innerHTML = `<svg viewBox="0 0 300 60" preserveAspectRatio="none"><polyline fill="none" stroke="var(--accent)" stroke-width="2" points="${pts}"/></svg>
    ${h.map(([d, v]) => `${d}: ${sek(v)}`).join(' → ')}`;
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
    id, name: displayName, base: isShopify ? url.origin : url.href.replace(/\/+$/, ''),
    origin: url.origin, platform: isShopify ? 'shopify' : 'unknown', country: 'SE', addedAt: new Date().toISOString().slice(0, 10),
  };
  store.set('pendingStores', [...store.get('pendingStores', []), pending]);
  stores.push({ ...pending, pending: true });
  renderStoreChips();
  if (isShopify) loadLive(pending);

  const issue = `https://github.com/${REPO}/issues/new?` + new URLSearchParams({
    title: `Add store: ${url.href}`,
    body: `name: ${displayName}\n\nOpened from Personal Shopper. The "Add store" workflow detects how to read this store, adds it to data/stores.json and refreshes the site.`,
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
  state.stores.delete(id);
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
      fetched.push(...products.filter((p) => !isGiftCard(p)).map((p) => withText({ ...fromShopify(s, p), live: true })));
    }
    liveStatus.delete(s.id);
  } catch (err) {
    console.warn(`Live fetch failed for ${s.name}:`, err);
    liveStatus.set(s.id, 'error');
  }
  all = all.filter((p) => p.store !== s.id).concat(fetched);
  buildFilters();
  apply();
}
