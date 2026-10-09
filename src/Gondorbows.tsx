import React, { useState, useEffect } from 'react';
import { LanguageProvider } from '../contexts/LanguageContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Target, House, ForkKnife, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { img } from './lib/img';
import { SITE_URL, WA_GONDOR } from './data/config';
import { ROUTES } from './routes';
import { RETREATS_DATA } from './data/retreats';

import GondorbowsHero from './components/GondorbowsHero';
import GondorbowsMagico from './components/GondorbowsMagico';
import GondorbowsPrecios from './components/GondorbowsPrecios';
import GondorbowsFAQ from './components/GondorbowsFAQ';

const Gondorbows: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'refugio' | 'domo'>('refugio');
  const [currentImage, setCurrentImage] = useState(0);
  
  const images = [
    { src: "/uploads/arcos-fuego.jpg", alt: "Arcos terminados frente al fuego" },
    { src: "/uploads/tirando.jpg", alt: "Tiro con arco en el bosque" },
    { src: "/uploads/herramientas.jpg", alt: "Herramientas de desbaste tradicionales" },
    { src: "/uploads/grupo.jpg", alt: "Comunidad y tribu con sus arcos" },
    { src: "/uploads/comida.jpg", alt: "Parrilla con comida serrana" }
  ];

  // SEO — title, meta, OG, canonical y JSON-LD
  useEffect(() => {
    const TITLE = 'Gondorbows — Arquería Ancestral · Los Gigantes, Córdoba';
    const DESC  = 'Construí tu propio arco en 3 días de inmersión en Los Gigantes, Córdoba. Taller de arquería tradicional con Gondor Bows. Todo incluido. Sin experiencia previa necesaria.';
    const URL   = SITE_URL + ROUTES.GONDORBOWS;
    const IMG   = `${SITE_URL}/uploads/arcos-fuego.jpg`;
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
    setMeta('meta[property="og:image:width"]',  'property', 'og:image:width');
    setMeta('meta[property="og:image:width"]',  'content',  '1200');
    setMeta('meta[property="og:image:height"]', 'property', 'og:image:height');
    setMeta('meta[property="og:image:height"]', 'content',  '630');
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
    setMeta('meta[property="og:locale"]',       'property', 'og:locale');
    setMeta('meta[property="og:locale"]',       'content',  'es_AR');

    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Event",
          "name": "Gondorbows — Retiro de Arquería Ancestral en Los Gigantes",
          "description": "3 días de retiro inmersivo: construí tu propio arco de arquería tradicional con materiales naturales guiado por Gondor Bows. Todo incluido. No requiere experiencia previa.",
          "startDate": "2026-07-24",
          "endDate": "2026-07-26",
          "eventStatus": "https://schema.org/EventScheduled",
          "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
          "location": { "@type": "Place", "name": "Pueblo Mágico", "address": { "@type": "PostalAddress", "addressLocality": "Los Gigantes", "addressRegion": "Córdoba", "addressCountry": "AR" } },
          "organizer": [
            { "@type": "Organization", "name": "Pueblo Mágico", "url": "https://www.experienciamagico.com" },
            { "@type": "Organization", "name": "Gondor Bows", "foundingDate": "2015", "description": "Organización dedicada a recuperar el arte ancestral de la arquería tradicional." }
          ],
          "offers": { "@type": "Offer", "url": URL, "priceCurrency": "ARS", "availability": "https://schema.org/LimitedAvailability", "description": "Todo incluido: materiales, alojamiento y gastronomía completa. 10% OFF viniendo de a dos." },
          "maximumAttendeeCapacity": 12,
          "image": IMG,
          "keywords": "arquería tradicional Córdoba, taller arco y flecha Argentina, retiro artesanal Córdoba, tecnología primitiva"
        },
        {
          "@type": "Course",
          "name": "Construcción de Arco Tradicional — Gondorbows",
          "description": "Taller práctico de 3 días para construir un arco de alto rendimiento Desde cero usando técnicas ancestrales. Multinivel: apto para principiantes y avanzados.",
          "provider": { "@type": "Organization", "name": "Gondor Bows" },
          "coursePrerequisites": "No requiere experiencia previa",
          "educationalLevel": "Multinivel"
        }
      ]
    };
    const ldScript = document.createElement('script');
    ldScript.type = 'application/ld+json';
    ldScript.id   = 'ld-gondorbows';
    ldScript.textContent = JSON.stringify(schema);
    if (!document.getElementById('ld-gondorbows')) document.head.appendChild(ldScript);

    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Inicio", "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": "Gondorbows", "item": URL }
      ]
    };
    const bcScript = document.createElement('script');
    bcScript.type = 'application/ld+json';
    bcScript.id   = 'ld-bc-gondorbows';
    bcScript.textContent = JSON.stringify(breadcrumb);
    if (!document.getElementById('ld-bc-gondorbows')) document.head.appendChild(bcScript);

    return () => {
      document.title = prevTitle;
      document.getElementById('ld-gondorbows')?.remove();
      document.getElementById('ld-bc-gondorbows')?.remove();
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

  // Autoplay
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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


      {/* Header removed to avoid blank page if context is missing */}

      {/* ====== HERO SECTION (closer, centered) ====== */}
      <GondorbowsHero />

      {/* ====== LA EXPERIENCIA ====== */}
      <section id="experiencia" className="py-20 md:py-32 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 md:gap-20 items-start">
            <div>
              <p className="text-gold text-[10px] tracking-[0.4em] uppercase font-bold mb-5">La experiencia</p>
              <h2 className="text-4xl md:text-5xl serif-title text-brand leading-[1.05]">
                El verdadero lujo es el tiempo de presencia.
              </h2>
            </div>
            <div className="md:pt-14 space-y-6">
              <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                Diseñamos esta experiencia con todo resuelto para que tu única tarea sea conectar con el entorno y el proceso creativo. A 1800 metros de altura, rodeado de 200 hectáreas de montañas, ríos y vertientes.
              </p>
              <p className="text-gray-700 text-base md:text-lg leading-relaxed font-serif">
                Durante tres días intensivos, construirás tu propio arco de alto rendimiento — recuperando habilidades desarrolladas durante más de 150.000 años de historia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====== QUÉ INCLUYE ====== */}
      <section id="comodidad" className="py-20 md:py-32 px-6 bg-[#F8F6F1]">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-[5fr_7fr] gap-12 md:gap-20 items-start">
            <div>
              <p className="text-gold text-[10px] tracking-[0.4em] uppercase font-bold mb-5">Todo incluido</p>
              <h2 className="text-4xl md:text-5xl serif-title text-brand leading-[1.05]">
                Todo preparado para tu inmersión.
              </h2>
              <p className="text-gray-400 text-sm mt-5 leading-relaxed" style={{ maxWidth: '28ch' }}>
                Llegás, te instalás y te enfocás en crear.
              </p>
            </div>

            <div className="divide-y divide-gray-200/70 mt-2 md:mt-12">
              {([
                { icon: Target, title: 'Taller Exclusivo de Arquería', desc: 'Todos los materiales, herramientas y la guía directa de Gondorbows para construir tu arco Desde cero.' },
                { icon: House,  title: 'Alojamiento Inmersivo',        desc: 'Refugio de Piedra y domos geodésicos en bosque nativo. Ropa blanca, bio-cosmética, agua caliente 24 h y WiFi.' },
                { icon: ForkKnife, title: 'Pensión Completa',          desc: 'Gastronomía de estación, abundante y riquísima. Todas las comidas incluidas para que no pienses en nada más.' },
              ] as { icon: React.ComponentType<any>; title: string; desc: string }[]).map(({ icon: Icon, title, desc }) => (
                <div key={title} className="py-7 flex items-start gap-5 group">
                  <div className="w-10 h-10 rounded-xl bg-brand/8 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-brand transition-colors duration-300">
                    <Icon weight="thin" className="w-5 h-5 text-brand group-hover:text-white transition-colors duration-300" />
                  </div>
                  <div>
                    <h4 className="text-brand font-semibold text-base mb-1.5">{title}</h4>
                    <p className="text-gray-500 text-sm leading-relaxed" style={{ maxWidth: '44ch' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ====== PRUEBA SOCIAL ====== */}
      <section className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-gold text-[10px] tracking-[0.4em] uppercase font-bold text-center mb-5">Testimonios</p>
          <h2 className="text-3xl md:text-4xl serif-title text-brand text-center mb-12 leading-tight">
            Mirá lo que vivieron los grupos anteriores.
          </h2>
          <iframe
            width="100%"
            height="420"
            src="https://www.youtube-nocookie.com/embed/Q0l3wI7_5LI"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
            className="rounded-2xl shadow-lg"
          />
        </div>
      </section>

      {/* ====== AUTORIDAD ====== */}
      <section className="py-20 md:py-32 px-6 bg-[#F8F6F1]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Foto */}
            <div className="order-2 md:order-1">
              <img
                src={img('/uploads/fausto-tallando.jpg', 800)}
                alt="Fausto trabajando"
                className="w-full object-cover rounded-2xl h-auto aspect-[4/5] md:aspect-square"
                style={{ boxShadow: '0 20px 60px rgba(0,83,51,0.12)' }}
              />
            </div>

            {/* Texto */}
            <div className="order-1 md:order-2">
              <img src="/uploads/logo-gondor-bows.png" alt="Gondor Bows" className="w-14 mb-6" />
              <p className="text-gold text-[10px] tracking-[0.4em] uppercase font-bold mb-4">Tus guías</p>
              <h2 className="text-3xl md:text-4xl serif-title text-brand mb-6 leading-tight">
                Gondor Bows
              </h2>
              <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-5">
                Gondor Bows nace en 2015 con la misión de recuperar el arte ancestral de la arquería tradicional, integrando técnicas manuales, conexión con la naturaleza y una mirada contemporánea sobre el trabajo artesanal.
              </p>
              <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-8">
                Un equipo comprometido con transmitir oficios que despiertan algo profundo: la memoria del cuerpo, la paciencia del proceso y el poder de crear con tus propias manos.
              </p>

              {/* Quote — sin border-left */}
              <blockquote className="relative pl-6 py-1">
                <span className="absolute top-0 left-0 text-5xl leading-none text-brand/15 font-serif select-none" aria-hidden="true">"</span>
                <p className="text-brand/75 italic text-sm md:text-base leading-relaxed font-serif">
                  Esta experiencia es multinivel: podés venir sin ninguna experiencia previa o ya con conocimiento para profundizar la técnica.
                </p>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* ====== CRONOGRAMA ====== */}
      <section className="py-20 md:py-32 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <p className="text-gold text-[10px] tracking-[0.4em] uppercase font-bold mb-4">3 días</p>
            <h2 className="text-4xl md:text-6xl serif-title text-brand">Cronograma de la Inmersión</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200/70">
            {([
              {
                num: '01', day: 'Viernes', title: 'Llegada & Preparación',
                items: [
                  'Recepción y acomodación en Pueblo Mágico',
                  'Introducción a la tecnología primitiva',
                  'Selección del vástago de madera',
                  'Primer desbaste del arco',
                  'Cena de bienvenida y fuego',
                ],
              },
              {
                num: '02', day: 'Sábado', title: 'Taller Intensivo',
                items: [
                  'Desayuno serrano',
                  'Jornada intensiva: trabajo de la fibra',
                  'Diseño de palas y alineación por calor',
                  'Almuerzo nutritivo',
                  'Continuación del proceso de forja',
                  'Cena y descanso',
                ],
              },
              {
                num: '03', day: 'Domingo', title: 'Finalización & Prueba',
                items: [
                  'Desayuno',
                  'Tillerizado fino: balance y retoques',
                  'Prueba de tiro en entorno natural',
                  'Almuerzo de cierre',
                  'Entrega de arcos y despedida (17:00 hs)',
                ],
              },
            ] as { num: string; day: string; title: string; items: string[] }[]).map(({ num, day, title, items }) => (
              <div key={num} className="py-10 md:py-0 md:px-10 first:md:pl-0 last:md:pr-0">
                <p
                  className="serif-title text-brand/8 leading-none select-none -mb-2"
                  style={{ fontSize: 'clamp(5rem, 10vw, 7rem)' }}
                  aria-hidden="true"
                >
                  {num}
                </p>
                <p className="text-gold text-[10px] tracking-[0.35em] uppercase font-bold mb-2">{day}</p>
                <h3 className="text-xl md:text-2xl serif-title text-brand mb-5 leading-snug">{title}</h3>
                <ul className="space-y-2.5">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-gray-500 text-sm leading-relaxed">
                      <span className="w-1 h-1 rounded-full bg-gold/50 flex-shrink-0 mt-2" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-gray-400 text-xs md:text-sm text-center mt-14 max-w-xl mx-auto leading-relaxed">
            El cronograma garantiza que te lleves tu arco terminado y funcional, respetando los tiempos de aprendizaje de cada participante.
          </p>
        </div>
      </section>

      {/* ====== POSTALES DE LA INMERSIÓN ====== */}
      <section className="py-16 md:py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl serif-title brand-green text-center mb-6 md:mb-8">
            Postales de la Inmersión
          </h2>
          <p className="text-gray-600 text-sm md:text-base text-center mb-10 md:mb-12 max-w-3xl mx-auto">
            Comunidad, fuego, herramientas tradicionales y el sabor de las sierras.
          </p>
          
          {/* Carrusel Horizontal / Mobile Cuadrado */}
          <div className="relative max-w-4xl mx-auto aspect-square md:aspect-[16/9] md:h-[500px]">
            {/* Imagen actual */}
            <div className="relative w-full h-full overflow-hidden rounded-2xl shadow-lg group bg-gray-900">
              <img 
                src={images[currentImage].src} 
                alt={images[currentImage].alt} 
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
              
              {/* Overlay suave para legibilidad */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>

              {/* Título de la imagen opcional */}
              <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none z-10 px-4">
                <span className="text-white text-sm md:text-lg font-medium drop-shadow-md">
                  {images[currentImage].alt}
                </span>
              </div>
            </div>
            
            {/* Flechas de navegación (laterales) */}
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
            
            {/* Indicadores (inferiores) */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 md:gap-3 z-20">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImage(index)}
                  className={`h-2 md:h-2.5 rounded-full transition-all duration-300 shadow-sm active:scale-90 cursor-pointer ${
                    index === currentImage 
                      ? 'bg-white w-6 md:w-8' 
                      : 'bg-white/50 hover:bg-white/80 w-2 md:w-2.5'
                  }`}
                  aria-label={`Ir a imagen ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ====== Pueblo Mágico - UBICACIÓN ====== */}
      <GondorbowsMagico />

      {/* ====== PRECIOS ====== */}
      <GondorbowsPrecios />

      {/* ====== FAQ ====== */}
      <GondorbowsFAQ />

      {/* ====== CTA FINAL ====== */}
      <section className="py-20 md:py-32 px-6 bg-brand text-white">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gold text-[10px] tracking-[0.4em] uppercase font-bold mb-6">Cupos limitados</p>
          <h2 className="text-3xl md:text-5xl serif-title text-white mb-8 leading-tight">
            ¿Y si este fin de semana<br className="hidden md:block" /> se convierte en uno que no olvidás?
          </h2>
          <p className="text-white/55 text-base leading-relaxed mb-10 mx-auto" style={{ maxWidth: '44ch' }}>
            La pausa que tu rutina necesita. La inmersión total que estás esperando.
          </p>
          <a
            href={"https://wa.me/" + WA_GONDOR + "?text=" + encodeURIComponent(RETREATS_DATA.gondorbows.message)}
            className="btn-gold inline-block"
          >
            Asegurar mi lugar
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
      </>
    </LanguageProvider>
  );
};

export default Gondorbows;
