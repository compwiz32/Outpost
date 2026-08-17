import { getStore } from '@netlify/blobs';
import { timingSafeEqual } from 'node:crypto';

const STORE_NAME = 'bookmarks';
const KEY = 'bookmarks.json';
const BASELINE_KEY = 'bookmarks-baseline.json';

export async function getBookmarks() {
  const store = getStore(STORE_NAME);
  const data = await store.get(KEY, { type: 'json' });
  return data || [];
}

export async function saveBookmarks(list) {
  const store = getStore(STORE_NAME);
  await store.setJSON(KEY, list);
}

// Demo-mode reset baseline. Lives in this site's own Blobs store, not in
// git — so it can hold real data on a demo deployment while the repo
// (public or private) never contains it. See reset-demo.js / set-baseline.js.
export async function getBaseline() {
  const store = getStore(STORE_NAME);
  const data = await store.get(BASELINE_KEY, { type: 'json' });
  return data || null;
}

export async function saveBaseline(list) {
  const store = getStore(STORE_NAME);
  await store.setJSON(BASELINE_KEY, list);
}

// Checks the Authorization: Bearer <token> header against the ADD_TOKEN
// environment variable set in Netlify's site settings. Never hardcode the
// token here or commit it to git.
export function checkAuth(req) {
  const header = req.headers.get('authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  const expected = process.env.ADD_TOKEN || '';
  if (!token || !expected) return false;

  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
