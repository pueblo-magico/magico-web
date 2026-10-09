import React, { useState, useEffect, useRef } from 'react';
import {
  Sun, Footprints, Heart, Flame, Leaf, Compass, BookOpen,
  Music, Wind, Moon, Users, Target, Star, Camera, Video,
  type LucideIcon,
} from 'lucide-react';
import { img } from './lib/img';
import { WA_MAGICO } from './data/config';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

const C = {
  green:  '#005333',
  gold:   '#D4AF37',
  terra:  '#AA3E11',
  cream:  '#FDFBF7',
  dark:   '#2A1708',
  muted:  '#6B4A33',
  faint:  '#8B6347',
};

const WA_HREF = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent(
  '¡Hola! Me gustaría explorar la posibilidad de organizar una experiencia con Pueblo Mágico. ¿Podemos hablar?'
)}`;

// ─── Types ────────────────────────────────────────────────────────────────────
type Activity = { Icon: LucideIcon; title: string; desc: string };

// ─── Activity data ─────────────────────────────────────────────────────────────
const BASE_ACTIVITIES: Activity[] = [
  { Icon: Sun,       title: 'Meditación matutina',     desc: 'Práctica guiada al amanecer. Silencio, respiración y presencia en la montaña.' },
  { Icon: Footprints,title: 'Caminata consciente',     desc: 'Senderos de gran belleza escénica — guiados o libres según el grupo.' },
  { Icon: Heart,     title: 'Yoga & movimiento',       desc: 'Salón panorámico y espacios al aire libre para la práctica.' },
  { Icon: Flame,     title: 'Fogón & estrellas',       desc: 'Encuentro nocturno alrededor del fuego bajo uno de los cielos más limpios del país.' },
  { Icon: Leaf,      title: 'Gastronomía regenerativa',desc: 'Cocina de autor con productos locales, orgánicos y de estación.' },
  { Icon: Compass,   title: 'Huerta & tierra',         desc: 'Contacto directo con el ciclo de los alimentos y la vida del ecolodge.' },
  { Icon: BookOpen,  title: 'Reset Vital',             desc: 'Retiro autoguiado incluido en toda estadía. Herramientas para la reconexión profunda.' },
];

const EXTRA_ACTIVITIES: Activity[] = [
  { Icon: Music,    title: 'Armonización sonora',      desc: 'Baño de cuencos tibetanos y sonidos sanadores. Relajación profunda y expansión.' },
  { Icon: Wind,     title: 'Cabalgatas',               desc: 'Recorridos a caballo por la reserva y los paisajes de la Pampa de Achala.' },
  { Icon: Moon,     title: 'Temazcal ceremonial',      desc: 'Ceremonia ancestral de purificación y renacimiento en la montaña.' },
  { Icon: Users,    title: 'Constelaciones familiares',desc: 'Trabajo sistémico grupal facilitado por profesionales especializados.' },
  { Icon: Target,   title: 'Arquería intuitiva',       desc: 'Práctica meditativa con arco y flecha. Foco, intención y presencia plena.' },
  { Icon: Star,     title: 'Astroturismo',             desc: 'Observación del cielo nocturno sin contaminación lumínica — Vía Láctea a simple vista.' },
  { Icon: Camera,   title: 'Fotografía de naturaleza', desc: 'Sesión guiada en entornos únicos de la reserva para todos los niveles.' },
  { Icon: Video,    title: 'Registro audiovisual',     desc: 'Captura profesional del retiro para compartir en redes y recordar siempre.' },
  { Icon: BookOpen, title: 'Talleres especializados',  desc: 'Clases y talleres a medida — yoga, danza, respiración, mandala y más.' },
];

// ─── Carousel ─────────────────────────────────────────────────────────────────
const PER_PAGE = 3;

const ActivityCarousel: React.FC<{ items: Activity[]; accent: string }> = ({ items, accent }) => {
  const totalPages = Math.ceil(items.length / PER_PAGE);
  const [page, setPage] = useState(0);
  const [visible, setVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const pageRef = useRef(page);
  useEffect(() => { pageRef.current = page; }, [page]);

  const goTo = (p: number) => {
    setVisible(false);
    setTimeout(() => { setPage(p); setVisible(true); }, 230);
  };

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      const next = (pageRef.current + 1) % totalPages;
      setVisible(false);
      setTimeout(() => { setPage(next); setVisible(true); }, 230);
    }, 4200);
    return () => clearInterval(t);
  }, [paused, totalPages]);

  const shown = Array.from({ length: PER_PAGE }, (_, i) =>
    items[(page * PER_PAGE + i) % items.length]
  );

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-5"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 230ms ease' }}
      >
        {shown.map((act) => {
          const Icon = act.Icon;
          return (
            <div
              key={act.title}
              className="rounded-2xl p-7 bg-white shadow-sm border"
              style={{ borderColor: `${accent}20` }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: `${accent}10` }}
              >
                <Icon size={20} color={accent} />
              </div>
              <h3 className="font-bold text-base mb-2" style={{ color: C.dark }}>{act.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{act.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-5 mt-7">
        <button
          onClick={() => goTo((page - 1 + totalPages) % totalPages)}
          className="w-9 h-9 rounded-full border flex items-center justify-center text-xl leading-none transition-opacity hover:opacity-70"
          style={{ borderColor: `${accent}35`, color: accent }}
          aria-label="Anterior"
        >‹</button>

        <div className="flex gap-2 items-center">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: i === page ? 24 : 8,
                backgroundColor: i === page ? accent : `${accent}28`,
              }}
              aria-label={`Página ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => goTo((page + 1) % totalPages)}
          className="w-9 h-9 rounded-full border flex items-center justify-center text-xl leading-none transition-opacity hover:opacity-70"
          style={{ borderColor: `${accent}35`, color: accent }}
          aria-label="Siguiente"
        >›</button>
      </div>
    </div>
  );
};

// ─── Costos ────────────────────────────────────────────────────────────────────
const COSTS = [
  { concepto: 'Lugar / espacio físico',       quien: 'Nosotros',    tipo: 'fijo' },
  { concepto: 'Alojamiento (si aplica)',     quien: 'Nosotros',    tipo: 'fijo' },
  { concepto: 'Alimentación (si aplica)',    quien: 'Nosotros',    tipo: 'fijo' },
  { concepto: 'Infraestructura y salones',   quien: 'Nosotros',    tipo: 'fijo' },
  { concepto: 'Actividades y talleres',      quien: 'A acordar',   tipo: 'variable' },
  { concepto: 'Estrategia y copy',           quien: 'Nosotros',    tipo: 'variable' },
  { concepto: 'Piezas visuales',             quien: 'Nosotros',    tipo: 'variable' },
  { concepto: 'Inscripciones y logística',   quien: 'Nosotros',    tipo: 'variable' },
  { concepto: 'Registro audiovisual',        quien: 'Nosotros',    tipo: 'variable' },
  { concepto: 'Publicidad en redes',         quien: '50% / 50%',         tipo: 'ads' },
];

// ─── Comunidades ───────────────────────────────────────────────────────────────
const ACCOUNTS = [
  {
    handle: 'Tu grupo · tu gente',
    nombre: 'Tu alcance',
    seguidores: '+vos',
    desc: 'Tu comunidad, equipo o clientes — las personas que ya te conocen y confían en lo que hacés.',
    color: C.gold,
    bg: 'rgba(212,175,55,0.06)',
    border: 'rgba(212,175,55,0.25)',
  },
  {
    handle: '@pueblomagico__',
    nombre: 'Pueblo Mágico',
    seguidores: '36K',
    desc: 'El espacio — una comunidad que busca experiencias transformadoras en la naturaleza.',
    color: C.green,
    bg: 'rgba(0,83,51,0.05)',
    border: 'rgba(0,83,51,0.2)',
  },
  {
    handle: '@somoskintu_',
    nombre: 'Kintu',
    seguidores: '28K',
    desc: 'La producción — referentes de bienestar, facilitadores y buscadores de experiencias.',
    color: C.green,
    bg: 'rgba(0,83,51,0.05)',
    border: 'rgba(0,83,51,0.2)',
  },
];

// ─── Destinos ──────────────────────────────────────────────────────────────────
const DESTINOS = [
  { nombre: 'Patagonia',           tag: 'Argentina',          foto: 'https://images.pexels.com/photos/28410690/pexels-photo-28410690.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop', pos: 'center center' },
  { nombre: 'Talampaya',           tag: 'Argentina',          foto: 'https://images.pexels.com/photos/7973834/pexels-photo-7973834.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop', pos: 'center center' },
  { nombre: 'Valle Sagrado',       tag: 'Perú',               foto: 'https://images.pexels.com/photos/259967/pexels-photo-259967.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop', pos: 'center center' },
  { nombre: 'Selva Peruana',       tag: 'Perú',               foto: 'https://images.pexels.com/photos/36302293/pexels-photo-36302293.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop', pos: 'center center' },
  { nombre: 'Colombia',            tag: 'Sudamérica',         foto: 'https://images.pexels.com/photos/35211242/pexels-photo-35211242.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop', pos: 'center center' },
  { nombre: 'Costa Rica',          tag: 'Centroamérica',      foto: 'https://images.pexels.com/photos/6198925/pexels-photo-6198925.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop', pos: 'center center' },
  { nombre: 'Brasil',              tag: 'Sudamérica',         foto: 'https://images.pexels.com/photos/35660580/pexels-photo-35660580.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop', pos: 'center center' },
  { nombre: 'México',              tag: 'Mesoamérica',        foto: 'https://images.pexels.com/photos/11447571/pexels-photo-11447571.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop', pos: 'center center' },
  { nombre: 'Cataratas del Iguazú',tag: 'Argentina · Brasil', foto: 'https://images.pexels.com/photos/8242961/pexels-photo-8242961.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop', pos: 'center 40%' },
  { nombre: 'Bali',                tag: 'Indonesia',          foto: 'https://images.pexels.com/photos/19137460/pexels-photo-19137460.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop', pos: 'center center', portrait: true },
  { nombre: 'India',               tag: 'Asia',               foto: 'https://images.pexels.com/photos/31203531/pexels-photo-31203531.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop', pos: 'center 30%', portrait: true },
  { nombre: 'Los Gigantes',        tag: 'Córdoba, Argentina', foto: 'https://larocax.tur.ar/wp-content/uploads/2024/01/20220620_091049-scaled.jpg', pos: 'center center' },
];
type Destino = typeof DESTINOS[0];
type Slide = { type: 'single'; d: Destino } | { type: 'pair'; d1: Destino; d2: Destino };
const SLIDES: Slide[] = (() => {
  const slides: Slide[] = [];
  let i = 0;
  while (i < DESTINOS.length) {
    if (DESTINOS[i].portrait && i + 1 < DESTINOS.length && DESTINOS[i + 1].portrait) {
      slides.push({ type: 'pair', d1: DESTINOS[i], d2: DESTINOS[i + 1] });
      i += 2;
    } else {
      slides.push({ type: 'single', d: DESTINOS[i] });
      i++;
    }
  }
  return slides;
})();
const SLIDE_BASE: number[] = (() => {
  const bases: number[] = [];
  let acc = 0;
  for (const s of SLIDES) { bases.push(acc); acc += s.type === 'pair' ? 2 : 1; }
  return bases;
})();

// ─── Space photo carousel ──────────────────────────────────────────────────────
const SPACE_IMGS = [
  { src: '/uploads/469280911_444096748740233_2818770490495002077_n.webp', alt: 'Experiencia grupal en Pueblo Mágico' },
  { src: '/uploads/dji_0074.webp',   alt: 'Vista aérea Pueblo Mágico' },
  { src: '/uploads/domos_2.jpg',     alt: 'Domos geodésicos' },
  { src: '/uploads/refu.webp',       alt: 'Refugio de Piedra' },
  { src: '/uploads/exterior.webp',   alt: 'Exterior del ecolodge' },
];

// ─── Page ──────────────────────────────────────────────────────────────────────
const OrganizamosTuExperiencia: React.FC = () => {
  const [spaceIdx, setSpaceIdx] = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    document.title = 'Organizamos tu Experiencia — Pueblo Mágico';
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSpaceIdx(i => (i + 1) % SPACE_IMGS.length), 1600);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSlideIdx(i => (i + 1) % SLIDES.length), 1100);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ backgroundColor: C.cream, color: C.dark }} className="overflow-x-hidden">

      <Header />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-end overflow-hidden">
        <img
          src={img('/uploads/dji_0074.webp', 1800)}
          alt="Pueblo Mágico — Sierras Grandes de Córdoba"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-black/35 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent pointer-events-none" />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-12 pb-20 md:pb-28" data-reveal>
          <div className="flex flex-wrap gap-2 mb-7">
            {['Coach', 'Mentor', 'Artista', 'Terapeuta', 'Facilitador/a', 'Instructor/a', 'Emprendedor/a', 'Empresario/a', 'Líder'].map(t => (
              <span key={t} className="bg-white/15 backdrop-blur-sm border border-white/25 text-white/80 px-3 py-1 rounded-full text-[10px] tracking-widest uppercase font-semibold">{t}</span>
            ))}
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl serif-title leading-tight mb-6 text-white">
            Si tenés una comunidad,<br />
            <span style={{ color: C.gold }}>tenemos mucho para aportarte</span>
          </h1>
          <p className="text-white/70 text-base md:text-lg leading-relaxed mb-10 max-w-xl">
            Desde una tarde hasta un viaje de varios días. Co-creamos la experiencia que tu comunidad necesita vivir — con propósito, con impacto y sin que recaiga todo sobre vos.
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              { v: 'Una tarde', l: 'hasta un viaje' },
              { v: '+15', l: 'años de experiencia' },
              { v: '100%', l: 'a medida' },
            ].map(s => (
              <div
                key={s.l}
                className="flex items-center gap-2 rounded-full px-4 py-2.5 border backdrop-blur-sm"
                style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.25)' }}
              >
                <span className="text-xl font-bold serif-title text-white">{s.v}</span>
                <span className="text-[10px] tracking-widest uppercase text-white/60">{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTRO ── */}
      <section className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-4xl mx-auto" data-reveal>
          <div className="text-center mb-14">
            <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold shadow-sm"
              style={{ backgroundColor: C.green }}>
              La propuesta
            </p>
            <h2 className="text-3xl md:text-5xl serif-title mb-6 leading-tight" style={{ color: C.green }}>
              Vos ya sabés lo que le está pasando<br className="hidden md:block" /> a tu comunidad
            </h2>
            <p className="text-base md:text-xl leading-relaxed max-w-2xl mx-auto" style={{ color: C.muted }}>
              Conocés sus dolores, sus búsquedas, lo que los traba. Porque ya lo viviste, o tenés las herramientas para acompañarlos.
            </p>
          </div>

          {/* Insight central */}
          <div className="rounded-3xl p-10 md:p-14 mb-12 text-center" style={{ backgroundColor: 'rgba(0,83,51,0.04)', border: '1px solid rgba(0,83,51,0.1)' }} data-reveal data-delay="1">
            <p className="text-2xl md:text-3xl serif-title leading-snug mb-4" style={{ color: C.green }}>
              Lo que falta es el espacio, el tiempo<br className="hidden md:block" /> y la experiencia diseñada para que eso suceda de verdad.
            </p>
            <p className="text-base md:text-lg font-semibold" style={{ color: C.gold }}>
              Eso es exactamente lo que nosotros ponemos.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-5" data-reveal data-delay="2">
            {[
              {
                label: 'Qué queremos evitar',
                text:  'Que el proceso sea abrumador, solitario y poco rentable — que recaiga todo sobre vos.',
                bg: C.terra,
              },
              {
                label: 'Qué queremos lograr',
                text:  'Repartir responsabilidades, disfrutar el proceso, multiplicar el impacto y celebrar juntos el resultado.',
                bg: C.green,
              },
            ].map(item => (
              <div key={item.label} className="flex-1 rounded-2xl p-8 text-left shadow-md" style={{ backgroundColor: item.bg }}>
                <p className="text-xl font-bold mb-4 text-white/90">{item.label}</p>
                <p className="text-base leading-relaxed text-white/80">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARA QUIÉN ── */}
      <section className="py-16 md:py-20 px-6" style={{ backgroundColor: '#F7F5F0' }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[10px] tracking-[0.35em] uppercase font-semibold mb-8" style={{ color: 'rgba(0,83,51,0.5)' }}>
            Sea lo que seas que hagas — si tenés una comunidad, este es tu lugar
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-reveal>
            {[
              { tipo: 'Coach / Mentor',          desc: 'Jornadas de claridad, retiros de breakthrough y vivencias que convierten insights en acción real.' },
              { tipo: 'Artista / Músico',         desc: 'Experiencias creativas en la naturaleza donde la inspiración y la comunidad se potencian juntas.' },
              { tipo: 'Terapeuta / Sanador/a',    desc: 'Retiros de sanación profunda con el entorno natural como co-facilitador de cada proceso.' },
              { tipo: 'Instructor / Profesor',    desc: 'Campamentos, talleres y jornadas que llevan el aprendizaje fuera del aula y lo hacen memorable.' },
              { tipo: 'Facilitador/a',            desc: 'Espacios grupales potentes, diseñados para que tu metodología tenga el entorno que merece.' },
              { tipo: 'Emprendedor/a',            desc: 'Experiencias para tu comunidad de clientes, seguidores o equipo que generan pertenencia y fidelidad.' },
              { tipo: 'Empresario/a · Empresa',   desc: 'Team buildings, retiros de cultura y vivencias que construyen confianza, propósito y visión compartida.' },
              { tipo: 'Líder / Referente',        desc: 'Cualquier persona con un grupo que la sigue — si tenés gente que te escucha, podemos crear algo juntos.' },
            ].map((item, i) => (
              <div key={item.tipo} data-reveal data-delay={String((i % 4) + 1)}
                className="rounded-2xl p-6 bg-white border"
                style={{ borderColor: 'rgba(0,83,51,0.1)' }}>
                <p className="font-bold text-sm mb-2" style={{ color: C.green }}>{item.tipo}</p>
                <p className="text-xs leading-relaxed" style={{ color: C.muted }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORMATOS ── */}
      <section className="py-20 md:py-28 px-6" style={{ backgroundColor: '#F7F5F0' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14" data-reveal>
            <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold shadow-sm"
              style={{ backgroundColor: C.green }}>
              Formatos disponibles
            </p>
            <h2 className="text-3xl md:text-5xl serif-title mb-4 leading-tight" style={{ color: C.green }}>
              Desde una tarde hasta un viaje
            </h2>
            <p className="text-base leading-relaxed max-w-lg mx-auto" style={{ color: C.muted }}>
              El formato lo elegimos según lo que tu comunidad necesita. A más tiempo, más impacto real.
            </p>
          </div>

          {/* Primer contacto */}
          <div className="grid md:grid-cols-2 gap-4 mb-4" data-reveal>
            <div className="rounded-2xl p-6 border text-left flex gap-5 items-start" style={{ borderColor: '#E5DDD5', backgroundColor: C.cream }}>
              <div>
                <p className="text-[10px] tracking-widest uppercase font-semibold mb-1" style={{ color: '#A0866E' }}>Primer contacto</p>
                <p className="text-lg font-bold serif-title mb-2" style={{ color: C.muted }}>Una tarde · 2 a 4 hs</p>
                <p className="text-sm leading-relaxed" style={{ color: C.faint }}>Workshop, charla o actividad puntual. Ideal para testear la propuesta con tu comunidad sin gran inversión.</p>
              </div>
            </div>
            <div className="rounded-2xl p-6 border text-left flex gap-5 items-start" style={{ borderColor: '#E5DDD5', backgroundColor: C.cream }}>
              <div>
                <p className="text-[10px] tracking-widest uppercase font-semibold mb-1" style={{ color: '#A0866E' }}>Jornada</p>
                <p className="text-lg font-bold serif-title mb-2" style={{ color: C.muted }}>Un día completo · 6 a 8 hs</p>
                <p className="text-sm leading-relaxed" style={{ color: C.faint }}>Una experiencia completa de principio a fin. El grupo llega, vive y se va transformado — sin pernoctar.</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4" data-reveal data-delay="1">
            {/* 3 días */}
            <div className="rounded-2xl p-7 border text-left" style={{ borderColor: '#E5DDD5', backgroundColor: C.cream }}>
              <p className="text-[10px] tracking-widest uppercase font-semibold mb-2" style={{ color: '#A0866E' }}>Retiro corto</p>
              <p className="text-xl font-bold serif-title mb-3" style={{ color: C.muted }}>3 días · 2 noches</p>
              <p className="text-sm leading-relaxed mb-5" style={{ color: C.faint }}>
                La práctica se instala. El grupo se conoce en profundidad y la transformación tiene tiempo de comenzar a operar.
              </p>
              <div className="border-t pt-4 space-y-1.5" style={{ borderColor: '#E5DDD5' }}>
                <p className="text-[10px] font-semibold tracking-wide" style={{ color: '#A0866E' }}>— Impacto real en poco tiempo</p>
                <p className="text-[10px] font-semibold tracking-wide" style={{ color: '#A0866E' }}>— Ticket accesible para la comunidad</p>
                <p className="text-[10px] font-semibold tracking-wide" style={{ color: '#A0866E' }}>— Muchos llevan este como primer retiro</p>
              </div>
            </div>

            {/* 4-6 días */}
            <div
              className="rounded-2xl p-7 border text-left relative"
              style={{ borderColor: 'rgba(0,83,51,0.35)', backgroundColor: 'rgba(0,83,51,0.05)' }}
            >
              <span
                className="absolute top-4 right-4 text-[9px] tracking-widest uppercase font-bold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: C.green, color: C.gold }}
              >
                Recomendado
              </span>
              <p className="text-[10px] tracking-widest uppercase font-semibold mb-2" style={{ color: C.green }}>Inmersión profunda</p>
              <p className="text-xl font-bold serif-title mb-3" style={{ color: C.green }}>4 a 6 días</p>
              <p className="text-sm leading-relaxed mb-5" style={{ color: '#3D2516' }}>
                La práctica se instala y el grupo se teje de verdad. El impacto dura semanas y genera conversación orgánica.
              </p>
              <div className="border-t pt-4 space-y-1.5" style={{ borderColor: 'rgba(0,83,51,0.15)' }}>
                <p className="text-[10px] font-semibold tracking-wide" style={{ color: C.green }}>— Mayor flujo económico por persona</p>
                <p className="text-[10px] font-semibold tracking-wide" style={{ color: C.green }}>— Mucho menos competencia en el mercado</p>
                <p className="text-[10px] font-semibold tracking-wide" style={{ color: C.green }}>— Contenido y recuerdo que duran semanas</p>
              </div>
            </div>

            {/* +7 días */}
            <div
              className="rounded-2xl p-7 border text-left relative"
              style={{ borderColor: 'rgba(212,175,55,0.45)', backgroundColor: 'rgba(212,175,55,0.05)' }}
            >
              <span
                className="absolute top-4 right-4 text-[9px] tracking-widest uppercase font-bold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(212,175,55,0.15)', color: '#8B6A00' }}
              >
                Máximo impacto
              </span>
              <p className="text-[10px] tracking-widest uppercase font-semibold mb-2" style={{ color: '#8B6A00' }}>Viaje con propósito</p>
              <p className="text-xl font-bold serif-title mb-3" style={{ color: '#4A3210' }}>+7 días</p>
              <p className="text-sm leading-relaxed mb-5" style={{ color: '#3D2516' }}>
                Una experiencia que tu comunidad recuerda y comparte por años. El formato que construye vínculo real.
              </p>
              <div className="border-t pt-4 space-y-1.5" style={{ borderColor: 'rgba(212,175,55,0.25)' }}>
                <p className="text-[10px] font-semibold tracking-wide" style={{ color: '#8B6A00' }}>— Ticket premium, mejor margen</p>
                <p className="text-[10px] font-semibold tracking-wide" style={{ color: '#8B6A00' }}>— Casi sin competencia en el mercado</p>
                <p className="text-[10px] font-semibold tracking-wide" style={{ color: '#8B6A00' }}>— Transformación real, vínculo duradero</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CAROUSEL 1: ACTIVIDADES BASE ── */}
      <section className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12" data-reveal>
            <span className="inline-block text-white px-3 py-1.5 rounded-full text-[10px] tracking-[0.4em] uppercase mb-4 font-semibold"
              style={{ backgroundColor: C.green }}>
              Incluido en toda experiencia
            </span>
            <h2 className="text-3xl md:text-4xl serif-title mb-3" style={{ color: C.green }}>
              El ritmo que sostiene la transformación
            </h2>
            <p className="text-sm max-w-md mx-auto" style={{ color: C.faint }}>
              Estas actividades forman el marco del día. Creamos el contenedor para que lo que vos traés tenga donde aterrizar.
            </p>
          </div>
          <ActivityCarousel items={BASE_ACTIVITIES} accent={C.green} />
        </div>
      </section>

      {/* ── CAROUSEL 2: EXTRAS ── */}
      <section className="py-20 md:py-28 px-6" style={{ backgroundColor: '#FAF7F2' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12" data-reveal>
            <span className="inline-block px-3 py-1.5 rounded-full text-[10px] tracking-[0.4em] uppercase mb-4 font-semibold"
              style={{ backgroundColor: 'rgba(212,175,55,0.18)', color: '#7A5C00' }}>
              Suma lo que tu comunidad necesita
            </span>
            <h2 className="text-3xl md:text-4xl serif-title mb-3" style={{ color: C.dark }}>
              Herramientas extra para ir más profundo
            </h2>
            <p className="text-sm max-w-lg mx-auto" style={{ color: C.faint }}>
              Elegimos juntos qué agregar según los dolores y las búsquedas de tu grupo. Cada extra está pensado para amplificar lo que vos ya traés.
            </p>
          </div>
          <ActivityCarousel items={EXTRA_ACTIVITIES} accent="#8B6A00" />
        </div>
      </section>

      {/* ── ROLES ── */}
      <section className="py-24 md:py-36 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14" data-reveal>
            <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold shadow-sm"
              style={{ backgroundColor: C.green }}>
              ¿Qué aportamos y qué aportás?
            </p>
            <h2 className="text-3xl md:text-5xl serif-title leading-tight mb-4" style={{ color: C.green }}>
              Vos llegás con tu propósito.<br />El resto corre por nuestra cuenta.
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: C.muted }}>
              La idea es que llegues tranquilo/a, relajado/a y con tu comunidad lista para vivir la experiencia.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 mb-16" data-reveal data-delay="1">
            {/* Tu aporte */}
            <div className="border border-amber-200 rounded-2xl p-8 bg-amber-50/40">
              <p className="text-base font-bold mb-6" style={{ color: C.gold }}>Tu aporte</p>
              <ul className="space-y-4">
                {[
                  'Tu comunidad, equipo o grupo y tu trayectoria',
                  'Diseño y facilitación de las actividades propias de tu propuesta',
                  'Convocatoria a tu gente para el retiro, jornada o viaje',
                  'Tu presencia, tu saber, tu energía, tu visión',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-base leading-relaxed" style={{ color: '#3D2516' }}>
                    <span className="mt-1 flex-shrink-0 text-amber-400">◆</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Nuestro aporte */}
            <div className="border rounded-2xl p-8" style={{ borderColor: 'rgba(0,83,51,0.2)', backgroundColor: 'rgba(0,83,51,0.04)' }}>
              <p className="text-base font-bold mb-6" style={{ color: C.green }}>Nuestro aporte</p>
              <ul className="space-y-4">
                {[
                  'El espacio, el hospedaje y la gastronomía completa',
                  'Diseño y anfitrionazgo de la experiencia junto con vos',
                  'Estrategia de lanzamiento en redes sociales',
                  'Copy, guiones y piezas visuales para comunicación',
                  'Logística integral: inscripciones, coordinación y comunicación',
                  'Tecnología, IA y project management de punta a punta',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-base leading-relaxed" style={{ color: '#3D2516' }}>
                    <span className="mt-1 flex-shrink-0" style={{ color: C.green }}>◆</span>
                    {item}
                  </li>
                ))}
                <li className="flex items-start gap-3 mt-5 pt-5 border-t" style={{ borderColor: 'rgba(0,83,51,0.12)' }}>
                  <span className="mt-1 flex-shrink-0 text-amber-500">✦</span>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base font-semibold" style={{ color: C.dark }}>Opcionales que elevan la experiencia</span>
                      <span className="text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'rgba(212,175,55,0.15)', color: '#B8960A' }}>Opcional</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['Armonización sonora', 'Temazcal', 'Cabalgatas', 'Arquería', 'Astroturismo', 'Registro audiovisual', 'y más...'].map(opt => (
                        <span key={opt} className="text-[11px] px-3 py-1 rounded-full border font-medium"
                          style={{ borderColor: 'rgba(212,175,55,0.3)', color: C.muted, backgroundColor: 'rgba(212,175,55,0.06)' }}>
                          {opt}
                        </span>
                      ))}
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* ── MODELO ECONÓMICO ── */}
          <div data-reveal data-delay="2">
            <div className="text-center mb-8">
              <p className="text-[10px] tracking-[0.4em] uppercase mb-3 font-bold" style={{ color: C.green }}>Modelo económico</p>
              <h3 className="text-2xl md:text-3xl serif-title" style={{ color: C.green }}>
                Así se reparten los costos y las ganancias
              </h3>
              <p className="font-serif italic mt-3" style={{ color: C.muted }}>Cuentas claras, alianzas largas.</p>
              <p className="text-sm mt-2 max-w-lg mx-auto leading-relaxed" style={{ color: C.faint }}>
                <strong style={{ color: C.dark }}>Nada de esto es inamovible</strong> — la idea es encontrar un modelo que valore a ambas partes.
              </p>
            </div>

            <div className="border rounded-2xl overflow-hidden" style={{ borderColor: 'rgba(0,83,51,0.15)' }}>
              <div className="grid grid-cols-3 text-white px-6 py-3" style={{ backgroundColor: C.green }}>
                <span className="text-[10px] tracking-widest uppercase text-white/60">Concepto</span>
                <span className="text-[10px] tracking-widest uppercase text-white/60">Cubierto por</span>
                <span className="text-[10px] tracking-widest uppercase text-white/60 text-right">Tipo</span>
              </div>

              <div className="px-6 py-2 border-b" style={{ backgroundColor: 'rgba(0,83,51,0.04)', borderColor: 'rgba(0,83,51,0.1)' }}>
                <span className="text-[10px] tracking-widest uppercase font-semibold" style={{ color: C.green, opacity: 0.6 }}>Costos fijos</span>
              </div>
              {COSTS.filter(c => c.tipo === 'fijo').map((row, i) => (
                <div key={row.concepto} className={`grid grid-cols-3 px-6 py-3.5 border-b items-center ${i % 2 === 0 ? 'bg-white' : 'bg-amber-50/30'}`}
                  style={{ borderColor: 'rgba(0,83,51,0.08)' }}>
                  <span className="text-base" style={{ color: '#3D2516' }}>{row.concepto}</span>
                  <span className="text-sm font-medium" style={{ color: C.green }}>{row.quien}</span>
                  <span className="text-[10px] tracking-wider uppercase text-right" style={{ color: C.faint }}>fijo</span>
                </div>
              ))}

              <div className="px-6 py-2 border-b" style={{ backgroundColor: 'rgba(0,83,51,0.04)', borderColor: 'rgba(0,83,51,0.1)' }}>
                <span className="text-[10px] tracking-widest uppercase font-semibold" style={{ color: C.green, opacity: 0.6 }}>Costos variables</span>
              </div>
              {COSTS.filter(c => c.tipo === 'variable').map((row, i) => (
                <div key={row.concepto} className={`grid grid-cols-3 px-6 py-3.5 border-b items-center ${i % 2 === 0 ? 'bg-white' : 'bg-amber-50/30'}`}
                  style={{ borderColor: 'rgba(0,83,51,0.08)' }}>
                  <span className="text-base" style={{ color: '#3D2516' }}>{row.concepto}</span>
                  <span className="text-sm font-medium" style={{ color: C.green }}>{row.quien}</span>
                  <span className="text-[10px] tracking-wider uppercase text-right" style={{ color: C.faint }}>variable</span>
                </div>
              ))}

              {COSTS.filter(c => c.tipo === 'ads').map(row => (
                <div key={row.concepto} className="grid grid-cols-3 px-6 py-3.5 border-b items-center bg-amber-50/20"
                  style={{ borderColor: 'rgba(0,83,51,0.08)' }}>
                  <div>
                    <span className="text-base" style={{ color: '#3D2516' }}>{row.concepto}</span>
                    <p className="text-[10px] mt-0.5" style={{ color: C.faint }}>No es el foco — si se invierte, va al 50/50</p>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: C.green }}>{row.quien}</span>
                  <span className="text-[10px] tracking-wider uppercase text-right" style={{ color: C.faint }}>compartido</span>
                </div>
              ))}

              <div className="px-6 py-5" style={{ backgroundColor: 'rgba(212,175,55,0.08)', borderTop: '2px solid rgba(212,175,55,0.3)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-base font-bold" style={{ color: C.dark }}>Tu inversión mínima para el lanzamiento</span>
                    <p className="text-sm mt-1.5 max-w-xs leading-relaxed" style={{ color: C.muted }}>
                      Un adelanto del <strong>10% del objetivo mínimo de inscripciones</strong> que se descuenta de tu parte de las ganancias.
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-2xl font-bold serif-title" style={{ color: C.gold }}>10%</span>
                    <p className="text-[10px] tracking-widest uppercase mt-0.5" style={{ color: C.faint }}>del objetivo</p>
                  </div>
                </div>
              </div>
            </div>

            {/* División de ganancias */}
            <div className="mt-5 border rounded-2xl overflow-hidden" style={{ borderColor: 'rgba(0,83,51,0.15)' }}>
              <div className="grid grid-cols-2 text-white px-6 py-3" style={{ backgroundColor: C.green }}>
                <span className="text-[10px] tracking-widest uppercase text-white/60">Distribución de ganancias limpias</span>
                <span className="text-[10px] tracking-widest uppercase text-white/60 text-right">%</span>
              </div>
              <div className="grid grid-cols-2 px-6 py-4 items-center bg-amber-50/40 border-b" style={{ borderColor: 'rgba(0,83,51,0.08)' }}>
                <div>
                  <span className="text-base font-semibold" style={{ color: C.dark }}>Vos</span>
                  <p className="text-sm mt-0.5 leading-relaxed" style={{ color: C.faint }}>Después de descontar costos y tu inversión inicial</p>
                </div>
                <span className="text-xl font-bold serif-title text-right italic" style={{ color: C.gold }}>A acordar</span>
              </div>
              <div className="grid grid-cols-2 px-6 py-4 items-center bg-white">
                <div>
                  <span className="text-base font-semibold" style={{ color: C.dark }}>Kintu + Pueblo Mágico</span>
                  <p className="text-sm mt-0.5" style={{ color: C.faint }}>Producción + espacio + logística</p>
                </div>
                <span className="text-xl font-bold serif-title text-right italic" style={{ color: C.green }}>A acordar</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── EL ESPACIO ── */}
      <section className="py-24 md:py-36 px-6 text-white overflow-hidden relative" style={{ backgroundColor: C.green }}>
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
          style={{ backgroundColor: 'rgba(212,175,55,0.06)' }}
        />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-14 items-center">

            <div data-reveal>
              <p className="text-sm tracking-[0.3em] uppercase mb-5 font-bold" style={{ color: C.gold }}>
                El entorno potencia la experiencia
              </p>
              <h2 className="text-3xl md:text-4xl serif-title text-white mb-6 leading-tight">
                Pueblo Mágico,{' '}
                <span style={{ color: C.gold }}>nuestra sede</span>
              </h2>
              <p className="text-white/65 text-base leading-relaxed mb-8">
                Un ecolodge de montaña en las Sierras Grandes de Córdoba, a las puertas del macizo Los Gigantes.
                Anfitrionamos experiencias transformadoras hace más de 25 años.
              </p>
              <ul className="space-y-3">
                {[
                  'Refugio de Piedra y domos geodésicos en Sierras Grandes',
                  'Pensión completa — Gastronomía natural y regenerativa',
                  'Salón panorámico, explanadas y fogón',
                  'Senderos · Río · Cielos limpios · 200 ha de reserva',
                  'A 90 km de Córdoba Capital — acceso para todo vehículo',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-white/65 text-sm leading-relaxed">
                    <span className="flex-shrink-0 mt-0.5" style={{ color: C.gold }}>—</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-white/35 text-sm leading-relaxed mt-7 italic">
                También podemos organizar experiencias en otros destinos de Argentina y el mundo.
              </p>
            </div>

            {/* Carrusel de fotos */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl" data-reveal data-delay="1">
              <div className="aspect-[4/3] relative">
                {SPACE_IMGS.map((im, i) => (
                  <img
                    key={im.src}
                    src={img(im.src, 900)}
                    alt={im.alt}
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
                    style={{ opacity: i === spaceIdx ? 1 : 0 }}
                    loading="lazy"
                  />
                ))}
              </div>
              <button
                onClick={() => setSpaceIdx(i => (i - 1 + SPACE_IMGS.length) % SPACE_IMGS.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff' }}
                aria-label="Foto anterior"
              >‹</button>
              <button
                onClick={() => setSpaceIdx(i => (i + 1) % SPACE_IMGS.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff' }}
                aria-label="Foto siguiente"
              >›</button>
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {SPACE_IMGS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSpaceIdx(i)}
                    className="w-2 h-2 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: i === spaceIdx ? C.gold : 'rgba(255,255,255,0.4)',
                      transform: i === spaceIdx ? 'scale(1.3)' : 'scale(1)',
                    }}
                    aria-label={`Imagen ${i + 1}`}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── DESTINOS ── */}
      <section className="py-20 md:py-28 px-6" style={{ backgroundColor: '#F7F5F0' }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[10px] tracking-[0.35em] uppercase font-semibold mb-8" style={{ color: 'rgba(0,83,51,0.5)' }}>
            Otros destinos posibles
          </p>

          {/* Mobile: slide único */}
          {(() => {
            const slide = SLIDES[slideIdx];
            return (
              <div className="relative rounded-2xl overflow-hidden shadow-xl mb-5 md:hidden">
                <div className="aspect-[16/9] relative">
                  {slide.type === 'single' ? (
                    <>
                      <img src={slide.d.foto} alt={slide.d.nombre} className="w-full h-full object-cover"
                        style={{ objectPosition: slide.d.pos }} loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute bottom-0 left-0 px-6 pb-5">
                        <span className="text-[10px] tracking-[0.3em] uppercase font-semibold" style={{ color: 'rgba(212,175,55,0.85)' }}>{slide.d.tag}</span>
                        <p className="text-2xl font-bold serif-title text-white mt-1">{slide.d.nombre}</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full">
                      {([slide.d1, slide.d2] as Destino[]).map((d, pi) => (
                        <div key={d.nombre} className="flex-1 relative overflow-hidden">
                          <img src={d.foto} alt={d.nombre} className="w-full h-full object-cover"
                            style={{ objectPosition: d.pos }} loading="lazy" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                          <div className="absolute bottom-0 left-0 px-3 pb-4">
                            <span className="text-[9px] tracking-widest uppercase font-semibold block" style={{ color: 'rgba(212,175,55,0.85)' }}>{d.tag}</span>
                            <p className="text-sm font-bold serif-title text-white leading-tight">{d.nombre}</p>
                          </div>
                          {pi === 0 && <div className="absolute right-0 top-0 bottom-0 w-px" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => setSlideIdx(i => (i - 1 + SLIDES.length) % SLIDES.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff' }} aria-label="Anterior destino">‹</button>
                <button onClick={() => setSlideIdx(i => (i + 1) % SLIDES.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff' }} aria-label="Siguiente destino">›</button>
              </div>
            );
          })()}

          {/* Desktop: 4 tarjetas rotando */}
          <div className="hidden md:grid md:grid-cols-4 gap-3 mb-5">
            {Array.from({ length: 4 }, (_, i) => {
              const d = DESTINOS[(SLIDE_BASE[slideIdx] + i) % DESTINOS.length];
              return (
                <button key={`${slideIdx}-${i}`}
                  onClick={() => setSlideIdx(s => (s + 1) % SLIDES.length)}
                  className="relative rounded-xl overflow-hidden shadow-lg text-left w-full">
                  <div className="aspect-[3/4] relative">
                    <img src={d.foto} alt={d.nombre} className="w-full h-full object-cover"
                      style={{ objectPosition: d.pos }} loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 px-4 pb-4">
                      <span className="text-[9px] tracking-widest uppercase font-semibold block" style={{ color: 'rgba(212,175,55,0.85)' }}>{d.tag}</span>
                      <p className="text-base font-bold serif-title text-white leading-tight">{d.nombre}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mb-8">
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => setSlideIdx(i)}
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{ backgroundColor: i === slideIdx ? C.green : 'rgba(0,83,51,0.2)', transform: i === slideIdx ? 'scale(1.4)' : 'scale(1)' }}
                aria-label={`Slide ${i + 1}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ── POTENCIAL DE LA ALIANZA ── */}
      <section className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6" data-reveal>
            <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold shadow-sm"
              style={{ backgroundColor: C.green }}>
              El potencial de la alianza
            </p>
            <h2 className="text-3xl md:text-4xl serif-title mb-4 leading-tight" style={{ color: C.green }}>
              No sumamos personas.<br />Unimos fuerzas y multiplicamos el impacto.
            </h2>
          </div>

          <div className="max-w-2xl mx-auto text-center mb-14" data-reveal data-delay="1">
            <p className="text-base md:text-lg leading-relaxed" style={{ color: C.muted }}>
              Vos traés tu gente y tu propósito. Nosotros ponemos el espacio, la producción y el alcance. Lo que se crea juntos es más grande que la suma de las partes.
            </p>
            <p className="text-sm mt-4 font-serif italic" style={{ color: C.faint }}>
              Ya sea tu comunidad en redes, tu equipo de trabajo o tus clientes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-10" data-reveal data-delay="2">
            {ACCOUNTS.map(acc => (
              <div key={acc.handle} className="rounded-2xl p-6 border" style={{ backgroundColor: acc.bg, borderColor: acc.border }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: C.dark }}>{acc.nombre}</p>
                    <p className="text-[11px] tracking-wide mt-0.5" style={{ color: acc.color }}>{acc.handle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold serif-title" style={{ color: acc.color }}>{acc.seguidores}</p>
                    <p className="text-[10px] tracking-widest uppercase" style={{ color: C.faint }}>seguidores</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{acc.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center" data-reveal data-delay="3">
            <div className="inline-flex flex-col items-center gap-2 border rounded-2xl px-10 py-6"
              style={{ borderColor: 'rgba(212,175,55,0.4)', backgroundColor: 'rgba(212,175,55,0.05)' }}>
              <p className="text-[10px] tracking-widest uppercase" style={{ color: C.faint }}>Nuestro alcance combinado</p>
              <p className="text-5xl md:text-6xl font-bold serif-title" style={{ color: C.green }}>64K+</p>
              <p className="text-base max-w-xs text-center leading-relaxed" style={{ color: C.muted }}>
                personas que ya buscan bienestar, naturaleza y experiencias que cambien algo en sus vidas.
              </p>
              <p className="text-xs font-semibold mt-2" style={{ color: C.gold }}>+ tu grupo = aún más impacto</p>
            </div>
            <p className="text-xs mt-6 max-w-md mx-auto italic" style={{ color: C.faint }}>
              Y eso antes de activar la estrategia de lanzamiento. El potencial real empieza cuando empezamos a publicar juntos.
            </p>
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section className="py-24 md:py-36 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16" data-reveal>
            <p
              className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold shadow-sm"
              style={{ backgroundColor: C.green }}
            >
              Los próximos pasos
            </p>
            <h2 className="text-3xl md:text-4xl serif-title" style={{ color: C.green }}>¿Cómo arrancamos?</h2>
            <p className="text-sm mt-3" style={{ color: C.faint }}>Tres pasos simples.</p>
          </div>

          <div className="flex flex-col" data-reveal data-delay="1">
            {[
              {
                n: '1',
                title: 'Nos conocemos',
                desc:  'Una charla para entender qué querés crear, a quién va dirigido y qué necesita tu comunidad.',
              },
              {
                n: '2',
                title: 'Diseñamos juntos',
                desc:  'Definimos fechas, formato, actividades, tamaño del grupo y el modelo económico.',
              },
              {
                n: '3',
                title: 'Lo lanzamos',
                desc:  'Activamos producción, comunicación y convocatoria. Vos llegás a disfrutar el proceso.',
              },
            ].map((step, i) => (
              <div key={step.n} className="flex gap-6 relative">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold serif-title z-10"
                    style={{ backgroundColor: C.green, color: C.gold }}
                  >
                    {step.n}
                  </div>
                  {i < 2 && (
                    <div
                      className="w-px flex-1 my-1"
                      style={{ backgroundColor: 'rgba(0,83,51,0.15)', minHeight: '2.5rem' }}
                    />
                  )}
                </div>
                <div className="flex-1 pb-10">
                  <h3 className="text-xl serif-title mb-2 mt-2.5" style={{ color: C.green }}>{step.title}</h3>
                  <p className="text-base leading-relaxed" style={{ color: C.muted }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section
        className="py-28 md:py-44 px-6 text-white text-center relative overflow-hidden"
        style={{
          backgroundImage: `url(${img('/uploads/img_6948.webp', 1600)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: 'rgba(0,83,51,0.82)' }} />
        <div className="max-w-2xl mx-auto relative z-10" data-reveal>
          <div className="w-8 h-px mx-auto mb-10" style={{ backgroundColor: 'rgba(212,175,55,0.3)' }} />
          <h2 className="text-3xl md:text-5xl serif-title text-white mb-6 leading-tight">
            ¿Qué experiencia<br />querés crear?
          </h2>
          <p
            className="text-base mb-10 leading-relaxed max-w-sm mx-auto font-serif italic"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            Contanos tu idea y te armamos una propuesta personalizada.
          </p>
          <a
            href={WA_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold inline-block text-sm py-5 px-10"
          >
            Escribirnos por WhatsApp
          </a>
        </div>
      </section>

      <Footer />

    </div>
  );
};

export default OrganizamosTuExperiencia;
