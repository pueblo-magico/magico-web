/**
 * Global configuration constants
 */

import { normalizePortalUrl, resolvePortalUrl } from './portalUrl';

export const WA_MAGICO = '5493516765820';
export const WA_VOLUNTEERS = '5493512272919';
export const WA_GONDOR = '5491157300099';
export const WA_VUELO_CONDOR = '5493518782085';
export const WA_CICLO_VITAL_FEMENINO = '34621076042';

export const SITE_URL = 'https://experienciamagico.com';

const DEFAULT_RESERVAS_BASE_URL = 'https://reservas.experienciamagico.com';

function reservasBaseUrl(): string {
  const configuredUrl = import.meta.env.VITE_RESERVAS_BASE_URL?.trim();
  if (!configuredUrl) return DEFAULT_RESERVAS_BASE_URL;

  try {
    const url = new URL(configuredUrl);
    const isLocalDevelopment = ['localhost', '127.0.0.1'].includes(url.hostname);
    if (url.username || url.password || (url.protocol !== 'https:' && !isLocalDevelopment)) {
      return DEFAULT_RESERVAS_BASE_URL;
    }
    return url.origin;
  } catch {
    return DEFAULT_RESERVAS_BASE_URL;
  }
}

export const RESERVAS_BASE_URL = reservasBaseUrl();
export const RESERVAS_PUBLIC_URL = `${RESERVAS_BASE_URL}/reservar?paso=fechas`;
export const RESERVAS_ADMIN_URL = `${RESERVAS_BASE_URL}/admin`;

export const COMPANION_PORTAL_URL = resolvePortalUrl(
  import.meta.env.VITE_COMPANION_PORTAL_URL,
  'https://mi.experienciamagico.com',
);
export const STAFF_PORTAL_URL = resolvePortalUrl(
  import.meta.env.VITE_STAFF_PORTAL_URL,
  'https://admin.experienciamagico.com',
);

// Cloudflare Pages preview hosts are ephemeral and cannot each be registered as
// an exact OIDC callback. Preview builds therefore delegate sign-in to the
// stable website DEV origin. Stable DEV and production omit this variable and
// keep using their same-origin auth endpoint.
export const WEBSITE_LOGIN_URL = normalizePortalUrl(
  import.meta.env.VITE_WEBSITE_LOGIN_URL,
) ?? '/api/v1/auth/login';

// Datos públicos de la campaña de reforestación. Se inyectan en build time y
// pueden quedar vacíos: la landing deriva a WhatsApp hasta que estén configurados.
export const REFORESTATION_CONTRIBUTION = {
  alias: import.meta.env.VITE_REFORESTATION_ALIAS?.trim() || 'pueblo-magico',
  accountHolder: import.meta.env.VITE_REFORESTATION_ACCOUNT_HOLDER?.trim() || 'Diego Epelman',
  cbu: import.meta.env.VITE_REFORESTATION_CBU?.trim() ?? '',
  sepa: {
    accountHolder: import.meta.env.VITE_REFORESTATION_SEPA_ACCOUNT_HOLDER?.trim() || '',
    iban: import.meta.env.VITE_REFORESTATION_SEPA_IBAN?.trim() || '',
    bic: import.meta.env.VITE_REFORESTATION_SEPA_BIC?.trim() || '',
    bankName: import.meta.env.VITE_REFORESTATION_SEPA_BANK?.trim() || '',
    currency: import.meta.env.VITE_REFORESTATION_SEPA_CURRENCY?.trim() || 'EUR',
    isSample: !import.meta.env.VITE_REFORESTATION_SEPA_ACCOUNT_HOLDER?.trim()
      || !import.meta.env.VITE_REFORESTATION_SEPA_IBAN?.trim()
      || !import.meta.env.VITE_REFORESTATION_SEPA_BIC?.trim(),
  },
  crypto: {
    usdc: {
      address: import.meta.env.VITE_REFORESTATION_USDC_ADDRESS?.trim() || '0xc774732d6b98afcc3d26c84f8542c95408ab59d7',
      network: import.meta.env.VITE_REFORESTATION_USDC_NETWORK?.trim() || 'Ethereum / Polygon',
      isSample: false,
    },
    btc: {
      address: import.meta.env.VITE_REFORESTATION_BTC_ADDRESS?.trim() || 'bc1qlpydcscttrqqasszlh80cu9cv2qjhn4puj5cfc',
      network: import.meta.env.VITE_REFORESTATION_BTC_NETWORK?.trim() || 'Bitcoin',
      isSample: false,
    },
    eth: {
      address: import.meta.env.VITE_REFORESTATION_ETH_ADDRESS?.trim() || '0xc774732d6b98afcc3d26c84f8542c95408ab59d7',
      network: import.meta.env.VITE_REFORESTATION_ETH_NETWORK?.trim() || 'Ethereum',
      isSample: false,
    },
    isSample: false,
  },
  raisedAmount: Number(import.meta.env.VITE_REFORESTATION_RAISED_AMOUNT ?? 230000),
  // Tipo de cambio operativo para mostrar el progreso en inglés. Se mantiene
  // configurable hasta definir qué cotización pública (oficial/MEP/otra) usar.
  arsPerUsd: Number(import.meta.env.VITE_REFORESTATION_ARS_PER_USD ?? 1500),
  // Cantidad real de personas que ya aportaron (rifa + aporte libre). Con 0 no se muestra.
  donorsCount: Number(import.meta.env.VITE_REFORESTATION_DONORS_COUNT ?? 0),
  // Fecha límite de la seña (Fase 1). Después de esta fecha la cuenta regresiva se oculta.
  depositDeadline: import.meta.env.VITE_REFORESTATION_DEPOSIT_DEADLINE?.trim() || '2026-10-30',
  treePrice: 1500,
};

// Reemplaza los envíos de Netlify Forms (no disponible en Cloudflare Pages).
export const WEB3FORMS_ACCESS_KEY = '05502bcd-b552-47bd-bd01-122f9ab9bc6f';

export const SOCIAL_LINKS = {
  instagram: 'https://instagram.com/pueblomagico__',
  facebook: 'https://facebook.com/magicoensuenio',
  maps: 'https://maps.app.goo.gl/4c1nrpBbQf5hYrsE9',
};
