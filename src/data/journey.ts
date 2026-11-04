import { ROUTES } from '../routes';

export type JourneyLanguage = 'es' | 'en';
export type ExperienceStatus = 'upcoming' | 'ongoing' | 'on-request' | 'past';
export type ExperienceCategory = 'wellbeing' | 'nature' | 'music' | 'regeneration';

export const journeyCopy = {
  es: {
    status: {
      upcoming: 'Próxima fecha',
      ongoing: 'Disponible con tu estadía',
      'on-request': 'A pedido',
      past: 'Experiencia pasada',
    },
    categories: {
      wellbeing: 'Bienestar',
      nature: 'Naturaleza',
      music: 'Música y cultura',
      regeneration: 'Regeneración',
    },
  },
  en: {
    status: {
      upcoming: 'Upcoming',
      ongoing: 'Available with your stay',
      'on-request': 'On request',
      past: 'Past experience',
    },
    categories: {
      wellbeing: 'Wellbeing',
      nature: 'Nature',
      music: 'Music & culture',
      regeneration: 'Regeneration',
    },
  },
} as const;

export type JourneyHub = {
  href: string;
  image: string;
  title: Record<JourneyLanguage, string>;
  description: Record<JourneyLanguage, string>;
};

export const journeyHubs: JourneyHub[] = [
  {
    href: ROUTES.ESTADIA,
    image: '/uploads/img_8475.webp',
    title: { es: 'Quedarte en la montaña', en: 'Stay in the mountains' },
    description: {
      es: 'Elegí entre camping, Refugio de Piedra, domos y estadías largas. Compará qué incluye cada opción antes de consultar disponibilidad.',
      en: 'Choose camping, the Stone Lodge, domes or a longer stay. Compare what each option includes before checking availability.',
    },
  },
  {
    href: ROUTES.EXPERIENCIAS,
    image: '/uploads/yoga_salon.webp',
    title: { es: 'Vivir una experiencia', en: 'Live an experience' },
    description: {
      es: 'Explorá bienestar, naturaleza, música y regeneración con estados claros: próxima fecha, disponible, a pedido o pasada.',
      en: 'Explore wellbeing, nature, music and regeneration with clear states: upcoming, available, on request or past.',
    },
  },
  {
    href: ROUTES.GRUPOS_RETIROS,
    image: '/uploads/atardeser/comunidad.jpeg',
    title: { es: 'Traer a tu comunidad', en: 'Bring your community' },
    description: {
      es: 'Co-creamos propuestas para facilitadores, escuelas y empresas, con un camino breve hacia una consulta concreta.',
      en: 'We co-create proposals for facilitators, schools and companies, with a short path to a concrete inquiry.',
    },
  },
];

export type ExperienceMeta = {
  link: string;
  title?: string;
  categories: ExperienceCategory[];
  status?: ExperienceStatus;
  publicCatalog?: boolean;
};

/**
 * Editorial metadata for the shared event cards in data.json. Dates and public
 * visibility remain in that single event source; this map only adds journey
 * categories and evergreen status where a date cannot express it.
 */
export const experienceMeta: ExperienceMeta[] = [
  { link: '/festival-raiz-sonora', categories: ['music', 'nature'] },
  { link: '/brote-ronda-de-mujeres', categories: ['wellbeing', 'nature'], publicCatalog: false },
  { link: '/reforestacion#voluntariado', categories: ['regeneration', 'nature'] },
  { link: '/achala-viva', categories: ['nature'], status: 'on-request' },
  { link: '', title: 'Temazcal', categories: ['wellbeing'], status: 'on-request' },
  { link: '/cordoba-fly-fishing', categories: ['nature'], status: 'ongoing' },
  { link: '/reset-vital', categories: ['wellbeing', 'nature'], status: 'ongoing' },
  { link: '/killa-raymi', categories: ['music', 'regeneration'], status: 'past' },
];

export const transversalThemes = {
  es: [
    { title: 'Naturaleza y territorio', description: 'Montaña, río, bosque nativo, flora, fauna y cielo abierto.' },
    { title: 'Bienestar', description: 'Descanso, movimiento, meditación y herramientas de reconexión.' },
    { title: 'Comunidad', description: 'Convivencia, encuentros, aprendizaje colectivo y colaboración.' },
    { title: 'Regeneración', description: 'Reforestación, educación ambiental y participación en el cuidado del territorio.' },
    { title: 'Cultura y música', description: 'Música medicina, celebraciones, artesanía e intercambio cultural.' },
    { title: 'Aventura', description: 'Senderismo, exploración, observación y experiencias guiadas.' },
  ],
  en: [
    { title: 'Nature & territory', description: 'Mountains, river, native forest, wildlife and open skies.' },
    { title: 'Wellbeing', description: 'Rest, movement, meditation and practical reconnection tools.' },
    { title: 'Community', description: 'Shared living, gatherings, collective learning and collaboration.' },
    { title: 'Regeneration', description: 'Reforestation, environmental education and caring for the land.' },
    { title: 'Culture & music', description: 'Medicine music, celebrations, craft and cultural exchange.' },
    { title: 'Adventure', description: 'Hiking, exploration, observation and guided experiences.' },
  ],
} as const;

export const bookingReassurance = {
  es: {
    title: 'Consultar no confirma una reserva',
    body: 'Primero verificamos disponibilidad, alojamiento, comidas y condiciones para tus fechas. Después recibís el detalle y el próximo paso para confirmar.',
    cta: 'Ver estadías y condiciones',
  },
  en: {
    title: 'An inquiry is not a confirmed booking',
    body: 'We first verify availability, accommodation, meals and conditions for your dates. You then receive the details and the next step to confirm.',
    cta: 'See stays and conditions',
  },
} as const;
