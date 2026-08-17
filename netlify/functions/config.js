// Public, unauthenticated — lets the front end know whether this
// deployment is running in demo mode (see add.js) without hardcoding
// any particular site's hostname into the shared template.
export default async () => {
  return new Response(JSON.stringify({ demoMode: Boolean(process.env.DEMO_MODE) }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};
