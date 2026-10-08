/**
 * Retreats pricing, dates and specific configuration
 */

export const RETREATS_DATA = {
  vueloDelCondor: {
    price: 1800,
    currency: 'USD',
    dates: '22 al 29 de Julio',
    location: 'Valle Sagrado, Perú',
    message: "¡Hola! Vengo Desde la web y me interesa el viaje iniciático 'El Vuelo del Cóndor' en Perú. ✨",
  },
  familion: {
    prices: {
      camping: 280000,
      refugio: 450000,
      domoPrivado: 650000,
    },
    pricesUsd: {
      camping: 190,
      refugio: 300,
      domoPrivado: 430,
    },
    dates: ['14 al 15 de Agosto'],
    message: 'Hola! Vengo de Familion y quiero consultar la experiencia.',
  },
  achalaViva: {
    price: 180000,
    priceUsd: 120,
    currency: 'ARS',
    dates: 'Próximas fechas a confirmar',
    message: '¡Hola! Me interesa Achala Viva y quiero saber cuándo es la próxima fecha. 🗓️✨',
  },
  gondorbows: {
    price: 640000,
    priceUsd: 430,
    currency: 'ARS',
    dates: '24, 25 y 26 de Julio',
    message: '¡Hola Fausto! Terminé de leer todo sobre el retiro de Gondorbows y no me lo quiero perder. Me comunico para coordinar la seña y asegurar mi lugar. 🌲✨',
  },
  cicloVitalFemenino: {
    priceSola: 400000,
    priceAcompanada: 300000,
    senia: 100000,
    segundoPago: 100000,
    pricesUsd: {
      priceSola: 270,
      priceAcompanada: 200,
      senia: 70,
      segundoPago: 70,
      valorReferencia: 600,
    },
    segundoPagoFecha: '15 de Agosto',
    valorReferenciaARS: 900000,
    currency: 'ARS',
    dates: '28, 29 y 30 de Agosto',
    cupos: 9,
    fechaLimiteInscripcion: '24 de Agosto',
    message: '¡Hola! Vengo de la web y me interesa el retiro "Ciclo Vital Femenino - Capítulo Muerte-Invierno". Me gustaría reservar mi lugar. ✨',
    messageConsulta: '¡Hola! Me encantó la propuesta de Ciclo Vital Femenino y quiero saber el valor de la inversión y las formas de pago. ✨',
  }
};

export type PricingLanguage = 'es' | 'en';

export function formatPrice(amount: number, language: PricingLanguage): string {
  return language === 'en'
    ? `USD ${amount.toLocaleString('en-US')}`
    : `$${amount.toLocaleString('es-AR')}`;
}

export const ESTADIA_PRICES = {
  // Alojamiento + desayuno — por persona/noche. Comidas y Reset Vital presencial se suman aparte.
  carpaDesde: 20000,        // Camping
  ecoRefugioDesde: 35000,   // Habitación compartida o Domo geodésico compartido
  domoPrivado: 50000,       // Domo privado — por persona, de 2 a 7 personas
  domoPrivadoSolo: 100000,  // Domo privado para 1 persona sola — precio por noche, con desayuno

  // Gastronomía — menú del día, por persona/día
  almuerzo: 20000,
  cena: 20000,

  // Pensión completa — precio total por persona/noche (alojamiento + desayuno + almuerzo + cena)
  pensionCompletaCarpa: 45000,
  pensionCompletaEcoRefugio: 60000,
  pensionCompletaDomoPrivado: 75000,

  // Reset Vital presencial — upgrade sobre el programa digital (incluido) · tarifa única por persona (no por día)
  resetVitalPresencial: 5000,
};

export const ESTADIA_PRICES_USD: typeof ESTADIA_PRICES = {
  carpaDesde: 15,
  ecoRefugioDesde: 25,
  domoPrivado: 35,
  domoPrivadoSolo: 70,
  almuerzo: 15,
  cena: 15,
  pensionCompletaCarpa: 30,
  pensionCompletaEcoRefugio: 40,
  pensionCompletaDomoPrivado: 50,
  resetVitalPresencial: 5,
};

export function getEstadiaPrices(language: PricingLanguage): typeof ESTADIA_PRICES {
  return language === 'en' ? ESTADIA_PRICES_USD : ESTADIA_PRICES;
}

export const COLIVING_PRICES = {
  currency: 'ARS',
  precioPorNocheInvierno: 50000, // temporada de invierno — estadías cortas, a la carta
  formatos: [
    { noches: 10, precio: 350000, label: '10 noches', desc: 'Un proceso más profundo, ideal para integrar hábitos' },
    { noches: 20, precio: 420000, label: '20 noches', desc: 'Estadía extendida para instalar un ritmo y una rutina real de trabajo' },
  ],
  paseMensual: {
    precio: 480000,
    label: 'Pase Libre Mensual',
    desc: 'La opción más completa para vivir la experiencia en profundidad',
  },
  message: 'Hola! Vengo de la web y quiero sumarme a Coliving Mágico ✨',
};

export const COLIVING_PRICES_USD: typeof COLIVING_PRICES = {
  currency: 'USD',
  precioPorNocheInvierno: 35,
  formatos: [
    { noches: 10, precio: 240, label: '10 nights', desc: 'A deeper process, ideal for integrating habits' },
    { noches: 20, precio: 280, label: '20 nights', desc: 'An extended stay for establishing a real work rhythm and routine' },
  ],
  paseMensual: {
    precio: 320,
    label: 'Monthly Open Pass',
    desc: 'The most complete option for experiencing the program in depth',
  },
  message: 'Hi! I came from the website and would like to join Coliving Mágico ✨',
};

export function getColivingPrices(language: PricingLanguage): typeof COLIVING_PRICES {
  return language === 'en' ? COLIVING_PRICES_USD : COLIVING_PRICES;
}
