import { WA_MAGICO, SITE_URL, SOCIAL_LINKS } from './config';

const whatsapp = (message: string) =>
  `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent(message)}`;

export const FESTIVAL_OCTUBRE = {
  name: 'Raíz Sonora',
  nameStatus: 'Primer festival de música y naturaleza',
  tagline: 'Festival de música, naturaleza y encuentro',
  dateLabel: 'Sábado 31 de octubre de 2026',
  startDate: '2026-10-31',
  endDate: '2026-11-01',
  location: 'Pueblo Mágico, Los Gigantes, Córdoba',
  route: '/festival-31-octubre',
  canonical: `${SITE_URL}/festival-31-octubre`,
  description:
    'Raíz Sonora es un festival de electrónica orgánica, música en vivo, naturaleza y experiencias para compartir en las Sierras de Córdoba.',
  images: {
    heroDesktop: '/uploads/sunset-rio-hero.webp',
    heroMobile: '/uploads/sunset-rio-hero-amigos.webp',
    concept: '/uploads/sunset-rio-amigos-mate.webp',
    place: '/uploads/sunset-rio-refugio-jardin.webp',
    og: '/uploads/sunset-rio-og.jpg',
  },
  contact: {
    general: whatsapp(
      '¡Hola! Quiero recibir información sobre Raíz Sonora, el festival del 31 de octubre de 2026 en Pueblo Mágico.'
    ),
    dayPass: whatsapp(
      '¡Hola! Quiero reservar el Pase Festival de Raíz Sonora para el sábado 31 de octubre de 2026.'
    ),
    festivalNight: whatsapp(
      '¡Hola! Quiero reservar Festival + Noche para Raíz Sonora, del sábado 31 de octubre al domingo 1 de noviembre de 2026.'
    ),
    weekend: whatsapp(
      '¡Hola! Quiero reservar la experiencia Fin de Semana de Raíz Sonora, del viernes 30 de octubre al domingo 1 de noviembre de 2026.'
    ),
    instagram: SOCIAL_LINKS.instagram,
  },
  artists: [
    {
      name: 'Mati Onix',
      style: 'DJ · electrónica orgánica',
      bio: 'Parte de la grilla central de Raíz Sonora, con un set pensado para entrar en movimiento y acompañar el pulso del paisaje.',
      image: '/uploads/sunset-rio-baile.webp',
      imageAlt: 'Atmósfera de música y baile al aire libre en Pueblo Mágico',
      imageNote: 'Imagen de atmósfera · retrato oficial pendiente',
    },
    {
      name: 'Mauri Sayri',
      style: 'DJ Orion · electrónica',
      bio: 'También presentado públicamente como DJ Orion, llega desde la escena de Sierras Chicas para sumar una selección electrónica al encuentro.',
      image: '/uploads/sunset-rio-guitarreada.webp',
      imageAlt: 'Música alrededor del fuego en Pueblo Mágico',
      imageNote: 'Imagen de atmósfera · retrato oficial pendiente',
      sourceUrl: 'https://elmilenio.info/2025/05/16/salsipuedes-invitan-a-participar-a-la-4ta-vuelta-a-salsipuedes-2025/',
    },
    {
      name: 'Federico Salas',
      style: 'DJ · electrónica orgánica',
      bio: 'Un tercer pulso para la jornada central: música electrónica en diálogo con el monte, el atardecer y la experiencia compartida.',
      image: '/uploads/sunset-rio-fogon-real.webp',
      imageAlt: 'Encuentro nocturno alrededor del fuego en Pueblo Mágico',
      imageNote: 'Imagen de atmósfera · retrato oficial pendiente',
    },
  ],
  accessOptions: [
    {
      eyebrow: 'Sábado 31',
      shortTitle: 'Pase Festival',
      title: 'Pase Festival · Solo sábado',
      price: 'AR$ 35.000',
      heroDetail: 'Música + experiencias del día',
      description: 'La opción más simple para venir por el día y vivir el corazón musical de Raíz Sonora.',
      includes: [
        'Acceso al festival durante toda la jornada del sábado',
        'DJs, música en vivo y espacios generales',
        'Yoga, meditación y propuestas abiertas que integren la programación',
        'Río, montaña y fogón comunitario',
      ],
      excludes: ['Comidas y bebidas', 'Alojamiento', 'Temazcal u otras experiencias con cupo específico'],
      href: whatsapp('¡Hola! Quiero reservar el Pase Festival de Raíz Sonora por AR$ 35.000.'),
      cta: 'Reservar Pase Festival',
      featured: false,
    },
    {
      eyebrow: 'Sábado + domingo',
      shortTitle: 'Festival + Noche',
      title: 'Festival + Noche',
      price: 'AR$ 95.000',
      heroDetail: 'Festival + 1 noche + comidas',
      description: 'Para bailar el sábado, dormir en Pueblo Mágico y despertar en las sierras sin volver a la ruta esa noche.',
      includes: [
        'Todo lo incluido en el Pase Festival',
        'Una noche de alojamiento compartido o acampe, según disponibilidad',
        'Cena del sábado y desayuno del domingo',
        'Propuesta suave de naturaleza y cierre el domingo',
      ],
      excludes: ['Traslado hasta Pueblo Mágico', 'Bebidas fuera de las incluidas en las comidas', 'Experiencias especiales con cupo adicional'],
      href: whatsapp('¡Hola! Quiero reservar Festival + Noche de Raíz Sonora por AR$ 95.000.'),
      cta: 'Reservar Festival + Noche',
      featured: true,
    },
    {
      eyebrow: 'Viernes a domingo',
      shortTitle: 'Fin de Semana',
      title: 'Experiencia Fin de Semana',
      price: 'AR$ 165.000',
      heroDetail: '2 noches + comidas + experiencias',
      description: 'La experiencia completa: llegar antes, habitar el encuentro con tiempo y quedarse hasta el cierre del domingo.',
      includes: [
        'Acceso completo a Raíz Sonora',
        'Dos noches de alojamiento compartido o acampe, según disponibilidad',
        'Comidas desde la cena del viernes hasta el almuerzo del domingo',
        'Bienvenida del viernes y actividades seleccionadas del fin de semana',
        'Prioridad para reservar experiencias especiales de cupo limitado',
      ],
      excludes: ['Traslado hasta Pueblo Mágico', 'Consumos personales y bebidas extra'],
      href: whatsapp('¡Hola! Quiero reservar la Experiencia Fin de Semana de Raíz Sonora por AR$ 165.000.'),
      cta: 'Reservar Fin de Semana',
      featured: false,
    },
  ],
  pricingNote: 'Valores de lanzamiento por persona. Alojamiento y experiencias de cupo limitado se confirman por WhatsApp.',
  team: [
    {
      name: 'Diego',
      fullName: 'Diego Epelman Hodara',
      role: 'Anfitrión · dirección de experiencia',
      description: 'Fundador de Pueblo Mágico. Crea el clima de confianza, presencia y encuentro que sostiene la experiencia.',
      image: '/uploads/Diego_perfil.png',
      instagram: 'https://www.instagram.com/diegoepel/',
    },
    {
      name: 'China',
      fullName: 'China Dericia',
      role: 'Movimiento · bienestar · hospitalidad',
      description: 'Guía prácticas de yoga, movimiento consciente, respiración y canto para volver al cuerpo durante el encuentro.',
      image: '/uploads/china.jpeg',
      instagram: 'https://www.instagram.com/bambu.alquimia.terapeutica/',
    },
    {
      name: 'Nicole',
      fullName: 'Nicole Rosignoli Miranda',
      role: 'Cuidado · integración · salud cíclica',
      description: 'Psicóloga gestáltica. Acompaña espacios grupales e integra naturaleza, cuerpo y cuidado de los procesos.',
      image: '/uploads/nicole-rosignoli.webp',
      instagram: 'https://www.instagram.com/thematriiz/',
    },
    {
      name: 'Jasper',
      fullName: 'Jasper Felix Meyer',
      role: 'Producción · tecnología · música',
      description: 'Creador multidisciplinario. Conecta producción, comunicación, música y herramientas digitales para darle forma al encuentro.',
      image: '/uploads/jasper.png',
      instagram: 'https://www.instagram.com/itsjasperrz/',
    },
    {
      name: 'Mati Onix',
      fullName: 'Mati Onix',
      role: 'Dirección musical · DJ',
      description: 'Parte del equipo musical y de la grilla central. Acompaña la identidad sonora de esta primera edición.',
      image: '/uploads/sunset-rio-baile.webp',
    },
  ],
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
export type FestivalArtist = (typeof FESTIVAL_OCTUBRE.artists)[number];
export type FestivalAccessOption = (typeof FESTIVAL_OCTUBRE.accessOptions)[number];
export type FestivalTeamMember = (typeof FESTIVAL_OCTUBRE.team)[number];
