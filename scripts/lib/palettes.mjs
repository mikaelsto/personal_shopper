// Seasonal colour palettes (12-season system), shared by the site's palette page and filter.
// Signature colours come from https://personalcolorai.com/blog/color-season-palettes.
// That article doesn't list neutrals. The `neutrals` below are standard season-analysis
// guidance, added because most apparel is black, white, grey, navy or beige.

export const SOURCE_URL = 'https://personalcolorai.com/blog/color-season-palettes';

const c = (name, hex) => ({ name, hex });

export const FAMILIES = [
  { id: 'spring', label: 'Spring', blurb: 'Warm & clear' },
  { id: 'summer', label: 'Summer', blurb: 'Cool & soft' },
  { id: 'autumn', label: 'Autumn', blurb: 'Warm & muted/deep' },
  { id: 'winter', label: 'Winter', blurb: 'Cool & vivid/deep' },
];

export const PALETTES = [
  {
    id: 'light-spring', family: 'spring', label: 'Light Spring', blurb: 'Delicate, warm and luminous',
    colors: [c('Light Peach', '#F8C8A8'), c('Soft Coral', '#F0A090'), c('Warm Ivory', '#FBF0E0'), c('Light Aqua', '#A8E0D8'), c('Butter Yellow', '#F8E8A0')],
    neutrals: [c('Light Camel', '#D8B890'), c('Light Warm Grey', '#C8C0B0'), c('Light Navy', '#4A5D8A')],
  },
  {
    id: 'true-spring', family: 'spring', label: 'True Spring', blurb: 'Warm, fresh, bright and golden',
    colors: [c('Coral', '#E8734A'), c('Peach', '#F0A882'), c('Salmon', '#FA8072'), c('Light Coral', '#F7A18C'), c('Warm Pink', '#F08080')],
    neutrals: [c('Ivory', '#F8EED8'), c('Camel', '#C19A6B'), c('Golden Brown', '#8B5A2B'), c('Warm Navy', '#2C3E6B')],
  },
  {
    id: 'bright-spring', family: 'spring', label: 'Bright Spring', blurb: 'Warm, vivid and high-energy',
    colors: [c('Hot Coral', '#F05040'), c('Bright Turquoise', '#20C8C0'), c('Warm Fuchsia', '#E8507A'), c('Vivid Yellow', '#F8D020'), c('Bright Aqua', '#20A8D8')],
    neutrals: [c('Clear Ivory', '#FAF6E8'), c('Bright Navy', '#1F3A70'), c('Warm Grey', '#8A8580')],
  },
  {
    id: 'light-summer', family: 'summer', label: 'Light Summer', blurb: 'Cool, pale and delicate',
    colors: [c('Powder Blue', '#C0D8E8'), c('Pale Rose', '#F0C8D0'), c('Soft Lavender', '#D0C8E8'), c('Cool Mint', '#B8E0D8'), c('Icy Pink', '#F0D8E0')],
    neutrals: [c('Soft White', '#F2F0EC'), c('Light Grey', '#C8CACF'), c('Grey Navy', '#5A6A8A'), c('Rose Beige', '#D8C0B8')],
  },
  {
    id: 'true-summer', family: 'summer', label: 'True Summer', blurb: 'Cool, soft and elegant',
    colors: [c('Rose Pink', '#E8A0B0'), c('Lavender', '#C0A8D8'), c('Dusty Blue', '#8098B8'), c('Soft Mauve', '#C098A8'), c('Cool Berry', '#A06080')],
    neutrals: [c('Soft White', '#EEEEEA'), c('Blue Grey', '#7A8696'), c('Navy', '#2B3A5A'), c('Rose Brown', '#8A6A6A')],
  },
  {
    id: 'soft-summer', family: 'summer', label: 'Soft Summer', blurb: 'Cool, muted and quietly romantic',
    colors: [c('Dusty Rose', '#D09898'), c('Grayed Lavender', '#A898B8'), c('Muted Teal', '#608888'), c('Soft Blue-Gray', '#8898A8'), c('Cool Mauve', '#A88090')],
    neutrals: [c('Oyster', '#DCD6CC'), c('Grey Taupe', '#8E8580'), c('Blue Charcoal', '#4A5260'), c('Soft Navy', '#3A4660')],
  },
  {
    id: 'soft-autumn', family: 'autumn', label: 'Soft Autumn', blurb: 'Warm and muted',
    colors: [c('Soft Camel', '#C4A882'), c('Dusty Peach', '#D4956A'), c('Warm Taupe', '#9E8070'), c('Muted Olive', '#8A9060'), c('Soft Terracotta', '#C47A5A')],
    neutrals: [c('Cream', '#F2E6CF'), c('Mushroom', '#A89888'), c('Khaki', '#A89A72'), c('Soft Brown', '#7A604A')],
  },
  {
    id: 'warm-autumn', family: 'autumn', label: 'Warm Autumn', blurb: 'Warm, deep, earthy and golden',
    colors: [c('Terracotta', '#C4663A'), c('Rust', '#A84E28'), c('Honey Gold', '#C9994A'), c('Olive', '#7A9E8A'), c('Warm Brown', '#6B5240')],
    neutrals: [c('Cream', '#F0E2C0'), c('Camel', '#B88A55'), c('Olive Khaki', '#6E6A3A'), c('Chocolate', '#4A3020')],
  },
  {
    id: 'deep-autumn', family: 'autumn', label: 'Deep Autumn', blurb: 'Warm, dark and dramatic',
    colors: [c('Dark Chocolate', '#3D1F0D'), c('Burgundy', '#6B1F2A'), c('Forest Green', '#1C3D2A'), c('Burnt Sienna', '#8B3A1A'), c('Deep Teal', '#1A3D3A')],
    neutrals: [c('Cream', '#EEE0C4'), c('Dark Olive', '#3E3E1E'), c('Espresso', '#2E1E14'), c('Warm Charcoal', '#3A3530')],
  },
  {
    id: 'true-winter', family: 'winter', label: 'True Winter', blurb: 'Cool, sharp and high-contrast',
    colors: [c('True Black', '#1A1A1A'), c('Bright White', '#F8F8F8'), c('Royal Blue', '#2040C0'), c('Emerald', '#1A8050'), c('Cool Fuchsia', '#C02080')],
    neutrals: [c('Navy', '#101C48'), c('Charcoal', '#333438'), c('Cool Grey', '#8A8C92')],
  },
  {
    id: 'bright-winter', family: 'winter', label: 'Bright Winter', blurb: 'Cool, electric and vivid',
    colors: [c('Bright White', '#F8F8F8'), c('Electric Blue', '#1060F0'), c('Hot Pink', '#E01880'), c('Vivid Purple', '#8020C0'), c('Icy Mint', '#A0F0E0')],
    neutrals: [c('Black', '#111111'), c('Navy', '#142060'), c('Cool Grey', '#9A9CA4')],
  },
  {
    id: 'deep-winter', family: 'winter', label: 'Deep Winter', blurb: 'Cool, deep and commanding',
    colors: [c('Deep Charcoal', '#282828'), c('Dark Navy', '#0A1028'), c('Deep Plum', '#380848'), c('Dark Burgundy', '#480818'), c('Deep Forest', '#0A2818')],
    neutrals: [c('Black', '#101010'), c('Pure White', '#F8F8F8'), c('Cool Grey', '#6A6C74')],
  },
];

// Basic colours for "shop by colour" without a season.
export const BASIC_COLORS = [
  c('Black', '#141414'), c('Charcoal', '#3A3A3C'), c('Grey', '#8C8C8C'), c('Light grey', '#C8C8C8'), c('White', '#F7F7F5'),
  c('Off-white', '#EDE6D6'), c('Beige', '#D2BC98'), c('Khaki', '#A89A72'), c('Brown', '#6B4A30'), c('Navy', '#1C2541'),
  c('Blue', '#2F5DA8'), c('Light blue', '#9CC0E0'), c('Teal', '#2A7F7A'), c('Green', '#2E7D46'), c('Olive', '#6B6B3A'),
  c('Sage', '#A3B293'), c('Yellow', '#F2CC30'), c('Orange', '#EE7A2B'), c('Red', '#C62D2D'), c('Burgundy', '#6E1E2C'),
  c('Pink', '#EE8FB0'), c('Purple', '#6E3FA0'), c('Lilac', '#C3A8D8'),
];

export const paletteById = Object.fromEntries(PALETTES.map((p) => [p.id, p]));
export const paletteSwatches = (p, withNeutrals = true) => [...p.colors, ...(withNeutrals ? p.neutrals : [])];
