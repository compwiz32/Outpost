import { getBookmarks, saveBookmarks, checkAuth } from './_store.js';

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

  const id = body.id;
  if (!id) {
    return new Response('id is required', { status: 400 });
  }

  const bookmarks = await getBookmarks();
  const next = bookmarks.filter((b) => b.id !== id);
  await saveBookmarks(next);

  return new Response(JSON.stringify({ deleted: bookmarks.length - next.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
