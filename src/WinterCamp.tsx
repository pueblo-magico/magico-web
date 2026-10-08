import React, { useState, useEffect, useRef } from 'react';
import {
  Flame, Snowflake, Users, Heart, Star, Compass, ChevronDown, ChevronLeft, ChevronRight, Instagram, Linkedin, Clock, CheckCircle2,
  Mountain, Briefcase, Network, Home, Wifi, Droplet, Sparkles,
  Footprints, PawPrint, TrendingDown, CalendarDays, Utensils, Smartphone,
  type LucideIcon,
} from 'lucide-react';
import { img } from './lib/img';
import { WA_MAGICO } from './data/config';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

const WA_INFO    = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent('¡Hola! Me interesa el Winter Camp - Vacaciones de Invierno en Pueblo Mágico. ¿Me pueden dar más info?')}`;
const WA_RESERVA = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent('¡Hola! Quiero reservar mi lugar para el Winter Camp en Pueblo Mágico. ¿Cómo procedo?')}`;

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

// ─── Precios ────────────────────────────────────────────────────────────────────
// Efectivo = precio real. Cuotas = efectivo × 1.2 (precio lista).
// Comunicación: "pagás menos en efectivo" no "cuotas cuestan más".
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

// ─── Equipo ─────────────────────────────────────────────────────────────────────
type TeamMember = { photo: string; nombre: string; rol: string; desc: string; instagram?: string; linkedin?: string; tags?: string[] };

const TEAM: TeamMember[] = [
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
    rol: 'Mentora de emprendedores/as & profesionales',
    desc: 'Coach Integral & Mentora de Marcas Personales. Creadora de la Comunidad Mujeres Amatistas. Instructora de Yoga, meditación y pranayamas.',
    instagram: 'https://www.instagram.com/mujeramatistaa/',
    tags: ['KINTU', 'PUEBLO MÁGICO'],
  },
  {
    photo: '/uploads/tomas-fossatti.jpg',
    nombre: 'Tomás Fossatti',
    rol: 'Host de emprendedores/as',
    desc: 'Ingeniero en innovación y desarrollo, emprendedor y speaker de TEDx. Product Engineer R&D y AI builder. Construye sistemas agénticos recursivos en la intersección de la tecnología y el propósito.',
    instagram: 'https://www.instagram.com/tomasfossatti_/',
    linkedin: 'https://www.linkedin.com/in/tomas-fossatti-ing',
    tags: ['KINTU', 'PUEBLO MÁGICO'],
  },
  {
    photo: '/uploads/nicole-rosignoli.webp',
    nombre: 'Nicole Rosignoli Miranda',
    rol: 'Psicología · Gestalt · Salud Cíclica',
    desc: 'Licenciada en Psicología (UNC). Acompaña desde el enfoque gestáltico y la salud cíclica, integrando plantas medicinales, movimiento corporal y círculos de mujeres.',
    instagram: 'https://www.instagram.com/thematriiz/',
    tags: ['PUEBLO MÁGICO'],
  },
  {
    photo: '/uploads/tomas-bergallo.jpg',
    nombre: 'Tomás Bergallo',
    rol: 'Consciencia corporal & masajes',
    desc: 'Creador de espacios de bienestar. Acompaña procesos de relajación y reconexión a través del contacto, la risa y el abrazo.',
    instagram: 'https://www.instagram.com/tomas.bergallo/',
    tags: ['ESPECIALISTA'],
  },
  {
    photo: '/uploads/santiago-alzogaray.png',
    nombre: 'Santiago Alzogaray',
    rol: 'Ceremonia de Temazcal',
    desc: 'Conducción del ritual de purificación, uno de los momentos centrales del Winter Camp.',
    tags: ['ESPECIALISTA'],
  },
  {
    photo: '/uploads/Walter_E._Cejas.jpg',
    nombre: 'Walter Eugenio Cejas',
    rol: 'Biólogo · Investigador · Vida Silvestre',
    desc: 'Puente entre el conocimiento científico y la experiencia directa de la Sierra de Achala. Guía avistaje de aves, flora y fauna en la montaña.',
    tags: ['ESPECIALISTA'],
  },
  {
    photo: '/uploads/Diego_perfil.png',
    nombre: 'Diego Epelman Hodara',
    rol: 'Fundador de Pueblo Mágico',
    desc: 'Emprendedor, Facilitador & Guía de Dinámicas de Alto Impacto. Sostén energético del Winter Camp desde los fogones, los círculos y la presencia.',
    instagram: 'https://www.instagram.com/diegoepel/',
    tags: ['KINTU', 'PUEBLO MÁGICO'],
  },
  {
    photo: '/uploads/china.jpeg',
    nombre: 'China Dericia',
    rol: 'Anfitriona del Pueblo',
    desc: 'Profe de Yoga & Facilitadora de Movimiento Consciente. Consciencia corporal, meditaciones y canto — guía el cuerpo y la energía del grupo.',
    instagram: 'https://www.instagram.com/bambu.alquimia.terapeutica/',
    tags: ['PUEBLO MÁGICO'],
  },
];

// ─── FAQ ───────────────────────────────────────────────────────────────────────
const FAQ_ICONS: LucideIcon[] = [Snowflake, Star, Users, Heart, Flame, Compass, Home, Network];

const FAQS = [
  {
    q: '¿Puedo elegir cualquier día para llegar?',
    a: 'Sí, es estadía libre durante julio, agosto o septiembre 2026: llegás y te vas el día que quieras. Durante tu estadía vas a encontrar un cronograma de actividades sucediendo, al que te podés sumar cuando quieras.',
  },
  {
    q: '¿El trekking con guías o las cabalgatas están incluidos?',
    a: 'No, son actividades extra con costo aparte. Consultanos por WhatsApp — si no tenemos disponible para tu fecha, casi siempre conseguimos.',
  },
  {
    q: '¿Hay actividades para chicos?',
    a: 'Sí. Hay juegos y espacios pensados especialmente para infancias, además de las dinámicas compartidas en familia.',
  },
  {
    q: '¿Tengo que participar de todas las actividades?',
    a: 'No. El cronograma es para sumarte cuando quieras — vos elegís tu ritmo y tus dinámicas, sin exigencias.',
  },
  {
    q: '¿Hay descuentos para grupos?',
    a: 'Sí, consultanos por WhatsApp por promociones y descuentos para grupos y estadías de varias noches.',
  },
  {
    q: '¿Cómo llego al lugar?',
    a: 'Pueblo Mágico queda en Los Gigantes, Córdoba — a 90 km de Córdoba Capital. Acceso para todo tipo de vehículos. Escribinos y te mandamos el mapa.',
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

// ─── Carrusel de fotos de invierno ─────────────────────────────────────────────
const CAROUSEL = [
  { src: '/uploads/Invierno/DJI_20250629135712_0164_D_CHAPA2025.webp', caption: 'Vista aérea del complejo nevado' },
  { src: '/uploads/yoga_salon.webp',                                    caption: 'El salón · Yoga, movimiento y dinámicas' },
  { src: '/uploads/Invierno/20250629_132707.webp',                       caption: 'Refugio de piedra bajo la nieve' },
  { src: '/uploads/coworking.webp',                                     caption: 'Espacio de coworking · WiFi Starlink' },
  { src: '/uploads/Invierno/20250629_135046.webp',                       caption: 'Ventanal con vistas a la sierra' },
  { src: '/uploads/habitaciones.webp',                                  caption: 'Habitaciones · Ropa blanca y toallón incluidos' },
  { src: '/uploads/Invierno/20250629_152354.webp',                       caption: 'Camino rural hacia el horizonte helado' },
  { src: '/uploads/domos.webp',                                         caption: 'Domos geodésicos · Glamping de montaña' },
  { src: '/uploads/Invierno/20250629_164200.webp',                       caption: 'Pino solitario bajo la cencellada' },
  { src: '/uploads/mesadas.webp',                                       caption: 'La cocina · Pensión completa con 3 comidas' },
  { src: '/uploads/Invierno/20250628_181834.webp',                       caption: 'Ocaso tras la pirca de piedra' },
  { src: '/uploads/botica.webp',                                        caption: 'La botica · Plantas y remedios de la sierra' },
  { src: '/uploads/Invierno/DJI_20250629140041_0171_D_CHAPA2025.webp',  caption: 'Los tres domos geodésicos nevados' },
  { src: '/uploads/Invierno/20250627_222558.webp',                       caption: 'Lluvia de estrellas en la montaña' },
];

// ─── Testimonios ───────────────────────────────────────────────────────────────
const TESTIMONIOS = [
  { text: 'Fue el mejor fin de semana que pasamos juntos como familia en mucho tiempo. Mis hijos no querían volver a casa. Yo tampoco.', name: 'Tefi', rol: 'Mamá · Familia completa' },
  { text: 'La conexión que logramos entre nosotros fue increíble. Volvimos diferentes. La montaña nos regaló presencia de verdad.', name: 'Lucas y Sofi', rol: 'Pareja' },
  { text: 'Lo más importante: el amor y la entrega de todo el equipo, y la capacidad de sentirte uno con la naturaleza. Una experiencia que no se olvida.', name: 'Julieta C.', rol: 'Huéspeda' },
];

// ─── Fotos El Lugar ─────────────────────────────────────────────────────────────
const LUGAR_PHOTOS = [
  { src: '/uploads/yoga_salon.webp',                                    label: 'El Salón · Yoga y dinámicas',       desc: 'Yoga · círculos · dinámicas' },
  { src: '/uploads/coworking.webp',                                     label: 'Coworking · WiFi Starlink',         desc: 'WiFi Starlink · mesas de trabajo' },
  { src: '/uploads/habitaciones.webp',                                  label: 'Habitaciones · Ropa blanca',        desc: 'Ropa blanca · toallón' },
  { src: '/uploads/Invierno/DJI_20250629140041_0171_D_CHAPA2025.webp', label: 'Domos Geodésicos · Glamping nevado', desc: 'Glamping nevado' },
  { src: '/uploads/mesadas.webp',                                       label: 'Cocina común',                      desc: 'Hornallas y comedor' },
  { src: '/uploads/botica.webp',                                        label: 'La Botica · Plantas medicinales',   desc: 'Plantas medicinales' },
];

// ─── Page ──────────────────────────────────────────────────────────────────────
const WinterCamp: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [lugarIdx, setLugarIdx] = useState(0);
  const [testiIdx, setTestiIdx] = useState(0);
  const [testiPaused, setTestiPaused] = useState(false);

  const paraQuienRef = useRef<HTMLDivElement>(null);
  const expRef = useRef<HTMLDivElement>(null);
  const preciosRef = useRef<HTMLDivElement>(null);
  const [paraQuienPaused, setParaQuienPaused] = useState(false);
  const [expPaused, setExpPaused] = useState(false);
  const [preciosPaused, setPreciosPaused] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setCarouselIdx(i => (i + 1) % CAROUSEL.length), 4500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (testiPaused) return;
    const t = setInterval(() => setTestiIdx(i => (i + 1) % TESTIMONIOS.length), 3500);
    return () => clearInterval(t);
  }, [testiPaused]);

  const advanceSnap = (ref: React.RefObject<HTMLDivElement | null>, paused: boolean, ms: number) => {
    if (paused) return;
    const el = ref.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    if (!first) return;
    const slideW = first.offsetWidth + 12;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const nextLeft = el.scrollLeft + slideW > maxScroll + 1 ? 0 : el.scrollLeft + slideW;
    el.scrollTo({ left: nextLeft, behavior: 'smooth' });
  };

  useEffect(() => {
    const t = setInterval(() => advanceSnap(paraQuienRef, paraQuienPaused, 3800), 3800);
    return () => clearInterval(t);
  }, [paraQuienPaused]);

  useEffect(() => {
    const t = setInterval(() => advanceSnap(expRef, expPaused, 4000), 4000);
    return () => clearInterval(t);
  }, [expPaused]);

  useEffect(() => {
    const t = setInterval(() => advanceSnap(preciosRef, preciosPaused, 4200), 4200);
    return () => clearInterval(t);
  }, [preciosPaused]);

  useEffect(() => {
    document.title = 'Winter Camp · Vacaciones de Invierno en Pueblo Mágico · Pueblo Mágico';
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
        {/* Video fondo desktop (16:9) */}
        <div className="hidden md:block absolute inset-0 pointer-events-none overflow-hidden">
          <iframe
            src="https://www.youtube.com/embed/ktzVcAs-74c?autoplay=1&mute=1&loop=1&playlist=ktzVcAs-74c&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1"
            allow="autoplay; encrypted-media"
            title="Winter Camp"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              border: 'none',
              width: 'max(100vw, 177.78vh)',
              height: 'max(56.25vw, 100vh)',
            }}
          />
        </div>
        {/* Video fondo mobile (Shorts 9:16) */}
        <div className="block md:hidden absolute inset-0 pointer-events-none overflow-hidden">
          <iframe
            src="https://www.youtube.com/embed/QPNxc5Nh8es?autoplay=1&mute=1&loop=1&playlist=QPNxc5Nh8es&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1"
            allow="autoplay; encrypted-media"
            title="Winter Camp Mobile"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              border: 'none',
              width: 'max(100vw, 56.25vh)',
              height: 'max(177.78vw, 100vh)',
            }}
          />
        </div>

        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(8,16,28,0.95) 0%, rgba(8,16,28,0.6) 45%, rgba(8,16,28,0.12) 100%)' }}
        />

        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 md:px-12 pt-28 md:pt-20 pb-10 md:pb-0 flex flex-col md:items-center md:text-center">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center md:justify-center gap-2 sm:gap-3 mb-4">
            <span className="inline-block max-w-full px-3 sm:px-4 py-1.5 rounded-full text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.4em] uppercase font-bold border border-white/20 text-white/70 whitespace-nowrap">
              Invierno 2026 · julio · agosto · septiembre
            </span>
            <span
              className="inline-block max-w-full px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] tracking-wide sm:tracking-widest uppercase font-bold whitespace-nowrap"
              style={{ backgroundColor: 'rgba(212,175,55,0.15)', color: '#F4C27A', border: '1px solid rgba(212,175,55,0.3)' }}
            >
              Estadía libre
            </span>
            <span
              className="inline-block max-w-full px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] tracking-wide sm:tracking-widest uppercase font-bold whitespace-nowrap"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              Familias · Emprendedores · Comunidad
            </span>
          </div>

          <p className="text-white/50 text-xs sm:text-sm tracking-[0.3em] uppercase mb-2 sm:mb-3 font-semibold">Vacaciones de Invierno</p>
          <h1 className="text-5xl md:text-7xl serif-title leading-none mb-6 text-white">
            Winter <span style={{ color: C.gold }}>Camp</span>
          </h1>
          <p className="text-white/80 text-base md:text-xl italic mb-4 md:mb-6 max-w-lg md:max-w-2xl leading-relaxed">
            Para los que esperaron todo el año que llegara el frío.<br />
            Y para los que lo están viviendo muy adentro.
          </p>
          <p className="text-white/45 text-xs sm:text-sm mb-6 md:mb-10 max-w-lg md:max-w-2xl leading-relaxed">
            Todo julio en la montaña. Llegás y te vas cuando quieras. Pensión completa desde $50.000/noche, en habitación o domo compartido.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <a
              href={WA_RESERVA}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold text-sm py-4 px-8 inline-block"
            >
              Quiero participar
            </a>
            <div className="flex items-center gap-2 text-white/50 text-xs">
              <Snowflake size={16} color={C.gold} />
              <span>El frío nos acerca, el fuego nos une</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── URGENCIA ── */}
      <div className="px-6 py-3 text-center" style={{ backgroundColor: '#AA3E11' }}>
        <p className="text-white text-xs sm:text-sm font-semibold leading-relaxed">
          JULIO ES AHORA · El campamento ya comenzó · Solo 20 personas al mismo tiempo en el espacio ·{' '}
          <a href={WA_RESERVA} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
            Consultá disponibilidad →
          </a>
        </p>
      </div>

      {/* ── EL LLAMADO ── */}
      <section className="py-20 md:py-28 px-6" style={{ backgroundColor: C.night }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12" data-reveal>
            <div className="flex justify-center gap-5 mb-10">
              <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(46,110,142,0.14)' }}>
                <Snowflake size={20} color={C.ice} />
              </div>
              <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(170,62,17,0.14)' }}>
                <Flame size={20} color={C.fire} />
              </div>
            </div>
            <p className="text-[10px] tracking-[0.4em] uppercase font-semibold mb-5" style={{ color: '#8B6A00' }}>
              El llamado
            </p>
            <blockquote className="text-2xl md:text-4xl serif-title leading-relaxed mb-4" style={{ color: C.dark }}>
              El invierno no es solamente una pausa.<br />
              <span style={{ color: '#8B6A00' }}>Es un portal hacia vos.</span>
            </blockquote>
            <p className="text-sm md:text-base leading-relaxed max-w-xl mx-auto" style={{ color: C.muted }}>
              La naturaleza se aquieta, el frío invita a ir hacia adentro y el fuego vuelve a reunirnos. Por eso abrimos las puertas de nuestro hogar.
            </p>
          </div>

          <div className="mt-12" data-reveal data-delay="1">
            <p className="text-center text-[10px] tracking-[0.4em] uppercase font-semibold mb-3" style={{ color: '#8B6A00' }}>
              Los guardianes del Pueblo
            </p>
            <p className="text-center text-sm leading-relaxed max-w-lg mx-auto mb-6" style={{ color: C.muted }}>
              Diego y China no son anfitriones de temporada. Viven acá, todo el año. Son los primeros habitantes permanentes de Pueblo Mágico.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {TEAM.filter(m => m.nombre === 'Diego Epelman Hodara' || m.nombre === 'China Dericia').map(({ photo, nombre, rol, desc, instagram }) => (
                <div key={nombre} className="flex items-start gap-4 rounded-2xl p-5 border" style={{ borderColor: 'rgba(46,110,142,0.2)', backgroundColor: 'rgba(255,255,255,0.72)' }}>
                  <img src={img(photo, 120)} alt={nombre} className="w-14 h-14 rounded-full object-cover flex-shrink-0" loading="lazy" />
                  <div>
                    <p className="font-bold text-sm mb-0.5" style={{ color: C.dark }}>{nombre}</p>
                    <p className="text-xs font-semibold mb-2" style={{ color: C.green }}>{rol}</p>
                    <p className="text-xs leading-relaxed mb-2" style={{ color: C.muted }}>{desc}</p>
                    {instagram && (
                      <a href={instagram} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium"
                        style={{ color: C.green }}>
                        <Instagram size={11} /> Instagram
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
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
              La montaña te espera<br />si te identificás con alguna de estas opciones
            </h2>
          </div>

          {/* Mobile: carrusel para quién es */}
          <div className="md:hidden -mx-6 mb-6" data-reveal data-delay="1">
            <div ref={paraQuienRef} onTouchStart={() => setParaQuienPaused(true)}
              className="flex gap-3 overflow-x-auto pb-3 px-6"
              style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>

              <div className="flex-shrink-0 rounded-2xl p-7 border" style={{ width: '82%', scrollSnapAlign: 'start', borderColor: 'rgba(0,83,51,0.15)', backgroundColor: 'rgba(0,83,51,0.03)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(0,83,51,0.1)' }}>
                  <Home size={18} color={C.green} />
                </div>
                <p className="font-bold text-base mb-3" style={{ color: C.green }}>Tenés familia</p>
                <ul className="space-y-1.5">
                  {['Niños que juegan en la montaña y aprenden', 'Tiempo real en familia, sin distracciones', 'Cocina casera incluida — sin organizar nada', 'Comunidad de familias que piensa igual que vos'].map(i => (
                    <li key={i} className="flex items-start gap-2 text-xs" style={{ color: C.muted }}>
                      <span className="mt-0.5 flex-shrink-0" style={{ color: C.green }}>✓</span>{i}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex-shrink-0 rounded-2xl p-7 border" style={{ width: '82%', scrollSnapAlign: 'start', borderColor: 'rgba(46,110,142,0.2)', backgroundColor: 'rgba(46,110,142,0.03)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(46,110,142,0.12)' }}>
                  <Heart size={18} color={C.ice} />
                </div>
                <p className="font-bold text-base mb-3" style={{ color: C.ice }}>Venís solo/a o en pareja</p>
                <ul className="space-y-1.5">
                  {['Tiempo para estar con vos, a tu ritmo — solo/a o juntos', 'Nuevas amistades y momentos de conexión real', 'Actividades para reír, relajar y explorar la montaña', 'Comida casera, rica y saludable en cada comida'].map(i => (
                    <li key={i} className="flex items-start gap-2 text-xs" style={{ color: C.muted }}>
                      <span className="mt-0.5 flex-shrink-0" style={{ color: C.ice }}>✓</span>{i}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex-shrink-0 rounded-2xl p-7 border" style={{ width: '82%', scrollSnapAlign: 'start', borderColor: 'rgba(212,175,55,0.25)', backgroundColor: 'rgba(212,175,55,0.04)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(212,175,55,0.15)' }}>
                  <Briefcase size={18} color="#8B6A00" />
                </div>
                <p className="font-bold text-base mb-3" style={{ color: '#7A5C00' }}>Sos emprendedor/a, artista o creativo/a</p>
                <ul className="space-y-1.5">
                  {[
                    'Silencio de montaña que trae claridad y revela oportunidades',
                    'Caminatas conscientes para oxigenar las ideas y alinearte con tu propósito',
                    'Starlink: el mejor internet disponible',
                    'Comida casera, rica y saludable para recargar energía',
                    'Mentoría en movimiento: Espacios orgánicos con el equipo del Pueblo Mágico o Kintu (Isvara, Luz, Tomi, Diego, China, Nicole) entre otros miembros según disponibilidad para desbloquear tus proyectos, ordenar tus ideas de negocio y pasar de la planificación a la acción real.',
                  ].map(i => (
                    <li key={i} className="flex items-start gap-2 text-xs" style={{ color: C.muted }}>
                      <span className="mt-0.5 flex-shrink-0" style={{ color: '#8B6A00' }}>✓</span>{i}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="text-[10px] text-center" style={{ color: C.faint }}>Deslizá para ver más →</p>
          </div>

          {/* Desktop: grid 2×2 */}
          <div className="hidden md:grid md:grid-cols-2 gap-5 mb-6" data-reveal data-delay="1">
            <div className="rounded-2xl p-7 border" style={{ borderColor: 'rgba(0,83,51,0.15)', backgroundColor: 'rgba(0,83,51,0.03)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(0,83,51,0.1)' }}>
                <Home size={18} color={C.green} />
              </div>
              <p className="font-bold text-base mb-3" style={{ color: C.green }}>Tenés familia</p>
              <ul className="space-y-1.5">
                {['Niños que juegan en la montaña y aprenden', 'Tiempo real en familia, sin distracciones', 'Cocina casera incluida — sin organizar nada', 'Comunidad de familias que piensa igual que vos'].map(i => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: C.muted }}>
                    <span className="mt-0.5 flex-shrink-0" style={{ color: C.green }}>✓</span>{i}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl p-7 border" style={{ borderColor: 'rgba(46,110,142,0.2)', backgroundColor: 'rgba(46,110,142,0.03)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(46,110,142,0.12)' }}>
                <Heart size={18} color={C.ice} />
              </div>
              <p className="font-bold text-base mb-3" style={{ color: C.ice }}>Venís solo/a o en pareja</p>
              <ul className="space-y-1.5">
                {['Tiempo para estar con vos, a tu ritmo — solo/a o juntos', 'Nuevas amistades y momentos de conexión real', 'Actividades para reír, relajar y explorar la montaña', 'Comida casera, rica y saludable en cada comida'].map(i => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: C.muted }}>
                    <span className="mt-0.5 flex-shrink-0" style={{ color: C.ice }}>✓</span>{i}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-2 rounded-2xl p-7 border" style={{ borderColor: 'rgba(212,175,55,0.25)', backgroundColor: 'rgba(212,175,55,0.04)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(212,175,55,0.15)' }}>
                <Briefcase size={18} color="#8B6A00" />
              </div>
              <p className="font-bold text-base mb-3" style={{ color: '#7A5C00' }}>Sos emprendedor/a, artista o creativo/a</p>
              <ul className="space-y-1.5">
                {[
                  'Silencio de montaña que trae claridad y revela oportunidades',
                  'Caminatas conscientes para oxigenar las ideas y alinearte con tu propósito',
                  'Starlink: el mejor internet disponible',
                  'Comida casera, rica y saludable para recargar energía',
                  'Mentoría en movimiento: Espacios orgánicos con el equipo del Pueblo Mágico o Kintu (Isvara, Luz, Tomi, Diego, China, Nicole) entre otros miembros según disponibilidad para desbloquear tus proyectos, ordenar tus ideas de negocio y pasar de la planificación a la acción real.',
                ].map(i => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: C.muted }}>
                    <span className="mt-0.5 flex-shrink-0" style={{ color: '#8B6A00' }}>✓</span>{i}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* No es para vos — abajo, centrada */}
          <div className="max-w-2xl mx-auto mb-10 rounded-2xl p-7 border" data-reveal data-delay="2"
            style={{ borderColor: 'rgba(107,128,144,0.2)', backgroundColor: 'rgba(107,128,144,0.04)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(107,128,144,0.1)' }}>
                <Snowflake size={16} color={C.faint} />
              </div>
              <p className="font-bold text-base" style={{ color: C.muted }}>No es para vos si...</p>
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: C.faint }}>
              Preferimos ser honestos. Winter Camp no es un hotel, ni un spa, ni un all-inclusive convencional.
            </p>
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
              {['Buscás lujo y servicios de resort', 'No querés compartir espacios con otros', 'Necesitás wi-fi ilimitado para videollamadas todo el día', 'Las montañas y el silencio te generan ansiedad', 'Buscás la comodidad constantemente'].map(i => (
                <li key={i} className="flex items-start gap-2 text-xs" style={{ color: C.faint }}>
                  <span className="mt-0.5 flex-shrink-0">✗</span>{i}
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center" data-reveal data-delay="3">
            <a href={WA_INFO} target="_blank" rel="noopener noreferrer"
              className="inline-block border font-semibold text-sm py-3 px-8 rounded-full transition-colors hover:bg-brand-green hover:text-white hover:border-brand-green"
              style={{ borderColor: 'rgba(0,83,51,0.3)', color: C.green }}>
              ¿Tengo dudas? Consultá sin compromiso →
            </a>
          </div>
        </div>
      </section>

      {/* ── FOGATA ── */}
      <section className="py-16 md:py-20 px-6" style={{ backgroundColor: '#FDF7F0' }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16">
          <div className="flex-1 order-2 md:order-1" data-reveal>
            <p className="text-[10px] tracking-[0.4em] uppercase font-semibold mb-6" style={{ color: C.fire }}>
              El ritual del Pueblo
            </p>
            <h2 className="text-3xl md:text-4xl serif-title leading-snug mb-6" style={{ color: C.dark }}>
              El frío nos acerca.<br />El fuego nos une.
            </h2>
            <p className="text-sm md:text-base leading-relaxed mb-8" style={{ color: C.muted }}>
              La fogata es el corazón del Pueblo — y tiene muchas formas. A veces es una noche entera de guitarras, tambores y leña de monte nativo bajo las estrellas. Otras veces es un grupo chico adentro del salón, con algo calentito y una charla que dura hasta tarde. El formato cambia según el clima, el grupo y el momento. Pero la invitación es siempre la misma: parar, juntarse y estar presentes. Hay muy pocos rituales más simples y más poderosos que ese.
            </p>
            <a
              href={WA_INFO}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: C.gold, color: '#fff' }}
            >
              Quiero ir →
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

      {/* ── TRANSFORMACIÓN ── */}
      <section className="py-20 md:py-28 px-6 relative overflow-hidden"
        style={{ backgroundImage: `url('/uploads/Invierno/20250629_132712.webp')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0" style={{ background: 'rgba(4,10,20,0.82)' }} />
        <div className="max-w-4xl mx-auto text-center relative z-10" data-reveal>
          <h2 className="text-2xl md:text-4xl serif-title text-white leading-snug mb-10">
            Llegás siendo una persona.<br />Te vas siendo otra.
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 text-left" data-reveal data-delay="1">
            {[
              { antes: 'Venís muy mental', despues: 'te vas más conectado/a con tu cuerpo.' },
              { antes: 'Venís estresado/a', despues: 'te vas recargado/a.' },
              { antes: 'Venís con bloqueos creativos', despues: 'te vas lleno/a de inspiración.' },
              { antes: 'Llegás huyendo del malestar', despues: 'te vas aprendiendo a navegarlo.' },
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

      {/* ── GALERÍA DE INVIERNO ── */}
      <section className="py-8 px-6 bg-white">
        <div className="max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-lg relative" style={{ height: '68vh', minHeight: '380px', maxHeight: '640px' }}>
          {CAROUSEL.map((photo, i) => (
            <div
              key={photo.src}
              className="absolute inset-0 transition-opacity duration-700 flex items-center justify-center"
              style={{
                backgroundColor: '#F5F5F0',
                opacity: i === carouselIdx ? 1 : 0,
              }}
            >
              <img
                src={photo.src}
                alt={photo.caption}
                className="w-full h-full"
                style={{ objectFit: 'contain' }}
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))}

          <button
            onClick={() => setCarouselIdx(i => (i - 1 + CAROUSEL.length) % CAROUSEL.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'rgba(0,0,0,0.12)', backdropFilter: 'blur(4px)' }}
            aria-label="Foto anterior"
          >
            <ChevronLeft size={20} color={C.dark} />
          </button>
          <button
            onClick={() => setCarouselIdx(i => (i + 1) % CAROUSEL.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'rgba(0,0,0,0.12)', backdropFilter: 'blur(4px)' }}
            aria-label="Foto siguiente"
          >
            <ChevronRight size={20} color={C.dark} />
          </button>

          <div className="absolute bottom-5 left-0 right-0 z-10 text-center">
            <p className="text-xs mb-3 tracking-wide" style={{ color: 'rgba(26,43,60,0.55)' }}>{CAROUSEL[carouselIdx].caption}</p>
            <div className="flex justify-center gap-2">
              {CAROUSEL.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCarouselIdx(i)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === carouselIdx ? '18px' : '6px',
                    height: '6px',
                    backgroundColor: i === carouselIdx ? C.gold : 'rgba(0,0,0,0.2)',
                  }}
                  aria-label={`Foto ${i + 1}`}
                />
              ))}
            </div>
          </div>
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
              Winter Camp es una invitación a vivir<br />la montaña desde otro lugar
            </h2>
            <p className="text-base max-w-2xl mx-auto" style={{ color: C.muted }}>
              No venís solo a alojarte a un lugar lindo… venís a co-crear y ser parte de una experiencia transformadora de verdad.
            </p>
          </div>

          {/* Mobile: carrusel programa */}
          <div className="md:hidden -mx-6 mt-12" data-reveal data-delay="3">
            <div ref={expRef} onTouchStart={() => setExpPaused(true)}
              className="flex gap-3 overflow-x-auto pb-3 px-6"
              style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>

              <div className="flex-shrink-0 rounded-2xl p-6 border" style={{ width: '82%', scrollSnapAlign: 'start', borderColor: 'rgba(0,83,51,0.2)', backgroundColor: 'rgba(0,83,51,0.03)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Smartphone size={13} color={C.green} />
                  <p className="text-[9px] tracking-widest uppercase font-bold" style={{ color: C.green }}>Siempre incluido</p>
                </div>
                <p className="font-bold text-sm mb-1" style={{ color: C.dark }}>Reset Vital · App</p>
                <p className="text-xs leading-relaxed mb-3" style={{ color: C.muted }}>
                  Retiro autoguiado en tu teléfono. Sin horarios, a tu ritmo. Funciona sin conexión.
                </p>
                <ul className="space-y-1">
                  {['Meditaciones guiadas', 'Journaling y escritura', 'Rituales de naturaleza', 'Respiraciones y relajación', 'Caminatas conscientes', 'Guía de plantas de la sierra'].map(a => (
                    <li key={a} className="flex items-start gap-1.5 text-xs" style={{ color: C.muted }}>
                      <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full" style={{ backgroundColor: C.green }} />{a}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex-shrink-0 rounded-2xl p-6 border" style={{ width: '82%', scrollSnapAlign: 'start', borderColor: 'rgba(46,110,142,0.2)', backgroundColor: 'rgba(46,110,142,0.03)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <CalendarDays size={13} color={C.ice} />
                  <p className="text-[9px] tracking-widest uppercase font-bold" style={{ color: C.ice }}>Según agenda y grupo</p>
                </div>
                <p className="font-bold text-sm mb-1" style={{ color: C.dark }}>Con facilitadores</p>
                <p className="text-xs leading-relaxed mb-3" style={{ color: C.muted }}>
                  Actividades compartidas según las fechas y quiénes estén en el Pueblo. Consultanos qué hay cuando llegás.
                </p>
                <ul className="space-y-1 mb-4">
                  {['Yoga y movimiento consciente', 'Círculos de palabra', 'Armonizaciones sonoras', 'Fogones nocturnos', 'Caminatas guiadas', 'Espacios para infancias', 'Workshops creativos', 'Mentoría para emprendedores'].map(a => (
                    <li key={a} className="flex items-start gap-1.5 text-xs" style={{ color: C.muted }}>
                      <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full" style={{ backgroundColor: C.ice }} />{a}
                    </li>
                  ))}
                </ul>
                <a href={WA_INFO} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold underline" style={{ color: C.ice }}>Consultar agenda →</a>
              </div>

              <div className="flex-shrink-0 rounded-2xl p-6 border" style={{ width: '82%', scrollSnapAlign: 'start', borderColor: 'rgba(212,175,55,0.25)', backgroundColor: 'rgba(212,175,55,0.03)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <CalendarDays size={13} color="#8B6A00" />
                  <p className="text-[9px] tracking-widest uppercase font-bold" style={{ color: '#8B6A00' }}>A contratar aparte</p>
                </div>
                <p className="font-bold text-sm mb-1" style={{ color: C.dark }}>Actividades extra</p>
                <p className="text-xs leading-relaxed mb-3" style={{ color: C.muted }}>
                  Con costo adicional. Se coordinan con anticipación según disponibilidad.
                </p>
                <ul className="space-y-1 mb-4">
                  {[
                    { Icon: Footprints, t: 'Trekking con guías' },
                    { Icon: PawPrint, t: 'Cabalgatas' },
                    { Icon: Heart, t: 'Masajes y terapias' },
                    { Icon: Compass, t: 'Sesiones 1 a 1' },
                    { Icon: Flame, t: 'Temazcal · ver sección ↓' },
                  ].map(({ Icon, t }) => (
                    <li key={t} className="flex items-center gap-1.5 text-xs" style={{ color: C.muted }}>
                      <Icon size={11} color="#8B6A00" />{t}
                    </li>
                  ))}
                </ul>
                <a href={WA_INFO} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold underline" style={{ color: '#8B6A00' }}>Consultar disponibilidad →</a>
              </div>
            </div>
            <p className="text-[10px] text-center" style={{ color: C.faint }}>Deslizá para ver más →</p>
          </div>

          {/* Desktop: 3 columnas compactas */}
          <div className="hidden md:grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-14" data-reveal data-delay="3">
            <div className="rounded-2xl p-6 border" style={{ borderColor: 'rgba(0,83,51,0.2)', backgroundColor: 'rgba(0,83,51,0.03)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Smartphone size={13} color={C.green} />
                <p className="text-[9px] tracking-widest uppercase font-bold" style={{ color: C.green }}>Siempre incluido</p>
              </div>
              <p className="font-bold text-sm mb-1" style={{ color: C.dark }}>Reset Vital · App</p>
              <p className="text-xs leading-relaxed mb-3" style={{ color: C.muted }}>
                Retiro autoguiado en tu teléfono. Sin horarios, a tu ritmo. Funciona sin conexión.
              </p>
              <ul className="space-y-1">
                {['Meditaciones guiadas', 'Journaling y escritura', 'Rituales de naturaleza', 'Respiraciones y relajación', 'Caminatas conscientes', 'Guía de plantas de la sierra'].map(a => (
                  <li key={a} className="flex items-start gap-1.5 text-xs" style={{ color: C.muted }}>
                    <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full" style={{ backgroundColor: C.green }} />{a}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl p-6 border" style={{ borderColor: 'rgba(46,110,142,0.2)', backgroundColor: 'rgba(46,110,142,0.03)' }}>
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays size={13} color={C.ice} />
                <p className="text-[9px] tracking-widest uppercase font-bold" style={{ color: C.ice }}>Según agenda y grupo</p>
              </div>
              <p className="font-bold text-sm mb-1" style={{ color: C.dark }}>Con facilitadores</p>
              <p className="text-xs leading-relaxed mb-3" style={{ color: C.muted }}>
                Actividades compartidas según las fechas y quiénes estén en el Pueblo. Consultanos qué hay cuando llegás.
              </p>
              <ul className="space-y-1 mb-4">
                {['Yoga y movimiento consciente', 'Círculos de palabra', 'Armonizaciones sonoras', 'Fogones nocturnos', 'Caminatas guiadas', 'Espacios para infancias', 'Workshops creativos', 'Mentoría para emprendedores'].map(a => (
                  <li key={a} className="flex items-start gap-1.5 text-xs" style={{ color: C.muted }}>
                    <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full" style={{ backgroundColor: C.ice }} />{a}
                  </li>
                ))}
              </ul>
              <a href={WA_INFO} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold underline" style={{ color: C.ice }}>Consultar agenda →</a>
            </div>
            <div className="rounded-2xl p-6 border" style={{ borderColor: 'rgba(212,175,55,0.25)', backgroundColor: 'rgba(212,175,55,0.03)' }}>
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays size={13} color="#8B6A00" />
                <p className="text-[9px] tracking-widest uppercase font-bold" style={{ color: '#8B6A00' }}>A contratar aparte</p>
              </div>
              <p className="font-bold text-sm mb-1" style={{ color: C.dark }}>Actividades extra</p>
              <p className="text-xs leading-relaxed mb-3" style={{ color: C.muted }}>
                Con costo adicional. Se coordinan con anticipación según disponibilidad.
              </p>
              <ul className="space-y-1 mb-4">
                {[
                  { Icon: Footprints, t: 'Trekking con guías' },
                  { Icon: PawPrint, t: 'Cabalgatas' },
                  { Icon: Heart, t: 'Masajes y terapias' },
                  { Icon: Compass, t: 'Sesiones 1 a 1' },
                  { Icon: Flame, t: 'Temazcal · ver sección ↓' },
                ].map(({ Icon, t }) => (
                  <li key={t} className="flex items-center gap-1.5 text-xs" style={{ color: C.muted }}>
                    <Icon size={11} color="#8B6A00" />{t}
                  </li>
                ))}
              </ul>
              <a href={WA_INFO} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold underline" style={{ color: '#8B6A00' }}>Consultar disponibilidad →</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── LA COCINA ── */}
      <section className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div data-reveal>
              <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold"
                style={{ backgroundColor: C.fire }}>
                Alimentación
              </p>
              <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: C.fire }}>Nuestro pilar principal</p>
              <h2 className="text-3xl md:text-4xl serif-title mb-5" style={{ color: C.dark }}>
                Comida casera, consciente,<br />nutritiva y hecha con amor
              </h2>
              <p className="text-base leading-relaxed mb-4" style={{ color: C.muted }}>
                En Pueblo Mágico, la alimentación es parte esencial de la experiencia. Cada plato es preparado con ingredientes frescos, locales y de estación — comida real que nutre el cuerpo, el alma y el espíritu mientras calienta el corazón.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {['Desayuno, almuerzo y cena incluidos', 'Ingredientes frescos y de estación', 'Preparado con cariño por nuestro equipo', 'Adaptable a necesidades especiales'].map(item => (
                  <div key={item} className="flex items-start gap-2">
                    <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: C.green }} />
                    <p className="text-xs" style={{ color: C.dark }}>{item}</p>
                  </div>
                ))}
              </div>
              <a href={WA_INFO} target="_blank" rel="noopener noreferrer"
                className="inline-block text-sm font-semibold border rounded-full px-6 py-2.5 transition-colors hover:bg-brand-green hover:text-white hover:border-brand-green"
                style={{ borderColor: 'rgba(0,83,51,0.3)', color: C.green }}>
                Consultar menú y necesidades especiales
              </a>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl" data-reveal data-delay="1">
              <img
                src={img('/uploads/469731807_3987061274856806_2943773444767775905_n.jpg', 900)}
                alt="Comida casera en Pueblo Mágico"
                className="w-full aspect-[4/3] object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── TEMAZCAL ── */}
      <section
        id="temazcal"
        className="py-24 md:py-36 px-6 relative overflow-hidden"
        style={{
          backgroundImage: `url('/uploads/temazcal.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(4,8,18,0.9) 0%, rgba(4,8,18,0.85) 100%)' }} />
        <div className="max-w-4xl mx-auto relative z-10 text-center" data-reveal>
          <p className="text-[10px] tracking-[0.4em] uppercase font-semibold mb-5" style={{ color: C.gold }}>
            Ceremonia ancestral
          </p>
          <h2 className="text-4xl md:text-6xl serif-title text-white mb-6 leading-tight">
            Temazcal
          </h2>
          <p className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-5 text-white/75">
            Un ritual ancestral de purificación y renacimiento. Calor, vapor, plantas medicinales y brasas sagradas — para limpiar lo que el cuerpo acumula y liberar lo que el alma necesita soltar.
          </p>
          <p className="text-sm leading-relaxed max-w-xl mx-auto mb-10 text-white/55">
            Guiado por <span className="font-semibold text-white/85">Santiago Alzogaray</span>, cada Temazcal es un espacio donde la comunidad se reúne para liberar, pedir, agradecer y honrar la vida en el medio de la montaña.
          </p>

          <div className="grid sm:grid-cols-3 gap-5 max-w-2xl mx-auto mb-12" data-reveal data-delay="1">
            {[
              { title: 'Purificación', desc: 'El calor del vapor limpia el cuerpo y disuelve las tensiones acumuladas' },
              { title: 'Comunidad', desc: 'Un espacio compartido donde los límites individuales se disuelven' },
              { title: 'Renacimiento', desc: 'Al salir, algo se renueva. El invierno tiene otro sabor desde adentro' },
            ].map(({ title, desc }) => (
              <div key={title} className="text-center p-5 rounded-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p className="font-bold text-sm mb-2" style={{ color: C.gold }}>{title}</p>
                <p className="text-xs leading-relaxed text-white/55">{desc}</p>
              </div>
            ))}
          </div>

          <a href={WA_INFO} target="_blank" rel="noopener noreferrer"
            className="inline-block border font-semibold text-sm py-3 px-8 rounded-full hover:bg-white/10 transition-colors"
            style={{ borderColor: 'rgba(212,175,55,0.4)', color: C.gold }}>
            Consultar fechas del Temazcal
          </a>
        </div>
      </section>

      {/* ── EQUIPO ── */}
      <section className="py-20 md:py-28 px-6" style={{ backgroundColor: '#F0F7F4' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14" data-reveal>
            <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold"
              style={{ backgroundColor: C.green }}>
              Quiénes te acompañan
            </p>
            <h2 className="text-3xl md:text-4xl serif-title mb-4" style={{ color: C.green }}>
              El equipo del Winter Camp
            </h2>
            <p className="text-base max-w-lg mx-auto" style={{ color: C.muted }}>
              Facilitadores y guardianes que sostienen la experiencia. Nos cruzaremos con ellos alrededor del fuego en diferentes momentos del mes, según el cronograma y las fechas de tu estadía.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5" data-reveal data-delay="1">
            {TEAM.filter(m => m.nombre !== 'Santiago Alzogaray').map(({ photo, nombre, rol, desc, instagram, linkedin, tags }) => {
              const desktopOnly = ['Diego Epelman Hodara', 'China Dericia'].includes(nombre);
              return (
              <div key={nombre} className={`rounded-2xl p-7 border${desktopOnly ? ' hidden md:block' : ''}`} style={{ borderColor: 'rgba(0,83,51,0.1)', backgroundColor: 'rgba(0,83,51,0.02)' }}>
                <img src={img(photo, 200)} alt={nombre} className="w-14 h-14 rounded-full object-cover mb-4" loading="lazy" />
                {tags && tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {tags.map(tag => (
                      <span key={tag} className="text-[8px] font-bold tracking-[0.12em] uppercase px-2 py-0.5 rounded-full border"
                        style={
                          tag === 'KINTU'
                            ? { backgroundColor: 'rgba(212,175,55,0.1)', color: '#8B6A00', borderColor: 'rgba(212,175,55,0.3)' }
                            : tag === 'PUEBLO MÁGICO'
                            ? { backgroundColor: 'rgba(0,83,51,0.07)', color: C.green, borderColor: 'rgba(0,83,51,0.2)' }
                            : { backgroundColor: 'rgba(46,110,142,0.07)', color: C.ice, borderColor: 'rgba(46,110,142,0.2)' }
                        }>
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
              );
            })}
          </div>

          {/* Coproducción Kintu */}
          <div className="mt-10 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden" data-reveal data-delay="2" style={{ backgroundColor: C.green }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: 'rgba(212,175,55,0.25)' }} />
            <div className="relative z-10">
              <p className="text-[10px] tracking-[0.4em] uppercase font-semibold mb-4" style={{ color: 'rgba(212,175,55,0.8)' }}>Una coproducción de</p>
              <h3 className="text-2xl md:text-3xl serif-title text-white mb-4">Pueblo Mágico × Kintu</h3>
              <p className="text-sm md:text-base max-w-xl mx-auto leading-relaxed mb-6 text-white/70">
                KINTU es un equipo y una productora pionera en experiencias transformadoras integrada por Isvara, Diego, Tomi y Luz, que diseña viajes y procesos con corazón y propósito. Inspirada en la cosmovisión andina —donde el kintu es una ofrenda—, cada experiencia nace desde la intención, el cuidado y la coherencia. Cada retiro y dinámica en este Winter Camp tiene el propósito de acompañarte a habitar una vida más activa, consciente y conectada con lo esencial.
              </p>
              <a href="https://www.instagram.com/somoskintu_/" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold rounded-full px-5 py-2.5 transition-colors hover:bg-white/10"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: C.gold, border: '1px solid rgba(212,175,55,0.3)' }}>
                <Instagram size={16} />
                @somoskintu_
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── EL LUGAR ── */}
      <section className="py-20 md:py-28 px-6" style={{ backgroundColor: C.night }}>
        <div className="max-w-5xl mx-auto">
          <div data-reveal>
            <p className="text-[10px] tracking-[0.3em] uppercase mb-4 font-semibold" style={{ color: C.green }}>El lugar</p>
            <h2 className="text-3xl md:text-4xl serif-title mb-4 leading-tight" style={{ color: C.green }}>
              Pueblo Mágico,<br />Los Gigantes
            </h2>
            <div className="flex flex-wrap gap-x-8 gap-y-2 mb-6">
              {[
                'A 90 km de Córdoba Capital',
                'Acceso en cualquier auto',
                'Espacios calefaccionados, fogón y senderos',
                '200 hectáreas de reserva natural',
              ].map(item => (
                <span key={item} className="flex items-center gap-2 text-sm" style={{ color: C.muted }}>
                  <span style={{ color: C.green }}>—</span>{item}
                </span>
              ))}
            </div>
            <a href={WA_INFO} target="_blank" rel="noopener noreferrer"
              className="inline-block text-sm font-semibold border rounded-full px-6 py-2.5 transition-colors hover:bg-brand-green hover:text-white hover:border-brand-green"
              style={{ borderColor: 'rgba(0,83,51,0.3)', color: C.green }}>
              ¿Cómo llegar? Consultanos
            </a>
          </div>

          {/* Mobile: carrusel JS */}
          <div className="mt-10 md:hidden" data-reveal data-delay="1">
            <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
              {/* Slide 0: video */}
              <div className="absolute inset-0 transition-opacity duration-500" style={{ opacity: lugarIdx === 0 ? 1 : 0, pointerEvents: lugarIdx === 0 ? 'auto' : 'none', background: '#000' }}>
                {lugarIdx === 0 && (
                  <iframe
                    src="https://www.youtube.com/embed/QPNxc5Nh8es?rel=0&modestbranding=1"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Pueblo Mágico"
                  />
                )}
              </div>
              {/* Slides 1-6: fotos */}
              {LUGAR_PHOTOS.map(({ src, label }, i) => (
                <div key={src} className="absolute inset-0 transition-opacity duration-500" style={{ opacity: lugarIdx === i + 1 ? 1 : 0, pointerEvents: lugarIdx === i + 1 ? 'auto' : 'none' }}>
                  <img src={img(src, 900)} alt={label} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)' }} />
                  <p className="absolute bottom-3 left-4 text-white text-xs font-bold">{label}</p>
                </div>
              ))}
              {/* Prev / Next */}
              <button
                onClick={() => setLugarIdx(i => (i - 1 + LUGAR_PHOTOS.length + 1) % (LUGAR_PHOTOS.length + 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                style={{ background: 'rgba(0,0,0,0.45)' }}
                aria-label="Anterior"
              >‹</button>
              <button
                onClick={() => setLugarIdx(i => (i + 1) % (LUGAR_PHOTOS.length + 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                style={{ background: 'rgba(0,0,0,0.45)' }}
                aria-label="Siguiente"
              >›</button>
            </div>
            {/* Dots */}
            <div className="flex justify-center gap-1.5 mt-2">
              {Array.from({ length: LUGAR_PHOTOS.length + 1 }).map((_, i) => (
                <button key={i} onClick={() => setLugarIdx(i)}
                  className="w-1.5 h-1.5 rounded-full transition-colors"
                  style={{ background: lugarIdx === i ? C.green : 'rgba(0,0,0,0.2)' }}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Desktop: video + foto grid */}
          <div className="hidden md:grid md:grid-cols-2 gap-12 items-start mt-12" data-reveal data-delay="1">
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <div className="aspect-video">
                <iframe
                  src="https://www.youtube.com/embed/ktzVcAs-74c?rel=0&modestbranding=1"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Pueblo Mágico"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { src: '/uploads/yoga_salon.webp',                                    label: 'El Salón',     desc: 'Yoga · círculos · dinámicas' },
                { src: '/uploads/coworking.webp',                                     label: 'Coworking',    desc: 'WiFi Starlink · mesas de trabajo' },
                { src: '/uploads/habitaciones.webp',                                  label: 'Habitaciones', desc: 'Ropa blanca · toallón' },
                { src: '/uploads/Invierno/DJI_20250629140041_0171_D_CHAPA2025.webp', label: 'Domos',        desc: 'Glamping nevado' },
                { src: '/uploads/mesadas.webp',                                       label: 'Cocina común', desc: 'Hornallas y comedor' },
                { src: '/uploads/botica.webp',                                        label: 'La Botica',    desc: 'Plantas medicinales' },
              ].map(({ src, label, desc }) => (
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
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section className="py-12 md:py-16 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center" data-reveal>
          <p className="text-[10px] tracking-[0.3em] uppercase font-semibold mb-3" style={{ color: C.faint }}>
            Cómo funciona
          </p>
          <p className="text-sm md:text-base leading-relaxed" style={{ color: C.muted }}>
            No reservás un paquete cerrado: reservás las noches que quieras durante julio, agosto o septiembre 2026. Vos elegís cuándo llegar y cuándo irte, y mientras estás en Pueblo Mágico tenés pensión completa y el cronograma de actividades disponible para sumarte cuando quieras. Por eso el precio se calcula <strong style={{ color: C.dark }}>por noche</strong> — y cuantas más noches te quedás, más baja el valor de cada una.
          </p>
        </div>
      </section>

      {/* ── TESTIMONIOS ── */}
      <section className="py-16 md:py-24 px-6 relative overflow-hidden"
        style={{ backgroundImage: `url('/uploads/Invierno/DJI_20250629135719_0165_D_CHAPA2025.webp')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0" style={{ background: 'rgba(4,10,20,0.80)' }} />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-12" data-reveal>
            <p className="text-[10px] tracking-[0.4em] uppercase font-semibold mb-4" style={{ color: C.gold }}>
              Quienes ya vivieron la experiencia
            </p>
            <h2 className="text-3xl md:text-4xl serif-title text-white mb-3">Lo que dicen quienes estuvieron</h2>
            <a href="https://maps.app.goo.gl/4c1nrpBbQf5hYrsE9" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border transition-colors hover:bg-white/10"
              style={{ borderColor: 'rgba(212,175,55,0.3)' }}>
              <span className="text-sm" style={{ color: '#F4C27A' }}>★★★★★</span>
              <span className="text-white/65 text-xs font-semibold">5.0 · 64 reseñas en Google Maps</span>
            </a>
          </div>

          {/* Mobile: carrusel auto-play */}
          <div className="md:hidden" data-reveal data-delay="1">
            <div className="relative">
              {TESTIMONIOS.map(({ text, name, rol }, i) => (
                <div key={name} className="transition-opacity duration-500" style={{ opacity: testiIdx === i ? 1 : 0, position: testiIdx === i ? 'relative' : 'absolute', top: 0, left: 0, right: 0 }}>
                  <div className="rounded-2xl p-6 border" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.06)' }}>
                    <p className="text-2xl mb-4 leading-none" style={{ color: C.gold }}>"</p>
                    <p className="text-sm leading-relaxed mb-6 text-white/80 italic">{text}</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: C.green }}>
                        {name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{name}</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{rol}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Controles */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={() => { setTestiIdx(i => (i - 1 + TESTIMONIOS.length) % TESTIMONIOS.length); setTestiPaused(true); }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                style={{ background: 'rgba(255,255,255,0.15)' }}
                aria-label="Anterior"
              >‹</button>
              <div className="flex gap-2">
                {TESTIMONIOS.map((_, i) => (
                  <button key={i} onClick={() => { setTestiIdx(i); setTestiPaused(true); }}
                    className="w-2 h-2 rounded-full transition-colors"
                    style={{ background: testiIdx === i ? C.gold : 'rgba(255,255,255,0.25)' }}
                    aria-label={`Testimonio ${i + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={() => { setTestiIdx(i => (i + 1) % TESTIMONIOS.length); setTestiPaused(true); }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                style={{ background: 'rgba(255,255,255,0.15)' }}
                aria-label="Siguiente"
              >›</button>
            </div>
            {testiPaused && (
              <button onClick={() => setTestiPaused(false)} className="block mx-auto mt-2 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                ▶ Reanudar
              </button>
            )}
          </div>

          {/* Desktop: 3 columnas */}
          <div className="hidden md:grid md:grid-cols-3 gap-5" data-reveal data-delay="1">
            {TESTIMONIOS.map(({ text, name, rol }) => (
              <div key={name} className="rounded-2xl p-6 border" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-2xl mb-4 leading-none" style={{ color: C.gold }}>"</p>
                <p className="text-sm md:text-base leading-relaxed mb-6 text-white/80 italic">{text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: C.green }}>
                    {name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{name}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{rol}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TU ESTADÍA / PRECIOS ── */}
      <section className="py-20 md:py-28 px-6" style={{ backgroundColor: '#EEF5FA' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12" data-reveal>
            <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold"
              style={{ backgroundColor: C.green }}>
              Solo por invierno
            </p>
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

          {/* Incluye — antes de los precios para mostrar valor primero */}
          <div className="mb-12 rounded-2xl p-8 md:p-10 border" data-reveal style={{ borderColor: 'rgba(0,83,51,0.1)', backgroundColor: 'white' }}>
            <p className="text-[10px] tracking-widest uppercase font-semibold mb-6 text-center" style={{ color: C.green }}>Todo esto incluye tu estadía</p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
              {[
                { Icon: Utensils, label: 'Pensión completa · 3 comidas por día' },
                { Icon: Home, label: 'Alojamiento · ropa blanca y toallón individual' },
                { Icon: Snowflake, label: 'Kit de invierno' },
                { Icon: Droplet, label: 'Agua caliente 24 hs' },
                { Icon: Wifi, label: 'WIFI satelital' },
                { Icon: Flame, label: 'Espacios calefaccionados con fuego prendido' },
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
                    style={{ width: '82%', scrollSnapAlign: 'start', ...(isBest
                      ? { borderColor: 'rgba(0,83,51,0.35)', backgroundColor: 'rgba(0,83,51,0.05)' }
                      : { borderColor: '#E5DDD5', backgroundColor: 'white' }) }}>
                    {isBest && (
                      <span className="absolute top-4 right-4 text-[9px] tracking-widest uppercase font-bold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: C.green, color: C.gold }}>Mejor precio</span>
                    )}
                    <p className="text-[10px] tracking-widest uppercase font-semibold mb-3" style={{ color: isBest ? C.green : '#A0866E' }}>{noches}</p>
                    <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: C.faint }}>En cuotas</p>
                    <p className="text-[11px] font-semibold mb-1 inline-block px-2.5 py-1 rounded-full"
                      style={isBest ? { backgroundColor: C.gold, color: C.green } : { backgroundColor: 'rgba(212,175,55,0.18)', color: '#8B6A00' }}>
                      {cuotas}
                    </p>
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

          {/* Desktop: grid 3 columnas */}
          <div className="hidden md:grid md:grid-cols-3 gap-5" data-reveal data-delay="1">
            {PRECIOS.map(({ noches, efectivo, oldEfectivo, porNoche, oldPorNoche, listaTotal, cuotas, ahorroEfectivo, ahorroNoches }, idx) => {
              const isBest = idx === PRECIOS.length - 1;
              return (
              <div key={noches} className="rounded-2xl p-7 border text-left relative"
                style={isBest
                  ? { borderColor: 'rgba(0,83,51,0.35)', backgroundColor: 'rgba(0,83,51,0.05)' }
                  : { borderColor: '#E5DDD5', backgroundColor: 'white' }}>
                {isBest && (
                  <span className="absolute top-4 right-4 text-[9px] tracking-widest uppercase font-bold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: C.green, color: C.gold }}>Mejor precio</span>
                )}
                <p className="text-[10px] tracking-widest uppercase font-semibold mb-3" style={{ color: isBest ? C.green : '#A0866E' }}>{noches}</p>
                <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: C.faint }}>En cuotas</p>
                <p className="text-[11px] font-semibold mb-1 inline-block px-2.5 py-1 rounded-full"
                  style={isBest ? { backgroundColor: C.gold, color: C.green } : { backgroundColor: 'rgba(212,175,55,0.18)', color: '#8B6A00' }}>
                  {cuotas}
                </p>
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

          {/* Tarifa infancias */}
          <div className="mt-6 max-w-sm mx-auto rounded-2xl px-6 py-5 border" style={{ borderColor: 'rgba(0,83,51,0.12)', backgroundColor: 'rgba(0,83,51,0.02)' }}>
            <p className="text-[10px] tracking-widest uppercase font-bold mb-3 text-center" style={{ color: C.green }}>Tarifa para infancias</p>
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

          <div className="text-center mt-10" data-reveal data-delay="3">
            <a href={WA_RESERVA} target="_blank" rel="noopener noreferrer" className="btn-gold text-sm py-4 px-8 inline-block">
              Reservar mi estadía
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 md:py-28 px-6" style={{ backgroundColor: '#EEF5FA' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12" data-reveal>
            <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold"
              style={{ backgroundColor: C.green }}>
              Preguntas frecuentes
            </p>
            <h2 className="text-3xl md:text-4xl serif-title mb-4" style={{ color: C.green }}>
              Todo lo que necesitás saber
            </h2>
            <p className="text-base max-w-lg mx-auto" style={{ color: C.muted }}>
              ¿Quedó alguna duda? Escribinos por WhatsApp y te respondemos al momento.
            </p>
          </div>

          <div className="space-y-3 md:space-y-4" data-reveal data-delay="1">
            {FAQS.map(({ q, a }, index) => {
              const isActive = activeFaq === index;
              const Icon = FAQ_ICONS[index % FAQ_ICONS.length];
              return (
                <div key={q} className="rounded-2xl border bg-white overflow-hidden transition-colors duration-300"
                  style={{ borderColor: isActive ? C.gold : 'rgba(0,83,51,0.1)', boxShadow: isActive ? '0 4px 16px rgba(0,0,0,0.05)' : 'none' }}>
                  <button
                    className="w-full text-left px-6 py-5 md:px-8 md:py-6 flex items-center gap-4 focus:outline-none"
                    onClick={() => setActiveFaq(isActive ? null : index)}
                    aria-expanded={isActive}
                  >
                    <span className="flex-shrink-0 transition-colors duration-300" style={{ color: isActive ? C.green : 'rgba(0,83,51,0.3)' }}>
                      <Icon size={20} />
                    </span>
                    <h3 className="flex-1 font-bold text-sm md:text-base leading-snug transition-colors duration-300" style={{ color: isActive ? C.green : C.dark }}>
                      {q}
                    </h3>
                    <span
                      className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-transform duration-300"
                      style={{ backgroundColor: isActive ? C.green : 'rgba(0,83,51,0.06)', color: isActive ? C.gold : C.green, transform: isActive ? 'rotate(180deg)' : 'none' }}
                    >
                      <ChevronDown size={16} />
                    </span>
                  </button>
                  <div
                    className="transition-all duration-500 ease-in-out overflow-hidden"
                    style={{ display: 'grid', gridTemplateRows: isActive ? '1fr' : '0fr', opacity: isActive ? 1 : 0 }}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="pl-[3.75rem] pr-6 md:pl-[4.5rem] md:pr-8 pb-6 md:pb-7 pt-1">
                        <div className="w-full h-px mb-4" style={{ backgroundColor: 'rgba(0,83,51,0.08)' }} />
                        <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{a}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-10" data-reveal data-delay="2">
            <a href={WA_INFO} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold border rounded-full px-5 py-2.5 transition-colors hover:bg-brand-green hover:text-white hover:border-brand-green"
              style={{ borderColor: 'rgba(0,83,51,0.3)', color: C.green }}>
              Escribirnos
            </a>
          </div>
        </div>
      </section>

      {/* ── FILOSOFÍA INVIERNO ── */}
      <section
        className="py-24 md:py-36 px-6 relative overflow-hidden"
        style={{
          backgroundImage: `url('/uploads/Invierno/20250627_222558.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-3xl mx-auto text-center relative z-10" data-reveal>
          <p className="text-lg md:text-xl font-light leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
            El invierno, aunque no parezca, sí es para todos.
          </p>
          <p className="text-3xl md:text-5xl serif-title text-white leading-snug mb-8">
            Perderte es igual de importante<br />que encontrarte.
          </p>
          <p className="text-base md:text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
            Viniste a vivir el invierno.<br />El invierno vino a enseñarte algo.
          </p>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section
        className="py-28 md:py-40 px-6 text-white text-center relative overflow-hidden"
        style={{ backgroundImage: `url('/uploads/Invierno/DJI_20250629140054_0172_D_CHAPA2025.webp')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: 'rgba(6,12,20,0.88)' }} />
        <div className="max-w-2xl mx-auto relative z-10" data-reveal>
          <div className="flex justify-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(46,110,142,0.3)', border: '1px solid rgba(127,196,232,0.2)' }}>
              <Snowflake size={26} color="#7FC4E8" />
            </div>
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(170,62,17,0.3)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <Flame size={26} color={C.gold} />
            </div>
          </div>
          <h2 className="text-3xl md:text-5xl serif-title text-white mb-6 leading-tight">
            Este invierno, el viaje es hacia vos
          </h2>
          <p className="text-sm md:text-base italic mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Venís por el invierno. Pero también viene el invierno por vos.
          </p>
          <p className="text-base font-semibold mb-10 text-white/80">
            Te esperamos en Pueblo Mágico.
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
            1 al 31 de julio 2026 · Pueblo Mágico, Los Gigantes, Córdoba
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default WinterCamp;
