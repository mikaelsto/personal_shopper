// Google Tag Manager (GTM-M6V5L7BC, which loads GA4 G-VBFEVVPFY2) with Consent Mode v2.
// Analytics cookies stay off until you accept them in the banner; until then GA only gets
// cookieless pings. Ads storage is always denied (no ads here). Your choice is kept in this
// browser; any element with data-consent (Cookies in the Saved tab) opens the banner again.
// Loaded with `async` from every page's <head>, so it never holds up the first paint.
(() => {
  const KEY = 'analyticsConsent'; // 'granted' | 'denied'
  const get = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
  const set = (v) => { try { localStorage.setItem(KEY, v); } catch {} };

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  gtag('consent', 'default', {
    ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
    analytics_storage: get() === 'granted' ? 'granted' : 'denied',
  });
  dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const gtm = document.createElement('script');
  gtm.async = true;
  gtm.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-M6V5L7BC';
  document.head.append(gtm);

  let banner = null;
  function choose(v) {
    set(v);
    gtag('consent', 'update', { analytics_storage: v });
    if (v === 'denied') { // drop the cookies GA set after an earlier Accept (on runnista.com and .runnista.com)
      for (const name of document.cookie.split('; ').map((c) => c.split('=')[0]).filter((n) => n.startsWith('_ga'))) {
        for (const domain of ['', `; domain=${location.hostname.replace(/^www\./, '')}`]) {
          document.cookie = `${name}=; path=/; max-age=0${domain}`;
        }
      }
    }
    banner?.remove();
    banner = null;
  }
  function show() {
    if (banner) return;
    banner = document.createElement('div');
    banner.className = 'consent';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookies');
    banner.innerHTML = `<style>
        .consent { position: fixed; z-index: 2147483000; left: 12px; right: 12px; bottom: calc(12px + env(safe-area-inset-bottom));
          max-width: 440px; margin: 0 auto; padding: 14px 16px; border-radius: 16px; background: #18181b; color: #f5f5f4;
          box-shadow: 0 8px 30px rgba(0,0,0,.45); font: 14px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif; }
        .consent p { margin: 0 0 12px; }
        .consent div { display: flex; gap: 8px; }
        .consent button { flex: 1; padding: 10px 12px; border-radius: 12px; border: 1px solid #3f3f46; background: transparent;
          color: inherit; font: inherit; font-weight: 650; cursor: pointer; }
        .consent button[data-v="granted"] { background: #f5f5f4; border-color: #f5f5f4; color: #0b0b0c; }
      </style>
      <p>May we use Google Analytics cookies to see how Runnista is used? Nothing is used for ads.</p>
      <div><button data-v="denied">Decline</button><button data-v="granted">Accept</button></div>`;
    banner.addEventListener('click', (e) => { const v = e.target.closest('button')?.dataset.v; if (v) choose(v); });
    document.body.append(banner);
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest?.('[data-consent]');
    if (!t) return;
    e.preventDefault();
    t.closest('dialog')?.close(); // a modal dialog would cover the banner
    show();
  });
  if (!get()) {
    if (document.body) show();
    else document.addEventListener('DOMContentLoaded', show, { once: true });
  }
})();
