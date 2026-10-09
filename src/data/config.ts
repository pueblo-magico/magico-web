/**
 * Global configuration constants
 */

export const WA_MAGICO = '5493516765820';
export const WA_VOLUNTEERS = '5493512272919';
export const WA_GONDOR = '5491157300099';
export const WA_VUELO_CONDOR = '5493518782085';
export const WA_CICLO_VITAL_FEMENINO = '34621076042';

export const SITE_URL = 'https://experienciamagico.com';

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
};

// Reemplaza los envíos de Netlify Forms (no disponible en Cloudflare Pages).
export const WEB3FORMS_ACCESS_KEY = '05502bcd-b552-47bd-bd01-122f9ab9bc6f';

export const SOCIAL_LINKS = {
  instagram: 'https://instagram.com/pueblomagico__',
  facebook: 'https://facebook.com/magicoensuenio',
  maps: 'https://maps.app.goo.gl/4c1nrpBbQf5hYrsE9',
};
