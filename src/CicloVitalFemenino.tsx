import React, { useState, useEffect } from 'react';
import { LanguageProvider } from '../contexts/LanguageContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { img } from './lib/img';
import { RESERVATION_START_PATH, SITE_URL, WA_CICLO_VITAL_FEMENINO } from './data/config';
import { ROUTES } from './routes';
import { RETREATS_DATA } from './data/retreats';

import CicloVitalFemeninoHero from './components/CicloVitalFemeninoHero';
import CicloVitalFemeninoLugar from './components/CicloVitalFemeninoLugar';
import CicloVitalFemeninoEquipo from './components/CicloVitalFemeninoEquipo';
import CicloVitalFemeninoTestimonios from './components/CicloVitalFemeninoTestimonios';
import CicloVitalFemeninoMomentos from './components/CicloVitalFemeninoMomentos';
import CicloVitalFemeninoPrecios from './components/CicloVitalFemeninoPrecios';
import CicloVitalFemeninoFAQ from './components/CicloVitalFemeninoFAQ';

const QUE_VIVIRAS = [
  'Prácticas de conexión con la naturaleza',
  'Momentos de silencio',
  'Meditación y movimiento consciente',
  'Rituales para honrar el camino',
  'Dinámicas de autoconocimiento',
  'Círculo de mujeres',
  'Caminatas diurnas y nocturnas',
  'Temazcal',
  'Ceremonia de Cacao',
  'Y otras magias que se vivirán y son imposibles de describir o develar',
];

const MOMENTOS_IMAGES = [
  { src: '/uploads/469280911_444096748740233_2818770490495002077_n.webp', alt: 'Sala de encuentro y movimiento, luz cálida entrando por los ventanales' },
  { src: '/uploads/Ciclo Femenino/Mujeres meditando en circulo acostadas.jpeg', alt: 'Mujeres en círculo, acostadas en meditación' },
  { src: '/uploads/Ciclo Femenino/Altar con tarot.jpeg', alt: 'Altar ritual con tarot, plumas y elementos de la tierra' },
  { src: '/uploads/Ciclo Femenino/altar con tarot e intenciones.jpeg', alt: 'Círculo de intenciones con flores y tarot' },
  { src: '/uploads/Ciclo Femenino/meditacion china.jpeg', alt: 'Meditación grupal guiada' },
  { src: '/uploads/Ciclo Femenino/temazcal parte superior.jpeg', alt: 'Estructura del temazcal contra el cielo' },
];

const GALLERY_IMAGES = [
  { src: '/uploads/Invierno/DJI_20250629135712_0164_D_CHAPA2025.webp', alt: 'Vista aérea del complejo nevado' },
  { src: '/uploads/WhatsApp Image 2025-09-29 at 2.46.36 PM (1).jpeg', alt: 'Meditación dentro del domo geodésico' },
  { src: '/uploads/Invierno/20250629_135046.webp', alt: 'Ventanal con vistas a la sierra' },
  { src: '/uploads/temazcal.webp', alt: 'Temazcal — ritual de purificación' },
  { src: '/uploads/WhatsApp Image 2025-09-29 at 2.46.37 PM (1).jpeg', alt: 'Descanso con vista a la sierra desde el domo' },
  { src: '/uploads/Invierno/20250629_164200.webp', alt: 'Pino solitario bajo la cencellada' },
  { src: '/uploads/WhatsApp Image 2025-09-29 at 2.46.37 PM.jpeg', alt: 'Meditación al sol dentro del domo' },
  { src: '/uploads/Invierno/20250628_181834.webp', alt: 'Ocaso tras la pirca de piedra' },
  { src: '/uploads/WhatsApp Image 2025-09-29 at 2.46.38 PM.jpeg', alt: 'Interior del domo geodésico' },
  { src: '/uploads/WhatsApp Image 2025-09-29 at 2.46.39 PM (1).jpeg', alt: 'Mate y descanso dentro del domo' },
  { src: '/uploads/Invierno/20250629_152354.webp', alt: 'Camino rural hacia el horizonte helado' },
];

const ES_PARA_VOS = [
  'Sentís que necesitás soltar algo que ya no te sirve',
  'Buscás una pausa real, sin pantallas ni agenda',
  'Te llama la idea de sostenerte en un círculo de mujeres',
  'Estás atravesando un cierre de ciclo y querés transitarlo con conciencia',
];

const NO_ES_PARA_VOS = [
  'Buscás una escapada turística sin trabajo interior',
  'No estás disponible para el silencio y la introspección',
  'Preferís un acompañamiento individual antes que grupal',
];

const CicloVitalFemeninoContent: React.FC = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const [momentosIndex, setMomentosIndex] = useState(0);
  const [showFloatingCta, setShowFloatingCta] = useState(false);

  const WA_CONSULTA_HREF = `https://wa.me/${WA_CICLO_VITAL_FEMENINO}?text=${encodeURIComponent(RETREATS_DATA.cicloVitalFemenino.messageConsulta)}`;

  // SEO — title, meta, OG, canonical y JSON-LD
  useEffect(() => {
    const TITLE = 'Ciclo Vital Femenino · Capítulo Muerte-Invierno — Encuentro de Mujeres | Pueblo Mágico';
    const DESC  = 'Retiro de mujeres en la montaña. 28, 29 y 30 de Agosto en Los Gigantes, Córdoba. Temazcal, círculo de mujeres, ceremonia de cacao y rituales para transmutar todo lo que no ES.';
    const URL   = SITE_URL + ROUTES.CICLO_VITAL_FEMENINO;
    const IMG   = `${SITE_URL}/uploads/Invierno/20250627_222558.webp`;
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
      '@type': 'Event',
      name: 'Ciclo Vital Femenino — Capítulo Muerte-Invierno',
      description: DESC,
      startDate: '2026-08-28',
      endDate: '2026-08-30',
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: { '@type': 'Place', name: 'Pueblo Mágico', address: { '@type': 'PostalAddress', addressLocality: 'Los Gigantes', addressRegion: 'Córdoba', addressCountry: 'AR' } },
      organizer: { '@type': 'Organization', name: 'Pueblo Mágico', url: SITE_URL },
      offers: { '@type': 'Offer', url: URL, availability: 'https://schema.org/LimitedAvailability' },
      image: IMG,
    };
    const ldScript = document.createElement('script');
    ldScript.type = 'application/ld+json';
    ldScript.id   = 'ld-ciclo-vital-femenino';
    ldScript.textContent = JSON.stringify(schema);
    if (!document.getElementById('ld-ciclo-vital-femenino')) document.head.appendChild(ldScript);

    const breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Ciclo Vital Femenino', item: URL },
      ],
    };
    const bcScript = document.createElement('script');
    bcScript.type = 'application/ld+json';
    bcScript.id   = 'ld-bc-ciclo-vital-femenino';
    bcScript.textContent = JSON.stringify(breadcrumb);
    if (!document.getElementById('ld-bc-ciclo-vital-femenino')) document.head.appendChild(bcScript);

    return () => {
      document.title = prevTitle;
      document.getElementById('ld-ciclo-vital-femenino')?.remove();
      document.getElementById('ld-bc-ciclo-vital-femenino')?.remove();
    };
  }, []);

  // Scroll-reveal
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

  // Autoplay galería
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % GALLERY_IMAGES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % GALLERY_IMAGES.length);
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length);

  // Autoplay carrusel de momentos
  useEffect(() => {
    const interval = setInterval(() => {
      setMomentosIndex((prev) => (prev + 1) % MOMENTOS_IMAGES.length);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowFloatingCta(window.scrollY > 700);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <LanguageProvider>
      <>
        <Header />
        <div className="bg-white text-gray-800 overflow-x-hidden">

          <CicloVitalFemeninoHero />

          {/* ====== ENCUENTRO MUJERES EN INVIERNO ====== */}
          <section id="que-viviras" className="py-20 md:py-32 px-6 bg-white">
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
              <div data-reveal>
                <p className="text-[#AA3E11] text-[10px] tracking-[0.4em] uppercase font-bold mb-6">Encuentro Mujeres en Invierno</p>
                <h2 className="text-3xl md:text-4xl serif-title text-brand mb-8 leading-tight">
                  Hay momentos en los que el alma pide silencio, respirar y volver a escuchar la voz del corazón.
                </h2>
                <p className="text-gray-600 text-base leading-relaxed mb-5" data-reveal data-delay="1">
                  Este retiro nace como una invitación a encontrarnos entre mujeres, en la calma de la montaña para habitar cada estación. En este capítulo: el ciclo del invierno — el tiempo de la pausa, la introspección, lo incómodo y la transformación.
                </p>
                <div className="w-10 h-px bg-[#AA3E11]/30 my-6" />
                <p className="text-gray-600 text-base leading-relaxed font-serif italic" data-reveal data-delay="2">
                  El invierno nos enseña que toda muerte simbólica abre el camino para un nuevo comienzo. Honraremos lo que necesita ser soltado, creando espacio para lo nuevo desde la coherencia, la escucha interna y la claridad.
                </p>
              </div>
              <div data-reveal data-delay="1">
                <div
                  className="relative w-full rounded-2xl overflow-hidden aspect-[4/5] md:aspect-square group"
                  style={{ boxShadow: '0 20px 60px rgba(0,83,51,0.15)' }}
                >
                  <img
                    src={img(MOMENTOS_IMAGES[momentosIndex].src, 900)}
                    alt={MOMENTOS_IMAGES[momentosIndex].alt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />

                  <button
                    onClick={() => setMomentosIndex((p) => (p - 1 + MOMENTOS_IMAGES.length) % MOMENTOS_IMAGES.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-white text-white hover:text-brand p-2 rounded-full backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-110 active:scale-90 z-20 cursor-pointer opacity-0 group-hover:opacity-100"
                    aria-label="Momento anterior"
                  >
                    <CaretLeft weight="thin" className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setMomentosIndex((p) => (p + 1) % MOMENTOS_IMAGES.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-white text-white hover:text-brand p-2 rounded-full backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-110 active:scale-90 z-20 cursor-pointer opacity-0 group-hover:opacity-100"
                    aria-label="Siguiente momento"
                  >
                    <CaretRight weight="thin" className="w-5 h-5" />
                  </button>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {MOMENTOS_IMAGES.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setMomentosIndex(index)}
                        className={`h-1.5 rounded-full transition-all duration-300 shadow-sm active:scale-90 cursor-pointer ${
                          index === momentosIndex ? 'bg-white w-5' : 'bg-white/50 hover:bg-white/80 w-1.5'
                        }`}
                        aria-label={`Ir al momento ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ====== QUÉ VIVIRÁS ====== */}
          <section className="relative py-20 md:py-28 px-6 overflow-hidden">
            <img
              src={img('/uploads/temazcal.webp', 1800)}
              alt="Temazcal — ritual de purificación"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'blur(2px)' }}
              loading="lazy"
            />
            <div className="absolute inset-0" style={{ background: 'rgba(0,45,28,0.78)' }} />
            <div className="relative z-10">
              <div className="max-w-3xl mx-auto text-center mb-14" data-reveal>
                <p className="text-gold text-[10px] tracking-[0.4em] uppercase font-bold mb-5">La experiencia</p>
                <h2 className="text-3xl md:text-5xl serif-title text-white leading-tight">¿Qué vivirás?</h2>
              </div>
              <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4" data-reveal data-delay="1">
                {QUE_VIVIRAS.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-white/80 text-sm md:text-base leading-relaxed text-left">
                    <span className="text-[#E88A5C] mt-0.5 flex-shrink-0">✧</span>
                    {item}
                  </div>
                ))}
              </div>
              <p className="text-white/50 text-sm md:text-base text-center mt-14 max-w-xl mx-auto leading-relaxed font-serif italic" data-reveal data-delay="2">
                Serán tres días de conexión, presencia y cuidado, en un entorno natural que invita a volver a lo esencial.
              </p>
            </div>
          </section>

          {/* ====== CÍRCULO DE MUJERES (foto full-bleed) ====== */}
          <section className="relative py-28 md:py-40 px-6 overflow-hidden">
            <img
              src={img('/uploads/img_8475.webp', 1800)}
              alt="Mujeres abrazadas en la montaña"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0" style={{ background: 'rgba(61,0,38,0.72)' }} />
            <div className="relative z-10 max-w-2xl mx-auto text-center" data-reveal>
              <p className="text-[#E894C0] text-[10px] tracking-[0.4em] uppercase font-bold mb-6">Círculo de mujeres</p>
              <p className="text-white font-serif italic text-2xl md:text-4xl leading-relaxed">
                "Nos sentamos, nos miramos, nos sostenemos. Ahí empieza la transmutación."
              </p>
              <div className="w-10 h-px bg-[#9D005E]/50 mx-auto mt-8" />
            </div>
          </section>

          {/* ====== ¿ES PARA VOS? ====== */}
          <section className="py-20 md:py-28 px-6 bg-[#F8F6F1]">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-14" data-reveal>
                <p className="text-gold text-[10px] tracking-[0.4em] uppercase font-bold mb-5">Antes de reservar</p>
                <h2 className="text-3xl md:text-4xl serif-title text-brand leading-tight">¿Es este encuentro para vos?</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-6 md:gap-8">
                <div className="rounded-2xl p-7 md:p-8" style={{ background: '#FBF0F5', boxShadow: '0 12px 40px rgba(157,0,94,0.08)' }} data-reveal data-delay="1">
                  <p className="text-[#9D005E] font-bold text-sm uppercase tracking-widest mb-5">Es para vos si...</p>
                  <ul className="space-y-3">
                    {ES_PARA_VOS.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-gray-600 text-sm leading-relaxed">
                        <span className="text-[#9D005E] mt-0.5 flex-shrink-0">✓</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white rounded-2xl p-7 md:p-8 border border-gray-100" data-reveal data-delay="2">
                  <p className="text-gray-400 font-bold text-sm uppercase tracking-widest mb-5">Quizás no sea el momento si...</p>
                  <ul className="space-y-3">
                    {NO_ES_PARA_VOS.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-gray-500 text-sm leading-relaxed">
                        <span className="text-gray-300 mt-0.5 flex-shrink-0">·</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <CicloVitalFemeninoLugar />

          {/* ====== GALERÍA DE INVIERNO ====== */}
          <section className="py-16 md:py-24 px-6 bg-white">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-5xl serif-title brand-green text-center mb-6 md:mb-8" data-reveal>
                Postales del Invierno
              </h2>
              <p className="text-gray-600 text-sm md:text-base text-center mb-10 md:mb-12 max-w-3xl mx-auto" data-reveal data-delay="1">
                Nieve, silencio y fuego en la montaña de Los Gigantes.
              </p>

              <div className="relative max-w-4xl mx-auto aspect-square md:aspect-[16/9] md:h-[500px]" data-reveal data-delay="2">
                <div className="relative w-full h-full overflow-hidden rounded-2xl shadow-lg group bg-gray-900">
                  <img
                    src={img(GALLERY_IMAGES[currentImage].src, 1200)}
                    alt={GALLERY_IMAGES[currentImage].alt}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
                  <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none z-10 px-4">
                    <span className="text-white text-sm md:text-lg font-medium drop-shadow-md">
                      {GALLERY_IMAGES[currentImage].alt}
                    </span>
                  </div>
                </div>

                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-white text-white hover:text-[#005333] p-2 md:p-3 rounded-full backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-110 active:scale-90 z-20 cursor-pointer"
                  aria-label="Imagen anterior"
                >
                  <CaretLeft weight="thin" className="w-6 h-6 md:w-8 md:h-8" />
                </button>

                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-white text-white hover:text-[#005333] p-2 md:p-3 rounded-full backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-110 active:scale-90 z-20 cursor-pointer"
                  aria-label="Siguiente imagen"
                >
                  <CaretRight weight="thin" className="w-6 h-6 md:w-8 md:h-8" />
                </button>

                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 md:gap-3 z-20">
                  {GALLERY_IMAGES.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImage(index)}
                      className={`h-2 md:h-2.5 rounded-full transition-all duration-300 shadow-sm active:scale-90 cursor-pointer ${
                        index === currentImage ? 'bg-white w-6 md:w-8' : 'bg-white/50 hover:bg-white/80 w-2 md:w-2.5'
                      }`}
                      aria-label={`Ir a imagen ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <CicloVitalFemeninoEquipo />
          <CicloVitalFemeninoTestimonios />
          <CicloVitalFemeninoMomentos />
          <CicloVitalFemeninoPrecios />
          <CicloVitalFemeninoFAQ />

          {/* ====== CTA FINAL ====== */}
          <section className="relative py-20 md:py-32 px-6 text-center overflow-hidden">
            <img
              src={img('/uploads/Invierno/20250627_222558.webp', 1800)}
              alt="Cielo estrellado sobre la montaña nevada"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="relative z-10 max-w-3xl mx-auto" data-reveal>
              <p className="text-[#E88A5C] text-[10px] tracking-[0.4em] uppercase font-bold mb-6">Quedan {RETREATS_DATA.cicloVitalFemenino.cupos} lugares</p>
              <h2 className="text-3xl md:text-5xl serif-title text-white mb-8 leading-tight">
                Para transmutar<br className="hidden md:block" /> todo lo que no ES.
              </h2>
              <p className="text-white/55 text-base leading-relaxed mb-10 mx-auto" style={{ maxWidth: '44ch' }}>
                Si sentís el llamado a regalarte este tiempo para vos, será una alegría recibirte.
              </p>
              <a href={RESERVATION_START_PATH} className="btn-gold inline-block">
                Reservar mi lugar
              </a>
            </div>
          </section>

          <Footer />
          <div className="bg-brand-green/5 text-brand-green/60 text-center text-xs py-3 border-t border-brand-green/10">
            Growth systems & digital experience by Catálisis
          </div>

          {/* FLOATING CTA — mobile only */}
          <div
            className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-all duration-500 ${showFloatingCta ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
            aria-hidden={!showFloatingCta}
          >
            <div className="bg-white border-t border-gray-100 shadow-2xl px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Ciclo Vital Femenino · Invierno</p>
                <p className="text-sm font-bold text-brand truncate">{RETREATS_DATA.cicloVitalFemenino.dates}</p>
              </div>
              <a href={WA_CONSULTA_HREF} target="_blank" rel="noopener noreferrer" className="btn-gold text-xs py-3 px-5 flex-shrink-0">
                Consultar
              </a>
            </div>
          </div>
        </div>
      </>
    </LanguageProvider>
  );
};

const CicloVitalFemenino: React.FC = () => <CicloVitalFemeninoContent />;

export default CicloVitalFemenino;
