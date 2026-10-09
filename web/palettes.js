// Palette picker: choose seasons and/or single colours, then open the shop filtered to them.

import { FAMILIES, PALETTES, BASIC_COLORS, SOURCE_URL } from './lib/palettes.mjs';
import { TAXONOMY } from './lib/taxonomy.mjs';
import {
  loadSelection, saveSelection, selectionParams, isActive, targetColors, attachSwatches,
  matchingColorways, loadColorOverrides, colorName,
} from './palette-filter.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const HIDDEN_DEPTS = TAXONOMY.filter((d) => d.hidden).map((d) => d.id);

const sel = loadSelection();
let products = null; // loaded in the background for counts

const swatch = (c, cls = '') =>
  `<button class="swatch ${cls}" data-hex="${esc(c.hex.toLowerCase())}" style="--c:${esc(c.hex)}" title="${esc(c.name)} ${esc(c.hex)}" aria-label="${esc(c.name)}" aria-pressed="false"></button>`;

function render() {
  $('#families').innerHTML = FAMILIES.map((f) => `
    <section class="pal-family">
      <h2>${esc(f.label)} <span class="muted">${esc(f.blurb)}</span></h2>
      <div class="pal-grid">
        ${PALETTES.filter((p) => p.family === f.id).map((p) => `
          <article class="pal-card" data-palette="${esc(p.id)}">
            <div class="pal-strip">${p.colors.map((c) => `<span style="background:${esc(c.hex)}"></span>`).join('')}</div>
            <div class="pal-body">
              <div class="pal-head">
                <div><h3>${esc(p.label)}</h3><span class="muted">${esc(p.blurb)}</span></div>
                <button class="btn ghost pal-toggle" aria-pressed="false">Select</button>
              </div>
              <div class="swatch-row">${p.colors.map((c) => swatch(c)).join('')}</div>
              <div class="swatch-row small"><span class="muted">Neutrals</span>${p.neutrals.map((c) => swatch(c, 'small')).join('')}</div>
              <span class="pal-count muted" data-count="${esc(p.id)}"></span>
            </div>
          </article>`).join('')}
      </div>
    </section>`).join('');
  $('#basic').innerHTML = BASIC_COLORS.map((c) => `<span class="swatch-label">${swatch(c)}<span>${esc(c.name)}</span></span>`).join('');
}

function bind() {
  document.body.addEventListener('click', (e) => {
    const toggle = e.target.closest('.pal-toggle');
    if (toggle) {
      const id = toggle.closest('[data-palette]').dataset.palette;
      sel.palettes = sel.palettes.includes(id) ? sel.palettes.filter((x) => x !== id) : [...sel.palettes, id];
      return update();
    }
    const sw = e.target.closest('.swatch');
    if (sw) {
      const hex = sw.dataset.hex;
      sel.colors = sel.colors.includes(hex) ? sel.colors.filter((x) => x !== hex) : [...sel.colors, hex];
      return update();
    }
  });
  $('#opt-neutrals').addEventListener('change', (e) => { sel.neutrals = e.target.checked; update(); });
  $('#opt-match').addEventListener('change', (e) => { sel.match = e.target.value; update(); });
  $('#pal-clear').addEventListener('click', () => { sel.palettes = []; sel.colors = []; update(); });
}

const countFor = (s) => {
  const targets = targetColors(s);
  return products.filter((p) => matchingColorways(p, targets, s.match).length).length;
};
const n = (x) => x.toLocaleString('sv-SE');

function update() {
  saveSelection(sel);
  document.querySelectorAll('[data-palette]').forEach((card) => {
    const on = sel.palettes.includes(card.dataset.palette);
    card.classList.toggle('on', on);
    const t = card.querySelector('.pal-toggle');
    t.setAttribute('aria-pressed', on);
    t.textContent = on ? '✓ Selected' : 'Select';
  });
  document.querySelectorAll('.swatch').forEach((s) => s.setAttribute('aria-pressed', sel.colors.includes(s.dataset.hex)));

  const parts = [
    ...sel.palettes.map((id) => PALETTES.find((p) => p.id === id).label),
    ...sel.colors.map(colorName),
  ];
  const active = isActive(sel);
  $('#pal-clear').hidden = !active;
  const q = selectionParams(sel);
  $('#pal-go').href = `index.html${q.size ? `?${q}` : ''}`;
  $('#nav-shop').href = $('#pal-go').href;

  if (products) {
    for (const el of document.querySelectorAll('[data-count]')) {
      el.textContent = `${n(countFor({ ...sel, palettes: [el.dataset.count], colors: [] }))} products in stock`;
    }
  }
  const total = active && products ? countFor(sel) : null;
  $('#pal-summary').innerHTML = active
    ? `<strong>${esc(parts.join(', '))}</strong>${total != null ? `<span class="muted"> · ${n(total)} products</span>` : ''}`
    : 'Nothing selected yet';
  $('#pal-go').textContent = active ? (total != null ? `Show ${n(total)} products →` : 'Show products →') : 'Show all products';
}

$('#source').href = SOURCE_URL;
$('#opt-neutrals').checked = sel.neutrals;
$('#opt-match').value = sel.match;
render();
bind();
update();
Promise.all([fetch('data/products.json').then((r) => r.json()), loadColorOverrides()]).then(([data, overrides]) => {
  // Same default as the shop: hidden departments (e.g. gear) aren't counted.
  products = attachSwatches(data.products.filter((p) => !HIDDEN_DEPTS.includes(p.category) && p.available), overrides);
  update();
});
