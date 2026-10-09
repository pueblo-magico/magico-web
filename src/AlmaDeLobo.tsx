import React, { useState, useEffect } from 'react';
import { Moon, Flame, Mountain, Users, ChevronDown, Instagram, Mail, MessageCircle, Wind, Eye, Sparkles } from 'lucide-react';
import { img } from './lib/img';
import { WA_MAGICO } from './data/config';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { SectionRegeneracion } from '../components/SectionRegeneracion';

const WA_INFO    = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent('¡Hola! Me interesa Alma de Lobo del 2, 3 y 4 de octubre. ¿Me pueden dar más info?')}`;
const WA_RESERVA = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent('¡Hola! Siento el llamado de Alma de Lobo. Quiero reservar mi lugar.')}`;

const C = {
  ember: '#6B3A1F',
  fire:  '#AA3E11',
  gold:  '#D4AF37',
  night: '#17100A',
  cream: '#FDFBF7',
  dark:  '#2A1708',
  muted: '#6B4A33',
  faint: '#8B6347',
};

const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-AR')}`;

const APORTES = [
  { key: 'minimo', label: 'Aporte mínimo', monto: 465000, nota: 'Para quien necesita que el valor no sea la barrera.', sugerido: false },
  { key: 'retiro', label: 'Valor del retiro', monto: 495000, nota: 'El valor real de sostener este espacio.', sugerido: true },
  { key: 'fraterno', label: 'Aporte fraterno', monto: 525000, nota: 'Para quien puede sostener también el lugar de otro hermano.', sugerido: false },
] as const;

const INCLUYE = [
  'Alojamiento en habitaciones compartidas',
  'Alimentación completa',
  'Todas las actividades y ceremonias del fin de semana',
];

const VIVIR = [
  { Icon: Users, text: 'Círculos de palabra entre hombres' },
  { Icon: Sparkles, text: 'Ceremonia con plantas sagradas' },
  { Icon: Moon, text: 'Meditaciones & Rituales' },
  { Icon: Mountain, text: 'Caminatas conscientes en la montaña' },
  { Icon: Wind, text: 'Inmersión en agua fría' },
  { Icon: Flame, text: 'Círculos de Fuego' },
  { Icon: Flame, text: 'Ceremonia de Temazcal' },
  { Icon: Eye, text: 'Espacios de silencio, escucha y transformación' },
];

const EQUIPO = [
  {
    nombre: 'Gustavo Torras',
    rol: 'Buscador · Terapeuta sonoro',
    desc: 'Facilitador de Kambo, terapia de regresiones y vidas pasadas, maestro de Reiki. Caminante del danzar de la vida y apasionado del poder del monte nativo.',
    photo: '/uploads/vuelo-condor/Toti.webp',
  },
  {
    nombre: 'Diego Epelman',
    rol: 'Comunicador · Coach en Bienestar',
    desc: 'Facilitador de experiencias transformadoras, emprendedor apasionado, Guardián de Vida. Fundador de Pueblo Mágico.',
    photo: '/uploads/vuelo-condor/Diego.webp',
  },
  {
    nombre: 'Juan Cruz Sartori',
    rol: 'Coach Ontológico · Hombre Medicina',
    desc: 'Biodecodificador, Constelador familiar, PNL e Hipnosis, Breathwork, Terapeuta en Regresiones.',
    photo: '/uploads/vuelo-condor/juan.webp',
  },
];

// ─── Countdown ─────────────────────────────────────────────────────────────────
const Countdown: React.FC = () => {
  const target = new Date('2026-10-02T09:00:00').getTime();
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

const AlmaDeLobo: React.FC = () => {
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    document.title = 'Alma de Lobo · 2, 3 y 4 de Octubre · Pueblo Mágico';
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
        <div className="absolute inset-0 md:hidden" style={{ backgroundImage: `url(${img('/uploads/alma-de-lobo.webp', 1200)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 hidden md:block" style={{ backgroundImage: `url(${img('/uploads/alma-de-lobo-hero-desktop.webp', 1800)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(23,16,10,0.97) 0%, rgba(23,16,10,0.6) 45%, rgba(23,16,10,0.25) 100%)' }} />

        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 md:px-12 pt-28 md:pt-36 pb-10 md:pb-0 flex flex-col md:items-center md:text-center">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center md:justify-center gap-2 sm:gap-3 mb-4">
            <span className="inline-block max-w-full px-3 sm:px-4 py-1.5 rounded-full text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.4em] uppercase font-bold border border-white/20 text-white/70 whitespace-nowrap">
              <span className="sm:hidden">2, 3 y 4 Oct · Los Gigantes</span>
              <span className="hidden sm:inline">2, 3 y 4 de octubre · Los Gigantes, Córdoba</span>
            </span>
            <span className="inline-block max-w-full px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] tracking-wide sm:tracking-widest uppercase font-bold whitespace-nowrap"
              style={{ backgroundColor: 'rgba(212,175,55,0.15)', color: '#F4C27A', border: '1px solid rgba(212,175,55,0.3)' }}>
              Encuentro de hombres
            </span>
          </div>

          <p className="text-white/50 text-xs sm:text-sm tracking-[0.3em] uppercase mb-2 sm:mb-3 font-semibold">Encuentro de hombres en la montaña</p>
          <h1 className="text-5xl md:text-7xl serif-title leading-none mb-4 text-white">
            Alma <span style={{ color: C.gold }}>de Lobo</span>
          </h1>
          <p className="text-white/65 text-sm md:text-lg leading-relaxed max-w-lg md:max-w-2xl mt-4 mb-6 md:mt-5 md:mb-10">
            El lobo sabe cuándo es tiempo de aullar, de regresar a la manada, de caminar hacia adentro. Nos reunimos bajo la luna llena, entre fuego, montaña y silencio, para compartir la experiencia de ser hombres.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <a href={WA_RESERVA} target="_blank" rel="noopener noreferrer" className="btn-gold text-sm py-4 px-8 inline-block">
              Siento el llamado
            </a>
            <div>
              <p className="text-white/35 text-[10px] tracking-widest uppercase mb-2">Faltan</p>
              <Countdown />
            </div>
          </div>

          <a href="#inversion" className="inline-flex items-center gap-1.5 text-white/50 hover:text-gold text-xs sm:text-sm font-semibold uppercase tracking-wider mt-6 transition-colors">
            Ver inversión
            <ChevronDown size={14} className="animate-bounce" style={{ animationDuration: '1.8s' }} />
          </a>

          <p className="text-white/40 text-xs sm:text-sm mt-6 max-w-md leading-relaxed">
            Sin edad límite. Solo apertura. Solo presencia. Solo verdad.
          </p>
        </div>
      </section>

      {/* ── EL LLAMADO ── */}
      <section className="relative py-20 md:py-28 px-6 overflow-hidden" style={{ backgroundColor: C.night }}>
        <div className="max-w-3xl mx-auto text-center relative z-10" data-reveal>
          <p className="text-[10px] tracking-[0.4em] uppercase font-semibold mb-6" style={{ color: C.gold }}>El llamado</p>
          <p className="text-lg md:text-2xl serif-title text-white/85 leading-relaxed mb-8">
            El lobo sabe cuándo es tiempo de aullar.<br />
            De regresar a la manada.<br />
            De caminar hacia adentro.<br />
            De despertar su fuerza salvaje y su espíritu sagrado.
          </p>
          <p className="text-sm md:text-base leading-relaxed text-white/60 max-w-2xl mx-auto mb-6">
            <em>Alma de Lobo</em> es un retiro para hombres que sienten el llamado de volver al origen, de caminar entre otros hombres desde un lugar consciente, profundo y verdadero.
          </p>
          <p className="text-sm md:text-base leading-relaxed text-white/60 max-w-2xl mx-auto">
            Nos reunimos bajo la luna llena, entre fuego, montaña y silencio, para compartir la experiencia de ser hombres. De habitar el cuerpo, la emoción, la palabra. De soltar lo que ya no sirve y abrir espacio a lo nuevo.
          </p>
        </div>
      </section>

      {/* ── LO QUE VAS A VIVIR ── */}
      <section className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12" data-reveal>
            <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold" style={{ backgroundColor: C.fire }}>
              La experiencia
            </p>
            <h2 className="text-3xl md:text-4xl serif-title mb-4" style={{ color: C.ember }}>
              Lo que vas a vivir
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-reveal data-delay="1">
            {VIVIR.map(({ Icon, text }) => (
              <div key={text} className="rounded-2xl p-4 border text-center" style={{ borderColor: 'rgba(170,62,17,0.15)', backgroundColor: 'rgba(170,62,17,0.03)' }}>
                <Icon size={18} color={C.fire} className="mx-auto mb-2" />
                <p className="text-xs font-semibold leading-tight" style={{ color: C.dark }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ¿DÓNDE? ── */}
      <section className="py-20 md:py-28 px-6" style={{ backgroundColor: '#F7F5F0' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div data-reveal>
              <p className="text-[10px] tracking-[0.3em] uppercase mb-4 font-semibold" style={{ color: C.fire }}>¿Dónde?</p>
              <h2 className="text-3xl md:text-4xl serif-title mb-5 leading-tight" style={{ color: C.ember }}>
                Pueblo Mágico,<br />Los Gigantes
              </h2>
              <p className="text-base leading-relaxed mb-6" style={{ color: C.muted }}>
                Un ecolodge de montaña en Los Gigantes, Córdoba. Un espacio para realizar retiros y actividades orientadas al desarrollo personal. Inmerso en la naturaleza, invita a conectar con la esencia y el propósito más profundo.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a href={WA_INFO} target="_blank" rel="noopener noreferrer"
                  className="inline-block text-sm font-semibold border rounded-full px-6 py-2.5 transition-colors hover:opacity-90"
                  style={{ borderColor: C.fire, color: C.fire }}>
                  ¿Cómo llegar? Consultanos
                </a>
                <a href="https://www.instagram.com/pueblomagico__/" target="_blank" rel="noopener noreferrer" aria-label="Instagram de Pueblo Mágico"
                  className="w-10 h-10 rounded-full flex items-center justify-center border transition-colors" style={{ borderColor: C.fire }}>
                  <Instagram size={16} color={C.fire} />
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3" data-reveal data-delay="1">
              <div className="rounded-2xl overflow-hidden shadow-xl col-span-2">
                <img src={img('/uploads/dji_0074.webp', 900)} alt="Vista aérea de Pueblo Mágico" className="w-full aspect-[16/9] object-cover" loading="lazy" />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <img src={img('/uploads/temazcal.webp', 600)} alt="Ceremonia de Temazcal" className="w-full aspect-square object-cover" loading="lazy" />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <img src={img('/uploads/domos.webp', 600)} alt="Domos de Pueblo Mágico" className="w-full aspect-square object-cover" loading="lazy" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ¿A QUIÉN ESTÁ DIRIGIDO? ── */}
      <section className="relative py-20 md:py-28 px-6 overflow-hidden" style={{ backgroundColor: C.night }}>
        <div className="max-w-2xl mx-auto text-center relative z-10" data-reveal>
          <p className="text-[10px] tracking-[0.3em] uppercase font-semibold mb-5" style={{ color: C.gold }}>¿A quién está dirigido?</p>
          <p className="text-base md:text-lg leading-relaxed text-white/75 mb-6">
            A hombres que quieran mirarse de verdad, abrirse al vínculo con otros, trabajar su energía masculina y reconectar con la naturaleza viva.
          </p>
          <p className="text-lg md:text-xl serif-title" style={{ color: C.gold }}>
            Sin edad límite. Solo apertura. Solo presencia. Solo verdad.
          </p>
        </div>
      </section>

      {/* ── INVERSIÓN ── */}
      <section id="inversion" className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10" data-reveal>
            <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold" style={{ backgroundColor: C.fire }}>
              Inversión
            </p>
            <h2 className="text-3xl md:text-4xl serif-title mb-4" style={{ color: C.ember }}>
              Valores por persona
            </h2>
            <p className="text-base max-w-lg mx-auto" style={{ color: C.muted }}>
              Flexibilidad en formas de pago. El lugar se reserva con una seña — si necesitás otra modalidad, la conversamos antes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-5 items-start mb-10" data-reveal data-delay="1">
            {APORTES.map(a => (
              <div key={a.key} className="rounded-2xl p-6 md:p-7 relative flex flex-col h-full"
                style={{
                  backgroundColor: a.sugerido ? 'rgba(170,62,17,0.05)' : 'white',
                  border: `1px solid ${a.sugerido ? C.fire : 'rgba(170,62,17,0.15)'}`,
                  boxShadow: a.sugerido ? '0 8px 30px rgba(170,62,17,0.12)' : 'none',
                }}
              >
                {a.sugerido && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wide px-3 py-1 rounded-full text-white whitespace-nowrap" style={{ backgroundColor: C.fire }}>
                    Valor sugerido
                  </span>
                )}
                <p className="text-[10px] tracking-widest uppercase font-semibold mb-1" style={{ color: C.fire }}>{a.label}</p>
                <p className="text-2xl md:text-3xl font-bold serif-title mb-3" style={{ color: C.ember }}>{fmt(a.monto)}</p>
                <p className="text-xs mb-5" style={{ color: C.faint }}>{a.nota}</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {INCLUYE.map(i => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: C.muted }}>
                      <span className="flex-shrink-0 mt-0.5" style={{ color: C.fire }}>✓</span>{i}
                    </li>
                  ))}
                </ul>
                <a href={WA_RESERVA} target="_blank" rel="noopener noreferrer"
                  className="block text-center py-3.5 px-4 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: C.fire }}>
                  Reservar mi lugar
                </a>
              </div>
            ))}
          </div>

          <p className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: C.fire }}>
            <Flame size={13} />
            Cupos muy limitados
          </p>
        </div>
      </section>

      <SectionRegeneracion />

      {/* ── QUIENES SOMOS ── */}
      <section className="py-20 md:py-28 px-6" style={{ backgroundColor: '#F7F5F0' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12" data-reveal>
            <img src={img('/uploads/acan-de-fuego-logo.png', 200)} alt="Acan de Fuego · Círculo de Hombres" className="w-20 h-20 object-contain mx-auto mb-4" loading="lazy" />
            <p className="text-[10px] tracking-[0.3em] uppercase mb-4 font-semibold" style={{ color: C.fire }}>Quienes somos</p>
            <h2 className="text-3xl md:text-4xl serif-title mb-5" style={{ color: C.ember }}>Acan de Fuego</h2>
            <p className="text-sm md:text-base leading-relaxed max-w-2xl mx-auto" style={{ color: C.muted }}>
              Un círculo de hombres que nace del deseo profundo de habitar lo masculino de forma más consciente y auténtica. Cuatro compañeros de camino que sienten el llamado de crear espacios sagrados donde los hombres podamos mirarnos, acompañarnos y transformarnos.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4" data-reveal data-delay="1">
            {EQUIPO.map(({ nombre, rol, desc, photo }) => (
              <div key={nombre} className="rounded-2xl p-5 border text-center" style={{ borderColor: 'rgba(170,62,17,0.15)', backgroundColor: 'white' }}>
                {photo ? (
                  <img src={img(photo, 200)} alt={nombre} className="w-16 h-16 rounded-full object-cover mx-auto mb-3" loading="lazy" />
                ) : (
                  <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: 'rgba(170,62,17,0.1)' }}>
                    <Flame size={22} color={C.fire} />
                  </div>
                )}
                <p className="font-bold text-sm mb-0.5" style={{ color: C.ember }}>{nombre}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: C.fire }}>{rol}</p>
                <p className="text-xs leading-relaxed" style={{ color: C.muted }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CIERRE / CONTACTO ── */}
      <section className="relative py-28 md:py-36 px-6 text-white text-center overflow-hidden" style={{ backgroundColor: C.night }}>
        <div className="max-w-2xl mx-auto relative z-10" data-reveal>
          <div className="flex justify-center mb-8">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(170,62,17,0.3)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <Moon size={26} color={C.gold} />
            </div>
          </div>
          <h2 className="text-3xl md:text-5xl serif-title text-white mb-6 leading-tight">
            ¡Si sentís el llamado, contactanos!
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <a href={WA_RESERVA} target="_blank" rel="noopener noreferrer" className="btn-gold text-sm py-5 px-10 inline-block">
              Reservar mi lugar
            </a>
            <a href={WA_INFO} target="_blank" rel="noopener noreferrer"
              className="inline-block border border-white/30 text-white/80 font-semibold text-sm py-5 px-10 rounded-full hover:bg-white/10 transition-colors">
              Tengo preguntas
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/60">
            <a href={WA_INFO} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-white transition-colors">
              <MessageCircle size={16} /> +54 9 3516765820
            </a>
            <a href="mailto:infokintu@gmail.com" className="inline-flex items-center gap-2 hover:text-white transition-colors">
              <Mail size={16} /> infokintu@gmail.com
            </a>
            <a href="https://www.instagram.com/acandefuego" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-white transition-colors">
              <Instagram size={16} /> @acandefuego
            </a>
          </div>
          <p className="text-xs mt-8 text-white/40">
            2, 3 y 4 de octubre · Pueblo Mágico, Los Gigantes, Córdoba
          </p>
        </div>
      </section>

      {/* ── BARRA FIJA MOBILE ── */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-[998] px-4 pt-3 transition-transform duration-300 ${showStickyBar ? 'translate-y-0' : 'translate-y-full'}`}
        style={{
          paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
          backgroundColor: 'rgba(23,16,10,0.97)',
          borderTop: '1px solid rgba(212,175,55,0.25)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <a href={WA_RESERVA} target="_blank" rel="noopener noreferrer" className="btn-gold text-sm py-3 w-full text-center block">
          Reservar mi lugar
        </a>
      </div>

      <Footer />
    </div>
  );
};

export default AlmaDeLobo;
