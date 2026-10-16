import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
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
  Users,
  Waves,
} from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { PageSectionNav, type PageNavigation } from '../components/PageSectionNav';
import { FESTIVAL_OCTUBRE, type FestivalExperience } from './data/festivalOctubre';
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
    { id: 'experiencias', label: 'Experiencias' },
    { id: 'artistas', label: 'Artistas' },
    { id: 'fin-de-semana', label: 'Fin de semana' },
    { id: 'entradas', label: 'Entradas' },
    { id: 'lugar', label: 'El lugar' },
    { id: 'preguntas', label: 'Preguntas' },
  ],
};

const weekend = [
  {
    day: 'Viernes',
    date: '30 OCT',
    title: 'Llegada y bienvenida',
    description: 'Primeras experiencias para quienes quieran instalarse y empezar a compartir.',
    Icon: Moon,
    featured: false,
  },
  {
    day: 'Sábado',
    date: '31 OCT',
    title: 'El festival',
    description: 'Jornada central con DJs, música en vivo y las actividades programadas.',
    Icon: Sun,
    featured: true,
  },
  {
    day: 'Domingo',
    date: '01 NOV',
    title: 'Naturaleza y cierre',
    description: 'Una jornada más tranquila para quienes extiendan su estadía.',
    Icon: Leaf,
    featured: false,
  },
] as const;

const faqs = [
  {
    question: '¿Puedo asistir solamente el sábado?',
    answer: 'Sí. La modalidad principal es un festival de un día el sábado 31 de octubre. Habrá una entrada general específica para esa jornada.',
  },
  {
    question: '¿Qué incluye la entrada general?',
    answer: 'Dará acceso al festival, a los espacios generales y a las actividades que se confirmen como incluidas. El horario y el detalle final todavía están en definición.',
  },
  {
    question: '¿La comida está incluida?',
    answer: 'No. La entrada general no incluye comidas ni bebidas. Durante el evento habrá propuestas gastronómicas saludables; sus condiciones se informarán más adelante.',
  },
  {
    question: '¿Qué incluye la experiencia premium?',
    answer: 'Será una opción integral de fin de semana que podrá incluir acceso al festival, alojamiento, comidas y experiencias seleccionadas. La composición y el precio finales dependen de disponibilidad y costos operativos.',
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
    question: '¿Puedo quedarme a dormir?',
    answer: 'Está prevista una modalidad de fin de semana con alojamiento. Los tipos de alojamiento, disponibilidad y condiciones se confirmarán próximamente.',
  },
  {
    question: '¿Dónde queda Pueblo Mágico?',
    answer: 'En Los Gigantes, Sierras de Córdoba, Argentina. Consultanos por WhatsApp para recibir la ubicación y la información vigente para llegar.',
  },
  {
    question: '¿Cómo consulto por las entradas?',
    answer: 'Podés escribirnos por WhatsApp desde cualquiera de los botones de consulta. Las entradas todavía no están habilitadas para compra online.',
  },
];

const ticketOptions = [
  {
    eyebrow: 'Sábado 31',
    title: 'Entrada general',
    description: 'Para vivir el festival por el día, con una opción de acceso más simple y accesible.',
    price: 'Precio a definir',
    note: 'Comida y bebidas no incluidas',
    items: [
      'Acceso durante el horario que se informe',
      'Espacios generales y actividades confirmadas como incluidas',
      'Experiencias especiales sujetas a disponibilidad',
    ],
    href: FESTIVAL_OCTUBRE.contact.dayPass,
    cta: 'Consultar entrada general',
    featured: false,
  },
  {
    eyebrow: 'Fin de semana',
    title: 'Experiencia Premium',
    description: 'Una propuesta integral para extender la estadía y disfrutar el encuentro sin apuro.',
    price: 'Precio a definir',
    note: 'Contenido final sujeto a disponibilidad',
    items: ['Acceso al festival', 'Alojamiento', 'Comidas', 'Actividades y experiencias seleccionadas'],
    href: FESTIVAL_OCTUBRE.contact.weekend,
    cta: 'Consultar experiencia premium',
    featured: true,
  },
] as const;

const Eyebrow = ({ children, light = false }: { children: React.ReactNode; light?: boolean }) => (
  <p className={`mb-4 text-[11px] font-bold uppercase tracking-[0.28em] ${light ? 'text-white/60' : 'text-[#B85A3D]'}`}>
    {children}
  </p>
);

const FestivalButton = ({ href, children, secondary = false }: { href: string; children: React.ReactNode; secondary?: boolean }) => (
  <a
    href={href}
    target={href.startsWith('http') ? '_blank' : undefined}
    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
    className={`group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 text-xs font-bold uppercase tracking-[0.13em] transition duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${
      secondary
        ? 'border border-current bg-transparent hover:bg-white/10 focus-visible:outline-white'
        : 'bg-[#E7B84B] text-[#123B2D] shadow-[0_12px_35px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 hover:bg-[#F0C75D] focus-visible:outline-[#E7B84B]'
    }`}
  >
    {children}
    <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
  </a>
);

const ExperienceCard = ({ experience, index }: { experience: FestivalExperience; index: number }) => (
  <article className="group relative min-h-[360px] overflow-hidden rounded-[1.75rem] bg-[#123B2D]" data-reveal data-delay={String((index % 3) + 1)}>
    <img
      src={img(experience.image, 900)}
      alt={experience.alt}
      loading="lazy"
      width="900"
      height="1080"
      className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]"
    />
    <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(9,22,16,0.96)_0%,rgba(9,22,16,0.42)_62%,rgba(9,22,16,0.08)_100%)]" />
    <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
      <span className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-xs font-bold text-white/70">
        {String(index + 1).padStart(2, '0')}
      </span>
      <h3 className="mb-2 text-2xl text-white serif-title">{experience.title}</h3>
      <p className="max-w-sm text-sm leading-relaxed text-white/70">{experience.description}</p>
    </div>
  </article>
);

const FestivalOctubre: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${FESTIVAL_OCTUBRE.tagline} · 31 de octubre · Pueblo Mágico`;

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
    setMeta('meta[property="og:title"]', 'property', 'og:title').content = `${FESTIVAL_OCTUBRE.tagline} · Pueblo Mágico`;
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
      performer: FESTIVAL_OCTUBRE.artists.map(name => ({ '@type': 'Person', name })),
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
        <section className="relative flex min-h-[760px] items-end overflow-hidden bg-[#111914] md:min-h-[820px] md:items-center">
          <picture className="absolute inset-0">
            <source media="(max-width: 640px)" srcSet={img(FESTIVAL_OCTUBRE.images.heroMobile, 1000)} />
            <img
              src={img(FESTIVAL_OCTUBRE.images.heroDesktop, 1900)}
              alt="Encuentro con música y baile al aire libre en las sierras"
              width="1900"
              height="1200"
              className="h-full w-full object-cover object-center"
            />
          </picture>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,20,14,0.94)_0%,rgba(10,20,14,0.68)_48%,rgba(10,20,14,0.18)_100%)] max-md:bg-[linear-gradient(to_top,rgba(10,20,14,0.98)_0%,rgba(10,20,14,0.58)_68%,rgba(10,20,14,0.2)_100%)]" />
          <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(to_bottom,rgba(10,20,14,0.7),transparent)]" />

          <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-14 pt-40 md:px-10 md:pb-16 md:pt-32 lg:px-16">
            <div className="max-w-3xl">
              <div className="mb-7 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/80">
                <span className="rounded-full border border-white/25 bg-black/15 px-4 py-2 backdrop-blur-sm">Sábado 31 de octubre de 2026</span>
                <span className="rounded-full border border-white/25 bg-black/15 px-4 py-2 backdrop-blur-sm">Los Gigantes · Córdoba</span>
              </div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.32em] text-[#E7B84B]">{FESTIVAL_OCTUBRE.nameStatus}</p>
              <p className="mb-5 text-xl text-white/75 serif-title md:text-2xl">{FESTIVAL_OCTUBRE.name}</p>
              <h1 className="max-w-3xl text-5xl leading-[0.94] text-white serif-title sm:text-6xl md:text-8xl">
                Música, naturaleza<br />{' '}
                <span className="text-[#E7B84B]">y encuentro</span>
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">
                Un día para cambiar de ritmo. Música, DJs, naturaleza y experiencias para compartir en las sierras. Vení por el día o quedate a vivir el fin de semana completo.
              </p>
              <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <FestivalButton href={FESTIVAL_OCTUBRE.contact.general}>Quiero sumarme</FestivalButton>
                <FestivalButton href="#propuesta" secondary>Conocer la propuesta</FestivalButton>
              </div>
              <div className="mt-8 flex items-center gap-3 text-xs text-white/55">
                <Clock3 size={15} aria-hidden="true" />
                <span>Preventa y programación: próximas novedades</span>
              </div>
            </div>
          </div>
          <a href="#propuesta" aria-label="Ir a la propuesta" className="absolute bottom-8 right-6 z-10 hidden h-12 w-12 items-center justify-center rounded-full border border-white/25 text-white/70 transition hover:bg-white/10 md:flex">
            <ArrowDown size={18} aria-hidden="true" />
          </a>
        </section>

        <section id="propuesta" className="px-6 py-20 md:px-10 md:py-32" style={{ backgroundColor: C.cream }}>
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
            <div data-reveal>
              <Eyebrow>La propuesta</Eyebrow>
              <h2 className="max-w-2xl text-4xl leading-tight serif-title md:text-6xl">Una forma diferente de encontrarnos.</h2>
              <div className="mt-8 max-w-2xl space-y-5 text-base leading-relaxed text-[#1F2922]/70 md:text-lg">
                <p>La música nos reúne. La naturaleza nos cambia el ritmo. El fuego invita a conversar. Y, entre el baile, el río y la montaña, aparecen momentos que no estaban en los planes.</p>
                <p>Creamos un espacio para disfrutar, conocer gente, movernos y celebrar la vida en comunidad.</p>
              </div>
              <div className="mt-10 grid grid-cols-3 gap-3 border-t border-[#123B2D]/15 pt-7 text-center sm:text-left">
                {[['01', 'día central'], ['03', 'DJs confirmados'], ['02', 'formas de sumarte']].map(([number, label]) => (
                  <div key={label}>
                    <p className="text-3xl text-[#B85A3D] serif-title md:text-4xl">{number}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#1F2922]/55">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative" data-reveal data-delay="2">
              <div className="overflow-hidden rounded-[2rem]">
                <img src={img(FESTIVAL_OCTUBRE.images.concept, 1100)} alt="Amigos compartiendo mate en Pueblo Mágico" loading="lazy" width="1100" height="1300" className="aspect-[4/5] w-full object-cover" />
              </div>
              <div className="absolute -bottom-6 -left-3 max-w-[240px] rounded-2xl bg-[#123B2D] p-5 text-white shadow-xl sm:-left-8">
                <Music2 size={22} className="mb-3 text-[#E7B84B]" aria-hidden="true" />
                <p className="text-lg leading-snug serif-title">Electrónica orgánica en el corazón de las sierras.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="experiencias" className="bg-[#FCFAF5] px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end" data-reveal>
              <div>
                <Eyebrow>Qué vas a encontrar</Eyebrow>
                <h2 className="max-w-3xl text-4xl leading-tight serif-title md:text-6xl">Un festival que también se vive fuera de la pista.</h2>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-[#1F2922]/60">La programación y las actividades incluidas en cada modalidad se confirmarán próximamente.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {FESTIVAL_OCTUBRE.experiences.map((experience, index) => <ExperienceCard key={experience.title} experience={experience} index={index} />)}
            </div>
          </div>
        </section>

        <section id="artistas" className="overflow-hidden bg-[#111914] px-6 py-20 text-white md:px-10 md:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 grid gap-8 lg:grid-cols-[1fr_0.65fr] lg:items-end" data-reveal>
              <div>
                <Eyebrow light>Artistas confirmados</Eyebrow>
                <h2 className="text-4xl leading-tight serif-title md:text-6xl">La música que nos reúne.</h2>
              </div>
              <p className="text-sm leading-relaxed text-white/55">Tres nombres confirmados para una jornada de electrónica orgánica. Las biografías, fotos oficiales y redes se publicarán cuando estén disponibles.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {FESTIVAL_OCTUBRE.artists.map((artist, index) => (
                <article key={artist} className="group relative min-h-[390px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#173528] p-7" data-reveal data-delay={String(index + 1)}>
                  <div className="absolute -right-10 -top-12 h-52 w-52 rounded-full border border-white/10" />
                  <div className="absolute -right-4 top-5 h-36 w-36 rounded-full border border-[#E7B84B]/30" />
                  <div className="absolute inset-x-7 top-7 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Electrónica orgánica</span>
                    <span className="text-xs text-[#E7B84B]">0{index + 1}</span>
                  </div>
                  <div className="absolute bottom-7 left-7 right-7">
                    <div className="mb-7 flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/5 text-3xl text-[#E7B84B] serif-title" aria-hidden="true">
                      {artist.split(' ').map(word => word[0]).join('')}
                    </div>
                    <h3 className="text-3xl serif-title md:text-4xl">{artist}</h3>
                    <p className="mt-3 border-t border-white/10 pt-4 text-xs leading-relaxed text-white/45">Foto, biografía y enlaces oficiales pendientes de confirmar.</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-dashed border-white/15 px-6 py-5 text-center text-sm text-white/45">La grilla queda preparada para sumar nuevos artistas.</div>
          </div>
        </section>

        <section id="fin-de-semana" className="px-6 py-20 md:px-10 md:py-28" style={{ backgroundColor: C.cream }}>
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-14 max-w-3xl text-center" data-reveal>
              <Eyebrow>Elegí tu propio ritmo</Eyebrow>
              <h2 className="text-4xl leading-tight serif-title md:text-6xl">Un día de festival. Un fin de semana para quedarse.</h2>
              <p className="mt-5 text-sm leading-relaxed text-[#1F2922]/60 md:text-base">La programación detallada se anunciará próximamente.</p>
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

        <section id="entradas" className="bg-[#FCFAF5] px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center" data-reveal>
              <Eyebrow>Modalidades de acceso</Eyebrow>
              <h2 className="text-4xl serif-title md:text-6xl">Elegí cómo sumarte.</h2>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-[#1F2922]/60">Las consultas ya están abiertas. La venta y los precios todavía no fueron habilitados.</p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {ticketOptions.map((ticket, index) => (
                <article key={ticket.title} className={`relative overflow-hidden rounded-[2rem] border p-7 md:p-10 ${ticket.featured ? 'border-[#123B2D] bg-[#123B2D] text-white' : 'border-[#123B2D]/15 bg-[#F5F0E5]'}`} data-reveal data-delay={String(index + 1)}>
                  {ticket.featured && <span className="absolute right-5 top-5 rounded-full bg-[#E7B84B] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#123B2D]">Fin de semana</span>}
                  <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${ticket.featured ? 'text-[#E7B84B]' : 'text-[#B85A3D]'}`}>{ticket.eyebrow}</p>
                  <h3 className="mt-3 text-4xl serif-title">{ticket.title}</h3>
                  <p className={`mt-4 max-w-lg text-sm leading-relaxed ${ticket.featured ? 'text-white/65' : 'text-[#1F2922]/60'}`}>{ticket.description}</p>
                  <div className={`my-7 border-y py-6 ${ticket.featured ? 'border-white/10' : 'border-[#123B2D]/10'}`}>
                    <p className="text-2xl serif-title">{ticket.price}</p>
                    <p className={`mt-2 inline-flex items-center gap-2 text-xs font-bold ${ticket.featured ? 'text-[#E7B84B]' : 'text-[#B85A3D]'}`}><Sparkles size={14} aria-hidden="true" />{ticket.note}</p>
                  </div>
                  <ul className="mb-8 space-y-3">
                    {ticket.items.map(item => <li key={item} className={`flex gap-3 text-sm ${ticket.featured ? 'text-white/75' : 'text-[#1F2922]/70'}`}><Check size={17} className="mt-0.5 shrink-0 text-[#E7B84B]" aria-hidden="true" />{item}</li>)}
                  </ul>
                  <FestivalButton href={ticket.href}>{ticket.cta}</FestivalButton>
                  <p className={`mt-5 text-[11px] leading-relaxed ${ticket.featured ? 'text-white/40' : 'text-[#1F2922]/45'}`}>Consulta sin compromiso por WhatsApp. No completa una compra ni confirma disponibilidad.</p>
                </article>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-dashed border-[#123B2D]/20 p-5 text-center text-sm text-[#1F2922]/55">La estructura queda lista para agregar una modalidad viernes–sábado si se confirma.</div>
          </div>
        </section>

        <section id="lugar" className="relative min-h-[680px] overflow-hidden bg-[#123B2D] text-white">
          <img src={img(FESTIVAL_OCTUBRE.images.place, 1800)} alt="Jardín y Refugio de Piedra de Pueblo Mágico" loading="lazy" width="1800" height="1200" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,35,26,0.94)_0%,rgba(12,35,26,0.72)_50%,rgba(12,35,26,0.16)_100%)] max-md:bg-[linear-gradient(to_top,rgba(12,35,26,0.97),rgba(12,35,26,0.42))]" />
          <div className="relative mx-auto flex min-h-[680px] max-w-7xl items-end px-6 py-16 md:items-center md:px-10 lg:px-16">
            <div className="max-w-2xl" data-reveal>
              <Eyebrow light>El lugar</Eyebrow>
              <h2 className="text-4xl leading-tight serif-title md:text-6xl">Pueblo Mágico, en el corazón de las sierras.</h2>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/72 md:text-lg">Un ecolodge de montaña en Los Gigantes, Córdoba. Naturaleza, comunidad y un paisaje que cambia la forma de vivir el tiempo.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/15 px-4 py-2 text-xs text-white/75 backdrop-blur-sm"><MapPin size={15} aria-hidden="true" />Los Gigantes, Córdoba</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/15 px-4 py-2 text-xs text-white/75 backdrop-blur-sm"><Leaf size={15} aria-hidden="true" />Entorno natural serrano</span>
              </div>
              <div className="mt-8"><FestivalButton href="/">Conocer Pueblo Mágico</FestivalButton></div>
            </div>
          </div>
        </section>

        <section id="preguntas" className="px-6 py-20 md:px-10 md:py-28" style={{ backgroundColor: C.cream }}>
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.72fr_1fr] lg:gap-20">
            <div data-reveal>
              <Eyebrow>Preguntas frecuentes</Eyebrow>
              <h2 className="text-4xl leading-tight serif-title md:text-6xl">Lo confirmado, sin letra chica.</h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-[#1F2922]/60">Vamos a actualizar esta sección a medida que se definan precios, programación, disponibilidad y condiciones.</p>
              <a href={FESTIVAL_OCTUBRE.contact.general} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#123B2D] underline decoration-[#E7B84B] decoration-2 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#123B2D]">
                <MessageCircle size={17} aria-hidden="true" /> Hacer otra consulta
              </a>
            </div>
            <div className="divide-y divide-[#123B2D]/12 border-y border-[#123B2D]/12" data-reveal data-delay="2">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={faq.question}>
                    <button type="button" className="flex w-full items-center justify-between gap-5 py-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#123B2D]" onClick={() => setOpenFaq(isOpen ? null : index)} aria-expanded={isOpen} aria-controls={`festival-faq-${index}`}>
                      <span className="text-base font-semibold md:text-lg">{faq.question}</span>
                      <ChevronDown size={20} className={`shrink-0 text-[#B85A3D] transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </button>
                    <div id={`festival-faq-${index}`} className={`grid transition-[grid-template-rows] duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className="overflow-hidden"><p className="max-w-2xl pb-6 pr-10 text-sm leading-relaxed text-[#1F2922]/65">{faq.answer}</p></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[#B85A3D] px-6 py-20 text-white md:px-10 md:py-28">
          <div className="mx-auto max-w-5xl text-center" data-reveal>
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#E7B84B] text-[#123B2D]"><Waves size={24} aria-hidden="true" /></div>
            <h2 className="text-4xl leading-tight serif-title md:text-7xl">Cambiá de ritmo.<br />Vení a encontrarte.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/75">Un día de música, naturaleza y buena compañía. Un encuentro para salir de lo habitual y disfrutar de otra manera.</p>
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
