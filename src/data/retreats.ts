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
    dates: ['14 al 15 de Agosto'],
    message: 'Hola! Vengo de Familion y quiero consultar la experiencia.',
  },
  achalaViva: {
    price: 180000,
    currency: 'ARS',
    dates: 'Próximas fechas a confirmar',
    message: '¡Hola! Me interesa Achala Viva y quiero saber cuándo es la próxima fecha. 🗓️✨',
  },
  gondorbows: {
    price: 640000,
    currency: 'ARS',
    dates: '24, 25 y 26 de Julio',
    message: '¡Hola Fausto! Terminé de leer todo sobre el retiro de Gondorbows y no me lo quiero perder. Me comunico para coordinar la seña y asegurar mi lugar. 🌲✨',
  },
  cicloVitalFemenino: {
    priceSola: 400000,
    priceAcompanada: 300000,
    senia: 100000,
    segundoPago: 100000,
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
