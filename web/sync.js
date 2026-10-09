// Sign in with an email link to keep ♥ saved products and 👍/👎 palette votes in your account
// (Supabase, tables in supabase/schema.sql), so every device you sign in on has the same lists.
// Signed out nothing changes: both lists stay in this browser's localStorage only.
// supabase-js loads only for signed-in visitors or when you sign in, so the feed's first load
// isn't slowed down.

import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { store } from './shop-utils.js';

const LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
const SESSION_KEY = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`;

// The sign-in link lands here with the session in the URL's #hash. Take it now, before the page
// rewrites its URL for the filters, and remove it from the address bar.
const landing = new URLSearchParams(location.hash.slice(1));
const fromLink = landing.has('access_token')
  ? { access_token: landing.get('access_token'), refresh_token: landing.get('refresh_token') }
  : null;
export const linkError = landing.get('error_description'); // e.g. an expired link
export const cameFromLink = !!fromLink || landing.has('error');
if (fromLink || landing.has('error')) history.replaceState(null, '', location.pathname + location.search);

const hasSession = () => { try { return !!localStorage.getItem(SESSION_KEY); } catch { return false; } };

let client = null;
async function getClient() {
  client ??= import(LIB).then(async ({ createClient }) => {
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { detectSessionInUrl: false } });
    if (fromLink) await sb.auth.setSession(fromLink);
    return sb;
  });
  return client;
}

export let account = null; // { id, email } while signed in

// The signed-in user, or null. Loads supabase-js only when there's a session to check.
let checked = null;
function signedIn() {
  checked ??= (fromLink || hasSession())
    ? getClient().then((sb) => sb.auth.getSession()).then(({ data: { session } }) => {
      account = session ? { id: session.user.id, email: session.user.email } : null;
      return account;
    }).catch((err) => { console.warn('Sync:', err); return null; })
    : Promise.resolve(null);
  return checked;
}

const savedRow = ({ id, ...snapshot }) => ({ user_id: account.id, product_id: id, snapshot, saved_at: snapshot.at });
const fromSavedRow = (r) => ({ ...r.snapshot, id: r.product_id });
// Votes are keyed "<productId> <selection>" in localStorage (see palette-filter.js voteKey).
const voteRow = (key, x) => {
  const i = key.indexOf(' ');
  return { user_id: account.id, product_id: key.slice(0, i), selection: key.slice(i + 1), ...(x && { vote: x.v }) };
};

// On page load: when signed in, brings this browser's lists in line with the account. Returns
// { saved, votes } to use from now on (also written to localStorage), or null when signed out.
export async function startSync(saved, votes) {
  if (!(await signedIn())) return null;
  try {
    const sb = await getClient();
    const [s, v] = await Promise.all([
      sb.from('saved_products').select('product_id, snapshot, saved_at').order('saved_at', { ascending: false }),
      sb.from('palette_votes').select('product_id, selection, vote, voted_at'),
    ]);
    if (s.error || v.error) throw s.error ?? v.error;
    const remoteSaved = s.data.map(fromSavedRow);
    const remoteVotes = Object.fromEntries(v.data.map((r) => [`${r.product_id} ${r.selection}`, { v: r.vote, at: r.voted_at.slice(0, 10) }]));

    // The first time on this device (or after an upload failed): keep both and upload what's only
    // here. Otherwise the account is right, since changes made here were uploaded as they happened.
    const merge = store.get('syncedAs', null) !== account.id || store.get('syncPending', false);
    let next;
    if (merge) {
      const upSaved = saved.filter((x) => !remoteSaved.some((r) => r.id === x.id));
      const upVotes = Object.entries(votes).filter(([k, x]) => remoteVotes[k]?.v !== x.v);
      const writes = [];
      if (upSaved.length) writes.push(sb.from('saved_products').upsert(upSaved.map(savedRow)));
      if (upVotes.length) writes.push(sb.from('palette_votes').upsert(upVotes.map(([k, x]) => voteRow(k, x))));
      for (const { error } of await Promise.all(writes)) if (error) throw error;
      next = {
        saved: [...saved, ...remoteSaved.filter((r) => !saved.some((x) => x.id === r.id))].sort((a, b) => (b.at ?? '').localeCompare(a.at ?? '')),
        votes: { ...Object.fromEntries(Object.entries(remoteVotes).map(([k, x]) => [k, { ...x, sent: true }])), ...votes },
      };
    } else {
      next = {
        saved: remoteSaved,
        votes: Object.fromEntries(Object.entries(remoteVotes).map(([k, x]) => [k, { ...x, sent: votes[k]?.sent ?? true }])),
      };
    }
    store.set('savedProducts', next.saved);
    store.set('paletteVotes', next.votes);
    store.set('syncedAs', account.id);
    store.set('syncPending', false);
    return next;
  } catch (err) {
    console.warn('Sync:', err);
    return null;
  }
}

// Each change is uploaded right away; if that fails, the next page load merges instead.
async function write(op) {
  if (!(await signedIn())) return;
  try {
    const { error } = await op(await getClient());
    if (error) throw error;
  } catch (err) {
    console.warn('Sync:', err);
    store.set('syncPending', true);
  }
}
// x: the saved entry (see shop-utils toggleSaved), or null when it was removed.
export const syncSaved = (id, x) => write((sb) => (x
  ? sb.from('saved_products').upsert(savedRow(x))
  : sb.from('saved_products').delete().eq('product_id', id)));
// x: { v } or null when the vote was taken back.
export const syncVote = (key, x) => write((sb) => (x
  ? sb.from('palette_votes').upsert(voteRow(key, x))
  : sb.from('palette_votes').delete().match(voteRow(key, null))));

// Emails a sign-in link that comes back to this page.
export async function signIn(email) {
  const sb = await getClient();
  const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + (location.pathname.startsWith('/p/') ? '/' : location.pathname) } });
  if (error) throw error;
}

// The lists stay in this browser; signing in again merges them with the account.
export async function signOut() {
  await (await getClient()).auth.signOut();
  account = null;
  checked = Promise.resolve(null);
  store.set('syncedAs', null);
}
