// Post-build prerender: generates static HTML per route with correct meta tags,
// then uses Playwright to snapshot full rendered content (visible to AI crawlers).
// Run automatically via "postbuild" script after `vite build`.
import { readFileSync, writeFileSync, mkdirSync, existsSync, createReadStream, statSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { PRIVATE_PROPOSAL_PATH, privateProposalShell } from './private-proposal.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = process.env.PRERENDER_DIST || join(__dirname, '..', 'dist');
const CONTENT = JSON.parse(readFileSync(join(__dirname, '..', 'data.json'), 'utf8'));
const VOLUNTEER_IMAGE = `https://experienciamagico.com${CONTENT.es.volunteer.image}`;

export const ROUTES = [
  {
    path: '/',
    title: 'Pueblo M�gico - Ecolodge de Monta�a � Los Gigantes, C�rdoba',
    description: 'Pueblo M�gico es un refugio y ecolodge en Los Gigantes, C�rdoba. Explor� estad�as, experiencias, retiros y un proyecto regenerativo que cuida el territorio.',
    image: 'https://experienciamagico.com/uploads/img_6948.webp',
    canonical: 'https://experienciamagico.com/',
  },
  {
    path: '/experiencias',
    title: 'Experiencias y agenda | Pueblo Magico',
    description: 'Bienestar, naturaleza, musica y regeneracion en Los Gigantes, Cordoba. Consulta fechas y estados reales de cada experiencia.',
    image: 'https://experienciamagico.com/uploads/yoga_salon.webp',
    canonical: 'https://experienciamagico.com/experiencias',
  },
  {
    path: '/grupos-y-retiros',
    title: 'Grupos y retiros | Pueblo Magico',
    description: 'Propuestas para facilitadores, escuelas, empresas y comunidades en las Sierras Grandes de Cordoba.',
    image: 'https://experienciamagico.com/uploads/atardeser/comunidad.jpeg',
    canonical: 'https://experienciamagico.com/grupos-y-retiros',
  },
  {
    path: '/nuestro-proyecto',
    title: 'Nuestro proyecto regenerativo | Pueblo Magico',
    description: 'Conoce la historia, los pilares y el trabajo territorial de Pueblo Magico en las Sierras Grandes de Cordoba.',
    image: 'https://experienciamagico.com/uploads/dji_0074.webp',
    canonical: 'https://experienciamagico.com/nuestro-proyecto',
  },
  {
    path: '/como-llegar',
    title: 'Como llegar y preguntas frecuentes | Pueblo Magico',
    description: 'Camino, transporte, clima, conectividad y respuestas practicas para preparar tu visita a Pueblo Magico.',
    image: 'https://experienciamagico.com/uploads/campoentero.webp',
    canonical: 'https://experienciamagico.com/como-llegar',
  },
  {
    path: '/familion',
    title: 'Familion - Retiro Familiar en la Monta�a � Los Gigantes, C�rdoba | Pueblo M�gico',
    description: 'Retiro familiar en Los Gigantes, C�rdoba. Adultos en red, ni�os en libertad, gastronom�a de monta�a y experiencias transformadoras. Consult� la pr�xima fecha.',
    image: 'https://experienciamagico.com/uploads/portada%20familion.webp',
    canonical: 'https://experienciamagico.com/familion',
  },
  {
    path: '/achala-viva',
    title: 'Achala Viva - Retiro de Naturaleza � Los Gigantes, C�rdoba | Pueblo M�gico',
    description: 'Retiro de inmersi�n total en Los Gigantes, C�rdoba. Pr�ximas fechas a confirmar. Astroturismo, avistaje de aves y naturaleza guiada por bi�logo. Solo 15 plazas.',
    image: 'https://experienciamagico.com/uploads/img_6948.webp',
    canonical: 'https://experienciamagico.com/achala-viva',
  },
  {
    path: '/escuelas',
    title: 'Aula Verde - Campamentos Educativos � Los Gigantes, C�rdoba | Pueblo M�gico',
    description: 'Campamentos educativos en Los Gigantes, C�rdoba. Talleres agroecol�gicos, aventura y naturaleza. Para escuelas, primaria y secundaria. Capacidad hasta 180 alumnos.',
    image: 'https://experienciamagico.com/uploads/Aula%20Verde/IMG-20251120-WA0149.jpg',
    canonical: 'https://experienciamagico.com/escuelas',
  },
  {
    path: '/gondorbows',
    title: 'Gondorbows - Retiro de Arquer�a Ancestral � Los Gigantes, C�rdoba | Pueblo M�gico',
    description: 'Constru� tu propio arco en 3 d�as de inmersi�n en Los Gigantes, C�rdoba. Taller de arquer�a tradicional con Gondor Bows. Todo incluido. Sin experiencia previa necesaria.',
    image: 'https://experienciamagico.com/uploads/arcos-fuego.jpg',
    canonical: 'https://experienciamagico.com/gondorbows',
  },
  {
    path: '/terminos-y-condiciones',
    title: 'T�rminos y Condiciones - Pueblo M�gico',
    description: 'T�rminos y condiciones de uso, contrataci�n y cancelaci�n de Pueblo M�gico. Informaci�n sobre medios de pago, pol�ticas de reserva y derechos del consumidor.',
    image: 'https://experienciamagico.com/uploads/img_6948.webp',
    canonical: 'https://experienciamagico.com/terminos-y-condiciones',
  },
  {
    path: '/estadia',
    title: 'Ecolodge de Monta�a en C�rdoba - Refugio de Piedra, Domos y Camping | Pueblo M�gico',
    description: 'Ecolodge de monta�a en Los Gigantes, C�rdoba: Refugio de Piedra, domos geod�sicos y camping. Energ�a solar, ba�os secos y compost. Desde $20.000/persona/noche con desayuno.',
    image: 'https://experienciamagico.com/uploads/campoentero.webp',
    canonical: 'https://experienciamagico.com/estadia',
  },
  {
    path: '/politica-de-privacidad',
    title: 'Pol�tica de Privacidad - Pueblo M�gico',
    description: 'Pol�tica de privacidad y protecci�n de datos personales de Pueblo M�gico conforme a la Ley 25.326. Informaci�n sobre recopilaci�n, uso y derechos sobre tus datos.',
    image: 'https://experienciamagico.com/uploads/img_6948.webp',
    canonical: 'https://experienciamagico.com/politica-de-privacidad',
  },
  {
    path: '/el-vuelo-del-condor',
    title: 'El Vuelo del C�ndor - Un viaje inici�tico en Per� | Pueblo M�gico',
    description: '7 d�as para elevar tu conciencia, expandir tu visi�n y reconectar con tu prop�sito en el Valle Sagrado de los Incas, Per�. Del 22 al 29 de Julio.',
    image: 'https://experienciamagico.com/uploads/temazcal.webp',
    canonical: 'https://experienciamagico.com/el-vuelo-del-condor',
  },
  {
    path: '/propuesta/calma-magico',
    title: 'Calma Salvaje - Una propuesta de Pueblo M�gico para Calma Yoga',
    description: 'Retiro residencial de yoga en las Sierras Grandes de C�rdoba. 3 d�as, hasta 30 personas. Pueblo M�gico + Calma Yoga.',
    image: 'https://experienciamagico.com/uploads/campoentero.webp',
    canonical: 'https://experienciamagico.com/propuesta/calma-magico',
  },
  {
    path: '/inti-raymi',
    title: 'Inti Raymi - Celebraci�n del Solsticio de Invierno � 20 y 21 de Junio | Pueblo M�gico',
    description: 'Dos d�as para celebrar el renacimiento de la luz. Temazcal, fuego, danza, canto y naturaleza en las Sierras Grandes de C�rdoba. 20 y 21 de junio.',
    image: 'https://experienciamagico.com/uploads/fogon_nocturno.png',
    canonical: 'https://experienciamagico.com/inti-raymi',
  },
  {
    path: '/pachamama-fest',
    title: 'Pachamama Fest - Festival Consciente � 14 al 17 de Agosto | Pueblo M�gico',
    description: 'Finde largo en la monta�a para honrar a la Tierra, agradecer y abrir un nuevo ciclo. Ofrenda a la Pachamama, Temazcal, fuego y comunidad en las Sierras Grandes de C�rdoba. 14 al 17 de agosto.',
    image: 'https://experienciamagico.com/uploads/fogon_nocturno.webp',
    canonical: 'https://experienciamagico.com/pachamama-fest',
  },
  {
    path: '/killa-raymi',
    title: 'Killa Raymi - Primavera & Luna Llena � 25 al 27 de Septiembre | Pueblo M�gico',
    description: 'Un fin de semana en la monta�a para celebrar la primavera bajo la luna llena. Temazcal, ceremonia de luna llena, trekking al Macizo Los Gigantes y m�sica en comunidad. Los Gigantes, C�rdoba.',
    image: 'https://experienciamagico.com/uploads/pachamama-cielo-estrellado.webp',
    canonical: 'https://experienciamagico.com/killa-raymi',
  },
  {
    path: '/alma-de-lobo',
    title: 'Alma de Lobo - Encuentro de Hombres en la Monta�a � 2, 3 y 4 de Octubre | Pueblo M�gico',
    description: 'Retiro para hombres bajo la luna llena: c�rculos de palabra, temazcal, fuego y naturaleza para habitar lo masculino desde un lugar consciente y verdadero. Los Gigantes, C�rdoba.',
    image: 'https://experienciamagico.com/uploads/alma-de-lobo-hero-desktop.webp',
    canonical: 'https://experienciamagico.com/alma-de-lobo',
  },
  {
    path: '/sunset-y-rio',
    title: 'Sunset y R�o - en la monta�a � 30 oct al 1 nov � Los Gigantes | Pueblo M�gico',
    description: 'Un s�bado de r�o, el sol cayendo con m�sica y un fog�n con guitarreada a la noche. A aproximadamente 100 km de C�rdoba. Ven� con tus amigos o venite solo o sola.',
    image: 'https://experienciamagico.com/uploads/atardeser/celebracion-grupal.jpeg',
    canonical: 'https://experienciamagico.com/sunset-y-rio',
  },
  {
    path: '/brote-ronda-de-mujeres',
    title: 'BROTE � Ronda de Mujeres, Ciclo Primavera | Pueblo M�gico',
    description: 'BROTE, Ronda de Mujeres - Ciclo Primavera. Del 6 al 8 de noviembre de 2026 en Los Gigantes, C�rdoba. Movimiento, canto, fuego, agua, c�rculo y naturaleza.',
    image: 'https://experienciamagico.com/uploads/Ciclo%20Femenino/Mujeres%20meditando%20en%20circulo%20acostadas.jpeg',
    canonical: 'https://experienciamagico.com/brote-ronda-de-mujeres',
  },
  {
    path: '/festival-raiz-sonora',
    title: 'Ra�z Sonora � 31 de octubre | Pueblo M�gico',
    description: 'Cuatro artistas y ocho horas de m�sica electr�nica, house, trance y tambores, con Jam de AcroYoga, naturaleza y encuentro en Los Gigantes.',
    image: 'https://experienciamagico.com/uploads/atardeser/raizsonoracard.png',
    imageWidth: 1084,
    imageHeight: 631,
    imageAlt: 'Ra�z Sonora � Progressive, house, trance, organic y tambores en Pueblo M�gico',
    canonical: 'https://experienciamagico.com/festival-raiz-sonora',
  },
  {
    path: '/empresas',
    title: 'Empresas - Voluntariado Corporativo & RSE en las Sierras � Los Gigantes, C�rdoba | Pueblo M�gico',
    description: 'Programas de restauraci�n ambiental, voluntariado corporativo y team building en Los Gigantes, C�rdoba. +25.000 �rboles plantados, +200 hect�reas cuidadas, +25 a�os de trayectoria.',
    image: 'https://experienciamagico.com/uploads/dji_0074.webp',
    canonical: 'https://experienciamagico.com/empresas',
  },
  {
    path: '/reforestacion',
    title: 'Reforestaci�n de las Sierras de C�rdoba | Pueblo M�gico',
    description: 'Sumate a la campa�a de Pueblo M�gico para plantar 10.000 �rboles nativos m�s y acompa�ar la regeneraci�n de las Sierras de C�rdoba.',
    image: 'https://experienciamagico.com/uploads/reforestacion/montana-hero.webp',
    canonical: 'https://experienciamagico.com/reforestacion',
  },
  {
    path: '/cordoba-fly-fishing',
    title: 'C�rdoba Fly Fishing Adventure - Guided Trout Fishing in the Sierras | Pueblo M�gico',
    description: 'Guided fly fishing for wild Rainbow and Brook trout in the crystal-clear mountain streams of Las Sierras de C�rdoba. Full-day outings or a 2-night stay in geodesic domes.',
    image: 'https://experienciamagico.com/uploads/flyfishing-hero.jpg',
    canonical: 'https://experienciamagico.com/cordoba-fly-fishing',
  },
  {
    path: '/voluntariado',
    title: 'Programa Semilla - Voluntariado en Pueblo M�gico',
    description: 'Viv� una experiencia de intercambio consciente en las Sierras de C�rdoba. Comunidad, huerta, reforestaci�n, hospitalidad, eventos y regeneraci�n en Pueblo M�gico.',
    image: VOLUNTEER_IMAGE,
    canonical: 'https://experienciamagico.com/voluntariado',
  },
  {
    path: '/organizamos-tu-experiencia',
    title: 'Organizamos tu Experiencia - Retiros, Vivencias & Viajes | Pueblo M�gico',
    description: 'Dise�amos la experiencia que tu comunidad necesita. Retiros, campamentos, viajes y vivencias transformadoras en la monta�a de C�rdoba. Armonizaci�n sonora, cabalgatas, temazcal y m�s.',
    image: 'https://experienciamagico.com/uploads/dji_0074.webp',
    canonical: 'https://experienciamagico.com/organizamos-tu-experiencia',
  },
  {
    path: '/coliving',
    title: 'Coliving M�gico - Vivir, Trabajar y Reconectar � Los Gigantes, C�rdoba | Pueblo M�gico',
    description: 'Coliving en las Sierras de C�rdoba para bienestar y estilo de vida. Formatos de 10 y 20 noches, y Pase Libre Mensual a $480.000. Pensi�n completa, WiFi satelital y Programa Reset Vital incluidos.',
    image: 'https://experienciamagico.com/uploads/coworking.webp',
    canonical: 'https://experienciamagico.com/coliving',
  },
  {
    path: '/ciclo-vital-femenino',
    title: 'Ciclo Vital Femenino � Cap�tulo Muerte-Invierno - Encuentro de Mujeres | Pueblo M�gico',
    description: 'Retiro de mujeres en la monta�a. 28, 29 y 30 de Agosto en Los Gigantes, C�rdoba. Temazcal, c�rculo de mujeres, ceremonia de cacao y rituales para transmutar todo lo que no ES.',
    image: 'https://experienciamagico.com/uploads/Invierno/20250627_222558.webp',
    canonical: 'https://experienciamagico.com/ciclo-vital-femenino',
  },
];

if (!existsSync(DIST)) {
  console.error('dist/ not found - run `vite build` first');
  process.exit(1);
}

// Cada ruta se escribe como archivo plano "<ruta>.html" (no "<ruta>/index.html"):
// Cloudflare Pages sirve /empresas.html en /empresas con 200, y /empresas/
// redirige a /empresas. Con carpeta + index.html pasaba al rev�s (/empresas 
// 308  /empresas/), y el canonical, el sitemap y los links del men� (todos
// sin barra) apuntaban a una URL que redirige.
function htmlFileFor(route) {
  return route.path === '/' ? join(DIST, 'index.html') : join(DIST, `${route.path.slice(1)}.html`);
}

// ��� Phase 1: Meta tag injection (fast, no browser needed) �������������������
console.log('\nPhase 1: Meta tag injection...');
const template = readFileSync(join(DIST, 'index.html'), 'utf-8');
// A dedicated noindex document exists before JavaScript runs, without public SEO metadata.
writeFileSync(join(DIST, `${PRIVATE_PROPOSAL_PATH.slice(1)}.html`), privateProposalShell(template));

// Fallback nativo de Cloudflare Pages para rutas desconocidas: si existe un
// 404.html en la ra�z del output, lo sirve para cualquier ruta no encontrada -
// mismo shell que index.html, React Router se encarga de mostrar <NotFound/>.
// Reemplaza al viejo catch-all de _redirects (causaba loop + pisaba rutas
// prerenderizadas, ver public/_redirects).
writeFileSync(join(DIST, '404.html'), template);
console.log('  V 404.html (fallback SPA nativo)');

// Shell para las 3 rutas client-only (reset-vital, despertar, propuesta/nico-grupe)
// referenciadas desde _redirects. IMPORTANTE: va en una carpeta con su propio
// index.html (como cualquier ruta prerenderizada), NO como un archivo .html
// suelto - Cloudflare Pages normaliza autom�ticamente cualquier destino que
// termine en ".html" con un 308 que le saca la extensi�n, lo que convierte
// la reescritura 200 (invisible) en un redirect visible que cambia la URL
// del browser. Un directorio con index.html no sufre esa normalizaci�n.
mkdirSync(join(DIST, 'app-shell'), { recursive: true });
writeFileSync(join(DIST, 'app-shell', 'index.html'), template);
console.log('  V app-shell/index.html (destino de redirects SPA client-only)');

// Shell propio para /admin/reservas: mismo bundle de React, pero con SU
// PROPIO manifest (nombre, �cono y scope distintos del sitio p�blico) para
// que "instalar app" desde el dashboard cree un �cono separado de "Reset
// Vital" - ver public/manifest-reservas.json. Al ser un archivo real en
// dist/admin/reservas/index.html (mismo patr�n que cualquier ruta
// prerenderizada), Cloudflare Pages lo sirve directo, sin pasar por
// _redirects.
// OJO: `vite build` fingerprintea el href original ("/manifest.json") a algo
// como "/assets/manifest-XXXX.json" - por eso el match es por atributo
// rel="manifest", no por el href literal.
const shellReservas = template
  .replace(/<title>[^<]*<\/title>/, '<title>Reservas - Pueblo M�gico</title>')
  .replace(/<link rel="manifest" href="[^"]*">/, '<link rel="manifest" href="/manifest-reservas.json">')
  .replace(/<meta name="apple-mobile-web-app-title" content="[^"]*">/, '<meta name="apple-mobile-web-app-title" content="Reservas">')
  // iOS "Agregar a inicio" usa este tag, no los �conos del manifest - mismo
  // �cono con fondo dorado en vez de verde, para diferenciarlo de Reset Vital
  // de un vistazo en la pantalla de inicio.
  .replace(/<link rel="apple-touch-icon" href="[^"]*">/, '<link rel="apple-touch-icon" href="/uploads/pwa-192x192-reservas.png">')
  .replace('</head>', '  <meta name="robots" content="noindex,nofollow" />\n</head>');
mkdirSync(join(DIST, 'admin', 'reservas'), { recursive: true });
writeFileSync(join(DIST, 'admin', 'reservas', 'index.html'), shellReservas);
console.log('  V admin/reservas/index.html (shell con manifest propio)');

// ��� Per-route JSON-LD builder �����������������������������������������������
function buildJsonLD(route) {
  if (route.path === '/brote-ronda-de-mujeres') {
    return `<script id="brote-event-schema" type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: 'BROTE - Ronda de Mujeres, Ciclo Primavera',
      description: route.description,
      startDate: '2026-11-06',
      endDate: '2026-11-08',
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: { '@type': 'Place', name: 'Los Gigantes, C�rdoba', address: { '@type': 'PostalAddress', addressLocality: 'Los Gigantes', addressRegion: 'C�rdoba', addressCountry: 'AR' } },
      organizer: { '@type': 'Organization', name: 'Cuenca Lunar' },
      url: route.canonical,
      image: route.image,
    })}</script>`;
  }
  const base = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    "name": "Pueblo M�gico",
    "url": "https://experienciamagico.com",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Los Gigantes",
      "addressRegion": "C�rdoba",
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
    `  <meta property="og:image:secure_url" content="${route.image}" />`,
    `  <meta property="og:image:width" content="${route.imageWidth ?? 1200}" />`,
    `  <meta property="og:image:height" content="${route.imageHeight ?? 630}" />`,
    `  <meta property="og:image:alt" content="${route.imageAlt ?? route.title}" />`,
    `  <meta property="og:url" content="${route.canonical}" />`,
    `  <meta property="og:type" content="website" />`,
    `  <meta property="og:locale" content="es_AR" />`,
    `  <meta name="twitter:card" content="summary_large_image" />`,
    `  <meta name="twitter:title" content="${route.title}" />`,
    `  <meta name="twitter:description" content="${route.description}" />`,
    `  <meta name="twitter:image" content="${route.image}" />`,
    `  <meta name="twitter:image:alt" content="${route.imageAlt ?? route.title}" />`,
    `  <link rel="canonical" href="${route.canonical}" />`,
    `  <meta name="geo.region" content="AR-X" />`,
    `  <meta name="geo.placename" content="Los Gigantes, C�rdoba, Argentina" />`,
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

  console.log(`  V meta: ${route.path}`);
}

// ��� Phase 1b: Make Vite CSS non-render-blocking �����������������������������
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
      console.log(`  V non-blocking CSS: ${file.replace(DIST, '').replace(/\\/g, '/') || '/index.html'}`);
    }
  } catch (e) {
    console.warn(`  ? skipped ${file}: ${e.message}`);
  }
}

// ��� Phase 2: Playwright full-content snapshots �������������������������������
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

  let browser;
  try {
  const systemChrome = process.env.PLAYWRIGHT_CHROME_PATH
    || (existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
      ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
      : undefined);
  browser = await chromium.launch({
    ...(systemChrome ? { executablePath: systemChrome } : {}),
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
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
      // but does NOT wait for iframes (YouTube, etc.) to finish - avoids 30s hangs.
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
        // Loader may persist on slow pages - scroll anyway
      });

      // Scroll to trigger IntersectionObserver reveals and contentVisibility sections
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(800);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);

      const html = await page.content();

      writeFileSync(htmlFileFor(route), html);
      console.log(`  V snapshot: ${route.path}`);
    } catch (e) {
      console.warn(`  ? snapshot failed for ${route.path}: ${e.message.split('\n')[0]}`);
    }
  }

  console.log('\nPhase 2 complete.');
  } finally {
    await browser?.close();
    server.close();
  }
}

runPlaywrightSnapshots().catch(e => {
  console.warn(`\n? Playwright snapshots skipped: ${e.message.split('\n')[0]}`);
  console.warn('  Phase 1 meta tag prerender still applies - social/search bots are covered.');
  console.warn('  To enable full snapshots, run: npx playwright install chromium\n');
});

