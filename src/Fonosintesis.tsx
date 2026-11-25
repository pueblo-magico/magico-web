import React, { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Ear, Instagram, MapPin, Music2, Wind } from 'lucide-react';
import { CookieBanner } from '../components/CookieBanner';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { HorizontalCardRail } from '../components/HorizontalCardRail';
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
    { id: 'equipo', label: 'Equipo' },
    { id: 'preguntas', label: 'Preguntas' },
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

const PLACE_PHOTOS = [
  { src: '/uploads/events/colibri/pueblo-magico-aereo.jpg', alt: 'Vista aérea de Pueblo Mágico, en Los Gigantes', wide: true },
  { src: '/uploads/events/colibri/salon-piedra.jpg', alt: 'Salón de piedra de Pueblo Mágico', wide: false },
  { src: '/uploads/hero-estadia.webp', alt: 'El refugio de piedra de Pueblo Mágico al atardecer', wide: false },
  { src: '/uploads/domos_2.jpg', alt: 'Domos geodésicos de Pueblo Mágico', wide: true },
] as const;

const HOSTS = [
  {
    name: 'Diego Epelman Hodara',
    role: 'Fundador de Pueblo Mágico',
    image: '/uploads/Diego_perfil.png',
    text: 'Emprendedor y facilitador. Vive en el ecolodge y acompaña el día a día de quienes llegan al retiro.',
    instagram: 'https://www.instagram.com/diegoepel/',
  },
  {
    name: 'China Dericia',
    role: 'Anfitriona del Pueblo',
    image: '/uploads/china.jpeg',
    text: 'Profesora de yoga y facilitadora de movimiento consciente. Recibe al grupo y sostiene la estadía en el lugar.',
    instagram: 'https://www.instagram.com/bambu.alquimia.terapeutica/',
  },
] as const;

const FAQS = [
  ['¿Dónde se realiza?', 'En Pueblo Mágico, un ecolodge en Los Gigantes, Sierras de Córdoba.'],
  ['¿Cuáles son las fechas?', 'Del viernes 8 al domingo 10 de enero de 2027. El ingreso es el viernes entre las 15 y las 17 hs.'],
  ['¿Hay un valor publicado?', 'Todavía no. Escribinos por WhatsApp y te contamos la inversión, el alojamiento y cómo confirmar el lugar.'],
  ['¿Qué propone el retiro?', 'Escucha activa, energía sonora, los cuatro elementos y la medicina de la voz. El sábado a las 19 hs hay una actividad que sigue a confirmar.'],
  ['¿Hay silencio?', 'El viernes a la noche hay ayuno de palabras, con cena en silencio y descanso. El sábado, en el desayuno de las 7, se rompe el silencio y se comparten las experiencias.'],
  ['¿Cómo reservo?', 'Por WhatsApp a Pueblo Mágico. El mensaje ya queda escrito: al enviarlo te respondemos con los próximos pasos.'],
  ['¿Qué tengo que llevar?', 'Cuando confirmes el lugar te enviamos horarios de llegada, recomendaciones y lo necesario para el retiro.'],
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
        <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[#0e1a2b] text-white">
          <img
            src={HERO}
            alt=""
            width={1024}
            height={1024}
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover object-[center_72%]"
          />
          <div className="absolute inset-0 bg-[#0e1a2b]/45" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0e1a2b]/50 via-[#0e1a2b]/25 to-[#0e1a2b]/70" />
          <div className="relative z-10 mx-auto max-w-3xl px-5 py-32 text-center md:px-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#e6c15a]">Retiro y capacitación</p>
            <h1 className="mt-4 font-serif text-[clamp(3.4rem,8vw,6.5rem)] leading-[0.88] text-white">Fonosíntesis</h1>
            <p className="mt-5 font-serif text-2xl leading-snug text-white/90 md:text-3xl">Sonidos restaurativos</p>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/80 md:text-lg">
              Tres días para afinar la escucha, estudiar la energía del sonido y practicar la voz como medicina. En Pueblo Mágico, Sierras de Córdoba.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 text-sm text-white/90 sm:flex-row sm:gap-6">
              <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#e6c15a]" aria-hidden="true" /> 8, 9 y 10 de enero de 2027</span>
              <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-[#e6c15a]" aria-hidden="true" /> Pueblo Mágico · Sierras de Córdoba</span>
            </div>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#e6c15a] px-7 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[#1a1408] transition hover:bg-[#f0d27a]">
                Pedir información <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a href="#programa" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 px-7 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-white/10">
                Ver el programa
              </a>
            </div>
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

        <section id="programa" className="scroll-mt-28 bg-[#0e1a2b] px-6 py-20 text-white md:px-8 md:py-28">
          <div className="mx-auto max-w-6xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#e6c15a]">Programa</p>
            <h2 className="mt-4 max-w-3xl font-serif text-4xl leading-tight md:text-6xl">Tres días de sonido</h2>
            <p className="mt-5 max-w-2xl text-white/70">Los horarios del sábado a las 19 hs siguen a confirmar. El resto del programa es el que compartimos acá.</p>
            <HorizontalCardRail
              previousLabel="Día anterior"
              nextLabel="Día siguiente"
              ariaLabel="Programa de los tres días"
              desktopGridClassName="md:grid-cols-3"
              mobileItemClassName="w-[86vw] max-w-[420px]"
              gapClassName="mt-8 gap-4 md:mt-12 md:gap-8"
              inverseArrows
              className="mt-4"
            >
              {DAYS.map(day => (
                <article key={day.id} className="h-full rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
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
            </HorizontalCardRail>
          </div>
        </section>

        <section id="sonido" className="scroll-mt-28 px-5 py-20 md:px-8 md:py-28" aria-label="Imágenes del trabajo sonoro">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-3 gap-2 md:gap-4">
              {GALLERY.map(photo => (
                <img
                  key={photo.src}
                  src={photo.src}
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
                  loading="lazy"
                  decoding="async"
                  className={`w-full rounded-[28px] object-cover ${photo.wide ? 'col-span-3 aspect-[3/2]' : 'col-span-1 aspect-square md:aspect-[3/4]'}`}
                />
              ))}
            </div>
          </div>
        </section>

        <section id="lugar" className="scroll-mt-28 bg-white px-5 py-20 md:px-8 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="grid items-end gap-10 lg:grid-cols-[0.85fr_1.15fr]">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#8a6a1f]">Dónde</p>
                <h2 className="mt-4 font-serif text-4xl leading-tight text-[#0e1a2b] md:text-6xl">Pueblo Mágico, en las Sierras de Córdoba.</h2>
                <p className="mt-6 max-w-xl text-base leading-8 text-[#3d4a58]">
                  El retiro se realiza en el ecolodge de Los Gigantes: salón de piedra, refugio y domos entre la montaña. Todavía no hay un valor publicado: escribinos y te contamos inversión, alojamiento y cómo confirmar el lugar.
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
                className="aspect-[4/5] w-full rounded-[28px] object-cover lg:max-h-[520px]"
              />
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {PLACE_PHOTOS.map(photo => (
                <img
                  key={photo.src}
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  decoding="async"
                  className={`w-full rounded-[28px] object-cover ${photo.wide ? 'aspect-[16/9] md:col-span-2' : 'aspect-[4/3]'}`}
                />
              ))}
            </div>
          </div>
        </section>

        <section id="equipo" className="scroll-mt-28 bg-[#f7f3ea] px-5 py-20 md:px-8 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#8a6a1f]">Equipo</p>
              <h2 className="mt-4 font-serif text-4xl leading-tight text-[#0e1a2b] md:text-6xl">Quiénes reciben en Pueblo Mágico.</h2>
              <p className="mt-5 text-base leading-8 text-[#3d4a58]">Diego y China viven en el ecolodge. Son quienes reciben al grupo y sostienen la estadía.</p>
            </div>
            <ul className="mt-12 grid gap-5 md:grid-cols-2">
              {HOSTS.map(host => (
                <li key={host.name} className="rounded-[28px] border border-[#0e1a2b]/10 bg-white p-6 md:p-8">
                  <img src={host.image} alt={host.name} width={160} height={160} loading="lazy" decoding="async" className="h-24 w-24 rounded-full object-cover" />
                  <h3 className="mt-5 font-serif text-2xl text-[#0e1a2b]">{host.name}</h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[#8a6a1f]">{host.role}</p>
                  <p className="mt-3 text-sm leading-7 text-[#4d5b68]">{host.text}</p>
                  <a href={host.instagram} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#005333]">
                    <Instagram className="h-4 w-4" aria-hidden="true" /> Instagram
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="preguntas" className="scroll-mt-28 bg-white px-5 py-20 md:px-8 md:py-28">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#8a6a1f]">Preguntas frecuentes</p>
              <h2 className="mt-4 font-serif text-4xl leading-tight text-[#0e1a2b] md:text-5xl">Antes de reservar</h2>
            </div>
            <div className="mt-10 space-y-3">
              {FAQS.map(([question, answer]) => (
                <details key={question} className="group rounded-[20px] border border-[#0e1a2b]/10 bg-[#f7f3ea] px-6 py-5 open:bg-white open:shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-semibold text-[#0e1a2b]">
                    <span>{question}</span>
                    <span className="text-xl text-[#8a6a1f] transition group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p className="mt-4 border-t border-[#0e1a2b]/10 pt-4 text-sm leading-7 text-[#4d5b68]">{answer}</p>
                </details>
              ))}
            </div>
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
