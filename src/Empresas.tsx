import React, { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { SectionHojaDeRuta } from '../components/SectionHojaDeRuta';
import { SITE_URL } from './data/config';
import { ROUTES } from './routes';

import EmpresasHero from './components/EmpresasHero';
import EmpresasProblema from './components/EmpresasProblema';
import EmpresasGaleria from './components/EmpresasGaleria';
import EmpresasJornada from './components/EmpresasJornada';
import EmpresasImpacto from './components/EmpresasImpacto';
import EmpresasBienestar from './components/EmpresasBienestar';
import EmpresasEquipo from './components/EmpresasEquipo';
import EmpresasPreview from './components/EmpresasPreview';
import EmpresasProceso from './components/EmpresasProceso';
import EmpresasEntregables from './components/EmpresasEntregables';
import EmpresasRespaldo from './components/EmpresasRespaldo';
import EmpresasFAQ from './components/EmpresasFAQ';
import EmpresasCTAFinal from './components/EmpresasCTAFinal';

const EmpresasContent: React.FC = () => {
  const { t, language } = useLanguage();

  useEffect(() => {
    const TITLE = t.empresas.seo.title;
    const DESC  = t.empresas.seo.description;
    const URL   = SITE_URL + ROUTES.EMPRESAS;
    const IMG   = `${SITE_URL}/uploads/dji_0074.webp`;
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
    setMeta('meta[property="og:locale"]',       'content',  language === 'es' ? 'es_AR' : 'en_US');

    const schema = {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": TITLE,
      "provider": { "@type": "Organization", "name": "Pueblo Mágico", "url": "https://www.experienciamagico.com" },
      "description": DESC,
      "serviceType": language === 'es' ? "Voluntariado corporativo y RSE" : "Corporate volunteering and CSR",
      "areaServed": { "@type": "Country", "name": "Argentina" },
      "url": URL,
      "location": { "@type": "Place", "name": "Pueblo Mágico", "address": { "@type": "PostalAddress", "addressLocality": "Los Gigantes", "addressRegion": "Córdoba", "addressCountry": "AR" } }
    };
    const ldScript = document.createElement('script');
    ldScript.type = 'application/ld+json';
    ldScript.id   = 'ld-empresas';
    ldScript.textContent = JSON.stringify(schema);

    document.getElementById('ld-empresas')?.remove();
    document.head.appendChild(ldScript);

    return () => {
      document.title = prevTitle;
      document.getElementById('ld-empresas')?.remove();
    };
  }, [t, language]);

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
    <div className="bg-white text-gray-800 overflow-x-hidden">
      <Header />

      <EmpresasHero />
      <EmpresasProblema />
      <EmpresasGaleria />
      <EmpresasJornada />
      <EmpresasImpacto />
      <EmpresasBienestar />
      <EmpresasEquipo />
      <EmpresasPreview />
      <EmpresasProceso />
      <EmpresasEntregables />
      <SectionHojaDeRuta visibleCount={3} />
      <EmpresasRespaldo />
      <EmpresasFAQ />
      <EmpresasCTAFinal />

      <Footer />

      <div className="bg-[#005333]/5 text-[#005333]/60 text-center text-xs py-3 border-t border-[#005333]/10">
        Growth systems & digital experience by Catálisis
      </div>

      <WhatsAppButton />
    </div>
  );
};

const Empresas: React.FC = () => {
  return <EmpresasContent />;
};

export default Empresas;
