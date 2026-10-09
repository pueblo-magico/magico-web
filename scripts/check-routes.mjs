// Post-deploy smoke test: hits every known route on the live site and flags
// anything that doesn't resolve to itself — silent redirects-to-home (the
// /_redirects vs prerendered-directory conflict that broke /estadia & co)
// return a 200, so a plain uptime check never catches them. This does.
//
// Usage:
//   node scripts/check-routes.mjs                          # checks production
//   node scripts/check-routes.mjs http://localhost:4173     # checks a local preview build
//
// Exits with code 1 if any route is broken, so it can gate a deploy step.

const BASE_URL = process.argv[2] || 'https://experienciamagico.com';

// Keep in sync with the ROUTES paths in scripts/prerender.mjs, plus the
// client-only routes that aren't prerendered (reset-vital, despertar, etc).
const ROUTE_PATHS = [
  '/',
  '/familion',
  '/achala-viva',
  '/escuelas',
  '/gondorbows',
  '/terminos-y-condiciones',
  '/estadia',
  '/politica-de-privacidad',
  '/el-vuelo-del-condor',
  '/propuesta/calma-magico',
  '/inti-raymi',
  '/pachamama-fest',
  '/organizamos-tu-experiencia',
  '/coliving',
  '/ciclo-vital-femenino',
  '/reset-vital',
  '/despertar',
  '/propuesta/nico-grupe',
];

function normalize(pathname) {
  return pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
}

async function checkRoute(path) {
  const url = BASE_URL + path;
  try {
    const res = await fetch(url, { redirect: 'follow' });
    const finalPath = normalize(new URL(res.url).pathname);
    const expectedPath = normalize(path);
    const landedOnRightPage = finalPath === expectedPath;
    const ok = res.status === 200 && landedOnRightPage;
    return { path, ok, status: res.status, finalUrl: res.url, landedOnRightPage };
  } catch (e) {
    return { path, ok: false, error: e.message };
  }
}

const results = await Promise.all(ROUTE_PATHS.map(checkRoute));

console.log(`Checking ${ROUTE_PATHS.length} routes against ${BASE_URL}\n`);

let hasFailures = false;
for (const r of results) {
  if (r.ok) {
    console.log(`  ✓ ${r.path}`);
  } else {
    hasFailures = true;
    if (r.error) {
      console.log(`  ✗ ${r.path} — request failed: ${r.error}`);
    } else if (!r.landedOnRightPage) {
      console.log(`  ✗ ${r.path} — redirected to the WRONG page: ${r.finalUrl}`);
    } else {
      console.log(`  ✗ ${r.path} — HTTP ${r.status}`);
    }
  }
}

console.log(hasFailures ? '\nSome routes are broken. See above.' : '\nAll routes OK.');
process.exit(hasFailures ? 1 : 0);
