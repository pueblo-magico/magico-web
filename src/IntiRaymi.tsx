import React, { useState, useEffect } from 'react';
import { Flame, Music, Leaf, Heart, Star, Users, Sun, Moon, Calendar, Compass, ChevronDown, PawPrint, Instagram, Linkedin, Youtube, type LucideIcon } from 'lucide-react';
import { img } from './lib/img';
import { WA_MAGICO } from './data/config';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

const WA_INFO    = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent('¡Hola! Me interesa el Festival de Solsticio del 20 y 21 de junio. ¿Me pueden dar más info?')}`;
const WA_RESERVA = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent('¡Hola! Quiero reservar mi lugar para el Festival de Solsticio del 20 y 21 de junio. ¿Cómo procedo?')}`;

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

// ─── Equipo & invitados ─────────────────────────────────────────────────────────
type SocialLink = { href: string; label: string; Icon: LucideIcon };

type TeamMember = {
  nombre: string;
  rol: string;
  desc: string;
  photo?: string;
  Icon?: LucideIcon;
  links?: SocialLink[];
};

const TEAM: TeamMember[] = [
  {
    photo: '/uploads/Diego_perfil.png',
    nombre: 'Diego Epelman Hodara',
    rol: 'Host principal del evento',
    desc: 'Host principal del evento y del espacio. Dinámicas, círculos y experiencias — sostén energético del grupo.',
    links: [
      { href: 'https://www.instagram.com/diegoepel/', label: 'Instagram', Icon: Instagram },
    ],
  },
  {
    photo: '/uploads/china.jpeg',
    nombre: 'China Dericia',
    rol: 'Yoga, canto & consciencia corporal',
    desc: 'Movimiento consciente para habitar el cuerpo. Va a cantar y guiar una meditación grupal durante el encuentro.',
    links: [
      { href: 'https://www.instagram.com/bambu.alquimia.terapeutica/', label: 'Instagram', Icon: Instagram },
    ],
  },
  {
    photo: '/uploads/luz-candela.jpg',
    nombre: 'Luz Candela',
    rol: 'Host de emprendedores/as',
    desc: 'Creadora de Mujeres Amatistas. Yoga, meditación y pranayama — movimiento consciente para habitar el cuerpo desde adentro.',
    links: [
      { href: 'https://www.instagram.com/mujeramatistaa/', label: 'Instagram', Icon: Instagram },
    ],
  },
  {
    photo: '/uploads/santiago-alzogaray.png',
    nombre: 'Santiago Alzogaray',
    rol: 'Ceremonia de Temazcal',
    desc: 'Conducción del ritual de purificación, uno de los momentos centrales del encuentro.',
  },
  {
    photo: '/uploads/tomas-fossatti.jpg',
    nombre: 'Tomás Fossatti',
    rol: 'Host de emprendedores/as',
    desc: 'Ingeniero, emprendedor y speaker de TEDx. Construye proyectos donde la tecnología y el propósito se encuentran.',
    links: [
      { href: 'https://www.youtube.com/watch?v=n1LSi7t5WKs', label: 'Charla TEDx', Icon: Youtube },
      { href: 'https://www.instagram.com/tomasfossatti_/', label: 'Instagram', Icon: Instagram },
      { href: 'https://www.linkedin.com/in/tomas-fossatti-ing', label: 'LinkedIn', Icon: Linkedin },
    ],
  },
  {
    photo: '/uploads/isvara-rojas.jpg',
    nombre: 'Isvara Rojas Romero',
    rol: 'Host de emprendedores/as',
    desc: 'Estratega de Innovación y Growth Engineer. Une el mundo del bienestar con la tecnología.',
    links: [
      { href: 'https://www.instagram.com/isvara_strategist/', label: 'Instagram', Icon: Instagram },
      { href: 'https://www.linkedin.com/in/isvara-rojas-romero-53a20a298/', label: 'LinkedIn', Icon: Linkedin },
    ],
  },
];

// ─── FAQ ───────────────────────────────────────────────────────────────────────
const FAQ_ICONS: LucideIcon[] = [Star, Calendar, Users, Moon, Flame, Compass, Heart, Leaf, PawPrint];

const FAQS = [
  {
    q: '¿Necesito experiencia previa?',
    a: 'No. Es un encuentro abierto a todo público. Cada persona participa desde su propio lugar, sin importar si es su primera vez.',
  },
  {
    q: '¿Puedo venir solo un día?',
    a: 'Sí. El pase diario ($60.000) te da acceso a todas las actividades de la jornada que elijas — el 20, el 21 o ambos.',
  },
  {
    q: '¿Es para familias con chicos?',
    a: 'Sí, toda la familia es bienvenida. Es una celebración colectiva con espíritu comunitario — hay espacio para todas las edades.',
  },
  {
    q: '¿Qué llevo para la pijamada?',
    a: 'Colchoneta y bolsa de dormir. El salón es calefaccionado. Todas las comidas y actividades están incluidas.',
  },
  {
    q: '¿Los cupos son limitados?',
    a: 'Sí. Recomendamos reservar con anticipación para asegurar tu lugar y el de tu familia o grupo.',
  },
  {
    q: '¿Cómo llego al lugar?',
    a: 'Pueblo Mágico queda en Los Gigantes, Córdoba — a 90 km de Córdoba Capital. Acceso para todo tipo de vehículos. Consultanos y te mandamos el mapa.',
  },
  {
    q: '¿Hay descuento para infancias?',
    a: 'Si no ocupan cama, consultanos por WhatsApp — tenemos descuentos para los más chicos.',
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

// ─── Countdown ─────────────────────────────────────────────────────────────────
const Countdown: React.FC = () => {
  const target = new Date('2026-06-20T09:00:00').getTime();
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


// ─── Page ──────────────────────────────────────────────────────────────────────
const IntiRaymi: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    document.title = 'Festival de Solsticio de Invierno · 20 y 21 de Junio · Pueblo Mágico';
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
          backgroundImage: `url(${img('/uploads/fogon_nocturno.webp', 1800)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(10,20,12,0.97) 0%, rgba(10,20,12,0.65) 45%, rgba(10,20,12,0.2) 100%)' }}
        />

        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 md:px-12 pt-28 md:pt-20 pb-10 md:pb-0 flex flex-col md:items-center md:text-center">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center md:justify-center gap-2 sm:gap-3 mb-4">
            <span className="inline-block max-w-full px-3 sm:px-4 py-1.5 rounded-full text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.4em] uppercase font-bold border border-white/20 text-white/70 whitespace-nowrap">
              <span className="sm:hidden">20-21 Jun · Los Gigantes</span>
              <span className="hidden sm:inline">20 y 21 de junio · Los Gigantes, Córdoba</span>
            </span>
            <span
              className="inline-block max-w-full px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] tracking-wide sm:tracking-widest uppercase font-bold whitespace-nowrap"
              style={{ backgroundColor: 'rgba(212,175,55,0.15)', color: '#F4C27A', border: '1px solid rgba(212,175,55,0.3)' }}
            >
              Día del Padre · 21 de Junio
            </span>
            <span
              className="inline-block max-w-full px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] tracking-wide sm:tracking-widest uppercase font-bold whitespace-nowrap"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              Para todo público
            </span>
          </div>

          <p className="text-white/50 text-xs sm:text-sm tracking-[0.3em] uppercase mb-2 sm:mb-3 font-semibold">Festival Consciente</p>
          <h1 className="text-5xl md:text-7xl serif-title leading-none mb-4 text-white">
            Solsticio<br /> <span style={{ color: C.gold }}>De Invierno</span>
          </h1>
          <p className="text-white/65 text-sm md:text-lg leading-relaxed max-w-lg md:max-w-2xl mt-4 mb-6 md:mt-5 md:mb-10">
            Dos días para celebrar el renacimiento de la luz atravesando la noche más larga del año, honrando la antigua tradición del Inti Raymi. El 21 de junio es el Día del Padre — una excusa perfecta para celebrarlo en la montaña, juntos.
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
            <div>
              <p className="text-white/35 text-[10px] tracking-widest uppercase mb-2">Faltan</p>
              <Countdown />
            </div>
          </div>

          <p className="text-white/40 text-xs sm:text-sm mt-6 max-w-md leading-relaxed">
            Abierto a todo público, sin experiencia previa. Todas las actividades son una invitación — sumate a las que quieras, nada es obligatorio.
          </p>
        </div>
      </section>

      {/* ── ESENCIA ── */}
      <section className="py-20 md:py-28 px-6" style={{ backgroundColor: C.night }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12" data-reveal>
            <div className="flex justify-center gap-5 mb-10">
              <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(170,62,17,0.25)' }}>
                <Flame size={20} color="#F4A261" />
              </div>
              <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                <Moon size={20} color="rgba(255,255,255,0.6)" />
              </div>
              <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(212,175,55,0.2)' }}>
                <Sun size={20} color={C.gold} />
              </div>
            </div>
            <blockquote className="text-2xl md:text-4xl serif-title text-white leading-relaxed mb-4">
              "Volvemos al fuego.<br />
              Volvemos al origen.<br />
              <span style={{ color: C.gold }}>Volvemos al Sol."</span>
            </blockquote>
            <p className="text-white/50 text-sm md:text-base leading-relaxed max-w-xl mx-auto">
              El Inti Raymi es una celebración ancestral que honra el regreso del Sol, en la noche más larga del año.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5" data-reveal data-delay="1">
            {[
              { Icon: Sun, title: 'Nuevo comienzo', desc: 'Soltamos lo viejo y damos la bienvenida a lo nuevo — un recordatorio de que la luz siempre vuelve.' },
              { Icon: Flame, title: 'Fuego vivo', desc: 'Uno o más fuegos encendidos durante todo el evento, como corazón del encuentro.' },
              { Icon: Users, title: 'Espacio abierto', desc: 'Festival consciente para celebrar, conocer gente nueva y compartir el comienzo de un nuevo ciclo.' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="rounded-2xl p-6 border text-center" style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(212,175,55,0.12)' }}>
                  <Icon size={18} color={C.gold} />
                </div>
                <p className="font-bold text-white mb-2">{title}</p>
                <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3" data-reveal data-delay="2">
            {['Abierto a todo público', 'Fuego ininterrumpido', 'Conexiones genuinas', 'Toda la familia bienvenida'].map(tag => (
              <span key={tag} className="text-[11px] px-3 py-1.5 rounded-full border font-medium"
                style={{ borderColor: 'rgba(212,175,55,0.3)', color: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(212,175,55,0.06)' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── DÍA DEL PADRE ── */}
      <section className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12" data-reveal>
            <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold"
              style={{ backgroundColor: C.green }}>
              21 de junio · Día del Padre
            </p>
            <h2 className="text-3xl md:text-4xl serif-title mb-5 max-w-2xl mx-auto" style={{ color: C.green }}>
              Que el Día del Padre coincida este año con el Inti Raymi no es casualidad
            </h2>
            <p className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: C.muted }}>
              La energía creadora del sol, como arquetipo paterno, nos invita a revisar nuestra propia biografía y descubrir qué tomar — y qué no — de la figura de nuestro padre.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5" data-reveal data-delay="1">
            {[
              { Icon: Sun, day: 'Sábado · todo el día', title: 'Día de celebración', desc: 'Caminatas, música, baile, mates y río — nos amoldamos al clima, pero seguro la disfrutamos mucho. De noche, fogón: el momento para soltar y entregar al fuego todo lo que ya no queremos seguir cargando.' },
              { Icon: Heart, day: 'Para todos', title: 'Honrar y agradecer', desc: 'Agradecemos todo lo que nos dieron nuestros padres, con su energía creadora, sus enseñanzas y su sostén como creadores de vida — para ser mejores padres/madres, hijos/as, hermanos/as, amigos/as y compañeros/as.' },
              { Icon: Compass, day: 'Domingo', title: 'Temazcal & integración', desc: 'El domingo es el día del temazcal: un proceso de integración de todo lo vivido, reforzado con journaling, meditación y caminatas.' },
            ].map(({ Icon, day, title, desc }) => (
              <div key={title} className="rounded-2xl p-7 border text-left" style={{ borderColor: 'rgba(0,83,51,0.12)', backgroundColor: 'rgba(0,83,51,0.02)' }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(0,83,51,0.08)' }}>
                  <Icon size={18} color={C.green} />
                </div>
                <p className="text-[10px] tracking-widest uppercase font-semibold mb-2" style={{ color: '#8B6A00' }}>{day}</p>
                <p className="font-bold text-base mb-2" style={{ color: C.green }}>{title}</p>
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARA QUIÉN ── */}
      <section className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14" data-reveal>
            <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold"
              style={{ backgroundColor: C.green }}>
              ¿Para quién es?
            </p>
            <h2 className="text-3xl md:text-4xl serif-title mb-4" style={{ color: C.green }}>
              Para quienes buscan reconectar.<br />Y para quienes lideran.
            </h2>
            <p className="text-base max-w-lg mx-auto" style={{ color: C.muted }}>
              Un espacio para todo público, sin experiencia previa necesaria — vení como sos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6" data-reveal data-delay="1">
            {/* General */}
            <div className="rounded-2xl p-8 border" style={{ borderColor: 'rgba(0,83,51,0.15)', backgroundColor: 'rgba(0,83,51,0.03)' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,83,51,0.1)' }}>
                  <Leaf size={18} color={C.green} />
                </div>
                <p className="font-bold text-base" style={{ color: C.green }}>Para todo el mundo</p>
              </div>
              <p className="text-sm leading-relaxed mb-5" style={{ color: C.muted }}>
                Si sentís que necesitás hacer una pausa, reconectar con la naturaleza, el cuerpo o algo más profundo — este espacio es para vos.
              </p>
              <ul className="space-y-2">
                {[
                  'Personas en búsqueda espiritual o de bienestar',
                  'Familias que quieren vivir algo distinto juntas',
                  'Quienes nunca fueron a un retiro y quieren empezar',
                  'Los que simplemente quieren un buen fin de semana en la montaña',
                  'Quienes vienen a ver un partido del Mundial o armar una mesa de truco junto al fuego',
                  'Quienes buscan meditar, hacer silencio y vivir la experiencia del temazcal',
                ].map(i => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: C.muted }}>
                    <span className="mt-1 flex-shrink-0" style={{ color: C.green }}>—</span>{i}
                  </li>
                ))}
              </ul>
            </div>

            {/* Coaches / Emprendedores */}
            <div className="rounded-2xl p-8 border" style={{ borderColor: 'rgba(212,175,55,0.3)', backgroundColor: 'rgba(212,175,55,0.04)' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(212,175,55,0.15)' }}>
                  <Sun size={18} color="#8B6A00" />
                </div>
                <p className="font-bold text-base" style={{ color: '#7A5C00' }}>Para emprendedores, creadores y líderes</p>
              </div>
              <p className="text-sm leading-relaxed mb-5" style={{ color: C.muted }}>
                Quienes acompañan a otros, crean y lideran también necesitan recargar. Las mejores ideas, decisiones y proyectos nacen desde un lugar de claridad y presencia — no desde el agotamiento.
              </p>
              <ul className="space-y-2">
                {[
                  'Emprendedores y empresarios que quieren reconectar con el propósito',
                  'Networking orgánico con invitados especiales y referentes',
                  'Artistas, creativos y creadores de contenido buscando inspiración',
                  'Líderes, coaches y facilitadores que necesitan soltar el rol',
                ].map(i => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: C.muted }}>
                    <span className="mt-1 flex-shrink-0" style={{ color: '#8B6A00' }}>—</span>{i}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── ACTIVIDADES ── */}
      <section className="py-20 md:py-28 px-6" style={{ backgroundColor: '#F7F5F0' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14" data-reveal>
            <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold"
              style={{ backgroundColor: C.fire }}>
              Qué vas a encontrar
            </p>
            <h2 className="text-3xl md:text-4xl serif-title mb-4" style={{ color: C.dark }}>
              Cada propuesta es una puerta.<br />
              <span style={{ color: C.green }}>Vos elegís cómo transitarla.</span>
            </h2>
            <p className="text-base max-w-lg mx-auto" style={{ color: C.muted }}>
              Nada es obligatorio: son invitaciones abiertas. Sumate a las que te llamen, en el momento que quieras.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5" data-reveal data-delay="1">
            {[
              {
                Icon: Flame,
                color: C.fire,
                bg: 'rgba(170,62,17,0.07)',
                border: 'rgba(170,62,17,0.2)',
                cat: 'Ritual & Conexión',
                items: ['Ceremonia de Temazcal', 'Ceremonia de fuego', 'Círculos de palabra', 'Espacios de silencio y presencia'],
              },
              {
                Icon: Music,
                color: '#005333',
                bg: 'rgba(0,83,51,0.05)',
                border: 'rgba(0,83,51,0.15)',
                cat: 'Expresión & Comunidad',
                items: ['Ecstatic Dance y danza libre', 'Meditaciones en movimiento', 'Círculos de canto', 'Jam sessions'],
              },
              {
                Icon: Star,
                color: '#2A1708',
                bg: 'rgba(42,23,8,0.05)',
                border: 'rgba(42,23,8,0.12)',
                cat: 'Naturaleza & Conocimiento',
                items: ['Astroturismo — observación del cielo', 'Avistaje de aves', 'Caminatas conscientes', 'Interpretación del territorio'],
                note: 'walter',
              },
              {
                Icon: Heart,
                color: '#8B6A00',
                bg: 'rgba(212,175,55,0.06)',
                border: 'rgba(212,175,55,0.25)',
                cat: 'Bienestar & Integración',
                items: ['Alimentación consciente', 'Espacios de descanso', 'Integración cuerpo–mente–emociones', 'Programación especial al amanecer y atardecer'],
              },
            ].map(({ Icon, color, bg, border, cat, items, note }) => (
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
                      <span className="flex-shrink-0 mt-1" style={{ color }}>◆</span>
                      {item === 'Ceremonia de Temazcal' ? (
                        <a href="#temazcal" className="underline underline-offset-2 hover:no-underline" style={{ color }}>{item}</a>
                      ) : item}
                    </li>
                  ))}
                </ul>
                {note === 'walter' && (
                  <p className="text-xs leading-relaxed mt-5 pt-5 border-t" style={{ color: C.muted, borderColor: border }}>
                    De noche, junto a la fogata, <a href="#walter" className="underline underline-offset-2 font-semibold hover:no-underline" style={{ color }}>Walter Cejas</a> — biólogo e investigador — va a contarnos sobre las estrellas y constelaciones, y guiará el avistaje de aves y la observación de flora y fauna para quienes quieran sumarse.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUÉ ES EL TEMAZCAL ── */}
      <section id="temazcal" className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div data-reveal>
              <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold"
                style={{ backgroundColor: C.fire }}>
                Ceremonia central · Domingo
              </p>
              <h2 className="text-3xl md:text-4xl serif-title mb-5" style={{ color: C.dark }}>
                ¿Qué es el Temazcal?
              </h2>
              <p className="text-base md:text-lg leading-relaxed mb-5" style={{ color: C.muted }}>
                Una ceremonia ancestral de purificación y sanación del cuerpo físico, mental, emocional y espiritual — opcional, para quienes la sientan.
              </p>
              <p className="text-sm leading-relaxed mb-6" style={{ color: C.faint }}>
                Si tenés alguna condición de salud (presión, embarazo, problemas cardíacos o respiratorios), escribinos por WhatsApp antes de sumarte — te asesoramos para que lo disfrutes con tranquilidad.
              </p>
              <a href={WA_INFO} target="_blank" rel="noopener noreferrer"
                className="inline-block text-sm font-semibold border rounded-full px-6 py-2.5 transition-colors hover:bg-brand-green hover:text-white hover:border-brand-green"
                style={{ borderColor: 'rgba(0,83,51,0.3)', color: C.green }}>
                Consultar por WhatsApp
              </a>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl" data-reveal data-delay="1">
              <img
                src={img('/uploads/temazcal.webp', 900)}
                alt="Ceremonia de Temazcal"
                className="w-full aspect-[4/3] object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── FORMATO ── */}
      <section className="py-20 md:py-28 px-6" style={{ backgroundColor: C.night }}>
        <div className="max-w-4xl mx-auto text-center" data-reveal>
          <p className="text-[10px] tracking-[0.4em] uppercase font-semibold mb-5" style={{ color: 'rgba(212,175,55,0.6)' }}>
            Formato
          </p>
          <h2 className="text-3xl md:text-4xl serif-title text-white mb-12">
            20 y 21 de junio
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { Icon: Sun,      iconColor: C.gold,                      label: 'Ingreso abierto',        desc: 'Ambos días, todo el día' },
              { Icon: Leaf,     iconColor: 'rgba(100,200,120,0.9)',      label: 'Actividades',            desc: 'Durante toda la jornada' },
              { Icon: Star,     iconColor: 'rgba(255,255,255,0.6)',      label: 'Programación especial',  desc: 'Al amanecer y al atardecer' },
              { Icon: Flame,    iconColor: '#F4A261',                    label: 'Ceremonia central',      desc: 'Domingo 21 de junio' },
            ].map(({ Icon, iconColor, label, desc }) => (
              <div key={label} className="rounded-2xl p-6 text-center border" style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
                <div className="flex justify-center mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                    <Icon size={18} color={iconColor} />
                  </div>
                </div>
                <p className="font-semibold text-sm text-white mb-1">{label}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EQUIPO ── */}
      <section className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14" data-reveal>
            <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold"
              style={{ backgroundColor: C.green }}>
              Quiénes te acompañan
            </p>
            <h2 className="text-3xl md:text-4xl serif-title mb-4" style={{ color: C.green }}>
              Facilitadores e invitados especiales
            </h2>
            <p className="text-base max-w-lg mx-auto" style={{ color: C.muted }}>
              Un equipo y una comunidad de referentes que suman su energía a esta celebración.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5" data-reveal data-delay="1">
            {TEAM.map(({ photo, Icon, nombre, rol, desc, links }) => (
              <div key={nombre} className="rounded-2xl p-7 border" style={{ borderColor: 'rgba(0,83,51,0.1)', backgroundColor: 'rgba(0,83,51,0.02)' }}>
                {photo ? (
                  <img src={img(photo, 200)} alt={nombre} className="w-14 h-14 rounded-full object-cover mb-5" loading="lazy" />
                ) : (
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: 'rgba(0,83,51,0.08)' }}>
                    {Icon && <Icon size={20} color={C.green} />}
                  </div>
                )}
                <p className="font-bold text-base mb-1" style={{ color: C.dark }}>{nombre}</p>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: C.green }}>{rol}</p>
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{desc}</p>
                {links && links.length > 0 && (
                  <div className="flex items-center gap-2 mt-4">
                    {links.map(({ href, label, Icon: LinkIcon }) => (
                      <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-brand-green/10"
                        style={{ backgroundColor: 'rgba(0,83,51,0.06)' }}>
                        <LinkIcon size={14} color={C.green} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Invitado especial — Walter Cejas */}
          <div id="walter" className="mt-8 rounded-2xl border overflow-hidden flex flex-col sm:flex-row" data-reveal data-delay="2" style={{ borderColor: 'rgba(0,83,51,0.1)' }}>
            <div className="sm:w-28 md:w-36 flex-shrink-0">
              <img
                src={img('/uploads/Walter_E._Cejas.jpg', 400)}
                alt="Walter Eugenio Cejas"
                className="w-full h-40 sm:h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex flex-col justify-center px-6 py-5 gap-1" style={{ backgroundColor: 'rgba(0,83,51,0.02)' }}>
              <p className="inline-block text-white px-3 py-1 rounded-full text-[9px] tracking-[0.3em] uppercase font-semibold w-fit mb-1"
                style={{ backgroundColor: C.fire }}>
                Invitado especial
              </p>
              <p className="font-bold text-base" style={{ color: C.dark }}>Walter Eugenio Cejas</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.green }}>Biólogo · Investigador · Vida Silvestre</p>
              <p className="text-xs leading-relaxed mt-1" style={{ color: C.muted }}>
                Puente entre el conocimiento científico y la experiencia directa de la Sierra de Achala. En la fogata nocturna compartirá relatos sobre estrellas y constelaciones, y guiará el avistaje de aves y observación de flora y fauna para quienes quieran sumarse.
              </p>
            </div>
          </div>

          <div className="mt-16 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden" data-reveal data-delay="2" style={{ backgroundColor: C.green }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: 'rgba(212,175,55,0.25)' }} />
            <div className="relative z-10">
              <p className="text-[10px] tracking-[0.4em] uppercase font-semibold mb-4" style={{ color: 'rgba(212,175,55,0.8)' }}>Una producción de</p>
              <h3 className="text-2xl md:text-3xl serif-title text-white mb-4">Kintu</h3>
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
                  className="inline-block text-sm font-semibold border rounded-full px-6 py-2.5 transition-colors hover:bg-brand-green hover:text-white hover:border-brand-green"
                  style={{ borderColor: 'rgba(0,83,51,0.3)', color: C.green }}>
                  ¿Cómo llegar? Consultanos
                </a>
                <a href="https://www.instagram.com/pueblomagico__/" target="_blank" rel="noopener noreferrer" aria-label="Instagram de Pueblo Mágico"
                  className="w-10 h-10 rounded-full flex items-center justify-center border transition-colors hover:bg-brand-green hover:border-brand-green"
                  style={{ borderColor: 'rgba(0,83,51,0.3)' }}>
                  <Instagram size={16} color={C.green} />
                </a>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl" data-reveal data-delay="1">
              <img
                src={img('/uploads/dji_0074.webp', 900)}
                alt="Vista aérea de Pueblo Mágico"
                className="w-full aspect-[4/3] object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── PRECIOS ── */}
      <section className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14" data-reveal>
            <p className="inline-block text-white px-4 py-2 rounded-full text-[10px] tracking-[0.4em] uppercase mb-5 font-semibold"
              style={{ backgroundColor: C.green }}>
              Modalidades de participación
            </p>
            <h2 className="text-3xl md:text-4xl serif-title mb-4" style={{ color: C.green }}>
              Elegís cómo sumarte
            </h2>
            <p className="text-base max-w-lg mx-auto mb-3" style={{ color: C.muted }}>
              Podés venir a pasar el día, quedarte todo el fin de semana o sumarte a actividades puntuales.
            </p>
            <p className="text-sm font-bold" style={{ color: '#8B6A00' }}>
              ✨ Nuevo: pagá en 3 cuotas sin interés
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5" data-reveal data-delay="1">
            {/* Pase diario */}
            <div className="rounded-2xl p-7 border text-left" style={{ borderColor: '#E5DDD5', backgroundColor: C.cream }}>
              <p className="text-[10px] tracking-widest uppercase font-semibold mb-2" style={{ color: '#A0866E' }}>Pase por el día</p>
              <p className="text-3xl font-bold serif-title mb-1" style={{ color: C.dark }}>$60.000</p>
              <p className="text-xs mb-3" style={{ color: C.faint }}>por persona · un día a elección · pagando en efectivo</p>
              <p className="text-[11px] font-semibold mb-5 inline-block px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(212,175,55,0.18)', color: '#8B6A00' }}>
                💳 o 3 cuotas sin interés de $24.000
              </p>
              <ul className="space-y-2 mb-7">
                {[
                  'Acceso a todas las actividades del día',
                  'Llegás y te vas cuando quieras',
                  'Sin alojamiento ni comidas',
                ].map(i => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: C.muted }}>
                    <span className="flex-shrink-0 mt-0.5" style={{ color: C.green }}>✓</span>{i}
                  </li>
                ))}
              </ul>
              <a href={WA_RESERVA} target="_blank" rel="noopener noreferrer"
                className="block text-center py-3 px-4 rounded-xl border font-bold text-sm transition-colors hover:bg-brand-green hover:text-white hover:border-brand-green"
                style={{ borderColor: 'rgba(0,83,51,0.3)', color: C.green }}>
                Quiero el pase diario
              </a>
            </div>

            {/* Experiencia completa — habitación destacada */}
            <div className="rounded-2xl p-7 border text-left relative" style={{ borderColor: 'rgba(0,83,51,0.35)', backgroundColor: 'rgba(0,83,51,0.05)' }}>
              <span className="absolute top-4 right-4 text-[9px] tracking-widest uppercase font-bold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: C.green, color: C.gold }}>Más cómodo</span>
              <p className="text-[10px] tracking-widest uppercase font-semibold mb-2" style={{ color: C.green }}>Experiencia completa</p>
              <p className="text-3xl font-bold serif-title mb-1" style={{ color: C.green }}>$180.000</p>
              <p className="text-xs mb-3" style={{ color: '#6B4A33' }}>por persona · con habitación compartida · pagando en efectivo</p>
              <p className="text-[11px] font-semibold mb-5 inline-block px-2.5 py-1 rounded-full" style={{ backgroundColor: C.gold, color: C.green }}>
                💳 o 3 cuotas sin interés de $72.000
              </p>
              <ul className="space-y-2 mb-7">
                {[
                  'Todas las actividades ambos días',
                  'Habitación compartida',
                  'Ropa blanca, toalla y toallón individual',
                  'Todas las comidas incluidas',
                ].map(i => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#3D2516' }}>
                    <span className="flex-shrink-0 mt-0.5" style={{ color: C.green }}>✓</span>{i}
                  </li>
                ))}
              </ul>
              <a href={WA_RESERVA} target="_blank" rel="noopener noreferrer"
                className="block text-center py-3 px-4 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: C.green }}>
                Reservar habitación
              </a>
            </div>

            {/* Pijamada */}
            <div className="rounded-2xl p-7 border text-left" style={{ borderColor: 'rgba(212,175,55,0.4)', backgroundColor: 'rgba(212,175,55,0.04)' }}>
              <p className="text-[10px] tracking-widest uppercase font-semibold mb-2" style={{ color: '#8B6A00' }}>Pijamada</p>
              <p className="text-3xl font-bold serif-title mb-1" style={{ color: '#4A3210' }}>$140.000</p>
              <p className="text-xs mb-3" style={{ color: '#8B6A00' }}>por persona · pijamada en el salón · pagando en efectivo</p>
              <p className="text-[11px] font-semibold mb-5 inline-block px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(0,83,51,0.08)', color: C.green }}>
                💳 o 3 cuotas sin interés de $56.000
              </p>
              <ul className="space-y-2 mb-7">
                {[
                  'Todas las actividades ambos días',
                  'Dormís en nuestro salón principal, sobre colchón o colchoneta (cada uno trae la suya)',
                  'El resto, igual que la experiencia completa',
                  'Todas las comidas incluidas',
                ].map(i => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: C.muted }}>
                    <span className="flex-shrink-0 mt-0.5" style={{ color: '#8B6A00' }}>✓</span>{i}
                  </li>
                ))}
              </ul>
              <a href={WA_RESERVA} target="_blank" rel="noopener noreferrer"
                className="block text-center py-3 px-4 rounded-xl border font-bold text-sm transition-colors"
                style={{ borderColor: 'rgba(212,175,55,0.4)', color: '#7A5C00', backgroundColor: 'rgba(212,175,55,0.08)' }}>
                Reservar pijamada
              </a>
            </div>
          </div>

          <p className="text-center text-sm mt-8" style={{ color: C.faint }}>
            ¿Dudas sobre qué opción elegir?{' '}
            <a href={WA_INFO} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2" style={{ color: C.green }}>
              Escribinos por WhatsApp
            </a>{' '}
            y te ayudamos.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 md:py-28 px-6 bg-white">
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

      {/* ── CTA FINAL ── */}
      <section
        className="py-28 md:py-40 px-6 text-white text-center relative overflow-hidden"
        style={{ backgroundImage: `url(${img('/uploads/fogon_nocturno.webp', 1600)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: 'rgba(10,20,12,0.88)' }} />
        <div className="max-w-2xl mx-auto relative z-10" data-reveal>
          <div className="flex justify-center mb-8">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(170,62,17,0.3)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <Flame size={26} color={C.gold} />
            </div>
          </div>
          <h2 className="text-3xl md:text-5xl serif-title text-white mb-6 leading-tight">
            Sumate a la celebración
          </h2>
          <p className="text-base leading-relaxed mb-4 max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.65)' }}>
            A compartir el fuego. A cantar en comunidad.<br />A mirar el cielo. A escuchar la tierra.
          </p>
          <p className="font-serif italic mb-10" style={{ color: C.gold }}>
            Y a recordar, juntos, lo esencial.
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
            20 y 21 de junio · Pueblo Mágico, Los Gigantes, Córdoba
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default IntiRaymi;
