import { getBookmarks } from './_store.js';

export default async () => {
  const bookmarks = await getBookmarks();
  return new Response(JSON.stringify(bookmarks), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
};
