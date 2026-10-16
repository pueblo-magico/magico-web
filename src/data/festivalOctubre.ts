import { WA_MAGICO, SITE_URL, SOCIAL_LINKS } from './config';

const whatsapp = (message: string) =>
  `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent(message)}`;

export const FESTIVAL_OCTUBRE = {
  /** Nombre provisorio. Reemplazar este único valor cuando se defina la identidad. */
  name: 'AtardeSer / Celebración',
  nameStatus: 'Nombre en definición',
  tagline: 'Música, naturaleza y encuentro',
  dateLabel: 'Sábado 31 de octubre de 2026',
  startDate: '2026-10-31',
  endDate: '2026-11-01',
  location: 'Pueblo Mágico, Los Gigantes, Córdoba',
  route: '/festival-31-octubre',
  canonical: `${SITE_URL}/festival-31-octubre`,
  description:
    'Un día para cambiar de ritmo: electrónica orgánica, música en vivo, naturaleza y experiencias para compartir en las Sierras de Córdoba.',
  images: {
    heroDesktop: '/uploads/sunset-rio-baile.webp',
    heroMobile: '/uploads/sunset-rio-hero-amigos.webp',
    concept: '/uploads/sunset-rio-amigos-mate.webp',
    place: '/uploads/sunset-rio-refugio-jardin.webp',
    og: '/uploads/sunset-rio-og.jpg',
  },
  contact: {
    general: whatsapp(
      '¡Hola! Quiero recibir información sobre el festival del 31 de octubre de 2026 en Pueblo Mágico.'
    ),
    dayPass: whatsapp(
      '¡Hola! Quiero consultar por la entrada general del sábado 31 de octubre de 2026.'
    ),
    weekend: whatsapp(
      '¡Hola! Quiero consultar por la experiencia premium del fin de semana del 31 de octubre de 2026.'
    ),
    instagram: SOCIAL_LINKS.instagram,
  },
  artists: ['Mati Onix', 'Mauri Sayri', 'Federico Salas'],
  experiences: [
    {
      title: 'Música y baile',
      description: 'DJs confirmados y música en vivo para encontrarnos en movimiento.',
      image: '/uploads/sunset-rio-baile.webp',
      alt: 'Personas bailando al aire libre en Pueblo Mágico',
    },
    {
      title: 'Río y montaña',
      description: 'Agua, senderos y el paisaje de Los Gigantes como parte de la experiencia.',
      image: '/uploads/sunset-rio-rio-real.webp',
      alt: 'Río entre las sierras cerca de Pueblo Mágico',
    },
    {
      title: 'Movimiento y bienestar',
      description: 'Yoga y meditaciones para volver al cuerpo y cambiar de ritmo.',
      image: '/uploads/sunset-rio-breathwork.webp',
      alt: 'Práctica grupal de movimiento consciente al aire libre',
    },
    {
      title: 'Experiencias especiales',
      description: 'Ceremonia de temazcal, sujeta a disponibilidad y condiciones específicas.',
      image: '/uploads/temazcal.webp',
      alt: 'Espacio de ceremonia de temazcal en Pueblo Mágico',
    },
    {
      title: 'Fuego y comunidad',
      description: 'Fogón y círculos para compartir conversaciones que valen la pena.',
      image: '/uploads/sunset-rio-fogon-real.webp',
      alt: 'Fogón comunitario nocturno en Pueblo Mágico',
    },
    {
      title: 'Comida y buen vivir',
      description: 'Propuestas gastronómicas saludables disponibles durante el encuentro.',
      image: '/uploads/sunset-rio-brindis.webp',
      alt: 'Encuentro alrededor de una mesa al aire libre',
    },
  ],
} as const;

export type FestivalExperience = (typeof FESTIVAL_OCTUBRE.experiences)[number];
