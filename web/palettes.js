// Palette picker: choose seasons and/or single colours, then open the shop filtered to them.

import { FAMILIES, PALETTES, BASIC_COLORS, SOURCES, allColors } from './lib/palettes.mjs';
import { hexToRgb } from './lib/colors.mjs';
import { TAXONOMY } from './lib/taxonomy.mjs';
import {
  loadSelection, saveSelection, selectionParams, isActive, targetColors, attachSwatches,
  matchInfo, loadColorOverrides, colorName,
} from './palette-filter.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const HIDDEN_DEPTS = TAXONOMY.filter((d) => d.hidden).map((d) => d.id);

const sel = loadSelection();
let products = null; // loaded in the background for counts

const swatch = (c, cls = '') =>
  `<button class="swatch ${cls}" data-hex="${esc(c.hex.toLowerCase())}" style="--c:${esc(c.hex)}" title="${esc(c.name)} ${esc(c.hex)}" aria-label="${esc(c.name)}" aria-pressed="false"></button>`;

// Colour tile with name and hex (selectable). Avoid-colours are shown crossed out, not selectable.
const chip = (c, avoid = false) => avoid
  ? `<span class="swatch-chip avoid" title="Avoid: ${esc(c.name)}"><span class="tile" style="background:${esc(c.hex)}"></span><span class="name">${esc(c.name)}</span><span class="hex">${esc(c.hex)}</span></span>`
  : `<button class="swatch-chip" data-hex="${esc(c.hex.toLowerCase())}" aria-pressed="false" title="${esc(c.name)} ${esc(c.hex)}">
      <span class="tile" style="background:${esc(c.hex)}"></span><span class="name">${esc(c.name)}</span><span class="hex">${esc(c.hex)}</span>
    </button>`;

// The whole palette as one strip: signature colours wide, then the rest by hue, neutrals last.
function spectrum(p) {
  const hue = (hex) => { const [r, g, b] = hexToRgb(hex).map((v) => v / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (!d) return 0; const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (h * 60 + 360) % 360; };
  const rest = allColors(p).filter((c) => c.group !== 'signature');
  const sorted = [...rest.filter((c) => !c.neutral).sort((a, b) => hue(a.hex) - hue(b.hex)), ...rest.filter((c) => c.neutral)];
  const tile = (c, cls) => `<button class="sp-tile ${cls}" data-hex="${esc(c.hex.toLowerCase())}" style="background:${esc(c.hex)}" title="${esc(c.name)} ${esc(c.hex)}" aria-label="${esc(c.name)}" aria-pressed="false"></button>`;
  return `<div class="spectrum">${p.colors.map((c) => tile(c, 'sig')).join('')}<span class="sp-gap"></span>${sorted.map((c) => tile(c, c.neutral ? 'neu' : '')).join('')}</div>`;
}

function render() {
  $('#season-nav').innerHTML = PALETTES.map((p) =>
    `<a href="#s-${esc(p.id)}" data-nav="${esc(p.id)}"><span class="mini-strip">${p.colors.map((c) => `<i style="background:${esc(c.hex)}"></i>`).join('')}</span>${esc(p.label)}</a>`).join('');

  $('#families').innerHTML = FAMILIES.map((f) => `
    <section class="pal-family">
      <h2>${esc(f.label)} <span class="muted">${esc(f.blurb)}</span></h2>
      ${PALETTES.filter((p) => p.family === f.id).map((p) => `
        <details class="season" id="s-${esc(p.id)}" data-palette="${esc(p.id)}" ${sel.palettes.includes(p.id) ? 'open' : ''}>
          <summary>
            <div class="season-head">
              <div class="season-title">
                <h3>${esc(p.label)}</h3>
                <span class="muted">${esc(p.blurb)}</span>
                <span class="tags">${p.character.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}<span class="tag n">${allColors(p).length} colours</span></span>
              </div>
              <div class="season-actions">
                <span class="pal-count muted" data-count="${esc(p.id)}"></span>
                <button class="btn ghost pal-toggle" aria-pressed="false">Select</button>
              </div>
            </div>
            ${spectrum(p)}
            <span class="season-more muted">Show all colours</span>
          </summary>
          <div class="season-body">
            <section class="cgroup"><h4>Signature colours <span class="muted">${p.colors.length}</span></h4><div class="cgrid big">${p.colors.map((c) => chip(c)).join('')}</div></section>
            ${p.groups.map((g) => `<section class="cgroup"><h4>${esc(g.label)} <span class="muted">${g.colors.length}</span></h4><div class="cgrid">${g.colors.map((c) => chip(c)).join('')}</div></section>`).join('')}
            <section class="cgroup"><h4>Colours to avoid <span class="muted">products closer to these don't match ${esc(p.label)}</span></h4><div class="cgrid">${p.avoid.map((c) => chip(c, true)).join('')}</div></section>
          </div>
        </details>`).join('')}
    </section>`).join('');
  $('#basic').innerHTML = BASIC_COLORS.map((c) => `<span class="swatch-label">${swatch(c)}<span>${esc(c.name)}</span></span>`).join('');
}

function bind() {
  document.body.addEventListener('click', (e) => {
    const toggle = e.target.closest('.pal-toggle');
    if (toggle) {
      e.preventDefault();
      const id = toggle.closest('[data-palette]').dataset.palette;
      sel.palettes = sel.palettes.includes(id) ? sel.palettes.filter((x) => x !== id) : [...sel.palettes, id];
      return update();
    }
    const sw = e.target.closest('[data-hex]');
    if (sw) {
      e.preventDefault(); // a colour in the summary strip shouldn't open/close the season
      const hex = sw.dataset.hex;
      sel.colors = sel.colors.includes(hex) ? sel.colors.filter((x) => x !== hex) : [...sel.colors, hex];
      return update();
    }
  });
  $('#opt-neutrals').addEventListener('change', (e) => { sel.neutrals = e.target.checked; update(); });
  $('#opt-match').addEventListener('change', (e) => { sel.match = e.target.value; update(); });
  $('#pal-clear').addEventListener('click', () => { sel.palettes = []; sel.colors = []; update(); });
  $('#expand-all').addEventListener('click', (e) => {
    const open = e.target.dataset.open !== '1';
    document.querySelectorAll('details.season').forEach((d) => { d.open = open; });
    e.target.dataset.open = open ? '1' : '';
    e.target.textContent = open ? 'Collapse all' : 'Show all colours for every season';
  });
}

// { signature, neutral } product counts for a selection.
const countFor = (s) => {
  const targets = targetColors(s);
  const c = { signature: 0, neutral: 0 };
  for (const p of products) { const m = matchInfo(p, targets, s.match); if (m) c[m.kind]++; }
  return c;
};
const total = (c) => c.signature + c.neutral;
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
  document.querySelectorAll('[data-hex]').forEach((s) => s.setAttribute('aria-pressed', sel.colors.includes(s.dataset.hex)));
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('on', sel.palettes.includes(a.dataset.nav)));

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
      const c = countFor({ ...sel, palettes: [el.dataset.count], colors: [] });
      el.textContent = `${n(c.signature)} in its colours${sel.neutrals ? ` · ${n(c.neutral)} neutrals` : ''}`;
    }
  }
  const counts = active && products ? countFor(sel) : null;
  $('#pal-summary').innerHTML = active
    ? `<strong>${esc(parts.join(', '))}</strong>${counts ? `<span class="muted"> · ${n(counts.signature)} in your colours${sel.neutrals ? `, ${n(counts.neutral)} neutrals` : ''}</span>` : ''}`
    : 'Nothing selected yet';
  $('#pal-go').textContent = active ? (counts ? `Show ${n(total(counts))} products →` : 'Show products →') : 'Show all products';
}

$('#sources').innerHTML = SOURCES.map((x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.name)}</a>`).join(' and ');
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
