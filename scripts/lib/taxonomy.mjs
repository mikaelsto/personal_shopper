// Master taxonomy: department › subcategory. Every store's own category names
// ("Herr T-shirts", "Top", "T-Shirts", …) are mapped onto this one tree.
// Gender, warmth and material are separate attributes, not categories.
//
// Pure ES module: used by the update job (mapping) and by the site (labels/filters).

export const TAXONOMY = [
  { id: 'tops', label: 'Tops', subs: [
    ['t-shirts', 'T-shirts'],
    ['long-sleeve', 'Long sleeve'],
    ['singlets', 'Singlets & tanks'],
    ['shirts', 'Shirts'],
    ['sports-bras', 'Sports bras'],
    ['base-layers', 'Base layer tops'],
  ] },
  { id: 'midlayers', label: 'Mid layers', subs: [
    ['fleece-knit', 'Fleece, knit & half-zips'],
    ['hoodies', 'Hoodies & sweatshirts'],
  ] },
  { id: 'outerwear', label: 'Outerwear', subs: [
    ['wind-rain', 'Wind & rain jackets'],
    ['shell', 'Shell jackets'],
    ['insulated', 'Down & insulated'],
    ['vests', 'Vests & gilets'],
    ['jackets', 'Other jackets'],
  ] },
  { id: 'bottoms', label: 'Bottoms', subs: [
    ['shorts', 'Shorts'],
    ['tights', 'Tights & leggings'],
    ['pants', 'Pants'],
    ['shell-pants', 'Shell & rain pants'],
    ['skirts', 'Skirts'],
    ['base-layers', 'Base layer bottoms'],
    ['underwear', 'Underwear'],
  ] },
  { id: 'footwear', label: 'Footwear', subs: [
    ['road-running', 'Road running'],
    ['trail-running', 'Trail running'],
    ['hiking', 'Hiking'],
    ['boots', 'Boots'],
    ['casual', 'Casual & lifestyle'],
    ['slides-sandals', 'Slides & sandals'],
    ['court', 'Court & tennis'],
    ['other', 'Other footwear'],
  ] },
  { id: 'accessories', label: 'Accessories', subs: [
    ['caps', 'Caps'],
    ['beanies', 'Beanies'],
    ['hats', 'Hats & headbands'],
    ['neckwear', 'Neck warmers, bandanas & balaclavas'],
    ['gloves', 'Gloves & mittens'],
    ['socks', 'Socks'],
    ['sunglasses', 'Sunglasses & eyewear'],
    ['watches', 'Watches'],
    ['hydration', 'Hydration'],
    ['lights', 'Headlamps & running lights'],
    ['insoles-care', 'Insoles & shoe care'],
    ['protection', 'Supports, protection & anti-chafe'],
    ['other', 'Other accessories'],
  ] },
  { id: 'bags', label: 'Bags', subs: [
    ['backpacks', 'Backpacks'],
    ['duffels-totes', 'Duffels & totes'],
    ['small-bags', 'Small bags & running belts'],
  ] },
  // Hidden from results unless explicitly selected.
  { id: 'gear', label: 'Gear & lifestyle', hidden: true, subs: [
    ['cooking', 'Cooking'],
    ['knives-tools', 'Knives & tools'],
    ['camping', 'Camping & sleeping'],
    ['climbing', 'Climbing'],
    ['furniture', 'Furniture'],
    ['lighting', 'Lighting'],
    ['books-media', 'Books & magazines'],
    ['nutrition', 'Sports nutrition'],
    ['fitness', 'Fitness equipment'],
    ['electronics', 'Headphones & electronics'],
    ['other', 'Other gear'],
  ] },
].map((d) => ({ ...d, subs: d.subs.map(([id, label]) => ({ id: `${d.id}/${id}`, label })) }));

export const OTHER = 'other';

const byId = new Map(TAXONOMY.flatMap((d) => [[d.id, d], ...d.subs.map((s) => [s.id, s])]));
export const label = (id) => byId.get(id)?.label ?? 'Other';
export const department = (subId) => (subId ?? '').split('/')[0] || OTHER;
export const ALL_SUBCATEGORIES = TAXONOMY.flatMap((d) => d.subs.map((s) => s.id));

// Mapping rules, checked in this order (first match wins within one text).
// `generic: true` marks catch-all rules; a specific match elsewhere beats them,
// and products that only get a generic match are refined by Claude when available.
// Swedish compounds ("Lättviktsdunjackor") are matched by stem, without a leading \b.
const RULES = [
  // Bags
  ['bags/backpacks', /\b(backpacks?|rucksacks?|daypacks?)\b|ryggsäck/],
  ['bags/duffels-totes', /\b(duffels?|duffel bags?|totes?|tote ?bags?|weekend ?bags?)\b|toteväsk/],
  ['bags/small-bags', /\b(hip ?bags?|bum ?bags?|waist ?packs?|belt ?bags?|running belts?|race belts?|slings?|crossbody|pouch(es)?)\b|små väskor|midjeväsk|mobilhållare/],
  ['bags/small-bags', /\bbags?\b|väskor|väska/, { generic: true }],

  // Accessories
  ['accessories/hydration', /\b(flasks?|soft ?flasks?|bottles?|hydration|hydration vests?)\b|vattenflask|flaskor|vätskebälte|vätskeväst|hydrering|löparväst/],
  ['accessories/lights', /\b(headlamps?|head ?torch(es)?|running lights?|safety lights?|clip ?lights?)\b|pannlamp|löparlamp|lampor\b/],
  ['accessories/insoles-care', /\b(insoles?|shoe ?care|laces|impregnat\w*|waterproofing spray)\b|sulor|skosulor|skotillbehör|sko och klädvård|skosnören|impregner/],
  ['accessories/protection', /\b((knee|ankle|wrist|calf) (supports?|guards?|braces?)|shin ?guards?|anti-?chafe|body ?glide)\b|skydd|knäskydd|benskydd|antiskav|stödskydd/],
  ['gear/nutrition', /\b(energy gels?|sports? drinks?|electrolytes?|protein (bars?|powder)|energy bars?|supplements?)\b|energi & sportdryck|sportdryck|kosttillskott|energigel|vätskeersättning/],
  ['gear/fitness', /\b(yoga ?mats?|foam ?rollers?|resistance bands?|kettlebells?|dumbbells?|treadmills?|massage (balls?|guns?))\b|träningsredskap|yogamatt|löpband|foamroller|massageboll/],
  ['gear/electronics', /\b(headphones?|earbuds?|earphones?|phone (holders?|cases?|armbands?))\b|hörlurar|mobiltillbehör|elektronik(?!\/pulsklock)/],
  ['accessories/socks', /\bsocks?\b|strump/],
  ['accessories/gloves', /\b(gloves?|mittens?|mitts?)\b|handskar|vantar/],
  ['accessories/sunglasses', /\b(sunglasses|eyewear|goggles)\b|glasögon/],
  ['accessories/watches', /\b(watch(es)?|coros|garmin|g-shock)\b|klock/],
  ['accessories/neckwear', /\b(neck ?warmers?|neck ?gaiters?|bandanas?|balaclavas?|balaklavas?|buffs?|tubes?|scarf|scarves)\b|nackvärmare|halsduk/],
  ['accessories/beanies', /\b(beanies?|toques?)\b|mössa|mössor/],
  ['accessories/caps', /\b(caps?|trucker|visors?)\b|keps/],
  ['accessories/hats', /\b(hats?|bucket hats?|headbands?|headwear)\b|hattar|pannband|huvudbonad/],
  ['accessories/other', /\b(arm ?sleeves?|calf ?sleeves?|keychains?|lanyards?|umbrellas?|belts?|accessor(y|ies))\b|nyckelring|paraply|bälte|accessoarer/, { generic: true }],

  // Gear & lifestyle
  ['gear/camping', /\b(tents?|sleeping ?bags?|sleeping ?pads?|mattress)\b|tält|sovsäck|underlag/],
  ['gear/cooking', /\b(cookware|cups?|mugs?|stoves?|pots?|kettles?|cutlery|sporks?)\b|matlagning|kastrull/],
  ['gear/knives-tools', /\b(knives|knife|multi-?tools?|tools?|repair kit)\b|knivar|verktyg/],
  ['gear/climbing', /\b(chalk ?bags?|chalk|carabiners?|climbing (harness(es)?|shoes?|ropes?|gear)|crash ?pads?)\b|klättring/],
  ['gear/furniture', /\b(chairs?|tables?|stools?|furniture)\b|möbler|stolar?\b/],
  ['gear/lighting', /\b(lamps?|lanterns?|headlamps?|lighting)\b|belysning|pannlamp/],
  ['gear/books-media', /\b(magazines?|books?|photo ?books?|mag v\.\d+|zines?)\b|tidning/],
  ['gear/other', /\b(objects?|gift ?card|ski & snow)\b|prototype|objekt|presentkort/, { generic: true }],

  // Footwear (before apparel: "trail running shoe" must not become a top)
  ['footwear/trail-running', /\btrail ?(running )?(shoes?|sko)|trailrunning ?sko|trailsko|löparskor\/terräng|terrängsko|terränglöp|\bspeedgoat|\bwildhorse|\bperegrine/],
  ['footwear/hiking', /\bhiking (shoes?|boots?)|\bapproach shoes?|vandringssk/],
  ['footwear/slides-sandals', /\b(slides?|sandals?|flip-?flops?|clogs?|mules?)\b|tofflor|sandal/],
  ['footwear/court', /\b(tennis|court|padel) shoes?\b|tennissk|padelsk/],
  ['footwear/boots', /\bboots?\b|kängor|känga/],
  ['footwear/road-running', /\b(running shoes?|racing shoes?|racing flats?|spikes?|adizero|adios|boston \d+|evo ?sl|super ?shoes?)\b|kolfibersk|tävlingssk|spikskor|friidrottssk/],
  // Plain "löparskor" (running shoes) is in almost every Löplabbet title, so it's broad:
  // a store category like "Löparskor/Terräng" (trail) must be able to override it.
  ['footwear/road-running', /löparsk/, { weight: 1.5 }],
  ['footwear/casual', /\b(sneakers?|lifestyle shoes?|casual shoes?|walking shoes?)\b|vardagssk|walkingsk|promenad/],
  ['footwear/other', /\b(shoes?|footwear|trainers?)\b|\bskor\b/, { generic: true }],

  // Outerwear (specific types before mid layers; generic jackets last)
  ['outerwear/insulated', /\b(down (jackets?|vests?|parkas?|hood(ie|y)s?)|puffers?|insulated (jackets?|hood(ie|y)s?|vests?)|padding (jkt|jackets?)|padded jackets?|parkas?|warm hybrid)\b|dunjack|dunväst|\bdun\b|isolerad/],
  ['outerwear/shell', /\b(shell jackets?|hard ?shells?|3l (jackets?|shells?)|gore-?tex (jackets?|shells?))\b|skaljack/],
  ['outerwear/wind-rain', /\b(wind ?(jackets?|breakers?|shells?|anoraks?|hood(ie|y)s?|smocks?)|windbreakers?|rain ?(jackets?|coats?|shells?)|anoraks?|waterproof jackets?)\b|vindjack|regnjack|löparjack|vind & regn|vind- och regn/],
  // Running jackets named by their weather tech: "Repel Jacka", "Storm-FIT Jacket", "GTX Jacka".
  ['outerwear/wind-rain', /\b(repel|storm-?fit|weather|waterproof|gtx|gore-?tex|shield|hydro|wind|rain|vind|regn)\b.*\b(jacka|jacket|jkt)\b/],
  ['outerwear/vests', /\b(gilets?|body ?warmers?|wind ?vests?|insulated vests?)\b|västar|\bväst\b/],

  // Bottoms
  ['bottoms/shell-pants', /\b(shell pants|rain pants|waterproof pants|hard ?shell pants)\b|skalbyx|regnbyx/],
  ['bottoms/base-layers', /\b(base ?layer (bottoms?|pants|tights|leggings)|long johns)\b|underställsbyx/],
  ['bottoms/tights', /\b(tights?|leggings?|half ?tights?)\b/],
  // "short" alone is a UVU product name ("SPLIT SHORT"), but not "short sleeve".
  ['bottoms/shorts', /\bshorts\b|\bshort\b(?![\s-]*(sleeve|ärm))/],
  ['bottoms/skirts', /\b(skirts?|skorts?)\b|kjol/],
  ['bottoms/underwear', /\b(boxers?|briefs?|underwear|hipsters?|thongs?)\b|kalsonger|trosor/],
  ['bottoms/pants', /\b(pants?|trousers?|joggers?|sweatpants?|jeans|chinos?|cargos?)\b|byxor|byxa/, { weight: 1.5 }],

  // Mid layers
  ['midlayers/hoodies', /\b(hood(ie|y)s?|hooded|sweatshirts?|crew ?necks?|crewneck|sweats|pullovers?)\b|huvtröj|collegetröj/],
  ['tops/long-sleeve', /\b(long ?sleeves?|l\/s|longsleeves?|long ?tees?|long-t|ls tee)\b|långärm/],
  ['midlayers/fleece-knit', /\b(fleeces?|knit(ted|wear)?|sweaters?|cardigans?|half[- ]?zips?|quarter[- ]?zips?|1\/4[- ]?zip|1\/2[- ]?zip|mid ?layers?)\b|stickat|stickad|fleece|mellanlager/],
  ['outerwear/jackets', /\b(jackets?|jkt|coats?|overshirts?|outerwear|blazers?)\b|jacka|jackor|ytterkläder/, { generic: true }],
  // A plain "tröja" in a running store is usually a long-sleeve running top.
  ['tops/long-sleeve', /tröja|tröjor/, { generic: true }],

  // Tops
  ['tops/base-layers', /\b(base ?layers?|baselayers?|thermal tops?)\b|underställ|baslager/],
  ['tops/sports-bras', /\b(sports? ?bras?|bras?)\b|bh:ar|sport-?bh|\bbh\b/],
  ['tops/singlets', /\b(singlets?|tanks?|tank ?tops?|crop ?tops?|cut-? ?offs?|muscle)\b|linne/],
  // English "vest" is a singlet in running (UK) but a gilet in Swedish stores' categories.
  ['tops/singlets', /\bvests?\b/, { weight: 1.5 }],
  ['tops/t-shirts', /\b(t-?shirts?|tees?|jerseys?|running tops?|training tops?)\b|\bt-shirt|kortärm/, { weight: 1.5 }],
  ['tops/shirts', /\b(shirts?|flannels?)\b|skjort/],
  ['tops/t-shirts', /\b(tops?)\b|överdel|topp/, { generic: true }],
];

const GENDER_WORDS = /\b(herr|dam|barn|junior|men'?s|women'?s|mens|womens|unisex)\s*/g;

// First specific rule that matches; a generic rule only when no specific one does
// (so "T-shirt löpartröja" is a T-shirt, not the generic "tröja").
function firstMatch(text) {
  if (!text) return null;
  let fallback = null;
  for (const [id, re, opts = {}] of RULES) {
    if (!re.test(text)) continue;
    const m = { id, weight: opts.weight ?? (opts.generic ? 1 : 2), generic: !!opts.generic };
    if (!m.generic) return m;
    fallback ??= m;
  }
  return fallback;
}

// Returns { subcategory, generic } — generic=true means "good guess, refine if possible".
//
// Precedence: a specific store category is trusted (stores curate it), but the title may
// refine it within the same department ("T-shirts" + "Long sleeve tee" -> Long sleeve), or
// override it when the store category is broad ("T-shirt" + "Running 1/4 zip" -> Mid layers).
export function classify({ title = '', storeCategory = '', tags = [] }) {
  // "Herr T-shirts" / "Herrtröjor & Hoodies" -> "t-shirts" / "tröjor & hoodies"
  const c = storeCategory.toLowerCase().replace(/^(herr|dam)(?=\S)/, '').replace(GENDER_WORDS, ' ').trim();
  const cat = firstMatch(c);
  const tit = firstMatch(title.toLowerCase());
  const tag = firstMatch(tags.join(' | ').toLowerCase());
  const specific = (m) => m && !m.generic;

  let best;
  if (specific(cat)) {
    const sameDept = specific(tit) && department(tit.id) === department(cat.id);
    best = (sameDept && tit.weight >= cat.weight) || (specific(tit) && !sameDept && cat.weight < 2) ? tit : cat;
  } else {
    best = [tit, tag, cat].find(specific) ?? tit ?? cat ?? tag;
  }
  return best ? { subcategory: best.id, generic: best.generic } : { subcategory: OTHER, generic: true };
}
