import React, { useMemo } from 'react';
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  Check,
  ChefHat,
  Flame,
  HeartHandshake,
  Instagram,
  Leaf,
  MapPin,
  Mountain,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Sun,
  Users,
  Waves,
  Wifi,
} from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { CookieBanner } from '../components/CookieBanner';
import { WA_MAGICO } from './data/config';
import { img } from './lib/img';
import { usePrivateProposalMeta } from './hooks/usePrivateProposalMeta';

const C = {
  green: '#064D3B',
  dark: '#082F27',
  gold: '#C9A94E',
  cream: '#FBF8F0',
  sand: '#EFE8DA',
  clay: '#A45B3D',
  ink: '#1F2A25',
  muted: '#66746C',
};

const HIGHLIGHTS = [
  'Retiro privado de 2 o 3 noches',
  'Entre 12 y 16 participantes',
  'Equipo organizador de hasta 6 personas',
  'Reserva exclusiva de Pueblo Mágico',
  'Gastronomía consciente premium',
  'Equipo de hospitalidad reforzado',
  'Experiencias especiales de transformación',
  'Coordinación logística y preparación anticipada',
];

const SPACE_GROUPS = [
  {
    title: 'Alojamiento',
    Icon: BedDouble,
    items: [
      'Eco-refugio de montaña con habitaciones compartidas',
      'Domos geodésicos',
      'Distribución personalizada de las plazas según las necesidades del grupo',
    ],
  },
  {
    title: 'Espacios para actividades',
    Icon: Mountain,
    items: [
      'Salón panorámico multiuso',
      'Espacios naturales para prácticas grupales',
      'Fogón y sectores exteriores',
      'Áreas destinadas a actividades de transformación',
      'Río, arroyo y senderos de montaña',
    ],
  },
  {
    title: 'Servicios e instalaciones',
    Icon: Wifi,
    items: [
      'Cocina equipada y comedor',
      'Baños y duchas con agua caliente',
      'Energía solar',
      'WiFi en áreas comunes',
      'Espacios de descanso y encuentro',
    ],
  },
];

const MEALS = [
  'Desayunos completos',
  'Almuerzos nutritivos y abundantes',
  'Meriendas',
  'Cenas especialmente preparadas',
  'Agua potable e infusiones durante las jornadas',
  'Alternativas vegetarianas y adaptación a requerimientos informados',
  'Horarios y menú coordinados con el equipo facilitador',
];

const HOSPITALITY = [
  'Coordinación previa con el equipo organizador',
  'Planificación de espacios y servicios',
  'Atención gastronómica',
  'Limpieza y mantenimiento de instalaciones',
  'Acompañamiento logístico durante las actividades',
  'Asistencia operativa y resolución de imprevistos dentro de los servicios acordados',
];

const EXPERIENCES = [
  {
    title: 'Temazcal',
    Icon: Flame,
    image: '/uploads/Ciclo Femenino/Temazcal.jpeg',
    alt: 'Temazcal en Pueblo Mágico',
    text: 'Ceremonia para todos los participantes y el equipo facilitador, con preparación del espacio y coordinación con el equipo responsable.',
  },
  {
    title: 'Inmersión en hielo',
    Icon: Snowflake,
    image: '/uploads/sunset-rio-ice-bath.webp',
    alt: 'Experiencia de inmersión en hielo',
    text: 'Provisión y traslado de 600 kg de hielo, con necesidades de almacenamiento, preparación y distribución coordinadas previamente.',
  },
  {
    title: 'Caminata sobre fuego',
    Icon: Sun,
    image: '/uploads/propuestas/jesus-cordoba-firewalk-v2.webp',
    alt: 'Visual ilustrativo de una caminata sobre brasas preparadas',
    text: 'Disponibilidad de un sector natural de aproximadamente 20 × 20 metros, sujeto a condiciones ambientales, prevención de incendios, permisos y protocolos técnicos.',
  },
];

const OPTION_ONE = [
  'Hasta 16 participantes',
  'Hasta 6 integrantes del equipo organizador',
  'Alojamiento y alimentación completa durante el retiro',
  'Uso exclusivo del ecocentro',
  'Gastronomía consciente premium',
  'Dos anfitriones adicionales dedicados',
  'Temazcal para todos los participantes y equipo facilitador',
  'Provisión y traslado de 600 kg de hielo',
  'Disponibilidad de sector para caminata sobre fuego',
  'Coordinación logística y operativa',
];

const CONDITIONS = [
  'Valores expresados en pesos argentinos.',
  'Tarifa integral para grupos de 12 a 16 participantes, sin modificación por menor ocupación dentro de ese rango.',
  'Se contemplan hasta 6 integrantes del equipo organizador.',
  'Los servicios especiales incluidos están sujetos a planificación y condiciones técnicas.',
  'Las jornadas adicionales de preparación o desmontaje se acordarán previamente.',
  'Fechas, condiciones de reserva, pagos y vigencia de la propuesta: a confirmar.',
];

const Eyebrow: React.FC<{ children: React.ReactNode; light?: boolean }> = ({ children, light = false }) => (
  <p className="text-[10px] font-bold uppercase tracking-[0.34em]" style={{ color: light ? C.gold : C.clay }}>{children}</p>
);

const CheckList: React.FC<{ items: string[]; light?: boolean }> = ({ items, light = false }) => (
  <ul className="grid gap-3">
    {items.map(item => (
      <li key={item} className="flex items-start gap-3 text-sm leading-relaxed md:text-base" style={{ color: light ? 'rgba(255,255,255,.75)' : C.muted }}>
        <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: C.gold }} strokeWidth={2.2} aria-hidden="true" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const PropuestaJesusCordoba: React.FC = () => {
  usePrivateProposalMeta('Retiro de Alto Impacto · Propuesta para Jesús Córdoba · Pueblo Mágico');

  const whatsappHref = useMemo(() => {
    const message = encodeURIComponent('Hola Pueblo Mágico. Soy Jesús Córdoba / parte de su equipo y quiero coordinar los detalles de la propuesta de Retiro de Alto Impacto.');
    return `https://wa.me/${WA_MAGICO}?text=${message}`;
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: C.cream, color: C.ink }}>
      <Header autoSubNavigation={false} />
      <main>
        <section className="relative flex min-h-[100svh] items-end overflow-hidden pb-14 pt-36 md:pb-24 md:pt-44">
          <img
            src={img('/uploads/dji_0074.webp', 2000)}
            alt="Vista panorámica de Pueblo Mágico y las Sierras Grandes"
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#061f1a] via-[#082f27]/65 to-black/20" />
          <div className="relative z-10 mx-auto w-full max-w-6xl px-5 md:px-12">
            <div className="max-w-4xl">
              <div className="mb-6 flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur-md">
                  <MapPin size={14} aria-hidden="true" /> Sierras Grandes · Córdoba
                </div>
                <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/25 bg-black/15 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/90 backdrop-blur-md">
                  <CalendarDays size={14} className="shrink-0" aria-hidden="true" /> Finde de carnaval 2027 · 6 al 9 de febrero
                </div>
              </div>
              <Eyebrow light>Propuesta de experiencia exclusiva</Eyebrow>
              <p className="mt-5 text-sm font-medium tracking-[0.18em] text-white/75">Pueblo Mágico × Jesús Córdoba</p>
              <h1 className="serif-title mt-4 max-w-4xl text-4xl leading-[1.04] text-white sm:text-5xl md:text-7xl">
                Un territorio extraordinario para una <span style={{ color: C.gold }}>experiencia transformadora.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 md:text-xl">
                Una propuesta personalizada de hospitalidad, infraestructura y producción integral, diseñada especialmente para Jesús Córdoba y su equipo.
              </p>
              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <a href="#inversion" className="btn-gold btn-icon-inline max-w-full text-[11px] font-semibold sm:text-sm">
                  Conocer la propuesta <ArrowRight size={18} aria-hidden="true" />
                </a>
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn-glass inline-flex items-center justify-center text-center text-[11px] font-semibold sm:text-sm">
                  Coordinar detalles
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-20 md:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <Eyebrow>Nuestra propuesta</Eyebrow>
              <h2 className="serif-title mt-5 text-4xl leading-tight md:text-6xl" style={{ color: C.green }}>Mucho más que un lugar. Un aliado para crear experiencias extraordinarias.</h2>
              <p className="mt-6 text-base leading-relaxed md:text-lg" style={{ color: C.muted }}>
                En el corazón de las Sierras Grandes, abrimos Pueblo Mágico de manera exclusiva para que la energía esté puesta en lo verdaderamente importante: la experiencia de los participantes.
              </p>
            </div>
            <div>
              <div className="space-y-5 text-base leading-relaxed md:text-lg" style={{ color: C.muted }}>
                <p>Un retiro de alto impacto requiere privacidad, planificación, atención personalizada, flexibilidad y un equipo capaz de acompañar las necesidades particulares de cada momento.</p>
                <p>Por eso ponemos a disposición el territorio, las instalaciones y nuestro equipo para acompañar la experiencia de manera integral.</p>
              </div>
              <div className="mt-9 grid gap-3 sm:grid-cols-2">
                {HIGHLIGHTS.map(item => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-[#064D3B]/10 p-4" style={{ backgroundColor: C.cream }}>
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0" style={{ color: C.gold }} aria-hidden="true" />
                    <span className="text-sm leading-relaxed" style={{ color: C.ink }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 md:py-28" style={{ backgroundColor: C.sand }}>
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <Eyebrow>El espacio</Eyebrow>
              <h2 className="serif-title mt-5 text-4xl leading-tight md:text-6xl" style={{ color: C.green }}>Un santuario natural reservado exclusivamente para ustedes.</h2>
              <p className="mt-6 text-base leading-relaxed md:text-lg" style={{ color: C.muted }}>
                Durante el retiro no habrá huéspedes externos ni actividades simultáneas. La totalidad de la infraestructura operativa estará a disposición del grupo, con una distribución acordada previamente.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-12 gap-3 md:gap-5">
              <img src={img('/uploads/refu.webp', 1200)} alt="Eco-refugio de Pueblo Mágico" className="col-span-12 h-72 rounded-3xl object-cover md:col-span-7 md:h-[430px]" loading="lazy" />
              <div className="col-span-12 grid grid-cols-2 gap-3 md:col-span-5 md:gap-5">
                <img src={img('/uploads/domos_2.jpg', 800)} alt="Domos geodésicos en la montaña" className="col-span-2 h-48 w-full rounded-3xl object-cover md:h-52" loading="lazy" />
                <img src={img('/uploads/events/colibri/salon-piedra.jpg', 700)} alt="Salón panorámico de piedra" className="h-40 w-full rounded-2xl object-cover md:h-52" loading="lazy" />
                <img src={img('/uploads/img_6948.webp', 700)} alt="Paisaje y senderos de montaña" className="h-40 w-full rounded-2xl object-cover md:h-52" loading="lazy" />
              </div>
            </div>
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {SPACE_GROUPS.map(({ title, Icon, items }) => (
                <article key={title} className="rounded-3xl bg-white p-7 shadow-sm md:p-8">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: '#064D3B10' }}>
                    <Icon size={21} style={{ color: C.green }} aria-hidden="true" />
                  </div>
                  <h3 className="serif-title mt-5 text-2xl" style={{ color: C.green }}>{title}</h3>
                  <div className="mt-5"><CheckList items={items} /></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-20 md:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
            <div className="relative overflow-hidden rounded-[2rem]">
              <img src={img('/uploads/propuestas/jesus-cordoba-gastronomia-v2.webp', 1100)} alt="Visual ilustrativo de una mesa de gastronomía consciente en la montaña" className="h-[440px] w-full object-cover md:h-[620px]" loading="lazy" />
              <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/20 bg-[#082F27]/90 p-5 text-white backdrop-blur-md md:inset-x-7 md:bottom-7 md:p-7">
                <ChefHat size={23} style={{ color: C.gold }} aria-hidden="true" />
                <p className="serif-title mt-3 text-2xl md:text-3xl">Alimentación que acompaña la transformación.</p>
              </div>
            </div>
            <div>
              <Eyebrow>Gastronomía consciente premium</Eyebrow>
              <h2 className="serif-title mt-5 text-4xl leading-tight md:text-6xl" style={{ color: C.green }}>Cocina cuidada, equilibrada y flexible.</h2>
              <p className="mt-6 text-base leading-relaxed md:text-lg" style={{ color: C.muted }}>
                Preparaciones caseras, ingredientes frescos y productos de calidad, pensados para acompañar el trabajo físico y emocional de los participantes e integrarse naturalmente al ritmo del retiro.
              </p>
              <div className="mt-8"><CheckList items={MEALS} /></div>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 text-white md:py-28" style={{ backgroundColor: C.dark }}>
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <Eyebrow light>Hospitalidad y acompañamiento</Eyebrow>
              <h2 className="serif-title mt-5 text-4xl leading-tight md:text-6xl">Un equipo dedicado a cuidar cada detalle.</h2>
              <p className="mt-6 text-base leading-relaxed text-white/70 md:text-lg">
                Además de nuestro equipo operativo habitual, destinaremos dos anfitriones adicionales especialmente asignados al retiro para acompañar la hospitalidad, los espacios, los servicios y la logística.
              </p>
              <div className="mt-8 rounded-2xl border border-white/15 bg-white/[0.06] p-6">
                <HeartHandshake size={24} style={{ color: C.gold }} aria-hidden="true" />
                <p className="serif-title mt-4 text-2xl leading-snug">Jesús y su equipo podrán concentrarse plenamente en facilitar; nosotros nos ocuparemos de que todo funcione de manera fluida, cuidada y profesional.</p>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-7 md:p-10">
              <CheckList items={HOSPITALITY} light />
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-20 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <Eyebrow>Experiencias especiales incluidas</Eyebrow>
              <h2 className="serif-title mt-5 text-4xl leading-tight md:text-6xl" style={{ color: C.green }}>Infraestructura y logística para experiencias de alto impacto.</h2>
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {EXPERIENCES.map(({ title, Icon, image, alt, text }) => (
                <article key={title} className="overflow-hidden rounded-3xl border border-[#064D3B]/10 bg-white shadow-sm">
                  <img src={img(image, 850)} alt={alt} className="h-56 w-full object-cover" loading="lazy" />
                  <div className="p-7">
                    <div className="flex items-center gap-3">
                      <Icon size={21} style={{ color: C.clay }} aria-hidden="true" />
                      <h3 className="serif-title text-2xl" style={{ color: C.green }}>{title}</h3>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed" style={{ color: C.muted }}>{text}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="mx-auto mt-8 flex max-w-4xl items-start gap-3 rounded-2xl border border-[#C9A94E]/35 p-6" style={{ backgroundColor: C.cream }}>
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" style={{ color: C.green }} aria-hidden="true" />
              <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
                La facilitación, dirección técnica, materiales específicos y seguridad de la caminata sobre fuego estarán a cargo del equipo organizador, con responsabilidades acordadas previamente.
              </p>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 md:py-28" style={{ backgroundColor: C.sand }}>
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-center">
            <div>
              <Eyebrow>Condiciones especiales para el equipo facilitador</Eyebrow>
              <h2 className="serif-title mt-5 text-4xl leading-tight md:text-6xl" style={{ color: C.green }}>Queremos que se sientan en casa.</h2>
              <p className="mt-6 text-base leading-relaxed md:text-lg" style={{ color: C.muted }}>
                Como parte de esta colaboración, contemplamos condiciones especiales para que el equipo llegue con tiempo, prepare la experiencia y pueda habitar el retiro con tranquilidad.
              </p>
            </div>
            <div className="grid gap-4">
              {[
                { title: 'Facilitadores principales', text: 'Jesús y su pareja contarán con alojamiento y alimentación completamente liberados durante el retiro, sin costo adicional.' },
                { title: 'Equipo de apoyo', text: 'Alojamiento y alimentación de hasta cuatro integrantes adicionales del equipo organizador, incluidos dentro de la inversión integral.' },
                { title: 'Preparación anticipada', text: 'Posibilidad de ingreso una jornada antes para preparación y montaje. Horarios, alimentación, alojamiento, asistencia operativa y una eventual permanencia posterior se coordinarán previamente.' },
              ].map(({ title, text }, index) => (
                <article key={title} className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
                  <div className="flex items-start gap-4">
                    <span className="serif-title text-3xl" style={{ color: C.gold }}>0{index + 1}</span>
                    <div><h3 className="font-bold" style={{ color: C.green }}>{title}</h3><p className="mt-2 text-sm leading-relaxed" style={{ color: C.muted }}>{text}</p></div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="inversion" className="px-5 py-20 text-white md:py-28" style={{ backgroundColor: C.green }}>
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <Eyebrow light>Inversión</Eyebrow>
              <h2 className="serif-title mt-5 text-4xl leading-tight md:text-6xl">Una propuesta integral, exclusiva y personalizada.</h2>
              <p className="mt-5 text-base leading-relaxed text-white/70 md:text-lg">Dos alternativas para acompañar la duración elegida, siempre con el espacio, la gastronomía y el equipo dedicados al retiro.</p>
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              <article className="rounded-3xl bg-white p-7 text-left shadow-2xl md:p-10" style={{ color: C.ink }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: C.clay }}>Opción 1</p>
                <h3 className="serif-title mt-3 text-3xl md:text-4xl" style={{ color: C.green }}>Experiencia de 2 noches</h3>
                <p className="serif-title mt-7 text-4xl md:text-5xl" style={{ color: C.dark }}>$13.800.000 <span className="text-base font-sans font-semibold">ARS</span></p>
                <p className="mt-2 text-sm" style={{ color: C.muted }}>Inversión total por la experiencia integral.</p>
                <div className="my-7 h-px bg-[#064D3B]/10" />
                <CheckList items={OPTION_ONE} />
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn-gold btn-icon-inline mt-8 max-w-full text-[11px] font-semibold sm:text-sm">Coordinar esta opción <ArrowRight size={17} aria-hidden="true" /></a>
              </article>
              <article className="rounded-3xl border border-white/15 bg-white/[0.07] p-7 text-left backdrop-blur-sm md:p-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: C.gold }}>Opción 2</p>
                <h3 className="serif-title mt-3 text-3xl md:text-4xl">Experiencia de 3 noches</h3>
                <p className="serif-title mt-7 text-4xl md:text-5xl">$17.500.000 <span className="text-base font-sans font-semibold text-white/70">ARS</span></p>
                <p className="mt-2 text-sm text-white/65">Inversión total por la experiencia integral.</p>
                <div className="my-7 h-px bg-white/15" />
                <p className="text-base leading-relaxed text-white/80">Incluye los mismos servicios de la opción de 2 noches, extendidos a tres noches, con una jornada adicional de alojamiento, gastronomía y acompañamiento operativo.</p>
                <div className="mt-7 rounded-2xl border border-white/15 bg-black/10 p-6">
                  <p className="font-semibold">La alternativa más inmersiva</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">Más tiempo para integrar el proceso, habitar el territorio y sostener el ritmo de la experiencia sin apuros.</p>
                </div>
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3 text-center text-[11px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-[#064D3B] sm:text-sm">Coordinar esta opción <ArrowRight size={17} aria-hidden="true" /></a>
              </article>
            </div>
            <div className="mt-8 rounded-3xl border border-white/10 bg-black/10 p-7 md:p-9">
              <h3 className="serif-title text-2xl md:text-3xl">Condiciones generales</h3>
              <div className="mt-6 grid gap-x-10 gap-y-3 md:grid-cols-2"><CheckList items={CONDITIONS} light /></div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden px-5 py-24 text-white md:py-36">
          <img src={img('/uploads/campoentero.webp', 1800)} alt="Pueblo Mágico en el paisaje de las Sierras Grandes" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-[#082F27]/85" />
          <div className="relative z-10 mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
            <div className="mx-auto w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur-sm">
              <img src={img('/uploads/propuestas/jesus-cordoba-retrato.webp', 800)} alt="Jesús Córdoba, facilitador de la experiencia" className="aspect-[4/5] w-full rounded-[1.4rem] object-cover object-top" loading="lazy" />
              <div className="flex items-center justify-between gap-4 px-3 py-4">
                <div>
                  <p className="serif-title text-2xl">Jesús Córdoba</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/55">Facilitador principal</p>
                </div>
                <a href="https://www.instagram.com/jesuscordoba.oficial/" target="_blank" rel="noopener noreferrer" aria-label="Instagram de Jesús Córdoba" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 transition-colors hover:bg-white hover:text-[#064D3B]">
                  <Instagram size={19} aria-hidden="true" />
                </a>
              </div>
            </div>
            <div className="text-center lg:text-left">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 lg:mx-0"><Leaf size={25} style={{ color: C.gold }} aria-hidden="true" /></div>
              <Eyebrow light>Una alianza para crear experiencias que dejan huella</Eyebrow>
              <h2 className="serif-title mt-5 text-4xl leading-tight md:text-6xl">Los grandes procesos de transformación necesitan entornos que acompañen su profundidad.</h2>
              <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-white/70 md:text-lg lg:mx-0">Nos entusiasma la posibilidad de trabajar junto a Jesús y su equipo, poniendo nuestro territorio y experiencia al servicio de esta propuesta, y que este encuentro sea el comienzo de una colaboración a largo plazo.</p>
              <a href="https://www.instagram.com/jesuscordoba.oficial/" target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/80 underline decoration-[#C9A94E] underline-offset-8 transition-colors hover:text-white">
                <Instagram size={17} aria-hidden="true" /> @jesuscordoba.oficial
              </a>
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-20 text-center md:py-28">
          <div className="mx-auto max-w-3xl">
            <Waves className="mx-auto h-8 w-8" style={{ color: C.gold }} aria-hidden="true" />
            <Eyebrow>Hagamos realidad esta experiencia</Eyebrow>
            <h2 className="serif-title mt-5 text-4xl leading-tight md:text-6xl" style={{ color: C.green }}>Coordinemos los detalles y avancemos con la reserva de fechas.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed md:text-lg" style={{ color: C.muted }}>Estamos disponibles para ajustar la planificación operativa y terminar de diseñar cada momento junto al equipo.</p>
            <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn-gold btn-icon-inline max-w-full text-[11px] font-semibold sm:text-sm">Coordinar detalles de la propuesta <ArrowRight size={18} aria-hidden="true" /></a>
              <a href="/" className="inline-flex items-center justify-center rounded-full border border-[#064D3B]/20 px-6 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors hover:bg-[#064D3B] hover:text-white sm:text-sm" style={{ color: C.green }}>Conocer Pueblo Mágico</a>
            </div>
            <p className="mt-10 text-xs uppercase tracking-[0.2em]" style={{ color: C.muted }}>Pueblo Mágico · Ecocentro de Montaña · Sierras Grandes · Córdoba · Argentina</p>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
      <CookieBanner />
    </div>
  );
};

export default PropuestaJesusCordoba;
