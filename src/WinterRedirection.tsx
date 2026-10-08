import React, { useState, useEffect, useRef } from 'react';
import {
  Flame, Snowflake, Users, Heart, Star, Compass, ChevronLeft, ChevronRight, Instagram, Linkedin, Clock, CheckCircle2,
  Mountain, Briefcase, Network, Wifi, Sparkles,
  Footprints, PawPrint, TrendingDown, CalendarDays, Utensils, Smartphone,
  Zap, Droplets, Map, FlaskConical, Brain, Megaphone, Bot,
  type LucideIcon,
} from 'lucide-react';
import { img } from './lib/img';
import { WA_MAGICO } from './data/config';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

const WA_INFO    = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent('¡Hola! Me interesa el Winter Redirection en Pueblo Mágico. ¿Me pueden dar más info?')}`;
const WA_RESERVA = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent('¡Hola! Quiero reservar mi lugar en el Winter Redirection. ¿Cómo procedo?')}`;

const C = {
  green: '#005333',
  gold:  '#D4AF37',
  fire:  '#AA3E11',
  ice:   '#2E6E8E',
  night: '#EBF4FA',
  cream: '#F5F9FF',
  dark:  '#1A2B3C',
  muted: '#4A6070',
  faint: '#6B8090',
};

// ─── Precios ─────────────────────────────────────────────────────────────────
type PriceTier = { noches: string; efectivo: string; oldEfectivo: string; porNoche: string; oldPorNoche: string; listaTotal: string; cuotas: string; ahorroEfectivo: string; ahorroNoches?: string };
const PRECIOS: PriceTier[] = [
  {
    noches: '1 noche',
    efectivo: '$50.000',
    oldEfectivo: '$90.000',
    porNoche: '$50.000 por noche',
    oldPorNoche: 'Antes $90.000/noche',
    listaTotal: '$60.000',
    cuotas: '3 cuotas de $20.000',
    ahorroEfectivo: 'Ahorrás $10.000 pagando al contado',
  },
  {
    noches: '2 noches',
    efectivo: '$90.000',
    oldEfectivo: '$160.000',
    porNoche: '$45.000 por noche',
    oldPorNoche: 'Antes $80.000/noche',
    listaTotal: '$108.000',
    cuotas: '3 cuotas de $36.000',
    ahorroEfectivo: 'Ahorrás $18.000 pagando al contado',
    ahorroNoches: 'Ahorrás $5.000 por noche vs 1 noche',
  },
  {
    noches: '3+ noches',
    efectivo: '$120.000',
    oldEfectivo: '$190.000',
    porNoche: '$40.000 por noche',
    oldPorNoche: 'Antes $63.000/noche',
    listaTotal: '$144.000',
    cuotas: '3 cuotas de $48.000',
    ahorroEfectivo: 'Ahorrás $24.000 pagando al contado',
    ahorroNoches: 'Ahorrás $10.000 por noche vs 1 noche',
  },
];

// ─── Equipo ──────────────────────────────────────────────────────────────────
type TeamMember = { photo: string; nombre: string; rol: string; desc: string; instagram?: string; linkedin?: string; tag?: string; tags?: string[] };

const ANFITRIONES: TeamMember[] = [
  {
    photo: '/uploads/Diego_perfil.png',
    nombre: 'Diego Epelman Hodara',
    rol: 'Anfitrión del espacio',
    desc: 'Fundador del Pueblo Mágico. Crea el clima de confianza, escucha y apertura desde el que todo lo demás es posible.',
    instagram: 'https://www.instagram.com/diegoepel/',
    tag: 'Anfitrión',
    tags: ['PUEBLO MÁGICO', 'KINTU'],
  },
  {
    photo: '/uploads/china.jpeg',
    nombre: 'China Dericia',
    rol: 'Guardiana del espacio',
    desc: 'Sostiene el cuerpo y la energía del grupo. Guía prácticas de movimiento, canto y meditación para que la mente pueda soltar y el cuerpo procesar.',
    instagram: 'https://www.instagram.com/bambu.alquimia.terapeutica/',
    tag: 'Anfitriona',
    tags: ['PUEBLO MÁGICO'],
  },
];

const FACILITADORES: TeamMember[] = [
  {
    photo: '/uploads/tomas-fossatti.jpg',
    nombre: 'Tomás Fossatti',
    rol: 'Emprendimiento & Tecnología · Propósito',
    desc: 'Ingeniero, emprendedor y speaker de TEDx. Navega la intersección entre tecnología, impacto y propósito. Facilita dinámicas de claridad estratégica para emprendedores.',
    instagram: 'https://www.instagram.com/tomasfossatti_/',
    linkedin: 'https://www.linkedin.com/in/tomas-fossatti-ing',
    tags: ['KINTU'],
  },
  {
    photo: '/uploads/isvara-rojas.jpg',
    nombre: 'Isvara Rojas Romero',
    rol: 'Host de emprendedores y creativos',
    desc: 'Estratega polímata y Growth Engineer. Conecta la innovación tecnológica y el diseño de vanguardia con filosofías ancestrales de la Tierra. Guía a creativos en la creación de arquitecturas de conversión y negocios soberanos desde la acción real.',
    instagram: 'https://www.instagram.com/isvara_strategist/',
    linkedin: 'https://www.linkedin.com/in/isvara-rojas-romero-53a20a298/',
    tags: ['KINTU', 'PUEBLO MÁGICO'],
  },
  {
    photo: '/uploads/luz-candela.jpg',
    nombre: 'Luz Candela',
    rol: 'Liderazgo femenino · Bienestar & Consciencia',
    desc: 'Creadora de Mujeres Amatistas. Acompaña líderes y emprendedoras a reconectar con su propósito desde el cuerpo, la intuición y la comunidad.',
    instagram: 'https://www.instagram.com/mujeramatistaa/',
    tags: ['KINTU'],
  },
  {
    photo: '/uploads/Walter_E._Cejas.jpg',
    nombre: 'Walter Eugenio Cejas',
    rol: 'Biólogo · Investigador · Vida Silvestre',
    desc: 'Puente entre el conocimiento científico y la experiencia directa de la Sierra de Achala. Guía avistaje de aves, flora y fauna — el entorno como maestro.',
  },
  {
    photo: '/uploads/nicole-rosignoli.webp',
    nombre: 'Nicole Rosignoli Miranda',
    rol: 'Psicología · Gestalt · Salud Cíclica',
    desc: 'Licenciada en Psicología (UNC). Acompaña desde el enfoque gestáltico y la salud cíclica, integrando plantas medicinales, movimiento corporal y círculos de mujeres.',
    instagram: 'https://www.instagram.com/thematriiz/',
  },
  {
    photo: '/uploads/santiago-alzogaray.png',
    nombre: 'Santiago Alzogaray',
    rol: 'Ceremonia de Temazcal',
    desc: 'Conduce el ritual de purificación y renacimiento. Un espacio sagrado de calor, vapor y silencio donde la comunidad se reúne alrededor del fuego.',
  },
  {
    photo: '/uploads/tomas-bergallo.jpg',
    nombre: 'Tomás Bergallo',
    rol: 'Potenciador de regeneración · Consciencia corporal',
    desc: 'El cuerpo es el primer capital de un emprendedor. Tomás trabaja la capacidad de regeneración interna — a través del contacto, el movimiento y el bienestar corporal — para que lo que recuperás se refleje en tus proyectos, tu negocio y en vos como pilar de todo lo que construís.',
    instagram: 'https://www.instagram.com/tomas.bergallo/',
  },
];

// ─── FAQ ─────────────────────────────────────────────────────────────────────
const FAQ_ICONS: LucideIcon[] = [Snowflake, Star, Users, Heart, Flame, Compass, Briefcase, Network];

const FAQS = [
  {
    q: '¿Puedo elegir cualquier día para llegar?',
    a: 'Sí. Estadía libre durante julio, agosto o septiembre 2026: llegás y te vas cuando quieras. El contenido del Reset Vital para emprendedores está disponible desde el primer día, y las actividades con facilitadores se coordinan por agenda.',
  },
  {
    q: '¿Qué incluye la estadía?',
    a: 'Pensión completa (3 comidas), ropa blanca y toallón, kit de invierno, agua caliente 24 hs, WiFi Starlink, acceso al Reset Vital para emprendedores (app offline + online) y el cronograma de actividades.',
  },
  {
    q: '¿Puedo venir con mi equipo o socio?',
    a: 'Sí, y de hecho es muy potente hacerlo. Vienen como personas individuales, se alojan juntos o separados según disponibilidad, y comparten el proceso. No es un retiro corporativo: es personal y elegido.',
  },
  {
    q: '¿Qué es el Reset Vital para emprendedores?',
    a: 'Es una guía disponible en tu teléfono (offline y online) con contenido específico para emprendedores navegando el entorno FLUX: módulos sobre inteligencia colectiva, economía de la sabiduría, comunidades, omnicanalidad y claridad estratégica. Está incluida en la estadía.',
  },
  {
    q: '¿Cuándo van a estar los invitados especiales?',
    a: 'Las fechas de invitados especiales se van confirmando durante el invierno. Escribinos y te avisamos cuándo hay sesiones programadas para que puedas planificar tu estadía alrededor de esas fechas.',
  },
  {
    q: '¿Tengo que participar de todas las actividades?',
    a: 'No. Cada uno elige su ritmo. Podés pasar el día trabajando con el WiFi Starlink, hacer una caminata sola, sumarte a un círculo de emprendedores o simplemente estar en el silencio de la montaña.',
  },
  {
    q: '¿El Temazcal está incluido?',
    a: 'No, es una actividad extra con costo aparte. Consultanos disponibilidad según las fechas de tu estadía.',
  },
  {
    q: '¿Cómo llego?',
    a: 'Pueblo Mágico está en Los Gigantes, Córdoba — 90 km de Córdoba Capital. Acceso para todo tipo de vehículos. Te mandamos el mapa al reservar.',
  },
  {
    q: '¿Tienen opciones para dietas o alergias?',
    a: 'Sí, tenemos opciones de comida para todo tipo de dietas y restricciones alimentarias, incluidas opciones sin gluten. Lo que no podemos garantizar es un ambiente 100% libre de contaminación cruzada: cocinamos en una cocina y mesada compartida, sin productos envasados al vacío ni un proceso aislado. Para celiaquía severa o intolerancia alta al gluten no podemos asegurar inocuidad total, pero sí podemos garantizar platos que no llevan gluten entre sus ingredientes. Contanos tu caso al reservar.',
  },
  {
    q: '¿Puedo llevar a mi mascota?',
    a: 'No, por el momento no aceptamos mascotas: en el campo hay animales de granja cerca y no contamos con instalaciones adecuadas para recibirlas. Si tenés dudas puntuales, escribinos por WhatsApp y lo vemos juntos.',
  },
  {
    q: '¿Tienen accesibilidad para sillas de ruedas?',
    a: 'Por el momento no contamos con rampas ni espacios especialmente preparados para sillas de ruedas. Si tenés dudas puntuales sobre accesibilidad, escribinos por WhatsApp y lo vemos juntos.',
  },
];

// ─── Carrusel ────────────────────────────────────────────────────────────────
const CAROUSEL = [
  { src: '/uploads/Invierno/DJI_20250629135712_0164_D_CHAPA2025.webp', caption: 'Vista aérea · Los Gigantes nevado' },
  { src: '/uploads/coworking.webp',                                     caption: 'Coworking · Coliving · WiFi Starlink' },
  { src: '/uploads/Invierno/20250629_135046.webp',                       caption: 'Ventanal con vistas a la sierra' },
  { src: '/uploads/pachamama-interior-ventanales.webp',                  caption: 'Interior · Ventanales a la sierra' },
  { src: '/uploads/yoga_salon.webp',                                    caption: 'El salón · Dinámicas y círculos de trabajo' },
  { src: '/uploads/Invierno/20250629_132707.webp',                       caption: 'Refugio de piedra bajo la nieve' },
  { src: '/uploads/habitaciones.webp',                                  caption: 'Habitaciones · Ropa blanca y toallón incluidos' },
  { src: '/uploads/Invierno/20250629_152354.webp',                       caption: 'Camino rural hacia el horizonte' },
  { src: '/uploads/domos.webp',                                         caption: 'Domos geodésicos · Glamping de montaña' },
  { src: '/uploads/Invierno/20250629_164200.webp',                       caption: 'Pino bajo la cencellada' },
  { src: '/uploads/mesadas.webp',                                       caption: 'Cocina · Pensión completa · 3 comidas' },
  { src: '/uploads/Invierno/20250628_181834.webp',                       caption: 'Ocaso desde la pirca de piedra' },
  { src: '/uploads/botica.webp',                                        caption: 'La botica · Plantas de la sierra' },
  { src: '/uploads/Invierno/DJI_20250629140041_0171_D_CHAPA2025.webp',  caption: 'Los tres domos geodésicos nevados' },
  { src: '/uploads/Invierno/20250627_222558.webp',                       caption: 'Lluvia de estrellas en la montaña' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
const WinterRedirection: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [temazcalOpen, setTemazcalOpen] = useState(false);
  const [alimentacionOpen, setAlimentacionOpen] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [lugarIdx, setLugarIdx] = useState(0);

  const pilaresRef   = useRef<HTMLDivElement>(null);
  const fluxRef      = useRef<HTMLDivElement>(null);
  const paraQuienRef = useRef<HTMLDivElement>(null);
  const mientrasRef  = useRef<HTMLDivElement>(null);
  const expCardsRef  = useRef<HTMLDivElement>(null);
  const testiRef     = useRef<HTMLDivElement>(null);
  const preciosRef   = useRef<HTMLDivElement>(null);

  const [pilaresPaused,   setPilaresPaused]   = useState(false);
  const [fluxPaused,      setFluxPaused]      = useState(false);
  const [paraQuienPaused, setParaQuienPaused] = useState(false);
  const [mientrasPaused,  setMientrasPaused]  = useState(false);
  const [expPaused,       setExpPaused]       = useState(false);
  const [testiPaused,     setTestiPaused]     = useState(false);
  const [preciosPaused,   setPreciosPaused]   = useState(false);

  useEffect(() => {
    const t = setInterval(() => setCarouselIdx(i => (i + 1) % CAROUSEL.length), 4500);
    return () => clearInterval(t);
  }, []);

  const advanceSnap = (ref: React.RefObject<HTMLDivElement | null>, paused: boolean) => {
    if (paused) return;
    const el = ref.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    if (!first) return;
    const slideW = first.offsetWidth + 12;
    const maxScroll = el.scrollWidth - el.clientWidth;
    el.scrollTo({ left: el.scrollLeft + slideW > maxScroll + 1 ? 0 : el.scrollLeft + slideW, behavior: 'smooth' });
  };

  useEffect(() => { const t = setInterval(() => advanceSnap(pilaresRef,   pilaresPaused),   5500); return () => clearInterval(t); }, [pilaresPaused]);
  useEffect(() => { const t = setInterval(() => advanceSnap(fluxRef,      fluxPaused),      3600); return () => clearInterval(t); }, [fluxPaused]);
  useEffect(() => { const t = setInterval(() => advanceSnap(paraQuienRef, paraQuienPaused), 4000); return () => clearInterval(t); }, [paraQuienPaused]);
  useEffect(() => { const t = setInterval(() => advanceSnap(mientrasRef,  mientrasPaused),  4200); return () => clearInterval(t); }, [mientrasPaused]);
  useEffect(() => { const t = setInterval(() => advanceSnap(expCardsRef,  expPaused),       4400); return () => clearInterval(t); }, [expPaused]);
  useEffect(() => { const t = setInterval(() => advanceSnap(testiRef,     testiPaused),     3500); return () => clearInterval(t); }, [testiPaused]);
  useEffect(() => { const t = setInterval(() => advanceSnap(preciosRef,   preciosPaused),   4600); return () => clearInterval(t); }, [preciosPaused]);

  useEffect(() => {
    document.title = 'Winter Redirection · Emprendedores en la Montaña · Pueblo Mágico';
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
          backgroundImage: `url('/uploads/Invierno/DJI_20250629135712_0164_D_CHAPA2025.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="hidden md:block absolute inset-0 pointer-events-none overflow-hidden">
          <iframe
            src="https://www.youtube.com/embed/ktzVcAs-74c?autoplay=1&mute=1&loop=1&playlist=ktzVcAs-74c&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1"
            allow="autoplay; encrypted-media"
            title="Winter Redirection"
            style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)', border: 'none',
              width: 'max(100vw, 177.78vh)', height: 'max(56.25vw, 100vh)',
            }}
          />
        </div>
        <div className="block md:hidden absolute inset-0 pointer-events-none overflow-hidden">
          <iframe
            src="https://www.youtube.com/embed/QPNxc5Nh8es?autoplay=1&mute=1&loop=1&playlist=QPNxc5Nh8es&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1"
            allow="autoplay; encrypted-media"
            title="Winter Redirection Mobile"
            style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)', border: 'none',
              width: 'max(100vw, 56.25vh)', height: 'max(177.78vw, 100vh)',
            }}
          />
        </div>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(8,16,28,0.95) 0%, rgba(8,16,28,0.6) 45%, rgba(8,16,28,0.12) 100%)' }}
        />

        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 md:px-12 pt-28 md:pt-20 pb-10 md:pb-0 flex flex-col md:items-center md:text-center">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center md:justify-center gap-2 sm:gap-3 mb-4">
            <span className="inline-block px-3 sm:px-4 py-1.5 rounded-full text-[9px] sm:text-[10px] tracking-[0.4em] uppercase font-bold border border-white/20 text-white/70">
              Invierno 2026 · julio · agosto · septiembre
            </span>
            <span className="inline-block px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] tracking-widest uppercase font-bold"
              style={{ backgroundColor: 'rgba(212,175,55,0.15)', color: '#F4C27A', border: '1px solid rgba(212,175,55,0.3)' }}>
              Estadía libre
            </span>
            <span className="inline-block px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] tracking-widest uppercase font-bold"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.2)' }}>
              Emprendedores · Líderes · Equipos
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl serif-title leading-none mb-2 text-white">
            Winter <span style={{ color: C.gold }}>Redirection</span>
          </h1>
          <p className="text-white/50 text-base md:text-xl tracking-wide italic serif-title mb-4 md:mb-6">No es frenar. Es redirigir.</p>

          <p className="text-white/80 text-base md:text-xl italic mb-4 leading-relaxed max-w-lg md:max-w-2xl">
            Un mes para ver el mapa completo cuando el ruido del día a día tapa la perspectiva.
          </p>
          <p className="text-white/45 text-xs sm:text-sm mb-6 md:mb-10 max-w-lg md:max-w-2xl leading-relaxed">
            Todo el invierno en la montaña. Llegás y te vas cuando quieras. Pensión completa desde $50.000/noche, en habitación o domo compartido.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <a href={WA_RESERVA} target="_blank" rel="noopener noreferrer" className="btn-gold text-sm py-4 px-8 inline-block">
              Quiero sumarme
            </a>
            <div className="flex items-center gap-2 text-white/50 text-xs">
              <Zap size={14} color={C.gold} />
              <span>De VUCA a FLUX — economía de la sabiduría</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── URGENCIA ── */}
      <div className="px-6 py-3 text-center" style={{ backgroundColor: '#AA3E11' }}>
        <p className="text-white text-xs sm:text-sm font-semibold leading-relaxed">
          Julio ya empezó · El camp está activo · Solo 20 personas al mismo tiempo en el espacio ·{' '}
          <a href={WA_RESERVA} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
            Consultá disponibilidad →
          </a>
        </p>
      </div>

      {/* ── DE VUCA A FLUX ── */}
      <section className="py-20 md:py-28 px-6" style={{ backgroundColor: C.dark }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14" data-reveal>
            <p className="text-[10px] tracking-[0.4em] uppercase font-semibold mb-5" style={{ color: C.gold }}>
              El contexto que nadie te enseñó a navegar
            </p>
            <h2 className="text-3xl md:text-5xl serif-title text-white leading-tight mb-6">
              Pasamos de un mundo <span style={{ color: C.gold }}>VUCA</span><br />a un mundo <span style={{ color: C.gold }}>FLUX</span>
            </h2>
            <p className="text-base md:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Y con él, de la economía del conocimiento a la <strong className="text-white">economía de la sabiduría</strong>. La información ya no es ventaja competitiva — la tienen todos. Lo que diferencia a los líderes de hoy es la capacidad de integrar, conectar y actuar desde la claridad en medio del caos.
            </p>
          </div>

          {/* Mobile: carrusel FLUX */}
          {(() => {
            const FLUX = [
              { Icon: Zap,         letra: 'F', palabra: 'Rápido',       color: '#E05C97', items: ['Todo se acelera', 'Decisiones inmediatas', 'Cambio exponencial'] },
              { Icon: Droplets,    letra: 'L', palabra: 'Líquido',      color: '#2E6E8E', items: ['Estructuras flexibles', 'Adaptación constante', 'Colaboración abierta'] },
              { Icon: Map,         letra: 'U', palabra: 'Inexplorado',  color: '#D4AF37', items: ['No hay mapas claros', 'Avanzamos sin guías', 'La incertidumbre es la norma'] },
              { Icon: FlaskConical,letra: 'X', palabra: 'Experimental', color: '#7C5CBF', items: ['Probar + aprender', 'Fallos como insumo', 'Innovación continua'] },
            ];
            return (
              <>
                <div className="md:hidden -mx-6 mb-14" data-reveal data-delay="1">
                  <div ref={fluxRef} onTouchStart={() => setFluxPaused(true)}
                    className="flex gap-3 overflow-x-auto pb-3 px-6"
                    style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>
                    {FLUX.map(({ Icon, letra, palabra, color, items }) => (
                      <div key={letra} className="flex-shrink-0 rounded-2xl p-6 border"
                        style={{ width: '72%', scrollSnapAlign: 'start', borderColor: `${color}30`, backgroundColor: `${color}10` }}>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-3xl font-black serif-title" style={{ color }}>{letra}</span>
                          <div><Icon size={16} color={color} /><p className="text-xs font-bold mt-0.5" style={{ color }}>{palabra}</p></div>
                        </div>
                        <ul className="space-y-1.5">
                          {items.map(i => (
                            <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                              <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full" style={{ backgroundColor: color }} />{i}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>Deslizá para ver más →</p>
                </div>
                <div className="hidden md:grid md:grid-cols-4 gap-4 mb-14" data-reveal data-delay="1">
                  {FLUX.map(({ Icon, letra, palabra, color, items }) => (
                    <div key={letra} className="rounded-2xl p-6 border" style={{ borderColor: `${color}30`, backgroundColor: `${color}10` }}>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl font-black serif-title" style={{ color }}>{letra}</span>
                        <div><Icon size={16} color={color} /><p className="text-xs font-bold mt-0.5" style={{ color }}>{palabra}</p></div>
                      </div>
                      <ul className="space-y-1.5">
                        {items.map(i => (
                          <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                            <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full" style={{ backgroundColor: color }} />{i}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}

        </div>
      </section>

      {/* ── PARA QUIÉN ES ── */}
      <section className="py-16 md:py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12" data-reveal>
            <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold"
              style={{ backgroundColor: C.green }}>
              ¿Esto es para mí?
            </p>
            <h2 className="text-3xl md:text-4xl serif-title mb-4" style={{ color: C.dark }}>
              Para quienes construyen<br />y necesitan ver más lejos
            </h2>
          </div>

          {/* Mobile: carrusel para quién es */}
          <div className="md:hidden -mx-6 mb-10" data-reveal data-delay="1">
            <div ref={paraQuienRef} onTouchStart={() => setParaQuienPaused(true)}
              className="flex gap-3 overflow-x-auto pb-3 px-6"
              style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>
              <div className="flex-shrink-0 rounded-2xl p-7 border" style={{ width: '82%', scrollSnapAlign: 'start', borderColor: 'rgba(0,83,51,0.15)', backgroundColor: 'rgba(0,83,51,0.03)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(0,83,51,0.1)' }}><Briefcase size={18} color={C.green} /></div>
                <p className="font-bold text-base mb-2" style={{ color: C.green }}>Emprendedores</p>
                <p className="text-sm leading-relaxed mb-4" style={{ color: C.muted }}>Estás construyendo algo propio y necesitás claridad, perspectiva y energía renovada para el próximo ciclo.</p>
                <ul className="space-y-1.5">{['Founders que necesitan salir del día a día', 'Claridad estratégica lejos del ruido', 'Conexión con otros que entienden el camino', 'Tiempo para pensar sin culpa'].map(i => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: C.muted }}><span className="mt-0.5 flex-shrink-0" style={{ color: C.green }}>✓</span>{i}</li>
                ))}</ul>
              </div>
              <div className="flex-shrink-0 rounded-2xl p-7 border" style={{ width: '82%', scrollSnapAlign: 'start', borderColor: 'rgba(46,110,142,0.2)', backgroundColor: 'rgba(46,110,142,0.03)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(46,110,142,0.12)' }}><Network size={18} color={C.ice} /></div>
                <p className="font-bold text-base mb-2" style={{ color: C.ice }}>Dueños de negocio con equipo</p>
                <p className="text-sm leading-relaxed mb-4" style={{ color: C.muted }}>Venís solo o con tu equipo/socio. No como empresa — como personas que eligieron reconectar juntas.</p>
                <ul className="space-y-1.5">{['Equipos pequeños que necesitan resintonizarse', 'Socios que quieren pensar en perspectiva', 'Líderes que necesitan recargar para volver a dar', 'WiFi Starlink para no desconectarse del todo'].map(i => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: C.muted }}><span className="mt-0.5 flex-shrink-0" style={{ color: C.ice }}>✓</span>{i}</li>
                ))}</ul>
              </div>
              <div className="flex-shrink-0 rounded-2xl p-7 border" style={{ width: '82%', scrollSnapAlign: 'start', borderColor: 'rgba(107,128,144,0.2)', backgroundColor: 'rgba(107,128,144,0.04)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(107,128,144,0.1)' }}><Snowflake size={18} color={C.faint} /></div>
                <p className="font-bold text-base mb-2" style={{ color: C.muted }}>No es para vos si...</p>
                <p className="text-sm leading-relaxed mb-4" style={{ color: C.faint }}>Preferimos ser honestos para que la experiencia sea la correcta.</p>
                <ul className="space-y-1.5">{['Buscás un evento de networking masivo', 'Necesitás PowerPoints y sala de conferencias', 'Querés delegar tu bienestar a un spa de lujo', 'El silencio y la naturaleza te generan ansiedad'].map(i => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: C.faint }}><span className="mt-0.5 flex-shrink-0">✗</span>{i}</li>
                ))}</ul>
              </div>
            </div>
            <p className="text-[10px] text-center" style={{ color: C.faint }}>Deslizá para ver más →</p>
          </div>

          {/* Desktop: 3 cols */}
          <div className="hidden md:grid md:grid-cols-3 gap-5 mb-10" data-reveal data-delay="1">
            <div className="rounded-2xl p-7 border" style={{ borderColor: 'rgba(0,83,51,0.15)', backgroundColor: 'rgba(0,83,51,0.03)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(0,83,51,0.1)' }}><Briefcase size={18} color={C.green} /></div>
              <p className="font-bold text-base mb-2" style={{ color: C.green }}>Emprendedores</p>
              <p className="text-sm leading-relaxed mb-4" style={{ color: C.muted }}>Estás construyendo algo propio y necesitás claridad, perspectiva y energía renovada para el próximo ciclo.</p>
              <ul className="space-y-1.5">{['Founders que necesitan salir del día a día', 'Claridad estratégica lejos del ruido', 'Conexión con otros que entienden el camino', 'Tiempo para pensar sin culpa'].map(i => (
                <li key={i} className="flex items-start gap-2 text-xs" style={{ color: C.muted }}><span className="mt-0.5 flex-shrink-0" style={{ color: C.green }}>✓</span>{i}</li>
              ))}</ul>
            </div>
            <div className="rounded-2xl p-7 border" style={{ borderColor: 'rgba(46,110,142,0.2)', backgroundColor: 'rgba(46,110,142,0.03)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(46,110,142,0.12)' }}><Network size={18} color={C.ice} /></div>
              <p className="font-bold text-base mb-2" style={{ color: C.ice }}>Dueños de negocio con equipo</p>
              <p className="text-sm leading-relaxed mb-4" style={{ color: C.muted }}>Venís solo o con tu equipo/socio. No como empresa — como personas que eligieron reconectar juntas.</p>
              <ul className="space-y-1.5">{['Equipos pequeños que necesitan resintonizarse', 'Socios que quieren pensar en perspectiva', 'Líderes que necesitan recargar para volver a dar', 'WiFi Starlink para no desconectarse del todo'].map(i => (
                <li key={i} className="flex items-start gap-2 text-xs" style={{ color: C.muted }}><span className="mt-0.5 flex-shrink-0" style={{ color: C.ice }}>✓</span>{i}</li>
              ))}</ul>
            </div>
            <div className="rounded-2xl p-7 border" style={{ borderColor: 'rgba(107,128,144,0.2)', backgroundColor: 'rgba(107,128,144,0.04)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(107,128,144,0.1)' }}><Snowflake size={18} color={C.faint} /></div>
              <p className="font-bold text-base mb-2" style={{ color: C.muted }}>No es para vos si...</p>
              <p className="text-sm leading-relaxed mb-4" style={{ color: C.faint }}>Preferimos ser honestos para que la experiencia sea la correcta.</p>
              <ul className="space-y-1.5">{['Buscás un evento de networking masivo', 'Necesitás PowerPoints y sala de conferencias', 'Querés delegar tu bienestar a un spa de lujo', 'El silencio y la naturaleza te generan ansiedad'].map(i => (
                <li key={i} className="flex items-start gap-2 text-xs" style={{ color: C.faint }}><span className="mt-0.5 flex-shrink-0">✗</span>{i}</li>
              ))}</ul>
            </div>
          </div>

          <div className="text-center" data-reveal data-delay="2">
            <a href={WA_INFO} target="_blank" rel="noopener noreferrer"
              className="inline-block border font-semibold text-sm py-3 px-8 rounded-full transition-colors hover:bg-brand-green hover:text-white hover:border-brand-green"
              style={{ borderColor: 'rgba(0,83,51,0.3)', color: C.green }}>
              ¿Tengo dudas? Consultá sin compromiso →
            </a>
          </div>
        </div>
      </section>

      {/* ── EL INVIERNO NO ES PARA HIBERNAR ── */}
      <section className="py-20 md:py-28 px-6" style={{ backgroundColor: C.dark }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14" data-reveal>
            <p className="text-[10px] tracking-[0.4em] uppercase font-semibold mb-5" style={{ color: C.gold }}>
              No son vacaciones tradicionales
            </p>
            <h2 className="text-3xl md:text-5xl serif-title text-white leading-tight mb-6">
              Mientras todos frenan,<br /><span style={{ color: C.gold }}>vos preparás el salto.</span>
            </h2>
            <p className="text-base md:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
              El invierno no es para hibernar — es el momento donde los que construyen se separan de los que solo sobreviven. Cuando el mercado baja la velocidad, el emprendedor que usó ese tiempo para reconectar, clarificar y expandir su red llega a la primavera y al verano con una ventaja real.
            </p>
          </div>

          {/* Mobile: carrusel "mientras todos frenan" */}
          {(() => {
            const CARDS = [
              { title: 'Conexión real', color: C.gold, border: 'rgba(212,175,55,0.2)', bg: 'rgba(212,175,55,0.05)', desc: 'Las personas que comparten el espacio vienen con distintas habilidades, industrias y etapas de empresa. En el mismo retiro podés encontrar socios, colegas, clientes — o los tres.' },
              { title: 'Modelos regenerativos', color: '#7EC8E3', border: 'rgba(46,110,142,0.25)', bg: 'rgba(46,110,142,0.06)', desc: 'Pueblo Mágico no solo habla de negocio regenerativo — lo aplica y lo sigue mejorando. Vas a estar inmerso en un entorno donde esos modelos funcionan, y eso te va a dar más data que cualquier curso.' },
              { title: 'El salto de primavera', color: '#6EE7B7', border: 'rgba(0,83,51,0.3)', bg: 'rgba(0,83,51,0.1)', desc: 'El invierno en la montaña no es una pausa. Es el sprint invisible que nadie ve hasta que en octubre y diciembre tu negocio avanza mientras los demás recién empiezan a pensar qué hacer.' },
            ];
            return (
              <>
                <div className="md:hidden -mx-6 mb-14" data-reveal data-delay="1">
                  <div ref={mientrasRef} onTouchStart={() => setMientrasPaused(true)}
                    className="flex gap-3 overflow-x-auto pb-3 px-6"
                    style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>
                    {CARDS.map(({ title, color, border, bg, desc }) => (
                      <div key={title} className="flex-shrink-0 rounded-2xl p-7 border" style={{ width: '82%', scrollSnapAlign: 'start', borderColor: border, backgroundColor: bg }}>
                        <p className="text-3xl serif-title font-bold mb-3" style={{ color }}>{title}</p>
                        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>{desc}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>Deslizá para ver más →</p>
                </div>
                <div className="hidden md:grid md:grid-cols-3 gap-5 mb-14" data-reveal data-delay="1">
                  {CARDS.map(({ title, color, border, bg, desc }) => (
                    <div key={title} className="rounded-2xl p-7 border" style={{ borderColor: border, backgroundColor: bg }}>
                      <p className="text-3xl serif-title font-bold mb-3" style={{ color }}>{title}</p>
                      <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>{desc}</p>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}

          <div className="rounded-2xl p-8 md:p-10 border" data-reveal data-delay="2"
            style={{ borderColor: 'rgba(212,175,55,0.2)', backgroundColor: 'rgba(212,175,55,0.05)' }}>
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(212,175,55,0.2)' }}>
                <Users size={18} color={C.gold} />
              </div>
              <div>
                <p className="font-bold text-base text-white mb-1">Las conversaciones correctas cambian proyectos</p>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Cuando estás en un entorno de confianza, sin agenda fija y con personas que construyen, las conversaciones se vuelven profundas rápido. Mejorás tu pitch sin proponértelo. Encontrás diferencias de mercado que no ves desde tu oficina. Aparecen oportunidades que no estaban en el plan.
                </p>
              </div>
            </div>
            <div className="pt-5 border-t" style={{ borderColor: 'rgba(212,175,55,0.15)' }}>
              <p className="text-xs leading-relaxed italic" style={{ color: 'rgba(255,255,255,0.45)' }}>
                "Las personas que vienen al espacio tienen la posibilidad real de cerrar buenos clientes, mejorar sus proyectos y hacer crecer sus empresas — emprendedores y empresarios de múltiple impacto y distintas etapas han pasado por aquí."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOGATA ── */}
      <section className="py-16 md:py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16">
          <div className="flex-1 order-2 md:order-1" data-reveal>
            <p className="text-[10px] tracking-[0.4em] uppercase font-semibold mb-6" style={{ color: C.fire }}>
              Donde nacen las mejores ideas
            </p>
            <h2 className="text-3xl md:text-4xl serif-title leading-snug mb-6" style={{ color: C.dark }}>
              Las mejores decisiones<br />no nacen en salas de reuniones.
            </h2>
            <p className="text-sm md:text-base leading-relaxed mb-8" style={{ color: C.muted }}>
              Nacen alrededor de un fogón, a 1.800 metros de altura, con el cerebro en modo de descanso profundo. La montaña hace lo que ninguna consultora puede hacer: te saca del ruido para que puedas escucharte a vos mismo y a los demás de verdad.
            </p>
            <a href={WA_INFO} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: C.gold, color: '#fff' }}>
              Quiero saber más →
            </a>
          </div>
          <div className="flex-shrink-0 w-64 md:w-72 lg:w-80 order-1 md:order-2 rounded-2xl overflow-hidden shadow-xl" data-reveal data-delay="1">
            <img
              src="/uploads/Invierno/fogata-vertical.jpeg"
              alt="Fogata nocturna en la montaña"
              className="w-full block"
              style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* ── GALERÍA ── */}
      <section className="py-8 px-6 bg-white">
        <div className="max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-lg relative" style={{ height: '68vh', minHeight: '380px', maxHeight: '640px' }}>
          {CAROUSEL.map((photo, i) => (
            <div key={photo.src} className="absolute inset-0 transition-opacity duration-700 flex items-center justify-center"
              style={{ backgroundColor: '#F5F5F0', opacity: i === carouselIdx ? 1 : 0 }}>
              <img src={photo.src} alt={photo.caption} className="w-full h-full"
                style={{ objectFit: 'contain' }} loading={i === 0 ? 'eager' : 'lazy'} />
            </div>
          ))}
          <button onClick={() => setCarouselIdx(i => (i - 1 + CAROUSEL.length) % CAROUSEL.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.12)', backdropFilter: 'blur(4px)' }} aria-label="Foto anterior">
            <ChevronLeft size={20} color={C.dark} />
          </button>
          <button onClick={() => setCarouselIdx(i => (i + 1) % CAROUSEL.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.12)', backdropFilter: 'blur(4px)' }} aria-label="Foto siguiente">
            <ChevronRight size={20} color={C.dark} />
          </button>
          <div className="absolute bottom-5 left-0 right-0 z-10 text-center">
            <p className="text-xs mb-3 tracking-wide" style={{ color: 'rgba(26,43,60,0.55)' }}>{CAROUSEL[carouselIdx].caption}</p>
            <div className="flex justify-center gap-2">
              {CAROUSEL.map((_, i) => (
                <button key={i} onClick={() => setCarouselIdx(i)} className="rounded-full transition-all duration-300"
                  style={{ width: i === carouselIdx ? '18px' : '6px', height: '6px', backgroundColor: i === carouselIdx ? C.gold : 'rgba(0,0,0,0.2)' }}
                  aria-label={`Foto ${i + 1}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TRES PILARES ── */}
      <section className="py-20 md:py-28 px-6" style={{ backgroundColor: C.dark }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14" data-reveal>
            <p className="text-[9px] tracking-[0.4em] uppercase font-semibold mb-4" style={{ color: C.gold }}>Contenido · Kintu × Pueblo Mágico</p>
            <h2 className="text-3xl md:text-4xl serif-title text-white mb-4">
              Tres ejes. Un mes.<br />Tu próxima versión.
            </h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
              El Winter Redirection no es un retiro genérico. Tiene contenido específico diseñado para emprendedores en tres ejes concretos.
            </p>
          </div>

          {(() => {
            const PILARES = [
              {
                Icon: Brain,
                kicker: 'Pilar 1',
                title: 'Mentalidad de crecimiento',
                desc: 'De la supervivencia a la expansión. Reconocés y reconfigurás las creencias que te frenan para tomar decisiones desde la claridad.',
                items: ['Creencias limitantes y cómo reconfigurarlas', 'Toma de decisiones bajo incertidumbre', 'Resiliencia emprendedora', 'Propósito como brújula estratégica'],
              },
              {
                Icon: Megaphone,
                kicker: 'Pilar 2',
                title: 'Comunicación & Growth',
                desc: 'Marketing con propósito, alianzas reales y redes que potencian. Comunicás lo que hacés con claridad y construís desde la autenticidad.',
                items: ['Marketing con propósito y sin ruido', 'Alianzas estratégicas y comunidades', 'Posicionamiento auténtico', 'Redes sociales como canal de impacto'],
              },
              {
                Icon: Bot,
                kicker: 'Pilar 3',
                title: 'Productos & Servicios con IA',
                desc: 'Diseño de productos y servicios potenciados por IA para modelos de negocio regenerativos y con propósito real.',
                items: ['Desarrollo de productos con IA', 'Modelos de negocio regenerativos', 'Propuesta de valor diferenciada', 'Arquitecturas de conversión soberanas'],
              },
            ];
            const Card = ({ Icon, kicker, title, desc, items }: typeof PILARES[0]) => (
              <div className="rounded-2xl p-7 border" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: 'rgba(212,175,55,0.15)' }}>
                  <Icon size={20} color={C.gold} />
                </div>
                <p className="text-[9px] tracking-[0.3em] uppercase font-semibold mb-2" style={{ color: C.gold }}>{kicker}</p>
                <h3 className="text-xl serif-title text-white mb-3">{title}</h3>
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.55)' }}>{desc}</p>
                <ul className="space-y-2">
                  {items.map(a => (
                    <li key={a} className="flex items-start gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      <span className="flex-shrink-0 mt-0.5" style={{ color: C.gold }}>→</span>{a}
                    </li>
                  ))}
                </ul>
              </div>
            );
            return (
              <>
                <div className="md:hidden -mx-6" data-reveal data-delay="1">
                  <div ref={pilaresRef} onTouchStart={() => setPilaresPaused(true)}
                    className="flex gap-3 overflow-x-auto pb-3 px-6"
                    style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>
                    {PILARES.map(p => (
                      <div key={p.title} className="flex-shrink-0" style={{ width: '85%', scrollSnapAlign: 'start' }}>
                        <Card {...p} />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-center mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Deslizá para ver más →</p>
                </div>
                <div className="hidden md:grid md:grid-cols-3 gap-5" data-reveal data-delay="1">
                  {PILARES.map(p => <Card key={p.title} {...p} />)}
                </div>
              </>
            );
          })()}
        </div>
      </section>

      {/* ── LA EXPERIENCIA ── */}
      <section className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14" data-reveal>
            <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold"
              style={{ backgroundColor: C.fire }}>
              La experiencia
            </p>
            <h2 className="text-3xl md:text-4xl serif-title mb-4" style={{ color: C.dark }}>
              Un mes para redirigir,<br />no para escapar
            </h2>
            <p className="text-base max-w-2xl mx-auto" style={{ color: C.muted }}>
              No venís a desconectarte del todo — venís a conectarte con lo que importa. El lugar, la comunidad y el contenido trabajan juntos para darte lo que ninguna jornada de trabajo puede darte: perspectiva real.
            </p>
          </div>

          {/* Mobile: carrusel 3 tarjetas */}
          <div className="md:hidden -mx-6 mt-12" data-reveal data-delay="1">
            <div ref={expCardsRef} onTouchStart={() => setExpPaused(true)}
              className="flex gap-3 overflow-x-auto pb-3 px-6"
              style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>
              <div className="flex-shrink-0 rounded-2xl p-6 border" style={{ width: '82%', scrollSnapAlign: 'start', borderColor: 'rgba(0,83,51,0.2)', backgroundColor: 'rgba(0,83,51,0.03)' }}>
                <div className="flex items-center gap-2 mb-1"><Smartphone size={13} color={C.green} /><p className="text-[9px] tracking-widest uppercase font-bold" style={{ color: C.green }}>Siempre incluido</p></div>
                <p className="font-bold text-sm mb-1" style={{ color: C.dark }}>Reset Vital · Emprendedores</p>
                <p className="text-xs leading-relaxed mb-3" style={{ color: C.muted }}>Guía autoguiada en tu teléfono. Contenido específico para FLUX. Sin horarios. Funciona offline.</p>
                <ul className="space-y-1">{['Navegando el entorno FLUX', 'Inteligencia colectiva', 'Modelos de negocio regenerativos', 'Ikigai y propósito', 'Meditaciones para líderes', 'Journaling estratégico'].map(a => (<li key={a} className="flex items-start gap-1.5 text-xs" style={{ color: C.muted }}><span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full" style={{ backgroundColor: C.green }} />{a}</li>))}</ul>
              </div>
              <div className="flex-shrink-0 rounded-2xl p-6 border" style={{ width: '82%', scrollSnapAlign: 'start', borderColor: 'rgba(46,110,142,0.2)', backgroundColor: 'rgba(46,110,142,0.03)' }}>
                <div className="flex items-center gap-2 mb-1"><CalendarDays size={13} color={C.ice} /><p className="text-[9px] tracking-widest uppercase font-bold" style={{ color: C.ice }}>Según agenda y grupo</p></div>
                <p className="font-bold text-sm mb-1" style={{ color: C.dark }}>Con facilitadores</p>
                <p className="text-xs leading-relaxed mb-3" style={{ color: C.muted }}>Sesiones y dinámicas según las fechas y el grupo. Consultanos antes de llegar.</p>
                <ul className="space-y-1 mb-4">{['Círculos de emprendedores', 'Claridad estratégica', 'Inteligencia colectiva', 'Yoga y movimiento consciente', 'Fogones nocturnos'].map(a => (<li key={a} className="flex items-start gap-1.5 text-xs" style={{ color: C.muted }}><span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full" style={{ backgroundColor: C.ice }} />{a}</li>))}</ul>
                <div className="border-t mt-3 pt-3 mb-3" style={{ borderColor: 'rgba(46,110,142,0.15)' }}>
                  <p className="text-[9px] uppercase tracking-widest font-bold mb-2" style={{ color: C.ice }}>Actividades · guía fauna y flora</p>
                  <ul className="space-y-1">{['Avistaje de aves', 'Flora y fauna nativa', 'Trekking naturalista'].map(a => (<li key={a} className="flex items-start gap-1.5 text-xs" style={{ color: C.muted }}><span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full" style={{ backgroundColor: C.ice }} />{a}</li>))}</ul>
                </div>
                <a href={WA_INFO} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold underline" style={{ color: C.ice }}>Consultar agenda →</a>
              </div>
              <div className="flex-shrink-0 rounded-2xl p-6 border" style={{ width: '82%', scrollSnapAlign: 'start', borderColor: 'rgba(212,175,55,0.25)', backgroundColor: 'rgba(212,175,55,0.03)' }}>
                <div className="flex items-center gap-2 mb-1"><CalendarDays size={13} color="#8B6A00" /><p className="text-[9px] tracking-widest uppercase font-bold" style={{ color: '#8B6A00' }}>A contratar aparte</p></div>
                <p className="font-bold text-sm mb-1" style={{ color: C.dark }}>Actividades extra</p>
                <p className="text-xs leading-relaxed mb-3" style={{ color: C.muted }}>Con costo adicional. Se coordinan con anticipación.</p>
                <ul className="space-y-1 mb-4">{[{ Icon: Footprints, t: 'Trekking con guías' }, { Icon: Zap, t: 'Running · 5k / 10k+' }, { Icon: PawPrint, t: 'Cabalgatas' }, { Icon: Heart, t: 'Masajes y terapias' }, { Icon: Flame, t: 'Temazcal ceremonial' }].map(({ Icon, t }) => (<li key={t} className="flex items-center gap-1.5 text-xs" style={{ color: C.muted }}><Icon size={11} color="#8B6A00" />{t}</li>))}</ul>
                <a href={WA_INFO} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold underline" style={{ color: '#8B6A00' }}>Consultar disponibilidad →</a>
              </div>
            </div>
            <p className="text-[10px] text-center" style={{ color: C.faint }}>Deslizá para ver más →</p>
          </div>

          {/* Desktop: 3 columnas */}
          <div className="hidden md:grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-14" data-reveal data-delay="1">
            <div className="rounded-2xl p-6 border" style={{ borderColor: 'rgba(0,83,51,0.2)', backgroundColor: 'rgba(0,83,51,0.03)' }}>
              <div className="flex items-center gap-2 mb-1"><Smartphone size={13} color={C.green} /><p className="text-[9px] tracking-widest uppercase font-bold" style={{ color: C.green }}>Siempre incluido</p></div>
              <p className="font-bold text-sm mb-1" style={{ color: C.dark }}>Reset Vital · Emprendedores</p>
              <p className="text-xs leading-relaxed mb-3" style={{ color: C.muted }}>Guía autoguiada en tu teléfono. Contenido específico para FLUX. Sin horarios. Funciona offline.</p>
              <ul className="space-y-1">{['Navegando el entorno FLUX', 'Inteligencia colectiva', 'Modelos de negocio regenerativos', 'Ikigai y propósito', 'Meditaciones para líderes', 'Journaling estratégico'].map(a => (<li key={a} className="flex items-start gap-1.5 text-xs" style={{ color: C.muted }}><span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full" style={{ backgroundColor: C.green }} />{a}</li>))}</ul>
            </div>
            <div className="rounded-2xl p-6 border" style={{ borderColor: 'rgba(46,110,142,0.2)', backgroundColor: 'rgba(46,110,142,0.03)' }}>
              <div className="flex items-center gap-2 mb-1"><CalendarDays size={13} color={C.ice} /><p className="text-[9px] tracking-widest uppercase font-bold" style={{ color: C.ice }}>Según agenda y grupo</p></div>
              <p className="font-bold text-sm mb-1" style={{ color: C.dark }}>Con facilitadores</p>
              <p className="text-xs leading-relaxed mb-3" style={{ color: C.muted }}>Sesiones y dinámicas según las fechas y el grupo. Consultanos antes de llegar.</p>
              <ul className="space-y-1 mb-4">{['Círculos de emprendedores', 'Claridad estratégica', 'Inteligencia colectiva', 'Yoga y movimiento consciente', 'Fogones nocturnos'].map(a => (<li key={a} className="flex items-start gap-1.5 text-xs" style={{ color: C.muted }}><span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full" style={{ backgroundColor: C.ice }} />{a}</li>))}</ul>
                <div className="border-t mt-3 pt-3 mb-3" style={{ borderColor: 'rgba(46,110,142,0.15)' }}>
                  <p className="text-[9px] uppercase tracking-widest font-bold mb-2" style={{ color: C.ice }}>Actividades · guía fauna y flora</p>
                  <ul className="space-y-1">{['Avistaje de aves', 'Flora y fauna nativa', 'Trekking naturalista'].map(a => (<li key={a} className="flex items-start gap-1.5 text-xs" style={{ color: C.muted }}><span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full" style={{ backgroundColor: C.ice }} />{a}</li>))}</ul>
                </div>
              <a href={WA_INFO} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold underline" style={{ color: C.ice }}>Consultar agenda →</a>
            </div>
            <div className="rounded-2xl p-6 border" style={{ borderColor: 'rgba(212,175,55,0.25)', backgroundColor: 'rgba(212,175,55,0.03)' }}>
              <div className="flex items-center gap-2 mb-1"><CalendarDays size={13} color="#8B6A00" /><p className="text-[9px] tracking-widest uppercase font-bold" style={{ color: '#8B6A00' }}>A contratar aparte</p></div>
              <p className="font-bold text-sm mb-1" style={{ color: C.dark }}>Actividades extra</p>
              <p className="text-xs leading-relaxed mb-3" style={{ color: C.muted }}>Con costo adicional. Se coordinan con anticipación.</p>
              <ul className="space-y-1 mb-4">{[{ Icon: Footprints, t: 'Trekking con guías' }, { Icon: Zap, t: 'Running · 5k / 10k+' }, { Icon: PawPrint, t: 'Cabalgatas' }, { Icon: Heart, t: 'Masajes y terapias' }, { Icon: Flame, t: 'Temazcal ceremonial' }].map(({ Icon, t }) => (<li key={t} className="flex items-center gap-1.5 text-xs" style={{ color: C.muted }}><Icon size={11} color="#8B6A00" />{t}</li>))}</ul>
              <a href={WA_INFO} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold underline" style={{ color: '#8B6A00' }}>Consultar disponibilidad →</a>
            </div>
          </div>

          <p className="text-center serif-title text-xl md:text-2xl mt-6" style={{ color: C.green }} data-reveal data-delay="2">
            El frío no detiene. <span style={{ color: C.gold }}>Clarifica.</span>
          </p>

        </div>
      </section>

      {/* ── TRANSFORMACIÓN ── */}
      <section className="py-20 md:py-28 px-6 relative overflow-hidden"
        style={{ backgroundImage: `url('/uploads/Invierno/20250629_132707.webp')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0" style={{ background: 'rgba(4,10,20,0.84)' }} />
        <div className="max-w-4xl mx-auto text-center relative z-10" data-reveal>
          <h2 className="text-2xl md:text-4xl serif-title text-white leading-snug mb-10">
            Llegás siendo una persona.<br />Te vas siendo otra.
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 text-left" data-reveal data-delay="1">
            {[
              { antes: 'Venís con proyectos trabados',          despues: 'te vas con el próximo paso claro.' },
              { antes: 'Venís agotado/a del modo reactivo',     despues: 'te vas recargado/a y en modo estratégico.' },
              { antes: 'Venís con bloqueos creativos',          despues: 'te vas lleno/a de ideas frescas.' },
              { antes: 'Venís desconectado/a de tu propósito',  despues: 'te vas reconectado/a con lo que importa.' },
            ].map(({ antes, despues }) => (
              <div key={antes} className="rounded-2xl p-5 border flex items-start gap-4" style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
                <div className="flex-shrink-0 w-1 self-stretch rounded-full" style={{ backgroundColor: C.gold }} />
                <div>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{antes}…</p>
                  <p className="text-base font-semibold text-white">{despues}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ALIMENTACIÓN ── */}
      <section className="relative overflow-hidden"
        style={{ backgroundImage: `url('/uploads/469731807_3987061274856806_2943773444767775905_n.jpg')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(4,10,20,0.91) 0%, rgba(4,10,20,0.86) 100%)' }} />
        <button onClick={() => setAlimentacionOpen(o => !o)} className="relative z-10 w-full py-7" aria-expanded={alimentacionOpen}>
          <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <span className="text-2xl md:text-3xl">🌿</span>
              <div className="text-left">
                <p className="text-[9px] tracking-[0.35em] uppercase font-semibold mb-1.5" style={{ color: C.gold }}>Pensión completa · 3 comidas · incluido</p>
                <h2 className="text-xl md:text-2xl serif-title text-white leading-tight">Alimentación</h2>
              </div>
            </div>
            <span className="text-white/60 text-2xl transition-transform duration-300 flex-shrink-0"
              style={{ transform: alimentacionOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>↓</span>
          </div>
        </button>
        <div className="relative z-10 overflow-hidden transition-all duration-500 ease-in-out"
          style={{ maxHeight: alimentacionOpen ? '600px' : '0px', opacity: alimentacionOpen ? 1 : 0 }}>
          <div className="px-6 pb-12 pt-8 max-w-4xl mx-auto">
            <p className="text-base leading-relaxed mb-6 text-white/75">
              En Pueblo Mágico, la alimentación es parte de la experiencia. Cada plato se prepara con ingredientes frescos, locales y de estación — comida real que regenera el cuerpo, calienta el alma y sostiene la energía que necesitás para pensar con claridad.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {['Desayuno, almuerzo y cena incluidos', 'Ingredientes frescos y de estación', 'Preparado con cariño por nuestro equipo', 'Adaptable a necesidades especiales'].map(item => (
                <div key={item} className="flex items-start gap-2">
                  <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: C.gold }} />
                  <p className="text-xs text-white/70">{item}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-4 max-w-lg" style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)' }}>
              <p className="text-xs font-semibold mb-1 text-white/90">Comedor de uso libre · Cocina común</p>
              <p className="text-xs leading-relaxed text-white/55">El comedor está disponible con hornallas, bacha, vajilla y utensilios. La cocina del equipo es privada — allí preparamos tus 3 comidas diarias.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TEMAZCAL ── */}
      <section id="temazcal" className="relative overflow-hidden"
        style={{ backgroundImage: `url('/uploads/temazcal.webp')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(4,8,18,0.92) 0%, rgba(4,8,18,0.88) 100%)' }} />
        {/* Collapsed header — always visible */}
        <button
          onClick={() => setTemazcalOpen(o => !o)}
          className="relative z-10 w-full py-7"
          aria-expanded={temazcalOpen}
        >
          <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <span className="text-2xl md:text-3xl">🔥</span>
              <div className="text-left">
                <p className="text-[9px] tracking-[0.35em] uppercase font-semibold mb-1.5" style={{ color: C.gold }}>Ceremonia ancestral · actividad extra</p>
                <h2 className="text-xl md:text-2xl serif-title text-white leading-tight">Temazcal</h2>
              </div>
            </div>
            <span className="text-white/60 text-2xl transition-transform duration-300 flex-shrink-0"
              style={{ transform: temazcalOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              ↓
            </span>
          </div>
        </button>
        {/* Expandable content */}
        <div
          className="relative z-10 overflow-hidden transition-all duration-500 ease-in-out"
          style={{ maxHeight: temazcalOpen ? '600px' : '0px', opacity: temazcalOpen ? 1 : 0 }}
        >
          <div className="px-6 pb-12 pt-8 max-w-4xl mx-auto text-center">
            <p className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-5 text-white/75">
              El temazcal es una ceremonia de purificación y renacimiento. Calor, vapor, oscuridad y silencio — un ritual que limpia lo que el cuerpo acumula y abre lo que el alma necesita liberar.
            </p>
            <p className="text-sm leading-relaxed max-w-xl mx-auto mb-10 text-white/55">
              Conducido por <span className="font-semibold text-white/85">Santiago Alzogaray</span>. Un espacio sagrado donde la comunidad se reúne alrededor del fuego para transpirar juntos, pedir y agradecer en la montaña.
            </p>
            <a href={WA_INFO} target="_blank" rel="noopener noreferrer"
              className="inline-block border border-white/30 text-white text-sm font-semibold px-8 py-3 rounded-full hover:bg-white/10 transition-colors">
              Consultar disponibilidad y fecha
            </a>
          </div>
        </div>
      </section>

      {/* ── EQUIPO ── */}
      <section className="py-20 md:py-28 px-6" style={{ backgroundColor: C.night }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14" data-reveal>
            <p className="text-[10px] tracking-[0.4em] uppercase font-semibold mb-4" style={{ color: '#8B6A00' }}>El equipo</p>
            <h2 className="text-3xl md:text-4xl serif-title mb-4" style={{ color: C.dark }}>Quienes sostienen el espacio</h2>
          </div>

          {/* Anfitriones */}
          <div className="mb-10" data-reveal data-delay="1">
            <p className="text-[10px] tracking-[0.4em] uppercase font-semibold mb-6 text-center" style={{ color: '#8B6A00' }}>
              Anfitriones y guardianes del espacio
            </p>
            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {ANFITRIONES.map(({ photo, nombre, rol, desc, instagram, tags }) => (
                <div key={nombre} className="flex items-start gap-4 rounded-2xl p-5 border" style={{ borderColor: 'rgba(46,110,142,0.2)', backgroundColor: 'rgba(255,255,255,0.72)' }}>
                  <img src={img(photo, 120)} alt={nombre} className="w-14 h-14 rounded-full object-cover flex-shrink-0" loading="lazy" />
                  <div>
                    {tags && tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {tags.map(tag => (
                          <span key={tag} className="text-[8px] font-bold tracking-[0.12em] uppercase px-2 py-0.5 rounded-full border"
                            style={tag === 'KINTU'
                              ? { backgroundColor: 'rgba(212,175,55,0.1)', color: '#8B6A00', borderColor: 'rgba(212,175,55,0.3)' }
                              : { backgroundColor: 'rgba(0,83,51,0.07)', color: C.green, borderColor: 'rgba(0,83,51,0.2)' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="font-bold text-sm mb-0.5" style={{ color: C.dark }}>{nombre}</p>
                    <p className="text-xs font-semibold mb-2" style={{ color: C.green }}>{rol}</p>
                    <p className="text-xs leading-relaxed mb-2" style={{ color: C.muted }}>{desc}</p>
                    {instagram && (
                      <a href={instagram} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: C.green }}>
                        <Instagram size={11} /> Instagram
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Facilitadores */}
          <div className="mb-10" data-reveal data-delay="2">
            <p className="text-[10px] tracking-[0.4em] uppercase font-semibold mb-6 text-center" style={{ color: C.green }}>
              Facilitadores de contenido emprendedor
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {FACILITADORES.slice(0, 3).map(({ photo, nombre, rol, desc, instagram, linkedin, tags }) => (
                <div key={nombre} className="rounded-2xl p-7 border" style={{ borderColor: 'rgba(0,83,51,0.1)', backgroundColor: 'rgba(0,83,51,0.02)' }}>
                  <img src={img(photo, 200)} alt={nombre} className="w-14 h-14 rounded-full object-cover mb-4" loading="lazy" />
                  {tags && tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {tags.map(tag => (
                        <span key={tag} className="text-[8px] font-bold tracking-[0.12em] uppercase px-2 py-0.5 rounded-full border"
                          style={tag === 'KINTU'
                            ? { backgroundColor: 'rgba(212,175,55,0.1)', color: '#8B6A00', borderColor: 'rgba(212,175,55,0.3)' }
                            : { backgroundColor: 'rgba(0,83,51,0.07)', color: C.green, borderColor: 'rgba(0,83,51,0.2)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="font-bold text-base mb-1" style={{ color: C.dark }}>{nombre}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: C.green }}>{rol}</p>
                  <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{desc}</p>
                  {(instagram || linkedin) && (
                    <div className="flex gap-2 mt-4">
                      {instagram && (
                        <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label={`Instagram de ${nombre}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors hover:bg-brand-green/10"
                          style={{ backgroundColor: 'rgba(0,83,51,0.06)' }}>
                          <Instagram size={14} color={C.green} />
                        </a>
                      )}
                      {linkedin && (
                        <a href={linkedin} target="_blank" rel="noopener noreferrer" aria-label={`LinkedIn de ${nombre}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors hover:bg-brand-green/10"
                          style={{ backgroundColor: 'rgba(0,83,51,0.06)' }}>
                          <Linkedin size={14} color={C.green} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Kintu */}
          <div className="mt-14 rounded-2xl p-8 text-center" data-reveal data-delay="4" style={{ backgroundColor: C.green }}>
            <p className="text-[10px] tracking-[0.4em] uppercase font-semibold mb-3" style={{ color: C.gold }}>Coproducción</p>
            <p className="text-white font-bold text-lg mb-2">Kintu</p>
            <p className="text-white/70 text-sm max-w-lg mx-auto">Productora de experiencias transformadoras. Diseñamos el Winter Redirection junto a Pueblo Mágico para que el contenido y el espacio se potencien mutuamente.</p>
          </div>
        </div>
      </section>

      {/* ── EL LUGAR ── */}
      <section className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14" data-reveal>
            <p className="text-[10px] tracking-[0.4em] uppercase font-semibold mb-4" style={{ color: C.green }}>El espacio</p>
            <h2 className="text-3xl md:text-4xl serif-title mb-4" style={{ color: C.dark }}>
              Pueblo Mágico · Los Gigantes, Córdoba
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: C.muted }}>
              Un eco-centro en las Sierras Grandes a 1.800 metros de altura. 20 años regenerando la montaña. El lugar donde la naturaleza hace lo que ninguna sala de reuniones puede hacer.
            </p>
          </div>

          {(() => {
            const LUGAR = [
              { src: '/uploads/yoga_salon.webp',                                    label: 'El Salón',           desc: 'Yoga · círculos · dinámicas' },
              { src: '/uploads/coworking.webp',                                     label: 'Coworking',          desc: 'WiFi Starlink · mesas de trabajo' },
              { src: '/uploads/habitaciones.webp',                                  label: 'Habitaciones',       desc: 'Ropa blanca · toallón · calidez' },
              { src: '/uploads/Invierno/DJI_20250629140041_0171_D_CHAPA2025.webp',  label: 'Domos Geodésicos',   desc: 'Glamping en la montaña nevada' },
              { src: '/uploads/mesadas.webp',                                       label: 'Cocina común',       desc: 'Hornallas · comedor compartido' },
              { src: '/uploads/botica.webp',                                        label: 'La Botica',          desc: 'Plantas medicinales de la sierra' },
            ];
            const total = LUGAR.length + 1;
            return (
              <>
                {/* Mobile: carrusel JS — slide 0 = video, 1-6 = fotos */}
                <div className="mt-10 md:hidden" data-reveal data-delay="1">
                  <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    <div className="absolute inset-0 transition-opacity duration-500"
                      style={{ opacity: lugarIdx === 0 ? 1 : 0, pointerEvents: lugarIdx === 0 ? 'auto' : 'none', background: '#000' }}>
                      {lugarIdx === 0 && (
                        <iframe src="https://www.youtube.com/embed/QPNxc5Nh8es?rel=0&modestbranding=1"
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen title="Pueblo Mágico" />
                      )}
                    </div>
                    {LUGAR.map(({ src, label }, i) => (
                      <div key={src} className="absolute inset-0 transition-opacity duration-500"
                        style={{ opacity: lugarIdx === i + 1 ? 1 : 0, pointerEvents: lugarIdx === i + 1 ? 'auto' : 'none' }}>
                        <img src={img(src, 900)} alt={label} className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)' }} />
                        <p className="absolute bottom-3 left-4 text-white text-xs font-bold">{label}</p>
                      </div>
                    ))}
                    <button onClick={() => setLugarIdx(i => (i - 1 + total) % total)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                      style={{ background: 'rgba(0,0,0,0.45)' }} aria-label="Anterior">‹</button>
                    <button onClick={() => setLugarIdx(i => (i + 1) % total)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                      style={{ background: 'rgba(0,0,0,0.45)' }} aria-label="Siguiente">›</button>
                  </div>
                  <div className="flex justify-center gap-1.5 mt-2">
                    {Array.from({ length: total }).map((_, i) => (
                      <button key={i} onClick={() => setLugarIdx(i)}
                        className="w-1.5 h-1.5 rounded-full transition-colors"
                        style={{ background: lugarIdx === i ? C.green : 'rgba(0,0,0,0.2)' }} aria-label={`Slide ${i + 1}`} />
                    ))}
                  </div>
                </div>
                {/* Desktop: video izq + grid fotos der */}
                <div className="hidden md:grid md:grid-cols-2 gap-12 items-start mt-12" data-reveal data-delay="1">
                  <div className="rounded-2xl overflow-hidden shadow-xl">
                    <div className="aspect-video">
                      <iframe src="https://www.youtube.com/embed/ktzVcAs-74c?rel=0&modestbranding=1"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen title="Pueblo Mágico" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {LUGAR.map(({ src, label, desc }) => (
                      <div key={src} className="group relative rounded-xl overflow-hidden shadow-sm" style={{ aspectRatio: '4/3' }}>
                        <img src={img(src, 600)} alt={label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,20,12,0.72) 0%, transparent 55%)' }} />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-white text-xs font-bold mb-0.5">{label}</p>
                          <p className="text-white/55 text-[10px]">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section className="py-12 md:py-16 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center" data-reveal>
          <p className="text-[10px] tracking-[0.3em] uppercase font-semibold mb-3" style={{ color: C.faint }}>Cómo funciona</p>
          <p className="text-sm md:text-base leading-relaxed" style={{ color: C.muted }}>
            No es un paquete cerrado ni un evento con agenda fija. Reservás las noches que quieras durante julio, agosto o septiembre 2026, llegás cuando podés y te vas cuando necesitás. Mientras estás, tenés pensión completa, el Reset Vital para emprendedores disponible, y el cronograma de actividades al que sumarte cuando quieras. El precio se calcula <strong style={{ color: C.dark }}>por noche</strong> — cuantas más noches, más baja el costo de cada una.
          </p>
        </div>
      </section>

      {/* ── TESTIMONIOS ── */}
      <section className="py-16 md:py-24 px-6" style={{ backgroundColor: C.dark }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12" data-reveal>
            <p className="text-[10px] tracking-[0.4em] uppercase font-semibold mb-4" style={{ color: C.gold }}>Quienes ya vivieron la experiencia</p>
            <h2 className="text-3xl md:text-4xl serif-title text-white mb-3">Lo que dicen quienes estuvieron</h2>
            <a href="https://maps.app.goo.gl/4c1nrpBbQf5hYrsE9" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border transition-colors hover:bg-white/10"
              style={{ borderColor: 'rgba(212,175,55,0.3)' }}>
              <span className="text-sm" style={{ color: '#F4C27A' }}>★★★★★</span>
              <span className="text-white/65 text-xs font-semibold">5.0 · 64 reseñas en Google Maps</span>
            </a>
          </div>
          {(() => {
            const TESTIS = [
              { text: 'Salí con más claridad de la que entré. No fue un retiro, fue una redirección real. Volví con decisiones tomadas que venía postergando hace meses.', name: 'Marcos D.', rol: 'Founder · Huésped' },
              { text: 'Lo más poderoso fue la conversación de fogón con otros emprendedores. Eso no se reproduce en ninguna conferencia ni mastermind online.', name: 'Julieta C.', rol: 'Emprendedora · Huéspeda' },
              { text: 'El equipo, el lugar y la comida crean un contexto donde la mente baja la guardia y el cuerpo descansa de verdad. Eso es lo que permite ver con claridad.', name: 'Sofía R.', rol: 'Dueña de negocio' },
            ];
            const Card = ({ text, name, rol }: typeof TESTIS[0]) => (
              <div className="rounded-2xl p-6 border" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-2xl mb-4 leading-none" style={{ color: C.gold }}>"</p>
                <p className="text-sm leading-relaxed mb-6 text-white/80 italic">{text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: C.green }}>{name[0]}</div>
                  <div>
                    <p className="text-sm font-bold text-white">{name}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{rol}</p>
                  </div>
                </div>
              </div>
            );
            return (
              <>
                {/* Mobile: carrusel auto-play */}
                <div className="md:hidden -mx-6" data-reveal data-delay="1">
                  <div ref={testiRef} onTouchStart={() => setTestiPaused(true)}
                    className="flex gap-3 overflow-x-auto pb-3 px-6"
                    style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>
                    {TESTIS.map(t => (
                      <div key={t.name} style={{ width: '88%', flexShrink: 0, scrollSnapAlign: 'start' }}>
                        <Card {...t} />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-center mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Deslizá para ver más →</p>
                </div>
                {/* Desktop: 3 cols */}
                <div className="hidden md:grid md:grid-cols-3 gap-5" data-reveal data-delay="1">
                  {TESTIS.map(t => <Card key={t.name} {...t} />)}
                </div>
              </>
            );
          })()}
        </div>
      </section>

      {/* ── PRECIOS ── */}
      <section className="py-20 md:py-28 px-6" style={{ backgroundColor: '#EEF5FA' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12" data-reveal>
            <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold"
              style={{ backgroundColor: C.green }}>Solo por invierno</p>
            <h2 className="text-2xl md:text-3xl serif-title mb-3 font-bold uppercase tracking-wide" style={{ color: C.green }}>
              No vendemos alojamiento.<br />Compartimos experiencias y mucho más.
            </h2>
            <p className="text-base max-w-xl mx-auto mb-4" style={{ color: C.muted }}>
              Sabemos que te merecés tomarte un descanso de verdad. Nos jugamos en darte los mejores precios y experiencias de la montaña. Vos solo tenés que animarte a venir.
            </p>
            <p className="text-sm max-w-lg mx-auto mb-4" style={{ color: C.muted }}>
              Pensión completa desde $50.000/noche en habitaciones y domos compartidos (hasta 7 pers.) · domo privado desde $150.000/noche · baños fuera del domo.
            </p>
            <p className="text-sm font-bold flex items-center justify-center gap-1.5 mb-4" style={{ color: '#8B6A00' }}>
              <TrendingDown size={16} /> Cuantas más noches te quedás, más barata sale cada una
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(170,62,17,0.1)', color: C.fire }}>
              <span className="w-2 h-2 rounded-full animate-pulse inline-block" style={{ backgroundColor: C.fire }} />
              ⚡ Precios especiales de invierno · vigentes en julio · pueden subir en agosto
            </div>
          </div>

          {/* Incluye */}
          <div className="mb-12 rounded-2xl p-8 md:p-10 border" data-reveal style={{ borderColor: 'rgba(0,83,51,0.1)', backgroundColor: 'white' }}>
            <p className="text-[10px] tracking-widest uppercase font-semibold mb-6 text-center" style={{ color: C.green }}>Todo esto incluye tu estadía</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { Icon: Utensils,   label: 'Pensión completa · 3 comidas por día' },
                { Icon: Smartphone, label: 'Reset Vital para emprendedores (app)' },
                { Icon: Wifi,       label: 'WiFi Starlink · Coworking · Coliving' },
                { Icon: Snowflake,  label: 'Kit de invierno · Ropa blanca y toallón' },
                { Icon: Flame,      label: 'Fogones diarios · Cronograma de actividades' },
                { Icon: Droplets,   label: 'Agua caliente 24 hs · Espacios calefaccionados' },
              ].map(({ Icon, label }) => (
                <div key={label} className="text-center">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'rgba(0,83,51,0.08)' }}>
                    <Icon size={18} color={C.green} />
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: C.muted }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: carrusel precios */}
          <div className="md:hidden -mx-6" data-reveal data-delay="1">
            <div ref={preciosRef} onTouchStart={() => setPreciosPaused(true)}
              className="flex gap-3 overflow-x-auto pb-3 px-6"
              style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>
              {PRECIOS.map(({ noches, efectivo, oldEfectivo, porNoche, oldPorNoche, listaTotal, cuotas, ahorroEfectivo, ahorroNoches }, idx) => {
                const isBest = idx === PRECIOS.length - 1;
                return (
                  <div key={noches} className="flex-shrink-0 rounded-2xl p-7 border text-left relative"
                    style={{ width: '82%', scrollSnapAlign: 'start', ...(isBest ? { borderColor: 'rgba(0,83,51,0.35)', backgroundColor: 'rgba(0,83,51,0.05)' } : { borderColor: '#E5DDD5', backgroundColor: 'white' }) }}>
                    {isBest && <span className="absolute top-4 right-4 text-[9px] tracking-widest uppercase font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: C.green, color: C.gold }}>Mejor precio</span>}
                    <p className="text-[10px] tracking-widest uppercase font-semibold mb-3" style={{ color: isBest ? C.green : '#A0866E' }}>{noches}</p>
                    <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: C.faint }}>En cuotas</p>
                    <p className="text-[11px] font-semibold mb-1 inline-block px-2.5 py-1 rounded-full" style={isBest ? { backgroundColor: C.gold, color: C.green } : { backgroundColor: 'rgba(212,175,55,0.18)', color: '#8B6A00' }}>{cuotas}</p>
                    <p className="text-[10px] mb-4 font-semibold" style={{ color: C.muted }}>Total en cuotas: {listaTotal}</p>
                    <div className="pt-4 border-t" style={{ borderColor: 'rgba(0,83,51,0.1)' }}>
                      <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: C.green }}>Efectivo · 1 solo pago</p>
                      <p className="text-xs line-through mb-0.5" style={{ color: C.faint }}>Antes {oldEfectivo}</p>
                      <div className="flex items-baseline gap-2 mb-1">
                        <p className="text-3xl font-bold serif-title" style={{ color: isBest ? C.green : C.dark }}>{efectivo}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(170,62,17,0.12)', color: C.fire }}>🌨 invierno</span>
                      </div>
                      <p className="text-xs mb-0.5" style={{ color: C.muted }}>{porNoche}</p>
                      <p className="text-[10px] mb-3 line-through" style={{ color: C.faint }}>{oldPorNoche}</p>
                      <p className="text-[11px] font-semibold inline-flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(0,83,51,0.08)', color: isBest ? C.green : '#8B6A00' }}>
                        <TrendingDown size={12} /> {ahorroEfectivo}
                      </p>
                      {ahorroNoches && <p className="text-[10px] mt-2" style={{ color: C.faint }}>{ahorroNoches}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-center mt-1" style={{ color: C.faint }}>Deslizá para comparar precios →</p>
          </div>

          {/* Desktop: 3 cols */}
          <div className="hidden md:grid md:grid-cols-3 gap-5" data-reveal data-delay="1">
            {PRECIOS.map(({ noches, efectivo, oldEfectivo, porNoche, oldPorNoche, listaTotal, cuotas, ahorroEfectivo, ahorroNoches }, idx) => {
              const isBest = idx === PRECIOS.length - 1;
              return (
                <div key={noches} className="rounded-2xl p-7 border text-left relative"
                  style={isBest ? { borderColor: 'rgba(0,83,51,0.35)', backgroundColor: 'rgba(0,83,51,0.05)' } : { borderColor: '#E5DDD5', backgroundColor: 'white' }}>
                  {isBest && <span className="absolute top-4 right-4 text-[9px] tracking-widest uppercase font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: C.green, color: C.gold }}>Mejor precio</span>}
                  <p className="text-[10px] tracking-widest uppercase font-semibold mb-3" style={{ color: isBest ? C.green : '#A0866E' }}>{noches}</p>
                  <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: C.faint }}>En cuotas</p>
                  <p className="text-[11px] font-semibold mb-1 inline-block px-2.5 py-1 rounded-full" style={isBest ? { backgroundColor: C.gold, color: C.green } : { backgroundColor: 'rgba(212,175,55,0.18)', color: '#8B6A00' }}>{cuotas}</p>
                  <p className="text-[10px] mb-4 font-semibold" style={{ color: C.muted }}>Total en cuotas: {listaTotal}</p>
                  <div className="pt-4 border-t" style={{ borderColor: 'rgba(0,83,51,0.1)' }}>
                    <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: C.green }}>Efectivo · 1 solo pago</p>
                    <p className="text-xs line-through mb-0.5" style={{ color: C.faint }}>Antes {oldEfectivo}</p>
                    <div className="flex items-baseline gap-2 mb-1">
                      <p className="text-3xl font-bold serif-title" style={{ color: isBest ? C.green : C.dark }}>{efectivo}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(170,62,17,0.12)', color: C.fire }}>🌨 invierno</span>
                    </div>
                    <p className="text-xs mb-0.5" style={{ color: C.muted }}>{porNoche}</p>
                    <p className="text-[10px] mb-3 line-through" style={{ color: C.faint }}>{oldPorNoche}</p>
                    <p className="text-[11px] font-semibold inline-flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(0,83,51,0.08)', color: isBest ? C.green : '#8B6A00' }}>
                      <TrendingDown size={12} /> {ahorroEfectivo}
                    </p>
                    {ahorroNoches && <p className="text-[10px] mt-2" style={{ color: C.faint }}>{ahorroNoches}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs mt-4" style={{ color: C.faint }}>
            Efectivo / transferencia en 1 pago: precio con 20% de descuento. En cuotas: precio lista sin recargo financiero.
          </p>

          {/* Tarifa niños */}
          <div className="mt-6 max-w-sm mx-auto rounded-2xl px-6 py-5 border" style={{ borderColor: 'rgba(0,83,51,0.12)', backgroundColor: 'rgba(0,83,51,0.02)' }}>
            <p className="text-[10px] tracking-widest uppercase font-bold mb-3 text-center" style={{ color: C.green }}>Tarifa para niños</p>
            <ul className="space-y-1.5">
              {[
                { rango: '0 a 3 años', desc: 'Sin cargo', note: 'si no ocupan cama' },
                { rango: '0 a 3 años', desc: 'Tarifa completa', note: 'si ocupan cama' },
                { rango: '4 años o más', desc: 'Tarifa completa' },
              ].map(({ rango, desc, note }) => (
                <li key={rango} className="flex items-center justify-between text-xs">
                  <span style={{ color: C.muted }}>{rango}</span>
                  <span className="flex items-center gap-1">
                    <span className="font-semibold" style={{ color: C.dark }}>{desc}</span>
                    {note && <span style={{ color: C.faint }}>· {note}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Horarios y Pensión Completa de Montaña */}
          <div className="mt-8 max-w-2xl mx-auto rounded-2xl border p-6 md:p-8" style={{ borderColor: 'rgba(0,83,51,0.12)', backgroundColor: 'white' }} data-reveal data-delay="2">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(0,83,51,0.06)' }}>
                <Clock size={18} color={C.gold} />
              </div>
              <div>
                <p className="font-bold text-base" style={{ color: C.green }}>Horarios y Pensión Completa de Montaña</p>
                <p className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mt-1" style={{ backgroundColor: 'rgba(212,175,55,0.15)', color: '#8B6A00' }}>
                  ⚡ Válido para estadías hasta el 21 de septiembre de 2026
                </p>
              </div>
            </div>

            <p className="text-sm mb-4" style={{ color: C.muted }}>
              <strong style={{ color: C.dark }}>Tarifa: $50.000 por persona / noche</strong> en habitación o domo compartido — incluye alojamiento, almuerzo, cena y desayuno. Domo privado (1 o 2 personas): $150.000/noche.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl px-4 py-3 text-center" style={{ backgroundColor: 'rgba(0,83,51,0.03)' }}>
                <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: C.faint }}>Check-In</p>
                <p className="text-lg serif-title" style={{ color: C.green }}>13:00 hs</p>
              </div>
              <div className="rounded-xl px-4 py-3 text-center" style={{ backgroundColor: 'rgba(0,83,51,0.03)' }}>
                <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: C.faint }}>Check-Out</p>
                <p className="text-lg serif-title" style={{ color: C.green }}>11:00 hs</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="font-semibold text-sm mb-2" style={{ color: C.dark }}>Circuito de comidas por noche contratada</p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2 text-sm" style={{ color: C.muted }}>
                  <CheckCircle2 size={15} color={C.gold} className="flex-shrink-0 mt-0.5" />
                  <span><strong style={{ color: C.dark }}>Día de ingreso:</strong> incluye el almuerzo de bienvenida y la cena.</span>
                </li>
                <li className="flex items-start gap-2 text-sm" style={{ color: C.muted }}>
                  <CheckCircle2 size={15} color={C.gold} className="flex-shrink-0 mt-0.5" />
                  <span><strong style={{ color: C.dark }}>Día de salida:</strong> incluye el desayuno de la mañana.</span>
                </li>
              </ul>
            </div>

            <div className="mb-4">
              <p className="font-semibold text-sm mb-2" style={{ color: C.dark }}>Horarios del servicio de comidas</p>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="rounded-lg px-2 py-2 text-center" style={{ backgroundColor: 'rgba(0,83,51,0.03)' }}>
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: C.faint }}>Desayuno</p>
                  <p className="text-sm font-semibold" style={{ color: C.green }}>09:00–10:00</p>
                </div>
                <div className="rounded-lg px-2 py-2 text-center" style={{ backgroundColor: 'rgba(0,83,51,0.03)' }}>
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: C.faint }}>Almuerzo</p>
                  <p className="text-sm font-semibold" style={{ color: C.green }}>14:00–15:00</p>
                </div>
                <div className="rounded-lg px-2 py-2 text-center" style={{ backgroundColor: 'rgba(0,83,51,0.03)' }}>
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: C.faint }}>Cena</p>
                  <p className="text-sm font-semibold" style={{ color: C.green }}>20:00–21:00</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: C.faint }}>
                Fuera de estos horarios no se presta servicio de cocina. Si llegás a partir de las 19:00 hs, contás con la cena en su horario habitual; las comidas no consumidas por llegadas tardías sin aviso no son acumulables ni reembolsables.
              </p>
            </div>

            <div className="rounded-xl px-5 py-4" style={{ backgroundColor: 'rgba(0,83,51,0.04)' }}>
              <p className="font-semibold text-sm mb-2" style={{ color: C.dark }}>Uso extendido del predio (flexibilidad)</p>
              <p className="text-sm leading-relaxed mb-2" style={{ color: C.muted }}>
                Podés llegar antes de las 13:00 hs o quedarte después de las 11:00 hs disfrutando del río y las 200 hectáreas del predio, sin problema.
              </p>
              <p className="text-xs leading-relaxed mb-2" style={{ color: C.faint }}>
                Durante ese lapso no vas a contar con la habitación/domo, ya que va a estar en proceso de limpieza y orden para los próximos ingresos.
              </p>
              <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
                Si querés almorzar en el refugio el día de tu check-out, se ofrece el almuerzo como consumo extra.
              </p>
            </div>

            <div className="rounded-xl px-5 py-4 mt-3" style={{ backgroundColor: 'rgba(212,175,55,0.08)' }}>
              <p className="font-semibold text-sm mb-1" style={{ color: C.dark }}>Saldo y cambios de fecha</p>
              <p className="text-xs leading-relaxed" style={{ color: C.muted }}>
                Si reservaste con seña, el saldo pendiente se cancela hasta el check-out. Reprogramaciones de fecha o ajustes de comidas: mínimo 24 hs de anticipación. Política completa de cancelación en{' '}
                <a href="/terminos-y-condiciones/" style={{ color: C.green, textDecoration: 'underline' }}>Términos y Condiciones</a>.
              </p>
            </div>

            <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(0,83,51,0.1)' }}>
              <p className="font-semibold text-sm mb-3" style={{ color: C.dark }}>Infraestructura y servicios incluidos</p>
              <ul className="grid sm:grid-cols-2 gap-2.5">
                <li className="flex items-start gap-2 text-sm" style={{ color: C.muted }}>
                  <CheckCircle2 size={15} color={C.gold} className="flex-shrink-0 mt-0.5" />
                  <span>Uso libre de las <strong style={{ color: C.dark }}>200 hectáreas</strong> de reserva natural</span>
                </li>
                <li className="flex items-start gap-2 text-sm" style={{ color: C.muted }}>
                  <CheckCircle2 size={15} color={C.gold} className="flex-shrink-0 mt-0.5" />
                  <span>Calefacción en todos los espacios y agua caliente las 24 hs</span>
                </li>
                <li className="flex items-start gap-2 text-sm" style={{ color: C.muted }}>
                  <CheckCircle2 size={15} color={C.gold} className="flex-shrink-0 mt-0.5" />
                  <span>WiFi Starlink disponible para trabajo remoto</span>
                </li>
                <li className="flex items-start gap-2 text-sm" style={{ color: C.muted }}>
                  <CheckCircle2 size={15} color={C.gold} className="flex-shrink-0 mt-0.5" />
                  <span>Guía <strong style={{ color: C.dark }}>Reset Vital en PDF</strong> de regalo, incluida en toda estadía</span>
                </li>
                <li className="flex items-start gap-2 text-sm" style={{ color: C.muted }}>
                  <CheckCircle2 size={15} color={C.gold} className="flex-shrink-0 mt-0.5" />
                  <span><strong style={{ color: C.dark }}>Capacidad:</strong> refugio para 15 personas + 2 domos geodésicos de 7 personas c/u (14 en total), adaptables a domo privado para 1 persona, pareja o grupo</span>
                </li>
                <li className="flex items-start gap-2 text-sm" style={{ color: C.muted }}>
                  <CheckCircle2 size={15} color={C.gold} className="flex-shrink-0 mt-0.5" />
                  <span><strong style={{ color: C.dark }}>Baños:</strong> 1 baño y ducha dentro del refugio, 4 baños secos y 2 duchas cerca del refugio, y 8 baños y 8 duchas cerca de los domos</span>
                </li>
              </ul>
              <p className="text-sm leading-relaxed mt-3" style={{ color: C.muted }}>
                <strong style={{ color: C.dark }}>Grupos:</strong> domo de uso exclusivo desde 4 personas, y para grupos más grandes podríamos ofrecer una o más habitaciones privadas dentro del refugio, solo para ustedes — consultanos la disponibilidad por WhatsApp. Ideal para familias, amigos o instituciones que viajan juntas.
              </p>
              <p className="text-xs leading-relaxed mt-2" style={{ color: C.faint }}>
                Actividades y traslados a consultar: temazcal ceremonial, cabalgatas, traslado desde Córdoba / Villa Carlos Paz.
              </p>
            </div>
          </div>

          {/* ── Planes especiales ── */}
          <div className="mt-12" data-reveal data-delay="2">
            <p className="text-center text-[10px] tracking-widest uppercase font-bold mb-6" style={{ color: C.muted }}>Planes especiales · invierno 2026</p>
            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {/* Membresía */}
              <div className="rounded-2xl p-6 border flex flex-col gap-4" style={{ borderColor: 'rgba(0,83,51,0.15)', backgroundColor: 'rgba(0,83,51,0.03)' }}>
                <div>
                  <p className="text-[10px] tracking-widest uppercase font-bold mb-1" style={{ color: C.green }}>Membresía de invierno</p>
                  <p className="text-sm font-semibold" style={{ color: C.dark }}>Para emprendedores &amp; nómadas digitales</p>
                </div>
                <ul className="space-y-1.5 flex-1">
                  {[
                    'Precio especial por todo el invierno',
                    'Prioridad en actividades y espacios',
                    'Comunidad activa de fundadores',
                    'Flexibilidad de fechas dentro del período',
                  ].map(b => (
                    <li key={b} className="flex items-start gap-2 text-xs" style={{ color: C.muted }}>
                      <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: 'rgba(0,83,51,0.1)', color: C.green }}>✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
                <a
                  href={`https://wa.me/${WA_MAGICO}?text=${encodeURIComponent('¡Hola! Me interesa la membresía de invierno para emprendedores. ¿Cómo funciona?')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs font-semibold text-center py-3 px-4 rounded-xl transition-colors"
                  style={{ backgroundColor: C.green, color: 'white' }}
                >
                  Consultar membresía →
                </a>
              </div>

              {/* Equipos */}
              <div className="rounded-2xl p-6 border flex flex-col gap-4" style={{ borderColor: 'rgba(212,175,55,0.25)', backgroundColor: 'rgba(212,175,55,0.04)' }}>
                <div>
                  <p className="text-[10px] tracking-widest uppercase font-bold mb-1" style={{ color: '#8B6A00' }}>Descuento para equipos</p>
                  <p className="text-sm font-semibold" style={{ color: C.dark }}>Para dueños de negocio que vienen con su equipo</p>
                </div>
                <ul className="space-y-1.5 flex-1">
                  {[
                    'Descuento grupal desde 2 personas',
                    'Coordinamos el calendario juntos',
                    'Domo exclusivo para el equipo (a partir de 7 personas)',
                    'Actividades y experiencias en conjunto',
                  ].map(b => (
                    <li key={b} className="flex items-start gap-2 text-xs" style={{ color: C.muted }}>
                      <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: 'rgba(212,175,55,0.15)', color: '#8B6A00' }}>✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
                <a
                  href={`https://wa.me/${WA_MAGICO}?text=${encodeURIComponent('¡Hola! Quiero venir con mi equipo al Winter Redirection. ¿Cómo funciona el descuento grupal?')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs font-semibold text-center py-3 px-4 rounded-xl transition-colors"
                  style={{ backgroundColor: C.gold, color: 'white' }}
                >
                  Consultar descuento grupal →
                </a>
              </div>
            </div>
          </div>

          <div className="text-center mt-10" data-reveal data-delay="3">
            <a href={WA_RESERVA} target="_blank" rel="noopener noreferrer" className="btn-gold text-sm py-4 px-8 inline-block">
              Reservar mi lugar
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 md:py-28 px-6" style={{ backgroundColor: '#EEF5FA' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12" data-reveal>
            <h2 className="text-3xl md:text-4xl serif-title mb-3" style={{ color: C.dark }}>Preguntas frecuentes</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map(({ q, a }, idx) => {
              const Icon = FAQ_ICONS[idx % FAQ_ICONS.length];
              const open = activeFaq === idx;
              return (
                <div key={idx} className="rounded-2xl border overflow-hidden" style={{ borderColor: open ? 'rgba(0,83,51,0.2)' : '#E5DDD5', backgroundColor: open ? 'rgba(0,83,51,0.02)' : 'white' }}>
                  <button
                    className="w-full flex items-center gap-4 px-6 py-5 text-left"
                    onClick={() => setActiveFaq(open ? null : idx)}
                  >
                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: open ? 'rgba(0,83,51,0.1)' : 'rgba(0,83,51,0.05)' }}>
                      <Icon size={14} color={C.green} />
                    </div>
                    <span className="flex-1 text-sm font-semibold text-left" style={{ color: C.dark }}>{q}</span>
                    <div className={`flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke={C.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </button>
                  {open && (
                    <div className="px-6 pb-5 pl-18">
                      <p className="text-sm leading-relaxed pl-12" style={{ color: C.muted }}>{a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FILOSOFÍA INVIERNO ── */}
      <section className="py-24 md:py-36 px-6 relative overflow-hidden"
        style={{ backgroundImage: `url('/uploads/Invierno/20250627_222558.webp')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0" style={{ background: 'rgba(4,10,20,0.78)' }} />
        <div className="max-w-3xl mx-auto text-center relative z-10" data-reveal>
          <p className="text-lg md:text-xl font-light leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
            El invierno, aunque no parezca, sí es para vos.
          </p>
          <p className="text-3xl md:text-5xl serif-title text-white leading-snug mb-8">
            Perderte es igual de importante<br />que encontrarte.
          </p>
          <p className="text-base md:text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
            Viniste a reorientar tu rumbo.<br />La montaña vino a ayudarte.
          </p>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-28 md:py-36 px-6 relative overflow-hidden"
        style={{ backgroundImage: `url('/uploads/Invierno/20250628_181834.webp')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,83,51,0.92) 0%, rgba(0,83,51,0.85) 100%)' }} />
        <div className="max-w-3xl mx-auto relative z-10 text-center" data-reveal>
          <p className="text-[10px] tracking-[0.4em] uppercase font-semibold mb-5" style={{ color: C.gold }}>
            El próximo paso es tuyo
          </p>
          <h2 className="text-4xl md:text-6xl serif-title text-white leading-tight mb-6">
            Julio es ahora.<br />
            <span style={{ color: C.gold }}>¿Te sumás?</span>
          </h2>
          <p className="text-white/70 text-base md:text-lg leading-relaxed max-w-xl mx-auto mb-10">
            El momento de claridad que necesitás para el próximo ciclo de tu negocio no va a aparecer en tu agenda habitual. Aparece cuando salís del ruido.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={WA_RESERVA} target="_blank" rel="noopener noreferrer" className="btn-gold text-sm py-4 px-10 inline-block">
              Reservar mi lugar
            </a>
            <a href={WA_INFO} target="_blank" rel="noopener noreferrer"
              className="inline-block border border-white/30 text-white text-sm font-semibold px-10 py-4 rounded-full hover:bg-white/10 transition-colors">
              Tengo preguntas
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default WinterRedirection;
