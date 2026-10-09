import { fetchShopify } from './shopify.mjs';
import { fetchGeins } from './geins.mjs';
import { fetchJsonLd } from './jsonld.mjs';
import { fetchIntersport } from './intersport.mjs';
import { fetchImport } from './importfile.mjs';

// Returns products for a store, or null when the store has no data source yet.
export function fetchStore(store, dataDir) {
  switch (store.platform) {
    case 'shopify': return fetchShopify(store);
    case 'geins': return fetchGeins(store);
    case 'intersport': return fetchIntersport(store);
    case 'jsonld': return fetchJsonLd(store);
    case 'import': return fetchImport(store, dataDir);
    default: throw new Error(`Unknown platform "${store.platform}"`);
  }
}
