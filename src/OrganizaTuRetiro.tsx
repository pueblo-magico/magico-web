import React, { useEffect } from 'react';
import {
  ArrowRight,
  BedDouble,
  Check,
  ChefHat,
  HeartHandshake,
  Leaf,
  MapPin,
  Mountain,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { CookieBanner } from '../components/CookieBanner';
import { img } from './lib/img';
import { SITE_URL, WA_MAGICO } from './data/config';
import { ROUTES } from './routes';

const COLORS = {
  green: '#005333',
  darkGreen: '#003D27',
  gold: '#D4AF37',
  cream: '#FDFBF7',
  sand: '#F3EEE5',
  terra: '#AA3E11',
  brown: '#2A1708',
  muted: '#6B4A33',
};

const WHATSAPP_MESSAGE = encodeURIComponent(
  '¡Hola! Quiero organizar un retiro en Pueblo Mágico. ¿Podemos conversar sobre el grupo, las fechas y la propuesta?'
);
const WHATSAPP_HREF = `https://wa.me/${WA_MAGICO}?text=${WHATSAPP_MESSAGE}`;

const INCLUDED = [
  {
    Icon: BedDouble,
    title: 'Alojamiento compartido',
    text: 'Habitaciones en el eco-refugio y domos geodésicos, con ropa blanca, toallas y biocosmética.',
  },
  {
    Icon: ChefHat,
    title: 'Alimentación completa',
    text: 'Cocina casera, abundante y equilibrada, con adaptaciones alimentarias informadas previamente.',
  },
  {
    Icon: Mountain,
    title: 'Todo el predio',
    text: 'Uso de los espacios comunes y del entorno natural para sostener la experiencia de tu grupo.',
  },
  {
    Icon: HeartHandshake,
    title: 'Coordinación integral',
    text: 'Equipo anfitrión y coordinación general presentes durante toda la experiencia.',
  },
  {
    Icon: Sparkles,
    title: 'Dinámicas acordadas',
    text: 'Las actividades y dinámicas definidas dentro de la propuesta base de cada retiro.',
  },
  {
    Icon: ShieldCheck,
    title: 'Cobertura incluida',
    text: 'Seguro de responsabilidad civil y accidentes personales durante la estadía.',
  },
];

const ADDITIONAL_EXPERIENCES = [
  'Yoga y consciencia corporal',
  'Armonizaciones sonoras',
  'Constelaciones familiares',
  'Trekking guiado',
  'Ceremonia de temazcal',
  'Ceremonias ancestrales',
];

const PACKAGE_OPTIONS = [
  {
    duration: '2 noches / 3 días',
    price: '$300.000',
    meals: ['2 desayunos', '2 almuerzos', '2 cenas', 'Brunch permanente'],
  },
  {
    duration: '3 noches / 4 días',
    price: '$400.000',
    meals: ['3 desayunos', '3 almuerzos', '3 cenas', 'Brunch permanente'],
  },
  {
    duration: '4 noches / 5 días',
    price: '$490.000',
    meals: ['4 desayunos', '4 almuerzos', '4 cenas', 'Brunch permanente'],
    featured: true,
  },
];

const useRetreatSeo = () => {
  useEffect(() => {
    const title = 'Organizá tu Retiro en Pueblo Mágico | Los Gigantes, Córdoba';
    const description = 'Organizá un retiro all inclusive para 15 a 30 personas en Pueblo Mágico: alojamiento, pensión completa, coordinación, actividades, seguros y equipo anfitrión.';
    const canonical = `${SITE_URL}${ROUTES.ORGANIZA_TU_RETIRO}`;
    const imageUrl = `${SITE_URL}/uploads/dji_0074.webp`;
    const previousTitle = document.title;

    document.title = title;

    const setMeta = (selector: string, attribute: string, value: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, value);
    };

    const setCanonical = (href: string) => {
      let element = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', 'canonical');
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:image"]', 'content', imageUrl);
    setMeta('meta[property="og:url"]', 'content', canonical);
    setMeta('meta[property="og:type"]', 'content', 'website');
    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('meta[name="twitter:image"]', 'content', imageUrl);
    setCanonical(canonical);

    return () => {
      document.title = previousTitle;
    };
  }, []);
};

const OrganizaTuRetiro: React.FC = () => {
  useRetreatSeo();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -36px 0px' }
    );

    document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: COLORS.cream, color: COLORS.brown }}>
      <Header />

      <main>
        <section className="relative flex min-h-[92vh] items-end overflow-hidden pt-28">
          <img
            src={img('/uploads/dji_0074.webp', 1800)}
            alt="Pueblo Mágico visto desde el aire en las Sierras Grandes de Córdoba"
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />

          <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-16 md:px-12 md:pb-24" data-reveal>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/90 backdrop-blur-sm">
              <MapPin size={14} aria-hidden="true" />
              Los Gigantes · Córdoba
            </div>
            <h1 className="serif-title max-w-4xl text-5xl leading-[1.02] text-white md:text-7xl lg:text-8xl">
              Tu retiro en la montaña,
              <span className="block" style={{ color: COLORS.gold }}>con cada detalle resuelto.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-relaxed text-white/80 md:text-xl">
              Co-diseñamos un encuentro que integra naturaleza, aventura y profundidad, para que vos y tu grupo puedan enfocarse en compartir y vivir una experiencia significativa.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold inline-flex items-center justify-center gap-2 text-sm font-semibold"
              >
                Quiero organizar un retiro
                <ArrowRight size={18} aria-hidden="true" />
              </a>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-white/75">
                <span>15 a 30 personas</span>
                <span>2 a 4 noches</span>
                <span>All inclusive</span>
              </div>
            </div>
          </div>
        </section>

        <section id="propuesta" className="bg-white px-6 py-20 md:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div data-reveal>
              <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: COLORS.terra }}>
                El espíritu de la experiencia
              </p>
              <h2 className="serif-title text-4xl leading-tight md:text-6xl" style={{ color: COLORS.green }}>
                Más que alojar un grupo, sostenemos el encuentro.
              </h2>
            </div>
            <div className="space-y-5 text-base leading-relaxed md:text-lg" style={{ color: COLORS.muted }} data-reveal data-delay="1">
              <p>
                Esta propuesta es para personas que buscan ir un paso más allá: integrar lo vivido, fortalecer vínculos y habitar la montaña desde un lugar más consciente.
              </p>
              <p>
                Nos ocupamos del alojamiento, la alimentación, los espacios, la coordinación y el cuidado del grupo, para que vos puedas estar presente en el propósito de tu retiro.
              </p>
              <div className="rounded-2xl border-l-4 px-6 py-5" style={{ backgroundColor: '#F6F3EA', borderColor: COLORS.gold }}>
                <p className="serif-title text-2xl leading-snug" style={{ color: COLORS.darkGreen }}>
                  Naturaleza, profundidad y comunidad, con un equipo anfitrión que acompaña cada momento.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="formatos" className="px-6 py-20 md:py-28" style={{ backgroundColor: COLORS.sand }}>
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-14 max-w-3xl text-center" data-reveal>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: COLORS.terra }}>
                Formatos all inclusive
              </p>
              <h2 className="serif-title text-4xl leading-tight md:text-6xl" style={{ color: COLORS.green }}>
                Elegí el tiempo que necesita tu grupo
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed" style={{ color: COLORS.muted }}>
                Tres formatos para grupos de 15 a 30 personas. El valor incluye alojamiento, pensión completa y la experiencia integral.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {PACKAGE_OPTIONS.map((option, index) => (
                <article
                  key={option.duration}
                  className="relative overflow-hidden rounded-3xl border bg-white p-8 shadow-sm md:p-10"
                  style={{ borderColor: option.featured ? 'rgba(0,83,51,0.35)' : 'rgba(107,74,51,0.15)' }}
                  data-reveal
                  data-delay={String(index + 1)}
                >
                  {option.featured && (
                    <span className="absolute right-5 top-5 rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white" style={{ backgroundColor: COLORS.green }}>
                      Más tiempo para integrar
                    </span>
                  )}
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em]" style={{ color: COLORS.terra }}>Retiro residencial</p>
                  <h3 className="serif-title mt-3 text-3xl md:text-4xl" style={{ color: COLORS.green }}>{option.duration}</h3>
                  <div className="my-7 flex items-end gap-2 border-y py-6" style={{ borderColor: 'rgba(0,83,51,0.12)' }}>
                    <span className="serif-title text-4xl font-semibold" style={{ color: COLORS.brown }}>{option.price}</span>
                    <span className="pb-1 text-xs" style={{ color: COLORS.muted }}>ARS / persona</span>
                  </div>
                  <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: COLORS.green }}>Alimentación incluida</p>
                  <ul className="grid grid-cols-2 gap-3">
                    {option.meals.map((meal) => (
                      <li key={meal} className="flex items-start gap-2 text-sm" style={{ color: COLORS.muted }}>
                        <Check size={17} className="mt-0.5 shrink-0" style={{ color: COLORS.green }} aria-hidden="true" />
                        {meal}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <p className="mt-6 text-center text-xs leading-relaxed" style={{ color: COLORS.muted }} data-reveal>
              Cocina casera, abundante y equilibrada. Adaptamos el menú a restricciones alimentarias informadas previamente.
            </p>

            <div
              className="mx-auto mt-8 flex max-w-3xl flex-col gap-4 rounded-2xl border bg-white p-6 text-left shadow-sm sm:flex-row sm:items-start"
              style={{ borderColor: 'rgba(0,83,51,0.16)' }}
              data-reveal
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: 'rgba(0,83,51,0.08)', color: COLORS.green }}
              >
                <ShieldCheck size={20} aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: COLORS.green }}>
                  Condiciones de la propuesta
                </p>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: COLORS.muted }}>
                  Los valores son válidos para retiros con un mínimo de 15 participantes. El acuerdo se confirma y la fecha queda reservada una vez acreditada la seña acordada.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="alojamiento" className="bg-white px-6 py-20 md:py-32">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
            <div className="grid grid-cols-2 gap-3" data-reveal>
              <img
                src={img('/uploads/refu.webp', 900)}
                alt="Refugio de piedra de Pueblo Mágico"
                className="col-span-2 h-72 w-full rounded-3xl object-cover md:h-80"
                loading="lazy"
              />
              <img
                src={img('/uploads/domos_2.jpg', 700)}
                alt="Domos geodésicos de Pueblo Mágico"
                className="h-44 w-full rounded-2xl object-cover"
                loading="lazy"
              />
              <img
                src={img('/uploads/469280911_444096748740233_2818770490495002077_n.webp', 700)}
                alt="Salón para prácticas grupales en Pueblo Mágico"
                className="h-44 w-full rounded-2xl object-cover"
                loading="lazy"
              />
            </div>

            <div data-reveal data-delay="1">
              <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: COLORS.terra }}>
                Alojamiento y espacios
              </p>
              <h2 className="serif-title text-4xl leading-tight md:text-6xl" style={{ color: COLORS.green }}>
                Dormir en la montaña también es parte del retiro.
              </h2>
              <p className="mt-6 text-base leading-relaxed md:text-lg" style={{ color: COLORS.muted }}>
                El grupo se aloja en habitaciones compartidas dentro de nuestro eco-refugio y en domos geodésicos compartidos. Ambas opciones priorizan el confort, la calidez y la conexión directa con el paisaje.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  'Habitaciones compartidas en el eco-refugio',
                  'Domos geodésicos compartidos',
                  'Ropa blanca, toallas y biocosmética',
                  'Uso completo del predio y espacios comunes',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-medium" style={{ color: COLORS.brown }}>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(0,83,51,0.08)', color: COLORS.green }}>
                      <Check size={15} aria-hidden="true" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="incluye" className="px-6 py-20 md:py-28" style={{ backgroundColor: COLORS.green }}>
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-14 max-w-3xl text-center" data-reveal>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: COLORS.gold }}>Todo incluido</p>
              <h2 className="serif-title text-4xl leading-tight text-white md:text-6xl">
                El sostén que te permite dedicarte a facilitar
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/65">
                Resolvemos la hospitalidad y la coordinación para que el retiro tenga un contenedor cuidado de principio a fin.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {INCLUDED.map(({ Icon, title, text }, index) => (
                <article
                  key={title}
                  className="rounded-2xl border border-white/10 bg-white/[0.06] p-7 backdrop-blur-sm"
                  data-reveal
                  data-delay={String((index % 3) + 1)}
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(212,175,55,0.14)', color: COLORS.gold }}>
                    <Icon size={21} aria-hidden="true" />
                  </div>
                  <h3 className="serif-title text-xl text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/60">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="experiencias" className="bg-white px-6 py-20 md:py-32">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div data-reveal>
              <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: COLORS.terra }}>
                Experiencias adicionales
              </p>
              <h2 className="serif-title text-4xl leading-tight md:text-6xl" style={{ color: COLORS.green }}>
                Sumá la práctica que resuene con tu propuesta.
              </h2>
              <p className="mt-6 max-w-xl text-base leading-relaxed md:text-lg" style={{ color: COLORS.muted }}>
                En Pueblo Mágico trabajamos con una amplia red de facilitadores y facilitadoras. Podemos cotizar experiencias adicionales que potencien el propósito de tu retiro.
              </p>
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 text-sm font-bold"
                style={{ color: COLORS.green }}
              >
                Consultar una experiencia
                <ArrowRight size={17} aria-hidden="true" />
              </a>
            </div>

            <div className="relative overflow-hidden rounded-3xl p-8 md:p-10" style={{ backgroundColor: COLORS.sand }} data-reveal data-delay="1">
              <Leaf className="absolute -right-8 -top-8 h-36 w-36 opacity-[0.06]" style={{ color: COLORS.green }} aria-hidden="true" />
              <div className="relative grid gap-3 sm:grid-cols-2">
                {ADDITIONAL_EXPERIENCES.map((experience) => (
                  <div key={experience} className="flex items-center gap-3 rounded-xl bg-white px-4 py-4 text-sm font-medium shadow-sm" style={{ color: COLORS.brown }}>
                    <Sparkles size={16} className="shrink-0" style={{ color: COLORS.gold }} aria-hidden="true" />
                    {experience}
                  </div>
                ))}
              </div>
              <p className="relative mt-5 text-xs leading-relaxed" style={{ color: COLORS.muted }}>
                Estas experiencias se cotizan por separado según el formato, el grupo y el facilitador elegido.
              </p>
            </div>
          </div>
        </section>

        <section id="pasos" className="px-6 py-20 md:py-28" style={{ backgroundColor: COLORS.sand }}>
          <div className="mx-auto max-w-5xl">
            <div className="mb-14 text-center" data-reveal>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: COLORS.terra }}>Co-diseñamos con vos</p>
              <h2 className="serif-title text-4xl leading-tight md:text-6xl" style={{ color: COLORS.green }}>De la idea a una experiencia completa</h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  number: '01',
                  title: 'Nos contás tu idea',
                  text: 'Conversamos sobre el propósito, las fechas posibles, el tamaño del grupo y lo que querés facilitar.',
                },
                {
                  number: '02',
                  title: 'Diseñamos la propuesta',
                  text: 'Definimos formato, alojamiento, alimentación, dinámicas y experiencias adicionales para tu grupo.',
                },
                {
                  number: '03',
                  title: 'Sostenemos el encuentro',
                  text: 'Nuestro equipo recibe, coordina y acompaña para que vos puedas enfocarte en la experiencia.',
                },
              ].map((step, index) => (
                <article key={step.number} className="rounded-2xl bg-white p-7 shadow-sm" data-reveal data-delay={String(index + 1)}>
                  <span className="serif-title text-4xl" style={{ color: COLORS.gold }}>{step.number}</span>
                  <h3 className="serif-title mt-5 text-2xl" style={{ color: COLORS.green }}>{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: COLORS.muted }}>{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden px-6 py-28 text-center text-white md:py-40">
          <img
            src={img('/uploads/img_6948.webp', 1600)}
            alt="Paisaje de montaña en Pueblo Mágico"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,61,39,0.84)' }} />
          <div className="relative z-10 mx-auto max-w-3xl" data-reveal>
            <div className="mx-auto mb-8 flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10">
              <Users size={24} style={{ color: COLORS.gold }} aria-hidden="true" />
            </div>
            <h2 className="serif-title text-4xl leading-tight text-white md:text-6xl">
              Tu propuesta ya tiene propósito.<br />Démosle un lugar donde suceder.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/65">
              Contanos qué imaginás para tu grupo y armamos una propuesta integral para vivir la montaña de manera auténtica, segura y transformadora.
            </p>
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold mt-9 inline-flex items-center justify-center gap-2 text-sm font-semibold"
            >
              Conversemos por WhatsApp
              <ArrowRight size={18} aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
      <CookieBanner />
    </div>
  );
};

export default OrganizaTuRetiro;
