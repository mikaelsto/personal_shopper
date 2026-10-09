// Brand normalisation: one display name and key per brand across stores
// ("NIKE" / "Nike" -> Nike, "HOKA ONE ONE" -> HOKA), with sub-lines grouped under
// the parent brand ("NIKE ACG" -> brand Nike, line "Nike ACG").
// Pure ES module: used by the update job and by the site (live-loaded stores).

// Lookup by key (lowercase letters/digits only) -> canonical display name.
const CANONICAL = {
  adidas: 'adidas',
  arcteryx: "Arc'teryx",
  asics: 'ASICS',
  cep: 'CEP',
  hoka: 'HOKA',
  nike: 'Nike',
  nnormal: 'NNormal',
  on: 'On',
  salomon: 'Salomon',
  satisfy: 'Satisfy',
  thenorthface: 'The North Face',
  y3: 'Y-3',
  newbalance: 'New Balance',
  underarmour: 'Under Armour',
};

// Different spellings of the same brand -> one key.
const ALIASES = { hokaoneone: 'hoka', onrunning: 'on', tnf: 'thenorthface' };

// Sub-lines: key prefix -> parent key. The full name is kept as `brandLine`.
const LINES = [
  ['nikeacg', 'nike'],
  ['nikerunning', 'nike'],
  ['salomonsportstyle', 'salomon'],
  ['satisfycollab', 'satisfy'],
  ['adidasterrex', 'adidas'],
  ['adidasbysmc', 'adidas'],
  ['asicssportstyle', 'asics'],
];

export const brandKey = (raw) =>
  String(raw ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ø/g, 'o').replace(/[^a-z0-9]/g, '');

// "PURPLE MOUNTAIN OBSERVATORY" -> "Purple Mountain Observatory"; short codes (ROA, UVU, 361) stay.
// Words the store wrote in mixed case are kept as is ("adidas", "New Balance").
function prettify(raw) {
  return String(raw).replace(/\s+-\s+/g, ' ').trim().split(/(\s+)/).map((w) =>
    /\p{Ll}/u.test(w) || w.replace(/[^\p{L}]/gu, '').length <= 3
      ? w
      : w.toLowerCase().replace(/(^|[-/&])(\p{L})/gu, (m, sep, c) => sep + c.toUpperCase()),
  ).join('');
}

// Returns { brand, brandKey, brandLine } for a raw store brand string.
export function normalizeBrand(raw) {
  if (!raw) return { brand: null, brandKey: null, brandLine: null };
  let key = brandKey(raw);
  key = ALIASES[key] ?? key;
  let line = null;
  const sub = LINES.find(([prefix]) => key.startsWith(prefix));
  if (sub) {
    line = prettify(raw);
    key = sub[1];
  }
  const brand = CANONICAL[key] ?? prettify(raw);
  return { brand, brandKey: key, brandLine: line && line !== brand ? line : null };
}
