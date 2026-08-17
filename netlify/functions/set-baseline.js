import { getBookmarks, saveBaseline, checkAuth } from './_store.js';

// Token-protected. Snapshots whatever's currently live as the baseline
// that reset-demo.js restores to on its schedule. Run this whenever you
// want "right now" to become the new reset target for a demo deployment.
export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  if (!checkAuth(req)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const current = await getBookmarks();
  await saveBaseline(current);

  return new Response(JSON.stringify({ baselined: current.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
