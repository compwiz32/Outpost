import { randomUUID } from 'node:crypto';
import { getBookmarks, saveBookmarks, checkAuth } from './_store.js';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  // DEMO_MODE lets a public demo deployment accept adds/edits from anyone
  // without a token. delete.js and seed.js don't have this escape hatch,
  // so visitors can contribute but can't wipe or bulk-replace the store.
  const demoMode = Boolean(process.env.DEMO_MODE);
  if (!demoMode && !checkAuth(req)) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  const url = (body.url || '').trim();
  if (!url) {
    return new Response('url is required', { status: 400 });
  }

  let domain = null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return new Response('Only http/https URLs are allowed', { status: 400 });
    }
    domain = parsed.hostname.replace(/^www\./, '');
  } catch {
    return new Response('url is not a valid URL', { status: 400 });
  }

  const rawTags = Array.isArray(body.tags)
    ? body.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean)
    : String(body.tags || '').toLowerCase().split(/\s+/).filter(Boolean);
  const tags = [...new Set(rawTags)];

  const editId = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : null;

  const entry = {
    id: editId || randomUUID(),
    title: (body.title || url).trim(),
    url,
    domain,
    notes: (body.notes || '').trim(),
    tags,
    date: new Date().toISOString().slice(0, 10),
  };

  const bookmarks = await getBookmarks();

  // Editing an existing bookmark (has an id) matches by id, so changing the
  // url doesn't create a duplicate. Otherwise upsert by url so re-adding a
  // page via the bookmarklet updates it instead of duplicating it.
  const existingIdx = editId
    ? bookmarks.findIndex((b) => b.id === editId)
    : bookmarks.findIndex((b) => b.url === url);
  if (existingIdx >= 0) {
    entry.id = bookmarks[existingIdx].id;
    entry.date = bookmarks[existingIdx].date; // preserve original add date
    bookmarks[existingIdx] = entry;
  } else {
    bookmarks.unshift(entry);
  }

  await saveBookmarks(bookmarks);

  return new Response(JSON.stringify(entry), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
