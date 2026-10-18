import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flame,
  Instagram,
  Leaf,
  MapPin,
  MessageCircle,
  Moon,
  Music2,
  Sparkles,
  Sun,
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
  pine: '#123B2D',
  night: '#111914',
  moss: '#49634A',
  sun: '#E7B84B',
  clay: '#B85A3D',
  cream: '#F5F0E5',
  paper: '#FCFAF5',
  ink: '#1F2922',
};

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
    question: '¿Puedo asistir solamente el sábado?',
    answer: 'Sí. El Pase por el Día permite vivir toda la jornada central del sábado 31. También podés sumar una o dos noches, en camping o habitación compartida.',
  },
  {
    question: '¿Qué incluye la entrada general?',
    answer: 'El Pase por el Día cuesta AR$ 35.000 por persona e incluye la jornada central del sábado, los cuatro artistas, el fogón y las propuestas abiertas. No incluye comidas, bebidas, estacionamiento, alojamiento ni experiencias con inscripción propia.',
  },
  {
    question: '¿La comida está incluida?',
    answer: 'Los tickets con alojamiento incluyen desayuno. Durante todo el fin de semana habrá un buffet de comida artesanal para distintos momentos del día y gustos, además de barra de bebidas. El resto de las comidas y bebidas se abona por separado.',
  },
  {
    question: '¿Qué opciones de alojamiento hay?',
    answer: 'Podés elegir camping con tu propia carpa o una cama en habitación compartida con ropa blanca. Hay opciones de una o dos noches y todas incluyen desayuno. Los cupos se confirman al reservar.',
  },
  {
    question: '¿Puedo ir sin experiencia previa en yoga o meditación?',
    answer: 'Sí. No necesitás experiencia previa. Podés elegir libremente a qué propuestas sumarte.',
  },
  {
    question: '¿Puedo asistir solo o sola?',
    answer: 'Sí. La propuesta está pensada para encontrarse, compartir y conocer gente, tanto si venís por tu cuenta como en grupo.',
  },
  {
    question: '¿Puedo venir con niños o niñas?',
    answer: 'Sí. AtardeSer es un encuentro apto para toda la familia: niños y niñas son bienvenidos. Es importante que permanezcan acompañados por una persona adulta responsable.',
  },
  {
    question: '¿Cómo funciona el temazcal del domingo?',
    answer: 'El temazcal forma parte de la propuesta del domingo y tiene cupo limitado, inscripción previa y un valor adicional. Consultanos para reservar tu lugar.',
  },
  {
    question: '¿Dónde queda Pueblo Mágico?',
    answer: 'En Los Gigantes, Sierras de Córdoba, Argentina. Consultanos por WhatsApp para recibir la ubicación y la información vigente para llegar.',
  },
  {
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
  <p className={`mb-4 text-[11px] font-bold uppercase tracking-[0.28em] ${light ? 'text-white/60' : 'text-[#B85A3D]'}`}>
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
        ? 'border border-white/45 bg-black/20 text-white backdrop-blur-sm hover:bg-white/10 focus-visible:outline-white'
        : 'bg-[#E7B84B] text-[#123B2D] shadow-[0_12px_35px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 hover:bg-[#F0C75D] focus-visible:outline-[#E7B84B]'
    }`}
  >
    {children}
    <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
  </a>
);

const TeamCard = ({ member, index }: { member: FestivalTeamMember; index: number }) => (
  <article className="h-full rounded-2xl border border-[#123B2D]/10 bg-[#123B2D]/[0.02] p-7" data-reveal data-delay={String((index % 3) + 1)}>
    <div className="mb-5 h-14 w-14 overflow-hidden rounded-full bg-[#123B2D]/10">
      <img
        src={img(member.image, 800)}
        alt={member.fullName}
        loading="lazy"
        width="160"
        height="160"
        className="h-full w-full object-cover"
      />
    </div>
    <p className="text-base font-bold text-[#1F2922]">{member.name}</p>
    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#123B2D]">{member.role}</p>
    <p className="mt-3 text-sm leading-relaxed text-[#1F2922]/65">{member.description}</p>
    {'instagram' in member && member.instagram && (
      <a href={member.instagram} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#123B2D] underline decoration-[#E7B84B] decoration-2 underline-offset-4">
        <Instagram size={14} aria-hidden="true" /> Instagram
      </a>
    )}
  </article>
);

const AccessCard = ({ option, index }: { option: FestivalAccessOption; index: number }) => (
  <article className={`relative flex h-full min-w-0 flex-col overflow-hidden rounded-[1.75rem] border p-6 md:p-7 ${option.featured ? 'border-[#123B2D] bg-[#123B2D] text-white shadow-xl' : 'border-[#123B2D]/15 bg-[#F5F0E5]'}`} data-reveal data-delay={String((index % 3) + 1)}>
    <div className="mb-4 flex h-7 items-center justify-center">
      {option.featured && <span className="rounded-full bg-[#E7B84B] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#123B2D]">Equilibrio ideal</span>}
    </div>
    <p className={`text-center text-[10px] font-bold uppercase tracking-[0.2em] ${option.featured ? 'text-[#E7B84B]' : 'text-[#B85A3D]'}`}>{option.eyebrow}</p>
    <h3 className="mt-3 text-center text-3xl leading-[1.05] serif-title md:min-h-[5rem]">{option.title}</h3>
    <p className={`mt-4 text-center text-sm leading-relaxed md:min-h-[5rem] ${option.featured ? 'text-white/70' : 'text-[#1F2922]/65'}`}>{option.description}</p>
    <div className={`my-6 border-y py-6 text-center ${option.featured ? 'border-white/10' : 'border-[#123B2D]/10'}`}>
      <p className={`mx-auto mb-4 inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold whitespace-nowrap ${option.featured ? 'bg-white/10 text-[#E7B84B]' : 'bg-[#DDF3EA] text-[#005333]'}`}>💳 {option.installments}</p>
      <p className="text-4xl serif-title">{option.price}</p>
      <p className={`mt-2 text-[10px] font-bold uppercase tracking-[0.12em] ${option.featured ? 'text-white/50' : 'text-[#1F2922]/50'}`}>por persona · transferencia · 20% off</p>
    </div>
    <p className={`mb-4 text-center text-[10px] font-bold uppercase tracking-[0.18em] ${option.featured ? 'text-[#E7B84B]' : 'text-[#B85A3D]'}`}>Incluye</p>
    <ul className="mb-6 space-y-3">
      {option.includes.map(item => <li key={item} className={`flex gap-2.5 text-sm leading-relaxed ${option.featured ? 'text-white/80' : 'text-[#1F2922]/75'}`}><Check size={16} className="mt-0.5 shrink-0 text-[#E7B84B]" aria-hidden="true" />{item}</li>)}
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
    ? 'border-white/20 bg-white/[0.06] text-white hover:border-white/45 hover:bg-white/15 disabled:border-white/10 disabled:text-white/25'
    : 'border-[#123B2D]/20 bg-white text-[#123B2D] hover:border-[#123B2D] hover:bg-[#123B2D] hover:text-white disabled:border-[#123B2D]/10 disabled:bg-white/50 disabled:text-[#123B2D]/25';

  return (
    <div className="flex shrink-0 items-center gap-2" aria-label={label}>
      <button
        type="button"
        onClick={onBack}
        disabled={!canGoBack}
        aria-label="Ver tarjeta anterior"
        className={`flex h-10 w-10 items-center justify-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E7B84B] disabled:cursor-default ${buttonClassName}`}
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onForward}
        disabled={!canGoForward}
        aria-label="Ver tarjeta siguiente"
        className={`flex h-10 w-10 items-center justify-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E7B84B] disabled:cursor-default ${buttonClassName}`}
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
        <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-[#111914]">
          <picture className="absolute inset-0">
            <source media="(max-width: 640px)" srcSet={img(FESTIVAL_OCTUBRE.images.heroMobile, 1000)} />
            <img
              src={img(FESTIVAL_OCTUBRE.images.heroDesktop, 1900)}
              alt="Atardecer compartido en las sierras de Pueblo Mágico"
              width="1900"
              height="1200"
              className="h-full w-full object-cover object-center max-sm:object-[57%_center]"
            />
          </picture>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(10,20,14,0.56)_0%,rgba(10,20,14,0.82)_62%,rgba(10,20,14,0.94)_100%)] max-md:bg-[linear-gradient(to_top,rgba(10,20,14,0.97)_0%,rgba(10,20,14,0.78)_58%,rgba(10,20,14,0.5)_100%)]" />
          <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(to_bottom,rgba(10,20,14,0.7),transparent)]" />

          <div className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-16 pt-20 text-center md:px-10 md:pb-20 md:pt-20">
              <div className="mx-auto max-w-4xl">
              <div className="mb-6 flex flex-wrap justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/80">
                <span className="rounded-full border border-white/25 bg-black/15 px-4 py-2 backdrop-blur-sm">Sábado 31 de octubre de 2026</span>
                <span className="rounded-full border border-white/25 bg-black/15 px-4 py-2 backdrop-blur-sm">Los Gigantes · Córdoba</span>
              </div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.32em] text-[#E7B84B]">{FESTIVAL_OCTUBRE.nameStatus}</p>
              <h1 className="text-6xl leading-[0.9] text-white serif-title sm:text-7xl md:text-8xl lg:text-9xl">Atarde<span className="text-[#E7B84B]">Ser</span></h1>
              <p className="mx-auto mt-7 max-w-3xl text-base leading-relaxed text-white/75 md:text-lg">
                Un día para encontrarnos, celebrar y conectar con el pulso natural. Live sets y música en vivo con DJs invitados, naturaleza y experiencias para compartir en el corazón de la montaña. Vení por el día o quedate a vivir el finde completo.
              </p>
              <div className="mt-7 flex justify-center"><Countdown /></div>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <FestivalButton href={FESTIVAL_OCTUBRE.contact.general}>Quiero sumarme</FestivalButton>
                <FestivalButton href="#propuesta" secondary>Conocer la propuesta</FestivalButton>
              </div>
              <div className="mt-8 flex items-center justify-center gap-3 text-xs text-white/55">
                <Clock3 size={15} aria-hidden="true" />
                <span>Preventa abierta · cupos de alojamiento limitados</span>
              </div>
              </div>
          </div>
          <a href="#propuesta" aria-label="Ir a la propuesta" className="absolute bottom-8 right-6 z-10 hidden h-12 w-12 items-center justify-center rounded-full border border-white/25 text-white/70 transition hover:bg-white/10 md:flex">
            <ArrowDown size={18} aria-hidden="true" />
          </a>
        </section>

        <section id="propuesta" className="bg-[#0B1B12] px-6 py-20 text-white md:px-10 md:py-28">
          <div className="mx-auto max-w-5xl">
            <div className="text-center" data-reveal>
              <div className="mb-7 flex items-center justify-center gap-3">
                {[{ Icon: Music2, color: '#B85A3D' }, { Icon: Flame, color: '#E7B84B' }, { Icon: Sun, color: '#D6B52C' }].map(({ Icon, color }, index) => (
                  <span key={index} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
                    <Icon size={17} color={color} aria-hidden="true" />
                  </span>
                ))}
              </div>
              <h2 className="mx-auto max-w-3xl text-4xl leading-[1.05] serif-title md:text-6xl">
                La música nos reúne.<br />
                La naturaleza cambia el ritmo.<br />
                <span className="text-[#E7B84B]">Volvemos a encontrarnos.</span>
              </h2>
              <p className="mx-auto mt-7 max-w-2xl text-sm leading-relaxed text-white/55 md:text-base">
                AtardeSer es una celebración para bailar, respirar la montaña y compartir sin apuro. Un encuentro abierto para venir por el día o quedarse a vivir el fin de semana completo.
              </p>
            </div>

            <div className="mt-14 grid gap-4 md:grid-cols-3" data-reveal data-delay="1">
              {[
                { Icon: Music2, title: 'Música que mueve', text: 'Cuatro artistas acompañan un viaje sonoro desde el movimiento del día hasta el fuego de la noche.' },
                { Icon: Leaf, title: 'Naturaleza viva', text: 'Río, senderos y montaña forman parte de la experiencia y nos invitan a cambiar de ritmo.' },
                { Icon: Flame, title: 'Encuentro real', text: 'Fogón, comida artesanal y espacios para celebrar, conversar y conocer gente nueva.' },
              ].map(({ Icon, title, text }) => (
                <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.035] px-7 py-8 text-center">
                  <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#E7B84B]/10 text-[#E7B84B]">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-sm font-bold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/50">{text}</p>
                </article>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap justify-center gap-2.5" data-reveal data-delay="2">
              {['Abierto a toda la familia', 'Vení por el día', 'Quedate el finde', 'Buffet y barra disponibles'].map(item => (
                <span key={item} className="rounded-full border border-[#E7B84B]/30 bg-[#E7B84B]/[0.04] px-4 py-2 text-[10px] font-semibold tracking-wide text-white/65">{item}</span>
              ))}
            </div>
          </div>
        </section>

        <section id="para-quien" className="bg-white px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto max-w-5xl">
            <div className="mb-14 text-center" data-reveal>
              <p className="mb-5 inline-block rounded-full bg-[#123B2D] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white">¿Para quién es?</p>
              <h2 className="text-4xl leading-tight text-[#123B2D] serif-title md:text-5xl">Para quienes quieren celebrar distinto.<br />Y encontrarse de verdad.</h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#1F2922]/60">No necesitás experiencia previa ni venir con un grupo. AtardeSer está pensado para disfrutar la música, la naturaleza y el encuentro a tu propio ritmo.</p>
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
                <article key={title} className={`rounded-2xl border p-8 text-left ${tone === 'green' ? 'border-[#123B2D]/15 bg-[#123B2D]/[0.03]' : 'border-[#E7B84B]/35 bg-[#E7B84B]/[0.06]'}`}>
                  <span className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full ${tone === 'green' ? 'bg-[#123B2D]/10 text-[#123B2D]' : 'bg-[#E7B84B]/20 text-[#8B6A00]'}`}><Icon size={19} aria-hidden="true" /></span>
                  <h3 className="mt-5 text-center text-xl font-bold text-[#123B2D]">{title}</h3>
                  <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-[#1F2922]/60">{text}</p>
                  <ul className="mx-auto mt-6 max-w-md space-y-2.5">
                    {items.map(item => <li key={item} className="flex items-start gap-2.5 text-sm text-[#1F2922]/65"><span className="mt-1 shrink-0 text-[#B85A3D]">◆</span>{item}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="experiencias" className="bg-[#F7F5F0] px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto max-w-5xl">
            <div className="mb-14 text-center" data-reveal>
              <Eyebrow>Qué vas a encontrar</Eyebrow>
              <h2 className="text-4xl leading-tight serif-title md:text-5xl">Cada propuesta es una puerta.<br /><span className="text-[#123B2D]">Vos elegís cómo transitarla.</span></h2>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-[#1F2922]/60 md:text-base">Nada es obligatorio: son invitaciones abiertas para armar tu propia experiencia, en el momento y con la intensidad que quieras.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2" data-reveal data-delay="1">
              {[
                { Icon: Music2, color: '#005333', bg: 'bg-[#005333]/[0.05]', border: 'border-[#005333]/15', title: 'Música & movimiento', items: ['Cuatro DJs y live sets confirmados', 'Baile libre y movimiento', 'Música en vivo junto al paisaje', 'Un viaje sonoro del día al fuego de la noche'] },
                { Icon: Leaf, color: '#49634A', bg: 'bg-[#49634A]/[0.06]', border: 'border-[#49634A]/20', title: 'Naturaleza & exploración', items: ['Río y senderos de montaña', 'Caminatas y espacios de descanso', 'Yoga y conexión con el cuerpo', 'Tiempo libre para habitar el lugar'] },
                { Icon: Flame, color: '#B85A3D', bg: 'bg-[#B85A3D]/[0.07]', border: 'border-[#B85A3D]/20', title: 'Ritual & integración', items: ['Fogón y círculos para compartir', 'Conversaciones significativas y auténticas', 'Temazcal opcional el domingo', 'Espacios para bajar el ritmo e integrar'] },
                { Icon: Sun, color: '#8B6A00', bg: 'bg-[#E7B84B]/[0.08]', border: 'border-[#E7B84B]/35', title: 'Gastronomía & comunidad', items: ['Buffet de comida artesanal todo el fin de semana', 'Barra de bebidas', 'Encuentro abierto a toda la familia', 'Opciones para venir por el día o quedarse'] },
              ].map(({ Icon, color, bg, border, title, items }) => (
                <article key={title} className={`rounded-2xl border p-7 text-left ${bg} ${border}`}>
                  <div className="mb-5 flex items-center justify-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/60" style={{ color }}><Icon size={18} aria-hidden="true" /></span>
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

        <section id="artistas" className="overflow-hidden bg-[#111914] px-6 py-20 text-white md:px-10 md:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-12 max-w-3xl text-center" data-reveal>
              <Eyebrow light>Artistas confirmados</Eyebrow>
              <h2 className="text-4xl leading-tight serif-title md:text-6xl">La música que nos reúne.</h2>
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
                  <article key={artist.name} data-rail-item className="group w-[calc(100vw-3rem)] max-w-[340px] shrink-0 snap-start overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#173528]" data-reveal data-delay={String(index + 1)}>
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <img src={img(artist.image, 900)} alt={artist.imageAlt} loading="lazy" width="900" height="1125" className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-[1.04]" />
                      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(17,25,20,0.88),transparent_65%)]" />
                      <span className="absolute right-5 top-5 rounded-full border border-white/20 bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/75 backdrop-blur-sm">Acto 0{index + 1}</span>
                      <p className="absolute bottom-4 left-5 right-5 text-[9px] uppercase tracking-[0.14em] text-white/45">{artist.imageNote}</p>
                    </div>
                    <div className="p-6">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E7B84B]">{artist.style}</p>
                      <h3 className="mt-2 text-3xl serif-title md:text-4xl">{artist.name}</h3>
                      <p className="mt-4 text-sm leading-relaxed text-white/60">{artist.bio}</p>
                      {'sourceUrl' in artist && artist.sourceUrl && (
                        <a href={artist.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex text-[10px] font-bold uppercase tracking-[0.14em] text-white/50 underline decoration-[#E7B84B] underline-offset-4">Referencia pública</a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-5 text-center text-sm text-white/55">La programación horaria completa se publicará en las redes de Pueblo Mágico.</div>
          </div>
        </section>

        <section id="equipo" className="bg-white px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mb-14 text-center" data-reveal>
              <p className="mb-5 inline-block rounded-full bg-[#123B2D] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.4em] text-white">Quiénes te acompañan</p>
              <h2 className="text-3xl leading-tight text-[#123B2D] serif-title md:text-4xl">Facilitadores, anfitriones y dirección musical</h2>
              <p className="mx-auto mt-4 max-w-lg text-base text-[#1F2922]/60">Un equipo y una comunidad de referentes que suman su energía a esta celebración.</p>
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
            <div className="relative mt-16 overflow-hidden rounded-3xl bg-[#123B2D] p-8 text-center text-white md:p-12" data-reveal data-delay="2">
              <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#E7B84B]/25 blur-[100px]" />
              <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#E7B84B]">Una coproducción de</p>
              <h3 className="mt-3 text-3xl serif-title md:text-4xl">Kintu × Pueblo Mágico</h3>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/65">Dos equipos que se encuentran para cuidar la producción, la hospitalidad y el sentido de una celebración creada en conexión con el lugar.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="fin-de-semana" className="px-6 py-20 md:px-10 md:py-28" style={{ backgroundColor: C.cream }}>
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-14 max-w-3xl text-center" data-reveal>
              <Eyebrow>Elegí tu propio ritmo</Eyebrow>
              <h2 className="text-4xl leading-tight serif-title md:text-6xl">Un día de festival. Un fin de semana para quedarse.</h2>
              <p className="mt-5 text-sm leading-relaxed text-[#1F2922]/60 md:text-base">Podés venir solo por la jornada central o hacer del encuentro un fin de semana completo.</p>
            </div>
            <div className="relative grid gap-5 lg:grid-cols-3">
              <div className="absolute left-[16.6%] right-[16.6%] top-12 hidden h-px bg-[#123B2D]/15 lg:block" />
              {weekend.map(({ day, date, title, description, Icon, featured }, index) => (
                <article key={date} className={`relative rounded-[1.75rem] border p-7 md:p-8 ${featured ? 'border-[#B85A3D] bg-[#B85A3D] text-white shadow-xl' : 'border-[#123B2D]/10 bg-[#FCFAF5]'}`} data-reveal data-delay={String(index + 1)}>
                  <div className={`relative z-10 mb-10 flex h-12 w-12 items-center justify-center rounded-full ${featured ? 'bg-[#E7B84B] text-[#123B2D]' : 'bg-[#123B2D] text-white'}`}><Icon size={21} aria-hidden="true" /></div>
                  <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${featured ? 'text-white/65' : 'text-[#B85A3D]'}`}>{day} · {date}</p>
                  <h3 className="mt-3 text-3xl serif-title">{title}</h3>
                  <p className={`mt-4 text-sm leading-relaxed ${featured ? 'text-white/75' : 'text-[#1F2922]/60'}`}>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="entradas" className="overflow-hidden bg-[#FCFAF5] px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-10 max-w-3xl text-center md:mb-12" data-reveal>
              <Eyebrow>Modalidades de acceso</Eyebrow>
              <h2 className="text-4xl serif-title md:text-6xl">Elegí cómo sumarte.</h2>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-[#1F2922]/60">Vení por el día o elegí una o dos noches en camping o habitación compartida. Todos los tickets con alojamiento incluyen desayuno.</p>
              <p className="mt-4 text-sm font-bold text-[#8B6A00]">✨ pagá en 3 cuotas sin interés</p>
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

        <section id="lugar" className="bg-[#F5F0E5] px-6 py-20 md:px-10 md:py-28">
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

        <section id="temazcal" className="bg-white px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto max-w-5xl text-center">
            <div data-reveal>
              <p className="mb-5 inline-block rounded-full bg-[#B85A3D] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white">Ceremonia del domingo · Cupo limitado</p>
              <h2 className="text-4xl leading-tight serif-title md:text-5xl">¿Qué es el Temazcal?</h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#1F2922]/65 md:text-lg">Una ceremonia ancestral de calor, vapor y encuentro que invita a hacer una pausa, escuchar el cuerpo e integrar lo vivido durante el fin de semana.</p>
            </div>
            <div className="mt-12 overflow-hidden rounded-[2rem] border border-[#123B2D]/10 bg-[#F5F0E5]" data-reveal data-delay="1">
              <img src={img('/uploads/temazcal.webp', 1400)} alt="Ceremonia de Temazcal en Pueblo Mágico" loading="lazy" width="1400" height="900" className="aspect-[16/8] w-full object-cover" />
              <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
                <p className="text-sm leading-relaxed text-[#1F2922]/65">La participación es opcional, requiere inscripción previa y tiene un valor adicional. Si estás embarazada o tenés una condición cardíaca, respiratoria o de presión, consultanos antes para evaluar si esta experiencia es adecuada para vos.</p>
                <a href={FESTIVAL_OCTUBRE.contact.general} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#123B2D]/25 px-5 py-2.5 text-sm font-semibold text-[#123B2D] transition hover:bg-[#123B2D] hover:text-white"><MessageCircle size={16} aria-hidden="true" />Consultar por WhatsApp</a>
              </div>
            </div>
          </div>
        </section>

        <section id="preguntas" className="px-6 py-20 md:px-10 md:py-28" style={{ backgroundColor: C.cream }}>
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 text-center" data-reveal>
              <p className="mb-5 inline-block rounded-full bg-[#123B2D] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white">Preguntas frecuentes</p>
              <h2 className="text-4xl leading-tight serif-title md:text-6xl">Todo lo que necesitás saber.</h2>
              <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-[#1F2922]/60 md:text-base">¿Quedó alguna duda? Escribinos por WhatsApp y te ayudamos a elegir la mejor forma de vivir AtardeSer.</p>
            </div>
            <div className="space-y-3 md:space-y-4" data-reveal data-delay="1">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={faq.question} className={`overflow-hidden rounded-2xl border bg-white transition ${isOpen ? 'border-[#E7B84B] shadow-sm' : 'border-[#123B2D]/10'}`}>
                    <button type="button" className="flex w-full items-center gap-4 px-6 py-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#123B2D] md:px-8 md:py-6" onClick={() => setOpenFaq(isOpen ? null : index)} aria-expanded={isOpen} aria-controls={`festival-faq-${index}`}>
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isOpen ? 'bg-[#123B2D] text-[#E7B84B]' : 'bg-[#123B2D]/[0.06] text-[#123B2D]/45'}`}>{String(index + 1).padStart(2, '0')}</span>
                      <span className={`flex-1 text-sm font-bold leading-snug md:text-base ${isOpen ? 'text-[#123B2D]' : 'text-[#1F2922]'}`}>{faq.question}</span>
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform ${isOpen ? 'rotate-180 bg-[#123B2D] text-[#E7B84B]' : 'bg-[#123B2D]/[0.06] text-[#123B2D]'}`}><ChevronDown size={16} aria-hidden="true" /></span>
                    </button>
                    <div id={`festival-faq-${index}`} className={`grid transition-[grid-template-rows] duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className="min-h-0 overflow-hidden"><div className="px-6 pb-6 md:pl-[5rem] md:pr-8"><div className="mb-4 h-px w-full bg-[#123B2D]/10" /><p className="text-sm leading-relaxed text-[#1F2922]/65">{faq.answer}</p></div></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-10 text-center" data-reveal data-delay="2">
              <a href={FESTIVAL_OCTUBRE.contact.general} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#123B2D]/25 px-5 py-2.5 text-sm font-semibold text-[#123B2D] transition hover:bg-[#123B2D] hover:text-white"><MessageCircle size={17} aria-hidden="true" />Escribirnos</a>
            </div>
          </div>
        </section>

        <section className="bg-[#B85A3D] px-6 py-20 text-white md:px-10 md:py-28">
          <div className="mx-auto max-w-5xl text-center" data-reveal>
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#E7B84B] text-[#123B2D]"><Waves size={24} aria-hidden="true" /></div>
            <h2 className="text-4xl leading-tight serif-title md:text-7xl">AtardeSer.<br />Celebrá en la montaña.</h2>
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
