import React, { useEffect, useState } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import { Header } from './components/Header';
import { HeroNuevo } from './components/HeroNuevo';
import { SectionNosotros } from './components/SectionNosotros';
import { SectionPilares } from './components/SectionPilares';
import { SectionVideo } from './components/SectionVideo';
import { SectionExperiencias } from './components/SectionExperiencias';
import { SectionNichos } from './components/SectionNichos';
import { SectionTestimonios } from './components/SectionTestimonios';
import { SectionEventos } from './components/SectionEventos';
import { SectionComoLlegar } from './components/SectionComoLlegar';
import { SectionContacto } from './components/SectionContacto';
import { SectionInclusiones } from './components/SectionInclusiones';
import { SectionParaQuien } from './components/SectionParaQuien';
import { SectionFAQ } from './components/SectionFAQ';
import { Footer } from './components/Footer';
import { WhatsAppButton } from './components/WhatsAppButton';
import { CookieBanner } from './components/CookieBanner';

import { SITE_URL } from './src/data/config';
import { ROUTES } from './src/routes';

const Main: React.FC = () => {
  const [belowFoldReady, setBelowFoldReady] = useState(false);

  useEffect(() => {
    // Forzamos la carga de elementos pesados después de que la prioridad inicial termine
    // o después de 1 segundo como máximo (seguridad para PageSpeed y UX)
    const timer = setTimeout(() => setBelowFoldReady(true), 1000);
    
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        clearTimeout(timer);
        setBelowFoldReady(true);
      });
    }
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const TITLE = 'Pueblo Mágico — Ecolodge de Montaña · Los Gigantes, Córdoba';
    const DESC  = 'Ecolodge de montaña en las Sierras Grandes de Córdoba: Refugio de Piedra, domos geodésicos y camping. Retiros, co-living y voluntariados. Energía solar, baños secos y compost.';
    const URL   = SITE_URL + ROUTES.HOME;
    const IMG   = `${SITE_URL}/uploads/img_6948.webp`;
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
      "@type": ["LodgingBusiness", "TouristAttraction"],
      "name": "Pueblo Mágico",
      "description": DESC,
      "url": URL,
      "image": IMG,
      "telephone": "+5493516765820",
      "email": "experienciamagico@gmail.com",
      "priceRange": "$$",
      "currenciesAccepted": "ARS",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Paraje Cuchilla Nevada, Ojo de Agua",
        "addressLocality": "Pedanía La Candelaria",
        "addressRegion": "Córdoba",
        "addressCountry": "AR"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": -31.5,
        "longitude": -64.7
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "5.0",
        "reviewCount": "64",
        "bestRating": "5",
        "worstRating": "1"
      },
      "amenityFeature": [
        { "@type": "LocationFeatureSpecification", "name": "Refugio de Piedra: recepción, salón y comedor; habitaciones compartidas o una entera para tu grupo" },
        { "@type": "LocationFeatureSpecification", "name": "Glamping en domos geodésicos" },
        { "@type": "LocationFeatureSpecification", "name": "Camping" },
        { "@type": "LocationFeatureSpecification", "name": "Energía solar casi al 100%" },
        { "@type": "LocationFeatureSpecification", "name": "Baños secos que no contaminan el agua" },
        { "@type": "LocationFeatureSpecification", "name": "Compostamos todos los residuos compostables" },
        { "@type": "LocationFeatureSpecification", "name": "+25.000 árboles nativos plantados" },
        { "@type": "LocationFeatureSpecification", "name": "Retiros y voluntariados" },
        { "@type": "LocationFeatureSpecification", "name": "Coworking con Starlink" },
        { "@type": "LocationFeatureSpecification", "name": "Cocina de autor orgánica" }
      ]
    };
    const ldScript = document.createElement('script');
    ldScript.type = 'application/ld+json';
    ldScript.id   = 'ld-main';
    ldScript.textContent = JSON.stringify(schema);
    if (!document.getElementById('ld-main')) document.head.appendChild(ldScript);

    return () => {
      document.title = prevTitle;
      document.getElementById('ld-main')?.remove();
    };
  }, []);

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

  return (
    <div className="font-sans antialiased selection:bg-brand selection:text-white">
      <Header />
      <main>
        <HeroNuevo />
        <div style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px', isolation: 'isolate' }}><SectionParaQuien /></div>
        <div style={{ contentVisibility: 'auto', containIntrinsicSize: '0 800px', isolation: 'isolate' }}><SectionExperiencias /></div>
        <div style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px', isolation: 'isolate' }}><SectionInclusiones /></div>

        {/* CTA puente → /estadia */}
        <div style={{ background: '#005333', padding: '28px 24px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
            ¿Querés hospedarte?
          </p>
          <p style={{ color: 'white', fontSize: 18, fontFamily: 'Georgia, serif', fontWeight: 400, marginBottom: 16 }}>
            Mirá todos los alojamientos, precios detallados y el retiro Reset Vital incluido
          </p>
          <a href="/estadia"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#D4AF37', color: 'white', borderRadius: 999, padding: '12px 28px', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none' }}>
            Ver estadías & glamping →
          </a>
        </div>

        <div style={{ contentVisibility: 'auto', containIntrinsicSize: '0 600px', isolation: 'isolate' }}><SectionEventos /></div>
        <div style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px', isolation: 'isolate' }}><SectionTestimonios /></div>
        <SectionNosotros />
        <SectionPilares />
        <SectionVideo />
        <div style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px', isolation: 'isolate' }}><SectionNichos /></div>
        <div style={{ contentVisibility: 'auto', containIntrinsicSize: '0 400px', isolation: 'isolate' }}><SectionComoLlegar /></div>
        <div style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px', isolation: 'isolate' }}><SectionFAQ /></div>
        <div style={{ contentVisibility: 'auto', containIntrinsicSize: '0 600px', isolation: 'isolate' }}><SectionContacto /></div>
      </main>
      {belowFoldReady && <Footer />}
      <WhatsAppButton />
      {belowFoldReady && <CookieBanner />}
    </div>
  );
};

export default Main;