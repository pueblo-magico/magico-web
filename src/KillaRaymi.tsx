import React, { useState, useEffect } from 'react';
import { Moon, Flame, Mountain, Sprout, Music, ChevronDown, Instagram, Linkedin, ShieldCheck, Home, Handshake, Utensils } from 'lucide-react';
import { img } from './lib/img';
import { WA_MAGICO } from './data/config';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

const WA_INFO    = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent('¡Hola! Me interesa Primavera en la Montaña (Killa Raymi) del 25 al 27 de septiembre. ¿Me pueden dar más info?')}`;
const WA_COMPLETA = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent('¡Hola! Quiero reservar la Experiencia Completa (2 noches) de Primavera en la Montaña, del 25 al 27 de septiembre. ¿Cómo sigo?')}`;
const WA_1NOCHE   = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent('¡Hola! Quiero reservar la Experiencia de 1 noche de Primavera en la Montaña. ¿Cómo sigo?')}`;
const WA_DIA      = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent('¡Hola! Quiero el pase por el día para Primavera en la Montaña. ¿Cómo sigo?')}`;
const WA_PROMO    = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent('¡Hola! Quiero la promo 2x1 de la Experiencia Completa de Primavera en la Montaña ($118.000 por persona, viniendo con alguien más). ¿Cómo sigo?')}`;

const C = {
  primavera:     '#9D005E', // Pantone P81-16U · primavera (manual de marca) — color principal
  primaveraSoft: '#C4669E', // primavera clara — diferencia la tarjeta de 1 noche
  green:         '#005333', // verde de marca — acento de naturaleza, para que no sea todo fucsia
  gold:          '#D4AF37',
  night:         '#0F1A12',
  cream:         '#FDFBF7',
  dark:          '#2A1708',
  muted:         '#6B4A33',
  faint:         '#8B6347',
};

const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-AR')}`;

type TeamMember = { photo: string; nombre: string; rol: string; desc: string; instagram?: string; linkedin?: string; tags?: string[] };

const HOSTS: TeamMember[] = [
  {
    photo: '/uploads/Diego_perfil.png',
    nombre: 'Diego Epelman Hodara',
    rol: 'Fundador de Pueblo Mágico',
    desc: 'Emprendedor, Facilitador & Guía de Dinámicas de Alto Impacto. Presente en los fogones, los encuentros y el día a día del lugar.',
    instagram: 'https://www.instagram.com/diegoepel/',
    tags: ['MÁGICO', 'KINTU'],
  },
  {
    photo: '/uploads/china.jpeg',
    nombre: 'China Dericia',
    rol: 'Anfitriona del Pueblo',
    desc: 'Profe de Yoga & Facilitadora de Movimiento Consciente. Estiramientos, respiración y canto — acompaña el movimiento del grupo.',
    instagram: 'https://www.instagram.com/bambu.alquimia.terapeutica/',
    tags: ['MÁGICO'],
  },
];

const TEAM: TeamMember[] = [
  {
    photo: '/uploads/isvara-rojas.jpg', nombre: 'Isvara Rojas Romero', rol: 'Host de emprendedores y creativos',
    desc: 'Estratega polímata y Growth Engineer. Conecta la innovación tecnológica y el diseño de vanguardia con filosofías ancestrales de la Tierra.',
    instagram: 'https://www.instagram.com/isvara_strategist/', linkedin: 'https://www.linkedin.com/in/isvara-rojas-romero-53a20a298/', tags: ['MÁGICO', 'KINTU'],
  },
  {
    photo: '/uploads/jasper.png', nombre: 'Jasper Felix Meyer', rol: 'Medicinas ancestrales, tecnología & REGENERACIÓN',
    desc: 'Desarrollador y creador multidisciplinario. Conecta tecnología, proyectos regenerativos y creatividad con música y encuentros en comunidad. Crea puentes entre personas, culturas e ideas para transformar visión en proyectos con propósito.',
    tags: ['MÁGICO'],
    instagram: 'https://www.instagram.com/itsjasperrz/',
  },
  {
    photo: '/uploads/tomas-fossatti.jpg', nombre: 'Tomás Fossatti', rol: 'Host de emprendedores/as',
    desc: 'Ingeniero en innovación y desarrollo, emprendedor y speaker de TEDx. Construye sistemas agénticos recursivos en la intersección de la tecnología y el propósito.',
    instagram: 'https://www.instagram.com/tomasfossatti_/', linkedin: 'https://www.linkedin.com/in/tomas-fossatti-ing', tags: ['MÁGICO', 'KINTU'],
  },
  {
    photo: '/uploads/nicole-rosignoli.webp', nombre: 'Nicole Rosignoli Miranda', rol: 'Psicología · Gestalt · Salud Cíclica',
    desc: 'Licenciada en Psicología (UNC). Acompaña desde el enfoque gestáltico y la salud cíclica, integrando plantas medicinales, movimiento corporal y círculos de mujeres.',
    instagram: 'https://www.instagram.com/thematriiz/', tags: ['MÁGICO'],
  },
  {
    photo: '/uploads/santiago-alzogaray.png', nombre: 'Santiago Alzogaray', rol: 'Temazcal',
    desc: 'Conducción del Temazcal, uno de los momentos centrales del finde.',
    tags: ['MÁGICO'],
  },
  {
    photo: '/uploads/Walter_E._Cejas.jpg', nombre: 'Walter Eugenio Cejas', rol: 'Biólogo · Investigador · Vida Silvestre',
    desc: 'Puente entre el conocimiento científico y la experiencia directa de la Sierra de Achala. Guía avistaje de aves, flora y fauna en la montaña.', tags: ['MÁGICO'],
  },
];

const CardIcon: React.FC<{ color?: string }> = ({ color = 'currentColor' }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    className="h-5 w-5 flex-shrink-0"
  >
    <rect x="2.75" y="5.25" width="18.5" height="13.5" rx="2.25" stroke={color} strokeWidth="1.5" />
    <path d="M3.5 9.25h17" stroke={color} strokeWidth="1.5" />
    <path d="M6.5 14.75h3.25" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// precioCuotas = precio en 3 cuotas sin interés (tarjeta de crédito).
// El pago en transferencia/efectivo es precioCuotas * 0.8.
// items = solo lo que DIFERENCIA a esta modalidad de las otras — lo común
// (comidas, actividades) se dice una sola vez arriba de las 3 tarjetas.
const MODALIDADES = [
  {
    key: 'completa',
    icon: Moon,
    short: 'Completa',
    label: 'Experiencia completa · Habitación',
    sub: '2 noches y 3 días · viernes a domingo',
    color: C.primavera,
    bg: 'rgba(157,0,94,0.05)',
    border: 'rgba(157,0,94,0.3)',
    destacado: true,
    precioCuotas: 295000,
    cuotaValor: 98000,
    items: ['Alojamiento', 'Temazcal, Luna llena y Trekking'],
    cta: 'Reservar experiencia completa',
    wa: WA_COMPLETA,
    nota: 'La recomendamos si querés vivir el finde completo, sin apuro.',
  },
  {
    key: '1noche',
    icon: Flame,
    short: '1 noche',
    label: 'Experiencia · 1 noche',
    sub: 'Viernes a sábado, o sábado y Domingo',
    color: C.primaveraSoft,
    bg: 'rgba(196,102,158,0.06)',
    border: 'rgba(196,102,158,0.35)',
    destacado: false,
    precioCuotas: 215000,
    cuotaValor: 72000,
    items: ['Alojamiento'],
    cta: 'Reservar 1 noche',
    wa: WA_1NOCHE,
    nota: 'Una forma de entrar en la experiencia sin quedarte todo el fin de semana.',
  },
  {
    key: 'dia',
    icon: Sprout,
    short: 'Pase por el día',
    label: 'Pase por el día',
    sub: 'Venís el día que más te guste y pegás la vuelta',
    color: C.gold,
    bg: 'rgba(212,175,55,0.06)',
    border: 'rgba(212,175,55,0.4)',
    destacado: false,
    precioCuotas: 120000,
    cuotaValor: 40000,
    items: ['Sin alojamiento'],
    cta: 'Quiero el pase diario',
    wa: WA_DIA,
    nota: 'Ideal si querés venir a conocer, sin comprometerte a todo el finde.',
  },
] as const;

const ENCONTRAR = [
  {
    Icon: Moon,
    title: 'Fuego & Comunidad',
    color: C.primavera,
    items: ['Luna llena en comunidad', 'Temazcal', 'Fogón nocturno', 'Rondas de conversación', 'Espacios de calma'],
  },
  {
    Icon: Music,
    title: 'Expresión & Comunidad',
    color: C.primaveraSoft,
    items: ['Danza libre', 'Rondas de canto', 'Música en vivo & jam sessions', 'Fogón y encuentros comunitarios'],
  },
  {
    Icon: Mountain,
    title: 'Naturaleza & Territorio',
    color: C.green,
    items: ['Trekking al Macizo Los Gigantes', 'Caminatas por la sierra', 'Interpretación del territorio', 'Avistaje de aves', 'Reconocimiento de plantas'],
  },
  {
    Icon: Sprout,
    title: 'Bienestar',
    color: C.gold,
    items: ['Buena comida, todos los días', 'Espacios de descanso', 'Movimiento y bienestar corporal', 'Tiempo libre para disfrutar de la montaña'],
  },
];

// ─── Countdown ─────────────────────────────────────────────────────────────────
const Countdown: React.FC = () => {
  const target = new Date('2026-09-25T09:00:00').getTime();
  const calc = () => {
    const d = target - Date.now();
    if (d <= 0) return { days: 0, h: 0, m: 0 };
    return {
      days: Math.floor(d / 86400000),
      h:    Math.floor((d % 86400000) / 3600000),
      m:    Math.floor((d % 3600000) / 60000),
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 30000);
    return () => clearInterval(id);
  }, []);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div className="flex items-center gap-3">
      {[{ v: t.days, l: 'días' }, { v: t.h, l: 'hs' }, { v: t.m, l: 'min' }].map(({ v, l }) => (
        <div key={l} className="text-center">
          <div className="text-2xl md:text-3xl font-bold serif-title" style={{ color: C.gold }}>{pad(v)}</div>
          <div className="text-[10px] tracking-widest uppercase text-white/50">{l}</div>
        </div>
      ))}
    </div>
  );
};

const KillaRaymi: React.FC = () => {
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [hostsOpen, setHostsOpen] = useState(false);
  const [equipoOpen, setEquipoOpen] = useState(false);
  const [alimentacionOpen, setAlimentacionOpen] = useState(false);
  const [temazcalOfrendaOpen, setTemazcalOfrendaOpen] = useState(false);

  useEffect(() => {
    document.title = 'Primavera en la Montaña · 25 al 27 de Septiembre · Pueblo Mágico';
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const nearBottom = y + window.innerHeight > document.documentElement.scrollHeight - 600;
      setShowStickyBar(y > 500 && !nearBottom);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ backgroundColor: C.cream, color: C.dark }} className="overflow-x-hidden">
      <Header />

      {/* ── HERO ── */}
      <section className="relative h-[100svh] min-h-[600px] md:h-[100vh] w-full flex flex-col justify-center overflow-hidden">
        <div className="absolute inset-0 md:hidden" style={{ backgroundImage: `url(${img('/uploads/killa-raymi-hero-mobile.webp', 1200)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 hidden md:block" style={{ backgroundImage: `url(${img('/uploads/killa-raymi-hero-desktop.webp', 1800)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(10,20,12,0.97) 0%, rgba(10,20,12,0.65) 45%, rgba(10,20,12,0.2) 100%)' }}
        />

        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 md:px-12 pt-24 md:pt-36 pb-10 md:pb-0 flex flex-col md:items-center md:text-center">
          <div className="flex flex-row flex-wrap items-center md:justify-center gap-2 sm:gap-3 mb-3">
            <span className="inline-block max-w-full px-3 sm:px-4 py-1.5 rounded-full text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.4em] uppercase font-bold border border-white/20 text-white/70 whitespace-nowrap">
              <span className="sm:hidden">25-27 Sep · Los Gigantes</span>
              <span className="hidden sm:inline">25, 26 y 27 de septiembre · Los Gigantes, Córdoba</span>
            </span>
            <span
              className="inline-block max-w-full px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] tracking-wide sm:tracking-widest uppercase font-bold whitespace-nowrap"
              style={{ backgroundColor: 'rgba(212,175,55,0.15)', color: '#F4C27A', border: '1px solid rgba(212,175,55,0.3)' }}
            >
              Primavera & Luna llena
            </span>
            <span
              className="inline-block max-w-full px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] tracking-wide sm:tracking-widest uppercase font-bold whitespace-nowrap"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              Para todo público
            </span>
            <span
              className="inline-block max-w-full px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] tracking-wide sm:tracking-widest uppercase font-bold whitespace-nowrap"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              Sin actividades obligatorias
            </span>
          </div>

          <p className="text-white/50 text-xs sm:text-sm tracking-[0.3em] uppercase mb-2 sm:mb-3 font-semibold">Un encuentro en la montaña</p>
          <h1 className="text-5xl md:text-7xl serif-title leading-none mb-2 text-white">
            Primavera en la <span style={{ color: C.gold }}>Montaña</span>
          </h1>
          <p className="text-white/45 text-xs sm:text-sm tracking-[0.15em] uppercase mb-4 font-semibold">También conocido como Killa Raymi — Festival de la Luna, en quechua</p>
          <p className="text-white/65 text-sm md:text-lg leading-relaxed max-w-lg md:max-w-2xl mt-4 mb-5 md:mt-5 md:mb-10">
            Tres días en la montaña para desconectar de la rutina, conocer gente piola y hacer cosas: caminatas, música en vivo, fogones y buena comida.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
            <a
              href={WA_INFO}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold text-sm py-4 px-8 inline-block"
            >
              Quiero participar
            </a>
            <div>
              <p className="text-white/35 text-[10px] tracking-widest uppercase mb-2">Faltan</p>
              <Countdown />
            </div>
          </div>

          <a href="#precios" className="inline-flex items-center gap-1.5 text-white/50 hover:text-gold text-xs sm:text-sm font-semibold uppercase tracking-wider mt-5 transition-colors">
            Ver precios
            <ChevronDown size={14} className="animate-bounce" style={{ animationDuration: '1.8s' }} />
          </a>
        </div>
      </section>

      {/* ── SOBRE LA EXPERIENCIA ── */}
      <section className="relative py-20 md:py-28 px-6 overflow-hidden bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12" data-reveal>
            <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold"
              style={{ backgroundColor: C.primavera }}>
              Sobre la experiencia
            </p>
            <h2 className="text-3xl md:text-4xl serif-title mb-6" style={{ color: C.primavera }}>
              Un fin de semana para vos
            </h2>
            <p className="text-base leading-relaxed max-w-2xl mx-auto mb-4" style={{ color: C.muted }}>
              La primavera llega a las Sierras: los días se alargan, el campo despierta y la montaña se llena de vida otra vez. Elegimos celebrarlo justo el fin de semana de la luna llena de septiembre — un lindo detalle para la ocasión.
            </p>
            <p className="text-base leading-relaxed max-w-2xl mx-auto" style={{ color: C.muted }}>
              Primavera en la Montaña es un encuentro para disfrutar ese cambio de estación al aire libre: naturaleza, buena comida, fogones y música en vivo, en un ambiente relajado y sin estructura rígida.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 mb-12" data-reveal data-delay="1">
            {[
              { label: 'Naturaleza', color: C.green },
              { label: 'Trekking', color: C.green },
              { label: 'Música en vivo', color: C.primaveraSoft },
              { label: 'Fogón', color: C.primavera },
              { label: 'Gente nueva', color: C.gold },
            ].map(({ label, color }) => (
              <div key={label} className="rounded-2xl p-3 md:p-5 border text-center" style={{ borderColor: `${color}25`, backgroundColor: `${color}08` }}>
                <p className="text-xs md:text-sm font-semibold leading-tight" style={{ color }}>{label}</p>
              </div>
            ))}
          </div>

          <div className="text-center rounded-3xl p-8 md:p-10" data-reveal data-delay="2" style={{ backgroundColor: 'rgba(157,0,94,0.04)', border: '1px solid rgba(157,0,94,0.15)' }}>
            <p className="text-lg md:text-xl serif-title mb-3" style={{ color: C.primavera }}>No es un festival. No es un retiro.</p>
            <p className="text-sm md:text-base leading-relaxed max-w-xl mx-auto" style={{ color: C.muted }}>
              Es un espacio abierto para encontrarnos, disfrutar la llegada de la primavera y pasar un buen momento juntos — familiar y diverso, donde lo profundo puede convivir con lo simple. Podés caminar, bailar, cantar, compartir, descansar o simplemente estar. <strong style={{ color: C.primavera }}>No hay una agenda obligatoria</strong>: vos elegís qué sumar y qué dejar pasar.
            </p>
          </div>
        </div>
      </section>

      {/* ── CRONOGRAMA ── */}
      <section className="py-20 md:py-28 px-6" style={{ backgroundColor: '#F7F5F0' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14" data-reveal>
            <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold"
              style={{ backgroundColor: C.primavera }}>
              Cronograma
            </p>
            <h2 className="text-3xl md:text-4xl serif-title mb-4" style={{ color: C.primavera }}>
              25, 26 y 27 de septiembre
            </h2>
            <p className="text-base max-w-lg mx-auto" style={{ color: C.muted }}>
              Tres días para habitar Pueblo Mágico y sus montañas, a tu ritmo.
            </p>
          </div>

          <div className="space-y-5" data-reveal data-delay="1">
            {/* Viernes */}
            <div className="rounded-2xl p-6 md:p-8 border" style={{ borderColor: 'rgba(196,102,158,0.25)', backgroundColor: 'white' }}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(196,102,158,0.15)' }}>
                  <Sprout size={18} color={C.primaveraSoft} />
                </div>
                <div>
                  <p className="text-[10px] tracking-widest uppercase font-bold mb-1" style={{ color: C.primaveraSoft }}>Viernes · Llegada & apertura</p>
                  <p className="text-lg md:text-xl serif-title" style={{ color: C.dark }}>Bienvenida a la montaña</p>
                </div>
              </div>
              <p className="text-sm md:text-base leading-relaxed" style={{ color: C.muted }}>
                Bajamos el ritmo, dejamos atrás la rutina y empezamos a entrar en sintonía con la montaña y con la comunidad. Recepción, alojamiento, espacios para recorrer el lugar y propuestas de bienvenida. Al caer la tarde nos encontramos alrededor del fuego para arrancar el finde juntos. La experiencia empieza cuando llegamos.
              </p>
            </div>

            {/* Sábado */}
            <div className="rounded-2xl p-6 md:p-8 border" style={{ borderColor: 'rgba(157,0,94,0.25)', backgroundColor: 'rgba(157,0,94,0.03)' }}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(157,0,94,0.12)' }}>
                  <Moon size={18} color={C.primavera} />
                </div>
                <div>
                  <p className="text-[10px] tracking-widest uppercase font-bold mb-1" style={{ color: C.primavera }}>Sábado · Luna llena</p>
                  <p className="text-lg md:text-xl serif-title" style={{ color: C.dark }}>Un día para vos</p>
                </div>
              </div>
              <p className="text-sm md:text-base leading-relaxed mb-5" style={{ color: C.muted }}>
                Un día para disfrutar Pueblo Mágico a tu ritmo: naturaleza, música, movimiento, buena comida, espacios de descanso y propuestas para compartir con la comunidad. Durante el día vamos preparando el espacio para recibir la noche.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl p-4" style={{ backgroundColor: 'white', border: '1px solid rgba(157,0,94,0.15)' }}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: C.primavera }}>Temazcal</p>
                  <p className="text-xs leading-relaxed" style={{ color: C.muted }}>Una experiencia tradicional de calor y respiración — opcional, para quienes quieran sumarse.</p>
                </div>
                <div className="rounded-xl p-4" style={{ backgroundColor: 'white', border: '1px solid rgba(157,0,94,0.15)' }}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: C.primavera }}>Fogón bajo la luna llena</p>
                  <p className="text-xs leading-relaxed" style={{ color: C.muted }}>Fuego, música en vivo, canto y baile — una noche para celebrar en comunidad.</p>
                </div>
              </div>
            </div>

            {/* Domingo */}
            <div className="rounded-2xl p-6 md:p-8 border" style={{ borderColor: 'rgba(0,83,51,0.2)', backgroundColor: 'rgba(0,83,51,0.03)' }}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(0,83,51,0.1)' }}>
                  <Mountain size={18} color={C.green} />
                </div>
                <div>
                  <p className="text-[10px] tracking-widest uppercase font-bold mb-1" style={{ color: C.green }}>Domingo · Montaña & territorio</p>
                  <p className="text-lg md:text-xl serif-title" style={{ color: C.dark }}>Trekking a Los Gigantes</p>
                </div>
              </div>
              <p className="text-sm md:text-base leading-relaxed mb-3" style={{ color: C.muted }}>
                Después de la celebración, abrimos el domingo hacia el territorio. Salimos de Pueblo Mágico para encontrarnos con la inmensidad del Macizo Los Gigantes: una caminata guiada por nuestro equipo para conectar con uno de los paisajes más lindos de nuestras Sierras.
              </p>
              <p className="text-sm md:text-base leading-relaxed" style={{ color: C.muted }}>
                Quienes prefieran cerrar el finde más tranqui pueden quedarse en Pueblo Mágico a disfrutar el día con calma. Quienes quieran venir por el día solo a esta actividad también pueden hacerlo.
              </p>
            </div>
          </div>

          {/* Tres días, tres movimientos */}
          <div className="grid grid-cols-3 gap-2 md:gap-5 mt-8" data-reveal data-delay="2">
            {[
              { Icon: Sprout, day: 'Viernes', word: 'Llegar', desc: 'Bajar el ritmo. Conectar. Abrir.', color: C.primaveraSoft },
              { Icon: Moon, day: 'Sábado', word: 'Disfrutar', desc: 'Luna llena. Temazcal. Fogón.', color: C.primavera },
              { Icon: Mountain, day: 'Domingo', word: 'Trekking', desc: 'Macizo. Montaña. Naturaleza.', color: C.green },
            ].map(({ Icon, day, word, desc, color }) => (
              <div key={day} className="rounded-2xl p-3 md:p-6 border text-center" style={{ borderColor: `${color}25`, backgroundColor: `${color}08` }}>
                <Icon size={16} color={color} className="mx-auto mb-1.5 md:mb-3" />
                <p className="text-[9px] md:text-[10px] uppercase tracking-widest font-semibold mb-0.5 md:mb-1" style={{ color }}>{day}</p>
                <p className="font-bold text-xs md:text-lg serif-title mb-0.5 md:mb-2" style={{ color: C.dark }}>{word}</p>
                <p className="text-[10px] md:text-xs leading-relaxed hidden md:block" style={{ color: C.muted }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUÉ VAS A ENCONTRAR ── */}
      <section className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14" data-reveal>
            <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold"
              style={{ backgroundColor: C.primavera }}>
              Propuestas
            </p>
            <h2 className="text-3xl md:text-4xl serif-title mb-4" style={{ color: C.primavera }}>
              Qué vas a encontrar
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4" data-reveal data-delay="1">
            {ENCONTRAR.map(({ Icon, title, items, color }) => (
              <div key={title} className="rounded-2xl p-6 border" style={{ borderColor: `${color}20`, backgroundColor: `${color}08` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
                    <Icon size={16} color={color} />
                  </div>
                  <p className="font-bold text-sm md:text-base" style={{ color }}>{title}</p>
                </div>
                <ul className="space-y-1.5">
                  {items.map(i => (
                    <li key={i} className="flex items-start gap-2 text-xs md:text-sm" style={{ color: C.muted }}>
                      <span className="flex-shrink-0 mt-0.5" style={{ color: C.gold }}>✦</span>{i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EL LUGAR ── */}
      <section className="py-20 md:py-28 px-6" style={{ backgroundColor: '#F7F5F0' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div data-reveal>
              <p className="text-[10px] tracking-[0.3em] uppercase mb-4 font-semibold" style={{ color: C.green }}>El lugar</p>
              <h2 className="text-3xl md:text-4xl serif-title mb-5 leading-tight" style={{ color: C.green }}>
                Pueblo Mágico,<br />Los Gigantes
              </h2>
              <p className="text-base leading-relaxed mb-6" style={{ color: C.muted }}>
                Un ecolodge de montaña en las Sierras Grandes de Córdoba. Un espacio que ya respira lo que este encuentro propone — naturaleza, comunidad y presencia.
              </p>
              <ul className="space-y-3">
                {[
                  'Sierras Grandes de Córdoba · Los Gigantes',
                  'A 90 km de Córdoba Capital',
                  'Acceso para todo tipo de vehículos',
                  'Salones, espacios abiertos, fogón y senderos',
                  '200 hectáreas de reserva natural',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: C.muted }}>
                    <span className="flex-shrink-0 mt-0.5" style={{ color: C.green }}>—</span>{item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center gap-3 mt-7">
                <a href={WA_INFO} target="_blank" rel="noopener noreferrer"
                  className="inline-block text-sm font-semibold border rounded-full px-6 py-2.5 transition-colors hover:bg-[#005333] hover:text-white hover:border-[#005333]"
                  style={{ borderColor: 'rgba(0,83,51,0.3)', color: C.green }}>
                  ¿Cómo llegar? Consultanos
                </a>
                <a href="https://www.instagram.com/pueblomagico__/" target="_blank" rel="noopener noreferrer" aria-label="Instagram de Pueblo Mágico"
                  className="w-10 h-10 rounded-full flex items-center justify-center border transition-colors hover:bg-[#005333] hover:border-[#005333]"
                  style={{ borderColor: 'rgba(0,83,51,0.3)' }}>
                  <Instagram size={16} color={C.green} />
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3" data-reveal data-delay="1">
              <div className="rounded-2xl overflow-hidden shadow-xl col-span-2">
                <img src={img('/uploads/dji_0074.webp', 900)} alt="Vista aérea de Pueblo Mágico" className="w-full aspect-[16/9] object-cover" loading="lazy" />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <img src={img('/uploads/yoga_salon.webp', 600)} alt="El salón · encuentros y actividades" className="w-full aspect-square object-cover" loading="lazy" />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <img src={img('/uploads/hero-estadia.webp', 600)} alt="El refugio de piedra al atardecer" className="w-full aspect-square object-cover" loading="lazy" />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg col-span-2">
                <img src={img('/uploads/domos_2.jpg', 900)} alt="Domos geodésicos de Pueblo Mágico" className="w-full aspect-[16/9] object-cover" loading="lazy" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ANFITRIONES ── */}
      <section className="relative overflow-hidden" style={{ backgroundColor: C.night }}>
        <button onClick={() => setHostsOpen(o => !o)} className="group relative z-10 w-full py-5 md:py-7 transition-colors duration-300 hover:bg-white/5" aria-expanded={hostsOpen}>
          <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <Home size={22} color={C.gold} className="transition-transform duration-300 group-hover:scale-110" />
              <div className="text-left">
                <p className="text-[9px] tracking-[0.35em] uppercase font-semibold mb-1.5" style={{ color: C.gold }}>Los guardianes del Pueblo</p>
                <h2 className="text-xl md:text-2xl serif-title text-white leading-tight">Anfitriones del espacio</h2>
              </div>
            </div>
            <span className={`text-white/60 text-2xl transition-all duration-300 flex-shrink-0 group-hover:text-white ${hostsOpen ? '' : 'animate-bounce'}`}
              style={{ transform: hostsOpen ? 'rotate(180deg)' : 'rotate(0deg)', animationDuration: '1.8s' }}>↓</span>
          </div>
        </button>
        <div className="relative z-10 overflow-hidden transition-all duration-500 ease-in-out"
          style={{ maxHeight: hostsOpen ? '700px' : '0px', opacity: hostsOpen ? 1 : 0 }}>
          <div className="px-6 pb-12 pt-2 max-w-4xl mx-auto">
            <p className="text-sm leading-relaxed max-w-lg mb-6 text-white/60">
              Diego y China no son anfitriones de temporada. Viven acá, todo el año. Son los primeros habitantes permanentes de Pueblo Mágico.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {HOSTS.map(({ photo, nombre, rol, desc, instagram, tags }) => (
                <div key={nombre} className="flex items-start gap-4 rounded-2xl p-5 border" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  <img src={img(photo, 120)} alt={nombre} className="w-14 h-14 rounded-full object-cover flex-shrink-0" loading="lazy" />
                  <div>
                    {tags && tags.length > 0 && <div className="flex flex-wrap gap-1.5 mb-1.5">{tags.map(tag => <span key={tag} className="text-[8px] font-bold tracking-[0.12em] uppercase px-2 py-0.5 rounded-full border" style={{ backgroundColor: 'rgba(212,175,55,0.1)', color: C.gold, borderColor: 'rgba(212,175,55,0.3)' }}>{tag}</span>)}</div>}
                    <p className="font-bold text-sm mb-0.5 text-white">{nombre}</p>
                    <p className="text-xs font-semibold mb-2" style={{ color: C.gold }}>{rol}</p>
                    <p className="text-xs leading-relaxed mb-2 text-white/60">{desc}</p>
                    {instagram && <a href={instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-white/70"><Instagram size={11} /> Instagram</a>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── EQUIPO + PRODUCCIÓN ── */}
      <section className="relative overflow-hidden" style={{ backgroundColor: '#132419' }}>
        <button onClick={() => setEquipoOpen(o => !o)} className="group relative z-10 w-full py-5 md:py-7 transition-colors duration-300 hover:bg-white/5" aria-expanded={equipoOpen}>
          <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <Handshake size={22} color={C.gold} className="transition-transform duration-300 group-hover:scale-110" />
              <div className="text-left">
                <p className="text-[9px] tracking-[0.35em] uppercase font-semibold mb-1.5" style={{ color: C.gold }}>Facilitadores & producción</p>
                <h2 className="text-xl md:text-2xl serif-title text-white leading-tight">Equipo</h2>
              </div>
            </div>
            <span className={`text-white/60 text-2xl transition-all duration-300 flex-shrink-0 group-hover:text-white ${equipoOpen ? '' : 'animate-bounce'}`}
              style={{ transform: equipoOpen ? 'rotate(180deg)' : 'rotate(0deg)', animationDuration: '1.8s' }}>↓</span>
          </div>
        </button>
        <div className="relative z-10 overflow-hidden transition-all duration-500 ease-in-out"
          style={{ maxHeight: equipoOpen ? '3600px' : '0px', opacity: equipoOpen ? 1 : 0 }}>
          <div className="px-6 pb-12 pt-2 max-w-5xl mx-auto">
            <p className="text-sm leading-relaxed max-w-lg mb-6 text-white/60">
              Un equipo y una comunidad de referentes que suman a este finde. Los vas a cruzar alrededor del fuego en distintos momentos.
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
              {TEAM.map(({ photo, nombre, rol, desc, instagram, linkedin, tags }) => (
                <div key={nombre} className="rounded-2xl p-5 border" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  <img src={img(photo, 200)} alt={nombre} className="w-12 h-12 rounded-full object-cover mb-3" loading="lazy" />
                  {tags && tags.length > 0 && <div className="flex flex-wrap gap-1.5 mb-2">{tags.map(tag => <span key={tag} className="text-[8px] font-bold tracking-[0.12em] uppercase px-2 py-0.5 rounded-full border" style={{ backgroundColor: 'rgba(212,175,55,0.1)', color: C.gold, borderColor: 'rgba(212,175,55,0.3)' }}>{tag}</span>)}</div>}
                  <p className="font-bold text-sm mb-0.5 text-white">{nombre}</p>
                  {rol ? <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: C.gold }}>{rol}</p> : null}
                  {desc ? <p className="text-xs leading-relaxed text-white/60">{desc}</p> : null}
                  {(instagram || linkedin) && <div className="flex gap-2 mt-3">
                    {instagram && <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label={`Instagram de ${nombre}`} className="inline-flex items-center justify-center w-7 h-7 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}><Instagram size={12} color="white" /></a>}
                    {linkedin && <a href={linkedin} target="_blank" rel="noopener noreferrer" aria-label={`LinkedIn de ${nombre}`} className="inline-flex items-center justify-center w-7 h-7 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}><Linkedin size={12} color="white" /></a>}
                  </div>}
                </div>
              ))}
            </div>
            <div className="rounded-2xl p-6 md:p-8 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-[9px] tracking-[0.35em] uppercase font-semibold mb-2" style={{ color: 'rgba(212,175,55,0.8)' }}>Una producción de</p>
              <h3 className="text-xl md:text-2xl serif-title text-white mb-4">Kintu</h3>
              <p className="text-sm leading-relaxed mb-3 text-white/70 max-w-xl mx-auto">KINTU es un equipo y una productora pionera en experiencias transformadoras que diseña viajes y procesos con corazón y propósito, inspirada en la cosmovisión andina —donde el kintu es una ofrenda.</p>
              <p className="text-sm leading-relaxed mb-6 text-white/70 max-w-xl mx-auto">Integrada por <span className="font-semibold text-white">Isvara, Diego y Tomi</span>.</p>
              <a href="https://www.instagram.com/somoskintu_/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold rounded-full px-5 py-2.5 transition-colors hover:bg-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: C.gold, border: '1px solid rgba(212,175,55,0.3)' }}><Instagram size={16} />@somoskintu_</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── ALIMENTACIÓN ── */}
      <section className="relative overflow-hidden" style={{ backgroundImage: `url(${img('/uploads/comida.jpg', 1400)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(15,26,18,0.92) 0%, rgba(15,26,18,0.88) 100%)' }} />
        <button onClick={() => setAlimentacionOpen(o => !o)} className="group relative z-10 w-full py-5 md:py-7 transition-colors duration-300 hover:bg-white/5" aria-expanded={alimentacionOpen}>
          <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center gap-5"><Utensils size={22} color={C.gold} className="transition-transform duration-300 group-hover:scale-110" /><div className="text-left"><p className="text-[9px] tracking-[0.35em] uppercase font-semibold mb-1.5" style={{ color: C.gold }}>Todas las comidas · incluidas</p><h2 className="text-xl md:text-2xl serif-title text-white leading-tight">Alimentación</h2></div></div>
            <span className={`text-white/60 text-2xl transition-all duration-300 flex-shrink-0 group-hover:text-white ${alimentacionOpen ? '' : 'animate-bounce'}`} style={{ transform: alimentacionOpen ? 'rotate(180deg)' : 'rotate(0deg)', animationDuration: '1.8s' }}>↓</span>
          </div>
        </button>
        <div className="relative z-10 overflow-hidden transition-all duration-500 ease-in-out" style={{ maxHeight: alimentacionOpen ? '600px' : '0px', opacity: alimentacionOpen ? 1 : 0 }}>
          <div className="px-6 pb-12 pt-8 max-w-4xl mx-auto">
            <p className="text-base leading-relaxed mb-4 text-white/75">No vas a pasar hambre. Comida casera, de esas que hace la abuela — con carne y opciones vegetarianas siempre disponibles.</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {['Locro', 'Humita', 'Pastas', 'Pollo al disco', 'Polenta a la bolognesa', 'y más'].map(dish => (
                <span key={dish} className="text-[11px] px-3 py-1.5 rounded-full font-medium" style={{ backgroundColor: 'rgba(212,175,55,0.12)', color: '#F4C27A', border: '1px solid rgba(212,175,55,0.25)' }}>{dish}</span>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">{['Desayuno, almuerzo y cena incluidos', 'Ingredientes frescos y de estación', 'Con carne y opción vegetariana', 'Opciones para dietas y alergias'].map(item => <div key={item} className="flex items-start gap-2"><span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: C.gold }} /><p className="text-xs text-white/70">{item}</p></div>)}</div>
          </div>
        </div>
      </section>

      {/* ── OFRENDA + TEMAZCAL ── */}
      <section id="ofrenda-temazcal" className="relative overflow-hidden" style={{ backgroundImage: `url(${img('/uploads/temazcal.webp', 1400)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(15,26,18,0.92) 0%, rgba(15,26,18,0.88) 100%)' }} />
        <button onClick={() => setTemazcalOfrendaOpen(o => !o)} className="group relative z-10 w-full py-5 md:py-7 transition-colors duration-300 hover:bg-white/5" aria-expanded={temazcalOfrendaOpen}>
          <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center gap-5"><Flame size={22} color={C.primavera} className="transition-transform duration-300 group-hover:scale-110" /><div className="text-left"><p className="text-[9px] tracking-[0.35em] uppercase font-semibold mb-1.5" style={{ color: C.primavera }}>Momento central · domingo</p><h2 className="text-xl md:text-2xl serif-title text-white leading-tight">Temazcal</h2></div></div>
            <span className={`text-white/60 text-2xl transition-all duration-300 flex-shrink-0 group-hover:text-white ${temazcalOfrendaOpen ? '' : 'animate-bounce'}`} style={{ transform: temazcalOfrendaOpen ? 'rotate(180deg)' : 'rotate(0deg)', animationDuration: '1.8s' }}>↓</span>
          </div>
        </button>
        <div className="relative z-10 overflow-hidden transition-all duration-500 ease-in-out" style={{ maxHeight: temazcalOfrendaOpen ? '1000px' : '0px', opacity: temazcalOfrendaOpen ? 1 : 0 }}>
          <div className="px-6 pb-12 pt-8 max-w-4xl mx-auto text-center">
            <p className="text-[10px] tracking-[0.3em] uppercase font-semibold mb-3" style={{ color: C.gold }}>El Temazcal</p>
            <p className="text-base leading-relaxed max-w-2xl mx-auto mb-5 text-white/75">Una experiencia tradicional de calor y respiración, para soltar tensión y bajar del todo el cuerpo — opcional, para quienes quieran sumarse.</p>
            <p className="text-sm leading-relaxed max-w-xl mx-auto mb-8 text-white/55">Si tenés alguna condición de salud, escribinos antes de sumarte para que podamos asesorarte.</p>
            <a href={WA_INFO} target="_blank" rel="noopener noreferrer" className="inline-block text-sm font-semibold px-8 py-3 rounded-full transition-opacity hover:opacity-90" style={{ backgroundColor: C.primavera, color: 'white' }}>Consultar por WhatsApp</a>
          </div>
        </div>
      </section>

      {/* ── RESEÑAS · VALIDACIÓN SOCIAL ── */}
      <section className="py-16 md:py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10" data-reveal>
            <a href="https://maps.app.goo.gl/4c1nrpBbQf5hYrsE9" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border rounded-full px-4 py-1.5 transition-colors hover:bg-black/5"
              style={{ borderColor: 'rgba(157,0,94,0.25)' }}>
              <span className="text-sm" style={{ color: C.gold }}>★★★★★</span>
              <span className="text-xs font-semibold" style={{ color: C.muted }}>5.0 · 64 reseñas en Google Maps</span>
            </a>
            <h2 className="text-2xl md:text-3xl serif-title mt-5" style={{ color: C.primavera }}>
              Lo que dicen quienes ya vivieron Mágico
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5" data-reveal data-delay="1">
            {[
              { text: 'Me sentí parte de la vida de la montaña, como en casa. Un refugio de paz inigualable.', name: 'Sofía R.', rol: 'Viajera' },
              { text: 'Una experiencia transformadora. La comida consciente y los espacios son de otro mundo.', name: 'Marcos D.', rol: 'Huésped' },
              { text: 'Lo más importante: el amor y la entrega de todo el equipo, y la capacidad de sentirte uno con la naturaleza.', name: 'Julieta C.', rol: 'Facilitadora' },
            ].map(t => (
              <div key={t.name} className="rounded-2xl p-6 border" style={{ borderColor: 'rgba(157,0,94,0.1)', backgroundColor: 'rgba(157,0,94,0.03)' }}>
                <p className="text-sm italic leading-relaxed mb-4" style={{ color: C.muted }}>"{t.text}"</p>
                <p className="font-bold text-sm" style={{ color: C.dark }}>{t.name}</p>
                <p className="text-xs" style={{ color: C.faint }}>{t.rol}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRECIOS ── */}
      <section id="precios" className="py-20 md:py-28 px-6" style={{ backgroundColor: '#F7F5F0' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10" data-reveal>
            <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold"
              style={{ backgroundColor: C.primavera }}>
              Modalidades de participación
            </p>
            <h2 className="text-3xl md:text-4xl serif-title mb-4" style={{ color: C.primavera }}>
              Elegís cómo vivir el finde
            </h2>
            <p className="text-base max-w-md mx-auto mb-5" style={{ color: C.muted }}>
              Podés llegar el viernes y vivir la experiencia completa, quedarte una sola noche o venir por el día.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {['Descuentos especiales para familias y grupos', 'Consultá por diferentes opciones de alojamiento', '30% OFF en zona de camping'].map(tag => (
                <span key={tag} className="text-[11px] px-3 py-1.5 rounded-full border font-medium"
                  style={{ borderColor: 'rgba(157,0,94,0.25)', color: C.primavera, backgroundColor: 'rgba(157,0,94,0.04)' }}>
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-sm font-semibold" style={{ color: C.primavera }}>
              Las 3 modalidades incluyen comidas y actividades — lo que cambia es cuántos días te quedás.
            </p>
          </div>

          <div className="max-w-2xl mx-auto mb-8 rounded-2xl p-5 md:p-6 text-center" data-reveal
            style={{ backgroundColor: 'rgba(212,175,55,0.1)', border: '2px solid rgba(212,175,55,0.4)' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#8B6A00' }}>🔥 Promo por tiempo limitado</p>
            <p className="text-xl md:text-2xl serif-title mb-2" style={{ color: C.dark }}>
              Vení con alguien más y pagás <span style={{ color: C.primavera }}>$118.000</span> por persona
            </p>
            <p className="text-sm mb-4" style={{ color: C.muted }}>
              Experiencia completa (2 noches, todo incluido) — arranca en pocos días, quedan pocos lugares.
            </p>
            <a href={WA_PROMO} target="_blank" rel="noopener noreferrer"
              className="inline-block text-sm font-bold px-6 py-3 rounded-full text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: C.primavera }}>
              Quiero el 2x1
            </a>
          </div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-5 items-start">
            {MODALIDADES.map(m => (
              <div key={m.key} data-reveal data-delay="1"
                className="rounded-2xl p-6 md:p-7 relative flex flex-col h-full"
                style={{
                  backgroundColor: m.destacado ? m.bg : 'white',
                  border: `1px solid ${m.destacado ? m.color : 'rgba(157,0,94,0.12)'}`,
                  boxShadow: m.destacado ? '0 8px 30px rgba(157,0,94,0.12)' : 'none',
                }}
              >
                {m.destacado && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wide px-3 py-1 rounded-full text-white whitespace-nowrap"
                    style={{ backgroundColor: m.color }}>
                    Más elegida
                  </span>
                )}
                <m.icon size={18} color={m.color} className="mb-3" />
                <p className="text-[10px] tracking-widest uppercase font-semibold" style={{ color: m.color }}>{m.label}</p>
                <p className="text-xs mb-3" style={{ color: C.faint }}>{m.sub}</p>
                <div className="mb-5">
                  <p className="text-3xl md:text-[2rem] font-bold serif-title leading-none mb-2" style={{ color: m.color }}>
                    {fmt(m.precioCuotas * 0.8)}
                  </p>
                  <p className="text-[11px] leading-snug" style={{ color: C.faint }}>
                    por persona · efectivo o transferencia
                  </p>
                </div>

                <div
                  className="flex items-center gap-2.5 px-3.5 py-3 mb-2 rounded-lg"
                  style={{
                    color: m.color,
                    backgroundColor: m.destacado ? 'rgba(255,255,255,0.72)' : m.bg,
                    border: `1px solid ${m.border}`,
                  }}
                >
                  <CardIcon color={m.color} />
                  <p className="text-[11px] leading-tight uppercase tracking-[0.02em]">
                    <strong className="font-extrabold">3 cuotas sin interés</strong>
                    <span className="block mt-0.5 normal-case tracking-normal">
                      de <strong className="text-sm font-extrabold">{fmt(m.cuotaValor)}</strong>
                    </span>
                  </p>
                </div>
                <p className="text-[10px] mb-5 pl-0.5" style={{ color: C.faint }}>
                  Reservá con una seña y pagá el saldo después
                </p>
                <ul className="space-y-1.5 mb-5 flex-1">
                  {m.items.map(i => (
                    <li key={i} className="flex items-start gap-2 text-sm font-medium" style={{ color: C.dark }}>
                      <span className="flex-shrink-0 mt-0.5" style={{ color: m.color }}>+</span>{i}
                    </li>
                  ))}
                </ul>
                <a href={m.wa} target="_blank" rel="noopener noreferrer"
                  className="block text-center py-3.5 px-4 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: m.color }}>
                  {m.cta}
                </a>
              </div>
            ))}
          </div>

          <p className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wide mt-5" style={{ color: C.primavera }}>
            <Flame size={13} />
            Cupos limitados — reservá tu lugar con una seña
          </p>

          <div className="mt-8 rounded-2xl p-5 md:p-6 flex items-start gap-4 max-w-xl mx-auto" data-reveal
            style={{ backgroundColor: 'rgba(157,0,94,0.05)', border: '1px solid rgba(157,0,94,0.15)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(157,0,94,0.1)' }}>
              <ShieldCheck size={18} color={C.primavera} />
            </div>
            <div>
              <p className="font-bold text-sm mb-1" style={{ color: C.primavera }}>¿Tenés dudas sobre el precio?</p>
              <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
                Escribinos por WhatsApp y coordinamos la seña para reservar tu lugar y la forma de pago que mejor te quede.
              </p>
            </div>
          </div>

          <a href={WA_INFO} target="_blank" rel="noopener noreferrer"
            className="mt-4 inline-flex items-center justify-center gap-2 text-sm font-semibold rounded-full px-6 py-3 mx-auto transition-colors hover:bg-[#9D005E] hover:text-white"
            style={{ borderColor: C.primavera, border: '1px solid rgba(157,0,94,0.3)', color: C.primavera, display: 'flex', width: 'fit-content' }}>
            Conversá con alguien de nuestro equipo
          </a>
        </div>
      </section>

      {/* ── CIERRE POÉTICO ── */}
      <section className="relative py-20 md:py-28 px-6 overflow-hidden"
        style={{ backgroundImage: `url(${img('/uploads/pachamama-cielo-estrellado.webp', 1600)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(15,26,18,0.9)' }} />
        <div className="max-w-2xl mx-auto relative z-10 text-center" data-reveal>
          <div className="flex justify-center mb-8">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(157,0,94,0.25)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <Moon size={26} color={C.gold} />
            </div>
          </div>
          <p className="text-[10px] tracking-[0.3em] uppercase font-semibold mb-4" style={{ color: C.gold }}>Killa Raymi significa "Festival de la Luna", en quechua</p>
          <p className="text-base md:text-lg leading-relaxed mb-10 text-white/75">
            Nos vemos en la montaña: caminatas, música en vivo, fogones y buena comida bajo la luna llena de septiembre. Escribinos y contanos qué modalidad te queda mejor.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={WA_COMPLETA} target="_blank" rel="noopener noreferrer" className="btn-gold text-sm py-5 px-10 inline-block">
              Quiero participar
            </a>
            <a href={WA_INFO} target="_blank" rel="noopener noreferrer"
              className="inline-block border border-white/30 text-white/80 font-semibold text-sm py-5 px-10 rounded-full hover:bg-white/10 transition-colors">
              Tengo preguntas
            </a>
          </div>
          <p className="text-xs mt-8 text-white/40">
            25, 26 y 27 de septiembre · Pueblo Mágico, Los Gigantes, Córdoba
          </p>
        </div>
      </section>

      {/* ── BARRA FIJA MOBILE ── */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-[998] px-4 pt-3 transition-transform duration-300 ${showStickyBar ? 'translate-y-0' : 'translate-y-full'}`}
        style={{
          paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
          backgroundColor: 'rgba(15,26,18,0.97)',
          borderTop: '1px solid rgba(212,175,55,0.25)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <a href={WA_COMPLETA} target="_blank" rel="noopener noreferrer" className="btn-gold text-sm py-3 w-full text-center block">
          Reservar mi lugar
        </a>
      </div>

      <Footer />
    </div>
  );
};

export default KillaRaymi;
