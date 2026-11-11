// Separate from public prerender routes: never add these proposals to discovery lists.
export const PRIVATE_PROPOSALS = [
  { path: '/presupuestos/aulas-verdes-360-travel', title: 'Aula Verde · Propuesta para 360 Travel' },
  { path: '/presupuestos/aulas-verdes-729-salvador-mazza', title: 'Aula Verde · Escuela N.º 729 Dr. Salvador Mazza' },
  { path: '/presupuestos/calma-magico', title: 'Calma Mágica · Propuesta para Calma Yoga' },
  { path: '/presupuestos/nico-grupe', title: 'Propuesta · Nico Grupe × Pueblo Mágico' },
  { path: '/presupuestos/cande', title: 'Propuesta para Cande · Pueblo Mágico' },
  { path: '/presupuestos/barbi-firmapaz', title: 'Propuesta para Barbi Firmapaz · Pueblo Mágico' },
  { path: '/presupuestos/jesus-cordoba', title: 'Retiro de Alto Impacto · Propuesta para Jesús Córdoba · Pueblo Mágico' },
];

export const LEGACY_PRIVATE_PROPOSAL_PATHS = [
  '/presupuesto/aulas-verdes-360-travel',
  '/presupuesto/aulas-verdes-729-salvador-mazza',
  '/presupuesto/calma-magico',
  '/presupuesto/nico-grupe',
  '/aulas-verdes-360-travel',
  '/aulas-verdes-travel-360',
  '/aulas-verdes-729-salvador-mazza',
  '/propuesta/calma-magico',
  '/propuesta/nico-grupe',
];
export const PRIVATE_ROBOTS = 'noindex, nofollow, noarchive, nosnippet';

export function privateProposalShell(template, title = 'Aula Verde · Propuesta para 360 Travel') {
  return template
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/<meta\s+[^>]*(?:name=["'](?:description|robots|googlebot|referrer|twitter:[^"']*)["']|property=["']og:[^"']*["'])[^>]*>/gi, '')
    .replace(/<link[^>]*rel=["']canonical["'][^>]*>/gi, '')
    .replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '')
    .replace('</head>', `<meta name="robots" content="${PRIVATE_ROBOTS}" />\n<meta name="googlebot" content="${PRIVATE_ROBOTS}" />\n<meta name="referrer" content="no-referrer" />\n</head>`);
}
