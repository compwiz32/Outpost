import { getBaseline, saveBookmarks } from './_store.js';

// Runs on a schedule (see `config.schedule` below) to reset a public demo
// deployment back to a known baseline, undoing whatever visitors added or
// edited via add.js's DEMO_MODE bypass. The baseline lives in this site's
// own Blobs store (set via set-baseline.js), not in git, so it can hold
// real data without ever being committed to the repo. Guarded on DEMO_MODE
// so this is a no-op if it's ever accidentally deployed somewhere that
// isn't a demo, and skips the reset entirely (rather than wiping to empty)
// if no baseline has been set yet.
export default async () => {
  if (!process.env.DEMO_MODE) {
    return new Response('Not a demo site', { status: 403 });
  }

  const baseline = await getBaseline();
  if (!baseline) {
    return new Response('No baseline set yet — skipping reset', { status: 200 });
  }

  await saveBookmarks(baseline);

  return new Response(JSON.stringify({ reset: baseline.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const config = {
  schedule: '0 */6 * * *',
};
