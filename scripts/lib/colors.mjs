// Turns store colour names ("Aged Black", "black/summit white", "Grenoble Green") into a hex
// colour, and compares colours perceptually (CIEDE2000), for the palette filter.
// Names the dictionary can't read can be added to data/color-names.json ({ name: "#hex" }),
// which wins over the dictionary (filled by Claude in the daily job when a key is set).

const W = {
  // Neutrals
  black: '#141414', noir: '#141414', caviar: '#16161a', onyx: '#121214', obsidian: '#1a1b20', jet: '#111111', ink: '#1e2028',
  raven: '#2a2a2c', phantom: '#2b2c30', carbon: '#2e2f33', coal: '#333333', anthracite: '#3a3b3e', antracite: '#3a3b3e',
  graphite: '#45464a', charcoal: '#3a3a3c', asphalt: '#4a4b4e', iron: '#4e5054', gunmetal: '#4a4d52', shadow: '#4c4c50',
  slate: '#5a6068', 'dark slate': '#3c4248', grey: '#8c8c8c', gray: '#8c8c8c', concrete: '#9a9893', cement: '#8f8d88',
  aluminum: '#a8aaad', aluminium: '#a8aaad', silver: '#bfc1c4', steel: '#8a9097', stainless: '#a0a4a8', pewter: '#8b8d8f',
  smoke: '#8a8a8a', fog: '#c9cbcc', frost: '#d8dde0', moon: '#c7c6c0', moonstruck: '#c9c8c2', 'moon rock': '#8f8b84',
  'moon mist': '#d0d0cc', heather: '#a9a9a9', melange: '#a5a5a5', ash: '#b5b3ae', shark: '#6e7073', cinder: '#5e5b57',
  white: '#f7f7f5', snow: '#fafafa', 'summit white': '#f2f2f0', chalk: '#efece4', ivory: '#f4efe1', 'off white': '#ede6d6',
  ecru: '#e8dfc8', cream: '#f0e6cf', vanilla: '#f3e8cc', natural: '#e6dcc6', bone: '#e6dccb', pearl: '#ece8de',
  linen: '#e9e0cf', oyster: '#dcd6cc', ermine: '#e8e2d4', milk: '#f4f0e6', neve: '#f2f2f0', glacier: '#e3ecef',
  undyed: '#e6dcc6', transparent: '#f0eee8',
  // Beige / brown
  beige: '#d2bc98', sand: '#d6c29a', stone: '#c6bba7', greige: '#bdb4a6', taupe: '#8b7d70', putty: '#c0b5a2',
  oat: '#d8c9ac', oatmeal: '#d8c9ac', wheat: '#dbc597', dune: '#cbb48f', desert: '#c9a97c', safari: '#c2b28a',
  khaki: '#a89a72', kha: '#a89a72', tan: '#c19a6b', camel: '#c19a6b', fawn: '#c2a07c', biscuit: '#d0b48c', nougat: '#b38b6a',
  mushroom: '#a89888', shitake: '#8f7a64', fossil: '#a59a8a', driftwood: '#9c8b78', quicksand: '#c2a98a', sable: '#6d5845',
  falcon: '#b9b2a6', 'rocky road': '#5a4638', 'fallen rock': '#8a8378', catacombs: '#6b6159', 'bungee cord': '#9a8a6a',
  subterranean: '#4a4440', dusk: '#6e6a78', habitat: '#5e604a', 'plaza taupe': '#8f8476', vetiver: '#7e7a5e',
  brown: '#6b4a30', chocolate: '#4a3020', cocoa: '#5a3e2e', cacao: '#4e3426', espresso: '#3a2a20', coffee: '#4b3628',
  mocha: '#6f5240', walnut: '#5e4330', chestnut: '#6e3b25', mahogany: '#5a2a1e', umber: '#5b3f2a', sepia: '#704a2e',
  cognac: '#8e4a24', caramel: '#a8692e', cinnamon: '#8a4a2a', bronze: '#8c6a3a', copper: '#a8603a', rust: '#a84e28',
  terracotta: '#c4663a', clay: '#b0704e', brick: '#9c4430', 'stone brick': '#a2705e', earth: '#6b5240', soil: '#5a4434',
  'tree bark': '#5c4a3a', bark: '#5c4a3a', wood: '#7a5a3e', grizzly: '#6a5440', peyote: '#9a8a70', portobello: '#7a6a5c',
  // Greens
  green: '#2e7d46', olive: '#6b6b3a', 'army green': '#4b5320', army: '#4b5320', military: '#4f5634', moss: '#6a7040',
  sage: '#a3b293', 'sage green': '#9cab8c', forest: '#22472f', 'forest green': '#22472f', pine: '#1f4a3a', fir: '#2a4a3a',
  emerald: '#1a8050', jade: '#3a9a78', mint: '#a8dcc4', seafoam: '#9fd8c0', 'sea glass': '#a8ccc0', seaglass: '#a8ccc0',
  lime: '#9ccc3a', volt: '#d8f03a', chartreuse: '#c4d82a', citron: '#d6d84a', pistachio: '#b6c88a', avocado: '#5e6a2e',
  thyme: '#6e7a5c', juniper: '#4a6a5a', ivy: '#3a5a3a', laurel: '#6e7e5a', foliage: '#4e6a3a', capers: '#5e6440',
  grenoble: '#3e5a46', 'grenoble green': '#3e5a46', covert: '#545c44', camo: '#5c5e44', camouflage: '#5c5e44',
  'oil green': '#5c5a34', hammertone: '#5e6a5a', cedar: '#4e5a44', 'check green': '#3e6a4a', agave: '#6e8a7a',
  kelp: '#4a5a3a', spruce: '#3a5a52', vetiver: '#7e7a5e', 'baremark green': '#5a6a4a', marsh: '#4a5040',
  // Blues
  blue: '#2f5da8', navy: '#1c2541', nvy: '#1c2541', midnight: '#191e38', indigo: '#2e3a6e', denim: '#4a6a90',
  royal: '#2040c0', cobalt: '#1f4fb0', sapphire: '#1f3a8a', azure: '#3a86d0', sky: '#8ab8e0', 'sky blue': '#8ab8e0',
  'light blue': '#9cc0e0', baby: '#b8d4ec', powder: '#c0d8e8', 'dusty blue': '#8098b8', 'steel blue': '#4a6a8a',
  petrol: '#1e4a5a', teal: '#2a7f7a', turquoise: '#30c0c0', aqua: '#58c8d0', cyan: '#30b8d8', lagoon: '#2a8a9a',
  ocean: '#1e5a80', marine: '#1e3a6a', 'deep sea': '#1a3a4e', abyss: '#18243a', saxe: '#5a7ea8', 'bauhaus blue': '#2a4ab0',
  'rain drum': '#4a5868', eiger: '#3a6aa8', 'thunder blue': '#3a4a68', iceberg: '#c8dce4', ice: '#d6e8ee',
  // Reds / pinks / purples
  red: '#c62d2d', crimson: '#b0182e', scarlet: '#d0282a', cherry: '#a8182a', 'tnf red': '#c8202a', poppy: '#e0442a',
  burgundy: '#6e1e2c', maroon: '#5a1a22', wine: '#5e1a2a', oxblood: '#4e1a1e', bordeaux: '#5a1a28', ox: '#4e1a1e',
  mulberry: '#6a2a4a', plum: '#5a2a50', berry: '#8a2a5a', raspberry: '#b8285a', boysenberry: '#6a2a4a', currant: '#5a1e30',
  pink: '#ee8fb0', rose: '#e0a0a8', 'dusty rose': '#c89090', blush: '#efc4c0', sakura: '#f2c4cc', magenta: '#c8288a',
  fuchsia: '#d0287a', coral: '#e8734a', salmon: '#fa8072', peach: '#f0a882', apricot: '#f2b07a', lavender: '#c0a8d8',
  lilac: '#c3a8d8', mauve: '#b08aa0', violet: '#7a3ab0', purple: '#6e3fa0', amethyst: '#8a5ab0', orchid: '#c07ac0',
  'misty lilac': '#c8bcd4', 'purple sage': '#8a8a9a', grape: '#5a2a6a', aubergine: '#3e1e3a', eggplant: '#3e1e3a',
  // Yellows / oranges
  yellow: '#f2cc30', gold: '#c9a040', golden: '#d0a43a', mustard: '#c9a030', lemon: '#f4e04a', canary: '#f6dc3a',
  butter: '#f8e8a0', sun: '#f2c43a', saffron: '#e8a02a', ochre: '#c08a2e', honey: '#c9994a', amber: '#d08a2a',
  turmeric: '#d8952a', orange: '#ee7a2b', tangerine: '#f08a3a', pumpkin: '#d8662a', 'burnt orange': '#c0581e',
  'safety orange': '#f26a1a', 'laser orange': '#f0602a', flame: '#e8502a', lava: '#c83a2a', sunstone: '#e8945a',
  'transparent yellow': '#f2e48a', lemonade: '#f4e8a0', citronelle: '#d6d050',
  // Brand colour names seen in the catalog
  eclipse: '#1e2236', night: '#1c2030', nightsky: '#1c2236', 'dark night': '#1a1c26', blueberry: '#3a4a8a', tea: '#a08a5e',
  canvas: '#d8cbb0', neutral: '#d2c4aa', chai: '#b89a78', seedling: '#a8b878', slime: '#b8d04a', sparrow: '#8a7a6a',
  brume: '#c8c4bc', rock: '#8a8680', urchin: '#3a2a3e', beech: '#c8a880', birch: '#e0d8c8', tin: '#9a9a96', lead: '#5a5c60',
  nickel: '#9a968e', sail: '#ece6d6', gabbro: '#3e3e40', volcanic: '#3a3634', leopard: '#a87a4a', 'rain washed': '#8a98a2',
  shadowcast: '#4a4a52', biotite: '#2e2a26', pyrite: '#8a7a50', fur: '#8a6e52', fallow: '#b89a72', suede: '#a8825a',
  glade: '#6a8a5a', mantis: '#7ab86a', gravel: '#8a8478', twig: '#7a6a58', thistle: '#b0a0c0', champagne: '#e8d8b8',
  gulfstream: '#3a6a8a', hare: '#a89880', bracken: '#8a5a30', sesame: '#c8b090', 'arctic silk': '#e8ecec', elephant: '#8a8a88',
};

// Abbreviations used in SKU-style colour codes (adidas, Satisfy …).
const ABBR = {
  blk: 'black', blac: 'black', cblack: 'black', wht: 'white', ftwwht: 'white', cwhite: 'white', gry: 'grey', grey: 'grey',
  nvy: 'navy', dk: 'dark', lt: 'light', 'p.blk': 'black', 'l.gry': 'light grey', 'd.nvy': 'dark navy', 'i.gry': 'grey',
  's.beg': 'beige', 'h.beg': 'beige', yel: 'yellow', ivo: 'ivory', tnfblack: 'black', tnfblck: 'black', mtlc: 'metallic',
  karenoiro: 'black',
};

const MODS = {
  light: { dL: 16 }, lt: { dL: 16 }, pale: { dL: 20, c: 0.7 }, soft: { dL: 6, c: 0.7 }, dark: { dL: -18, c: 0.85 }, deep: { dL: -20 },
  dusty: { c: 0.55 }, muted: { c: 0.55 }, faded: { dL: 6, c: 0.6 }, washed: { dL: 6, c: 0.6 }, aged: { dL: 4, c: 0.8 },
  'sun bleached': { dL: 10, c: 0.6 }, bleached: { dL: 10, c: 0.6 }, vintage: { dL: 4, c: 0.75 },
  bright: { c: 1.3 }, neon: { c: 1.5, dL: 5 }, electric: { c: 1.4 }, vivid: { c: 1.3 }, hot: { c: 1.3 },
};

const PHRASES = new Map(Object.entries(W));
const MAX_WORDS = 3;

export function cleanColorName(name) {
  return String(name ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .toLowerCase()
    .replace(/^från [^-]+-\s*/, '') // "från Rich&Hanc-Gulfstream"
    .replace(/\b(off|tie)-(white|dye)\b/g, '$1 $2')
    .replace(/\btnf\s+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// First colourway part = the main colour ("black/summit white" -> "black").
const primaryPart = (clean) => clean.split(/\s*[\/,+]\s*|\s+-\s+|-(?=[a-z])/)[0].trim();

function lookupPart(part) {
  const words = part.split(/[\s]+/).map((w) => ABBR[w] ?? w).join(' ').split(' ').filter(Boolean);
  let best = null;
  for (let i = 0; i < words.length; i++) {
    for (let n = Math.min(MAX_WORDS, words.length - i); n >= 1; n--) {
      const phrase = words.slice(i, i + n).join(' ');
      const hex = PHRASES.get(phrase);
      // Longest phrase wins; on ties the later one (the head noun: "grenoble green" -> green).
      if (hex && (!best || n >= best.n)) best = { hex, n, i };
      if (hex) break;
    }
  }
  if (!best) return null;
  // Modifiers outside the matched phrase ("dark" in "dark olive", not in "dark slate").
  const rest = ` ${words.filter((_, j) => j < best.i || j >= best.i + best.n).join(' ')} `;
  const mods = Object.entries(MODS).filter(([m]) => rest.includes(` ${m} `));
  let lab = hexToLab(best.hex);
  for (const [, m] of mods) {
    lab = [Math.max(0, Math.min(100, lab[0] + (m.dL ?? 0))), lab[1] * (m.c ?? 1), lab[2] * (m.c ?? 1)];
  }
  return mods.length ? labToHex(lab) : best.hex;
}

// Returns "#rrggbb" for a store colour name, or null if it can't be read.
export function resolveColor(name, overrides = {}) {
  const clean = cleanColorName(name);
  if (!clean || clean.length > 60) return null; // long strings are descriptions in the wrong field
  if (overrides[clean]) return overrides[clean];
  const primary = primaryPart(clean);
  if (overrides[primary]) return overrides[primary];
  return lookupPart(primary) ?? lookupPart(clean);
}

// ---------- colour maths ----------
export function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toLin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const fromLin = (v) => Math.round(255 * Math.max(0, Math.min(1, v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)));
const WHITE = [0.95047, 1, 1.08883];

export function hexToLab(hex) {
  const [r, g, b] = hexToRgb(hex).map(toLin);
  const xyz = [
    (r * 0.4124 + g * 0.3576 + b * 0.1805) / WHITE[0],
    r * 0.2126 + g * 0.7152 + b * 0.0722,
    (r * 0.0193 + g * 0.1192 + b * 0.9505) / WHITE[2],
  ].map((t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116));
  return [116 * xyz[1] - 16, 500 * (xyz[0] - xyz[1]), 200 * (xyz[1] - xyz[2])];
}

export function labToHex([L, a, b]) {
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
  const inv = (f) => (f ** 3 > 216 / 24389 ? f ** 3 : (116 * f - 16) / (24389 / 27));
  const [x, y, z] = [inv(fx) * WHITE[0], inv(fy), inv(fz) * WHITE[2]];
  const rgb = [
    x * 3.2406 + y * -1.5372 + z * -0.4986,
    x * -0.9689 + y * 1.8758 + z * 0.0415,
    x * 0.0557 + y * -0.204 + z * 1.057,
  ].map(fromLin);
  return `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

// CIEDE2000 colour difference: ~2 barely visible, ~10 clearly different, >25 different colour.
export function deltaE([L1, a1, b1], [L2, a2, b2]) {
  const rad = Math.PI / 180;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cm = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)));
  const a1p = a1 * (1 + G), a2p = a2 * (1 + G);
  const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const h = (a, b) => { const v = Math.atan2(b, a) / rad; return v < 0 ? v + 360 : v; };
  const h1p = h(a1p, b1), h2p = h(a2p, b2);
  const dL = L2 - L1, dC = C2p - C1p;
  let dh = h2p - h1p;
  if (C1p * C2p === 0) dh = 0; else if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
  const dH = 2 * Math.sqrt(C1p * C2p) * Math.sin((dh / 2) * rad);
  const Lm = (L1 + L2) / 2, Cpm = (C1p + C2p) / 2;
  let hm = h1p + h2p;
  if (C1p * C2p !== 0) hm = Math.abs(h1p - h2p) > 180 ? (h1p + h2p + (h1p + h2p < 360 ? 360 : -360)) / 2 : (h1p + h2p) / 2;
  const T = 1 - 0.17 * Math.cos((hm - 30) * rad) + 0.24 * Math.cos(2 * hm * rad) + 0.32 * Math.cos((3 * hm + 6) * rad) - 0.2 * Math.cos((4 * hm - 63) * rad);
  const SL = 1 + (0.015 * (Lm - 50) ** 2) / Math.sqrt(20 + (Lm - 50) ** 2);
  const SC = 1 + 0.045 * Cpm, SH = 1 + 0.015 * Cpm * T;
  const RT = -2 * Math.sqrt(Cpm ** 7 / (Cpm ** 7 + 25 ** 7)) * Math.sin(60 * Math.exp(-(((hm - 275) / 25) ** 2)) * rad);
  return Math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH));
}
