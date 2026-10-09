// Shared fetch helpers for the GitHub job (Node only).

export const USER_AGENT =
  'PersonalShopper/0.2 (+https://github.com/mikaelsto/personal_shopper)';
// Some sites serve bots a different page; product pages are fetched with a browser-like UA.
export const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function get(url, { ua = USER_AGENT, accept = '*/*', timeout = 30000 } = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': ua, Accept: accept, 'Accept-Language': 'sv-SE,sv;q=0.9,en;q=0.8' },
    redirect: 'follow',
    signal: AbortSignal.timeout(timeout),
  });
  return res;
}

export async function getText(url, opts) {
  const res = await get(url, opts);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

export async function getJson(url, opts) {
  const res = await get(url, { accept: 'application/json', ...opts });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

// Runs `fn` over items with limited concurrency and a small delay per request.
export async function mapLimit(items, limit, delayMs, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i).catch((err) => ({ error: err }));
        await sleep(delayMs);
      }
    }),
  );
  return out;
}
