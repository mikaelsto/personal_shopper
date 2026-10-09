// Seasonal colour palettes (12-season system), shared by the site's palette page and filter.
// Each season has 45-61 colours in groups (collected with Claude in Chrome, 2026-10-09):
//   signature (colors)  5 hero colours  personalcolorai.com/blog/color-season-palettes
//   core               full palette     personalcolorai.com/blog/<season>-color-palette
//   statement / everyday / accents / neutrals / avoid   toneandfit.app/palettes/<season>
// toneandfit names differ: their warm-spring = True Spring, cool-summer = True Summer,
// cool-winter = True Winter, true-winter = Bright (Clear) Winter.
// A core colour with almost no chroma is flagged neutral (third argument).

export const SOURCES = [
  { name: 'personalcolorai.com', url: 'https://personalcolorai.com/blog/color-season-palettes' },
  { name: 'Tone & Fit', url: 'https://toneandfit.app/palettes/' },
];
export const SOURCE_URL = SOURCES[0].url;

const c = (name, hex, neutral = false) => (neutral ? { name, hex, neutral } : { name, hex });

export const FAMILIES = [
  { id: 'spring', label: 'Spring', blurb: 'Warm & clear' },
  { id: 'summer', label: 'Summer', blurb: 'Cool & soft' },
  { id: 'autumn', label: 'Autumn', blurb: 'Warm & muted/deep' },
  { id: 'winter', label: 'Winter', blurb: 'Cool & vivid/deep' },
];

export const PALETTES = [
  {
    id: 'light-spring', family: 'spring', label: 'Light Spring', blurb: 'Delicate, warm and luminous', character: ['Warm', 'Light', 'Clear'],
    colors: [c('Light Peach', '#F8C8A8'), c('Soft Coral', '#F0A090'), c('Warm Ivory', '#FBF0E0'), c('Light Aqua', '#A8E0D8'), c('Butter Yellow', '#F8E8A0')],
  },
  {
    id: 'true-spring', family: 'spring', label: 'True Spring', blurb: 'Warm, fresh, bright and golden', character: ['Warm', 'Medium', 'Clear'],
    colors: [c('Coral', '#E8734A'), c('Peach', '#F0A882'), c('Salmon', '#FA8072'), c('Light Coral', '#F7A18C'), c('Warm Pink', '#F08080')],
  },
  {
    id: 'bright-spring', family: 'spring', label: 'Bright Spring', blurb: 'Warm, vivid and high-energy', character: ['Warm-neutral', 'Medium', 'Bright'],
    colors: [c('Hot Coral', '#F05040'), c('Bright Turquoise', '#20C8C0'), c('Warm Fuchsia', '#E8507A'), c('Vivid Yellow', '#F8D020'), c('Bright Aqua', '#20A8D8')],
  },
  {
    id: 'light-summer', family: 'summer', label: 'Light Summer', blurb: 'Cool, pale and delicate', character: ['Cool', 'Light', 'Soft'],
    colors: [c('Powder Blue', '#C0D8E8'), c('Pale Rose', '#F0C8D0'), c('Soft Lavender', '#D0C8E8'), c('Cool Mint', '#B8E0D8'), c('Icy Pink', '#F0D8E0')],
  },
  {
    id: 'true-summer', family: 'summer', label: 'True Summer', blurb: 'Cool, soft and elegant', character: ['Cool', 'Medium', 'Soft'],
    colors: [c('Rose Pink', '#E8A0B0'), c('Lavender', '#C0A8D8'), c('Dusty Blue', '#8098B8'), c('Soft Mauve', '#C098A8'), c('Cool Berry', '#A06080')],
  },
  {
    id: 'soft-summer', family: 'summer', label: 'Soft Summer', blurb: 'Cool, muted and quietly romantic', character: ['Cool-neutral', 'Medium', 'Muted'],
    colors: [c('Dusty Rose', '#D09898'), c('Grayed Lavender', '#A898B8'), c('Muted Teal', '#608888'), c('Soft Blue-Gray', '#8898A8'), c('Cool Mauve', '#A88090')],
  },
  {
    id: 'soft-autumn', family: 'autumn', label: 'Soft Autumn', blurb: 'Warm and muted', character: ['Warm-neutral', 'Medium', 'Muted'],
    colors: [c('Soft Camel', '#C4A882'), c('Dusty Peach', '#D4956A'), c('Warm Taupe', '#9E8070'), c('Muted Olive', '#8A9060'), c('Soft Terracotta', '#C47A5A')],
  },
  {
    id: 'warm-autumn', family: 'autumn', label: 'Warm Autumn', blurb: 'Warm, deep, earthy and golden', character: ['Warm', 'Medium-deep', 'Rich'],
    colors: [c('Terracotta', '#C4663A'), c('Rust', '#A84E28'), c('Honey Gold', '#C9994A'), c('Olive', '#7A9E8A'), c('Warm Brown', '#6B5240')],
  },
  {
    id: 'deep-autumn', family: 'autumn', label: 'Deep Autumn', blurb: 'Warm, dark and dramatic', character: ['Warm-neutral', 'Deep', 'Rich'],
    colors: [c('Dark Chocolate', '#3D1F0D'), c('Burgundy', '#6B1F2A'), c('Forest Green', '#1C3D2A'), c('Burnt Sienna', '#8B3A1A'), c('Deep Teal', '#1A3D3A')],
  },
  {
    id: 'true-winter', family: 'winter', label: 'True Winter', blurb: 'Cool, sharp and high-contrast', character: ['Cool', 'Medium-deep', 'Clear'],
    colors: [c('True Black', '#1A1A1A'), c('Bright White', '#F8F8F8'), c('Royal Blue', '#2040C0'), c('Emerald', '#1A8050'), c('Cool Fuchsia', '#C02080')],
  },
  {
    id: 'bright-winter', family: 'winter', label: 'Bright Winter', blurb: 'Cool, electric and vivid', character: ['Cool-neutral', 'Medium', 'Bright'],
    colors: [c('Bright White', '#F8F8F8'), c('Electric Blue', '#1060F0'), c('Hot Pink', '#E01880'), c('Vivid Purple', '#8020C0'), c('Icy Mint', '#A0F0E0')],
  },
  {
    id: 'deep-winter', family: 'winter', label: 'Deep Winter', blurb: 'Cool, deep and commanding', character: ['Cool-neutral', 'Deep', 'Clear'],
    colors: [c('Deep Charcoal', '#282828'), c('Dark Navy', '#0A1028'), c('Deep Plum', '#380848'), c('Dark Burgundy', '#480818'), c('Deep Forest', '#0A2818')],
  },
];

// Full palette per season: colour groups + colours to avoid.
const DETAILS = {
  'light-spring': {
    core: [c('Light Peach', '#FFDAB9'), c('Warm Pink', '#FF9AAE'), c('Light Coral', '#F08080'), c('Apricot', '#FBCEB1'), c('Buttercup Yellow', '#F9E154'), c('Cream', '#FFFDD0'), c('Light Aqua', '#7FFFD4'), c('Mint Green', '#AAF0D1'), c('Warm Lilac', '#DDA0DD'), c('Soft Coral', '#FF8C69'), c('Golden Tan', '#D2B48C'), c('Caramel', '#FFD59A'), c('Light Turquoise', '#AFEEEE'), c('Peach Pink', '#FF9A8B'), c('Warm Beige', '#F5E6CC', true), c('Honey', '#EB9605'), c('Light Sage', '#C1D5A4'), c('Chamomile', '#F4E99B')],
    statement: [c('Light Coral', '#FF9A76'), c('Butter Yellow', '#FFD166'), c('Mint Green', '#A8E6CF'), c('Light Warm Aqua', '#7EC8E3'), c('Light Warm Pink', '#FFB6C1'), c('Soft Warm Sky Blue', '#B5D8F7'), c('Warm Peach', '#FFCA99'), c('Light Lime Green', '#CDEB8B'), c('Warm Blush Pink', '#F4A7B9'), c('Warm Sky Blue', '#87CEEB')],
    everyday: [c('Soft Blush', '#FADADD'), c('Pale Butter', '#FFF0C0'), c('Soft Mint', '#C9E4CA'), c('Pale Aqua', '#B5DEDD'), c('Pale Warm Yellow', '#FFEAA7'), c('Soft Sky', '#D8EEF5'), c('Pale Peach', '#FDD9B5'), c('Soft Sage', '#D4EDDA'), c('Misty Rose', '#FFE4E1'), c('Light Warm Green', '#E8F4D9'), c('Warm Cream', '#FFECD2'), c('Soft Warm Blue', '#C8E6F0')],
    accents: [c('Vivid Coral', '#FF6F61'), c('Vivid Golden Yellow', '#F7CE46'), c('Vivid Mint', '#88D8B0'), c('Vivid Warm Aqua', '#5BC8E8'), c('Vivid Warm Pink', '#FF9EC0'), c('Vivid Lime', '#A8E45A'), c('Vivid Orange', '#FF8040'), c('Vivid Warm Sky Blue', '#6EC6FF')],
    neutrals: [c('Warm Ivory', '#F5F0E1'), c('Sand', '#D2C6A5'), c('Light Taupe', '#C4B8A0'), c('Oat', '#E8DCC8'), c('Cream', '#FAF3E0'), c('Pale Khaki', '#D5CAAD'), c('Wheat', '#BFB393'), c('Linen', '#EDE3D0')],
    avoid: [c('Black', '#000000'), c('Deep Indigo', '#4B0082'), c('Slate Grey', '#708090'), c('Burgundy', '#800020'), c('Saddle Brown', '#8B4513'), c('Navy', '#000080'), c('Cool Blush', '#E0BFB8'), c('Olive', '#808000'), c('Wine', '#722F37')],
  },
  'true-spring': {
    core: [c('Coral', '#FF6F52'), c('Warm Peach', '#FFAA80'), c('Golden Yellow', '#FFD700'), c('Sunflower', '#FFDA03'), c('Tangerine', '#FF9944'), c('Poppy Red', '#E35335'), c('Tomato Red', '#FF6347'), c('Warm Turquoise', '#40C9A2'), c('Leaf Green', '#6DBE45'), c('Kelly Green', '#4CBB17'), c('Camel', '#C19A6B'), c('Warm Ivory', '#FFFFF0', true), c('Light Aqua', '#7FFFD4'), c('Clear Teal', '#008080'), c('Warm Medium Brown', '#8B6914'), c('Apricot', '#FBCEB1'), c('Golden Tan', '#D2B48C')],
    statement: [c('Vivid Coral Orange', '#FF6B35'), c('Golden Yellow', '#E8AA14'), c('Warm Medium Green', '#2E8B57'), c('Warm Turquoise', '#009DB5'), c('Warm Orange', '#FF8C42'), c('Golden Amber', '#DAA520'), c('Spring Green', '#3CB371'), c('Deep Warm Coral', '#D94F30'), c('Warm Teal', '#5BA0A0'), c('Warm Gold', '#CFB53B')],
    everyday: [c('Warm Golden Orange', '#F5A623'), c('Bright Warm Green', '#7CB518'), c('Muted Coral', '#E07A5F'), c('Warm Sky Teal', '#4AADCF'), c('Amber Gold', '#D4A017'), c('Warm Apricot', '#EFA94A'), c('Lime Green', '#85C428'), c('Warm Terracotta', '#E78F6D'), c('Warm Cyan', '#55C1C0'), c('Olive Gold', '#BDA10E'), c('Warm Tangerine', '#F2B134'), c('Warm Medium Green', '#6DAF6A')],
    accents: [c('Vivid Red Orange', '#FF4500'), c('Vivid Warm Teal', '#00A878'), c('Vivid Terracotta', '#E55934'), c('Vivid Warm Green', '#32CD32'), c('Vivid Orange', '#FF6600'), c('Vivid Turquoise', '#00B8A9'), c('Vivid Amber', '#F4A302')],
    neutrals: [c('Butter Cream', '#F2E8CF'), c('Camel', '#C9A96E'), c('Warm Tan', '#A68A64'), c('Sandstone', '#DDD0B6'), c('Ivory', '#F5EDDA'), c('Honey Beige', '#CCAF78'), c('Toffee', '#AA8F6A'), c('Oatmeal', '#E0D5BC')],
    avoid: [c('Black', '#000000'), c('Stark White', '#FFFFFF'), c('Cool Magenta', '#C71585'), c('Steel Blue', '#4682B4'), c('Dusty Grey', '#A9A9A9'), c('Charcoal', '#36454F'), c('Cool Lilac', '#D8BFD8'), c('Rust', '#B7410E')],
  },
  'bright-spring': {
    core: [c('Clear Orange', '#F07830'), c('Tangerine', '#FF9966'), c('Warm Red', '#E23D28'), c('Warm Pink', '#FF69B4'), c('Spring Green', '#00C853'), c('Bright Navy', '#1565C0')],
    statement: [c('Vivid Warm Pink Red', '#FF2D55'), c('Vivid Orange', '#FF9500'), c('Vivid Warm Teal', '#00C7BE'), c('Vivid Warm Violet', '#5856D6'), c('Vivid Coral Red', '#FF6961'), c('Vivid Warm Green', '#34C759'), c('Vivid Yellow', '#FFCC02'), c('Vivid Hot Pink', '#FF3A8C'), c('Vivid Cyan Teal', '#00D4C8'), c('Vivid Golden Orange', '#FFB300')],
    everyday: [c('Warm Orange', '#FF9F0A'), c('Bright Sky Blue', '#64D2FF'), c('Mid Green', '#4CD964'), c('Bright Yellow', '#FFD600'), c('Bright Pink', '#FF6482'), c('Mid Mint', '#57D68D'), c('Bright Violet', '#BF5AF2'), c('Bright Aqua', '#70D8FF'), c('Light Yellow', '#FFE100'), c('Warm Coral', '#FF8A50'), c('Soft Violet', '#C77DFF'), c('Bright Teal', '#50E3C2')],
    accents: [c('Vivid Red', '#FF3B30'), c('Vivid Blue', '#007AFF'), c('Vivid Green', '#30D158'), c('Vivid Purple', '#AF52DE')],
    neutrals: [c('Bright White', '#F5F5F0'), c('Warm Grey', '#D1CBC1'), c('Stone', '#B8AFA7'), c('Pale Sand', '#E5DFD5'), c('Soft White', '#FAF9F6'), c('Pebble', '#D6D0C6'), c('Greige', '#BDB4AB'), c('Shell', '#EAE4DA')],
    avoid: [c('Dusty Rose', '#BC8F8F'), c('Sage', '#9CAF88'), c('Muddy Brown', '#8B7355'), c('Dusty Mauve', '#B0A8B9'), c('Camel', '#C8AD7F'), c('Black', '#000000'), c('Burgundy', '#800020'), c('Dusty Blue', '#B0C4DE'), c('Sienna', '#A0522D')],
  },
  'light-summer': {
    core: [c('Powder Blue', '#B0E0E6'), c('Soft Pink', '#FFB6C1'), c('Cool Lavender', '#E6E6FA', true), c('Light Gray', '#D3D3D3', true), c('Rose Quartz', '#F7CAC9'), c('Icy Blue', '#E0F7FA', true), c('Soft Mauve', '#D8A9C4'), c('Periwinkle', '#CCCCFF'), c('Cloud Gray', '#C4C4C4', true), c('Muted Teal', '#5F9EA0'), c('Soft Raspberry', '#D1516D'), c('Cool Sage', '#B2BEB5', true), c('Serenity Blue', '#91A8D0'), c('Pale Rose', '#F9E4E4', true), c('Silver', '#C0C0C0', true), c('Soft Denim', '#6F8FAF'), c('Cool White', '#F0F0F0', true), c('Light Wisteria', '#D7BDE2')],
    statement: [c('Powder Blue', '#8AAEC2'), c('Soft Lavender', '#C2A3CC'), c('Cool Sage', '#90B8A8'), c('Dusty Rose', '#D4A5A5'), c('Cool Teal Blue', '#7BAAB5'), c('Soft Lilac', '#C8B0D4'), c('Cool Mint Green', '#A8C4B8'), c('Soft Mauve', '#B0A0C0'), c('Cool Blue Gray', '#8FB8C8'), c('Soft Pink Mauve', '#D0B8C8')],
    everyday: [c('Light Blue Gray', '#B8C9D9'), c('Pale Lilac', '#D3BCE8'), c('Pale Sage', '#A7C5BD'), c('Pale Rose', '#E0B4C8'), c('Light Periwinkle', '#9BB7D4'), c('Light Blue', '#C0D1E1'), c('Pale Lavender', '#DBCAF0'), c('Pale Teal', '#AFCDC5'), c('Pale Pink', '#E8BCD0'), c('Soft Mint', '#B7D5CD'), c('Soft Purple Blue', '#D8C8E4'), c('Soft Cool Green', '#C0D8CC')],
    accents: [c('Cool Blue', '#7A93AC'), c('Cool Lavender', '#B48EAD'), c('Cool Teal', '#6FA8A0'), c('Cool Rose', '#C48B9F'), c('Periwinkle', '#8FA5C4'), c('Cool Sage', '#A0C0A8'), c('Cool Mauve', '#C0A0BC'), c('Cool Sky', '#7AB8C8')],
    neutrals: [c('Soft White', '#E8E3DF'), c('Rose Grey', '#C8BFC4'), c('Dove Grey', '#B5B0AD'), c('Pearl', '#D6D1CE'), c('Cloud', '#EDEAE7'), c('Mauve Grey', '#CEC5CA'), c('Cool Stone', '#BBB6B3'), c('Mist', '#DCD7D4')],
    avoid: [c('Black', '#000000'), c('Vivid Orange', '#FF4500'), c('Golden Mustard', '#DAA520'), c('Saddle Brown', '#8B4513'), c('Fuchsia', '#FF00FF'), c('Coral', '#FF7F50'), c('Beige', '#F5F5DC'), c('Burgundy', '#800020')],
  },
  'true-summer': {
    core: [c('Dusty Rose', '#DCAE96'), c('Soft Blue', '#6E9ECF'), c('Lavender', '#B57EDC'), c('Mauve', '#C08081'), c('Powder Blue', '#B0E0E6'), c('Rose Pink', '#FF66CC'), c('Cool Taupe', '#8B8589', true), c('Soft Periwinkle', '#CCCCFF'), c('Muted Berry', '#8E4585'), c('Slate Blue', '#6A5ACD'), c('Soft Raspberry', '#D1516D'), c('Cool Cocoa', '#8B7D7B', true), c('Soft Teal', '#5F9EA0'), c('Gray Blue', '#6699CC'), c('Wisteria', '#C9A0DC'), c('Soft White', '#F5F5F5', true), c('Smoky Blue', '#5D7B93'), c('Cool Gray', '#A9A9A9', true)],
    statement: [c('Cool Muted Blue', '#6E8CA0'), c('Soft Purple', '#9B7DB8'), c('Muted Steel Blue', '#4E7C9B'), c('Dusty Rose Mauve', '#A0728A'), c('Cool Sage Green', '#5B8A72'), c('Soft Violet', '#8870A0'), c('Cool Teal', '#3E7A8A'), c('Muted Warm Mauve', '#B08090'), c('Cool Forest Green', '#608878'), c('Periwinkle Blue', '#7E80B0')],
    everyday: [c('Mid Blue Gray', '#87A2B4'), c('Mid Lavender', '#B39DCA'), c('Mid Sage Teal', '#6D9F8E'), c('Mid Dusty Rose', '#C497A8'), c('Mid Periwinkle', '#7C99B0'), c('Mid Soft Purple', '#BBA5D2'), c('Mid Cool Green', '#75A796'), c('Mid Mauve', '#CC9FB0'), c('Mid Blue', '#84A1B8'), c('Light Blue Gray', '#97B2C6'), c('Light Lavender', '#C3ADDA'), c('Light Cool Green', '#7DAF9E')],
    accents: [c('Deep Blue', '#4A6FA5'), c('Deep Lavender', '#8E6C9E'), c('Deep Sage', '#3D8B70'), c('Deep Rose', '#9E607A'), c('Periwinkle', '#5578A0'), c('Violet', '#9674A6'), c('Teal', '#459378'), c('Mauve', '#A66882')],
    neutrals: [c('Cool Stone', '#D5D0CC'), c('Lavender Grey', '#B3ADB5'), c('Heather', '#A19BA3'), c('Pebble Grey', '#C5C0BD'), c('Oyster', '#DBD6D2'), c('Mauve Grey', '#B9B3BB'), c('Slate Grey', '#A7A1A9'), c('Silver Grey', '#CBC6C3')],
    avoid: [c('Coral', '#FF7F50'), c('Golden Mustard', '#B8860B'), c('Black', '#000000'), c('Vivid Orange', '#FF6600'), c('Electric Fuchsia', '#FF00FF'), c('Burnt Orange', '#CC5500'), c('Chocolate Brown', '#7B3F00')],
  },
  'soft-summer': {
    core: [c('Dusty Mauve', '#B4838D'), c('Sage Green', '#B2AC88'), c('Soft Slate', '#708090', true), c('Muted Cocoa', '#8B7D6B', true), c('Dusty Rose', '#C4A484'), c('Stone Gray', '#928E85', true), c('Soft Plum', '#8E4585'), c('Muted Teal', '#5F8A8B'), c('Lavender Gray', '#B4A7C7'), c('Dusty Blue', '#6E7F80', true), c('Soft Raspberry', '#A85064'), c('Cool Khaki', '#BDB76B'), c('Oatmeal', '#D3CABD', true), c('Muted Rose', '#C08081'), c('Pewter', '#8E9196', true), c('Soft Olive', '#8A9A5B'), c('Cool Taupe', '#8B8589', true), c('Soft White', '#EDEBE6', true)],
    statement: [c('Muted Blue Gray', '#7A8E99'), c('Muted Soft Purple', '#9E8BAA'), c('Muted Cool Sage', '#6B8F7A'), c('Muted Dusty Rose', '#A4848E'), c('Muted Steel Blue', '#6D899E'), c('Muted Periwinkle', '#8A8AA8'), c('Muted Cool Green', '#749080'), c('Muted Pink Mauve', '#B09090'), c('Muted Slate Blue', '#7888A0'), c('Muted Rose Gray', '#A89898')],
    everyday: [c('Soft Blue Gray', '#9AABB7'), c('Soft Lilac', '#B5A3C1'), c('Soft Cool Sage', '#8AAF9A'), c('Soft Dusty Rose', '#C2A5AD'), c('Soft Periwinkle', '#8FA1B2'), c('Soft Lavender', '#BDA8C9'), c('Soft Cool Green', '#92B7A2'), c('Soft Mauve', '#CCA8B5'), c('Soft Blue', '#97A9BA'), c('Soft Purple', '#C5B0D1'), c('Soft Mint Sage', '#9ABFAA'), c('Soft Pink', '#D4B0BD')],
    accents: [c('Deep Cool Blue', '#5C7A8A'), c('Deep Soft Purple', '#8A7399'), c('Deep Cool Sage', '#5A876F'), c('Deep Dusty Rose', '#996D7C'), c('Deep Periwinkle', '#607D93'), c('Deep Violet', '#9278A1'), c('Deep Teal Green', '#628F77'), c('Deep Mauve', '#A17584')],
    neutrals: [c('Mist Grey', '#D0CBC8'), c('Taupe Grey', '#B8B2AF'), c('Ash', '#A6A09D'), c('Fog', '#C4BFBC'), c('Pearl Grey', '#D6D1CE'), c('Mushroom Grey', '#BEB8B5'), c('Pewter Taupe', '#ACA6A3'), c('Soft Stone', '#CAC5C2')],
    avoid: [c('Neon Orange', '#FF4500'), c('Electric Blue', '#0000FF'), c('Stark White', '#FFFFFF'), c('Jet Black', '#000000'), c('Golden Mustard', '#DAA520'), c('True Teal', '#008080'), c('Peach', '#FFDAB9'), c('True Red', '#C41E3A')],
  },
  'soft-autumn': {
    core: [c('Warm Taupe', '#8B7D6B', true), c('Dusty Olive', '#7D8471', true), c('Muted Gold', '#C5A55A'), c('Soft Terracotta', '#C4735A'), c('Warm Cocoa', '#75614B'), c('Oatmeal', '#D3CABD', true), c('Dusty Peach', '#EDAA8C'), c('Sage', '#B2AC88'), c('Warm Mauve', '#AB8A7E'), c('Soft Caramel', '#C68E4E'), c('Muted Teal', '#5F8A8B'), c('Light Olive', '#A09060'), c('Mushroom', '#A5A08C', true), c('Soft Rust', '#A65E3D'), c('Warm Cream', '#F5E6CC', true), c('Dusty Rose Gold', '#C4A68A'), c('Dark Taupe', '#5C504B', true), c('Muted Amber', '#C49B4F')],
    statement: [c('Terracotta', '#C4714A'), c('Golden Camel', '#C4A064'), c('Warm Mustard', '#B89030'), c('Olive Green', '#7C8C4C'), c('Warm Muted Teal', '#5E8C82'), c('Warm Brown', '#8C6848'), c('Rust', '#A85838'), c('Dusty Warm Rose', '#BC8474'), c('Warm Sage', '#8A9E6E'), c('Warm Copper Orange', '#C87850')],
    everyday: [c('Warm Sand', '#D4B898'), c('Dusty Warm Rose', '#C9A090'), c('Muted Sage Green', '#A8B890'), c('Warm Khaki', '#C8B878'), c('Dusty Warm Mauve', '#C0A4A0'), c('Muted Teal Sage', '#8CA89E'), c('Warm Clay', '#C8906E'), c('Warm Cream', '#D8C8A0'), c('Soft Olive', '#B0B880'), c('Dusty Warm Coral', '#D0A888'), c('Golden Straw', '#B8A878'), c('Muted Teal Gray', '#90A898')],
    accents: [c('Burnt Orange', '#B04830'), c('Deep Warm Olive', '#4A6C3A'), c('Deep Warm Teal', '#3A6C62'), c('Deep Amber', '#9A7030'), c('Warm Wine Burgundy', '#8C3840'), c('Bronze Olive', '#7A6228'), c('Vivid Rust', '#C05838'), c('Dark Sage', '#607050')],
    neutrals: [c('Oat Cream', '#D9D0C1'), c('Mushroom', '#BFB5A3'), c('Warm Taupe', '#A89E8E'), c('Sand Taupe', '#CBBFAF'), c('Bone', '#DED6C9'), c('Putty', '#C4BAAA'), c('Warm Stone', '#ADA394'), c('Latte', '#D0C5B5')],
    avoid: [c('Neon Orange', '#FF4500'), c('Electric Blue', '#0000FF'), c('True Fuchsia', '#FF00FF'), c('Stark White', '#FFFFFF'), c('Jet Black', '#000000'), c('Firebrick Red', '#B22222'), c('Lavender', '#E6E6FA'), c('Bottle Green', '#004225')],
  },
  'warm-autumn': {
    core: [c('Burnt Orange', '#CC5500'), c('Olive Green', '#6B8E23'), c('Mustard Yellow', '#E1AD01'), c('Terracotta', '#E2725B'), c('Warm Brown', '#7B5B3A'), c('Camel', '#C19A6B'), c('Rust', '#B7410E'), c('Pumpkin', '#FF7518'), c('Warm Olive', '#808000'), c('Golden Amber', '#FFBF00'), c('Chocolate', '#7B3F00'), c('Teal', '#008080'), c('Warm Red', '#C0392B'), c('Mossy Green', '#8A9A5B'), c('Pumpkin Spice', '#C45B28'), c('Ivory', '#FFFFF0', true), c('Warm Beige', '#F5DEB3'), c('Cinnamon', '#D2691E')],
    statement: [c('Rust Orange', '#C2622D'), c('Golden Mustard', '#B8860B'), c('Warm Muted Teal', '#2E7A6C'), c('Warm Brown', '#A0522D'), c('Pumpkin Orange', '#CA6A35'), c('Deep Gold', '#8B6914'), c('Warm Wine Burgundy', '#7A3840'), c('Warm Forest Green', '#5A8058'), c('Deep Terracotta', '#D2723D')],
    everyday: [c('Warm Golden Orange', '#D4955A'), c('Warm Golden', '#C9A33E'), c('Olive Green', '#7F9A65'), c('Muted Warm Teal', '#7AA890'), c('Warm Terracotta', '#CC8B6E'), c('Warm Amber', '#DC9D62'), c('Warm Mustard', '#D1AB46'), c('Warm Sage', '#87A26D'), c('Warm Dusty Rose', '#C4907A'), c('Warm Apricot', '#E4A56A'), c('Warm Teal Green', '#7EB298'), c('Warm Khaki Gold', '#A89848')],
    accents: [c('Deep Rust', '#A0430A'), c('Deep Gold Olive', '#8A7600'), c('Deep Olive Green', '#4F7302'), c('Deep Warm Teal', '#1E6057'), c('Deep Terracotta', '#923C1E'), c('Deep Burgundy', '#7A3040'), c('Vivid Rust Orange', '#B0531A'), c('Vivid Olive', '#567D1E')],
    neutrals: [c('Warm Sand', '#D8CCBB'), c('Khaki Taupe', '#B5A48E'), c('Warm Stone', '#9C8D78'), c('Camel Beige', '#C7B8A2'), c('Cream Beige', '#DDD2C1'), c('Mushroom Tan', '#BAA994'), c('Walnut Taupe', '#A1927E'), c('Buff', '#CCBDA8')],
    avoid: [c('Hot Pink', '#FF1493'), c('Royal Blue', '#4169E1'), c('Pure Black', '#000000'), c('Stark White', '#FFFFFF'), c('Icy Pastel', '#E0FFFF'), c('Navy', '#000080'), c('Silver Grey', '#C0C0C0'), c('Cool Pink', '#FF69B4'), c('Icy White', '#F0F8FF')],
  },
  'deep-autumn': {
    core: [c('Dark Olive', '#556B2F'), c('Warm Burgundy', '#800020'), c('Espresso', '#3C1414'), c('Burnt Sienna', '#E97451'), c('Dark Teal', '#014D4E'), c('Rust', '#B7410E'), c('Bronze', '#CD7F32'), c('Warm Brick', '#CB4154'), c('Dark Chocolate', '#3D1C02'), c('Dark Tomato Red', '#9B2335'), c('Forest Green', '#228B22'), c('Dark Camel', '#A67B5B'), c('Cognac', '#9F381D'), c('Dark Gold', '#B8860B'), c('Pumpkin Spice', '#C45B28'), c('Mahogany', '#C04000'), c('Warm Charcoal', '#4A4A4A', true), c('Dark Moss', '#4A5D23')],
    statement: [c('Saddle Brown', '#8B4513'), c('Deep Brown', '#704214'), c('Dark Warm Brown', '#5C4827'), c('Chocolate Brown', '#7B3F00'), c('Deep Warm Burgundy', '#882020'), c('Deep Warm Teal', '#2E5E50'), c('Dark Bronze', '#6B5C28'), c('Deep Forest Green', '#3A5838'), c('Deep Rust Red', '#7A3830')],
    everyday: [c('Warm Mid Brown', '#A36B3E'), c('Golden Brown', '#917040'), c('Olive', '#6B7D4A'), c('Warm Teal', '#3E7060'), c('Warm Terracotta', '#A06050'), c('Copper Brown', '#AB7346'), c('Warm Amber Brown', '#997848'), c('Sage Olive', '#738552'), c('Warm Rust', '#A86858'), c('Muted Green', '#6A8870'), c('Warm Tan', '#B07B5A'), c('Deep Camel', '#7A5038')],
    accents: [c('Deep Rust', '#6B2E0F'), c('Deep Bronze', '#5A4310'), c('Deep Olive', '#3B4F1A'), c('Deep Teal', '#1E4840'), c('Deep Terracotta', '#6E2A1A'), c('Deep Burgundy', '#6A1828'), c('Deep Copper', '#7B3E1F'), c('Deep Forest Green', '#2E5030')],
    neutrals: [c('Dark Sand', '#C4B39A'), c('Mocha Taupe', '#A69580'), c('Walnut', '#8E7E6B'), c('Warm Khaki', '#B5A590'), c('Toast', '#CABBA2'), c('Coffee Taupe', '#AC9B86'), c('Bark', '#948471'), c('Warm Stone', '#BBA996')],
    avoid: [c('Powder Pink', '#F8C8DC'), c('Icy Blue-Grey', '#B0C4DE'), c('Chalk White', '#FFF8DC'), c('Fuchsia', '#FF00FF'), c('Lavender Pastel', '#E6E6FA'), c('Black', '#000000'), c('Emerald Teal', '#004D40'), c('Cool Grey', '#E8E8E8')],
  },
  'true-winter': {
    core: [c('Pure Black', '#000000', true), c('Pure White', '#FFFFFF', true), c('True Red', '#C0392B'), c('Royal Blue', '#4169E1'), c('Emerald Green', '#50C878'), c('Hot Pink', '#FF69B4'), c('Deep Purple', '#6A0DAD'), c('Cobalt Blue', '#0047AB'), c('Magenta', '#FF0090'), c('Navy', '#000080'), c('Icy Pink', '#FFD1DC'), c('Cool Berry', '#8E4585'), c('Sapphire', '#0F52BA'), c('Charcoal', '#36454F', true), c('Cool Lemon', '#FFF44F'), c('Silver', '#C0C0C0', true), c('Icy Violet', '#DDA0DD'), c('Pine Green', '#01796F')],
    statement: [c('True Red', '#C41E3A'), c('Royal Blue', '#003DA5'), c('Emerald Green', '#006B3F'), c('Deep Violet', '#6C0BA9'), c('Crimson', '#BF0A30'), c('Cobalt Blue', '#0047B0'), c('Cool Dark Green', '#00754A'), c('Magenta Purple', '#8B1A8B'), c('Cool Deep Rose', '#CC2244'), c('Deep Cool Blue', '#005A9E')],
    everyday: [c('Deep Blue', '#1565C0'), c('Deep Red', '#C62828'), c('Cool Teal Green', '#00897B'), c('Deep Purple', '#7B1FA2'), c('Deep Red Orange', '#D84315'), c('Medium Blue', '#1976D2'), c('Medium Red', '#D32F2F'), c('Teal', '#009688'), c('Medium Purple', '#8E24AA'), c('Medium Orange Red', '#E64A19'), c('Bright Blue', '#1E88E5'), c('Bright Teal', '#00A99D')],
    accents: [c('Deep Red', '#B71C1C'), c('Deep Navy', '#1A237E'), c('Deep Cool Green', '#1B5E20'), c('Deep Violet', '#4A148C'), c('Deep Orange Red', '#BF360C'), c('Deep Teal', '#006064'), c('Deep Magenta', '#880E4F'), c('Deep Olive Green', '#33691E')],
    neutrals: [c('Pure White', '#FAFAFA'), c('Near Black', '#212121'), c('Graphite', '#616161'), c('Light Grey', '#E0E0E0'), c('Icy White', '#F5F5F5'), c('Dark Grey', '#555555'), c('Silver Grey', '#D6D6D6')],
    avoid: [c('Coral', '#FF7F50'), c('Golden Mustard', '#DAA520'), c('Warm Tan', '#CD853F'), c('Olive', '#808000'), c('Peach Cream', '#FFE4B5'), c('Camel', '#C8AD7F'), c('Peach', '#FFDAB9'), c('Beige', '#F5F5DC')],
  },
  'bright-winter': {
    core: [c('Fuchsia', '#FF00FF'), c('Clear Red', '#E02020'), c('Icy Blue', '#A5F2F3'), c('Bright Teal', '#00CED1'), c('Pine Green', '#01796F'), c('Black', '#000000', true)],
    statement: [c('Vivid Warm Pink Red', '#E5004F'), c('Vivid Royal Blue', '#0057B8'), c('Vivid Cool Green', '#009B3A'), c('Vivid Magenta Purple', '#8B008B'), c('Vivid Hot Pink', '#FF0080'), c('Vivid True Red', '#CC0000'), c('Vivid Bright Blue', '#0080FF'), c('Vivid Emerald', '#00CC66'), c('Vivid Violet', '#9900CC'), c('Vivid Orange Red', '#FF6600')],
    everyday: [c('Bright Blue', '#2196F3'), c('Bright Pink', '#E91E63'), c('Bright Teal', '#00BFA5'), c('Bright Purple', '#9C27B0'), c('Bright Orange Red', '#FF5722'), c('Vivid Blue', '#1E88E5'), c('Vivid Cerise', '#D81B60'), c('Vivid Cyan', '#00C9AF'), c('Vivid Violet', '#AB47BC'), c('Vivid Coral', '#FF6D33'), c('Light Vivid Blue', '#42A5F5'), c('Vivid Mint', '#26D9B9')],
    accents: [c('Vivid Red', '#D50000'), c('Vivid Indigo Blue', '#304FFE'), c('Vivid Green', '#00C853'), c('Vivid Purple', '#AA00FF'), c('Vivid Orange', '#FF6D00'), c('Vivid Sky Blue', '#00B0FF'), c('Vivid Pink', '#C51162'), c('Vivid Lime', '#64DD17')],
    neutrals: [c('Optic White', '#F5F5F5'), c('Charcoal', '#2D2D2D'), c('Slate Grey', '#5A5A5A'), c('Light Grey', '#E0E0E0'), c('Pure White', '#FAFAFA'), c('Ink', '#333333'), c('Mid Grey', '#666666'), c('Frost Grey', '#EBEBEB')],
    avoid: [c('Tan', '#D2B48C'), c('Dusty Salmon', '#E9967A'), c('Olive Khaki', '#BDB76B'), c('Warm Beige', '#C0A080'), c('Dusty Mauve', '#B0A8B9'), c('Rust', '#B7410E'), c('Sage Grey', '#B2BEB5'), c('Wheat', '#F5DEB3'), c('Dusty Wine', '#722F37')],
  },
  'deep-winter': {
    core: [c('Black', '#000000', true), c('Deep Berry', '#8E4585'), c('Dark Emerald', '#046307'), c('Cool Burgundy', '#722F37'), c('Navy', '#000080'), c('Deep Plum', '#4B0082'), c('Dark Teal', '#014D4E'), c('Icy Pink', '#FFD1DC'), c('Charcoal', '#36454F', true), c('Sapphire', '#0F52BA'), c('Cool Red', '#B22222'), c('Dark Magenta', '#8B008B'), c('Forest Green', '#014421'), c('Eggplant', '#614051'), c('Silver', '#C0C0C0', true), c('Icy Blue', '#E0F7FA', true), c('Espresso', '#3C1414'), c('Deep Wine', '#5C0029')],
    statement: [c('Deep Burgundy Red', '#8B0000'), c('Midnight Navy', '#00205B'), c('Deep Emerald Teal', '#004D40'), c('Deep Wine', '#800020'), c('Deep Royal Blue', '#002868'), c('Deep Forest Teal', '#005A4A'), c('Deep Purple', '#55008C'), c('Deep Crimson', '#6B0020'), c('Deep Steel Blue', '#003050')],
    everyday: [c('Deep Blue', '#0D47A1'), c('Deep Magenta Rose', '#880E4F'), c('Deep Teal', '#00695C'), c('Deep Purple', '#4A148C'), c('Deep Red', '#B71C1C'), c('Medium Deep Blue', '#1565C0'), c('Deep Cerise', '#9C1458'), c('Medium Deep Teal', '#007B68'), c('Medium Purple', '#5C1F9E'), c('Medium Deep Red', '#C62828'), c('Deep Cobalt', '#0B3D91'), c('Deep Wine Rose', '#7C0A44')],
    accents: [c('Deep Red', '#6A0012'), c('Deep Navy', '#001849'), c('Deep Teal', '#003028'), c('Deep Violet', '#320064'), c('Deep Wine', '#5C0015'), c('Deep Blue', '#003880'), c('Deep Emerald', '#003838'), c('Deep Magenta', '#500050')],
    neutrals: [c('Ice White', '#F0F0F0'), c('Black', '#1A1A1A'), c('Charcoal', '#4A4A4A'), c('Silver Grey', '#D0D0D0'), c('Icy White', '#F5F5F5'), c('Jet Black', '#141414'), c('Anthracite', '#3E3E3E'), c('Pale Grey', '#DADADA')],
    avoid: [c('Warm Beige', '#F5DEB3'), c('Peach Pastel', '#FFDAB9'), c('Copper Orange', '#B87333'), c('Camel', '#C8AD7F'), c('Yellow-Green', '#9ACD32'), c('Chocolate Brown', '#7B3F00'), c('Olive', '#808000'), c('Dusty Rose', '#B76E79')],
  },
};

export const GROUPS = [
  { id: 'core', label: 'Core palette' },
  { id: 'statement', label: 'Statement colours' },
  { id: 'everyday', label: 'Everyday midtones' },
  { id: 'accents', label: 'Accents' },
  { id: 'neutrals', label: 'Neutrals', neutral: true },
];

for (const p of PALETTES) {
  const d = DETAILS[p.id];
  p.groups = GROUPS.map((g) => ({ ...g, colors: d[g.id].map((x) => (g.neutral ? { ...x, neutral: true } : x)) }));
  p.avoid = d.avoid;
}

// Basic colours for "shop by colour" without a season.
export const BASIC_COLORS = [
  c('Black', '#141414'), c('Charcoal', '#3A3A3C'), c('Grey', '#8C8C8C'), c('Light grey', '#C8C8C8'), c('White', '#F7F7F5'),
  c('Off-white', '#EDE6D6'), c('Beige', '#D2BC98'), c('Khaki', '#A89A72'), c('Brown', '#6B4A30'), c('Navy', '#1C2541'),
  c('Blue', '#2F5DA8'), c('Light blue', '#9CC0E0'), c('Teal', '#2A7F7A'), c('Green', '#2E7D46'), c('Olive', '#6B6B3A'),
  c('Sage', '#A3B293'), c('Yellow', '#F2CC30'), c('Orange', '#EE7A2B'), c('Red', '#C62D2D'), c('Burgundy', '#6E1E2C'),
  c('Pink', '#EE8FB0'), c('Purple', '#6E3FA0'), c('Lilac', '#C3A8D8'),
];

export const paletteById = Object.fromEntries(PALETTES.map((p) => [p.id, p]));
// Every colour of a season (signature first), each { name, hex, neutral?, group }.
export const allColors = (p) => [...p.colors.map((x) => ({ ...x, group: 'signature' })), ...p.groups.flatMap((g) => g.colors.map((x) => ({ ...x, group: g.id })))];
