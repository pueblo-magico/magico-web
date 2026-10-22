// Separate from public prerender routes: never add this proposal to discovery lists.
export const PRIVATE_PROPOSAL_PATH = '/aulas-verdes-360-travel';
export const PRIVATE_ROBOTS = 'noindex, nofollow, noarchive, nosnippet';

export function privateProposalShell(template) {
  return template
    .replace(/<title>[^<]*<\/title>/, '<title>Aula Verde · Propuesta para 360 Travel</title>')
    .replace(/<meta\s+[^>]*(?:name=["'](?:description|robots|googlebot|referrer|twitter:[^"']*)["']|property=["']og:[^"']*["'])[^>]*>/gi, '')
    .replace(/<link[^>]*rel=["']canonical["'][^>]*>/gi, '')
    .replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '')
    .replace('</head>', `<meta name="robots" content="${PRIVATE_ROBOTS}" />\n<meta name="googlebot" content="${PRIVATE_ROBOTS}" />\n<meta name="referrer" content="no-referrer" />\n</head>`);
}
