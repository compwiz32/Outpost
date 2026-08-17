import { saveBookmarks, checkAuth } from './_store.js';

// Overwrites the entire store with the posted array. Used once to migrate
// your existing Pinboard export in, or later if you ever need to restore
// from a backup JSON file. Same token as add.js / delete.js.
export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  if (!checkAuth(req)) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  if (!Array.isArray(body)) {
    return new Response('Body must be a JSON array of bookmarks', { status: 400 });
  }
  const invalid = body.some((b) => !b || typeof b.url !== 'string' || !b.url.trim());
  if (invalid) {
    return new Response('Every bookmark must have a non-empty url', { status: 400 });
  }

  const normalized = body.map((b) => ({
    ...b,
    tags: [...new Set((Array.isArray(b.tags) ? b.tags : []).map((t) => String(t).trim().toLowerCase()).filter(Boolean))],
  }));

  await saveBookmarks(normalized);

  return new Response(JSON.stringify({ imported: body.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
