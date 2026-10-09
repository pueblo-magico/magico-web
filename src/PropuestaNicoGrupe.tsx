import React, { useEffect, useState } from 'react';
import { img } from './lib/img';
import { WA_MAGICO } from './data/config';

const WA_MSG = encodeURIComponent(
  '¡Hola! Vi la propuesta para Nico Grupe y me interesa explorar fechas. ¿Podemos hablar?'
);
const WA_HREF = `https://wa.me/${WA_MAGICO}?text=${WA_MSG}`;

const PROSPECT = {
  nombre: 'Nico',
  comunidad: 'Nico Grupe',
  handle: '@nicogrupe',
  seguidores: '1M',
  nicho: 'desarrollo personal & coaching',
};

const ACCOUNTS = [
  {
    handle: PROSPECT.handle,
    nombre: PROSPECT.comunidad,
    seguidores: PROSPECT.seguidores,
    desc: 'Tu comunidad — 1 millón de personas que ya confían en tu mensaje y quieren diseñar su vida.',
    color: '#D4AF37',
    bg: 'rgba(212,175,55,0.06)',
    border: 'rgba(212,175,55,0.25)',
  },
  {
    handle: '@pueblomagico__',
    nombre: 'Pueblo Mágico',
    seguidores: '36K',
    desc: 'El espacio — una comunidad que busca experiencias transformadoras en la naturaleza.',
    color: '#005333',
    bg: 'rgba(0,83,51,0.05)',
    border: 'rgba(0,83,51,0.2)',
  },
  {
    handle: '@somoskintu_',
    nombre: 'Kintu',
    seguidores: '28K',
    desc: 'La producción — referentes de bienestar, facilitadores y buscadores de experiencias.',
    color: '#005333',
    bg: 'rgba(0,83,51,0.05)',
    border: 'rgba(0,83,51,0.2)',
  },
];

const EXPERIENCES = [
  {
    title: 'Inmersión Estoica',
    desc: 'Retiro intensivo para salir del piloto automático. Silencio, naturaleza y herramientas de la filosofía estoica para diseñar la vida que querés.',
    imgSrc: '/uploads/img_6948.webp',
  },
  {
    title: 'Charla en la Montaña',
    desc: 'Una charla o jornada en un entorno que amplifica el mensaje. La naturaleza como escenario para transformar vidas.',
    imgSrc: '/uploads/dji_0074.webp',
  },
  {
    title: 'Mastermind Weekend',
    desc: 'Fin de semana intensivo para tu comunidad más comprometida. Trabajo en grupos, fogón y conexión real.',
    imgSrc: '/uploads/fogon_nocturno.webp',
  },
  {
    title: 'Caminata de Visión',
    desc: 'Una salida guiada por senderos de alta montaña para clarificar el rumbo. La caminata consciente como herramienta de coaching.',
    imgSrc: '/uploads/hero(3).webp',
  },
];

// ─── Tabla de costos por categoría ────────────────────────────────────────────
type CostRow = { label: string; detail?: string; monto?: number; tipo: 'fijo' | 'variable' | 'opcional' | 'señal' };
type CostCat = { cat: string; accent: string; rows: CostRow[] };

const COST_TABLE: CostCat[] = [
  {
    cat: 'Lugar',
    accent: '#005333',
    rows: [
      { label: 'Reserva / Seña Pueblo Mágico', detail: 'Valor de 3 participantes (para señar fecha y lugar)', monto: 1080000, tipo: 'señal' },
      { label: 'Alojamiento (3 noches × $120.000/n)', detail: 'Por persona', monto: 360000, tipo: 'variable' },
    ],
  },
  {
    cat: 'Producción',
    accent: '#AA3E11',
    rows: [
      { label: 'Jornada de grabación pre-retiro (Filmmaker)', detail: 'Contenido orgánico y pauta publicitaria para convocatoria', monto: 150000, tipo: 'fijo' },
      { label: 'Edición de reels (6 a 8 reels)',                monto: 250000, tipo: 'fijo' },
      { label: 'Landing page de conversión',                    monto:  80000, tipo: 'fijo' },
      { label: 'Diseño gráfico (historias, flyers)',            monto: 120000, tipo: 'fijo' },
      { label: 'Gestión de pauta (Trafficker)',     detail: '(Opcional)', monto: 120000, tipo: 'opcional' },
      { label: 'Inversión publicitaria (Meta Ads)', detail: '(Opcional)', monto: 850000, tipo: 'opcional' },
    ],
  },
  {
    cat: 'Actividades',
    accent: '#8B6A00',
    rows: [
      { label: 'Temazcal', detail: 'Por persona', monto: 35000, tipo: 'variable' },
      { label: 'Armonización sonora con baños de gong', detail: 'Por persona', monto: 35000, tipo: 'variable' },
    ],
  },
];

// Para proyecciones: costos fijos de producción (incluyendo pauta y ads)
const PROD_FIXED = 1570000;   // 150k + 250k + 80k + 120k + 120k + 850k
const TOTAL_FIJOS = PROD_FIXED;  // usado en el cálculo de escenarios
// Nota: la señal ($1,080k) es anticipo del alojamiento, no costo adicional

// ─── Opción única ──────────────────────────────────────────────────────────────
type Opcion = { label: string; duracion: string; ticket: number; costo_var: number; scenarios: number[]; recomendado?: boolean; };
const OPCIONES: Opcion[] = [
  {
    label: 'Inmersión Estoica en Pueblo Mágico',
    duracion: '4 días · 3 noches',
    ticket: 850000,
    costo_var: 430000,   // $360k alojamiento + $35k temazcal + $35k armonización por persona
    scenarios: [12, 20, 28],
    recomendado: true,
  },
];

const fmt = (n: number) => '$' + n.toLocaleString('es-AR');

const Countdown: React.FC<{ expiresAt: Date }> = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState({ h: 72, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = expiresAt.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ h: 0, m: 0, s: 0 }); return; }
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div className="flex items-center gap-2">
      <span className="text-white/40 text-[10px] uppercase tracking-widest hidden sm:block">Esta propuesta expira en</span>
      <div className="flex items-center gap-1 font-mono">
        {[pad(timeLeft.h)+'h', pad(timeLeft.m)+'m', pad(timeLeft.s)+'s'].map((v, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-white/30 text-xs">:</span>}
            <span className="rounded px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: '#AA3E11', color: '#D4AF37' }}>{v}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

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
  { nombre: 'Valle de los Lisos',  tag: 'Córdoba, Argentina', foto: 'https://s0.wklcdn.com/image_121/3652082/91090363/93504330Master.jpg', pos: 'center center' },
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

const ESPACIO_IMGS = [
  { src: '/uploads/469280911_444096748740233_2818770490495002077_n.webp', alt: 'Experiencia grupal' },
  { src: '/uploads/469742031_941240881439467_8316347989568757415_n.webp', alt: 'Experiencia grupal' },
  { src: '/uploads/domos_2.jpg',    alt: 'Domos geodésicos' },
  { src: '/uploads/refu.webp',      alt: 'Refugio de Piedra' },
  { src: '/uploads/dji_0074.webp',  alt: 'Vista aérea Pueblo Mágico' },
];

const PropuestaNicoGrupe: React.FC = () => {
  const [expiresAt] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 72);
    return d;
  });

  useEffect(() => {
    document.title = `Propuesta · ${PROSPECT.comunidad} × Pueblo Mágico`;
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const [espacioIdx, setEspacioIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setEspacioIdx(i => (i + 1) % ESPACIO_IMGS.length), 1400);
    return () => clearInterval(t);
  }, []);

  const [slideIdx, setSlideIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSlideIdx(i => (i + 1) % SLIDES.length), 1100);
    return () => clearInterval(t);
  }, []);

  const totalSeguidores = '1.06M';

  return (
    <div className="bg-[#FDFBF7] text-[#2A1708] overflow-x-hidden">

      {/* TOP BAR */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 backdrop-blur-md" style={{ backgroundColor: '#AA3E11' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/uploads/pueblo_magico_logo_marron.svg" alt="Pueblo Mágico" className="h-6 w-auto flex-shrink-0" style={{ filter: 'brightness(0) invert(1)' }} />
            <div className="w-px h-4 bg-white/20 hidden sm:block flex-shrink-0" />
            <span className="text-white/50 text-[10px] tracking-widest uppercase hidden sm:block truncate">
              Propuesta personalizada · {PROSPECT.comunidad}
            </span>
          </div>
          <Countdown expiresAt={expiresAt} />
        </div>
      </div>

      {/* HERO */}
      <section className="relative min-h-screen pt-14 flex items-end overflow-hidden">
        <img
          src={img('/uploads/yoga_salon.webp', 1800)}
          alt="Pueblo Mágico — Sierras Grandes"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-12 pb-16 md:pb-24" data-reveal>
          <span className="inline-block bg-white/15 backdrop-blur-sm border border-white/25 text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-7 font-semibold">
            Una invitación a co-crear
          </span>
          <h1 className="text-5xl md:text-6xl lg:text-7xl serif-title leading-tight mb-6 text-white">
            ¡Hola,{' '}
            <span style={{ color: '#D4AF37' }}>{PROSPECT.nombre}!</span>
          </h1>
          <p className="text-white/75 text-base md:text-lg leading-relaxed mb-10 max-w-xl">
            Esta es una oportunidad para potenciarnos y co-crear{' '}
            <strong className="text-white">Experiencias Integrales de Alto Impacto basadas en la filosofía estoica</strong>{' '}
            para la comunidad de "{PROSPECT.comunidad}"
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              { valor: 'Desde 3', label: 'días' },
              { valor: '+15', label: 'años produciendo' },
              { valor: '1M', label: 'personas alcanzadas', gold: true },
            ].map(s => (
              <div
                key={s.label}
                className="flex items-center gap-2 rounded-full px-4 py-2.5 border backdrop-blur-sm"
                style={{
                  backgroundColor: s.gold ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.12)',
                  borderColor: s.gold ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.25)',
                }}
              >
                <span className="text-xl font-bold serif-title" style={{ color: s.gold ? '#D4AF37' : '#ffffff' }}>{s.valor}</span>
                <span className="text-[10px] tracking-widest uppercase text-white/60">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUIÉNES SOMOS */}
      <section className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center" data-reveal>
          <p className="inline-block bg-[#005333] text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold shadow-sm">
            ¿Quién produce?
          </p>
          <h2 className="text-3xl md:text-4xl serif-title mb-6" style={{ color: '#005333' }}>
            Somos Kintu
          </h2>
          <p className="text-[#4A3220] text-base md:text-xl leading-relaxed mb-6 max-w-2xl mx-auto">
            Una productora pionera en <strong>Eventos Conscientes & Experiencias de Alto Impacto.</strong> Nuestro objetivo es co-crear alianzas junto a referentes que tienen comunidades consolidadas — listas para potenciar en conjunto.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center mt-10" data-reveal data-delay="1">
            {[
              { label: 'Qué queremos evitar', text: 'Que el proceso sea aburrido, abrumador, solitario, desbordante y poco rentable energética y económicamente.', bg: '#AA3E11' },
              { label: 'Qué queremos lograr', text: 'Repartir responsabilidades, disfrutar del proceso, multiplicar el impacto y celebrar el resultado en equipo.', bg: '#005333' },
            ].map(item => (
              <div key={item.label} className="flex-1 rounded-2xl p-8 text-left shadow-md" style={{ backgroundColor: item.bg }}>
                <p className="text-2xl font-bold mb-4 text-white/90">{item.label}</p>
                <p className="text-base leading-relaxed text-white/80">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXPERIENCIAS POSIBLES */}
      <section className="py-24 md:py-36 px-6 bg-[#F7F5F0]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16" data-reveal>
            <p className="inline-block bg-[#005333] text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold shadow-sm">
              La propuesta
            </p>
            <h2 className="text-3xl md:text-5xl serif-title mb-4 leading-tight" style={{ color: '#005333' }}>
              Retiro en Pueblo Mágico
            </h2>
            <p className="text-[#6B4A33] text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              La propuesta concreta es co-crear tu retiro en nuestra sede de Los Gigantes, Córdoba — en una de estas dos opciones. Después podemos ir por mucho más.
            </p>
          </div>

          <div className="max-w-2xl mx-auto mb-14" data-reveal data-delay="1">
            {/* Opción Única */}
            <div className="rounded-2xl p-8 border text-left relative shadow-sm" style={{ borderColor: 'rgba(0,83,51,0.35)', backgroundColor: 'rgba(0,83,51,0.05)' }}>
              <span className="absolute top-4 right-4 text-[9px] tracking-widest uppercase font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#005333', color: '#D4AF37' }}>
                Propuesta Central
              </span>
              <p className="text-[10px] tracking-widest uppercase font-semibold mb-2" style={{ color: '#005333' }}>Opción Única · Inmersión Estoica</p>
              <p className="text-2xl font-bold serif-title mb-1" style={{ color: '#005333' }}>{OPCIONES[0].duracion}</p>
              <p className="text-xl font-bold serif-title mb-4" style={{ color: '#D4AF37' }}>{fmt(OPCIONES[0].ticket)} ARS</p>
              <p className="text-[#3D2516] text-sm leading-relaxed mb-5">
                La práctica se instala y el grupo se teje de verdad bajo la filosofía estoica. Costo operativo por persona: <strong>{fmt(OPCIONES[0].costo_var)} ARS</strong>. Margen y tiempo de transformación reales.
              </p>
              <div className="border-t pt-4 space-y-1.5" style={{ borderColor: 'rgba(0,83,51,0.15)' }}>
                <p className="text-[10px] font-semibold tracking-wide" style={{ color: '#005333' }}>— Profundidad vivencial garantizada</p>
                <p className="text-[10px] font-semibold tracking-wide" style={{ color: '#005333' }}>— Impacto que dura semanas en tu comunidad</p>
              </div>
            </div>
          </div>

          {/* Cards de experiencias */}
          <div className="grid md:grid-cols-2 gap-5">
            {EXPERIENCES.map((exp, i) => (
              <div key={exp.title} className="group rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow" data-reveal data-delay={String((i % 2) + 1)}>
                <div className="aspect-video overflow-hidden">
                  <img src={img(exp.imgSrc, 700)} alt={exp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                </div>
                <div className="p-6">
                  <h3 className="text-lg serif-title mb-2" style={{ color: '#005333' }}>{exp.title}</h3>
                  <p className="text-[#6B4A33] text-base leading-relaxed">{exp.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROLES + MODELO ECONÓMICO */}
      <section className="py-24 md:py-36 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14" data-reveal>
            <p className="inline-block bg-[#005333] text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold shadow-sm">
              ¿Qué aportamos y qué aportás?
            </p>
            <h2 className="text-3xl md:text-5xl serif-title leading-tight mb-4" style={{ color: '#005333' }}>
              Vos llegás con tu propósito.<br />El resto corre por nuestra cuenta.
            </h2>
            <p className="text-[#6B4A33] text-base max-w-xl mx-auto">
              La idea es que llegues tranquilo, enfocado y con tu comunidad lista para vivir la experiencia.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 mb-16" data-reveal data-delay="1">
            <div className="border border-amber-200 rounded-2xl p-8 bg-amber-50/40">
              <p className="text-base font-bold mb-6" style={{ color: '#D4AF37' }}>
                Tu aporte · {PROSPECT.comunidad}
              </p>
              <ul className="space-y-4">
                {[
                  'Comunidad consolidada y trayectoria como coach y speaker',
                  'Diseño y dictado de sesiones, talleres o keynotes',
                  'Convocatoria del retiro o viaje a tu comunidad',
                  'Tu presencia, tu metodología, tu energía, tu camino',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-[#3D2516] text-base leading-relaxed">
                    <span className="mt-1 flex-shrink-0 text-amber-400">◆</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border rounded-2xl p-8" style={{ borderColor: '#00533322', backgroundColor: '#00533308' }}>
              <p className="text-base font-bold mb-6" style={{ color: '#005333' }}>
                Nuestro aporte · Kintu & Pueblo Mágico
              </p>
              <ul className="space-y-4">
                {[
                  'El espacio, el hospedaje y la gastronomía completa',
                  'Diseño y anfitrionazgo de la experiencia junto con vos',
                  'Estrategia de lanzamiento en redes sociales',
                  'Copy, guiones y piezas visuales para comunicación',
                  'Logística integral: inscripciones, coordinación y comunicación',
                  'Tecnología, IA y project management de punta a punta',
                  'Grupo de WhatsApp con todos los participantes previo al retiro',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-[#3D2516] text-base leading-relaxed">
                    <span className="mt-1 flex-shrink-0" style={{ color: '#005333' }}>◆</span>
                    {item}
                  </li>
                ))}
                <li className="flex items-start gap-3 mt-5 pt-5 border-t" style={{ borderColor: 'rgba(0,83,51,0.12)' }}>
                  <span className="mt-1 flex-shrink-0 text-amber-500">✦</span>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base font-semibold text-[#2A1708]">Opcionales que elevan la experiencia</span>
                      <span className="text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(212,175,55,0.15)', color: '#B8960A' }}>Opcional</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['Registro audiovisual', 'Temazcal', 'Armonización sonora con baños de gong', 'Cabalgatas', 'Astroturismo', 'Conciencia corporal', 'Respiración & pranayama', 'Yoga', 'Workshop de Innovación aplicada', 'y más...'].map(opt => (
                        <span key={opt} className="text-[11px] px-3 py-1 rounded-full border font-medium" style={{ borderColor: 'rgba(212,175,55,0.3)', color: '#6B4A33', backgroundColor: 'rgba(212,175,55,0.06)' }}>
                          {opt}
                        </span>
                      ))}
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* ── MODELO ECONÓMICO REAL ── */}
          <div data-reveal data-delay="2">
            <div className="text-center mb-10">
              <p className="text-[10px] tracking-[0.4em] uppercase mb-3 font-bold" style={{ color: '#005333' }}>Modelo económico</p>
              <h3 className="text-2xl md:text-3xl serif-title mb-3" style={{ color: '#005333' }}>Así se reparten los costos y las ganancias</h3>
              <p className="text-[#6B4A33] font-serif italic">Cuentas claras, alianzas largas.</p>
            </div>

            {/* INVERSIÓN INICIAL — callout */}
            <div className="rounded-2xl p-7 mb-8 flex items-center justify-between gap-6" style={{ backgroundColor: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.3)' }}>
              <div>
                <p className="font-bold text-lg text-[#2A1708] mb-1">Tu inversión inicial</p>
                <p className="text-sm leading-relaxed text-[#6B4A33]">
                  El 50% de los costos fijos de lanzamiento ({fmt(TOTAL_FIJOS / 2)} ARS). Se imputa al cierre como parte de tu participación en los costos fijos del evento.
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-3xl font-bold serif-title" style={{ color: '#D4AF37' }}>{fmt(TOTAL_FIJOS / 2)}</p>
                <p className="text-[10px] tracking-widest uppercase mt-0.5" style={{ color: '#8B6347' }}>50% de costos fijos</p>
              </div>
            </div>

            {/* COSTOS FIJOS — tabla */}
            <div className="border rounded-2xl overflow-hidden mb-8" style={{ borderColor: '#00533318' }}>
              <div className="bg-[#005333] text-white px-6 py-3">
                <span className="text-[10px] tracking-widest uppercase text-white/90 font-bold">Desglose de Costos del Evento</span>
              </div>
              {COST_TABLE.map(cat => (
                <div key={cat.cat}>
                  <div className="px-6 py-2 bg-gray-50 border-b border-t text-xs font-bold uppercase tracking-wider text-gray-500" style={{ borderColor: '#00533310' }}>
                    {cat.cat}
                  </div>
                  {cat.rows.map(row => (
                    <div key={row.label} className={`flex items-center justify-between px-6 py-3.5 border-b ${row.tipo === 'opcional' ? 'opacity-90 bg-white' : 'bg-white'}`} style={{ borderColor: '#00533310' }}>
                      <div>
                        <span className="text-sm text-[#3D2516] block">{row.label}</span>
                        {row.detail && <span className="text-xs text-[#8B6347]">{row.detail}</span>}
                      </div>
                      <span className="text-sm font-semibold text-right flex-shrink-0 ml-4" style={{ color: '#005333' }}>
                        {row.monto ? fmt(row.monto) : 'A cotizar'}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
              <div className="flex items-center justify-between px-6 py-4 bg-amber-50/40" style={{ borderTop: '2px solid rgba(212,175,55,0.3)' }}>
                <span className="font-bold text-[#2A1708]">Total costos fijos de producción compartidos</span>
                <span className="text-xl font-bold serif-title" style={{ color: '#D4AF37' }}>{fmt(TOTAL_FIJOS)}</span>
              </div>
            </div>

            {/* PROYECCIONES — opción única */}
            <div className="max-w-3xl mx-auto mb-8">
              {OPCIONES.map(op => {
                return (
                  <div key={op.label} className="rounded-2xl overflow-hidden border relative" style={{ borderColor: op.recomendado ? 'rgba(0,83,51,0.4)' : '#E5DDD5' }}>
                    {op.recomendado && (
                      <span className="absolute top-4 right-4 text-[9px] tracking-widest uppercase font-bold px-2.5 py-1 rounded-full z-10" style={{ backgroundColor: '#005333', color: '#D4AF37' }}>Recomendado</span>
                    )}
                    {/* Header */}
                    <div className="px-6 py-5" style={{ backgroundColor: op.recomendado ? 'rgba(0,83,51,0.07)' : '#FAF9F5' }}>
                      <p className="text-[10px] tracking-widest uppercase font-bold mb-1" style={{ color: op.recomendado ? '#005333' : '#A0866E' }}>{op.label}</p>
                      <p className="text-xl font-bold serif-title mb-3" style={{ color: op.recomendado ? '#005333' : '#6B4A33' }}>{op.duracion}</p>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className="px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(212,175,55,0.12)', color: '#7A5C00' }}>
                          Ticket: <strong>{fmt(op.ticket)}</strong>
                        </span>
                        <span className="px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.05)', color: '#6B4A33' }}>
                          Costo/persona: <strong>{fmt(op.costo_var)}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Tabla de escenarios */}
                    <div className="divide-y" style={{ borderColor: '#00533310' }}>
                      <div className="grid grid-cols-4 px-3 md:px-5 py-2" style={{ backgroundColor: op.recomendado ? 'rgba(0,83,51,0.04)' : 'rgba(0,0,0,0.02)' }}>
                        <span className="text-[9px] md:text-[10px] uppercase tracking-normal md:tracking-wider text-[#8B6347]">Personas</span>
                        <span className="text-[9px] md:text-[10px] uppercase tracking-normal md:tracking-wider text-[#8B6347] text-right">Ingreso</span>
                        <span className="text-[9px] md:text-[10px] uppercase tracking-normal md:tracking-wider text-[#8B6347] text-right">Utilidad</span>
                        <span className="text-[9px] md:text-[10px] uppercase tracking-normal md:tracking-wider text-right font-bold" style={{ color: op.recomendado ? '#005333' : '#8B6347' }}>Tu 50%</span>
                      </div>
                      {op.scenarios.map((n, si) => {
                        const ingreso = n * op.ticket;
                        const costos = TOTAL_FIJOS + n * op.costo_var;
                        const utilidad = ingreso - costos;
                        const ganancia = utilidad / 2;
                        const isBest = si === op.scenarios.length - 1;
                        return (
                          <div key={n} className="grid grid-cols-4 px-3 md:px-5 py-3 md:py-3.5 items-center"
                            style={{ backgroundColor: isBest ? (op.recomendado ? 'rgba(0,83,51,0.05)' : 'rgba(212,175,55,0.05)') : 'white' }}>
                            <span className="font-bold text-sm md:text-base text-[#2A1708]">{n}</span>
                            <span className="text-[11px] md:text-sm text-right text-[#6B4A33]">{fmt(ingreso)}</span>
                            <span className="text-[11px] md:text-sm text-right text-[#6B4A33]">{fmt(utilidad)}</span>
                            <span className="text-[11px] md:text-sm font-bold text-right" style={{ color: op.recomendado ? '#005333' : '#8B6A00' }}>{fmt(ganancia)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DISTRIBUCIÓN */}
            <div className="border rounded-2xl overflow-hidden" style={{ borderColor: '#00533318' }}>
              <div className="grid grid-cols-2 bg-[#005333] text-white px-6 py-3">
                <span className="text-[10px] tracking-widest uppercase text-white/60">Distribución de ganancias limpias</span>
                <span className="text-[10px] tracking-widest uppercase text-white/60 text-right">%</span>
              </div>
              <div className="px-6 py-4 bg-amber-50/40 border-b" style={{ borderColor: '#00533310' }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-base font-semibold text-[#2A1708]">{PROSPECT.comunidad} + equipo facilitador</span>
                    <p className="text-sm text-[#8B6347] mt-0.5">Tu comunidad, tu convocatoria, tu metodología</p>
                  </div>
                  <span className="text-3xl font-bold serif-title flex-shrink-0" style={{ color: '#D4AF37' }}>50%</span>
                </div>
                <p className="text-xs text-[#8B6347]/70 mt-2 pt-2 border-t" style={{ borderColor: '#00533310' }}>
                  Este 50% se reparte entre vos y tu equipo facilitador. Si venís solo, es tuyo íntegro. Si sumás co-facilitadores, acordás internamente cómo dividirlo.
                </p>
              </div>
              <div className="grid grid-cols-2 px-6 py-4 items-center bg-white">
                <div>
                  <span className="text-base font-semibold text-[#2A1708]">Kintu + Pueblo Mágico</span>
                  <p className="text-sm text-[#8B6347] mt-0.5">Producción + espacio + logística + financiamiento</p>
                </div>
                <span className="text-3xl font-bold serif-title text-right" style={{ color: '#005333' }}>50%</span>
              </div>
            </div>

            {/* BENEFICIOS CLAVE */}
            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: 'Inversión inicial clara y justa',
                  text: 'Un porcentaje inicial sobre tu 50% de costos. Se imputa al cierre — no es un costo extra, es tu piel en el juego.',
                  accent: '#005333',
                },
                {
                  title: 'Socio real 50/50',
                  text: 'No sos cliente nuestro ni nosotros tuyos. Somos socios alineados al éxito del evento.',
                  accent: '#005333',
                },
                {
                  title: 'Contenido de alto nivel para tu marca',
                  text: 'Filmmaker, edición lista para tus redes y registro completo del retiro. Tuyo para siempre.',
                  accent: '#8B6A00',
                },
                {
                  title: 'Vos solo llegás a brillar',
                  text: 'Cobros, menú, logística, reclamos — todo queda de nuestro lado. Tu único rol: tu comunidad.',
                  accent: '#8B6A00',
                },
              ].map(b => (
                <div key={b.title} className="rounded-xl p-5 border" style={{ borderColor: `${b.accent}22`, backgroundColor: `${b.accent}06` }}>
                  <p className="font-bold text-sm mb-1.5" style={{ color: b.accent }}>◆ {b.title}</p>
                  <p className="text-xs leading-relaxed text-[#6B4A33]">{b.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* EL ESPACIO */}
      <section className="py-24 md:py-36 px-6 bg-brand-green text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] pointer-events-none" style={{ backgroundColor: 'rgba(212,175,55,0.06)' }} />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div data-reveal>
              <p className="text-sm tracking-[0.3em] uppercase text-gold mb-5 font-bold">EL ENTORNO POTENCIA LA EXPERIENCIA</p>
              <h2 className="text-3xl md:text-4xl serif-title text-white mb-6 leading-tight">
                Pueblo Mágico, <span style={{ color: '#D4AF37' }}>Nuestra Sede</span>
              </h2>
              <p className="text-white/65 text-base leading-relaxed mb-8">
                Un ecolodge de montaña en las Sierras Grandes de Córdoba. Un espacio que ya respira lo que vos enseñás — presencia, reconexión y transformación real.
              </p>
              <ul className="space-y-3">
                {[
                  'Ecolodge con domos geodésicos en Sierras Grandes',
                  'Pensión completa — Alimentación Natural & Regenerativa',
                  'Salón panorámico, explanadas abiertas y fogón',
                  'Senderos en la Montaña · Río · Cielos limpios',
                  'A solo 90 km de Córdoba Capital',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-white/65 text-sm leading-relaxed">
                    <span className="text-gold flex-shrink-0 mt-0.5">—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl" data-reveal data-delay="1">
              <div className="aspect-[4/3] relative">
                {ESPACIO_IMGS.map((im, i) => (
                  <img key={im.src} src={img(im.src, 900)} alt={im.alt} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700" style={{ opacity: i === espacioIdx ? 1 : 0 }} loading="lazy" />
                ))}
              </div>
              <button onClick={() => setEspacioIdx(i => (i - 1 + ESPACIO_IMGS.length) % ESPACIO_IMGS.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff' }} aria-label="Anterior">‹</button>
              <button onClick={() => setEspacioIdx(i => (i + 1) % ESPACIO_IMGS.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff' }} aria-label="Siguiente">›</button>
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {ESPACIO_IMGS.map((_, i) => (
                  <button key={i} onClick={() => setEspacioIdx(i)} className="w-2 h-2 rounded-full transition-all duration-300" style={{ backgroundColor: i === espacioIdx ? '#D4AF37' : 'rgba(255,255,255,0.4)', transform: i === espacioIdx ? 'scale(1.3)' : 'scale(1)' }} aria-label={`Imagen ${i + 1}`} />
                ))}
              </div>
            </div>
          </div>

          {/* Destinos posibles */}
          <div className="mt-16 border-t pt-14" style={{ borderColor: 'rgba(255,255,255,0.1)' }} data-reveal data-delay="2">
            <div className="text-center mb-8">
              <p className="text-[10px] tracking-[0.35em] uppercase font-semibold mb-2" style={{ color: 'rgba(212,175,55,0.6)' }}>
                Y esto es en lo que más estamos trabajando
              </p>
              <p className="text-white/50 text-sm max-w-lg mx-auto">
                Mágico es la propuesta de hoy — pero la alianza puede crecer. Estos son los destinos y formatos en los que ya estamos operando.
              </p>
            </div>
            {(() => {
              const slide = SLIDES[slideIdx];
              return (
                <div className="relative rounded-2xl overflow-hidden shadow-2xl mb-5 md:hidden">
                  <div className="aspect-[16/9] relative">
                    {slide.type === 'single' ? (
                      <>
                        <img src={slide.d.foto} alt={slide.d.nombre} className="w-full h-full object-cover" style={{ objectPosition: slide.d.pos }} loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute bottom-0 left-0 px-6 pb-6">
                          <span className="text-[10px] tracking-[0.3em] uppercase font-semibold" style={{ color: 'rgba(212,175,55,0.8)' }}>{slide.d.tag}</span>
                          <p className="text-2xl font-bold serif-title text-white mt-1">{slide.d.nombre}</p>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full">
                        {([slide.d1, slide.d2] as Destino[]).map((d, pi) => (
                          <div key={d.nombre} className="flex-1 relative overflow-hidden">
                            <img src={d.foto} alt={d.nombre} className="w-full h-full object-cover" style={{ objectPosition: d.pos }} loading="lazy" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                            <div className="absolute bottom-0 left-0 px-3 pb-4">
                              <span className="text-[9px] tracking-widest uppercase font-semibold block" style={{ color: 'rgba(212,175,55,0.8)' }}>{d.tag}</span>
                              <p className="text-sm font-bold serif-title text-white leading-tight">{d.nombre}</p>
                            </div>
                            {pi === 0 && <div className="absolute right-0 top-0 bottom-0 w-px" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setSlideIdx(i => (i - 1 + SLIDES.length) % SLIDES.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff' }} aria-label="Anterior">‹</button>
                  <button onClick={() => setSlideIdx(i => (i + 1) % SLIDES.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff' }} aria-label="Siguiente">›</button>
                </div>
              );
            })()}
            <div className="hidden md:grid md:grid-cols-4 gap-3 mb-5">
              {Array.from({ length: 4 }, (_, i) => {
                const d = DESTINOS[(SLIDE_BASE[slideIdx] + i) % DESTINOS.length];
                return (
                  <button key={`${slideIdx}-${i}`} onClick={() => setSlideIdx(s => (s + 1) % SLIDES.length)} className="relative rounded-xl overflow-hidden shadow-lg text-left w-full">
                    <div className="aspect-[3/4] relative">
                      <img src={d.foto} alt={d.nombre} className="w-full h-full object-cover" style={{ objectPosition: d.pos }} loading="lazy" />
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
            <div className="flex justify-center gap-2 mb-10">
              {SLIDES.map((_, i) => (
                <button key={i} onClick={() => setSlideIdx(i)} className="w-2 h-2 rounded-full transition-all duration-300" style={{ backgroundColor: i === slideIdx ? '#D4AF37' : 'rgba(255,255,255,0.3)', transform: i === slideIdx ? 'scale(1.4)' : 'scale(1)' }} aria-label={`Slide ${i + 1}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* POTENCIAL — 1M */}
      <section className="py-24 md:py-36 px-6 bg-[#FDFBF7]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6" data-reveal>
            <p className="inline-block bg-[#005333] text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold shadow-sm">
              El potencial de la alianza
            </p>
            <h2 className="text-3xl md:text-4xl serif-title mb-4 leading-tight" style={{ color: '#005333' }}>
              1 millón de personas<br />ya confían en tu mensaje.
            </h2>
          </div>
          <div className="max-w-2xl mx-auto text-center mb-14" data-reveal data-delay="1">
            <p className="text-[#6B4A33] text-base md:text-lg leading-relaxed">
              Cada vez que nos unimos, habilitamos experiencias que tu comunidad está pidiendo — vivir en carne propia lo que vos enseñás.
            </p>
            <p className="text-[#8B6347] text-sm mt-4 font-serif italic">
              De seguidor a participante. De contenido a experiencia real.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-10" data-reveal data-delay="2">
            {ACCOUNTS.map(acc => (
              <div key={acc.handle} className="rounded-2xl p-6 border" style={{ backgroundColor: acc.bg, borderColor: acc.border }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold text-[#2A1708] text-sm">{acc.nombre}</p>
                    <p className="text-[11px] tracking-wide mt-0.5" style={{ color: acc.color }}>{acc.handle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold serif-title" style={{ color: acc.color }}>{acc.seguidores}</p>
                    <p className="text-[10px] tracking-widest uppercase text-[#8B6347]">seguidores</p>
                  </div>
                </div>
                <p className="text-[#6B4A33] text-sm leading-relaxed">{acc.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center" data-reveal data-delay="3">
            <div className="inline-flex flex-col items-center gap-2 border rounded-2xl px-10 py-6" style={{ borderColor: 'rgba(212,175,55,0.4)', backgroundColor: 'rgba(212,175,55,0.05)' }}>
              <p className="text-[10px] tracking-widest uppercase text-[#8B6347]">Alcance combinado estimado</p>
              <p className="text-5xl md:text-6xl font-bold serif-title" style={{ color: '#005333' }}>{totalSeguidores}+</p>
              <p className="text-[#6B4A33] text-base max-w-xs text-center leading-relaxed">
                personas que ya eligieron crecer, salir del piloto automático y diseñar su vida.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CÓMO ARRANCAMOS */}
      <section className="py-24 md:py-36 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16" data-reveal>
            <p className="inline-block bg-[#005333] text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold shadow-sm">
              Los próximos pasos
            </p>
            <h2 className="text-3xl md:text-4xl serif-title" style={{ color: '#005333' }}>¿Cómo arrancamos?</h2>
            <p className="text-[#8B6347] text-sm mt-3">Tres simples pasos.</p>
          </div>
          <div className="flex flex-col gap-0" data-reveal data-delay="1">
            {[
              { n: '1', title: 'Check In virtual', desc: 'Una reunión para conocernos, alinearnos y definir el formato de la experiencia.' },
              { n: '2', title: 'Fecha y cupo', desc: 'Definimos juntos el fin de semana, el tamaño del grupo y los números del modelo compartido.' },
              { n: '3', title: 'Lanzamiento conjunto', desc: 'Activamos producción, comunicación y convocatoria — con el eje de disfrutar el proceso.' },
            ].map((step, i) => (
              <div key={step.n} className="flex gap-6 relative">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold serif-title flex-shrink-0 z-10" style={{ backgroundColor: '#005333', color: '#D4AF37' }}>
                    {step.n}
                  </div>
                  {i < 2 && <div className="w-px flex-1 my-1" style={{ backgroundColor: 'rgba(0,83,51,0.15)', minHeight: '2.5rem' }} />}
                </div>
                <div className="flex-1 pb-10">
                  <h3 className="text-xl serif-title mb-2 mt-2.5" style={{ color: '#005333' }}>{step.title}</h3>
                  <p className="text-[#6B4A33] text-base leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-28 md:py-44 px-6 text-white text-center relative overflow-hidden" style={{ backgroundImage: `url(${img('/uploads/img_6948.webp', 1600)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-[#005333]/80 pointer-events-none" />
        <div className="max-w-2xl mx-auto relative z-10" data-reveal>
          <div className="w-8 h-px bg-brand-gold/30 mx-auto mb-10" />
          <h2 className="text-3xl md:text-5xl serif-title text-white mb-6 leading-tight">
            ¿Estás listo para<br />dar el siguiente paso?
          </h2>
          <div data-reveal data-delay="1">
            <a href={WA_HREF} target="_blank" rel="noopener noreferrer" className="btn-gold inline-block text-sm py-5 px-10">
              Agenda tu llamada
            </a>
          </div>
        </div>
      </section>

      <div className="text-center py-6 border-t" style={{ backgroundColor: '#FDFBF7', borderColor: '#00533315', color: '#00533340' }}>
        <p className="text-[10px] tracking-widest uppercase">
          Growth systems &amp; digital experience by Catálisis · experienciamagico.com
        </p>
      </div>

    </div>
  );
};

export default PropuestaNicoGrupe;
