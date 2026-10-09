import React, { useState, useEffect } from 'react';
import { LanguageProvider } from '../contexts/LanguageContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { img } from './lib/img';

import AchalaVivaHero from './components/AchalaVivaHero';
import AchalaVivaMagico from './components/AchalaVivaMagico';
import AchalaVivaPrecios from './components/AchalaVivaPrecios';
import AchalaVivaFAQ from './components/AchalaVivaFAQ';
import { WA_MAGICO, SITE_URL } from './data/config';
import { ROUTES } from './routes';

const AchalaViva: React.FC = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  
  // Using placeholder images requested by user
  const images = [
    { src: "https://images.pexels.com/photos/31299365/pexels-photo-31299365.jpeg", alt: "Fotografía en la Naturaleza" },
    { src: "https://images.pexels.com/photos/12506594/pexels-photo-12506594.jpeg", alt: "AstroTurismo y Cielos Oscuros" },
    { src: "/uploads/Pajaros/condor.jpg", alt: "Avistaje: Cóndor Andino" },
    { src: "https://images.pexels.com/photos/32163268/pexels-photo-32163268.jpeg", alt: "Avistaje: Pirincho (Guira guira)" },
    { src: "https://images.pexels.com/photos/28315745/pexels-photo-28315745.jpeg", alt: "Avistaje: Pájaro Carpintero" },
    { src: "https://images.pexels.com/photos/16708744/pexels-photo-16708744.jpeg", alt: "Avistaje: Benteveo" },
    { src: "/uploads/hero(3).webp", alt: "Entorno Natural: Sierras Grandes" },
    { src: "/uploads/469742031_941240881439467_8316347989568757415_n.webp", alt: "Experiencia en Comunidad" }
  ];

  // SEO — title, meta, OG, canonical y JSON-LD para esta página
  useEffect(() => {
    const TITLE = 'Achala Viva — Inmersión en la Biodiversidad Serrana';
    const DESC = '2 días de conexión profunda con la flora, fauna y cielos de Los Gigantes. Con el Biólogo Walter Cejas. Todo incluido.';
    const URL = SITE_URL + ROUTES.ACHALA_VIVA;
    const IMG = `${SITE_URL}/uploads/hero(3).webp`;
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

    setMeta('meta[name="description"]',   'content', DESC);
    setMeta('meta[property="og:title"]',  'property', 'og:title');
    setMeta('meta[property="og:title"]',  'content',  TITLE);
    setMeta('meta[property="og:description"]', 'property', 'og:description');
    setMeta('meta[property="og:description"]', 'content',  DESC);
    setMeta('meta[property="og:image"]',        'property', 'og:image');
    setMeta('meta[property="og:image"]',        'content',  IMG);
    setMeta('meta[property="og:image:width"]',  'property', 'og:image:width');
    setMeta('meta[property="og:image:width"]',  'content',  '1200');
    setMeta('meta[property="og:image:height"]', 'property', 'og:image:height');
    setMeta('meta[property="og:image:height"]', 'content',  '630');
    setMeta('meta[property="og:url"]',    'property', 'og:url');
    setMeta('meta[property="og:url"]',    'content',  URL);
    setMeta('meta[property="og:type"]',   'property', 'og:type');
    setMeta('meta[property="og:type"]',   'content',  'website');
    setLink('canonical', URL);

    setMeta('meta[name="twitter:card"]',        'name',    'twitter:card');
    setMeta('meta[name="twitter:card"]',        'content', 'summary_large_image');
    setMeta('meta[name="twitter:title"]',       'name',    'twitter:title');
    setMeta('meta[name="twitter:title"]',       'content', TITLE);
    setMeta('meta[name="twitter:description"]', 'name',    'twitter:description');
    setMeta('meta[name="twitter:description"]', 'content', DESC);
    setMeta('meta[name="twitter:image"]',       'name',    'twitter:image');
    setMeta('meta[name="twitter:image"]',       'content', IMG);
    setMeta('meta[property="og:locale"]',       'property', 'og:locale');
    setMeta('meta[property="og:locale"]',       'content',  'es_AR');

    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Inicio", "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": "Achala Viva", "item": URL }
      ]
    };
    const bcScript = document.createElement('script');
    bcScript.type = 'application/ld+json';
    bcScript.id   = 'ld-bc-achala';
    bcScript.textContent = JSON.stringify(breadcrumb);
    if (!document.getElementById('ld-bc-achala')) document.head.appendChild(bcScript);

    return () => {
      document.title = prevTitle;
      document.getElementById('ld-achala-viva')?.remove();
      document.getElementById('ld-bc-achala')?.remove();
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

  // Autoplay carrusel
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPaused, images.length]);

  // Touch handlers para swipe
  const handleTouchStart = (e: React.TouchEvent) => {
      setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
      if (!touchStart || !touchEnd) return;
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > 50;
      const isRightSwipe = distance < -50;
      if (isLeftSwipe) {
          nextImage();
      }
      if (isRightSwipe) {
          prevImage();
      }
      // reset values
      setTouchStart(0);
      setTouchEnd(0);
  };

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <LanguageProvider>
      <>
        <Header />
        <div className="bg-white text-gray-800 overflow-x-hidden">


      {/* ====== HERO SECTION ====== */}
      <AchalaVivaHero />

      {/* ====== EL DOLOR Y LA IDENTIFICACION ====== */}
      <section id="experiencia" className="py-16 md:py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 data-reveal className="text-4xl md:text-5xl serif-title brand-green mb-8 md:mb-10" style={{ lineHeight: '1.1', letterSpacing: '-0.01em' }}>
            Vivimos rodeados de ruido,<br className="hidden md:block" /> pero estamos sordos a lo esencial.
          </h2>

          <div data-reveal data-delay="1" className="max-w-2xl flex flex-col gap-4 mb-10">
            <p className="text-gray-500 text-lg md:text-xl leading-relaxed font-light">
              Pasamos los días mirando pantallas, corriendo contra el reloj y viviendo en piloto automático. La naturaleza está ahí, pero ya no sabemos cómo verla, ni cómo escucharla.
            </p>
            <p className="text-gray-700 text-lg md:text-xl leading-relaxed">
              Achala Viva no es una "escapada de fin de semana". Es una puerta para abrir la percepción, afinar los sentidos y reconectar con la inteligencia viva de la Sierra. No venís solo a descansar; venís a recordar que sos parte de algo inmenso.
            </p>
          </div>

          {/* Lista editorial numerada — sin iconos sobre cada heading */}
          <div className="max-w-xl">
            {[
              { num: "01", heading: "El cielo nocturno como brújula", text: "Aprender a leer las constelaciones, planetas y vida nocturna de la sierra." },
              { num: "02", heading: "La biodiversidad como maestra", text: "Observación guiada de flora y fauna nativa en tiempo real, con biólogo presente." },
              { num: "03", heading: "La presencia como camino", text: "Reducir el ritmo al de la montaña. Sin agenda. Sin pantallas. Con todos los sentidos." },
            ].map((item, i) => (
              <div key={item.num} data-reveal data-delay={String(i + 2)} className={`py-6 flex items-start gap-7 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                <span className="serif-title text-2xl font-light w-10 flex-shrink-0 tabular-nums leading-none mt-0.5" style={{ color: 'rgba(0,83,51,0.18)' }}>{item.num}</span>
                <div>
                  <h4 className="font-bold brand-green text-sm uppercase tracking-widest mb-1">{item.heading}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== EL VEHICULO ====== */}
      <section className="py-16 md:py-24 px-6 bg-[#005333]/[0.04]">
        <div className="max-w-4xl mx-auto">
          <h2 data-reveal className="text-4xl md:text-5xl serif-title brand-green mb-5" style={{ lineHeight: '1.1' }}>
            Tu refugio y tus herramientas
          </h2>
          <p data-reveal data-delay="1" className="text-gray-500 text-base md:text-lg leading-relaxed max-w-2xl mb-10 font-light">
            Durante 2 días te sumergís donde la ciencia y la contemplación se unen. Nosotros nos ocupamos de toda la logística; vos solo te ocupás de estar presente.
          </p>

          {/* Lista editorial numerada — reemplaza las 3 tarjetas idénticas */}
          <div className="divide-y divide-[#E8E4D9]">
            {[
              {
                num: "01",
                title: "Conocimiento Aplicado",
                text: "No son charlas, es interpretación en el terreno. Astroturismo, avistaje de aves y lectura del paisaje en tiempo real con guía biológica.",
              },
              {
                num: "02",
                title: "Descanso Premium",
                text: "Refugio de Piedra y domos geodésicos en medio del bosque nativo. Ropa blanca, biocosmética y agua caliente 24h. Cuidado humano real.",
              },
              {
                num: "03",
                title: "Nutrición Regenerativa",
                text: "Pensión completa con gastronomía local y de estación. Abundante, riquísima y pensada para sostener tu energía durante toda la inmersión.",
              },
            ].map((item, idx) => (
              <div key={item.num} data-reveal data-delay={String(idx + 2)} className="py-8 flex flex-col md:flex-row gap-4 md:gap-12 items-start">
                <div className="md:w-52 flex-shrink-0">
                  <span className="serif-title text-4xl font-light block leading-none" style={{ color: 'rgba(0,83,51,0.15)' }}>{item.num}</span>
                  <h4 className="font-bold brand-green text-sm uppercase tracking-widest mt-2">{item.title}</h4>
                </div>
                <p className="text-gray-600 text-base leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== AUTORIDAD (FACILITADOR) ====== */}
      <section className="py-16 md:py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div data-reveal className="order-2 md:order-1">
              <img
                src={img('/uploads/Walter_E._Cejas.jpg', 600)}
                alt="Walter Eugenio Cejas — Biólogo guía de Achala Viva"
                loading="lazy"
                className="w-full object-cover rounded-2xl h-auto aspect-[4/5]"
              />
            </div>
            <div data-reveal data-delay="1" className="order-1 md:order-2">
              <p className="font-medium uppercase tracking-[0.2em] text-[11px] brand-green mb-4">Tu guía en esta inmersión</p>
              <h2 className="text-3xl md:text-4xl serif-title brand-green mb-2" style={{ lineHeight: '1.15' }}>
                Walter Eugenio Cejas
              </h2>
              <p className="text-gray-400 text-sm font-light mb-6 uppercase tracking-widest">
                Biólogo · Investigador · Vida Silvestre
              </p>
              <p className="text-gray-600 text-base md:text-lg leading-relaxed font-light">
                Walter no es solo un docente; es un puente entre el conocimiento científico y la experiencia directa. Te va a guiar a través de los secretos mejor guardados de la Sierra de Achala con la cercanía de quien conoce su propia casa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====== CRONOGRAMA ====== */}
      <section className="py-16 md:py-24 px-6 bg-[#FAF9F5]">
        <div className="max-w-5xl mx-auto">
          <div data-reveal className="mb-10 md:mb-14">
            <p className="font-medium uppercase tracking-[0.2em] text-[11px] brand-green mb-3">Dos días · Los Gigantes</p>
            <h2 className="text-4xl md:text-5xl serif-title brand-green" style={{ lineHeight: '1.1' }}>
              Cronograma de la Inmersión
            </h2>
          </div>

          <div className="max-w-4xl">

            {/* Día 1 */}
            <div data-reveal data-delay="1" className="pb-10 md:pb-14">
              <div className="flex items-end gap-5 md:gap-8 pb-5 mb-6 border-b border-[#E8E4D9]">
                <span className="serif-title text-[88px] md:text-[120px] font-light leading-none select-none" style={{ color: '#005333', opacity: 0.08 }}>1</span>
                <div className="pb-2">
                  <p className="font-medium uppercase tracking-[0.22em] text-[11px] brand-green mb-1">Sábado</p>
                  <h3 className="text-2xl md:text-3xl serif-title brand-green">Tierra y Cielo</h3>
                </div>
              </div>
              <div className="divide-y divide-[#EDEBE3] md:pl-12">
                {[
                  "Recepción y acomodación en Pueblo Mágico",
                  "Almuerzo de bienvenida",
                  "Taller de Fotografía en la naturaleza",
                  "Charla–taller de Astroturismo y Ecoturismo",
                  "Merienda de campo",
                  "Al caer la noche — observación del cielo profundo, constelaciones y vida nocturna de la sierra",
                  "Cena compartida bajo el cielo abierto con fogón",
                ].map((item, i) => (
                  <p key={i} className="py-3 text-gray-600 font-light text-base leading-relaxed">{item}</p>
                ))}
              </div>
            </div>

            {/* Separador de días */}
            <div className="w-12 h-px bg-[#D4AF37] mb-10 md:mb-14" />

            {/* Día 2 */}
            <div data-reveal data-delay="2">
              <div className="flex items-end gap-5 md:gap-8 pb-5 mb-6 border-b border-[#E8E4D9]">
                <span className="serif-title text-[88px] md:text-[120px] font-light leading-none select-none" style={{ color: '#005333', opacity: 0.08 }}>2</span>
                <div className="pb-2">
                  <p className="font-medium uppercase tracking-[0.22em] text-[11px] brand-green mb-1">Domingo</p>
                  <h3 className="text-2xl md:text-3xl serif-title brand-green">Vida Silvestre</h3>
                </div>
              </div>
              <div className="divide-y divide-[#EDEBE3] md:pl-12">
                {[
                  "Despertar en la naturaleza",
                  "Desayuno serrano",
                  "Salida de observación — avistaje de aves + lectura del paisaje con biólogo",
                  "Almuerzo de campo para integrar la experiencia",
                  "Despedida por la tarde",
                ].map((item, i) => (
                  <p key={i} className="py-3 text-gray-600 font-light text-base leading-relaxed">{item}</p>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ====== POSTALES DE LA INMERSIÓN ====== */}
      <section className="py-16 md:py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 data-reveal className="text-4xl md:text-5xl serif-title brand-green text-center mb-4" style={{ lineHeight: '1.1' }}>
            Postales de la Inmersión
          </h2>
          <p data-reveal data-delay="1" className="text-gray-500 text-base md:text-lg text-center mb-8 md:mb-12 max-w-xl mx-auto font-light">
            Paisajes, astroturismo y avistaje en su máxima expresión.
          </p>
          
          {/* Carrusel */}
          <div data-reveal data-delay="2" 
               className="relative max-w-5xl mx-auto aspect-square md:aspect-[16/9]"
               onMouseEnter={() => setIsPaused(true)}
               onMouseLeave={() => setIsPaused(false)}
               onTouchStart={handleTouchStart}
               onTouchMove={handleTouchMove}
               onTouchEnd={handleTouchEnd}
          >
            <div className="relative w-full h-full overflow-hidden rounded-2xl shadow-lg group bg-stone-900 flex items-center justify-center">
              <img
                src={images[currentImage].src}
                alt={images[currentImage].alt}
                className="w-full h-full object-cover transition-opacity duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
              <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none z-10 px-4">
                <span className="text-white text-sm md:text-lg font-medium drop-shadow-md">
                  {images[currentImage].alt}
                </span>
              </div>
            </div>
            
            <button
              onClick={prevImage}
              aria-label="Imagen anterior"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-[#001a0d]/50 hover:bg-white text-white hover:text-[#005333] p-3 rounded-full backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-110 active:scale-90 z-20 cursor-pointer"
            >
              <CaretLeft weight="light" className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button
              onClick={nextImage}
              aria-label="Siguiente imagen"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-[#001a0d]/50 hover:bg-white text-white hover:text-[#005333] p-3 rounded-full backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-110 active:scale-90 z-20 cursor-pointer"
            >
              <CaretRight weight="light" className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1 z-20">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImage(index)}
                  aria-label={`Ver ${img.alt}`}
                  aria-current={index === currentImage ? 'true' : undefined}
                  className={`relative flex items-center justify-center w-8 h-8 cursor-pointer`}
                >
                  <span className={`block rounded-full transition-all duration-300 ${
                    index === currentImage
                      ? 'bg-white w-5 h-1.5'
                      : 'bg-white/50 hover:bg-white/80 w-1.5 h-1.5'
                  }`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ====== Pueblo Mágico - UBICACIÓN ====== */}
      <AchalaVivaMagico />

      {/* ====== PRECIOS ====== */}
      <AchalaVivaPrecios />

      {/* ====== PREGUNTAS FRECUENTES ====== */}
      <AchalaVivaFAQ />

      {/* ====== CTA FINAL ====== */}
      <section className="py-16 md:py-24 px-6 bg-[#005333]/[0.04]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 data-reveal className="text-3xl md:text-5xl serif-title brand-green mb-6" style={{ lineHeight: '1.12' }}>
            El cielo, la tierra y la vida latiendo en un mismo instante.
          </h2>
          <p data-reveal data-delay="1" className="text-gray-500 text-base md:text-lg leading-relaxed mb-8 max-w-xl mx-auto font-light">
            Achala Viva es la pausa que tu instinto busca. Unimos ciencia, contemplación y descanso para ofrecerte una inmersión inolvidable.
          </p>
          <a data-reveal data-delay="2" href={"https://wa.me/" + WA_MAGICO + "?text=%C2%A1Hola!%20Me%20interesa%20Achala%20Viva%20y%20quiero%20saber%20cu%C3%A1ndo%20es%20la%20pr%C3%B3xima%20fecha.%20%F0%9F%97%93%EF%B8%8F%E2%9C%A8"} className="btn-gold inline-block">
            Consultar próximas fechas
          </a>
        </div>
      </section>
        
        {/* Footer */}
        <Footer />
        
        {/* Catálisis Credit */}
        <div className="bg-brand-green/5 text-brand-green/60 text-center text-xs py-3 border-t border-brand-green/10">
          Growth systems & digital experience by Catálisis
        </div>
      </div>

      {/* ====== STICKY CTA MÓVIL ====== */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-[#005333] uppercase tracking-widest truncate">Achala Viva · Próximas fechas</p>
          <p className="text-[11px] text-gray-400 truncate">15 plazas · Consultá disponibilidad</p>
        </div>
        <a
          href={"https://wa.me/" + WA_MAGICO + "?text=%C2%A1Hola!%20Me%20interesa%20Achala%20Viva%20y%20quiero%20saber%20cu%C3%A1ndo%20es%20la%20pr%C3%B3xima%20fecha.%20%F0%9F%97%93%EF%B8%8F%E2%9C%A8"}
          className="btn-gold flex-shrink-0 whitespace-nowrap"
          style={{ padding: '0.5rem 1.1rem', fontSize: '0.78rem', borderRadius: '40px' }}
        >
          Consultar
        </a>
      </div>

      {/* Spacer para que el sticky no tape el footer en móvil */}
      <div className="h-16 md:hidden" aria-hidden="true"></div>
      </>
    </LanguageProvider>
  );
};

export default AchalaViva;
