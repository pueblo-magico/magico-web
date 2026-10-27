import React, { useEffect } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Flame, Flower2, Footprints, MapPin, MessageCircle, Moon, Music2, Sprout, Sun, Waves, Wind } from 'lucide-react';
import { CookieBanner } from '../components/CookieBanner';
import { Footer } from '../components/Footer';
import { SITE_URL } from './data/config';
import { ROUTES } from './routes';

const TITLE = 'BROTE · Ronda de Mujeres, Ciclo Primavera | Pueblo Mágico';
const DESCRIPTION = 'BROTE, Ronda de Mujeres — Ciclo Primavera. Un encuentro de tres días de movimiento, canto, fuego, agua y naturaleza. Del 6 al 8 de noviembre de 2026 en Los Gigantes, Córdoba.';
const PAGE_URL = `${SITE_URL}${ROUTES.BROTE}`;
const ART = '/uploads/brote/brote-primavera.svg';
const OG_IMAGE = `${SITE_URL}/uploads/Ciclo%20Femenino/Mujeres%20meditando%20en%20circulo%20acostadas.jpeg`;
const WHATSAPP = '34621076042';
const inquire = (message: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
const GENERAL_LINK = inquire('Hola, quiero consultar disponibilidad y detalles para BROTE · Ronda de Mujeres, del 6 al 8 de noviembre de 2026 en Los Gigantes.');
const PRICE_OPTIONS = [
  { amount: 'AR$ 400.000', label: 'Si ya participaste del encuentro anterior o venís con otra persona', badge: 'Valor especial' },
  { amount: 'AR$ 460.000', label: 'Si venís sola', badge: 'Participación individual' },
  { amount: 'AR$ 300.000', label: 'Opción acampada', badge: 'Acampada' },
] as const;
const EXPERIENCES = [
  { title: 'Ceremonia de fuego', Icon: Flame },
  { title: 'Caminata nocturna al río', Icon: Moon },
  { title: 'Cantos para abrir la voz y conectar garganta y útero', Icon: Music2 },
  { title: 'Medicina del movimiento y danza', Icon: Wind },
  { title: 'Sueños guiados', Icon: Sun },
  { title: 'Caminata por el territorio', Icon: Footprints },
  { title: 'Recolección de plantas y flores', Icon: Flower2 },
  { title: 'Ceremonia de ofrenda al agua', Icon: Waves },
  { title: 'Círculo de mujeres', Icon: Sprout },
  { title: 'Espacios de conexión con la naturaleza', Icon: MapPin },
] as const;

const upsertMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
  let element = document.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};

const Brote: React.FC = () => {
  useEffect(() => {
    const oldTitle = document.title;
    document.title = TITLE;
    upsertMeta('meta[name="description"]', 'name', 'description', DESCRIPTION);
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', TITLE);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', DESCRIPTION);
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', OG_IMAGE);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', PAGE_URL);
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
    upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', OG_IMAGE);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = PAGE_URL;

    // The same Event schema is emitted by prerender.mjs for direct page loads.
    // Inject it here only when navigating from another SPA route.
    let createdScript: HTMLScriptElement | null = null;
    if (!document.getElementById('brote-event-schema')) {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: 'BROTE — Ronda de Mujeres, Ciclo Primavera',
        description: DESCRIPTION,
        startDate: '2026-11-06',
        endDate: '2026-11-08',
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: { '@type': 'Place', name: 'Los Gigantes, Córdoba', address: { '@type': 'PostalAddress', addressLocality: 'Los Gigantes', addressRegion: 'Córdoba', addressCountry: 'AR' } },
        organizer: { '@type': 'Organization', name: 'Cuenca Lunar' },
        url: PAGE_URL,
        image: OG_IMAGE,
      };
      createdScript = document.createElement('script');
      createdScript.id = 'brote-event-schema';
      createdScript.type = 'application/ld+json';
      createdScript.textContent = JSON.stringify(schema);
      document.head.appendChild(createdScript);
    }
    return () => {
      document.title = oldTitle;
      createdScript?.remove();
    };
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#080808] text-[#fff7ef]">
      <a href="#contenido-brote" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-white focus:p-3 focus:text-black">
        Saltar al contenido
      </a>
      <header className="relative z-20 border-b border-white/10 bg-[#080808]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-9">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-bold tracking-widest text-white hover:text-[#f3afcc]" aria-label="Volver al inicio de Pueblo Mágico">
            <ArrowLeft size={17} aria-hidden="true" /> PUEBLO MÁGICO
          </a>
          <nav aria-label="Secciones del encuentro" className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#f3d2dd] sm:gap-7">
            <a href="#propuesta" className="hover:text-white">La propuesta</a>
            <a href="#experiencias" className="hover:text-white">Experiencias</a>
            <a href="#inversion" className="hover:text-white">Inversión</a>
          </nav>
        </div>
      </header>

      <main id="contenido-brote">
        <section className="relative isolate overflow-hidden bg-[#080808]">
          <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-[#9f2d59]/20 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-5 py-12 md:px-9 md:py-20 lg:grid-cols-[1fr_1.04fr] lg:gap-16">
            <div className="max-w-2xl">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[.28em] text-[#a5db5a]">Cuenca Lunar · Ronda de Mujeres</p>
              <h1 className="font-serif text-[clamp(4.5rem,13vw,9rem)] font-bold leading-[.88] tracking-[.07em] text-[#fa7791]">BROTE</h1>
              <p className="mt-6 font-serif text-[clamp(1.35rem,3vw,2.2rem)] leading-snug text-[#f6c0d4]">Después del invierno, el brote.</p>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75 md:text-lg">
                Tres días para volver al cuerpo, escuchar lo que está germinando y darle espacio a aquello que queremos ver florecer.
              </p>
              <div className="mt-8 flex flex-col gap-3 text-sm font-medium text-white/90 sm:flex-row sm:flex-wrap sm:gap-6">
                <span className="inline-flex items-center gap-2"><CalendarDays size={19} className="text-[#71c2f0]" aria-hidden="true" /> 6, 7 y 8 de noviembre de 2026</span>
                <span className="inline-flex items-center gap-2"><MapPin size={19} className="text-[#71c2f0]" aria-hidden="true" /> Los Gigantes · Córdoba</span>
              </div>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <a href={GENERAL_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#fab64b] px-7 py-3 text-sm font-bold text-[#17100b] transition hover:bg-[#ffcc70] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#fab64b]">
                  Consultar por mi lugar <ArrowRight size={18} aria-hidden="true" />
                </a>
                <a href="#propuesta" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/35 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Conocer el encuentro</a>
              </div>
              <p className="mt-4 text-xs text-white/50">Las consultas no confirman una reserva. Seña del 50% para todas las opciones.</p>
            </div>
            <div className="mx-auto w-full max-w-[650px]">
              <img src={ART} width={960} height={720} alt="Afiche ilustrado de BROTE, con flores de primavera, fechas y lugar" loading="eager" decoding="async" fetchPriority="high" className="h-auto w-full rounded-[1.5rem] border border-white/10" />
            </div>
          </div>
        </section>

        <section id="propuesta" className="bg-[#fff3ed] py-20 text-[#4d292e] md:py-28">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-[.8fr_1.2fr] md:gap-20 md:px-9">
            <div>
              <p className="mb-5 text-xs font-bold uppercase tracking-[.24em] text-[#b44268]">Ciclo Primavera</p>
              <h2 className="font-serif text-4xl leading-tight md:text-6xl">¿Qué quiere <span className="italic text-[#b44268]">brotar en vos?</span></h2>
            </div>
            <div className="space-y-5 text-base leading-relaxed text-[#573941] md:text-lg">
              <p>Durante el invierno, la semilla se entrega al silencio y a la tierra que la sostiene. La primavera comienza a asomarse y, con ella, la posibilidad de reconocer lo que germinó.</p>
              <p>No todo necesita convertirse en flor. Este encuentro es una invitación a mirar lo que está brotando, elegir qué queremos alimentar y volver al goce de estar vivas.</p>
              <p className="font-serif text-2xl italic text-[#9c3e61]">Cada una tiene su ritmo. Cada una conoce su momento.</p>
            </div>
          </div>
        </section>

        <section className="bg-[#171018] py-20 md:py-24">
          <div className="mx-auto max-w-6xl px-5 md:px-9">
            <p className="text-xs font-semibold uppercase tracking-[.25em] text-[#bde967]">La rueda y el goce</p>
            <h2 className="mt-3 max-w-3xl font-serif text-3xl leading-tight text-[#f8d0df] md:text-5xl">Somos naturaleza: cada estación tiene su enseñanza.</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Invierno', 'Descansar, profundizar y soltar.'],
                ['Primavera', 'Despertar, movernos, abrirnos y brotar.'],
                ['Verano', 'Expandirnos, gozar, expresarnos y florecer.'],
                ['Otoño', 'Recoger, agradecer y dejar caer.'],
              ].map(([season, detail]) => (
                <article key={season} className="rounded-2xl border border-[#e1a8b9]/20 bg-white/[.04] p-6">
                  <h3 className="font-serif text-2xl text-[#f9be76]">{season}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">{detail}</p>
                </article>
              ))}
            </div>
            <p className="mt-8 max-w-3xl text-white/65">Esta ronda propone llevar los ciclos al cuerpo y al territorio: caminar la tierra, escuchar el agua, encontrarnos con el fuego y respirar el aire.</p>
          </div>
        </section>

        <section id="experiencias" className="bg-[#fff3ed] py-20 text-[#412b2b] md:py-28">
          <div className="mx-auto max-w-6xl px-5 md:px-9">
            <div className="max-w-3xl">
              <p className="mb-4 text-xs font-bold uppercase tracking-[.25em] text-[#ae4466]">Habitar el cuerpo</p>
              <h2 className="font-serif text-4xl md:text-6xl">El goce del brote</h2>
              <p className="mt-5 text-base leading-relaxed text-[#674c4c] md:text-lg">Danzar, cantar, respirar, caminar, compartir y dejarnos tocar por el paisaje. Durante los tres días nos acompañarán estas experiencias:</p>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {EXPERIENCES.map(({ title, Icon }) => (
                <div key={title} className="flex min-h-24 items-center gap-4 rounded-2xl border border-[#c87a91]/20 bg-white p-5 shadow-sm">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fce2e8] text-[#a83c67]"><Icon size={21} aria-hidden="true" /></div>
                  <span className="text-[15px] font-medium leading-snug">{title}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm italic text-[#715257]">Y más experiencias para descubrir juntas. Consultá los horarios y la organización de cada actividad.</p>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#08100f] py-20 md:py-28">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 md:grid-cols-2 md:gap-20 md:px-9">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.25em] text-[#bde967]">Un encuentro en la montaña</p>
              <h2 className="mt-4 font-serif text-4xl leading-tight text-[#f8d0df] md:text-5xl">Volver a sentir las preguntas</h2>
              <div className="mt-8 space-y-3 font-serif text-xl italic leading-snug text-white/85 md:text-2xl">
                <p>¿Qué está queriendo nacer en mí?</p>
                <p>¿Qué deseo alimentar?</p>
                <p>¿Dónde está mi goce?</p>
                <p>¿Qué parte de mí está lista para salir de la tierra?</p>
              </div>
            </div>
            <figure>
              <img src="/uploads/Ciclo%20Femenino/Mujeres%20meditando%20en%20circulo%20acostadas.jpeg" width={960} height={640} loading="lazy" decoding="async" alt="Mujeres compartiendo una práctica de encuentro y meditación en círculo" className="aspect-[4/3] w-full rounded-3xl object-cover" />
              <figcaption className="mt-3 text-xs text-white/50">Un espacio para encontrarnos, sentir y compartir.</figcaption>
            </figure>
          </div>
        </section>

        <section id="inversion" className="bg-[#ffe5cf] py-20 text-[#40292b] md:py-28">
          <div className="mx-auto max-w-6xl px-5 md:px-9">
            <p className="text-xs font-bold uppercase tracking-[.25em] text-[#ad4264]">Inversión en el proceso</p>
            <h2 className="mt-4 font-serif text-4xl md:text-6xl">Modalidades de participación</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {PRICE_OPTIONS.map(option => (
                <article key={option.amount} className="flex flex-col rounded-[1.5rem] border border-[#b96b69]/20 bg-white p-7 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[.15em] text-[#b0466b]">{option.badge}</p>
                  <p className="mt-6 font-serif text-4xl font-semibold text-[#412a34]">{option.amount}</p>
                  <p className="mt-4 min-h-16 text-sm leading-relaxed text-[#6d5557]">{option.label}</p>
                  <a href={inquire(`Hola, quiero consultar por BROTE del 6 al 8 de noviembre de 2026, opción ${option.badge} (${option.amount}). ¿Qué incluye y cómo se confirma?`)} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#a64064] px-4 py-3 text-sm font-bold text-white hover:bg-[#853453]">
                    Consultar esta opción <ArrowRight size={17} aria-hidden="true" />
                  </a>
                </article>
              ))}
            </div>
            <div className="mt-8 flex items-start gap-3 rounded-xl border border-[#b96b69]/20 bg-white/60 p-5 text-sm leading-relaxed">
              <Check size={22} className="shrink-0 text-[#a64064]" aria-hidden="true" />
              <p><strong>Todas las opciones se señan con el 50%.</strong> Consultá qué incluye cada modalidad, los horarios y las condiciones de cancelación antes de señar. Precios expresados en pesos argentinos.</p>
            </div>
          </div>
        </section>

        <section className="bg-[#080808] px-5 py-20 text-center md:py-28">
          <div className="mx-auto max-w-2xl">
            <Flower2 size={43} className="mx-auto text-[#f18bac]" aria-hidden="true" />
            <h2 className="mt-6 font-serif text-4xl text-[#ffd0dd] md:text-6xl">¿Qué quiere florecer en vos?</h2>
            <p className="mt-5 text-base leading-relaxed text-white/70">BROTE · Ronda de Mujeres · 6, 7 y 8 de noviembre · Los Gigantes, Córdoba.</p>
            <a href={GENERAL_LINK} target="_blank" rel="noopener noreferrer" className="mt-9 inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#fab64b] px-8 py-4 font-bold text-[#17100b] hover:bg-[#ffcc70]">
              <MessageCircle size={19} aria-hidden="true" /> Consultar por WhatsApp
            </a>
            <p className="mt-4 text-sm text-white/55">Contacto de Cuenca Lunar: +34 621 076 042</p>
            <p className="mt-6 text-xs text-white/45">La reserva y sus condiciones se coordinan directamente con la organización.</p>
          </div>
        </section>
      </main>
      <Footer />
      <CookieBanner />
    </div>
  );
};

export default Brote;
