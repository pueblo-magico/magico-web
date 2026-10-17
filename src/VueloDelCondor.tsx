import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { RESERVATION_START_PATH, SITE_URL } from './data/config';
import { RETREATS_DATA } from './data/retreats';
import { ROUTES } from './routes';

import VueloDelCondorHero from './components/VueloDelCondorHero';
import VueloDelCondorVideo from './components/VueloDelCondorVideo';
import VueloDelCondorCosmovision from './components/VueloDelCondorCosmovision';
import VueloDelCondorParaQuien from './components/VueloDelCondorParaQuien';
import VueloDelCondorVivencia from './components/VueloDelCondorVivencia';
import VueloDelCondorItinerario from './components/VueloDelCondorItinerario';
import VueloDelCondorEquipo from './components/VueloDelCondorEquipo';
import VueloDelCondorCoproduccion from './components/VueloDelCondorCoproduccion';
import VueloDelCondorGallery from './components/VueloDelCondorGallery';
import VueloDelCondorTestimonios from './components/VueloDelCondorTestimonios';
import VueloDelCondorInversion from './components/VueloDelCondorInversion';
import VueloDelCondorFAQ from './components/VueloDelCondorFAQ';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';

const VueloDelCondorContent: React.FC = () => {
  const { t } = useLanguage();
  const [currentImage, setCurrentImage] = useState(0);
  const [showFloatingCta, setShowFloatingCta] = useState(false);

  const images = [
    { src: "/uploads/temazcal.webp", alt: "Limpieza y Apertura" },
    { src: "/uploads/danza.webp", alt: "Dinámicas de introspección" },
    { src: "/uploads/origen.webp", alt: "Conexión con la naturaleza" },
    { src: "/uploads/botica.webp", alt: "Medicina Ancestral" },
  ];

  useEffect(() => {
    const TITLE = t.vuelo_condor.seo.title;
    const DESC  = t.vuelo_condor.seo.description;
    const URL   = SITE_URL + ROUTES.VUELO_CONDOR;
    const IMG   = `${SITE_URL}/uploads/temazcal.webp`;
    const prevTitle = document.title;

    document.title = TITLE;

    const setMeta = (sel: string, attr: string, val: string) => {
      let el = document.querySelector(sel) as HTMLMetaElement | null;
      if (!el) { el = document.createElement('meta'); document.head.appendChild(el); }
      el.setAttribute(attr, val);
    };

    setMeta('meta[name="description"]',        'content', DESC);
    setMeta('meta[property="og:title"]',       'content', TITLE);
    setMeta('meta[property="og:description"]', 'content', DESC);
    setMeta('meta[property="og:image"]',        'content', IMG);
    setMeta('meta[property="og:url"]',         'content', URL);
    setMeta('meta[property="og:type"]',        'content', 'website');

    const schema = {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      "name": "El Vuelo del Cóndor — Viaje Iniciático al Valle Sagrado",
      "description": DESC,
      "url": URL,
      "image": IMG,
      "touristType": "Spiritual travel, Ancestral medicine, Nature retreat",
      "itinerary": {
        "@type": "ItemList",
        "name": "Itinerario 7 días — Valle Sagrado, Perú",
        "numberOfItems": 7
      },
      "startDate": "2026-07-22",
      "endDate": "2026-07-29",
      "location": {
        "@type": "Place",
        "name": "Valle Sagrado de los Incas",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Cusco",
          "addressCountry": "PE"
        }
      },
      "organizer": {
        "@type": "Organization",
        "name": "Pueblo Mágico",
        "url": SITE_URL
      },
      "offers": {
        "@type": "Offer",
        "price": "1800",
        "priceCurrency": "USD",
        "availability": "https://schema.org/LimitedAvailability",
        "url": URL
      }
    };
    const ldScript = document.createElement('script');
    ldScript.type = 'application/ld+json';
    ldScript.id   = 'ld-vuelo-condor';
    ldScript.textContent = JSON.stringify(schema);
    if (!document.getElementById('ld-vuelo-condor')) document.head.appendChild(ldScript);

    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Inicio", "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": "El Vuelo del Cóndor", "item": URL }
      ]
    };
    const bcScript = document.createElement('script');
    bcScript.type = 'application/ld+json';
    bcScript.id   = 'ld-bc-vuelo';
    bcScript.textContent = JSON.stringify(breadcrumb);
    if (!document.getElementById('ld-bc-vuelo')) document.head.appendChild(bcScript);

    return () => {
      document.title = prevTitle;
      document.getElementById('ld-vuelo-condor')?.remove();
      document.getElementById('ld-bc-vuelo')?.remove();
    };
  }, [t]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentImage(p => (p + 1) % images.length), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowFloatingCta(window.scrollY > 700);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-white text-gray-800 overflow-x-hidden">
      <Header />

      <VueloDelCondorHero />
      <VueloDelCondorVideo />
      <VueloDelCondorCosmovision />
      <VueloDelCondorParaQuien />
      <VueloDelCondorVivencia />

      {/* EL GRUPO */}
      <section className="py-20 md:py-28 px-6 bg-brand-green text-white">
        <div className="max-w-3xl mx-auto text-center" data-reveal>
          <p className="text-[10px] tracking-[0.35em] uppercase text-brand-gold/70 mb-6">Contención y profundidad</p>
          <h2 className="text-3xl md:text-4xl serif-title text-brand-gold mb-6">{t.vuelo_condor.grupo.title}</h2>
          <p className="text-white/80 text-base md:text-xl leading-relaxed mb-6 font-light" data-reveal data-delay="1">
            {t.vuelo_condor.grupo.text1}
          </p>
          <div className="w-10 h-px bg-brand-gold/30 mx-auto my-6" />
          <p className="text-white/65 text-base md:text-lg font-serif italic" data-reveal data-delay="2">
            {t.vuelo_condor.grupo.text2}
          </p>
        </div>
      </section>

      <VueloDelCondorItinerario />
      <VueloDelCondorEquipo />

      <VueloDelCondorCoproduccion />

      <VueloDelCondorGallery />

      <VueloDelCondorTestimonios />
      <VueloDelCondorInversion />
      <VueloDelCondorFAQ />

      {/* CTA FINAL */}
      <section className="py-24 md:py-40 px-6 bg-brand-green text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-gold/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-2xl mx-auto relative z-10" data-reveal>
          <p className="text-[10px] tracking-[0.35em] uppercase text-brand-gold/70 mb-8">El próximo paso</p>
          <h2 className="text-4xl md:text-6xl serif-title text-white mb-6 leading-tight whitespace-pre-line">
            {t.vuelo_condor.cta.title}
          </h2>
          <div className="w-12 h-px bg-brand-gold/30 mx-auto my-7" />
          <p className="text-white/60 text-base md:text-lg font-serif italic leading-relaxed mb-12 max-w-md mx-auto" data-reveal data-delay="1">
            {t.vuelo_condor.cta.subtitle}
          </p>
          <div data-reveal data-delay="2" className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a href={RESERVATION_START_PATH} className="btn-gold inline-block text-lg py-5 px-10">
              {t.vuelo_condor.cta.btn}
            </a>
          </div>
          <p className="text-white/30 text-xs mt-8 font-light tracking-wide">22 al 29 de Julio · Valle Sagrado, Perú · USD 1.800</p>
        </div>
      </section>

      <Footer />
      <div className="bg-brand-green/5 text-brand-green/40 text-center text-[10px] tracking-widest uppercase py-6 border-t border-brand-green/10">
        Growth systems & digital experience by Catálisis
      </div>

      <WhatsAppButton />

      {/* FLOATING CTA — mobile only */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-all duration-500 ${showFloatingCta ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
        aria-hidden={!showFloatingCta}
      >
        <div className="bg-white border-t border-gray-100 shadow-2xl px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Viaje iniciático · Perú</p>
            <p className="text-sm font-bold text-brand-green truncate">USD 1.800 — {RETREATS_DATA.vueloDelCondor.dates}</p>
          </div>
          <a
            href={RESERVATION_START_PATH}
            className="btn-gold text-xs py-3 px-5 flex-shrink-0"
          >
            Reservar
          </a>
        </div>
      </div>
    </div>
  );
};

const VueloDelCondor: React.FC = () => {
  return <VueloDelCondorContent />;
};

export default VueloDelCondor;
