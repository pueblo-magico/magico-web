import React, { useEffect, useState } from 'react';
import { LanguageProvider } from '../contexts/LanguageContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { SectionRegeneracion } from '../components/SectionRegeneracion';
import {
  House, ForkKnife, Laptop, HeartStraight, Campfire, Drop, Sun,
  WifiHigh, CheckCircle, ArrowRight, Star, WhatsappLogo, Tree, UsersThree,
  CaretDownIcon, HouseIcon, ClockIcon, CalendarIcon, Brain, Sparkle, Moon,
  Mountains, Bank, DownloadSimple, FilePdf, CircleNotch, InstagramLogo,
  CaretLeft, CaretRight, ForkKnifeIcon, PawPrintIcon, WheelchairIcon,
} from '@phosphor-icons/react';
import { WA_MAGICO, SITE_URL } from './data/config';
import { COLIVING_PRICES } from './data/retreats';
import { ROUTES } from './routes';
import { submitForm } from './lib/submitForm';

const WA = (msg: string) =>
  `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent(msg)}`;

const WA_COLIVING = WA(COLIVING_PRICES.message);

const fmt = (n: number) => n.toLocaleString('es-AR');

// Cuotas con tarjeta de crédito = 20% más que efectivo/transferencia
const pago = (efectivo: number) => {
  const lista = Math.round(efectivo * 1.2);
  const cuota = Math.round(lista / 3);
  const ahorro = lista - efectivo;
  return { efectivo, lista, cuota, ahorro };
};

// ── Hero ──────────────────────────────────────────────────────────────────────
const Hero: React.FC = () => (
  <section className="relative h-[92vh] min-h-[600px] w-full flex items-end overflow-hidden">
    <img
      src="/uploads/coliving-hero-mobile.webp"
      alt="Coliving Mágico — espacio de trabajo y descanso en la naturaleza"
      className="absolute inset-0 w-full h-full object-cover object-center md:hidden"
      {...{ fetchpriority: 'high' }}
      decoding="async"
    />
    <img
      src="/uploads/coliving-hero-desktop.webp"
      alt="Coliving Mágico — espacio de trabajo y descanso en la naturaleza"
      className="absolute inset-0 w-full h-full object-cover object-center hidden md:block"
      {...{ fetchpriority: 'high' }}
      decoding="async"
    />
    <div className="absolute inset-0 bg-[#002d1a]/45" />
    <div className="absolute inset-0 bg-gradient-to-t from-[#002d1a]/95 via-[#002d1a]/50 to-[#002d1a]/10" />
    <div className="relative z-10 w-full max-w-5xl mx-auto px-6 pb-16 md:pb-24">
      <p className="text-gold/80 text-[10px] uppercase tracking-[0.3em] font-bold mb-4">
        Coliving Mágico (estadías largas) · Bienestar &amp; Estilo de Vida
      </p>
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-white leading-tight mb-5 drop-shadow-xl font-light max-w-3xl">
        Un espacio para vivir,<br />trabajar y reconectar
      </h1>
      <p className="text-white/75 text-base font-light max-w-xl mb-7 leading-relaxed">
        Un entorno en la naturaleza pensado para quienes buscan bajar el ritmo, enfocarse y compartir en comunidad.
        Acá el bienestar no es una actividad más — es la base de la vida cotidiana.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <a
          href={WA_COLIVING}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-gold text-white px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-brand transition-[background-color,color] duration-300 shadow-lg"
        >
          <WhatsappLogo className="w-4 h-4 flex-shrink-0" weight="fill" />
          Consultar disponibilidad
        </a>
        <a
          href="#formatos"
          className="inline-flex items-center justify-center gap-2 border border-white/40 text-white/90 px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors duration-300"
        >
          Ver formatos y precios
          <ArrowRight className="w-4 h-4 flex-shrink-0" />
        </a>
      </div>
    </div>
  </section>
);

// ── Strip de inclusiones ──────────────────────────────────────────────────────
const Inclusiones: React.FC = () => {
  const items = [
    { icon: <House className="w-5 h-5" weight="duotone" />,     label: 'Alojamiento · Ropa blanca y toallón' },
    { icon: <Drop className="w-5 h-5" weight="duotone" />,      label: 'Biocosmética en las duchas' },
    { icon: <ForkKnife className="w-5 h-5" weight="duotone" />, label: 'Desayuno, almuerzo y cena caseros' },
    { icon: <HeartStraight className="w-5 h-5" weight="duotone" />, label: 'Programa Reset Vital' },
    { icon: <WifiHigh className="w-5 h-5" weight="duotone" />,  label: 'WiFi satelital' },
    { icon: <Tree className="w-5 h-5" weight="duotone" />,      label: 'Acceso a todo el predio' },
  ];

  return (
    <div className="bg-brand text-white py-5 px-6">
      <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-x-8 gap-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-white/85">
            <span className="text-gold">{item.icon}</span>
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Tu entorno ─────────────────────────────────────────────────────────────────
const TuEntorno: React.FC = () => (
  <section className="py-14 bg-white border-b border-brand/5">
    <div className="max-w-5xl mx-auto px-6">
      <div data-reveal className="grid sm:grid-cols-3 gap-6 text-center">
        {[
          { icon: <Mountains className="w-6 h-6" weight="duotone" />, big: '200 HAS', small: 'de reserva natural privada' },
          { icon: <Drop className="w-6 h-6" weight="duotone" />, big: 'Ríos & arroyos', small: 'para caminar, descansar y desconectar' },
          { icon: <Sun className="w-6 h-6" weight="duotone" />, big: 'Los mejores atardeceres', small: 'de Los Gigantes, Córdoba' },
        ].map((s, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-11 h-11 rounded-full bg-bone flex items-center justify-center text-brand mb-2">{s.icon}</div>
            <p className="font-serif text-brand text-lg">{s.big}</p>
            <p className="text-dark/50 text-xs">{s.small}</p>
          </div>
        ))}
      </div>
      <p className="text-center text-dark/50 text-sm max-w-xl mx-auto mt-8 leading-relaxed">
        Cambiar de espacio también cambia tu descanso. Y no vas a estar solo: compartís el proceso con personas que están
        en la misma sintonía — buscando foco, calma y una versión más plena de sí mismas.
      </p>
      <p className="text-center text-brand font-serif text-base md:text-lg max-w-xl mx-auto mt-6 leading-relaxed">
        Viniste a desconectar. Vas a terminar conectando más — con vos mismo.
      </p>
    </div>
  </section>
);

// ── Por qué funciona (respaldo científico) ────────────────────────────────────
const CIENCIA = [
  {
    icon: <Brain className="w-6 h-6" weight="duotone" />,
    dato: 'Más foco',
    texto: 'Pasar tiempo en la naturaleza restaura la atención y la memoria de trabajo (Teoría de la Restauración Atencional, Kaplan).',
  },
  {
    icon: <Sparkle className="w-6 h-6" weight="duotone" />,
    dato: '+47% creatividad',
    texto: 'Un estudio de UC Berkeley encontró que, tras días de inmersión en naturaleza, las personas resuelven un 47% más problemas creativos.',
  },
  {
    icon: <Moon className="w-6 h-6" weight="duotone" />,
    dato: 'Mejor descanso',
    texto: 'La cercanía a espacios verdes y ríos se asocia a mejor calidad de sueño en estudios internacionales.',
  },
  {
    icon: <ForkKnife className="w-6 h-6" weight="duotone" />,
    dato: 'Energía sostenida',
    texto: 'Comidas caseras y balanceadas — sin ultraprocesados — sostienen la atención y la energía durante el día.',
  },
];

const PorQueFunciona: React.FC = () => (
  <section className="py-20 bg-bone">
    <div className="max-w-6xl mx-auto px-6 lg:px-12">
      <div data-reveal className="text-center mb-12">
        <p className="text-brand font-bold tracking-widest uppercase text-xs mb-3">Por qué funciona</p>
        <h2 className="text-3xl md:text-4xl font-serif text-brand">No es solo una sensación</h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {CIENCIA.map((c, i) => (
          <div key={i} data-reveal data-delay={`${i + 1}` as any} className="bg-white rounded-2xl p-6 border border-brand/5 shadow-sm text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-bone flex items-center justify-center text-brand mb-3">{c.icon}</div>
            <p className="text-gold font-serif text-xl mb-2">{c.dato}</p>
            <p className="text-dark/60 text-xs leading-relaxed">{c.texto}</p>
          </div>
        ))}
      </div>
      <p className="text-center text-dark/30 text-[11px] mt-8">
        Basado en investigación de psicología ambiental — Kaplan (Teoría de la Restauración Atencional) y Piff et al. (UC Berkeley).
      </p>
    </div>
  </section>
);

// ── Galería ────────────────────────────────────────────────────────────────────
const GALERIA = [
  { src: '/uploads/coworking.webp',                    caption: 'Coworking · WiFi satelital' },
  { src: '/uploads/habitaciones.webp',                 caption: 'Habitaciones · Ropa blanca y toallón incluidos' },
  { src: '/uploads/domos.webp',                        caption: 'Domos geodésicos' },
  { src: '/uploads/mesadas.webp',                      caption: 'Cocina · Pensión completa · 3 comidas' },
  { src: '/uploads/yoga_salon.webp',                   caption: 'El salón · Encuentros y círculos de trabajo' },
  { src: '/uploads/exterior.webp',                     caption: 'El predio · 200 hectáreas' },
  { src: '/uploads/Invierno/20250629_135046.webp',     caption: 'Ventanal con vistas a la sierra' },
  { src: '/uploads/Invierno/20250629_152354.webp',     caption: 'Camino rural hacia el horizonte' },
  { src: '/uploads/Invierno/20250628_181834.webp',     caption: 'Atardecer desde la pirca de piedra' },
  { src: '/uploads/botica.webp',                       caption: 'La botica · Plantas de la sierra' },
  { src: '/uploads/Invierno/20250627_222558.webp',     caption: 'Cielo estrellado en la montaña' },
];

const Galeria: React.FC = () => {
  const [idx, setIdx] = useState(0);
  const prev = () => setIdx(i => (i - 1 + GALERIA.length) % GALERIA.length);
  const next = () => setIdx(i => (i + 1) % GALERIA.length);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        <div data-reveal className="text-center mb-10">
          <p className="text-brand font-bold tracking-widest uppercase text-xs mb-3">El espacio</p>
          <h2 className="text-3xl md:text-4xl font-serif text-brand">Así se vive Coliving Mágico</h2>
        </div>

        <div data-reveal className="relative rounded-2xl overflow-hidden shadow-lg bg-bone"
          style={{ height: '62vh', minHeight: '340px', maxHeight: '560px' }}>
          {GALERIA.map((g, i) => (
            <div key={g.src} className="absolute inset-0 transition-opacity duration-700"
              style={{ opacity: i === idx ? 1 : 0 }}>
              <img src={g.src} alt={g.caption} loading={i === 0 ? 'eager' : 'lazy'}
                className="w-full h-full object-cover" />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

          <button onClick={prev} aria-label="Foto anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors">
            <CaretLeft className="w-5 h-5 text-white" weight="bold" />
          </button>
          <button onClick={next} aria-label="Foto siguiente"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors">
            <CaretRight className="w-5 h-5 text-white" weight="bold" />
          </button>

          <div className="absolute bottom-4 left-0 right-0 z-10 text-center px-4">
            <p className="text-white text-xs font-semibold mb-3 drop-shadow">{GALERIA[idx].caption}</p>
            <div className="flex justify-center gap-1.5">
              {GALERIA.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)} aria-label={`Foto ${i + 1}`}
                  className="rounded-full transition-all duration-300"
                  style={{ width: i === idx ? 18 : 6, height: 6, backgroundColor: i === idx ? '#D4AF37' : 'rgba(255,255,255,0.5)' }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ── Momento: dónde nacen las ideas ─────────────────────────────────────────────
const MomentoIdeas: React.FC = () => (
  <section className="py-16 md:py-20 bg-white">
    <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center gap-10 md:gap-16">
      <div className="flex-1 order-2 md:order-1" data-reveal>
        <p className="text-gold text-[10px] tracking-[0.3em] uppercase font-bold mb-4">Donde nacen las mejores ideas</p>
        <h2 className="text-2xl md:text-3xl font-serif text-brand leading-snug mb-5">
          No nacen frente a una pantalla.
        </h2>
        <p className="text-dark/60 text-sm md:text-base leading-relaxed">
          Nacen caminando junto al río, mirando el atardecer sobre Los Gigantes, o en silencio después de una comida compartida.
          La naturaleza no interrumpe tu foco — lo prepara.
        </p>
      </div>
      <div className="flex-shrink-0 w-64 md:w-72 lg:w-80 order-1 md:order-2 rounded-2xl overflow-hidden shadow-xl" data-reveal data-delay="1">
        <img src="/uploads/dji_0074.webp" alt="Vista aérea de Pueblo Mágico al atardecer" className="w-full h-full object-cover" loading="lazy" />
      </div>
    </div>
  </section>
);

// ── Posicionamiento (antes de precios) ─────────────────────────────────────────
const Posicionamiento: React.FC = () => (
  <section className="py-14 bg-bone">
    <div className="max-w-2xl mx-auto px-6 text-center" data-reveal>
      <h2 className="text-2xl md:text-3xl font-serif text-brand leading-snug mb-3">
        No vendemos noches de hotel.
      </h2>
      <p className="text-dark/60 text-sm md:text-base leading-relaxed">
        Compartimos un espacio real para vivir, trabajar y encontrarte de nuevo — con foco, comunidad y tiempo en la naturaleza.
        Vos ponés el ritmo.
      </p>
    </div>
  </section>
);

// ── Alimentación ───────────────────────────────────────────────────────────────
const Alimentacion: React.FC = () => (
  <section className="relative overflow-hidden">
    <img src="/uploads/469731807_3987061274856806_2943773444767775905_n.jpg" alt="Comida casera en Pueblo Mágico"
      className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
    <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(4,10,20,0.90) 0%, rgba(4,10,20,0.85) 100%)' }} />
    <div data-reveal className="relative z-10 max-w-3xl mx-auto px-6 py-16 md:py-20 text-center">
      <p className="text-gold text-[10px] tracking-[0.3em] uppercase font-bold mb-3">Pensión completa · 3 comidas · incluido</p>
      <h2 className="text-2xl md:text-3xl font-serif text-white mb-5">Alimentación</h2>
      <p className="text-white/75 text-sm md:text-base leading-relaxed mb-7 max-w-xl mx-auto">
        Cada plato se prepara con ingredientes frescos, locales y de estación — comida real que regenera el cuerpo, calienta el alma
        y sostiene la energía que necesitás para pensar con claridad.
      </p>
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto text-left">
        {['Desayuno, almuerzo y cena incluidos', 'Ingredientes frescos y de estación', 'Preparado con cariño por el equipo', 'Adaptable a necesidades especiales'].map((d) => (
          <div key={d} className="flex items-start gap-2">
            <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gold" />
            <p className="text-xs text-white/70 leading-snug">{d}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ── Equipo ─────────────────────────────────────────────────────────────────────
const ANFITRIONES = [
  {
    photo: '/uploads/Diego_perfil.png',
    nombre: 'Diego Epelman Hodara',
    rol: 'Anfitrión del espacio',
    desc: 'Fundador de Pueblo Mágico. Crea el clima de confianza, escucha y apertura desde el que todo lo demás es posible.',
    instagram: 'https://www.instagram.com/diegoepel/',
  },
  {
    photo: '/uploads/china.jpeg',
    nombre: 'China Dericia',
    rol: 'Guardiana del espacio',
    desc: 'Sostiene el cuerpo y la energía de quienes conviven en el espacio. Guía prácticas de movimiento, canto y meditación.',
    instagram: 'https://www.instagram.com/bambu.alquimia.terapeutica/',
  },
];

const EQUIPO = [
  {
    photo: '/uploads/isvara-rojas.jpg',
    nombre: 'Isvara Rojas Romero',
    rol: 'Host de emprendedores y creativos',
    desc: 'Estratega polímata y Growth Engineer. Acompaña a emprendedores y creativos a construir con foco y criterio real, desde la montaña.',
    instagram: 'https://www.instagram.com/isvara_strategist/',
  },
  {
    photo: '/uploads/luz-candela.jpg',
    nombre: 'Luz Candela',
    rol: 'Liderazgo femenino · Bienestar & Consciencia',
    desc: 'Creadora de Mujeres Amatistas. Acompaña a reconectar con el propósito desde el cuerpo, la intuición y la comunidad.',
    instagram: 'https://www.instagram.com/mujeramatistaa/',
  },
  {
    photo: '/uploads/tomas-fossatti.jpg',
    nombre: 'Tomás Fossatti',
    rol: 'Emprendimiento & Tecnología · Propósito',
    desc: 'Ingeniero, emprendedor y speaker de TEDx. Navega la intersección entre tecnología, impacto y propósito. Facilita dinámicas de claridad estratégica para emprendedores.',
    instagram: 'https://www.instagram.com/tomasfossatti_/',
  },
  {
    photo: '/uploads/nicole-rosignoli.webp',
    nombre: 'Nicole Rosignoli Miranda',
    rol: 'Psicología · Gestalt · Salud Cíclica',
    desc: 'Licenciada en Psicología (UNC). Acompaña desde el enfoque gestáltico y la salud cíclica, integrando plantas medicinales, movimiento corporal y círculos de mujeres.',
    instagram: 'https://www.instagram.com/thematriiz/',
  },
  {
    photo: '/uploads/tomas-bergallo.jpg',
    nombre: 'Tomás Bergallo',
    rol: 'Potenciador de regeneración · Consciencia corporal',
    desc: 'El cuerpo es el primer capital de quien construye algo propio. Tomás trabaja la capacidad de regeneración interna — contacto, movimiento y bienestar corporal — para que lo que recuperás acá se refleje en vos y en tus proyectos.',
    instagram: 'https://www.instagram.com/tomas.bergallo/',
  },
  {
    photo: '/uploads/santiago-alzogaray.png',
    nombre: 'Santiago Alzogaray',
    rol: 'Ceremonia de Temazcal',
    desc: 'Conduce el ritual de purificación y renacimiento. Un espacio sagrado de calor, vapor y silencio donde la comunidad se reúne alrededor del fuego — disponible como actividad extra durante tu estadía.',
  },
];

// Acordeón genérico para las tarjetas de personas
type Persona = { photo: string; nombre: string; rol: string; desc: string; instagram?: string };
const PersonasAccordion: React.FC<{ tag: string; titulo: string; intro: string; personas: Persona[] }> = ({ tag, titulo, intro, personas }) => {
  const [open, setOpen] = useState(false);
  return (
    <section className="bg-bone border-t border-brand/5">
      <button onClick={() => setOpen(o => !o)} aria-expanded={open}
        className="w-full py-8 hover:bg-brand/5 transition-colors">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="text-left">
            <p className="text-brand font-bold tracking-widest uppercase text-xs mb-1">{tag}</p>
            <h2 className="text-2xl md:text-3xl font-serif text-brand">{titulo}</h2>
          </div>
          <span className={`w-8 h-8 flex-shrink-0 rounded-full bg-white flex items-center justify-center text-brand transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
            <CaretDownIcon weight="bold" className="w-3.5 h-3.5" />
          </span>
        </div>
      </button>
      <div className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{ maxHeight: open ? '1600px' : '0px', opacity: open ? 1 : 0 }}>
        <div className="max-w-5xl mx-auto px-6 pb-16">
          <p className="text-dark/60 text-sm leading-relaxed max-w-lg mb-6">{intro}</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {personas.map((m, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-brand/5 shadow-sm text-center">
                <img src={m.photo} alt={m.nombre} loading="lazy"
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-2 border-gold/30" />
                <h3 className="font-serif text-brand text-base mb-0.5">{m.nombre}</h3>
                <p className="text-gold text-[10px] font-bold uppercase tracking-widest mb-3">{m.rol}</p>
                <p className="text-dark/60 text-xs leading-relaxed mb-4">{m.desc}</p>
                {m.instagram && (
                  <a href={m.instagram} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-bone text-brand hover:bg-brand hover:text-white transition-colors">
                    <InstagramLogo className="w-4 h-4" weight="fill" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const Anfitriones: React.FC = () => (
  <PersonasAccordion
    tag="Los guardianes del espacio"
    titulo="Anfitriones de Pueblo Mágico"
    intro="Diego y China no son anfitriones de temporada. Viven acá, todo el año."
    personas={ANFITRIONES}
  />
);

const Equipo: React.FC = () => (
  <PersonasAccordion
    tag="Quiénes te acompañan"
    titulo="No estás solo en el proceso"
    intro="Facilitadores que suman su energía y su oficio a tu estadía en distintos momentos del proceso."
    personas={EQUIPO}
  />
);

// ── La experiencia ────────────────────────────────────────────────────────────
const EXPERIENCIA = [
  { icon: <House className="w-5 h-5" weight="duotone" />,        texto: 'Vivir en un entorno natural y tranquilo' },
  { icon: <ForkKnife className="w-5 h-5" weight="duotone" />,     texto: 'Disfrutar de pensión completa' },
  { icon: <Laptop className="w-5 h-5" weight="duotone" />,        texto: 'Trabajar con espacios cómodos y conexión' },
  { icon: <HeartStraight className="w-5 h-5" weight="duotone" />, texto: 'Incorporar hábitos de bienestar — meditación, movimiento, pausas' },
  { icon: <Campfire className="w-5 h-5" weight="duotone" />,      texto: 'Compartir momentos en comunidad — fogón, charlas, encuentros' },
  { icon: <Drop className="w-5 h-5" weight="duotone" />,          texto: 'Conectar con la naturaleza — río, caminatas, descanso' },
];

const LaExperiencia: React.FC = () => (
  <section className="py-20 bg-bone">
    <div className="max-w-5xl mx-auto px-6">
      <div data-reveal className="text-center mb-12">
        <p className="text-brand font-bold tracking-widest uppercase text-xs mb-3">La experiencia</p>
        <h2 className="text-3xl md:text-4xl font-serif text-brand mb-3">Durante tu estadía vas a poder</h2>
        <p className="text-dark/60 text-sm max-w-lg mx-auto leading-relaxed">
          Podés venir solo a descansar — está perfecto. Pero eso es apenas el principio: hay mucho más para hacer y vivir en la montaña.
          Una invitación a ordenar tu rutina, recuperar energía y abrirte a nuevas formas de habitar tu día a día.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXPERIENCIA.map((item, i) => (
          <div key={i} data-reveal data-delay={`${(i % 4) + 1}` as any} className="flex gap-3 items-start bg-white rounded-xl p-5 border border-brand/5">
            <div className="w-9 h-9 rounded-full bg-bone flex items-center justify-center text-brand flex-shrink-0">
              {item.icon}
            </div>
            <p className="text-dark/70 text-sm leading-relaxed pt-1.5">{item.texto}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ── Formatos de estadía ───────────────────────────────────────────────────────
const Formatos: React.FC = () => (
  <section id="formatos" className="py-20 bg-white">
    <div className="max-w-6xl mx-auto px-6 lg:px-12">
      <div data-reveal className="text-center mb-10">
        <p className="text-brand font-bold tracking-widest uppercase text-xs mb-3">Formatos de estadía</p>
        <h2 className="text-3xl md:text-4xl font-serif text-brand mb-4">Elegí tu ritmo</h2>
        <div className="inline-flex items-center gap-2 bg-bone border border-brand/10 rounded-full px-5 py-2.5">
          <Sun className="w-4 h-4 text-gold flex-shrink-0" weight="duotone" />
          <p className="text-brand text-sm">
            <strong className="font-bold">${fmt(COLIVING_PRICES.precioPorNocheInvierno)}</strong> la noche — precio de temporada de invierno, a la carta
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch max-w-4xl mx-auto">
        {COLIVING_PRICES.formatos.map((f, i) => {
          const p = pago(f.precio);
          return (
            <div key={f.noches} data-reveal data-delay={`${i + 1}` as any}
              className="bg-bone rounded-2xl p-6 border border-brand/5 shadow-sm flex flex-col">
              <p className="text-gold font-bold text-[10px] uppercase tracking-widest mb-2">{f.label}</p>
              <p className="text-brand text-3xl font-serif mb-0.5">
                ${fmt(p.efectivo)}
              </p>
              <p className="text-dark/40 text-[11px] mb-3">Efectivo o transferencia</p>
              <div className="bg-white rounded-lg px-3 py-2 mb-4 border border-brand/5">
                <p className="text-dark/50 text-[11px] leading-snug">
                  O 3 cuotas de <strong className="text-dark/70">${fmt(p.cuota)}</strong> con tarjeta de crédito
                </p>
                <p className="text-gold text-[10px] font-semibold mt-0.5">Ahorrás ${fmt(p.ahorro)} pagando en efectivo o transferencia</p>
              </div>
              <p className="text-dark/60 text-sm leading-relaxed flex-grow mb-5">{f.desc}</p>
              <a href={WA(`Hola! Vengo de la web y quiero consultar el formato de ${f.label} en Coliving Mágico ✨`)}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-brand text-brand px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-brand hover:text-white transition-colors w-full">
                Consultar
              </a>
            </div>
          );
        })}

        {/* Pase libre mensual — destacado */}
        {(() => {
          const p = pago(COLIVING_PRICES.paseMensual.precio);
          return (
            <div data-reveal data-delay="2" className="bg-brand text-white rounded-2xl p-6 border border-gold/30 shadow-lg flex flex-col relative">
              <span className="absolute -top-3 left-6 bg-gold text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                Más completo
              </span>
              <p className="text-gold font-bold text-[10px] uppercase tracking-widest mb-2 mt-2">{COLIVING_PRICES.paseMensual.label}</p>
              <p className="text-white text-3xl font-serif mb-0.5">
                ${fmt(p.efectivo)}
              </p>
              <p className="text-white/50 text-[11px] mb-3">Efectivo o transferencia</p>
              <div className="bg-white/10 rounded-lg px-3 py-2 mb-4 border border-white/10">
                <p className="text-white/70 text-[11px] leading-snug">
                  O 3 cuotas de <strong className="text-white">${fmt(p.cuota)}</strong> con tarjeta de crédito
                </p>
                <p className="text-gold text-[10px] font-semibold mt-0.5">Ahorrás ${fmt(p.ahorro)} pagando en efectivo o transferencia</p>
              </div>
              <p className="text-white/70 text-sm leading-relaxed mb-3">{COLIVING_PRICES.paseMensual.desc}</p>
              <ul className="space-y-1.5 mb-5 flex-grow">
                {['Acceso durante todo el mes', 'Estadía con flexibilidad de organización', 'Tiempo real para integrar hábitos y rutinas'].map((d, j) => (
                  <li key={j} className="flex items-start gap-1.5 text-xs text-white/70">
                    <CheckCircle className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" weight="duotone" />
                    {d}
                  </li>
                ))}
              </ul>
              <a href={WA_COLIVING} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-gold text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-brand transition-colors w-full">
                <WhatsappLogo className="w-4 h-4" weight="fill" />
                Consultar por WhatsApp
              </a>
            </div>
          );
        })()}
      </div>

      <p className="text-center text-dark/40 text-xs mt-8 max-w-xl mx-auto leading-relaxed flex items-center justify-center gap-1.5">
        <Bank className="w-3.5 h-3.5 flex-shrink-0" weight="duotone" />
        Todos los formatos incluyen alojamiento, pensión completa y el Programa Reset Vital.
      </p>
      <p className="text-center text-dark/40 text-xs mt-2">
        Entradas y salidas, y actividades especiales fuera del programa base —{' '}
        <a href="#faq" className="text-brand font-semibold underline underline-offset-2 hover:text-gold transition-colors">
          ver términos y opciones en las preguntas frecuentes ↓
        </a>
      </p>
    </div>
  </section>
);

// ── Prueba social ──────────────────────────────────────────────────────────────
const TESTIMONIOS = [
  {
    text: 'Me sentí parte de la vida de la montaña, como en casa. Un refugio de paz inigualable.',
    name: 'Sofía R.',
    rol: 'Viajera',
    image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
  },
  {
    text: 'Una experiencia transformadora. La comida consciente y los espacios son de otro mundo.',
    name: 'Marcos D.',
    rol: 'Huésped',
    image: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  },
  {
    text: 'Lo más importante: el amor y la entrega de todo el equipo, y la capacidad de sentirte uno con la naturaleza.',
    name: 'Julieta C.',
    rol: 'Facilitadora',
    image: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg',
  },
];

const Testimonios: React.FC = () => (
  <section className="py-24 bg-brand text-white">
    <div className="max-w-7xl mx-auto px-6 lg:px-12">
      <div data-reveal className="text-center mb-14">
        <h2 className="text-3xl md:text-5xl font-serif mb-4">Lo que dicen quienes ya vivieron Mágico</h2>
        <a
          href="https://maps.app.goo.gl/4c1nrpBbQf5hYrsE9"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 border border-gold/30 rounded-full px-4 py-1.5 hover:bg-gold/10 transition-colors"
        >
          <span className="text-yellow-300 text-sm">★★★★★</span>
          <span className="text-white/80 text-xs font-semibold">5.0 · 64 reseñas en Google Maps</span>
        </a>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {TESTIMONIOS.map((t, i) => (
          <div key={i} data-reveal data-delay={`${i + 1}` as any} className="bg-white/10 rounded-2xl p-6 border border-white/10">
            <p className="text-white/85 italic text-sm leading-relaxed mb-5">"{t.text}"</p>
            <div className="flex items-center gap-3">
              <img src={t.image} alt={t.name} className="w-10 h-10 rounded-full object-cover" loading="lazy" />
              <div>
                <p className="font-bold text-sm text-white">{t.name}</p>
                <p className="text-white/50 text-xs">{t.rol}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ── Lead magnet: Guía de Foco en la Montaña ────────────────────────────────────
const PDF_URL = '/uploads/Recetarios/guia-foco-coliving.pdf';
const PDF_FILENAME = 'Guia-Foco-en-la-Montana-Pueblo-Magico.pdf';

const GuiaFoco: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const triggerDownload = () => {
    const link = document.createElement('a');
    link.href = PDF_URL;
    link.download = PDF_FILENAME;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    setSending(true);
    submitForm('Guía de Foco — Coliving', data).finally(() => {
      triggerDownload();
      setSending(false);
      setSubmitted(true);
    });
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="bg-brand rounded-3xl p-8 md:p-12 grid md:grid-cols-2 gap-10 items-center overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/3 -translate-y-1/3 pointer-events-none" aria-hidden="true" />
          <div data-reveal className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/20 text-gold border border-gold/30 rounded-full text-[10px] font-bold uppercase tracking-widest mb-5">
              <FilePdf weight="fill" className="w-3.5 h-3.5" />
              Guía gratuita
            </div>
            <h2 className="text-2xl md:text-3xl font-serif text-white mb-4 leading-tight">
              Guía de Foco en la Montaña
            </h2>
            <p className="text-white/70 text-sm leading-relaxed mb-5">
              5 hábitos respaldados por ciencia para enfocarte mejor, dormir mejor y crear más — vivas o no una estadía larga en Mágico.
            </p>
            <ul className="space-y-2">
              {['Basada en investigación de psicología ambiental', 'Prácticos y aplicables desde hoy', 'PDF de una página, sin relleno'].map((d, j) => (
                <li key={j} className="flex items-center gap-2 text-white/85 text-xs">
                  <CheckCircle weight="fill" className="w-4 h-4 text-gold flex-shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          </div>

          <div data-reveal data-delay="1" className="relative z-10">
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-dark/50 mb-1 uppercase tracking-wider" htmlFor="cg-nombre">Nombre</label>
                    <input required type="text" id="cg-nombre" name="nombre" placeholder="Tu nombre"
                      className="w-full px-4 py-2.5 bg-bone border border-brand/10 rounded-xl text-dark text-sm focus:ring-2 focus:ring-brand focus:border-brand transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-dark/50 mb-1 uppercase tracking-wider" htmlFor="cg-email">Email</label>
                    <input required type="email" id="cg-email" name="email" placeholder="tu@email.com"
                      className="w-full px-4 py-2.5 bg-bone border border-brand/10 rounded-xl text-dark text-sm focus:ring-2 focus:ring-brand focus:border-brand transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-dark/50 mb-1 uppercase tracking-wider" htmlFor="cg-wa">
                      WhatsApp <span className="font-normal text-dark/30 normal-case">(opcional)</span>
                    </label>
                    <input type="tel" id="cg-wa" name="whatsapp" placeholder="+54 9 ..."
                      className="w-full px-4 py-2.5 bg-bone border border-brand/10 rounded-xl text-dark text-sm focus:ring-2 focus:ring-brand focus:border-brand transition-colors" />
                  </div>
                  <button type="submit" disabled={sending}
                    className="w-full bg-gold hover:bg-brand text-white font-bold uppercase tracking-widest text-xs py-3.5 rounded-xl shadow-lg transition-colors mt-1 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait">
                    {sending ? (
                      <>Enviando <CircleNotch weight="bold" className="w-4 h-4 animate-spin" /></>
                    ) : (
                      <>Descargar guía gratis <DownloadSimple weight="bold" className="w-4 h-4" /></>
                    )}
                  </button>
                  <p className="text-[10px] text-dark/30 text-center">Sin spam. Solo la guía y, si querés, novedades de Coliving Mágico.</p>
                </form>
              ) : (
                <div className="py-4 flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-bone rounded-full flex items-center justify-center mb-4">
                    <CheckCircle weight="fill" className="w-8 h-8 text-brand" />
                  </div>
                  <h3 className="text-lg font-serif text-brand mb-1">¡Ya la tenés!</h3>
                  <p className="text-dark/50 text-sm mb-6 leading-relaxed max-w-xs">
                    Si la descarga no empezó sola, tocá el botón de abajo.
                  </p>
                  <a href={PDF_URL} download={PDF_FILENAME}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gold text-white rounded-xl font-bold text-sm hover:bg-brand transition-colors">
                    <DownloadSimple weight="bold" className="w-4 h-4" />
                    Descargar de nuevo
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ── Para quién es ─────────────────────────────────────────────────────────────
const AVATARES = [
  { icon: <Laptop className="w-6 h-6" weight="duotone" />,        texto: 'Trabajan de forma remota o flexible' },
  { icon: <ArrowRight className="w-6 h-6" weight="duotone" />,     texto: 'Buscan un cambio en su rutina' },
  { icon: <HeartStraight className="w-6 h-6" weight="duotone" />, texto: 'Valoran el bienestar y la naturaleza' },
  { icon: <UsersThree className="w-6 h-6" weight="duotone" />,     texto: 'Disfrutan de compartir con otros en comunidad' },
];

const ParaQuienEs: React.FC = () => (
  <section className="py-20 bg-bone">
    <div className="max-w-5xl mx-auto px-6">
      <div data-reveal className="text-center mb-12">
        <p className="text-brand font-bold tracking-widest uppercase text-xs mb-3">¿Para quién es?</p>
        <h2 className="text-3xl md:text-4xl font-serif text-brand">No se trata solo de alojarse</h2>
        <p className="text-dark/60 text-sm max-w-lg mx-auto mt-3 leading-relaxed">
          Sino de vivir unos días —o un mes— de forma más consciente, conectada y equilibrada.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {AVATARES.map((av, i) => (
          <div key={i} data-reveal data-delay={`${i + 1}` as any} className="bg-white rounded-2xl p-6 border border-brand/5 shadow-sm text-center">
            <div className="w-12 h-12 bg-bone rounded-full flex items-center justify-center text-brand mx-auto mb-4">
              {av.icon}
            </div>
            <p className="text-dark/70 text-sm leading-relaxed">{av.texto}</p>
          </div>
        ))}
      </div>

      {/* Anti-persona — honestidad para calificar el lead correcto */}
      <div data-reveal data-delay="4" className="bg-white/60 border border-dark/10 rounded-2xl p-6 max-w-xl mx-auto text-center">
        <p className="text-dark/50 font-bold text-xs uppercase tracking-widest mb-3">No es para vos si...</p>
        <ul className="text-left space-y-1.5 inline-block">
          {['Buscás un hotel de lujo con servicio de habitación', 'Necesitás la ciudad y el ruido para rendir', 'El silencio y la naturaleza te generan ansiedad'].map((d) => (
            <li key={d} className="flex items-start gap-2 text-dark/50 text-sm">
              <span className="mt-0.5 flex-shrink-0">✗</span>
              {d}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);

// ── FAQ ───────────────────────────────────────────────────────────────────────
const FAQS = [
  { Icon: HouseIcon, q: '¿Qué incluye el precio?', a: 'Alojamiento con ropa blanca y toallón, biocosmética en las duchas, todas las comidas caseras (desayuno, almuerzo y cena), el Programa Reset Vital, acceso a todo el predio y WiFi satelital.' },
  { Icon: ClockIcon, q: '¿Las actividades del Reset Vital están todas incluidas?', a: 'El programa base está incluido en todos los formatos. El precio cubre la noche y las comidas — actividades puntuales como caminatas guiadas, trekking, cabalgatas, temazcal o ceremonias ancestrales, y cualquier evento, excursión o retiro que coincida con tu estadía, se pagan aparte según la actividad.' },
  { Icon: CalendarIcon, q: '¿Puedo entrar y salir cuando quiera durante el Pase Mensual?', a: 'Sí. Podés subir y bajar de la montaña cuando lo necesites. Para volver a subir, avisanos con 24 horas de anticipación — así preparamos todo (cama y comidas) y confirmamos disponibilidad.' },
  { Icon: CalendarIcon, q: '¿Puedo combinar días de trabajo remoto con la rutina de bienestar?', a: 'Sí, es justamente la idea. No hay horarios obligatorios: tenés espacios cómodos y conexión para trabajar, y podés sumarte a las prácticas de bienestar cuando quieras.' },
  { Icon: CaretDownIcon, q: '¿Cómo reservo mi lugar?', a: 'Los cupos son limitados para cuidar la experiencia. Escribinos por WhatsApp contándonos qué formato te interesa y te confirmamos disponibilidad.' },
  { Icon: ForkKnifeIcon, q: '¿Tienen opciones para dietas o alergias?', a: 'Sí, tenemos opciones de comida para todo tipo de dietas y restricciones alimentarias, incluidas opciones sin gluten. Lo que no podemos garantizar es un ambiente 100% libre de contaminación cruzada: cocinamos en una cocina y mesada compartida, sin productos envasados al vacío ni un proceso aislado. Para celiaquía severa o intolerancia alta al gluten no podemos asegurar inocuidad total, pero sí podemos garantizar platos que no llevan gluten entre sus ingredientes. Contanos tu caso al reservar.' },
  { Icon: ClockIcon, q: '¿Cuáles son los horarios de las comidas?', a: 'Desayuno de 09:00 a 10:00 hs, almuerzo de 14:00 a 15:00 hs y cena de 20:00 a 21:00 hs. Fuera de esos horarios no hay servicio de cocina, así que si vas a llegar tarde avisanos — llegando desde las 19:00 hs ya llegás a tiempo para la cena.' },
  { Icon: PawPrintIcon, q: '¿Puedo llevar a mi mascota?', a: 'No, por el momento no aceptamos mascotas: en el campo hay animales de granja cerca y no contamos con instalaciones adecuadas para recibirlas.' },
  { Icon: WheelchairIcon, q: '¿Tienen accesibilidad para sillas de ruedas?', a: 'Por el momento no contamos con rampas ni espacios especialmente preparados para sillas de ruedas. Si tenés dudas puntuales sobre accesibilidad, escribinos por WhatsApp y lo vemos juntos.' },
];

const FAQ: React.FC = () => (
  <section id="faq" className="py-20 bg-white">
    <div className="max-w-3xl mx-auto px-6">
      <div data-reveal className="text-center mb-10">
        <p className="text-brand font-bold tracking-widest uppercase text-xs mb-3">Preguntas frecuentes</p>
        <h2 className="text-3xl md:text-4xl font-serif text-brand">Antes de escribirnos</h2>
      </div>
      <div className="space-y-3">
        {FAQS.map((faq, i) => {
          const Icon = faq.Icon;
          return (
            <div key={i} data-reveal className="bg-bone rounded-2xl border border-brand/5 px-6 py-5">
              <div className="flex items-start gap-3 mb-2">
                <Icon weight="light" className="w-5 h-5 text-brand/50 flex-shrink-0 mt-0.5" />
                <h3 className="font-serif text-brand text-base leading-snug">{faq.q}</h3>
              </div>
              <p className="text-dark/60 text-sm leading-relaxed pl-8">{faq.a}</p>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

// ── Permiso para descansar ──────────────────────────────────────────────────────
const PermisoDescanso: React.FC = () => (
  <section className="relative overflow-hidden">
    <img src="/uploads/campoentero.webp" alt="Atardecer en Pueblo Mágico" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
    <div className="absolute inset-0" style={{ background: 'rgba(4,10,20,0.72)' }} />
    <div data-reveal className="relative z-10 max-w-2xl mx-auto px-6 py-20 md:py-28 text-center">
      <p className="text-white/50 text-base md:text-lg font-light leading-relaxed mb-5">
        Viniste a rendir distinto.
      </p>
      <p className="text-3xl md:text-5xl font-serif text-white leading-snug">
        Bajar el ritmo también es avanzar.
      </p>
    </div>
  </section>
);

// ── CTA Final ─────────────────────────────────────────────────────────────────
const CTAFinal: React.FC = () => (
  <section className="py-24 bg-bone">
    <div className="max-w-3xl mx-auto px-6 text-center">
      <div data-reveal>
        <Star className="w-10 h-10 text-gold mx-auto mb-6" weight="duotone" />
        <h2 className="text-3xl md:text-5xl font-serif text-brand mb-4">
          Los cupos son limitados
        </h2>
        <p className="text-dark/60 font-light text-lg leading-relaxed mb-8 max-w-xl mx-auto">
          Cuidamos la experiencia manteniendo pocos lugares disponibles. Si sentís que este espacio es para vos,
          escribinos para conocer disponibilidad y coordinar tu llegada.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={WA_COLIVING}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 bg-brand text-white px-10 py-4 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-gold transition-colors duration-300 shadow-lg"
          >
            <WhatsappLogo className="w-5 h-5 flex-shrink-0" weight="fill" />
            Reservar mi lugar
          </a>
          <a
            href={WA('Hola! Tengo algunas dudas sobre Coliving Mágico antes de reservar ✨')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 border border-brand/30 text-brand px-10 py-4 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-brand/5 transition-colors duration-300"
          >
            Tengo preguntas
          </a>
        </div>
        <p className="mt-6 text-dark/40 text-xs">
          También podés escribirnos a{' '}
          <a href="mailto:experienciamagico@gmail.com" className="hover:text-brand transition-colors underline underline-offset-2">
            experienciamagico@gmail.com
          </a>
        </p>
      </div>
    </div>
  </section>
);

// ── Página principal ──────────────────────────────────────────────────────────
const Coliving: React.FC = () => {
  useEffect(() => {
    const TITLE = 'Coliving Mágico — Vivir, Trabajar y Reconectar · Los Gigantes, Córdoba | Pueblo Mágico';
    const DESC = `Coliving en las Sierras de Córdoba para bienestar y estilo de vida. Formatos de ${COLIVING_PRICES.formatos.map(f => f.noches).join(' y ')} noches, y Pase Libre Mensual a $${fmt(COLIVING_PRICES.paseMensual.precio)}. Pensión completa, WiFi satelital y Programa Reset Vital incluidos.`;
    const URL = SITE_URL + ROUTES.COLIVING;
    const IMG = `${SITE_URL}/uploads/coworking.webp`;
    const prevTitle = document.title;

    document.title = TITLE;

    const setMeta = (sel: string, attr: string, val: string) => {
      let el = document.querySelector(sel) as HTMLMetaElement | null;
      if (!el) { el = document.createElement('meta'); document.head.appendChild(el); }
      el.setAttribute(attr, val);
    };
    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); document.head.appendChild(el); }
      el.setAttribute('href', href);
    };

    setMeta('meta[name="description"]',        'content', DESC);
    setMeta('meta[property="og:title"]',       'property', 'og:title');
    setMeta('meta[property="og:title"]',       'content',  TITLE);
    setMeta('meta[property="og:description"]', 'property', 'og:description');
    setMeta('meta[property="og:description"]', 'content',  DESC);
    setMeta('meta[property="og:image"]',        'property', 'og:image');
    setMeta('meta[property="og:image"]',        'content',  IMG);
    setMeta('meta[property="og:url"]',         'property', 'og:url');
    setMeta('meta[property="og:url"]',         'content',  URL);
    setMeta('meta[property="og:type"]',        'property', 'og:type');
    setMeta('meta[property="og:type"]',        'content',  'website');
    setLink('canonical', URL);

    setMeta('meta[name="twitter:card"]',        'name',    'twitter:card');
    setMeta('meta[name="twitter:card"]',        'content', 'summary_large_image');
    setMeta('meta[name="twitter:title"]',       'name',    'twitter:title');
    setMeta('meta[name="twitter:title"]',       'content', TITLE);
    setMeta('meta[name="twitter:description"]', 'name',    'twitter:description');
    setMeta('meta[name="twitter:description"]', 'content', DESC);
    setMeta('meta[name="twitter:image"]',       'name',    'twitter:image');
    setMeta('meta[name="twitter:image"]',       'content', IMG);

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'LodgingBusiness',
      'name': 'Pueblo Mágico — Coliving Mágico',
      'description': DESC,
      'url': URL,
      'image': IMG,
      'telephone': '+5493516765820',
      'priceRange': '$$',
      'currenciesAccepted': 'ARS',
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': 'Los Gigantes / Cuchilla Nevada',
        'addressRegion': 'Córdoba',
        'addressCountry': 'AR',
      },
      'makesOffer': [
        ...COLIVING_PRICES.formatos.map(f => ({
          '@type': 'Offer',
          'name': f.label,
          'price': String(f.precio),
          'priceCurrency': 'ARS',
          'availability': 'https://schema.org/InStock',
        })),
        {
          '@type': 'Offer',
          'name': COLIVING_PRICES.paseMensual.label,
          'price': String(COLIVING_PRICES.paseMensual.precio),
          'priceCurrency': 'ARS',
          'availability': 'https://schema.org/InStock',
        },
      ],
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '5.0',
        'reviewCount': '64',
        'bestRating': '5',
      },
    };
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.id   = 'ld-coliving';
    ld.textContent = JSON.stringify(schema);
    if (!document.getElementById('ld-coliving')) document.head.appendChild(ld);

    return () => { document.title = prevTitle; document.getElementById('ld-coliving')?.remove(); };
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -32px 0px' }
    );
    document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <LanguageProvider>
      <div className="font-sans antialiased">
        <Header />
        <main>
          <Hero />
          <TuEntorno />
          <Inclusiones />
          <Galeria />
          <LaExperiencia />
          <ParaQuienEs />
          <PorQueFunciona />
          <MomentoIdeas />
          <Alimentacion />
          <Anfitriones />
          <Equipo />
          <Posicionamiento />
          <Testimonios />
          <GuiaFoco />
          <Formatos />
          <SectionRegeneracion />
          <FAQ />
          <PermisoDescanso />
          <CTAFinal />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
};

export default Coliving;
