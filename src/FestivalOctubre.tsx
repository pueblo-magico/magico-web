import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  BedDouble,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Flame,
  Instagram,
  Leaf,
  MapPin,
  MessageCircle,
  Moon,
  Music2,
  Sparkles,
  Sun,
  Ticket,
  UserRound,
  UsersRound,
  Utensils,
  Waves,
} from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { PageSectionNav, type PageNavigation } from '../components/PageSectionNav';
import {
  FESTIVAL_OCTUBRE,
  type FestivalAccessOption,
  type FestivalTeamMember,
} from './data/festivalOctubre';
import { img } from './lib/img';

const C = {
  pine: '#2F3A31',
  night: '#1B1520',
  moss: '#656853',
  sun: '#F0B25D',
  clay: '#C35D3C',
  coral: '#EF5A2F',
  plum: '#482A3C',
  mauve: '#7C596E',
  cream: '#F5F0E6',
  paper: '#FCF8EF',
  ink: '#211B20',
};

const SunRings = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 320 320" fill="none" aria-hidden="true">
    {[42, 68, 94, 120, 146].map(radius => (
      <circle key={radius} cx="160" cy="160" r={radius} stroke="currentColor" strokeWidth="1" opacity={0.72 - radius / 300} />
    ))}
    <circle cx="160" cy="160" r="18" fill="currentColor" opacity="0.9" />
  </svg>
);

const OrganicWave = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 1200 180" fill="none" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0 96C58 96 58 83 116 83s58 27 116 27 58-63 116-63 58 94 116 94 58-121 116-121 58 140 116 140 58-118 116-118 58 88 116 88 58-56 116-56 58 31 116 31 58-12 116-12 58 3 116 3" stroke="currentColor" strokeWidth="2" />
    <path d="M0 108C58 108 58 98 116 98s58 18 116 18 58-42 116-42 58 61 116 61 58-80 116-80 58 93 116 93 58-78 116-78 58 58 116 58 58-37 116-37 58 21 116 21 58-8 116-8 58 2 116 2" stroke="currentColor" strokeWidth="1" opacity="0.55" />
  </svg>
);

const TopographicLines = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 500 300" fill="none" aria-hidden="true">
    <path d="M-20 216C65 158 98 259 181 208s112-94 202-38 108 18 152-8" stroke="currentColor" />
    <path d="M-34 239C53 178 105 281 190 228s113-93 203-36 112 15 157-12" stroke="currentColor" opacity="0.72" />
    <path d="M-46 263C43 198 112 302 201 247s112-88 204-34 116 11 160-16" stroke="currentColor" opacity="0.45" />
    <path d="M25 116c63-44 116-28 154 12s85 54 146 14 112-56 182-8" stroke="currentColor" opacity="0.38" />
  </svg>
);

const navigation: PageNavigation = {
  ariaLabel: 'Navegación del festival',
  pageEyebrow: '31 · 10 · 2026',
  pageTitle: 'Festival en Pueblo Mágico',
  sections: [
    { id: 'propuesta', label: 'La propuesta' },
    { id: 'para-quien', label: 'Para quién es' },
    { id: 'experiencias', label: 'Experiencias' },
    { id: 'artistas', label: 'Artistas' },
    { id: 'equipo', label: 'Equipo' },
    { id: 'fin-de-semana', label: 'Fin de semana' },
    { id: 'entradas', label: 'Entradas' },
    { id: 'lugar', label: 'El lugar' },
    { id: 'temazcal', label: 'Temazcal' },
    { id: 'preguntas', label: 'Preguntas' },
  ],
};

const weekend = [
  {
    day: 'Viernes',
    date: '30 OCT',
    title: 'Llegada y bienvenida',
    description: 'Llegada para quienes elijan dos noches, instalación y un primer encuentro para empezar a compartir.',
    Icon: Moon,
    featured: false,
  },
  {
    day: 'Sábado',
    date: '31 OCT',
    title: 'Jornada central',
    description: 'Cuatro DJs, música en vivo, fogón y las actividades programadas en el corazón de la montaña.',
    Icon: Sun,
    featured: true,
  },
  {
    day: 'Domingo',
    date: '01 NOV',
    title: 'Naturaleza e integración',
    description: 'Temazcal, yoga, caminatas y conexión con ríos y montañas para quienes extiendan su estadía.',
    Icon: Leaf,
    featured: false,
  },
] as const;

const faqs = [
  {
    Icon: CalendarDays,
    question: '¿Puedo asistir solamente el sábado?',
    answer: 'Sí. El Pase por el Día permite vivir toda la jornada central del sábado 31. También podés sumar una o dos noches, en camping o habitación compartida.',
  },
  {
    Icon: Ticket,
    question: '¿Qué incluye la entrada general?',
    answer: 'El Pase por el Día cuesta AR$ 35.000 por persona e incluye la jornada central del sábado, los cuatro artistas, el fogón y las propuestas abiertas. No incluye comidas, bebidas, estacionamiento, alojamiento ni experiencias con inscripción propia.',
  },
  {
    Icon: Utensils,
    question: '¿La comida está incluida?',
    answer: 'Los tickets con alojamiento incluyen desayuno. Durante todo el fin de semana habrá un buffet de comida artesanal para distintos momentos del día y gustos, además de barra de bebidas. El resto de las comidas y bebidas se abona por separado.',
  },
  {
    Icon: BedDouble,
    question: '¿Qué opciones de alojamiento hay?',
    answer: 'Podés elegir camping con tu propia carpa o una cama en habitación compartida con ropa blanca. Hay opciones de una o dos noches y todas incluyen desayuno. Los cupos se confirman al reservar.',
  },
  {
    Icon: Waves,
    question: '¿Puedo ir sin experiencia previa en yoga o meditación?',
    answer: 'Sí. No necesitás experiencia previa. Podés elegir libremente a qué propuestas sumarte.',
  },
  {
    Icon: UserRound,
    question: '¿Puedo asistir solo o sola?',
    answer: 'Sí. La propuesta está pensada para encontrarse, compartir y conocer gente, tanto si venís por tu cuenta como en grupo.',
  },
  {
    Icon: UsersRound,
    question: '¿Puedo venir con niños o niñas?',
    answer: 'Sí. AtardeSer es un encuentro apto para toda la familia: niños y niñas son bienvenidos. Es importante que permanezcan acompañados por una persona adulta responsable.',
  },
  {
    Icon: Flame,
    question: '¿Cómo funciona el temazcal del domingo?',
    answer: 'El temazcal forma parte de la propuesta del domingo y tiene cupo limitado, inscripción previa y un valor adicional. Consultanos para reservar tu lugar.',
  },
  {
    Icon: MapPin,
    question: '¿Dónde queda Pueblo Mágico?',
    answer: 'En Los Gigantes, Sierras de Córdoba, Argentina. Consultanos por WhatsApp para recibir la ubicación y la información vigente para llegar.',
  },
  {
    Icon: CreditCard,
    question: '¿Cómo consulto por las entradas?',
    answer: 'Elegí una modalidad y escribinos por WhatsApp desde su botón. Allí confirmamos cupo, alojamiento cuando corresponda y los pasos para reservar. Podés pagar por transferencia o en 3 cuotas sin interés con tarjeta.',
  },
];

const EVENT_START = new Date('2026-10-31T12:00:00-03:00').getTime();

const Countdown = () => {
  const [remaining, setRemaining] = useState(() => Math.max(0, EVENT_START - Date.now()));

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(Math.max(0, EVENT_START - Date.now())), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const totalSeconds = Math.floor(remaining / 1000);
  const units = [
    ['Días', Math.floor(totalSeconds / 86400)],
    ['Horas', Math.floor((totalSeconds % 86400) / 3600)],
    ['Min', Math.floor((totalSeconds % 3600) / 60)],
    ['Seg', totalSeconds % 60],
  ] as const;

  return (
    <div className="grid max-w-lg grid-cols-4 gap-2" aria-label="Cuenta regresiva para AtardeSer">
      {units.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-white/15 bg-black/20 px-2 py-3 text-center backdrop-blur-sm">
          <span className="block text-2xl text-white serif-title md:text-3xl">{String(value).padStart(2, '0')}</span>
          <span className="mt-1 block text-[8px] font-bold uppercase tracking-[0.16em] text-white/45">{label}</span>
        </div>
      ))}
    </div>
  );
};

const Eyebrow = ({ children, light = false }: { children: React.ReactNode; light?: boolean }) => (
  <p className={`mb-4 text-[11px] font-bold uppercase tracking-[0.28em] ${light ? 'text-[#F4C48B]' : 'text-[#C35D3C]'}`}>
    {children}
  </p>
);

const FestivalButton = ({ href, children, secondary = false, fullWidth = false }: { href: string; children: React.ReactNode; secondary?: boolean; fullWidth?: boolean }) => (
  <a
    href={href}
    target={href.startsWith('http') ? '_blank' : undefined}
    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
    className={`group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 text-xs font-bold uppercase tracking-[0.13em] transition duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${fullWidth ? 'w-full' : ''} ${
      secondary
        ? 'border border-white/55 bg-[#1B1520]/35 text-white backdrop-blur-sm hover:bg-white/10 focus-visible:outline-white'
        : 'bg-[#EF5A2F] text-white shadow-[0_14px_38px_rgba(93,35,28,0.28)] hover:-translate-y-0.5 hover:bg-[#FF7048] focus-visible:outline-[#EF5A2F]'
    }`}
  >
    {children}
    <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
  </a>
);

const TeamCard = ({ member, index }: { member: FestivalTeamMember; index: number }) => (
  <article className="relative h-full overflow-hidden rounded-[1.75rem] border border-[#8D5E70]/20 bg-[#FFF9F0] p-7 shadow-[0_18px_45px_rgba(72,42,60,0.08)]" data-reveal data-delay={String((index % 3) + 1)}>
    <span className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#C35D3C,#F0B25D,#7C596E)]" aria-hidden="true" />
    <div className="mb-5 h-16 w-16 overflow-hidden rounded-full border-2 border-[#F0B25D]/60 bg-[#482A3C]/10">
      <img
        src={img(member.image, 800)}
        alt={member.fullName}
        loading="lazy"
        width="160"
        height="160"
        className="h-full w-full object-cover"
      />
    </div>
    <p className="text-lg font-bold text-[#211B20]">{member.name}</p>
    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#C35D3C]">{member.role}</p>
    <p className="mt-3 text-sm leading-relaxed text-[#211B20]/65">{member.description}</p>
    {'instagram' in member && member.instagram && (
      <a href={member.instagram} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#482A3C] underline decoration-[#EF5A2F] decoration-2 underline-offset-4">
        <Instagram size={14} aria-hidden="true" /> Instagram
      </a>
    )}
  </article>
);

const accessCardTones = [
  'border-[#C35D3C]/25 bg-[#F8E3D7]',
  'border-[#656853]/25 bg-[#E7E5D8]',
  'border-[#7C596E]/25 bg-[#EEE2E8]',
  'border-[#D59048]/30 bg-[#F8E9CA]',
] as const;

const AccessCard = ({ option, index }: { option: FestivalAccessOption; index: number }) => (
  <article className={`relative flex h-full min-w-0 flex-col overflow-hidden rounded-[1.75rem] border p-6 md:p-7 ${option.featured ? 'border-[#F0B25D] bg-[#482A3C] text-white shadow-[0_24px_60px_rgba(72,42,60,0.28)]' : accessCardTones[index % accessCardTones.length]}`} data-reveal data-delay={String((index % 3) + 1)}>
    <div className={`absolute inset-x-0 top-0 h-1.5 ${option.featured ? 'bg-[linear-gradient(90deg,#EF5A2F,#F0B25D)]' : index % 2 === 0 ? 'bg-[#C35D3C]' : 'bg-[#656853]'}`} aria-hidden="true" />
    <div className="mb-4 flex h-7 items-center justify-center">
      {option.featured && <span className="rounded-full bg-[#F0B25D] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#482A3C]">Equilibrio ideal</span>}
    </div>
    <p className={`text-center text-[10px] font-bold uppercase tracking-[0.2em] ${option.featured ? 'text-[#F4C48B]' : 'text-[#C35D3C]'}`}>{option.eyebrow}</p>
    <h3 className="mt-3 text-center text-3xl leading-[1.05] serif-title md:min-h-[5rem]">{option.title}</h3>
    <p className={`mt-4 text-center text-sm leading-relaxed md:min-h-[5rem] ${option.featured ? 'text-white/70' : 'text-[#1F2922]/65'}`}>{option.description}</p>
    <div className={`my-6 border-y py-6 text-center ${option.featured ? 'border-white/10' : 'border-[#123B2D]/10'}`}>
      <p className={`mx-auto mb-4 inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold whitespace-nowrap ${option.featured ? 'bg-white/10 text-[#F4C48B]' : 'bg-white/65 text-[#482A3C]'}`}>💳 {option.installments}</p>
      <p className="text-4xl serif-title">{option.price}</p>
      <p className={`mt-2 text-[10px] font-bold uppercase tracking-[0.12em] ${option.featured ? 'text-white/50' : 'text-[#1F2922]/50'}`}>por persona · transferencia · 20% off</p>
    </div>
    <p className={`mb-4 text-center text-[10px] font-bold uppercase tracking-[0.18em] ${option.featured ? 'text-[#F4C48B]' : 'text-[#C35D3C]'}`}>Incluye</p>
    <ul className="mb-6 space-y-3">
      {option.includes.map(item => <li key={item} className={`flex gap-2.5 text-sm leading-relaxed ${option.featured ? 'text-white/80' : 'text-[#211B20]/75'}`}><Check size={16} className="mt-0.5 shrink-0 text-[#EF5A2F]" aria-hidden="true" />{item}</li>)}
    </ul>
    <div className={`mb-7 rounded-2xl p-4 ${option.featured ? 'bg-white/[0.07]' : 'bg-[#123B2D]/[0.05]'}`}>
      <p className={`mb-2 text-[10px] font-bold uppercase tracking-[0.18em] ${option.featured ? 'text-white/50' : 'text-[#1F2922]/50'}`}>No incluye</p>
      <p className={`text-xs leading-relaxed ${option.featured ? 'text-white/65' : 'text-[#1F2922]/65'}`}>{option.excludes.join(' · ')}</p>
    </div>
    <div className="mt-auto"><FestivalButton href={option.href} fullWidth>{option.cta}</FestivalButton></div>
  </article>
);

type RailControlsProps = {
  canGoBack: boolean;
  canGoForward: boolean;
  inverse?: boolean;
  label: string;
  onBack: () => void;
  onForward: () => void;
};

const RailControls: React.FC<RailControlsProps> = ({
  canGoBack,
  canGoForward,
  inverse = false,
  label,
  onBack,
  onForward,
}) => {
  const buttonClassName = inverse
    ? 'border-[#F4C48B]/25 bg-white/[0.06] text-white hover:border-[#F4C48B]/60 hover:bg-white/15 disabled:border-white/10 disabled:text-white/25'
    : 'border-[#482A3C]/20 bg-white text-[#482A3C] hover:border-[#482A3C] hover:bg-[#482A3C] hover:text-white disabled:border-[#482A3C]/10 disabled:bg-white/50 disabled:text-[#482A3C]/25';

  return (
    <div className="flex shrink-0 items-center gap-2" aria-label={label}>
      <button
        type="button"
        onClick={onBack}
        disabled={!canGoBack}
        aria-label="Ver tarjeta anterior"
        className={`flex h-10 w-10 items-center justify-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EF5A2F] disabled:cursor-default ${buttonClassName}`}
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onForward}
        disabled={!canGoForward}
        aria-label="Ver tarjeta siguiente"
        className={`flex h-10 w-10 items-center justify-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EF5A2F] disabled:cursor-default ${buttonClassName}`}
      >
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </div>
  );
};

const useHorizontalRail = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(true);

  useEffect(() => {
    const rail = ref.current;
    if (!rail) return undefined;

    const updatePosition = () => {
      const maximumScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
      setCanGoBack(rail.scrollLeft > 4);
      setCanGoForward(rail.scrollLeft < maximumScroll - 4);
    };

    updatePosition();
    rail.addEventListener('scroll', updatePosition, { passive: true });
    const resizeObserver = new ResizeObserver(updatePosition);
    resizeObserver.observe(rail);

    return () => {
      rail.removeEventListener('scroll', updatePosition);
      resizeObserver.disconnect();
    };
  }, []);

  const scroll = (direction: -1 | 1) => {
    const rail = ref.current;
    if (!rail) return;

    const items = Array.from(rail.querySelectorAll<HTMLElement>('[data-rail-item]'));
    if (!items.length) return;

    const viewportCenter = rail.scrollLeft + rail.clientWidth / 2;
    const target = direction === 1
      ? items.find(item => item.offsetLeft + item.clientWidth / 2 > viewportCenter + 8) ?? items.at(-1)
      : [...items].reverse().find(item => item.offsetLeft + item.clientWidth / 2 < viewportCenter - 8) ?? items[0];

    if (!target) return;
    rail.scrollTo({
      left: target.offsetLeft - (rail.clientWidth - target.clientWidth) / 2,
      behavior: 'smooth',
    });
  };

  return { ref, canGoBack, canGoForward, scroll };
};

const celebrationMoments = [
  {
    src: '/uploads/atardeser/movimiento.jpeg',
    alt: 'Baile libre durante una celebración en Pueblo Mágico',
    label: 'Movimiento libre',
  },
  {
    src: '/uploads/atardeser/mati-en-magico.jpeg',
    alt: 'Música y encuentro durante una celebración en Pueblo Mágico',
    label: 'Música que reúne',
  },
  {
    src: '/uploads/atardeser/baile-en-familia.jpeg',
    alt: 'Personas de distintas edades bailando al aire libre',
    label: 'Celebrar juntos',
  },
  {
    src: '/uploads/atardeser/ninez.jpeg',
    alt: 'Niños y adultos compartiendo una celebración al aire libre',
    label: 'Toda la familia',
  },
] as const;

const CelebrationMosaic = () => (
  <section aria-label="Momentos de celebraciones en Pueblo Mágico" className="relative overflow-hidden bg-[#482A3C] px-6 py-16 text-white md:px-10 md:py-24">
    <div className="pointer-events-none absolute -left-24 -top-20 h-72 w-72 rounded-full bg-[#EF5A2F]/35 blur-3xl" aria-hidden="true" />
    <div className="pointer-events-none absolute -bottom-28 right-[-3rem] h-80 w-80 rounded-full bg-[#F0B25D]/20 blur-3xl" aria-hidden="true" />
    <SunRings className="pointer-events-none absolute -right-24 -top-28 h-[28rem] w-[28rem] text-[#F4C48B]/18" />
    <OrganicWave className="pointer-events-none absolute inset-x-0 bottom-0 h-36 w-full text-[#F4C48B]/14" />

    <div className="relative mx-auto max-w-7xl">
      <div className="mx-auto max-w-4xl text-center" data-reveal>
        <p className="mb-5 inline-flex rounded-full border border-[#F4C48B]/30 bg-[#1B1520]/30 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.28em] text-[#F4C48B]">Esto ya se vive</p>
        <h2 className="text-4xl leading-[1.02] text-[#FFF8EA] serif-title md:text-6xl">La celebración se siente en el cuerpo.</h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/68">Imágenes reales de encuentros en Pueblo Mágico: música, baile, familias y naturaleza compartiendo el mismo ritmo.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          {['Música en vivo', 'Baile al aire libre', 'Todas las edades'].map(item => (
            <span key={item} className="rounded-full border border-[#F4C48B]/25 bg-white/[0.06] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#F4C48B]">{item}</span>
          ))}
        </div>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-3 md:mt-12 lg:grid-cols-4" data-reveal data-delay="1">
        {celebrationMoments.map((moment, index) => (
          <figure key={moment.src} className="group relative aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-[#F4C48B]/30 bg-[#1B1520] shadow-[0_24px_55px_rgba(27,21,32,0.35)] sm:aspect-[4/3] lg:aspect-[4/5]">
            <img src={img(moment.src, index === 0 ? 1000 : 800)} alt={moment.alt} loading="lazy" width="1000" height="1000" className="h-full w-full object-cover saturate-[1.08] transition duration-700 group-hover:scale-[1.03]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(239,90,47,0.04),rgba(72,42,60,0.12))] mix-blend-color" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1B1520]/90 to-transparent" />
            <figcaption className="absolute bottom-4 left-4 rounded-full border border-white/20 bg-[#1B1520]/70 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.13em] text-white shadow-sm backdrop-blur-sm">{moment.label}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  </section>
);

const FestivalOctubre: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const artistRail = useHorizontalRail();
  const teamRail = useHorizontalRail();
  const accessRail = useHorizontalRail();

  useEffect(() => {
    const rail = accessRail.ref.current;
    if (!rail) return;

    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const centerFeaturedOption = () => {
      if (!mobileQuery.matches) return;
      const featuredOption = rail.querySelector<HTMLElement>('[data-featured-option="true"]');
      if (!featuredOption) return;
      rail.scrollTo({
        left: featuredOption.offsetLeft - (rail.clientWidth - featuredOption.clientWidth) / 2,
        behavior: 'auto',
      });
    };

    const frame = window.requestAnimationFrame(centerFeaturedOption);
    mobileQuery.addEventListener('change', centerFeaturedOption);

    return () => {
      window.cancelAnimationFrame(frame);
      mobileQuery.removeEventListener('change', centerFeaturedOption);
    };
  }, [accessRail.ref]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${FESTIVAL_OCTUBRE.name} · 31 de octubre · Pueblo Mágico`;

    const setMeta = (selector: string, attr: string, value: string) => {
      let element = document.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        document.head.appendChild(element);
      }
      element.setAttribute(attr, value);
      return element;
    };
    setMeta('meta[name="description"]', 'name', 'description').content = FESTIVAL_OCTUBRE.description;
    setMeta('meta[property="og:title"]', 'property', 'og:title').content = `${FESTIVAL_OCTUBRE.name} · ${FESTIVAL_OCTUBRE.tagline}`;
    setMeta('meta[property="og:description"]', 'property', 'og:description').content = FESTIVAL_OCTUBRE.description;
    setMeta('meta[property="og:image"]', 'property', 'og:image').content = `${window.location.origin}${FESTIVAL_OCTUBRE.images.og}`;
    setMeta('meta[property="og:url"]', 'property', 'og:url').content = FESTIVAL_OCTUBRE.canonical;
    setMeta('meta[property="og:type"]', 'property', 'og:type').content = 'website';

    const schema = document.createElement('script');
    schema.type = 'application/ld+json';
    schema.id = 'ld-festival-octubre';
    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Festival',
      name: FESTIVAL_OCTUBRE.name,
      description: FESTIVAL_OCTUBRE.description,
      startDate: FESTIVAL_OCTUBRE.startDate,
      endDate: FESTIVAL_OCTUBRE.endDate,
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      image: `${window.location.origin}${FESTIVAL_OCTUBRE.images.og}`,
      location: {
        '@type': 'Place',
        name: 'Pueblo Mágico',
        address: { '@type': 'PostalAddress', addressLocality: 'Los Gigantes', addressRegion: 'Córdoba', addressCountry: 'AR' },
      },
      organizer: { '@type': 'Organization', name: 'Pueblo Mágico', url: window.location.origin },
      performer: FESTIVAL_OCTUBRE.artists.map(artist => ({ '@type': 'Person', name: artist.name })),
    });
    document.getElementById(schema.id)?.remove();
    document.head.appendChild(schema);

    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
    );
    document.querySelectorAll('[data-reveal]').forEach(element => observer.observe(element));

    return () => {
      document.title = previousTitle;
      observer.disconnect();
      schema.remove();
    };
  }, []);

  return (
    <div className="overflow-x-hidden bg-[#FCFAF5] text-[#1F2922]">
      <Header subNavigation={<PageSectionNav navigation={navigation} minimumSections={5} />} />

      <main>
        <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-[#1B1520]">
          <picture className="absolute inset-0">
            <source media="(max-width: 640px)" srcSet={img(FESTIVAL_OCTUBRE.images.heroMobile, 1000)} />
            <img
              src={img(FESTIVAL_OCTUBRE.images.heroDesktop, 1900)}
              alt="Atardecer compartido en las sierras de Pueblo Mágico"
              width="1900"
              height="1200"
              className="h-full w-full object-cover object-center saturate-[1.14] max-sm:object-[57%_center]"
            />
          </picture>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(27,21,32,0.38) 0%, rgba(72,42,60,0.5) 42%, rgba(27,21,32,0.94) 100%)' }} />
          <div className="absolute inset-0 mix-blend-color" style={{ background: 'linear-gradient(115deg, rgba(195,93,60,0.28), transparent 42%, rgba(239,90,47,0.24))' }} />
          <div className="absolute inset-x-0 top-0 h-40" style={{ background: 'linear-gradient(to bottom, rgba(27,21,32,0.74), transparent)' }} />
          <div className="pointer-events-none absolute -left-20 top-[28%] h-72 w-72 rounded-full bg-[#EF5A2F]/25 blur-[90px]" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-16 bottom-[12%] h-80 w-80 rounded-full bg-[#F0B25D]/22 blur-[100px]" aria-hidden="true" />
          <img
            src={FESTIVAL_OCTUBRE.images.overlay}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-screen"
          />

          <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-14 pt-16 text-center md:px-10 md:pb-16 md:pt-16">
            <div className="mx-auto max-w-4xl">
              <div className="mb-6 flex flex-wrap justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/80">
                <span className="rounded-full border border-[#F4C48B]/40 bg-[#1B1520]/35 px-4 py-2 backdrop-blur-sm">Sábado 31 de octubre de 2026</span>
                <span className="rounded-full border border-[#F4C48B]/40 bg-[#1B1520]/35 px-4 py-2 backdrop-blur-sm">Los Gigantes · Córdoba</span>
              </div>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.34em] text-[#F4C48B] md:text-xs">Música · Naturaleza · Encuentro</p>
              <h1 className="text-6xl leading-[0.82] tracking-[-0.055em] text-[#FFF8EA] serif-title sm:text-7xl md:text-8xl lg:text-[9.5rem]">ATARDESER</h1>
              <p className="mx-auto mt-5 text-2xl leading-tight text-[#FFF8EA] serif-title md:text-4xl">Donde el día se transforma en ritual</p>
              <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-white/80 md:text-lg">
                Un día para encontrarnos, celebrar y conectar con el pulso natural. Live sets y música en vivo con DJs invitados, naturaleza y experiencias para compartir en el corazón de la montaña. Vení por el día o quedate a vivir el finde completo.
              </p>
              <div className="mt-6 flex justify-center"><Countdown /></div>
              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <FestivalButton href={FESTIVAL_OCTUBRE.contact.general}>Quiero sumarme</FestivalButton>
                <FestivalButton href="#propuesta" secondary>Conocer la propuesta</FestivalButton>
              </div>
              <div className="mt-7 flex items-center justify-center gap-3 text-xs text-white/60">
                <Clock3 size={15} aria-hidden="true" />
                <span>Preventa abierta · cupos de alojamiento limitados</span>
              </div>
            </div>
          </div>
          <a href="#propuesta" aria-label="Ir a la propuesta" className="absolute bottom-8 right-6 z-10 hidden h-12 w-12 items-center justify-center rounded-full border border-white/25 text-white/70 transition hover:bg-white/10 md:flex">
            <ArrowDown size={18} aria-hidden="true" />
          </a>
        </section>

        <section id="propuesta" className="relative overflow-hidden bg-[#F5F0E6] px-6 py-20 text-[#211B20] md:px-10 md:py-28">
          <TopographicLines className="pointer-events-none absolute -left-28 top-4 h-80 w-[38rem] text-[#7C596E]/16" />
          <SunRings className="pointer-events-none absolute -bottom-40 -right-40 h-[30rem] w-[30rem] text-[#C35D3C]/16" />
          <div className="relative mx-auto max-w-5xl">
            <div className="text-center" data-reveal>
              <div className="mb-7 flex items-center justify-center gap-3">
                {[{ Icon: Music2, color: '#C35D3C' }, { Icon: Sun, color: '#D59048' }, { Icon: UsersRound, color: '#7C596E' }].map(({ Icon, color }, index) => (
                  <span key={index} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#482A3C]/10 bg-white/70 shadow-sm">
                    <Icon size={17} color={color} aria-hidden="true" />
                  </span>
                ))}
              </div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.34em] text-[#C35D3C]">El festival</p>
              <h2 className="mx-auto max-w-3xl text-4xl leading-[1.04] text-[#211B20] serif-title md:text-6xl">Un encuentro entre paisaje y sonido</h2>
              <p className="mx-auto mt-7 max-w-2xl text-sm leading-relaxed text-[#211B20]/65 md:text-base">
                AtardeSer es una celebración para bailar, respirar la montaña y compartir sin apuro. Un encuentro abierto para venir por el día o quedarse a vivir el fin de semana completo.
              </p>
            </div>

            <div className="mt-14 grid gap-4 md:grid-cols-3" data-reveal data-delay="1">
              {[
                { Icon: Music2, title: 'Música orgánica', text: 'Cuatro artistas acompañan un viaje sonoro desde el movimiento del día hasta el fuego de la noche.', shell: 'border-[#C35D3C]/25 bg-[#F8E3D7]', icon: 'bg-[#C35D3C] text-white' },
                { Icon: Leaf, title: 'Naturaleza viva', text: 'Río, senderos y montaña forman parte de la experiencia y nos invitan a cambiar de ritmo.', shell: 'border-[#656853]/25 bg-[#E7E5D8]', icon: 'bg-[#656853] text-white' },
                { Icon: UsersRound, title: 'Comunidad', text: 'Fogón, comida artesanal y espacios para celebrar, conversar y conocer gente nueva.', shell: 'border-[#7C596E]/25 bg-[#EEE2E8]', icon: 'bg-[#7C596E] text-white' },
              ].map(({ Icon, title, text, shell, icon }) => (
                <article key={title} className={`rounded-[1.75rem] border px-7 py-8 text-center shadow-[0_16px_40px_rgba(72,42,60,0.07)] ${shell}`}>
                  <span className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full ${icon}`}>
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-xl text-[#211B20] serif-title">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#211B20]/60">{text}</p>
                </article>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap justify-center gap-2.5" data-reveal data-delay="2">
              {['Abierto a toda la familia', 'Vení por el día', 'Quedate el finde', 'Buffet y barra disponibles'].map(item => (
                <span key={item} className="rounded-full border border-[#482A3C]/15 bg-white/65 px-4 py-2 text-[10px] font-semibold tracking-wide text-[#482A3C]">{item}</span>
              ))}
            </div>
          </div>
        </section>

        <CelebrationMosaic />

        <section id="para-quien" className="relative overflow-hidden px-6 py-20 md:px-10 md:py-28" style={{ background: 'linear-gradient(145deg, #FCF8EF 0%, #F5E5DC 52%, #F0D6B0 150%)' }}>
          <div className="pointer-events-none absolute -left-16 top-24 h-52 w-52 rounded-full bg-[#EF5A2F]/12 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-16 bottom-16 h-64 w-64 rounded-full bg-[#7C596E]/14 blur-3xl" aria-hidden="true" />
          <TopographicLines className="pointer-events-none absolute -right-24 top-0 h-72 w-[34rem] text-[#C35D3C]/12" />
          <div className="relative mx-auto max-w-5xl">
            <div className="mb-14 text-center" data-reveal>
              <p className="mb-5 inline-block rounded-full bg-[#482A3C] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white">¿Para quién es?</p>
              <h2 className="text-4xl leading-tight text-[#211B20] serif-title md:text-5xl">Para quienes quieren celebrar distinto.<br /><span className="text-[#C35D3C]">Y encontrarse de verdad.</span></h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#211B20]/60">No necesitás experiencia previa ni venir con un grupo. AtardeSer está pensado para disfrutar la música, la naturaleza y el encuentro a tu propio ritmo.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2" data-reveal data-delay="1">
              {[
                {
                  Icon: Sparkles,
                  title: 'Para venir como sos',
                  text: 'Si querés salir de la rutina, bailar al aire libre, bajar un cambio o compartir un día diferente en la montaña, este encuentro es para vos.',
                  items: ['Personas que vienen solas, en pareja o con amigos', 'Quienes buscan música y naturaleza sin formato rígido', 'Familias: niños y niñas son bienvenidos', 'Sin experiencia previa en las actividades'],
                  tone: 'green',
                },
                {
                  Icon: Leaf,
                  title: 'Para elegir tu propio ritmo',
                  text: 'Podés venir solamente el sábado o transformar la celebración en un fin de semana completo, con camping o habitación compartida.',
                  items: ['Pase por el día para vivir la jornada central', 'Una o dos noches para quedarse en Pueblo Mágico', 'Actividades abiertas para elegir libremente', 'Temazcal opcional con inscripción y cupo propios'],
                  tone: 'gold',
                },
              ].map(({ Icon, title, text, items, tone }) => (
                <article key={title} className={`relative overflow-hidden rounded-[1.75rem] border p-8 text-left shadow-[0_16px_45px_rgba(72,42,60,0.08)] ${tone === 'green' ? 'border-[#656853]/25 bg-[#E7E5D8]' : 'border-[#7C596E]/25 bg-[#EEE2E8]'}`}>
                  <div className={`absolute inset-x-0 top-0 h-1.5 ${tone === 'green' ? 'bg-[#656853]' : 'bg-[#C35D3C]'}`} aria-hidden="true" />
                  <span className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full ${tone === 'green' ? 'bg-[#656853] text-white' : 'bg-[#C35D3C] text-white'}`}><Icon size={19} aria-hidden="true" /></span>
                  <h3 className="mt-5 text-center text-xl font-bold text-[#211B20]">{title}</h3>
                  <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-[#211B20]/60">{text}</p>
                  <ul className="mx-auto mt-6 max-w-md space-y-2.5">
                    {items.map(item => <li key={item} className="flex items-start gap-2.5 text-sm text-[#211B20]/65"><span className="mt-1 shrink-0 text-[#C35D3C]">◆</span>{item}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="experiencias" className="relative overflow-hidden bg-[#FCF8EF] px-6 py-20 md:px-10 md:py-28">
          <div className="pointer-events-none absolute left-[-6rem] top-[-5rem] h-72 w-72 rounded-full bg-[#7C596E]/10 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute bottom-[-7rem] right-[-5rem] h-80 w-80 rounded-full bg-[#EF5A2F]/12 blur-3xl" aria-hidden="true" />
          <div className="mx-auto max-w-5xl">
            <div className="mb-14 text-center" data-reveal>
              <Eyebrow>Qué vas a encontrar</Eyebrow>
              <h2 className="text-4xl leading-tight serif-title md:text-5xl">Cada propuesta es una puerta.<br /><span className="text-[#C35D3C]">Vos elegís cómo transitarla.</span></h2>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-[#211B20]/60 md:text-base">Nada es obligatorio: son invitaciones abiertas para armar tu propia experiencia, en el momento y con la intensidad que quieras.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2" data-reveal data-delay="1">
              {[
                { Icon: Music2, color: '#8F3E2B', bg: 'bg-[#F8E3D7]', border: 'border-[#C35D3C]/25', bar: 'bg-[#C35D3C]', title: 'Música & movimiento', items: ['Cuatro DJs y live sets confirmados', 'Baile libre y movimiento', 'Música en vivo junto al paisaje', 'Un viaje sonoro del día al fuego de la noche'] },
                { Icon: Leaf, color: '#555945', bg: 'bg-[#E7E5D8]', border: 'border-[#656853]/25', bar: 'bg-[#656853]', title: 'Naturaleza & exploración', items: ['Río y senderos de montaña', 'Caminatas y espacios de descanso', 'Yoga y conexión con el cuerpo', 'Tiempo libre para habitar el lugar'] },
                { Icon: Flame, color: '#773D57', bg: 'bg-[#EEE2E8]', border: 'border-[#7C596E]/25', bar: 'bg-[#7C596E]', title: 'Ritual & integración', items: ['Fogón y círculos para compartir', 'Conversaciones significativas y auténticas', 'Temazcal opcional el domingo', 'Espacios para bajar el ritmo e integrar'] },
                { Icon: Sun, color: '#8B5A23', bg: 'bg-[#F8E9CA]', border: 'border-[#D59048]/30', bar: 'bg-[#D59048]', title: 'Gastronomía & comunidad', items: ['Buffet de comida artesanal todo el fin de semana', 'Barra de bebidas', 'Encuentro abierto a toda la familia', 'Opciones para venir por el día o quedarse'] },
              ].map(({ Icon, color, bg, border, bar, title, items }) => (
                <article key={title} className={`relative overflow-hidden rounded-[1.75rem] border p-7 text-left shadow-[0_14px_35px_rgba(31,41,34,0.06)] ${bg} ${border}`}>
                  <span className={`absolute inset-x-0 top-0 h-1.5 ${bar}`} aria-hidden="true" />
                  <div className="mb-5 flex items-center justify-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/75 shadow-sm" style={{ color }}><Icon size={18} aria-hidden="true" /></span>
                    <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color }}>{title}</h3>
                  </div>
                  <ul className="mx-auto max-w-md space-y-3">
                    {items.map(item => <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-[#1F2922]/65"><span className="mt-1 shrink-0" style={{ color }}>◆</span>{item}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="artistas" className="relative overflow-hidden bg-[#1B1520] px-6 py-20 text-white md:px-10 md:py-28">
          <img
            src={FESTIVAL_OCTUBRE.images.pulse}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-50"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#1B1520]/40 via-[#1B1520]/90 to-[#1B1520]" />
          <div className="relative mx-auto max-w-7xl">
            <div className="mx-auto mb-12 max-w-3xl text-center" data-reveal>
              <Eyebrow light>Artistas confirmados</Eyebrow>
              <h2 className="text-4xl leading-tight text-[#FFF8EA] serif-title md:text-6xl">El pulso de AtardeSer.</h2>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/55 md:text-base">Cuatro artistas confirmados para celebrar integrando música y naturaleza. La música acompaña el viaje desde el movimiento del día hasta el fuego de la noche.</p>
            </div>
            <div className="mb-5 flex items-center justify-between gap-4">
              <p className="text-xs leading-relaxed text-white/50 md:text-sm">Deslizá o usá las flechas para conocer a cada artista.</p>
              <RailControls
                inverse
                label="Controles de artistas"
                canGoBack={artistRail.canGoBack}
                canGoForward={artistRail.canGoForward}
                onBack={() => artistRail.scroll(-1)}
                onForward={() => artistRail.scroll(1)}
              />
            </div>
            <div ref={artistRail.ref} className="scrollbar-hide -mx-6 touch-pan-x touch-pan-y snap-x snap-proximity scroll-px-6 overflow-x-auto overflow-y-hidden overscroll-x-contain px-6 pb-4 md:-mx-10 md:scroll-px-10 md:px-10" aria-label="Artistas confirmados">
              <div className="flex gap-5">
                {FESTIVAL_OCTUBRE.artists.map((artist, index) => (
                  <article key={artist.name} data-rail-item className="group w-[calc(100vw-3rem)] max-w-[340px] shrink-0 snap-start overflow-hidden rounded-[1.75rem] border border-[#F4C48B]/18 bg-[#2A1D2A] shadow-[0_24px_60px_rgba(0,0,0,0.26)]" data-reveal data-delay={String(index + 1)}>
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <img src={img(artist.image, 900)} alt={artist.imageAlt} loading="lazy" width="900" height="1125" className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-[1.04]" />
                      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(27,21,32,0.92),transparent_65%)]" />
                      <span className="absolute right-5 top-5 rounded-full border border-white/20 bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/75 backdrop-blur-sm">Acto 0{index + 1}</span>
                      <p className="absolute bottom-4 left-5 right-5 text-[9px] uppercase tracking-[0.14em] text-white/45">{artist.imageNote}</p>
                    </div>
                    <div className="p-6">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F4C48B]">{artist.style}</p>
                      <h3 className="mt-2 text-3xl serif-title md:text-4xl">{artist.name}</h3>
                      <p className="mt-4 text-sm leading-relaxed text-white/60">{artist.bio}</p>
                      {'sourceUrl' in artist && artist.sourceUrl && (
                        <a href={artist.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex text-[10px] font-bold uppercase tracking-[0.14em] text-white/50 underline decoration-[#EF5A2F] underline-offset-4">Referencia pública</a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-5 text-center text-sm text-white/55">La programación horaria completa se publicará en las redes de Pueblo Mágico.</div>
          </div>
        </section>

        <section id="equipo" className="relative overflow-hidden bg-[#FCF8EF] px-6 py-20 md:px-10 md:py-28">
          <TopographicLines className="pointer-events-none absolute -left-28 top-0 h-72 w-[36rem] text-[#7C596E]/12" />
          <div className="mx-auto max-w-7xl">
            <div className="mb-14 text-center" data-reveal>
              <p className="mb-5 inline-block rounded-full bg-[#482A3C] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.4em] text-white">Quiénes te acompañan</p>
              <h2 className="text-3xl leading-tight text-[#211B20] serif-title md:text-4xl">Facilitadores, anfitriones y dirección musical</h2>
              <p className="mx-auto mt-4 max-w-lg text-base text-[#211B20]/60">Un equipo y una comunidad de referentes que suman su energía a esta celebración.</p>
            </div>
            <div className="mb-5 flex items-center justify-between gap-4">
              <p className="text-xs leading-relaxed text-[#1F2922]/55 md:text-sm">Deslizá o usá las flechas para conocer al equipo.</p>
              <RailControls
                label="Controles del equipo"
                canGoBack={teamRail.canGoBack}
                canGoForward={teamRail.canGoForward}
                onBack={() => teamRail.scroll(-1)}
                onForward={() => teamRail.scroll(1)}
              />
            </div>
            <div ref={teamRail.ref} className="scrollbar-hide -mx-6 touch-pan-x touch-pan-y snap-x snap-proximity scroll-px-6 overflow-x-auto overflow-y-hidden overscroll-x-contain px-6 pb-4 md:-mx-10 md:scroll-px-10 md:px-10" aria-label="Equipo de AtardeSer">
              <div className="flex items-stretch gap-5">
                {FESTIVAL_OCTUBRE.team.map((member, index) => (
                  <div key={member.fullName} data-rail-item className="w-[calc(100vw-3rem)] max-w-[320px] shrink-0 snap-start">
                    <TeamCard member={member} index={index} />
                  </div>
                ))}
              </div>
            </div>
            <div className="relative mt-16 overflow-hidden rounded-3xl bg-[#482A3C] p-8 text-center text-white md:p-12" data-reveal data-delay="2">
              <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#EF5A2F]/30 blur-[100px]" />
              <OrganicWave className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full text-[#F4C48B]/16" />
              <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#F4C48B]">Una coproducción de</p>
              <h3 className="mt-3 text-3xl serif-title md:text-4xl">Kintu × Pueblo Mágico</h3>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/65">Dos equipos que se encuentran para cuidar la producción, la hospitalidad y el sentido de una celebración creada en conexión con el lugar.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="fin-de-semana" className="relative overflow-hidden px-6 py-20 md:px-10 md:py-28" style={{ background: 'linear-gradient(145deg, #F5F0E6 0%, #F7DED2 52%, #E8C28E 145%)' }}>
          <div className="pointer-events-none absolute -left-20 top-24 h-64 w-64 rounded-full bg-[#EF5A2F]/12 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-16 bottom-8 h-72 w-72 rounded-full bg-[#7C596E]/16 blur-3xl" aria-hidden="true" />
          <SunRings className="pointer-events-none absolute -right-32 top-10 h-[28rem] w-[28rem] text-[#C35D3C]/12" />
          <div className="relative mx-auto max-w-7xl">
            <div className="mx-auto mb-14 max-w-3xl text-center" data-reveal>
              <Eyebrow>Elegí tu propio ritmo</Eyebrow>
              <h2 className="text-4xl leading-tight serif-title md:text-6xl">Un día de festival. Un fin de semana para quedarse.</h2>
              <p className="mt-5 text-sm leading-relaxed text-[#1F2922]/60 md:text-base">Podés venir solo por la jornada central o hacer del encuentro un fin de semana completo.</p>
            </div>
            <div className="relative grid gap-5 lg:grid-cols-3">
              <div className="absolute left-[16.6%] right-[16.6%] top-12 hidden h-px bg-[#123B2D]/15 lg:block" />
              {weekend.map(({ day, date, title, description, Icon, featured }, index) => (
                <article key={date} className={`relative overflow-hidden rounded-[1.75rem] border p-7 md:p-8 ${featured ? 'border-[#EF5A2F] bg-[#482A3C] text-white shadow-xl' : index === 0 ? 'border-[#656853]/25 bg-[#E7E5D8]' : 'border-[#D59048]/30 bg-[#F8E9CA]'}`} data-reveal data-delay={String(index + 1)}>
                  <div className={`absolute inset-x-0 top-0 h-1.5 ${featured ? 'bg-[linear-gradient(90deg,#EF5A2F,#F0B25D)]' : index === 0 ? 'bg-[#656853]' : 'bg-[#D59048]'}`} aria-hidden="true" />
                  <div className={`relative z-10 mb-10 flex h-12 w-12 items-center justify-center rounded-full ${featured ? 'bg-[#F0B25D] text-[#482A3C]' : 'bg-[#482A3C] text-white'}`}><Icon size={21} aria-hidden="true" /></div>
                  <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${featured ? 'text-[#F4C48B]' : 'text-[#C35D3C]'}`}>{day} · {date}</p>
                  <h3 className="mt-3 text-3xl serif-title">{title}</h3>
                  <p className={`mt-4 text-sm leading-relaxed ${featured ? 'text-white/75' : 'text-[#1F2922]/60'}`}>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="entradas" className="relative overflow-hidden bg-[#FCF8EF] px-6 py-20 md:px-10 md:py-28">
          <SunRings className="pointer-events-none absolute -left-40 -top-36 h-[32rem] w-[32rem] text-[#EF5A2F]/11" />
          <TopographicLines className="pointer-events-none absolute -bottom-12 -right-20 h-72 w-[36rem] text-[#7C596E]/12" />
          <div className="relative mx-auto max-w-7xl">
            <div className="mx-auto mb-10 max-w-3xl text-center md:mb-12" data-reveal>
              <Eyebrow>Modalidades de acceso</Eyebrow>
              <h2 className="text-4xl serif-title md:text-6xl">Elegí cómo sumarte.</h2>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-[#1F2922]/60">Vení por el día o elegí una o dos noches en camping o habitación compartida. Todos los tickets con alojamiento incluyen desayuno.</p>
              <p className="mt-4 text-sm font-bold text-[#C35D3C]">✨ pagá en 3 cuotas sin interés</p>
            </div>
            <div className="mb-5 flex items-center justify-between gap-4">
              <p className="max-w-lg text-xs leading-relaxed text-[#1F2922]/55 md:text-sm">
                <span className="md:hidden">Deslizá para comparar las cinco opciones.</span>
                <span className="hidden md:inline">Cinco opciones para comparar con calma: pase por el día, camping o habitación compartida.</span>
              </p>
              <RailControls
                label="Controles de modalidades"
                canGoBack={accessRail.canGoBack}
                canGoForward={accessRail.canGoForward}
                onBack={() => accessRail.scroll(-1)}
                onForward={() => accessRail.scroll(1)}
              />
            </div>
            <div ref={accessRail.ref} id="festival-access-options" className="scrollbar-hide -mx-6 touch-pan-x touch-pan-y snap-x snap-proximity scroll-px-6 overflow-x-auto overflow-y-hidden overscroll-x-contain px-6 pb-5 md:-mx-10 md:scroll-px-10 md:px-10" aria-label="Modalidades de acceso">
              <div className="flex items-stretch gap-5">
                {FESTIVAL_OCTUBRE.accessOptions.map((option, index) => (
                  <div key={option.title} data-rail-item data-featured-option={option.featured ? 'true' : undefined} className="w-[calc(100vw-3rem)] max-w-[350px] shrink-0 snap-center md:w-[320px] md:snap-start lg:w-[330px] xl:w-[340px]">
                    <AccessCard option={option} index={index} />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-[#123B2D]/15 bg-[#123B2D]/[0.04] p-5 text-center text-sm leading-relaxed text-[#1F2922]/60"><Sparkles size={15} className="mr-2 inline text-[#B85A3D]" aria-hidden="true" />{FESTIVAL_OCTUBRE.pricingNote}</div>
          </div>
        </section>

        <section id="lugar" className="relative overflow-hidden bg-[#F5F0E6] px-6 py-20 md:px-10 md:py-28">
          <TopographicLines className="pointer-events-none absolute -left-20 bottom-0 h-72 w-[36rem] text-[#656853]/14" />
          <div className="mx-auto max-w-6xl text-center">
            <div className="mx-auto max-w-3xl" data-reveal>
              <Eyebrow>El lugar</Eyebrow>
              <h2 className="text-4xl leading-tight serif-title md:text-6xl">Pueblo Mágico,<br />Los Gigantes.</h2>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#1F2922]/70 md:text-lg">Un ecolodge de montaña en las Sierras Grandes de Córdoba. Un espacio que ya respira lo que propone AtardeSer: naturaleza, comunidad y presencia.</p>
              <ul className="mx-auto mt-8 grid max-w-2xl gap-3 text-left text-sm text-[#1F2922]/65 sm:grid-cols-2">
                {['A 90 km de Córdoba Capital', '200 hectáreas de reserva natural', 'Río, senderos y espacios abiertos', 'Alojamiento, camping y fogón'].map(item => (
                  <li key={item} className="flex items-start gap-3"><Check size={16} className="mt-0.5 shrink-0 text-[#B85A3D]" aria-hidden="true" />{item}</li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#123B2D]/15 px-4 py-2 text-xs text-[#123B2D]"><MapPin size={15} aria-hidden="true" />Los Gigantes, Córdoba</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#123B2D]/15 px-4 py-2 text-xs text-[#123B2D]"><Leaf size={15} aria-hidden="true" />Entorno natural serrano</span>
              </div>
              <div className="mt-8"><FestivalButton href="/">Conocer Pueblo Mágico</FestivalButton></div>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-3" data-reveal data-delay="1">
              <img src={img(FESTIVAL_OCTUBRE.images.place, 1200)} alt="Vista aérea de Pueblo Mágico en Los Gigantes" loading="lazy" width="1200" height="900" className="col-span-2 aspect-[16/10] w-full rounded-[2rem] object-cover" />
              <img src={img('/uploads/atardeser/familias.jpeg', 700)} alt="Familias compartiendo en Pueblo Mágico" loading="lazy" width="700" height="800" className="aspect-square w-full rounded-[1.5rem] object-cover" />
              <img src={img('/uploads/atardeser/ninez.jpeg', 700)} alt="Niños y adultos celebrando al aire libre" loading="lazy" width="700" height="800" className="aspect-square w-full rounded-[1.5rem] object-cover" />
            </div>
          </div>
        </section>

        <section id="temazcal" className="relative overflow-hidden bg-[#1B1520] px-6 py-20 text-white md:px-10 md:py-28">
          <SunRings className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] text-[#EF5A2F]/18" />
          <div className="mx-auto max-w-5xl text-center">
            <div data-reveal>
              <p className="mb-5 inline-block rounded-full bg-[#C35D3C] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white">Ceremonia del domingo · Cupo limitado</p>
              <h2 className="text-4xl leading-tight text-[#FFF8EA] serif-title md:text-5xl">¿Qué es el Temazcal?</h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/65 md:text-lg">Una ceremonia ancestral de calor, vapor y encuentro que invita a hacer una pausa, escuchar el cuerpo e integrar lo vivido durante el fin de semana.</p>
            </div>
            <div className="mt-12 overflow-hidden rounded-[2rem] border border-[#F4C48B]/20 bg-[#2A1D2A]" data-reveal data-delay="1">
              <img src={img('/uploads/temazcal.webp', 1400)} alt="Ceremonia de Temazcal en Pueblo Mágico" loading="lazy" width="1400" height="900" className="aspect-[16/8] w-full object-cover" />
              <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
                <p className="text-sm leading-relaxed text-white/65">La participación es opcional, requiere inscripción previa y tiene un valor adicional. Si estás embarazada o tenés una condición cardíaca, respiratoria o de presión, consultanos antes para evaluar si esta experiencia es adecuada para vos.</p>
                <a href={FESTIVAL_OCTUBRE.contact.general} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#F4C48B]/35 px-5 py-2.5 text-sm font-semibold text-[#F4C48B] transition hover:bg-[#EF5A2F] hover:text-white"><MessageCircle size={16} aria-hidden="true" />Consultar por WhatsApp</a>
              </div>
            </div>
          </div>
        </section>

        <section id="preguntas" className="px-6 py-20 md:px-10 md:py-28" style={{ backgroundColor: C.cream }}>
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 text-center" data-reveal>
              <p className="mb-5 inline-block rounded-full bg-[#482A3C] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white">Preguntas frecuentes</p>
              <h2 className="text-4xl leading-tight serif-title md:text-6xl">Todo lo que necesitás saber.</h2>
              <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-[#1F2922]/60 md:text-base">¿Quedó alguna duda? Escribinos por WhatsApp y te ayudamos a elegir la mejor forma de vivir AtardeSer.</p>
            </div>
            <div className="space-y-3 md:space-y-4" data-reveal data-delay="1">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                const Icon = faq.Icon;
                return (
                  <div key={faq.question} className={`overflow-hidden rounded-2xl border bg-white transition ${isOpen ? 'border-[#EF5A2F] shadow-sm' : 'border-[#482A3C]/10'}`}>
                    <button type="button" className="flex w-full items-center gap-4 px-6 py-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EF5A2F] md:px-8 md:py-6" onClick={() => setOpenFaq(isOpen ? null : index)} aria-expanded={isOpen} aria-controls={`festival-faq-${index}`}>
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${isOpen ? 'bg-[#482A3C] text-[#F4C48B]' : 'bg-[#7C596E]/[0.09] text-[#7C596E]'}`}><Icon size={18} strokeWidth={1.8} aria-hidden="true" /></span>
                      <span className={`flex-1 text-sm font-bold leading-snug md:text-base ${isOpen ? 'text-[#482A3C]' : 'text-[#211B20]'}`}>{faq.question}</span>
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform ${isOpen ? 'rotate-180 bg-[#EF5A2F] text-white' : 'bg-[#482A3C]/[0.06] text-[#482A3C]'}`}><ChevronDown size={16} aria-hidden="true" /></span>
                    </button>
                    <div id={`festival-faq-${index}`} className={`grid transition-[grid-template-rows] duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className="min-h-0 overflow-hidden"><div className="px-6 pb-6 md:pl-[5rem] md:pr-8"><div className="mb-4 h-px w-full bg-[#123B2D]/10" /><p className="text-sm leading-relaxed text-[#1F2922]/65">{faq.answer}</p></div></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-10 text-center" data-reveal data-delay="2">
              <a href={FESTIVAL_OCTUBRE.contact.general} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#482A3C]/25 px-5 py-2.5 text-sm font-semibold text-[#482A3C] transition hover:bg-[#482A3C] hover:text-white"><MessageCircle size={17} aria-hidden="true" />Escribirnos</a>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#482A3C] px-6 py-20 text-white md:px-10 md:py-28">
          <img src={img('/uploads/atardeser/comunidad.jpeg', 1900)} alt="" loading="lazy" width="1900" height="1100" className="absolute inset-0 h-full w-full object-cover object-center" aria-hidden="true" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(115deg, rgba(27,21,32,0.97) 0%, rgba(72,42,60,0.88) 52%, rgba(195,93,60,0.82) 100%)' }} />
          <div className="pointer-events-none absolute -left-16 bottom-[-4rem] h-64 w-64 rounded-full bg-[#EF5A2F]/40 blur-3xl" aria-hidden="true" />
          <SunRings className="pointer-events-none absolute -right-28 -top-28 h-[30rem] w-[30rem] text-[#F4C48B]/20" />
          <OrganicWave className="pointer-events-none absolute inset-x-0 bottom-0 h-32 w-full text-[#F4C48B]/18" />
          <div className="relative mx-auto max-w-5xl text-center" data-reveal>
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#EF5A2F] text-white"><Waves size={24} aria-hidden="true" /></div>
            <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.32em] text-[#F4C48B]">Música · Naturaleza · Encuentro</p>
            <h2 className="text-4xl leading-tight text-[#FFF8EA] serif-title md:text-7xl">Sé parte del ritual.<br />Celebrá en la montaña.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/75">Música, naturaleza y buena compañía. Vení por el día, quedate a vivir el finde y elegí tu propia manera de ser parte.</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <FestivalButton href={FESTIVAL_OCTUBRE.contact.general}>Consultar por WhatsApp</FestivalButton>
              <a href={FESTIVAL_OCTUBRE.contact.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/35 px-6 py-3 text-xs font-bold uppercase tracking-[0.13em] transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><Instagram size={16} aria-hidden="true" />Seguir novedades</a>
            </div>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 text-xs text-white/55 sm:flex-row sm:gap-6">
              <span className="inline-flex items-center gap-2"><CalendarDays size={14} aria-hidden="true" />{FESTIVAL_OCTUBRE.dateLabel}</span>
              <span className="inline-flex items-center gap-2"><MapPin size={14} aria-hidden="true" />{FESTIVAL_OCTUBRE.location}</span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FestivalOctubre;
