// Post-build prerender: generates static HTML per route with correct meta tags,
// then uses Playwright to snapshot full rendered content (visible to AI crawlers).
// Run automatically via "postbuild" script after `vite build`.
import { readFileSync, writeFileSync, mkdirSync, existsSync, createReadStream, statSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const CONTENT = JSON.parse(readFileSync(join(__dirname, '..', 'data.json'), 'utf8'));
const VOLUNTEER_IMAGE = `https://experienciamagico.com${CONTENT.es.volunteer.image}`;

export const ROUTES = [
  {
    path: '/',
    title: 'Pueblo Mágico — Ecolodge de Montaña · Los Gigantes, Córdoba',
    description: 'Ecolodge de montaña en las Sierras Grandes de Córdoba: Refugio de Piedra, domos geodésicos y camping. Retiros, co-living y voluntariados. Energía solar, baños secos y compost.',
    image: 'https://experienciamagico.com/uploads/img_6948.webp',
    canonical: 'https://experienciamagico.com/',
  },
  {
    path: '/familion',
    title: 'Familion — Retiro Familiar en la Montaña · Los Gigantes, Córdoba | Pueblo Mágico',
    description: 'Retiro familiar en Los Gigantes, Córdoba. Adultos en red, niños en libertad, gastronomía de montaña y experiencias transformadoras. Consultá la próxima fecha.',
    image: 'https://experienciamagico.com/uploads/portada%20familion.webp',
    canonical: 'https://experienciamagico.com/familion',
  },
  {
    path: '/achala-viva',
    title: 'Achala Viva — Retiro de Naturaleza · Los Gigantes, Córdoba | Pueblo Mágico',
    description: 'Retiro de inmersión total en Los Gigantes, Córdoba. Próximas fechas a confirmar. Astroturismo, avistaje de aves y naturaleza guiada por biólogo. Solo 15 plazas.',
    image: 'https://experienciamagico.com/uploads/img_6948.webp',
    canonical: 'https://experienciamagico.com/achala-viva',
  },
  {
    path: '/escuelas',
    title: 'Aula Verde — Campamentos Educativos · Los Gigantes, Córdoba | Pueblo Mágico',
    description: 'Campamentos educativos en Los Gigantes, Córdoba. Talleres agroecológicos, aventura y naturaleza. Para escuelas, primaria y secundaria. Capacidad hasta 180 alumnos.',
    image: 'https://experienciamagico.com/uploads/Aula%20Verde/IMG-20251120-WA0149.jpg',
    canonical: 'https://experienciamagico.com/escuelas',
  },
  {
    path: '/gondorbows',
    title: 'Gondorbows — Retiro de Arquería Ancestral · Los Gigantes, Córdoba | Pueblo Mágico',
    description: 'Construí tu propio arco en 3 días de inmersión en Los Gigantes, Córdoba. Taller de arquería tradicional con Gondor Bows. Todo incluido. Sin experiencia previa necesaria.',
    image: 'https://experienciamagico.com/uploads/arcos-fuego.jpg',
    canonical: 'https://experienciamagico.com/gondorbows',
  },
  {
    path: '/terminos-y-condiciones',
    title: 'Términos y Condiciones — Pueblo Mágico',
    description: 'Términos y condiciones de uso, contratación y cancelación de Pueblo Mágico. Información sobre medios de pago, políticas de reserva y derechos del consumidor.',
    image: 'https://experienciamagico.com/uploads/img_6948.webp',
    canonical: 'https://experienciamagico.com/terminos-y-condiciones',
  },
  {
    path: '/estadia',
    title: 'Ecolodge de Montaña en Córdoba — Refugio de Piedra, Domos y Camping | Pueblo Mágico',
    description: 'Ecolodge de montaña en Los Gigantes, Córdoba: Refugio de Piedra, domos geodésicos y camping. Energía solar, baños secos y compost. Desde $20.000/persona/noche con desayuno.',
    image: 'https://experienciamagico.com/uploads/campoentero.webp',
    canonical: 'https://experienciamagico.com/estadia',
  },
  {
    path: '/politica-de-privacidad',
    title: 'Política de Privacidad — Pueblo Mágico',
    description: 'Política de privacidad y protección de datos personales de Pueblo Mágico conforme a la Ley 25.326. Información sobre recopilación, uso y derechos sobre tus datos.',
    image: 'https://experienciamagico.com/uploads/img_6948.webp',
    canonical: 'https://experienciamagico.com/politica-de-privacidad',
  },
  {
    path: '/boton-de-arrepentimiento',
    title: 'Botón de Arrepentimiento — Pueblo Mágico',
    description: 'Formulario público para solicitar la revocación de una contratación online y recibir una constancia trazable, sin registro previo.',
    image: 'https://experienciamagico.com/uploads/img_6948.webp',
    canonical: 'https://experienciamagico.com/boton-de-arrepentimiento',
  },
  {
    path: '/el-vuelo-del-condor',
    title: 'El Vuelo del Cóndor — Un viaje iniciático en Perú | Pueblo Mágico',
    description: '7 días para elevar tu conciencia, expandir tu visión y reconectar con tu propósito en el Valle Sagrado de los Incas, Perú. Del 22 al 29 de Julio.',
    image: 'https://experienciamagico.com/uploads/temazcal.webp',
    canonical: 'https://experienciamagico.com/el-vuelo-del-condor',
  },
  {
    path: '/propuesta/calma-magico',
    title: 'Calma Salvaje — Una propuesta de Pueblo Mágico para Calma Yoga',
    description: 'Retiro residencial de yoga en las Sierras Grandes de Córdoba. 3 días, hasta 30 personas. Pueblo Mágico + Calma Yoga.',
    image: 'https://experienciamagico.com/uploads/campoentero.webp',
    canonical: 'https://experienciamagico.com/propuesta/calma-magico',
  },
  {
    path: '/inti-raymi',
    title: 'Inti Raymi — Celebración del Solsticio de Invierno · 20 y 21 de Junio | Pueblo Mágico',
    description: 'Dos días para celebrar el renacimiento de la luz. Temazcal, fuego, danza, canto y naturaleza en las Sierras Grandes de Córdoba. 20 y 21 de junio.',
    image: 'https://experienciamagico.com/uploads/fogon_nocturno.png',
    canonical: 'https://experienciamagico.com/inti-raymi',
  },
  {
    path: '/pachamama-fest',
    title: 'Pachamama Fest — Festival Consciente · 14 al 17 de Agosto | Pueblo Mágico',
    description: 'Finde largo en la montaña para honrar a la Tierra, agradecer y abrir un nuevo ciclo. Ofrenda a la Pachamama, Temazcal, fuego y comunidad en las Sierras Grandes de Córdoba. 14 al 17 de agosto.',
    image: 'https://experienciamagico.com/uploads/fogon_nocturno.webp',
    canonical: 'https://experienciamagico.com/pachamama-fest',
  },
  {
    path: '/killa-raymi',
    title: 'Killa Raymi — Primavera & Luna Llena · 25 al 27 de Septiembre | Pueblo Mágico',
    description: 'Un fin de semana en la montaña para celebrar la primavera bajo la luna llena. Temazcal, ceremonia de luna llena, trekking al Macizo Los Gigantes y música en comunidad. Los Gigantes, Córdoba.',
    image: 'https://experienciamagico.com/uploads/pachamama-cielo-estrellado.webp',
    canonical: 'https://experienciamagico.com/killa-raymi',
  },
  {
    path: '/alma-de-lobo',
    title: 'Alma de Lobo — Encuentro de Hombres en la Montaña · 2, 3 y 4 de Octubre | Pueblo Mágico',
    description: 'Retiro para hombres bajo la luna llena: círculos de palabra, temazcal, fuego y naturaleza para habitar lo masculino desde un lugar consciente y verdadero. Los Gigantes, Córdoba.',
    image: 'https://experienciamagico.com/uploads/alma-de-lobo-hero-desktop.webp',
    canonical: 'https://experienciamagico.com/alma-de-lobo',
  },
  {
    path: '/empresas',
    title: 'Empresas — Voluntariado Corporativo & RSE en las Sierras · Los Gigantes, Córdoba | Pueblo Mágico',
    description: 'Programas de restauración ambiental, voluntariado corporativo y team building en Los Gigantes, Córdoba. +25.000 árboles plantados, +200 hectáreas cuidadas, +25 años de trayectoria.',
    image: 'https://experienciamagico.com/uploads/dji_0074.webp',
    canonical: 'https://experienciamagico.com/empresas',
  },
  {
    path: '/reforestacion',
    title: 'Reforestación de las Sierras de Córdoba | Pueblo Mágico',
    description: 'Sumate a la campaña de Pueblo Mágico para plantar 10.000 árboles nativos más y acompañar la regeneración de las Sierras de Córdoba.',
    image: 'https://experienciamagico.com/uploads/reforestacion/montana-hero.webp',
    canonical: 'https://experienciamagico.com/reforestacion',
  },
  {
    path: '/cordoba-fly-fishing',
    title: 'Córdoba Fly Fishing Adventure — Guided Trout Fishing in the Sierras | Pueblo Mágico',
    description: 'Guided fly fishing for wild Rainbow and Brook trout in the crystal-clear mountain streams of Las Sierras de Córdoba. Full-day outings or a 2-night stay in geodesic domes.',
    image: 'https://experienciamagico.com/uploads/flyfishing-hero.jpg',
    canonical: 'https://experienciamagico.com/cordoba-fly-fishing',
  },
  {
    path: '/voluntariado',
    title: 'Programa Semilla — Voluntariado en Pueblo Mágico',
    description: 'Viví una experiencia de intercambio consciente en las Sierras de Córdoba. Comunidad, huerta, reforestación, hospitalidad, eventos y regeneración en Pueblo Mágico.',
    image: VOLUNTEER_IMAGE,
    canonical: 'https://experienciamagico.com/voluntariado',
  },
  {
    path: '/organizamos-tu-experiencia',
    title: 'Organizamos tu Experiencia — Retiros, Vivencias & Viajes | Pueblo Mágico',
    description: 'Diseñamos la experiencia que tu comunidad necesita. Retiros, campamentos, viajes y vivencias transformadoras en la montaña de Córdoba. Armonización sonora, cabalgatas, temazcal y más.',
    image: 'https://experienciamagico.com/uploads/dji_0074.webp',
    canonical: 'https://experienciamagico.com/organizamos-tu-experiencia',
  },
  {
    path: '/coliving',
    title: 'Coliving Mágico — Vivir, Trabajar y Reconectar · Los Gigantes, Córdoba | Pueblo Mágico',
    description: 'Coliving en las Sierras de Córdoba para bienestar y estilo de vida. Formatos de 10 y 20 noches, y Pase Libre Mensual a $480.000. Pensión completa, WiFi satelital y Programa Reset Vital incluidos.',
    image: 'https://experienciamagico.com/uploads/coworking.webp',
    canonical: 'https://experienciamagico.com/coliving',
  },
  {
    path: '/ciclo-vital-femenino',
    title: 'Ciclo Vital Femenino · Capítulo Muerte-Invierno — Encuentro de Mujeres | Pueblo Mágico',
    description: 'Retiro de mujeres en la montaña. 28, 29 y 30 de Agosto en Los Gigantes, Córdoba. Temazcal, círculo de mujeres, ceremonia de cacao y rituales para transmutar todo lo que no ES.',
    image: 'https://experienciamagico.com/uploads/Invierno/20250627_222558.webp',
    canonical: 'https://experienciamagico.com/ciclo-vital-femenino',
  },
];

if (!existsSync(DIST)) {
  console.error('dist/ not found — run `vite build` first');
  process.exit(1);
}

// Cada ruta se escribe como archivo plano "<ruta>.html" (no "<ruta>/index.html"):
// Cloudflare Pages sirve /empresas.html en /empresas con 200, y /empresas/
// redirige a /empresas. Con carpeta + index.html pasaba al revés (/empresas →
// 308 → /empresas/), y el canonical, el sitemap y los links del menú (todos
// sin barra) apuntaban a una URL que redirige.
function htmlFileFor(route) {
  return route.path === '/' ? join(DIST, 'index.html') : join(DIST, `${route.path.slice(1)}.html`);
}

// ─── Phase 1: Meta tag injection (fast, no browser needed) ───────────────────
console.log('\nPhase 1: Meta tag injection...');
const template = readFileSync(join(DIST, 'index.html'), 'utf-8');

// Fallback nativo de Cloudflare Pages para rutas desconocidas: si existe un
// 404.html en la raíz del output, lo sirve para cualquier ruta no encontrada —
// mismo shell que index.html, React Router se encarga de mostrar <NotFound/>.
// Reemplaza al viejo catch-all de _redirects (causaba loop + pisaba rutas
// prerenderizadas, ver public/_redirects).
writeFileSync(join(DIST, '404.html'), template);
console.log('  ✓ 404.html (fallback SPA nativo)');

// Shell para las 3 rutas client-only (reset-vital, despertar, propuesta/nico-grupe)
// referenciadas desde _redirects. IMPORTANTE: va en una carpeta con su propio
// index.html (como cualquier ruta prerenderizada), NO como un archivo .html
// suelto — Cloudflare Pages normaliza automáticamente cualquier destino que
// termine en ".html" con un 308 que le saca la extensión, lo que convierte
// la reescritura 200 (invisible) en un redirect visible que cambia la URL
// del browser. Un directorio con index.html no sufre esa normalización.
mkdirSync(join(DIST, 'app-shell'), { recursive: true });
writeFileSync(join(DIST, 'app-shell', 'index.html'), template);
console.log('  ✓ app-shell/index.html (destino de redirects SPA client-only)');

// Shell propio para /admin/reservas: mismo bundle de React, pero con SU
// PROPIO manifest (nombre, ícono y scope distintos del sitio público) para
// que "instalar app" desde el dashboard cree un ícono separado de "Reset
// Vital" — ver public/manifest-reservas.json. Al ser un archivo real en
// dist/admin/reservas/index.html (mismo patrón que cualquier ruta
// prerenderizada), Cloudflare Pages lo sirve directo, sin pasar por
// _redirects.
// OJO: `vite build` fingerprintea el href original ("/manifest.json") a algo
// como "/assets/manifest-XXXX.json" — por eso el match es por atributo
// rel="manifest", no por el href literal.
const shellReservas = template
  .replace(/<title>[^<]*<\/title>/, '<title>Reservas — Pueblo Mágico</title>')
  .replace(/<link rel="manifest" href="[^"]*">/, '<link rel="manifest" href="/manifest-reservas.json">')
  .replace(/<meta name="apple-mobile-web-app-title" content="[^"]*">/, '<meta name="apple-mobile-web-app-title" content="Reservas">')
  // iOS "Agregar a inicio" usa este tag, no los íconos del manifest — mismo
  // ícono con fondo dorado en vez de verde, para diferenciarlo de Reset Vital
  // de un vistazo en la pantalla de inicio.
  .replace(/<link rel="apple-touch-icon" href="[^"]*">/, '<link rel="apple-touch-icon" href="/uploads/pwa-192x192-reservas.png">')
  .replace('</head>', '  <meta name="robots" content="noindex,nofollow" />\n</head>');
mkdirSync(join(DIST, 'admin', 'reservas'), { recursive: true });
writeFileSync(join(DIST, 'admin', 'reservas', 'index.html'), shellReservas);
console.log('  ✓ admin/reservas/index.html (shell con manifest propio)');

// ─── Per-route JSON-LD builder ───────────────────────────────────────────────
function buildJsonLD(route) {
  const base = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    "name": "Pueblo Mágico",
    "url": "https://experienciamagico.com",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Los Gigantes",
      "addressRegion": "Córdoba",
      "addressCountry": "AR"
    },
    "geo": { "@type": "GeoCoordinates", "latitude": -31.5, "longitude": -64.7 }
  };

  return `<script type="application/ld+json">${JSON.stringify(base)}</script>`;
}

for (const route of ROUTES) {
  const seoBlock = [
    `  <meta property="og:title" content="${route.title}" />`,
    `  <meta property="og:description" content="${route.description}" />`,
    `  <meta property="og:image" content="${route.image}" />`,
    `  <meta property="og:image:width" content="1200" />`,
    `  <meta property="og:image:height" content="630" />`,
    `  <meta property="og:url" content="${route.canonical}" />`,
    `  <meta property="og:type" content="website" />`,
    `  <meta property="og:locale" content="es_AR" />`,
    `  <meta name="twitter:card" content="summary_large_image" />`,
    `  <meta name="twitter:title" content="${route.title}" />`,
    `  <meta name="twitter:description" content="${route.description}" />`,
    `  <meta name="twitter:image" content="${route.image}" />`,
    `  <link rel="canonical" href="${route.canonical}" />`,
    `  <meta name="geo.region" content="AR-X" />`,
    `  <meta name="geo.placename" content="Los Gigantes, Córdoba, Argentina" />`,
    `  <meta name="geo.position" content="-31.5;-64.7" />`,
    `  <meta name="ICBM" content="-31.5, -64.7" />`,
  ].join('\n');

  const jsonLD = buildJsonLD(route);

  const html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${route.description}" />`)
    .replace('</head>', `${seoBlock}\n  ${jsonLD}\n</head>`);

  const file = htmlFileFor(route);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);

  console.log(`  ✓ meta: ${route.path}`);
}

// ─── Phase 1b: Make Vite CSS non-render-blocking ─────────────────────────────
const CSS_BLOCKING = /<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/g;
const allHtmlFiles = ROUTES.map(htmlFileFor);

console.log('\nMaking CSS non-blocking...');
for (const file of allHtmlFiles) {
  try {
    const html = readFileSync(file, 'utf-8');
    const patched = html.replace(CSS_BLOCKING, (_, href) =>
      `<link rel="preload" as="style" href="${href}" onload="this.onload=null;this.rel='stylesheet'">` +
      `<noscript><link rel="stylesheet" href="${href}"></noscript>`
    );
    if (patched !== html) {
      writeFileSync(file, patched);
      console.log(`  ✓ non-blocking CSS: ${file.replace(DIST, '').replace(/\\/g, '/') || '/index.html'}`);
    }
  } catch (e) {
    console.warn(`  ⚠ skipped ${file}: ${e.message}`);
  }
}

// ─── Phase 2: Playwright full-content snapshots ───────────────────────────────
// Captures fully rendered React HTML so AI crawlers see visible text content.
// Gracefully skipped if Playwright/Chromium is unavailable.
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
};

async function startStaticServer(port) {
  const server = createServer((req, res) => {
    let urlPath = req.url.split('?')[0].split('#')[0];
    if (urlPath === '' || urlPath === '/') urlPath = '/index.html';

    // Try exact file, then /path.html (rutas prerenderizadas), then /path/index.html, then SPA fallback
    const candidates = [
      join(DIST, urlPath),
      join(DIST, `${urlPath}.html`),
      join(DIST, urlPath, 'index.html'),
      join(DIST, 'index.html'),
    ];

    for (const candidate of candidates) {
      try {
        const stat = statSync(candidate);
        if (stat.isFile()) {
          const mime = MIME[extname(candidate).toLowerCase()] || 'application/octet-stream';
          res.writeHead(200, { 'Content-Type': mime });
          createReadStream(candidate).pipe(res);
          return;
        }
      } catch { /* try next */ }
    }

    res.writeHead(404);
    res.end('Not found');
  });

  return new Promise((resolve, reject) => {
    server.listen(port, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

async function runPlaywrightSnapshots() {
  const { chromium } = await import('playwright');
  const PORT = 4174;

  const server = await startStaticServer(PORT);
  console.log(`\nPhase 2: Playwright snapshots (port ${PORT})...`);

  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const context = await browser.newContext({
    // Disable service workers so cached state doesn't interfere
    serviceWorkers: 'block',
    // Pretend to be a standard desktop browser
    userAgent: 'Mozilla/5.0 (compatible; Prerenderer/1.0)',
  });
  const page = await context.newPage();

  // Suppress console noise from the React app
  page.on('console', () => {});
  page.on('pageerror', () => {});

  for (const route of ROUTES) {
    try {
      // 'load' waits for DOMContentLoaded + stylesheets/images in <head>,
      // but does NOT wait for iframes (YouTube, etc.) to finish — avoids 30s hangs.
      await page.goto(`http://127.0.0.1:${PORT}${route.path}`, {
        waitUntil: 'load',
        timeout: 30_000,
      });

      // Wait for React to replace the loader with actual content
      await page.waitForFunction(() => {
        const root = document.getElementById('root');
        const loader = document.getElementById('loader-container');
        return root && !loader;
      }, { timeout: 12_000 }).catch(() => {
        // Loader may persist on slow pages — scroll anyway
      });

      // Scroll to trigger IntersectionObserver reveals and contentVisibility sections
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(800);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);

      const html = await page.content();

      writeFileSync(htmlFileFor(route), html);
      console.log(`  ✓ snapshot: ${route.path}`);
    } catch (e) {
      console.warn(`  ⚠ snapshot failed for ${route.path}: ${e.message.split('\n')[0]}`);
    }
  }

  await browser.close();
  server.close();
  console.log('\nPhase 2 complete.');
}

runPlaywrightSnapshots().catch(e => {
  console.warn(`\n⚠ Playwright snapshots skipped: ${e.message.split('\n')[0]}`);
  console.warn('  Phase 1 meta tag prerender still applies — social/search bots are covered.');
  console.warn('  To enable full snapshots, run: npx playwright install chromium\n');
});
