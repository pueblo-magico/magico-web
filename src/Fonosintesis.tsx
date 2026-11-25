import React, { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Ear, MapPin, Music2, Wind } from 'lucide-react';
import { CookieBanner } from '../components/CookieBanner';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { PageSectionNav, type PageNavigation } from '../components/PageSectionNav';
import { SITE_URL, WA_MAGICO } from './data/config';
import { ROUTES } from './routes';

const TITLE = 'Fonosíntesis · Retiro y capacitación de sonidos restaurativos | Pueblo Mágico';
const DESCRIPTION = 'Retiro y capacitación de sonidos restaurativos en Pueblo Mágico, Sierras de Córdoba. Escucha activa, energía sonora, los cuatro elementos y la medicina de la voz. Del 8 al 10 de enero de 2027.';
const PAGE_URL = `${SITE_URL}${ROUTES.FONOSINTESIS}`;
const HERO = '/uploads/events/fonosintesis/hero-didgeridoo.png';
const OG_IMAGE = `${SITE_URL}${HERO}`;
const WHATSAPP = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent('Hola, quiero pedir información y reservar mi lugar para Fonosíntesis, retiro y capacitación de sonidos restaurativos, del 8 al 10 de enero de 2027 en Pueblo Mágico.')}`;

const navigation: PageNavigation = {
  ariaLabel: 'Secciones del retiro',
  pageEyebrow: '8–10 ene 2027',
  pageTitle: 'Fonosíntesis',
  sections: [
    { id: 'retiro', label: 'El retiro' },
    { id: 'programa', label: 'Programa' },
    { id: 'sonido', label: 'El sonido' },
    { id: 'lugar', label: 'Lugar' },
    { id: 'reservar', label: 'Reservar' },
  ],
};

const PILLARS = [
  {
    Icon: Ear,
    title: 'Escucha activa',
    text: 'El retiro abre con ayuno de palabras y una salida al parque para escuchar por capas, con pautas atencionales cada 30 minutos.',
  },
  {
    Icon: Wind,
    title: 'Energía sonora',
    text: 'Vibración como energía en movimiento: características del sonido desde un enfoque científico, artístico y espiritual.',
  },
  {
    Icon: Music2,
    title: 'Medicina de la voz',
    text: 'Entrenamiento intensivo en cantos de armónicos, una meditación cantada, y ronda de cierre.',
  },
] as const;

const DAYS = [
  {
    id: 'viernes',
    label: 'Día 1',
    date: 'Viernes 8 de enero',
    items: [
      { time: '15 a 17 hs', title: 'Ingreso y recepción' },
      { time: '17 hs', title: 'Merienda, presentación e introducción del retiro' },
      {
        time: '18 hs',
        title: 'Introducción al vacío',
        detail: 'Ayuno de palabras y exploración de la escucha activa: salida al parque con guía para focalizar la escucha. Escuchar por capas, con pautas atencionales cada 30 minutos.',
      },
      { time: '20.30 hs', title: 'Descanso individual', detail: 'Con ayuno de palabras.' },
      { time: '21 hs', title: 'Cena en silencio' },
      {
        time: '22 hs',
        title: 'Puja de gongs',
        detail: 'Descanso y limpieza energética en el salón, con sonidos ininterrumpidos durante 8 horas mientras las personas duermen.',
      },
    ],
  },
  {
    id: 'sabado',
    label: 'Día 2',
    date: 'Sábado 9 de enero',
    items: [
      { time: '7 hs', title: 'Desayuno', detail: 'Se rompe el silencio y se comparten las experiencias de la noche.' },
      { time: '8.30 a 11 hs', title: 'Descanso libre' },
      {
        time: '11.15 hs',
        title: 'Introducción a la energía sonora',
        detail: 'Vibración = energía en movimiento. Características del sonido, con enfoque científico, artístico y espiritual. Marco teórico.',
      },
      { time: '12.45 hs', title: 'Almuerzo' },
      { time: '13.45 hs', title: 'Pausa', detail: '15 minutos.' },
      {
        time: '14 hs',
        title: 'La naturaleza del sonido',
        detail: 'Totalidad y vacío. Cuatro elementos, cuatro sonoridades: microclase sobre el reconocimiento y uso de las frecuencias y de los instrumentos que representan los elementos, y sus distintos usos. Práctica de ensamble grupal para reconocer y resonar cada elemento.',
      },
      { time: '18 hs', title: 'Merienda compartida' },
      { time: '19 hs', title: 'Actividad a confirmar' },
      { time: '21 hs', title: 'Cena' },
      { time: '22.30 hs', title: 'Descanso' },
    ],
  },
  {
    id: 'domingo',
    label: 'Día 3',
    date: 'Domingo 10 de enero',
    items: [
      { time: '9 hs', title: 'Desayuno' },
      {
        time: '10 hs',
        title: 'La medicina de la voz',
        detail: 'Entrenamiento intensivo en cantos de armónicos: meditación cantada.',
      },
      { time: '13 hs', title: 'Ronda de cierre' },
    ],
  },
] as const;

const GALLERY = [
  { src: '/uploads/events/fonosintesis/ronda-instrumentos.jpg', alt: 'Ronda al aire libre con tambor, didgeridoo y otros instrumentos', width: 1024, height: 682, wide: true },
  { src: '/uploads/events/fonosintesis/escucha-pradera.jpg', alt: 'Grupo en el pasto durante una práctica de escucha y sonido al aire libre', width: 682, height: 1024, wide: false },
  { src: '/uploads/events/fonosintesis/didgeridoo-salon.jpg', alt: 'Facilitador con didgeridoo caminando entre personas recostadas en el pasto', width: 685, height: 1024, wide: false },
  { src: '/uploads/events/fonosintesis/descanso-sonoro.jpg', alt: 'Personas recostadas en colchonetas mientras suenan didgeridoos en el parque', width: 682, height: 1024, wide: false },
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

const Fonosintesis: React.FC = () => {
  const [showFloatingWhatsapp, setShowFloatingWhatsapp] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
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

    let createdScript: HTMLScriptElement | null = null;
    if (!document.getElementById('fonosintesis-event-schema')) {
      createdScript = document.createElement('script');
      createdScript.id = 'fonosintesis-event-schema';
      createdScript.type = 'application/ld+json';
      createdScript.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: 'Fonosíntesis — Retiro y capacitación de sonidos restaurativos',
        description: DESCRIPTION,
        startDate: '2027-01-08',
        endDate: '2027-01-10',
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
          '@type': 'Place',
          name: 'Pueblo Mágico',
          address: { '@type': 'PostalAddress', addressLocality: 'Los Gigantes', addressRegion: 'Córdoba', addressCountry: 'AR' },
        },
        organizer: { '@type': 'Organization', name: 'Pueblo Mágico', url: SITE_URL },
        url: PAGE_URL,
        image: OG_IMAGE,
      });
      document.head.appendChild(createdScript);
    }

    return () => {
      document.title = previousTitle;
      createdScript?.remove();
    };
  }, []);

  useEffect(() => {
    const update = () => setShowFloatingWhatsapp(window.scrollY > 600);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f3ea] text-[#1c2430]">
      <Header subNavigation={<PageSectionNav navigation={navigation} />} />

      <main id="contenido">
        <section className="bg-[#0e1a2b] text-white">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 pb-12 pt-28 md:grid-cols-[1.05fr_0.95fr] md:px-8 md:pb-16 md:pt-36">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#e6c15a]">Retiro y capacitación</p>
              <h1 className="mt-4 font-serif text-[clamp(3.4rem,8vw,6.5rem)] leading-[0.88] text-white">Fonosíntesis</h1>
              <p className="mt-5 max-w-xl font-serif text-2xl leading-snug text-white/90 md:text-3xl">Sonidos restaurativos</p>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/80 md:text-lg">
                Tres días para afinar la escucha, estudiar la energía del sonido y practicar la voz como medicina. En Pueblo Mágico, Sierras de Córdoba.
              </p>
              <div className="mt-7 flex flex-col gap-3 text-sm text-white/90 sm:flex-row sm:flex-wrap sm:gap-6">
                <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#e6c15a]" aria-hidden="true" /> 8, 9 y 10 de enero de 2027</span>
                <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-[#e6c15a]" aria-hidden="true" /> Pueblo Mágico · Sierras de Córdoba</span>
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#e6c15a] px-7 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[#1a1408] transition hover:bg-[#f0d27a]">
                  Pedir información <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <a href="#programa" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 px-7 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-white/10">
                  Ver el programa
                </a>
              </div>
            </div>
            <img
              src={HERO}
              alt="Silueta de una persona tocando un didgeridoo sobre una roca al atardecer"
              width={1024}
              height={1024}
              fetchPriority="high"
              className="aspect-square w-full rounded-[28px] object-cover"
            />
          </div>
        </section>

        <section id="retiro" className="scroll-mt-28 px-5 py-20 md:px-8 md:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#8a6a1f]">El retiro</p>
              <h2 className="mt-4 font-serif text-4xl leading-tight text-[#0e1a2b] md:text-6xl">Escuchar, vibrar y cantar.</h2>
              <p className="mt-6 text-base leading-8 text-[#3d4a58] md:text-lg">
                Fonosíntesis es un retiro y una capacitación. El primer día se entra en silencio para entrenar la escucha. El sábado abre el marco teórico y la práctica con los cuatro elementos. El domingo cierra con la voz.
              </p>
            </div>
            <ul className="grid gap-4">
              {PILLARS.map(({ Icon, title, text }) => (
                <li key={title} className="flex gap-4 rounded-3xl border border-[#0e1a2b]/10 bg-white p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0e1a2b] text-[#e6c15a]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <strong className="block font-serif text-xl font-normal text-[#0e1a2b]">{title}</strong>
                    <span className="mt-1 block text-sm leading-6 text-[#4d5b68]">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="programa" className="scroll-mt-28 bg-[#0e1a2b] px-5 py-20 text-white md:px-8 md:py-28">
          <div className="mx-auto max-w-6xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#e6c15a]">Programa</p>
            <h2 className="mt-4 max-w-3xl font-serif text-4xl leading-tight md:text-6xl">Tres días de sonido</h2>
            <p className="mt-5 max-w-2xl text-white/70">Los horarios del sábado a las 19 hs siguen a confirmar. El resto del programa es el que compartimos acá.</p>
            <div className="mt-12 grid gap-8 lg:grid-cols-3">
              {DAYS.map(day => (
                <article key={day.id} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#e6c15a]">{day.label}</p>
                  <h3 className="mt-2 font-serif text-2xl">{day.date}</h3>
                  <ol className="mt-6 space-y-5">
                    {day.items.map(item => (
                      <li key={`${day.id}-${item.time}`} className="border-t border-white/10 pt-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#e6c15a]">{item.time}</p>
                        <p className="mt-1 font-medium text-white">{item.title}</p>
                        {'detail' in item && item.detail && <p className="mt-1 text-sm leading-6 text-white/65">{item.detail}</p>}
                      </li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="sonido" className="scroll-mt-28 px-5 py-20 md:px-8 md:py-28" aria-label="Imágenes del trabajo sonoro">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-4 md:grid-cols-3">
              {GALLERY.map(photo => (
                <img
                  key={photo.src}
                  src={photo.src}
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
                  loading="lazy"
                  decoding="async"
                  className={`w-full rounded-[28px] object-cover ${photo.wide ? 'aspect-[3/2] md:col-span-3' : 'aspect-[3/4]'}`}
                />
              ))}
            </div>
          </div>
        </section>

        <section id="lugar" className="scroll-mt-28 bg-white px-5 py-20 md:px-8 md:py-28">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#8a6a1f]">Dónde</p>
              <h2 className="mt-4 font-serif text-4xl leading-tight text-[#0e1a2b] md:text-6xl">Pueblo Mágico, en las Sierras de Córdoba.</h2>
              <p className="mt-6 max-w-xl text-base leading-8 text-[#3d4a58]">
                El retiro se realiza en el ecolodge de Los Gigantes. Todavía no hay un valor publicado: escribinos y te contamos inversión, alojamiento y cómo confirmar el lugar.
              </p>
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#005333] px-7 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#0e1a2b]">
                Pedir información y reservar <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
            <img
              src="/uploads/events/fonosintesis/handpan-roca.png"
              alt="Handpan sobre una roca, con el valle de las sierras detrás"
              width={597}
              height={1024}
              loading="lazy"
              decoding="async"
              className="aspect-[3/4] w-full rounded-[28px] object-cover"
            />
          </div>
        </section>

        <section id="reservar" className="scroll-mt-28 bg-[#005333] px-5 py-16 text-white md:px-8 md:py-20">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#e6c15a]">Reserva</p>
              <h2 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">Pedí información para reservar tu lugar.</h2>
              <p className="mt-4 text-base leading-7 text-white/80">El mensaje ya queda escrito. Solo tenés que enviarlo por WhatsApp a Pueblo Mágico.</p>
            </div>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#e6c15a] px-7 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[#1a1408] transition hover:bg-[#f0d27a]">
              Pedir información <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>

      <Footer />
      <CookieBanner />
      <a
        href={WHATSAPP}
        target="_blank"
        rel="noopener noreferrer"
        className={`fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition md:opacity-100 ${showFloatingWhatsapp ? 'opacity-100' : 'pointer-events-none opacity-0 md:pointer-events-auto'}`}
        aria-label="Consultar Fonosíntesis por WhatsApp"
      >
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.017-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
      </a>
    </div>
  );
};

export default Fonosintesis;
