// Store registry. Each store is handled by an adapter in ./adapters.
// platform "shopify": public /products.json feed, fetched by the GitHub job.
// platform "import":  no scrapable feed; products are collected manually
//                     (e.g. with Claude in Chrome) into data/imports/<id>.json.

export const STORES = [
  {
    id: 'satisfy',
    name: 'Satisfy',
    platform: 'shopify',
    base: 'https://satisfyrunning.com',
    country: 'SE',
  },
  {
    id: 'uvu',
    name: 'UVU',
    platform: 'shopify',
    base: 'https://uvuclub.com',
    country: 'SE',
  },
  { id: 'kayo', name: 'KA-YO', platform: 'import', base: 'https://www.ka-yo.com/se' },
  { id: 'on', name: 'On', platform: 'import', base: 'https://www.on.com/en-se' },
  { id: 'adidas', name: 'adidas', platform: 'import', base: 'https://www.adidas.se' },
];

export const USER_AGENT =
  'PersonalShopper/0.1 (+https://github.com/mikaelsto/personal_shopper)';
