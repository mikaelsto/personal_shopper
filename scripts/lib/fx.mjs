// Converts prices in other currencies to SEK, which is what the site shows and filters on.
// Rates are the day's ECB reference rates (frankfurter.dev, no key), cached in data/fx-rates.json
// so a failed fetch falls back to the last ones. The store's own price is kept in p.local.

import { getJson } from './http.mjs';

// -> { date, sek: { EUR: 11.17, USD: 9.97, … } } (SEK per unit), or the cached rates.
export async function sekRates(cached, log = console.log) {
  try {
    const { date, rates } = await getJson('https://api.frankfurter.dev/v1/latest?base=SEK');
    return { date, sek: Object.fromEntries(Object.entries(rates).map(([c, r]) => [c, 1 / r])) };
  } catch (err) {
    log(`  Exchange rates: fetch failed (${err.message}); using rates from ${cached?.date ?? 'nowhere'}`);
    return cached ?? null;
  }
}

// Returns false when there's no rate for the product's currency (its prices are left as they are).
export function toSek(p, fx) {
  const rate = fx?.sek[p.currency];
  if (!rate) return false;
  const kr = (n) => (n == null ? n : Math.round(n * rate));
  p.local = { currency: p.currency, price: p.price, ...(p.compareAt ? { compareAt: p.compareAt } : {}), rateDate: fx.date };
  p.price = kr(p.price);
  p.compareAt = kr(p.compareAt);
  for (const v of p.variants) Object.assign(v, { price: kr(v.price), compareAt: kr(v.compareAt) });
  p.currency = 'SEK';
  return true;
}
