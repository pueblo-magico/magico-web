import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  BedDouble,
  CalendarDays,
  Check,
  ChevronDown,
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
import { HorizontalCardRail } from '../components/HorizontalCardRail';
import { PageSectionNav, type PageNavigation } from '../components/PageSectionNav';
import {
  FESTIVAL_OCTUBRE,
  type FestivalAccessOption,
  type FestivalArtist,
  type FestivalTeamMember,
} from './data/festivalOctubre';
import { img } from './lib/img';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { CookieBanner } from '../components/CookieBanner';
import { SITE_URL } from './data/config';
import { ROUTES } from './routes';

const C = {
  pine: '#2F3A31',
  night: '#003A34',
  moss: '#008C86',
  sun: '#FFB300',
  clay: '#FF5A1F',
  coral: '#FF6A00',
  plum: '#004B43',
  mauve: '#E40067',
  cream: '#FFF6E3',
  paper: '#FFFDF5',
  ink: '#003630',
};

const SunRings = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 320 320" fill="none" aria-hidden="true">
    {[42, 68, 94, 120, 146].map(radius => (
      <circle key={radius} cx="160" cy="160" r={radius} stroke="currentColor" strokeWidth="1" opacity={0.72 - radius / 300} />
    ))}
    <circle cx="160" cy="160" r="18" fill="currentColor" opacity="0.9" />
  </svg>
);

const FestivalBurst = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 760 300" fill="none" aria-hidden="true">
    <g strokeLinecap="round" strokeWidth="7">
      <path d="M380 122V20" stroke="#FFB300" />
      <path d="M328 126 290 34" stroke="#FF6A00" />
      <path d="m278 146-76-68" stroke="#E40067" />
      <path d="m246 188-104-26" stroke="#008C86" />
      <path d="m432 126 38-92" stroke="#FF5A1F" />
      <path d="m482 146 76-68" stroke="#FFB300" />
      <path d="m514 188 104-26" stroke="#E40067" />
    </g>
    <g>
      <circle cx="380" cy="146" r="34" fill="#FFB300" opacity=".94" />
      <circle cx="338" cy="109" r="11" fill="#E40067" />
      <circle cx="426" cy="105" r="9" fill="#008C86" />
      <path d="M190 224c56-56 104-24 146 5 46 31 88 36 138-7 42-36 85-44 132 1" stroke="#FF6A00" strokeWidth="7" strokeLinecap="round" />
      <path d="M166 252c62-48 118-25 166 4 43 25 88 28 140-6 49-32 96-32 146 0" stroke="#E40067" strokeWidth="6" strokeLinecap="round" />
      <path d="M146 278c66-39 128-22 181 3 48 22 98 22 152-4 55-26 105-23 156 4" stroke="#008C86" strokeWidth="6" strokeLinecap="round" />
    </g>
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
  pageEyebrow: '31/10/2026',
  pageTitle: 'Raíz Sonora · Pueblo Mágico',
  sections: [
    { id: 'propuesta', label: 'La propuesta' },
    { id: 'artistas', label: 'Artistas' },
    { id: 'cronograma', label: 'Horarios' },
    { id: 'temazcal', label: 'Temazcal' },
    { id: 'lugar', label: 'El lugar' },
    { id: 'entradas', label: 'Entradas' },
    { id: 'para-quien', label: 'Para quién es' },
    { id: 'equipo', label: 'Equipo' },
    { id: 'preguntas', label: 'Preguntas' },
  ],
};

const faqs = [
  {
    Icon: MapPin,
    question: '¿Cómo llegar a Pueblo Mágico?',
    answer: (
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="font-bold text-[#003630]">⛰️ ECO-CENTRO PUEBLO MÁGICO ⛰️</p>
          <p className="font-bold text-[#003630]">📍 ¿Cómo llegar?</p>
        </div>

        <p className="font-bold text-[#C34F32]">👉 Desde Tanti</p>

        <ol className="space-y-4">
          <li className="flex items-start gap-3">
            <span className="shrink-0" aria-hidden="true">1️⃣</span>
            <span>Pasando Tanti, tomar el asfalto nuevo (aprox. 10 km) hasta llegar a Cerro Blanco.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="shrink-0" aria-hidden="true">2️⃣</span>
            <span>Desde allí, continuar 30 km por el camino principal de ripio. Lo están asfaltando, está en muy buen estado y es apto para todo tipo de vehículo.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="shrink-0" aria-hidden="true">3️⃣</span>
            <span>Vas a llegar a un cruce de caminos donde están trabajando máquinas y hay un cartel que dice “Taninga y Tala Cañada”. <strong className="font-bold text-[#003630]">➡️ Doblá a la derecha.</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="shrink-0" aria-hidden="true">4️⃣</span>
            <span>Seguí 8,5 km hasta encontrar, a mano izquierda, un cartel que dice “Pueblo Mágico” y una tranquera que dice “El Divisadero”.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="shrink-0" aria-hidden="true">5️⃣</span>
            <span>
              Ingresá por allí y avanzá 2 km, siguiendo las indicaciones:
              <span className="mt-2 block space-y-1 font-semibold text-[#003630]">
                <span className="block">✔️ Pasá una cantera</span>
                <span className="block">✔️ Bajá por el camino</span>
              </span>
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="shrink-0" aria-hidden="true">6️⃣</span>
            <span>Cruzá una tranquera de alambre. 🚗 Apenas la pases, vas a encontrar el estacionamiento del predio.</span>
          </li>
        </ol>

        <div className="rounded-2xl border border-[#004B43]/15 bg-[#004B43]/[0.04] p-4">
          <p className="font-bold text-[#003630]">📍 Ubicación en Google Maps:</p>
          <a href="https://acortar.link/STOwP7" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 font-bold text-[#C34F32] underline decoration-[#C34F32]/35 underline-offset-4 transition hover:text-[#003630] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF6A00]">
            Abrir ubicación en Google Maps <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
      </div>
    ),
  },
  {
    Icon: CalendarDays,
    question: '¿Puedo asistir solamente el sábado?',
    answer: 'Sí. El Pase por el Día permite vivir toda la jornada central del sábado 31. También podés sumar una o dos noches, en camping o habitación compartida.',
  },
  {
    Icon: Ticket,
    question: '¿Qué incluye la entrada general?',
    answer: 'El Pase por el Día cuesta AR$ 35.000 por persona e incluye la jornada central del sábado, cinco artistas, diez horas de música, el Jam de AcroYoga, el fogón y las propuestas abiertas. No incluye comidas, bebidas, estacionamiento, alojamiento ni experiencias con inscripción propia.',
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
    question: '¿Necesito experiencia para participar del Jam de AcroYoga?',
    answer: 'No. El Jam de AcroYoga es una invitación abierta al juego y al movimiento compartido. Podés acercarte sin experiencia previa y elegir libremente cómo participar.',
  },
  {
    Icon: UserRound,
    question: '¿Puedo asistir solo o sola?',
    answer: 'Sí. La propuesta está pensada para encontrarse, compartir y conocer gente, tanto si venís por tu cuenta como en grupo.',
  },
  {
    Icon: UsersRound,
    question: '¿Puedo venir con niños o niñas?',
    answer: 'Sí. Raíz Sonora es un encuentro apto para toda la familia: niños y niñas son bienvenidos. Es importante que permanezcan acompañados por una persona adulta responsable.',
  },
  {
    Icon: Flame,
    question: '¿Cómo funciona el temazcal del domingo?',
    answer: 'El temazcal forma parte de la propuesta del domingo y tiene cupo limitado, inscripción previa y un valor adicional. Consultanos para reservar tu lugar.',
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
    <div className="grid max-w-lg grid-cols-4 gap-2" aria-label="Cuenta regresiva para Raíz Sonora">
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
  <p className={`mb-4 text-[11px] font-bold uppercase tracking-[0.28em] ${light ? 'text-[#FFD166]' : 'text-[#FF5A1F]'}`}>
    {children}
  </p>
);

const FestivalButton = ({ href, children, secondary = false, fullWidth = false }: { href: string; children: React.ReactNode; secondary?: boolean; fullWidth?: boolean }) => (
  <a
    href={href}
    target={href.startsWith('http') ? '_blank' : undefined}
    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
    className={`group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 text-xs font-bold uppercase tracking-[0.13em] transition duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${fullWidth ? 'w-full' : ''} ${secondary
      ? 'border border-white/55 bg-[#003A34]/35 text-white backdrop-blur-sm hover:bg-white/10 focus-visible:outline-white'
      : 'bg-[#FF6A00] text-white shadow-[0_14px_38px_rgba(93,35,28,0.28)] hover:-translate-y-0.5 hover:bg-[#FF7048] focus-visible:outline-[#FF6A00]'
      }`}
  >
    {children}
    <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
  </a>
);

const TeamCard = ({ member, index }: { member: FestivalTeamMember; index: number }) => (
  <article className="relative h-full overflow-hidden rounded-[1.75rem] border border-[#8D5E70]/20 bg-[#FFF9F0] p-7 shadow-[0_18px_45px_rgba(72,42,60,0.08)]" data-reveal data-delay={String((index % 3) + 1)}>
    <span className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#FF5A1F,#FFB300,#E40067)]" aria-hidden="true" />
    <div className="mb-5 h-16 w-16 overflow-hidden rounded-full border-2 border-[#FFB300]/60 bg-[#004B43]/10">
      <img
        src={img(member.image, 800)}
        alt={member.fullName}
        loading="lazy"
        width="160"
        height="160"
        className="h-full w-full object-cover"
      />
    </div>
    <p className="text-lg font-bold text-[#003630]">{member.name}</p>
    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#FF5A1F]">{member.role}</p>
    <p className="mt-3 text-sm leading-relaxed text-[#003630]/65">{member.description}</p>
    {'instagram' in member && member.instagram && (
      <a href={member.instagram} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#004B43] underline decoration-[#FF6A00] decoration-2 underline-offset-4">
        <Instagram size={14} aria-hidden="true" /> Instagram
      </a>
    )}
  </article>
);

const ArtistCard = ({ artist, index }: { artist: FestivalArtist; index: number }) => {
  const { accent, glow, surface, ink, imagePosition } = artist.theme;
  const sourceLabel = 'sourceLabel' in artist ? artist.sourceLabel : 'Conocé más';

  return (
    <article
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[1.75rem] border shadow-[0_28px_70px_rgba(0,0,0,0.34)]"
      style={{ backgroundColor: surface, borderColor: `${accent}66` }}
      data-reveal
      data-delay={String(index + 1)}
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={img(artist.image, 1000)}
          alt={artist.imageAlt}
          loading="lazy"
          width="900"
          height="1200"
          className="h-full w-full object-cover brightness-[.92] contrast-[1.04] saturate-[.88] transition duration-700 group-hover:scale-[1.035]"
          style={{ objectPosition: imagePosition }}
        />
        <div className="absolute inset-0 opacity-10 mix-blend-color" style={{ backgroundColor: glow }} aria-hidden="true" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,13,19,0.14)_0%,rgba(20,13,19,0.06)_42%,rgba(20,13,19,0.96)_100%)]" aria-hidden="true" />
        <div className="pointer-events-none absolute left-1/2 top-[27%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 opacity-45" style={{ color: accent }} aria-hidden="true">
          <SunRings className="h-full w-full" />
        </div>
        <div className="absolute inset-x-5 top-5 flex items-start justify-center gap-3">
          <span className="text-[9px] font-bold uppercase tracking-[0.42em]" style={{ color: ink }}>Raíz Sonora</span>
          <span className="absolute right-0 rounded-full border px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] backdrop-blur-md" style={{ borderColor: `${accent}73`, backgroundColor: `${surface}99`, color: ink }}>Acto 0{index + 1}</span>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full opacity-35" style={{ color: accent }} aria-hidden="true">
          <OrganicWave className="h-full w-full" />
        </div>
        <div className="absolute inset-x-5 bottom-5 text-center">
          {'logo' in artist && artist.logo && (
            <div className="mx-auto mb-3 w-fit max-w-[150px] rounded-lg bg-[#FFF8EA]/90 px-3 py-1.5 shadow-lg backdrop-blur-sm">
              <img src={artist.logo} alt="Logo de Maurión" loading="lazy" className="h-6 w-auto object-contain mix-blend-multiply" />
            </div>
          )}
          <p className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: accent }}>Artista Raíz Sonora</p>
          <h3 className="mt-2 break-words text-[2.65rem] leading-[0.92] serif-title sm:text-5xl" style={{ color: ink }}>{artist.name}</h3>
          <div className="mx-auto mt-4 h-px w-14" style={{ backgroundColor: accent }} aria-hidden="true" />
          <p className="mt-3 text-[9px] uppercase tracking-[0.32em]" style={{ color: `${ink}B8` }}>Pueblo Mágico</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col border-t p-6" style={{ borderColor: `${accent}3D`, background: `linear-gradient(145deg, ${surface}, ${glow}38)` }}>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: accent }}>{artist.style}</p>
        <p className="mt-2 text-xs font-semibold" style={{ color: `${ink}B8` }}>Sábado · {artist.setTime}</p>
        {'credit' in artist && artist.credit && <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: `${ink}8F` }}>{artist.credit}</p>}
        <p className="mt-4 text-sm leading-relaxed" style={{ color: `${ink}B8` }}>{artist.bio}</p>
        {'sourceUrl' in artist && artist.sourceUrl && (
          <div className="mt-auto flex justify-end border-t pt-4" style={{ borderColor: `${accent}2E` }}>
            <a href={artist.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] underline underline-offset-4" style={{ color: accent }}>
              {sourceLabel === 'Instagram' ? <Instagram size={14} aria-hidden="true" /> : <ArrowRight size={14} aria-hidden="true" />}
              {sourceLabel}
            </a>
          </div>
        )}
      </div>
    </article>
  );
};

const accessCardTones = [
  'border-[#FF5A1F]/25 bg-[#FFF0D5]',
  'border-[#008C86]/25 bg-[#E2F5EE]',
  'border-[#E40067]/25 bg-[#FFE3EF]',
  'border-[#FF9F1C]/30 bg-[#FFF1C7]',
] as const;

const AccessCard = ({ option, index }: { option: FestivalAccessOption; index: number }) => (
  <article className={`relative flex h-full min-w-0 flex-col overflow-hidden rounded-[1.75rem] border p-6 md:p-7 ${option.featured ? 'border-[#FFB300] bg-[#004B43] text-white shadow-[0_24px_60px_rgba(72,42,60,0.28)]' : accessCardTones[index % accessCardTones.length]}`} data-reveal data-delay={String((index % 3) + 1)}>
    <div className={`absolute inset-x-0 top-0 h-1.5 ${option.featured ? 'bg-[linear-gradient(90deg,#FF6A00,#FFB300)]' : index % 2 === 0 ? 'bg-[#FF5A1F]' : 'bg-[#008C86]'}`} aria-hidden="true" />
    <div className="mb-4 flex h-7 items-center justify-center">
      {option.featured && <span className="rounded-full bg-[#FFB300] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#004B43]">{'featuredLabel' in option ? option.featuredLabel : 'Destacada'}</span>}
    </div>
    <p className={`text-center text-[10px] font-bold uppercase tracking-[0.2em] ${option.featured ? 'text-[#FFD166]' : 'text-[#FF5A1F]'}`}>{option.eyebrow}</p>
    <h3 className="mt-3 text-center text-3xl leading-[1.05] serif-title md:min-h-[5rem]">{option.title}</h3>
    {'image' in option && option.image && (
      <img
        src={img(option.image, 760)}
        alt={option.imageAlt}
        loading="lazy"
        width="760"
        height="430"
        className="mt-5 aspect-[16/9] w-full rounded-2xl object-cover shadow-[0_14px_28px_rgba(31,41,34,0.12)]"
      />
    )}
    <p className={`mt-4 text-center text-sm leading-relaxed md:min-h-[5rem] ${option.featured ? 'text-white/70' : 'text-[#16423D]/65'}`}>{option.description}</p>
    <div className={`my-6 border-y py-6 text-center ${option.featured ? 'border-white/10' : 'border-[#123B2D]/10'}`}>
      <p className={`mx-auto mb-4 inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold whitespace-nowrap ${option.featured ? 'bg-white/10 text-[#FFD166]' : 'bg-white/65 text-[#004B43]'}`}>💳 {option.installments}</p>
      <p className="text-4xl serif-title">{option.price}</p>
      <p className={`mt-2 text-[10px] font-bold uppercase tracking-[0.12em] ${option.featured ? 'text-white/50' : 'text-[#16423D]/50'}`}>por persona · transferencia · efectivo</p>
    </div>
    <p className={`mb-4 text-center text-[10px] font-bold uppercase tracking-[0.18em] ${option.featured ? 'text-[#FFD166]' : 'text-[#FF5A1F]'}`}>Incluye</p>
    <ul className="mb-6 space-y-3">
      {option.includes.map(item => <li key={item} className={`flex gap-2.5 text-sm leading-relaxed ${option.featured ? 'text-white/80' : 'text-[#003630]/75'}`}><Check size={16} className="mt-0.5 shrink-0 text-[#FF6A00]" aria-hidden="true" />{item}</li>)}
    </ul>
    <div className={`mb-7 rounded-2xl p-4 ${option.featured ? 'bg-white/[0.07]' : 'bg-[#123B2D]/[0.05]'}`}>
      <p className={`mb-2 text-[10px] font-bold uppercase tracking-[0.18em] ${option.featured ? 'text-white/50' : 'text-[#16423D]/50'}`}>No incluye</p>
      <p className={`text-xs leading-relaxed ${option.featured ? 'text-white/65' : 'text-[#16423D]/65'}`}>{option.excludes.join(' · ')}</p>
    </div>
    <div className="mt-auto"><FestivalButton href={option.href} fullWidth>{option.cta}</FestivalButton></div>
  </article>
);

const celebrationMoments = [
  {
    src: '/uploads/atardeser/celebracion-grupal.jpeg',
    alt: 'Grupo de personas bailando y celebrando al aire libre en Pueblo Mágico',
    label: 'Comunidad en movimiento',
  },
  {
    src: '/uploads/atardeser/festival-dancing-sunset-philipp.webp',
    alt: 'Grupo diverso bailando al aire libre durante el atardecer',
    label: 'Bailar al aire libre',
  },
  {
    src: '/uploads/reforestacion/jornada-comunidad.jpeg',
    alt: 'Grupo de personas compartiendo una jornada en la naturaleza de Los Gigantes',
    label: 'Naturaleza compartida',
  },
  {
    src: '/uploads/sunset-rio-fogon-real.webp',
    alt: 'Personas reunidas alrededor de un fogón en Pueblo Mágico',
    label: 'Fogón bajo las estrellas',
  },
] as const;

const CelebrationMosaic = () => (
  <section aria-label="Momentos de celebraciones en Pueblo Mágico" className="relative overflow-hidden bg-[#004B43] px-6 py-16 text-white md:px-10 md:py-24">
    <div className="pointer-events-none absolute -left-24 -top-20 h-72 w-72 rounded-full bg-[#FF6A00]/35 blur-3xl" aria-hidden="true" />
    <div className="pointer-events-none absolute -bottom-28 right-[-3rem] h-80 w-80 rounded-full bg-[#FFB300]/20 blur-3xl" aria-hidden="true" />
    <SunRings className="pointer-events-none absolute -right-24 -top-28 h-[28rem] w-[28rem] text-[#FFD166]/18" />
    <OrganicWave className="pointer-events-none absolute inset-x-0 bottom-0 h-36 w-full text-[#FFD166]/14" />

    <div className="relative mx-auto max-w-7xl">
      <div className="mx-auto max-w-4xl text-center" data-reveal>
        <p className="mb-5 inline-flex rounded-full border border-[#FFD166]/30 bg-[#003A34]/30 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.28em] text-[#FFD166]">Esto ya se vive</p>
        <h2 className="text-4xl leading-[1.02] text-[#FFF8EA] serif-title md:text-6xl">La celebración se siente en el cuerpo.</h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/68">Imágenes reales de encuentros en Pueblo Mágico: música, baile, familias y naturaleza compartiendo el mismo ritmo.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          {['Música en vivo', 'Baile al aire libre', 'Todas las edades'].map(item => (
            <span key={item} className="rounded-full border border-[#FFD166]/25 bg-white/[0.06] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#FFD166]">{item}</span>
          ))}
        </div>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-3 md:mt-12 lg:grid-cols-4" data-reveal data-delay="1">
        {celebrationMoments.map((moment, index) => (
          <figure key={moment.src} className="group relative aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-[#FFD166]/30 bg-[#003A34] shadow-[0_24px_55px_rgba(27,21,32,0.35)] sm:aspect-[4/3] lg:aspect-[4/5]">
            <img src={img(moment.src, index === 0 ? 1000 : 800)} alt={moment.alt} loading="lazy" width="1000" height="1000" className="h-full w-full object-cover saturate-[1.08] transition duration-700 group-hover:scale-[1.03]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(239,90,47,0.04),rgba(72,42,60,0.12))] mix-blend-color" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#003A34]/90 to-transparent" />
            <figcaption className="absolute bottom-4 left-4 rounded-full border border-white/20 bg-[#003A34]/70 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.13em] text-white shadow-sm backdrop-blur-sm">{moment.label}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  </section>
);

const FestivalOctubre: React.FC = () => {

  const [belowFoldReady, setBelowFoldReady] = useState(false);


  useEffect(() => {
    // Forzamos la carga de elementos pesados después de que la prioridad inicial termine
    // o después de 1 segundo como máximo (seguridad para PageSpeed y UX)
    const timer = setTimeout(() => setBelowFoldReady(true), 1000);

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        clearTimeout(timer);
        setBelowFoldReady(true);
      });
    }

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Forzamos la carga de elementos pesados después de que la prioridad inicial termine
    // o después de 1 segundo como máximo (seguridad para PageSpeed y UX)
    const timer = setTimeout(() => setBelowFoldReady(true), 1000);

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        clearTimeout(timer);
        setBelowFoldReady(true);
      });
    }

    return () => clearTimeout(timer);
  }, []);

  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showDesktopHeroEffects, setShowDesktopHeroEffects] = useState(() => (
    typeof window === 'undefined' || window.matchMedia('(min-width: 768px)').matches
  ));

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handleChange = (event: MediaQueryListEvent) => setShowDesktopHeroEffects(event.matches);
    setShowDesktopHeroEffects(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

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

    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); document.head.appendChild(el); }
      el.setAttribute('href', href);
    };

    const IMG = `${SITE_URL}${FESTIVAL_OCTUBRE.images.og}`;
    const URL = FESTIVAL_OCTUBRE.canonical;
    const TITLE = `${FESTIVAL_OCTUBRE.name} · ${FESTIVAL_OCTUBRE.tagline}`;
    const IMAGE_ALT = 'Raíz Sonora · Progressive, house, trance, organic y tambores en Pueblo Mágico';

    setMeta('meta[name="description"]', 'name', 'description').content = FESTIVAL_OCTUBRE.description;
    setMeta('meta[property="og:title"]', 'property', 'og:title').content = TITLE;
    setMeta('meta[property="og:description"]', 'property', 'og:description').content = FESTIVAL_OCTUBRE.description;
    setMeta('meta[property="og:image"]', 'property', 'og:image').content = IMG;
    setMeta('meta[property="og:image:secure_url"]', 'property', 'og:image:secure_url').content = IMG;
    setMeta('meta[property="og:image:width"]', 'property', 'og:image:width').content = '1084';
    setMeta('meta[property="og:image:height"]', 'property', 'og:image:height').content = '631';
    setMeta('meta[property="og:image:alt"]', 'property', 'og:image:alt').content = IMAGE_ALT;
    setMeta('meta[property="og:url"]', 'property', 'og:url').content = URL;
    setMeta('meta[property="og:type"]', 'property', 'og:type').content = 'website';
    setMeta('meta[property="og:locale"]', 'property', 'og:locale').content = 'es_AR';
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card').content = 'summary_large_image';
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title').content = TITLE;
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description').content = FESTIVAL_OCTUBRE.description;
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image').content = IMG;
    setMeta('meta[name="twitter:image:alt"]', 'name', 'twitter:image:alt').content = IMAGE_ALT;
    setLink('canonical', URL);

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
      image: IMG,
      location: {
        '@type': 'Place',
        name: 'Pueblo Mágico',
        address: { '@type': 'PostalAddress', addressLocality: 'Los Gigantes', addressRegion: 'Córdoba', addressCountry: 'AR' },
      },
      organizer: { '@type': 'Organization', name: 'Pueblo Mágico', url: SITE_URL },
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
    <div className="festival-page overflow-x-hidden bg-[#FFFDF5] text-[#16423D]">
      <Header subNavigation={<PageSectionNav navigation={navigation} minimumSections={5} />} />

      <main>
        <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-[#003A34]">
          <img
            src={FESTIVAL_OCTUBRE.images.hero}
            alt="Paisaje de montaña de Pueblo Mágico inspirado en la gráfica de Raíz Sonora"
            width="1672"
            height="941"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 38%, rgba(255,179,0,0.05) 0%, rgba(0,58,52,0.48) 44%, rgba(0,40,36,0.82) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,58,52,0.62) 0%, rgba(0,58,52,0.24) 36%, rgba(0,44,39,0.92) 100%)' }} />
          <div className={`absolute inset-0 ${showDesktopHeroEffects ? 'mix-blend-color' : ''}`} style={{ background: 'linear-gradient(115deg, rgba(255,90,31,0.30), transparent 40%, rgba(228,0,103,0.24))' }} />
          <div className="absolute inset-x-0 top-0 h-40" style={{ background: 'linear-gradient(to bottom, rgba(0,44,39,0.82), transparent)' }} />
          {showDesktopHeroEffects && (
            <>
              <div className="pointer-events-none absolute -left-20 top-[28%] h-72 w-72 rounded-full bg-[#FF6A00]/25 blur-[90px]" aria-hidden="true" />
              <div className="pointer-events-none absolute -right-16 bottom-[12%] h-80 w-80 rounded-full bg-[#FFB300]/22 blur-[100px]" aria-hidden="true" />
              <img
                src={FESTIVAL_OCTUBRE.images.overlay}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-screen"
              />
            </>
          )}
          <FestivalBurst className={`pointer-events-none absolute left-1/2 top-[9%] w-[42rem] max-w-[120vw] -translate-x-1/2 opacity-55 md:top-[5%] md:w-[54rem] ${showDesktopHeroEffects ? 'mix-blend-screen' : ''}`} />

          <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-14 pt-16 text-center md:px-10 md:pb-16 md:pt-16">
            <div className="mx-auto max-w-4xl">
              <div className="mb-6 flex flex-wrap justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/80">
                <span className="rounded-full border border-[#FFD166]/40 bg-[#003A34]/35 px-4 py-2 backdrop-blur-sm">Sábado 31/10/2026</span>
                <span className="rounded-full border border-[#FFD166]/40 bg-[#003A34]/35 px-4 py-2 backdrop-blur-sm">Los Gigantes · Córdoba</span>
              </div>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#FFD166] md:text-xs">Progressive · House · Trance · Organic · Tambores</p>
              <h1 className="text-[4.25rem] leading-[0.76] tracking-[-0.065em] text-[#FFF8EA] [text-shadow:0_8px_35px_rgba(0,30,27,.55)] serif-title sm:text-8xl md:text-9xl lg:text-[9.5rem]"><span className="block">RAÍZ</span><span className="block">SONORA</span></h1>
              <p className="mx-auto mt-6 max-w-full text-xl leading-tight text-[#FFE28A] [text-shadow:0_3px_12px_rgba(0,0,0,0.95),0_1px_2px_rgba(0,0,0,0.95)] serif-title md:text-3xl">Movimiento · Conexión · Naturaleza</p>
              <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-white/80 md:text-lg">
                Una tribu de artistas y un día entero de música en vivo para bailar en el corazón de la montaña. Veni a celebrar y co-crear experiencias y por el día o quedarte durante todo el fin de semana.
              </p>
              <div className="mx-auto mt-5 flex max-w-3xl flex-wrap justify-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em]">
                {[
                  ['Celebracion', '#00A69C'],
                  ['Danza', '#FFB300'],
                  ['Comunidad', '#E40067'],
                  ['Experiencias', '#00A69C'],
                  ['Bienestar', '#FF5A1F'],
                ].map(([label, color]) => <span key={label} className="rounded-full border bg-[#003A34]/65 px-3 py-1.5 text-white backdrop-blur-sm" style={{ borderColor: color }}>{label}</span>)}
              </div>
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
          <a href="#lugar" aria-label="Ir al lugar" className="absolute bottom-8 right-6 z-10 hidden h-12 w-12 items-center justify-center rounded-full border border-white/25 text-white/70 transition hover:bg-white/10 md:flex">
            <ArrowDown size={18} aria-hidden="true" />
          </a>
        </section>

        <section id="propuesta" className="relative overflow-hidden bg-[#FFF6E3] px-6 py-20 text-[#003630] md:px-10 md:py-28">
          <TopographicLines className="pointer-events-none absolute -left-28 top-4 h-80 w-[38rem] text-[#E40067]/16" />
          <SunRings className="pointer-events-none absolute -bottom-40 -right-40 h-[30rem] w-[30rem] text-[#FF5A1F]/16" />
          <div className="relative mx-auto max-w-5xl">
            <div className="text-center" data-reveal>
              <div className="mb-7 flex items-center justify-center gap-3">
                {[{ Icon: Music2, color: '#FF5A1F' }, { Icon: Sun, color: '#FF9F1C' }, { Icon: UsersRound, color: '#E40067' }].map(({ Icon, color }, index) => (
                  <span key={index} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#004B43]/10 bg-white/70 shadow-sm">
                    <Icon size={17} color={color} aria-hidden="true" />
                  </span>
                ))}
              </div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.34em] text-[#FF5A1F]">El festival</p>
              <h2 className="mx-auto max-w-3xl text-4xl leading-[1.04] text-[#003630] serif-title md:text-6xl">Un pulso que nace en la montaña</h2>
              <p className="mx-auto mt-7 max-w-2xl text-sm leading-relaxed text-[#003630]/65 md:text-base">
                Raíz Sonora reúne progressive, house, trance y tambores con movimiento, naturaleza y comunidad. Un festival abierto para venir por el día o quedarse a vivir el fin de semana completo.
              </p>
            </div>

            <div className="mt-14 grid gap-4 md:grid-cols-3" data-reveal data-delay="1">
              {[
                { Icon: Music2, title: 'Música en vivo', text: 'Cinco artistas y diez horas de house, trance, música orgánica y tambores.', shell: 'border-[#FF5A1F]/25 bg-[#FFF0D5]', icon: 'bg-[#FF5A1F] text-white' },
                { Icon: Leaf, title: 'Naturaleza', text: 'Río, senderos y montaña forman parte de la experiencia y nos invitan a cambiar de ritmo.', shell: 'border-[#008C86]/25 bg-[#E2F5EE]', icon: 'bg-[#008C86] text-white' },
                { Icon: UsersRound, title: 'Movimiento y conexión', text: 'Jam de AcroYoga, fogón y espacios para celebrar, jugar y conocer gente nueva.', shell: 'border-[#E40067]/25 bg-[#FFE3EF]', icon: 'bg-[#E40067] text-white' },
              ].map(({ Icon, title, text, shell, icon }) => (
                <article key={title} className={`rounded-[1.75rem] border px-7 py-8 text-center shadow-[0_16px_40px_rgba(72,42,60,0.07)] ${shell}`}>
                  <span className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full ${icon}`}>
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-xl text-[#003630] serif-title">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#003630]/60">{text}</p>
                </article>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap justify-center gap-2.5" data-reveal data-delay="2">
              {['Abierto a toda la familia', 'Vení por el día', 'Quedate el finde', 'Buffet y barra disponibles'].map(item => (
                <span key={item} className="rounded-full border border-[#004B43]/15 bg-white/65 px-4 py-2 text-[10px] font-semibold tracking-wide text-[#004B43]">{item}</span>
              ))}
            </div>
          </div>
        </section>


        <section id="artistas" className="relative overflow-hidden bg-[#003A34] px-6 py-20 text-white md:px-10 md:py-28">
          <img
            src={FESTIVAL_OCTUBRE.images.pulse}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-50"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#003A34]/40 via-[#003A34]/90 to-[#003A34]" />
          <div className="relative mx-auto max-w-7xl">
            <div className="mx-auto mb-12 max-w-3xl text-center" data-reveal>
              <Eyebrow light>Artistas confirmados</Eyebrow>
              <h2 className="text-4xl leading-tight text-[#FFF8EA] serif-title md:text-6xl">El pulso de Raíz Sonora.</h2>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/55 md:text-base">Cinco artistas confirmados para celebrar integrando música y naturaleza. La música acompaña el viaje desde el movimiento del día hasta el fuego de la noche.</p>

              <article className="mx-auto mt-7 max-w-2xl rounded-[1.75rem] border border-[#FFD166]/25 bg-white/[0.06] p-5 text-left backdrop-blur-sm md:flex md:items-center md:gap-5 md:p-6">
                <div className="mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FF5A1F] text-[#004B43] md:mb-0"><Moon size={21} aria-hidden="true" /></div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#FFD166]">Viernes 30/10/2026</p>
                  <h3 className="mt-2 text-2xl text-[#FFF8EA] serif-title md:text-3xl">Llegada y bienvenida</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/65">Llegada para quienes elijan llegar antes, instalarse y empezar a compartir.</p>
                </div>
              </article>

              <article className="mx-auto mt-7 max-w-2xl rounded-[1.75rem] border border-[#FFD166]/25 bg-white/[0.06] p-5 text-left backdrop-blur-sm md:flex md:items-center md:gap-5 md:p-6">
                <div className="mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FFB300] text-[#004B43] md:mb-0"><Sun size={21} aria-hidden="true" /></div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#FFD166]">Sábado 31/10/2026</p>
                  <h3 className="mt-2 text-2xl text-[#FFF8EA] serif-title md:text-3xl">Jornada central</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">Cinco artistas, diez horas de música, Jam de AcroYoga, fogón y propuestas abiertas en el corazón de la montaña.</p>
                </div>
              </article>

              <article className="mx-auto mt-8 max-w-2xl rounded-[1.75rem] border border-[#FFD166]/20 bg-white/[0.06] p-5 text-left backdrop-blur-sm md:flex md:items-center md:gap-5 md:p-6">
                <div className="mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#008C86] text-white md:mb-0"><Leaf size={21} aria-hidden="true" /></div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#FFD166]">Domingo 01/11/2026</p>
                  <h3 className="mt-2 text-2xl text-[#FFF8EA] serif-title md:text-3xl">Naturaleza e integración</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/65">Temazcal, yoga, caminatas y conexión con ríos y montañas para quienes extiendan su estadía.</p>
                </div>
              </article>
            </div>
            <p className="mb-5 text-center text-xs font-semibold leading-relaxed text-white/65 md:text-sm">Deslizá o usá las flechas para conocer a cada artista.</p>
            <HorizontalCardRail
              previousLabel="Ver artista anterior"
              nextLabel="Ver artista siguiente"
              ariaLabel="Artistas confirmados"
              keepScrollableOnDesktop
              showArrowsOnDesktop
              inverseArrows
              mobileItemClassName="w-[85vw] max-w-[365px] md:w-[350px]"
              gapClassName="gap-5"
            >
              {FESTIVAL_OCTUBRE.artists.map((artist, index) => (
                <ArtistCard key={artist.name} artist={artist} index={index} />
              ))}
            </HorizontalCardRail>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-5 text-center text-sm text-white/55">Cinco sets consecutivos, sin pausas, desde las 14:00 hasta la medianoche.</div>
          </div>
        </section>

        <section id="cronograma" className="relative overflow-hidden bg-[#FFF0D5] px-6 py-16 text-[#003630] md:px-10 md:py-20">
          <TopographicLines className="pointer-events-none absolute -right-24 bottom-0 h-64 w-[34rem] text-[#FF5A1F]/12" />
          <div className="relative mx-auto max-w-5xl">
            <div className="text-center" data-reveal>
              <p className="mb-5 inline-block rounded-full bg-[#004B43] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-white">Sábado 31/10/2026</p>
              <h2 className="text-4xl leading-tight serif-title md:text-5xl">Horarios de la jornada</h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#003630]/65 md:text-base">Las puertas quedan abiertas durante toda la jornada: llegá a la hora que mejor te funcione.</p>
            </div>
            <div className="mt-10 grid gap-4 lg:grid-cols-[minmax(250px,.75fr)_1.25fr]" data-reveal data-delay="1">
              <article className="rounded-[1.75rem] border border-[#008C86]/25 bg-[#E2F5EE] p-7 shadow-[0_16px_38px_rgba(31,41,34,0.07)] md:p-8">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#008C86] text-white"><Clock3 size={19} aria-hidden="true" /></span>
                <p className="mt-6 text-4xl text-[#003630] serif-title">10:00</p>
                <h3 className="mt-2 text-lg font-bold text-[#003630]">Apertura de puertas</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#003630]/65">Llegá cuando quieras y empezá a disfrutar del lugar a tu ritmo.</p>
              </article>
              <article className="rounded-[1.75rem] border border-[#FF5A1F]/25 bg-[#FFE3D2] p-7 shadow-[0_16px_38px_rgba(72,42,60,0.07)] md:p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FF5A1F] text-white"><Music2 size={19} aria-hidden="true" /></span>
                  <div>
                    <h3 className="text-lg font-bold text-[#003630]">Sets en vivo</h3>
                    <p className="text-sm text-[#003630]/65">14:00–00:00 · cinco sets de dos horas, sin pausas</p>
                  </div>
                </div>
                <ol className="mt-6 divide-y divide-[#003630]/10">
                  {FESTIVAL_OCTUBRE.artists.map(artist => (
                    <li key={artist.name} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                      <span className="w-[6.75rem] shrink-0 text-sm font-bold tabular-nums text-[#B84B36]">{artist.setTime}</span>
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[#FF5A1F]" aria-hidden="true" />
                      <span className="min-w-0 font-semibold text-[#003630]">{artist.name}</span>
                      <span className="ml-auto hidden text-xs text-[#003630]/55 sm:inline">{artist.style.split(' · ').slice(1).join(' · ')}</span>
                    </li>
                  ))}
                </ol>
              </article>
            </div>
          </div>
        </section>

        <section id="temazcal" className="relative overflow-hidden bg-[#003A34] px-6 py-20 text-white md:px-10 md:py-28">
          <SunRings className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] text-[#FF6A00]/18" />
          <div className="mx-auto max-w-5xl text-center">
            <div data-reveal>
              <p className="mb-5 inline-block rounded-full bg-[#FF5A1F] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-white">Domingo 01/11/2026 · Cupo limitado</p>
              <h2 className="text-4xl leading-tight text-[#FFF8EA] serif-title md:text-5xl">Temazcal</h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/65 md:text-lg">Una ceremonia ancestral de conexión y purificación, que invita a hacer una pausa, escuchar el cuerpo e integrar lo vivido durante el fin de semana.</p>
            </div>
            <div className="mt-12 overflow-hidden rounded-[2rem] border border-[#FFD166]/20 bg-[#2A1D2A]" data-reveal data-delay="1">
              <img src={img('/uploads/temazcal.webp', 1400)} alt="Ceremonia de Temazcal en Pueblo Mágico" loading="lazy" width="1400" height="900" className="aspect-[16/8] w-full object-cover" />
              <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
                <p className="text-sm leading-relaxed text-white/65">La participación es opcional, requiere inscripción previa y tiene un valor adicional. Si estás embarazada o tenés una condición cardíaca, respiratoria o de presión, consultanos antes para evaluar si esta experiencia es adecuada para vos.</p>
                <a href={FESTIVAL_OCTUBRE.contact.general} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#FFD166]/35 px-5 py-2.5 text-sm font-semibold text-[#FFD166] transition hover:bg-[#FF6A00] hover:text-white"><MessageCircle size={16} aria-hidden="true" />Consultar por WhatsApp</a>
              </div>
            </div>
          </div>
        </section>



        <section id="lugar" className="relative overflow-hidden bg-[#FFF6E3] px-6 py-20 md:px-10 md:py-28">
          <TopographicLines className="pointer-events-none absolute -left-20 bottom-0 h-72 w-[36rem] text-[#008C86]/14" />
          <div className="mx-auto max-w-6xl text-center">
            <div className="mx-auto max-w-3xl" data-reveal>
              <Eyebrow>El lugar</Eyebrow>
              <h2 className="text-4xl leading-tight serif-title md:text-6xl">Pueblo Mágico,<br />Los Gigantes.</h2>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#16423D]/70 md:text-lg">Un ecolodge de montaña en las Sierras Grandes de Córdoba. Un espacio que ya respira lo que propone Raíz Sonora: naturaleza, comunidad y presencia.</p>
              <ul className="mx-auto mt-8 grid max-w-2xl gap-3 text-left text-sm text-[#16423D]/65 sm:grid-cols-2">
                {['A 90 km de Córdoba Capital', '200 hectáreas de reserva natural', 'Río, senderos y espacios abiertos', 'Alojamiento, camping y fogón', "Acceso fácil en todo tipo de vehículos"].map(item => (
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
              <img src={img('/uploads/domos_2.jpg', 700)} alt="Domos geodésicos entre las piedras y la vegetación de Pueblo Mágico" loading="lazy" width="700" height="800" className="aspect-square w-full rounded-[1.5rem] object-cover" />
              <img src={img('/uploads/flyfishing-refugio-exterior.jpg', 700)} alt="Frente del Refugio de Piedra integrado al paisaje de montaña" loading="lazy" width="700" height="800" className="aspect-square w-full rounded-[1.5rem] object-cover" />
            </div>
          </div>
        </section>

        <section id="entradas" className="relative overflow-hidden bg-[#FFFDF5] px-6 py-20 md:px-10 md:py-28">
          <SunRings className="pointer-events-none absolute -left-40 -top-36 h-[32rem] w-[32rem] text-[#FF6A00]/11" />
          <TopographicLines className="pointer-events-none absolute -bottom-12 -right-20 h-72 w-[36rem] text-[#E40067]/12" />
          <div className="relative mx-auto max-w-7xl">
            <div className="mx-auto mb-10 max-w-3xl text-center md:mb-12" data-reveal>
              <Eyebrow>Modalidades de acceso</Eyebrow>
              <h2 className="text-4xl serif-title md:text-6xl">Elegí cómo sumarte.</h2>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-[#16423D]/60">Vení por el día o elegí una o dos noches en camping, habitación o Domo. Todos los tickets con alojamiento incluyen desayuno.</p>
              <p className="mt-4 text-sm font-bold text-[#FF5A1F]">✨ pagá en 3 cuotas sin interés</p>
            </div>
            <p className="mb-5 text-center text-xs leading-relaxed text-[#16423D]/55 md:text-sm"><span className="font-semibold">Empezá por Pase por el Día</span> y deslizá o usá las flechas para comparar.</p>
            <div id="festival-access-options">
              <HorizontalCardRail
                previousLabel="Ver modalidad anterior"
                nextLabel="Ver modalidad siguiente"
                ariaLabel="Modalidades de acceso"
                keepScrollableOnDesktop
                showArrowsOnDesktop
                arrowPositionClassName="top-64 md:top-1/2"
                mobileItemClassName="w-[85vw] max-w-[350px] md:w-[320px] lg:w-[330px] xl:w-[340px]"
                gapClassName="gap-5"
              >
                {FESTIVAL_OCTUBRE.accessOptions.map((option, index) => (
                  <AccessCard key={option.title} option={option} index={index} />
                ))}
              </HorizontalCardRail>
            </div>
            <article className="relative mx-auto mt-8 max-w-xl overflow-hidden rounded-[1.75rem] border border-[#FF9F1C]/30 bg-[#FFF1C7] p-7 text-left shadow-[0_14px_35px_rgba(31,41,34,0.06)]" data-reveal data-delay="1">
              <span className="absolute inset-x-0 top-0 h-1.5 bg-[#FF9F1C]" aria-hidden="true" />
              <div className="mb-5 flex items-center justify-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/75 text-[#8B5A23] shadow-sm"><Sun size={18} aria-hidden="true" /></span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#8B5A23]">Gastronomía &amp; comunidad</h3>
              </div>
              <ul className="mx-auto max-w-md space-y-3">
                {['Buffet de comida artesanal todo el fin de semana', 'Barra de bebidas', 'Encuentro abierto a toda la familia', 'Opciones para venir por el día o quedarse'].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-[#16423D]/65"><span className="mt-1 shrink-0 text-[#8B5A23]">◆</span>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>


        <CelebrationMosaic />

        <section id="para-quien" className="relative overflow-hidden px-6 py-20 md:px-10 md:py-28" style={{ background: 'linear-gradient(145deg, #FFFDF5 0%, #FFE8D6 52%, #FFD38E 150%)' }}>
          <div className="pointer-events-none absolute -left-16 top-24 h-52 w-52 rounded-full bg-[#FF6A00]/12 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-16 bottom-16 h-64 w-64 rounded-full bg-[#E40067]/14 blur-3xl" aria-hidden="true" />
          <TopographicLines className="pointer-events-none absolute -right-24 top-0 h-72 w-[34rem] text-[#FF5A1F]/12" />
          <div className="relative mx-auto max-w-5xl">
            <div className="mb-14 text-center" data-reveal>
              <p className="mb-5 inline-block rounded-full bg-[#004B43] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white">¿Para quién es?</p>
              <h2 className="text-4xl leading-tight text-[#003630] serif-title md:text-5xl">Para quienes quieren celebrar distinto.<br /><span className="text-[#FF5A1F]">Y encontrarse de verdad.</span></h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#003630]/60">No necesitás experiencia previa ni venir con un grupo. Raíz Sonora está pensado para disfrutar la música, la naturaleza y el encuentro a tu propio ritmo.</p>
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
                <article key={title} className={`relative overflow-hidden rounded-[1.75rem] border p-8 text-left shadow-[0_16px_45px_rgba(72,42,60,0.08)] ${tone === 'green' ? 'border-[#008C86]/25 bg-[#E2F5EE]' : 'border-[#E40067]/25 bg-[#FFE3EF]'}`}>
                  <div className={`absolute inset-x-0 top-0 h-1.5 ${tone === 'green' ? 'bg-[#008C86]' : 'bg-[#FF5A1F]'}`} aria-hidden="true" />
                  <span className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full ${tone === 'green' ? 'bg-[#008C86] text-white' : 'bg-[#FF5A1F] text-white'}`}><Icon size={19} aria-hidden="true" /></span>
                  <h3 className="mt-5 text-center text-xl font-bold text-[#003630]">{title}</h3>
                  <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-[#003630]/60">{text}</p>
                  <ul className="mx-auto mt-6 max-w-md space-y-2.5">
                    {items.map(item => <li key={item} className="flex items-start gap-2.5 text-sm text-[#003630]/65"><span className="mt-1 shrink-0 text-[#FF5A1F]">◆</span>{item}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="equipo" className="relative overflow-hidden bg-[#FFFDF5] px-6 py-20 md:px-10 md:py-28">
          <TopographicLines className="pointer-events-none absolute -left-28 top-0 h-72 w-[36rem] text-[#E40067]/12" />
          <div className="mx-auto max-w-7xl">
            <div className="mb-14 text-center" data-reveal>
              <p className="mb-5 inline-block rounded-full bg-[#004B43] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.4em] text-white">Quiénes te acompañan</p>
              <h2 className="text-3xl leading-tight text-[#003630] serif-title md:text-4xl">Facilitadores, anfitriones y dirección musical</h2>
              <p className="mx-auto mt-4 max-w-lg text-base text-[#003630]/60">Un equipo y una comunidad de referentes que suman su energía a esta celebración.</p>
            </div>
            <p className="mb-5 text-center text-xs font-semibold leading-relaxed text-[#16423D]/65 md:text-sm">Deslizá o usá las flechas para conocer al equipo.</p>
            <HorizontalCardRail
              previousLabel="Ver persona anterior"
              nextLabel="Ver persona siguiente"
              ariaLabel="Equipo de Raíz Sonora"
              keepScrollableOnDesktop
              showArrowsOnDesktop
              mobileItemClassName="w-[85vw] max-w-[320px] md:w-[320px]"
              gapClassName="gap-5"
            >
              {FESTIVAL_OCTUBRE.team.map((member, index) => (
                <TeamCard key={member.fullName} member={member} index={index} />
              ))}
            </HorizontalCardRail>
            <div className="relative mt-16 overflow-hidden rounded-3xl bg-[#004B43] p-8 text-center text-white md:p-12" data-reveal data-delay="2">
              <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#FF6A00]/30 blur-[100px]" />
              <OrganicWave className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full text-[#FFD166]/16" />
              <div className="relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#FFD166]">Una coproducción de</p>
                <h3 className="mt-3 text-3xl serif-title md:text-4xl">Kintu × Pueblo Mágico</h3>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/65">Dos equipos que se encuentran para cuidar la producción, la hospitalidad y el sentido de una celebración creada en conexión con el lugar.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="preguntas" className="px-6 py-20 md:px-10 md:py-28" style={{ backgroundColor: C.cream }}>
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 text-center" data-reveal>
              <p className="mb-5 inline-block rounded-full bg-[#004B43] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white">Preguntas frecuentes</p>
              <h2 className="text-4xl leading-tight serif-title md:text-6xl">Todo lo que necesitás saber.</h2>
              <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-[#16423D]/60 md:text-base">¿Quedó alguna duda? Escribinos por WhatsApp y te ayudamos a elegir la mejor forma de vivir Raíz Sonora.</p>
            </div>
            <div className="space-y-3 md:space-y-4" data-reveal data-delay="1">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                const Icon = faq.Icon;
                return (
                  <div key={faq.question} className={`overflow-hidden rounded-2xl border bg-white transition ${isOpen ? 'border-[#FF6A00] shadow-sm' : 'border-[#004B43]/10'}`}>
                    <button type="button" className="flex w-full items-center gap-4 px-6 py-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF6A00] md:px-8 md:py-6" onClick={() => setOpenFaq(isOpen ? null : index)} aria-expanded={isOpen} aria-controls={`festival-faq-${index}`}>
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${isOpen ? 'bg-[#004B43] text-[#FFD166]' : 'bg-[#E40067]/[0.09] text-[#E40067]'}`}><Icon size={18} strokeWidth={1.8} aria-hidden="true" /></span>
                      <span className={`flex-1 text-sm font-bold leading-snug md:text-base ${isOpen ? 'text-[#004B43]' : 'text-[#003630]'}`}>{faq.question}</span>
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform ${isOpen ? 'rotate-180 bg-[#FF6A00] text-white' : 'bg-[#004B43]/[0.06] text-[#004B43]'}`}><ChevronDown size={16} aria-hidden="true" /></span>
                    </button>
                    <div id={`festival-faq-${index}`} className={`grid transition-[grid-template-rows] duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className="min-h-0 overflow-hidden"><div className="px-6 pb-6 md:pl-[5rem] md:pr-8"><div className="mb-4 h-px w-full bg-[#123B2D]/10" /><div className="text-sm leading-relaxed text-[#16423D]/65">{faq.answer}</div></div></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-10 text-center" data-reveal data-delay="2">
              <a href={FESTIVAL_OCTUBRE.contact.general} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#004B43]/25 px-5 py-2.5 text-sm font-semibold text-[#004B43] transition hover:bg-[#004B43] hover:text-white"><MessageCircle size={17} aria-hidden="true" />Escribirnos</a>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#004B43] px-6 py-20 text-white md:px-10 md:py-28">
          <img src={img('/uploads/atardeser/comunidad.jpeg', 1900)} alt="" loading="lazy" width="1900" height="1100" className="absolute inset-0 h-full w-full object-cover object-center" aria-hidden="true" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(115deg, rgba(27,21,32,0.97) 0%, rgba(72,42,60,0.88) 52%, rgba(195,93,60,0.82) 100%)' }} />
          <div className="pointer-events-none absolute -left-16 bottom-[-4rem] h-64 w-64 rounded-full bg-[#FF6A00]/40 blur-3xl" aria-hidden="true" />
          <SunRings className="pointer-events-none absolute -right-28 -top-28 h-[30rem] w-[30rem] text-[#FFD166]/20" />
          <OrganicWave className="pointer-events-none absolute inset-x-0 bottom-0 h-32 w-full text-[#FFD166]/18" />
          <div className="relative mx-auto max-w-5xl text-center" data-reveal>
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#FF6A00] text-white"><Waves size={24} aria-hidden="true" /></div>
            <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.32em] text-[#FFD166]">Movimiento · Conexión · Naturaleza · Montaña</p>
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

      {belowFoldReady && <Footer />}
      <WhatsAppButton />
      {belowFoldReady && <CookieBanner />}

    </div>
  );
};

export default FestivalOctubre;
