import React, { useState, useEffect } from 'react';
import {
  Flame, Music, Leaf, Heart, Sun, Moon, Wind, Eye, Compass,
  Sparkles, Users, BookOpen, ChevronDown, Mountain, Target, Star,
} from 'lucide-react';
import { img } from './lib/img';
import { WA_MAGICO } from './data/config';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { SectionRegeneracion } from '../components/SectionRegeneracion';

const WA_INFO    = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent('¡Hola! Me interesa el retiro DESPERTAR (9 al 12 de octubre). ¿Me pueden dar más info?')}`;
const WA_RESERVA = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent('¡Hola! Quiero reservar mi lugar para el retiro DESPERTAR (9 al 12 de octubre). ¿Cómo procedo?')}`;

const C = {
  green: '#005333',
  gold:  '#D4AF37',
  fire:  '#AA3E11',
  night: '#0F1A12',
  cream: '#FDFBF7',
  dark:  '#2A1708',
  muted: '#6B4A33',
  faint: '#8B6347',
};

// ─── Countdown ─────────────────────────────────────────────────────────────────
const Countdown: React.FC = () => {
  const target = new Date('2026-10-09T16:00:00').getTime();
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

// ─── Cronograma (datos) ──────────────────────────────────────────────────────
const CRONOGRAMA = [
  {
    dia: 'Día 1',
    titulo: 'Aterrizaje & Apertura',
    eje: 'Soltar lo externo / Sumergirse al proceso',
    resumen: 'Llegada · Apertura · Intención',
    items: [
      ['16:00', 'Llegada + check-in'],
      ['17:30', 'Bienvenida + apertura del retiro'],
      ['18:30', 'Círculo inicial — intenciones y acuerdos'],
      ['19:30', 'Atardecer'],
      ['20:30', 'Cena consciente'],
      ['22:00', 'Cierre suave / descanso'],
    ],
  },
  {
    dia: 'Día 2',
    titulo: 'Profundización',
    eje: 'Mente y cuerpo en entrenamiento',
    resumen: 'Entrenamiento · Práctica · Profundización',
    items: [
      ['08:00', 'Activación corporal / Respiración'],
      ['09:00', 'Desayuno'],
      ['10:30', 'Taller vivencial'],
      ['12:30', 'Almuerzo'],
      ['14:30', 'Tiempo libre / naturaleza'],
      ['16:30', 'Dinámica vivencial'],
      ['18:30', 'Integración grupal'],
      ['20:00', 'Cena'],
      ['21:30', 'Armonización sonora — fuego + reflexión guiada'],
    ],
  },
  {
    dia: 'Día 3',
    titulo: 'Transformación',
    eje: 'Entrega, emoción y trascendencia',
    resumen: 'Transformación · Temazcal · Sonido',
    items: [
      ['08:00', 'Movimiento consciente / breathwork'],
      ['09:00', 'Desayuno'],
      ['10:30', 'Taller vivencial'],
      ['12:30', 'Almuerzo liviano'],
      ['14:30', 'Preparación para Temazcal'],
      ['16:00', '🔥 Temazcal — ceremonia de purificación'],
      ['19:00', 'Descanso + cena liviana'],
      ['21:00', 'Fuego + reflexión guiada'],
    ],
  },
  {
    dia: 'Día 4',
    titulo: 'Integración & Cierre',
    eje: 'Bajar a la vida real',
    resumen: 'Integración · Cierre',
    items: [
      ['08:30', 'Práctica suave / meditación'],
      ['09:30', 'Desayuno'],
      ['11:00', 'Taller vivencial final'],
      ['12:30', 'Círculo de cierre'],
      ['14:00', 'Almuerzo'],
      ['15:30', 'Despedida'],
    ],
  },
];

// ─── Equipo ───────────────────────────────────────────────────────────────────
const EQUIPO = [
  {
    Icon: BookOpen,
    nombre: 'Nico Grupe',
    rol: 'Contenido central · Filosofía estoica',
    desc: 'Charlas, prácticas y la bajada conceptual del eje filosófico del retiro.',
  },
  {
    Icon: Users,
    nombre: 'Diego Epelman Hodara',
    rol: 'Integración vivencial',
    desc: 'Dinámicas, círculos y experiencias. Sostén energético del grupo.',
  },
  {
    Icon: Flame,
    nombre: 'Santiago Alzogaray',
    rol: 'Ceremonia de Temazcal',
    desc: 'Conducción del ritual de purificación que marca el corazón del retiro.',
  },
  {
    Icon: Music,
    nombre: 'Exequiel Lopez Benavidez',
    rol: 'Armonización Sonora',
    desc: 'Espacios de integración profunda a través del sonido.',
  },
  {
    Icon: Leaf,
    nombre: 'China Dericia',
    rol: 'Yoga & Consciencia corporal',
    desc: 'Movimiento consciente para habitar el cuerpo durante todo el proceso.',
  },
  {
    Icon: Star,
    nombre: 'Producción',
    rol: 'Curaduría de experiencia',
    desc: 'Producción completa de la experiencia, de punta a punta.',
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────────
const Despertar: React.FC = () => {
  const [openDay, setOpenDay] = useState<number | null>(0);

  useEffect(() => {
    document.title = 'DESPERTAR — Retiro de 4 días · 9 al 12 de Octubre · Pueblo Mágico';
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ backgroundColor: C.cream, color: C.dark }} className="overflow-x-hidden">
      <Header />

      {/* ── HERO ── */}
      <section
        className="relative h-[100svh] min-h-[600px] md:h-[100vh] w-full flex flex-col justify-center overflow-hidden"
        style={{
          backgroundImage: `url(${img('/uploads/img_6948.webp', 1800)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(10,20,12,0.97) 0%, rgba(10,20,12,0.6) 45%, rgba(10,20,12,0.15) 100%)' }}
        />

        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 md:px-12 pt-28 md:pt-20 pb-10 md:pb-0">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-3 mb-4">
            <span className="inline-block max-w-full px-3 sm:px-4 py-1.5 rounded-full text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.4em] uppercase font-bold border border-white/20 text-white/70 whitespace-nowrap">
              <span className="sm:hidden">9-12 Oct · Sierras de Córdoba</span>
              <span className="hidden sm:inline">9 al 12 de Octubre · Pueblo Mágico, Sierras de Córdoba</span>
            </span>
            <span
              className="inline-block max-w-full px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] tracking-wide sm:tracking-widest uppercase font-bold whitespace-nowrap"
              style={{ backgroundColor: 'rgba(212,175,55,0.15)', color: '#F4C27A', border: '1px solid rgba(212,175,55,0.3)' }}
            >
              4 días / 3 noches
            </span>
          </div>

          <p className="text-white/50 text-xs sm:text-sm tracking-[0.3em] uppercase mb-2 sm:mb-3 font-semibold">Retiro de reconexión y liderazgo consciente</p>
          <h1 className="text-6xl md:text-8xl serif-title leading-none mb-4 text-white">
            DESPERTAR
          </h1>
          <p className="text-xl md:text-2xl serif-title mb-4 md:mb-5" style={{ color: C.gold }}>
            Volver a vos es el verdadero cambio.
          </p>
          <p className="text-white/65 text-sm md:text-lg leading-relaxed max-w-lg md:max-w-2xl mb-6 md:mb-10">
            Un retiro de 4 días para salir del piloto automático y recuperar claridad, dirección y presencia.
            <br className="hidden md:block" />
            Naturaleza. Filosofía. Experiencia.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <a
              href={WA_RESERVA}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold text-sm py-4 px-8 inline-block"
            >
              Reservar mi lugar
            </a>
            <div>
              <p className="text-white/35 text-[10px] tracking-widest uppercase mb-2">Faltan</p>
              <Countdown />
            </div>
          </div>
        </div>
      </section>

      {/* ── ES MOMENTO ── */}
      <section className="py-20 md:py-28 px-6" style={{ backgroundColor: C.night }}>
        <div className="max-w-3xl mx-auto text-center" data-reveal>
          <div className="flex justify-center gap-5 mb-10">
            <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <Moon size={20} color="rgba(255,255,255,0.6)" />
            </div>
            <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(212,175,55,0.2)' }}>
              <Sun size={20} color={C.gold} />
            </div>
            <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(170,62,17,0.25)' }}>
              <Compass size={20} color="#F4A261" />
            </div>
          </div>
          <p className="text-[10px] tracking-[0.4em] uppercase font-semibold mb-5" style={{ color: 'rgba(212,175,55,0.6)' }}>
            Es momento
          </p>
          <blockquote className="text-2xl md:text-4xl serif-title text-white leading-relaxed mb-8">
            Hay un momento en que ya no alcanza<br className="hidden md:block" /> con seguir igual.
          </blockquote>
          <p className="text-white/60 text-base md:text-lg leading-relaxed max-w-xl mx-auto mb-5">
            Necesitás bajar un cambio. Observar con presencia. Resignificar y redireccionar el rumbo —
            alineado con tu propósito y con quién sos de verdad.
          </p>
          <p className="font-serif italic text-lg" style={{ color: C.gold }}>
            DESPERTAR es ese espacio.
          </p>
        </div>
      </section>

      {/* ── UNA EXPERIENCIA PARA RECORDAR ── */}
      <section className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div data-reveal>
            <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold"
              style={{ backgroundColor: C.green }}>
              Una experiencia para recordar
            </p>
            <h2 className="text-3xl md:text-4xl serif-title mb-6" style={{ color: C.green }}>
              Vas a entrenar la mente, atravesar el cuerpo<br />y reconectar con lo esencial
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 mt-12" data-reveal data-delay="1">
            <div className="rounded-2xl p-8 border" style={{ borderColor: 'rgba(0,83,51,0.12)', backgroundColor: 'rgba(0,83,51,0.03)' }}>
              <p className="text-sm mb-2" style={{ color: C.faint }}>No es simplemente una teoría.</p>
              <p className="text-xl serif-title" style={{ color: C.green }}>Es una experiencia vivencial.</p>
            </div>
            <div className="rounded-2xl p-8 border" style={{ borderColor: 'rgba(212,175,55,0.3)', backgroundColor: 'rgba(212,175,55,0.05)' }}>
              <p className="text-sm mb-2" style={{ color: C.faint }}>No es mera información.</p>
              <p className="text-xl serif-title" style={{ color: '#7A5C00' }}>Es transformación.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── EL PROCESO ── */}
      <section className="py-20 md:py-28 px-6" style={{ backgroundColor: '#F7F5F0' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14" data-reveal>
            <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold"
              style={{ backgroundColor: C.fire }}>
              El proceso
            </p>
            <h2 className="text-3xl md:text-4xl serif-title mb-4" style={{ color: C.dark }}>
              Cada momento del retiro<br />está diseñado como un camino
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5" data-reveal data-delay="1">
            {[
              { n: '01', Icon: Wind,    title: 'Soltar el ruido',          desc: 'Salir de la inercia y las distracciones.' },
              { n: '02', Icon: Eye,     title: 'Ver con claridad',         desc: 'Entender qué depende de vos y qué no.' },
              { n: '03', Icon: Flame,   title: 'Atravesar la experiencia', desc: 'Sumergirte en lo incómodo para crecer.' },
              { n: '04', Icon: Compass, title: 'Integrar',                 desc: 'Llevarlo a tu vida real.' },
            ].map(({ n, Icon, title, desc }) => (
              <div key={n} className="rounded-2xl p-7 border bg-white" style={{ borderColor: 'rgba(0,83,51,0.1)' }}>
                <span className="block text-4xl font-bold serif-title leading-none mb-4"
                  style={{ color: 'rgba(0,83,51,0.1)' }}>{n}</span>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(0,83,51,0.08)' }}>
                  <Icon size={18} color={C.green} />
                </div>
                <p className="font-bold text-base mb-2" style={{ color: C.green }}>{title}</p>
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LO QUE VAS A VIVIR (PILARES) ── */}
      <section className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14" data-reveal>
            <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold"
              style={{ backgroundColor: C.green }}>
              Lo que vas a vivir
            </p>
            <h2 className="text-3xl md:text-4xl serif-title mb-4" style={{ color: C.green }}>
              Mente, cuerpo, emoción y espíritu
            </h2>
            <p className="text-base max-w-lg mx-auto" style={{ color: C.muted }}>
              Un camino de regreso a lo esencial, sostenido por 4 pilares.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5" data-reveal data-delay="1">
            {[
              {
                Icon: BookOpen,
                color: C.green,
                bg: 'rgba(0,83,51,0.05)',
                border: 'rgba(0,83,51,0.15)',
                cat: 'Mente — Estoicismo aplicado',
                items: ['Filosofía estoica aplicada', 'Percepción, control y propósito', 'Herramientas prácticas para la vida cotidiana'],
              },
              {
                Icon: Mountain,
                color: '#8B6A00',
                bg: 'rgba(212,175,55,0.06)',
                border: 'rgba(212,175,55,0.25)',
                cat: 'Cuerpo — Experiencia',
                items: ['Movimiento consciente', 'Naturaleza, frío/calor, respiraciones', 'Dinámicas vivenciales'],
              },
              {
                Icon: Heart,
                color: '#7A3B2E',
                bg: 'rgba(170,62,17,0.06)',
                border: 'rgba(170,62,17,0.2)',
                cat: 'Emoción — Integración',
                items: ['Círculos de palabra', 'Vínculos genuinos y autenticidad', 'Espacios de integración grupal'],
              },
              {
                Icon: Sparkles,
                color: '#2A1708',
                bg: 'rgba(42,23,8,0.05)',
                border: 'rgba(42,23,8,0.12)',
                cat: 'Espíritu — Conexión',
                items: ['🔥 Temazcal — ritual de purificación', '🎶 Armonización sonora', 'Naturaleza, montaña y silencio'],
              },
            ].map(({ Icon, color, bg, border, cat, items }) => (
              <div key={cat} className="rounded-2xl p-7 border" style={{ backgroundColor: bg, borderColor: border }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                    <Icon size={18} color={color} />
                  </div>
                  <p className="font-bold text-sm uppercase tracking-wider" style={{ color }}>{cat}</p>
                </div>
                <ul className="space-y-2.5">
                  {items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm leading-relaxed" style={{ color: C.muted }}>
                      <span className="flex-shrink-0 mt-1" style={{ color }}>◆</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-center text-sm mt-8" style={{ color: C.faint }}>
            + Comunidad y conexión real durante los 4 días.
          </p>
        </div>
      </section>

      {/* ── PARA QUIÉN ES ── */}
      <section className="py-20 md:py-28 px-6" style={{ backgroundColor: '#F7F5F0' }}>
        <div className="max-w-3xl mx-auto" data-reveal>
          <div className="text-center mb-12">
            <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold"
              style={{ backgroundColor: C.fire }}>
              ¿Para quién es?
            </p>
            <h2 className="text-3xl md:text-4xl serif-title mb-4" style={{ color: C.dark }}>
              Esto es para vos si...
            </h2>
          </div>

          <div className="rounded-2xl p-8 md:p-10 border bg-white" style={{ borderColor: 'rgba(0,83,51,0.1)' }}>
            <ul className="space-y-5">
              {[
                'Sentís que estás en automático y querés vivir con más presencia.',
                'Buscás claridad y dirección alineada a tu propósito.',
                'Querés herramientas reales para aplicar en tu cotidiano y transformar tu realidad.',
                'Estás dispuesto a incomodarte para crecer y expandir tu zona de confort.',
              ].map(item => (
                <li key={item} className="flex items-start gap-4 text-base leading-relaxed" style={{ color: C.muted }}>
                  <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5" style={{ backgroundColor: 'rgba(0,83,51,0.08)' }}>
                    <Compass size={14} color={C.green} />
                  </span>
                  <span className="pt-0.5">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── QUÉ TE LLEVÁS ── */}
      <section className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14" data-reveal>
            <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold"
              style={{ backgroundColor: C.green }}>
              ¿Qué te llevás?
            </p>
            <h2 className="text-3xl md:text-4xl serif-title mb-4" style={{ color: C.green }}>
              Volvés con más de lo que llegaste
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-4" data-reveal data-delay="1">
            {[
              { Icon: Eye,      label: 'Claridad mental' },
              { Icon: Target,   label: 'Foco y dirección' },
              { Icon: Leaf,     label: 'Herramientas de bienestar para tu vida cotidiana' },
              { Icon: Sun,      label: 'Energía vital renovada' },
              { Icon: Users,    label: 'Conexión con vos y con otras personas y comunidades' },
            ].map(({ Icon, label }) => (
              <div key={label} className="rounded-2xl p-6 text-center border" style={{ borderColor: 'rgba(0,83,51,0.1)', backgroundColor: 'rgba(0,83,51,0.03)' }}>
                <div className="flex justify-center mb-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,83,51,0.08)' }}>
                    <Icon size={18} color={C.green} />
                  </div>
                </div>
                <p className="text-sm font-semibold leading-snug" style={{ color: C.dark }}>{label}</p>
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
                Pueblo Mágico,<br />Sierras de Córdoba
              </h2>
              <p className="text-base leading-relaxed mb-6" style={{ color: C.muted }}>
                Un ecolodge de montaña donde la naturaleza marca el ritmo y todo está diseñado para
                acompañar procesos reales.
              </p>
              <ul className="space-y-3">
                {[
                  'Sierras Grandes de Córdoba',
                  'Espacios abiertos, fogón y senderos',
                  'Salones y espacios para talleres y círculos',
                  'Entorno natural para silencio y desconexión',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: C.muted }}>
                    <span className="flex-shrink-0 mt-0.5" style={{ color: C.green }}>—</span>{item}
                  </li>
                ))}
              </ul>
              <a href={WA_INFO} target="_blank" rel="noopener noreferrer"
                className="inline-block mt-7 text-sm font-semibold border rounded-full px-6 py-2.5 transition-colors hover:bg-brand-green hover:text-white hover:border-brand-green"
                style={{ borderColor: 'rgba(0,83,51,0.3)', color: C.green }}>
                ¿Cómo llegar? Consultanos
              </a>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl" data-reveal data-delay="1">
              <img
                src={img('/uploads/dji_0074.webp', 900)}
                alt="Vista aérea de Pueblo Mágico, Sierras de Córdoba"
                className="w-full aspect-[4/3] object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── EL VIAJE (CRONOGRAMA) ── */}
      <section className="py-20 md:py-28 px-6" style={{ backgroundColor: C.night }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12" data-reveal>
            <p className="text-[10px] tracking-[0.4em] uppercase font-semibold mb-5" style={{ color: 'rgba(212,175,55,0.6)' }}>
              El viaje
            </p>
            <h2 className="text-3xl md:text-4xl serif-title text-white mb-4">
              4 días / 3 noches
            </h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Aterrizaje → Apertura → Profundidad → Integración → Cierre
            </p>
          </div>

          <div className="space-y-3" data-reveal data-delay="1">
            {CRONOGRAMA.map((day, i) => {
              const isOpen = openDay === i;
              return (
                <div key={day.dia} className="rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                  <button
                    onClick={() => setOpenDay(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-4 text-left px-6 py-5"
                  >
                    <div>
                      <p className="text-[10px] tracking-widest uppercase font-semibold mb-1" style={{ color: C.gold }}>{day.dia} · {day.titulo}</p>
                      <p className="text-white font-semibold text-base">{day.resumen}</p>
                      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{day.eje}</p>
                    </div>
                    <ChevronDown
                      size={20}
                      color="rgba(255,255,255,0.5)"
                      className="flex-shrink-0 transition-transform duration-300"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6">
                      <ul className="space-y-2.5 border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                        {day.items.map(([time, activity]) => (
                          <li key={time} className="flex items-start gap-4 text-sm">
                            <span className="flex-shrink-0 font-semibold w-12" style={{ color: C.gold }}>{time}</span>
                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{activity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── ACOMPAÑAMIENTO / EQUIPO ── */}
      <section className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14" data-reveal>
            <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold"
              style={{ backgroundColor: C.green }}>
              Acompañamiento
            </p>
            <h2 className="text-3xl md:text-4xl serif-title mb-4" style={{ color: C.green }}>
              Un equipo multidisciplinario al servicio<br />de tu transformación
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5" data-reveal data-delay="1">
            {EQUIPO.map(({ Icon, nombre, rol, desc }) => (
              <div key={nombre} className="rounded-2xl p-7 border" style={{ borderColor: 'rgba(0,83,51,0.1)', backgroundColor: 'rgba(0,83,51,0.02)' }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: 'rgba(0,83,51,0.08)' }}>
                  <Icon size={20} color={C.green} />
                </div>
                <p className="font-bold text-base mb-1" style={{ color: C.dark }}>{nombre}</p>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: C.green }}>{rol}</p>
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INVERSIÓN ── */}
      <section className="py-20 md:py-28 px-6" style={{ backgroundColor: '#F7F5F0' }}>
        <div className="max-w-3xl mx-auto text-center" data-reveal>
          <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold"
            style={{ backgroundColor: C.fire }}>
            Inversión
          </p>
          <h2 className="text-3xl md:text-4xl serif-title mb-6" style={{ color: C.dark }}>
            Reservá tu lugar en DESPERTAR
          </h2>
          <p className="text-base leading-relaxed mb-8 max-w-xl mx-auto" style={{ color: C.muted }}>
            Cupos limitados. Escribinos por WhatsApp y te contamos los valores, formas de pago y todo lo
            que incluye la experiencia de 4 días / 3 noches.
          </p>

          <div className="rounded-2xl p-8 border bg-white text-left mb-8" style={{ borderColor: 'rgba(0,83,51,0.1)' }}>
            <p className="text-[10px] tracking-widest uppercase font-semibold mb-4" style={{ color: C.green }}>La experiencia incluye</p>
            <ul className="space-y-2.5">
              {[
                'Alojamiento — 3 noches en Pueblo Mágico',
                'Todas las comidas (alimentación consciente)',
                'Talleres vivenciales y prácticas guiadas',
                '🔥 Ceremonia de Temazcal',
                '🎶 Armonización sonora',
                'Acompañamiento de equipo multidisciplinario',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm" style={{ color: C.muted }}>
                  <span className="flex-shrink-0 mt-0.5" style={{ color: C.green }}>✓</span>{item}
                </li>
              ))}
            </ul>
          </div>

          <a href={WA_RESERVA} target="_blank" rel="noopener noreferrer" className="btn-gold text-sm py-4 px-10 inline-block">
            Consultar valores y reservar
          </a>
        </div>
      </section>

      <SectionRegeneracion />

      {/* ── CTA FINAL ── */}
      <section
        className="py-28 md:py-40 px-6 text-white text-center relative overflow-hidden"
        style={{ backgroundImage: `url(${img('/uploads/fogon_nocturno.webp', 1600)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: 'rgba(10,20,12,0.88)' }} />
        <div className="max-w-2xl mx-auto relative z-10" data-reveal>
          <div className="flex justify-center mb-8">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.3)' }}>
              <Sun size={26} color={C.gold} />
            </div>
          </div>
          <h2 className="text-3xl md:text-5xl serif-title text-white mb-6 leading-tight">
            Despertar no es una idea.
          </h2>
          <p className="font-serif italic text-2xl md:text-3xl mb-10" style={{ color: C.gold }}>
            Es una decisión.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={WA_RESERVA} target="_blank" rel="noopener noreferrer"
              className="btn-gold text-sm py-5 px-10 inline-block">
              Reservar mi lugar
            </a>
            <a href={WA_INFO} target="_blank" rel="noopener noreferrer"
              className="inline-block border border-white/30 text-white/80 font-semibold text-sm py-5 px-10 rounded-full hover:bg-white/10 transition-colors">
              Tengo preguntas
            </a>
          </div>
          <p className="text-xs mt-8" style={{ color: 'rgba(255,255,255,0.3)' }}>
            9 al 12 de Octubre · Pueblo Mágico, Sierras de Córdoba
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Despertar;
