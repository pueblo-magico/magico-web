import React, { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { HorizontalCardRail } from '../components/HorizontalCardRail';
import { CampfireIcon, SunIcon, MoonIcon, UsersThreeIcon, LeafIcon, ForkKnifeIcon, StarIcon } from '@phosphor-icons/react';

import FamilionHero from './components/FamilionHero';
import FamilionMagico from './components/FamilionMagico';
import FamilionPrecios from './components/FamilionPrecios';
import FamilionFAQ from './components/FamilionFAQ';
import FamilionRecetario from './components/FamilionRecetario';
import { WA_MAGICO, SITE_URL } from './data/config';
import { ROUTES } from './routes';

const FamilionContent: React.FC = () => {
  const { t, language } = useLanguage();

  // SEO — title, meta, OG, canonical y JSON-LD
  useEffect(() => {
    const TITLE = t.familion.seo.title;
    const DESC = t.familion.seo.description;
    const URL = SITE_URL + ROUTES.FAMILION;
    const IMG = `${SITE_URL}/uploads/Familion/IMG_6045.webp`;
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
      "@type": "Event",
      "name": TITLE,
      "description": DESC,
      "startDate": "2026-08-14",
      "endDate": "2026-08-15",
      "location": { "@type": "Place", "name": "Pueblo Mágico", "address": { "@type": "PostalAddress", "addressLocality": "Los Gigantes", "addressRegion": "Córdoba", "addressCountry": "AR" } },
      "organizer": { "@type": "Organization", "name": "Pueblo Mágico", "url": "https://experienciamagico.com" },
      "offers": { "@type": "Offer", "price": "280000", "priceCurrency": "ARS", "availability": "https://schema.org/LimitedAvailability", "url": URL },
      "image": IMG,
      "eventStatus": "https://schema.org/EventScheduled",
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode"
    };
    const ldScript = document.createElement('script');
    ldScript.type = 'application/ld+json';
    ldScript.id   = 'ld-familion';
    ldScript.textContent = JSON.stringify(schema);
    if (!document.getElementById('ld-familion')) document.head.appendChild(ldScript);

    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Inicio", "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": "Familion", "item": URL }
      ]
    };
    const bcScript = document.createElement('script');
    bcScript.type = 'application/ld+json';
    bcScript.id   = 'ld-bc-familion';
    bcScript.textContent = JSON.stringify(breadcrumb);
    if (!document.getElementById('ld-bc-familion')) document.head.appendChild(bcScript);

    return () => {
      document.title = prevTitle;
      document.getElementById('ld-familion')?.remove();
      document.getElementById('ld-bc-familion')?.remove();
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

  const PILAR_ICONS = [UsersThreeIcon, LeafIcon, ForkKnifeIcon, StarIcon];
  const CRONO_ICONS = [CampfireIcon, SunIcon, MoonIcon, StarIcon];

  return (
    <div className="bg-white text-gray-800 overflow-x-hidden">
      <Header />

      <FamilionHero />

      {/* ====== VIDEO INVITACIÓN ====== */}
      <section className="py-16 md:py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div data-reveal className="flex flex-col justify-center">
              <h2 className="text-2xl md:text-4xl serif-title brand-green mb-8 md:mb-10" dangerouslySetInnerHTML={{ __html: t.familion.invitation.title }} />
              <p className="text-gray-700 text-base md:text-lg leading-relaxed">
                {t.familion.invitation.text1}
              </p>
              <p className="text-brand-green text-xl md:text-2xl serif-title font-bold mt-6">
                {t.familion.invitation.text2}
              </p>
            </div>

            <div data-reveal data-delay="1" className="flex justify-center">
              <div className="video-aspect w-full max-w-[12rem] sm:max-w-[13rem] md:max-w-[15rem] bg-white rounded-3xl border-2 border-brand-gold/50 overflow-hidden shadow-2xl">
                <iframe
                  width="360"
                  height="640"
                  src="https://www.youtube-nocookie.com/embed/Sqc7zbR-sPQ"
                  title={t.familion.invitation.video_title}
                  loading="lazy"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;"
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                  className="w-full h-full rounded-3xl"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== ECO-CENTRO ====== */}
      <section id="comodidad" className="py-16 md:py-24 px-6 bg-[#005333]/[0.04]">
        <div className="max-w-4xl mx-auto">
          <h2 data-reveal className="text-3xl md:text-5xl serif-title brand-green mb-5" style={{ lineHeight: '1.1' }}>
            {t.familion.eco_center.title}
          </h2>
          <p data-reveal data-delay="1" className="text-gray-500 text-base md:text-lg leading-relaxed max-w-2xl mb-10 font-light">
            {t.familion.eco_center.subtitle}
          </p>

          <div className="divide-y divide-[#E8E4D9]">
            {t.familion.eco_center.items.map((item: any) => (
              <div key={item.num} className="py-8 flex flex-col md:flex-row gap-4 md:gap-12 items-start">
                <div className="md:w-52 flex-shrink-0">
                  <span className="serif-title text-4xl font-light block leading-none" style={{ color: 'rgba(0,83,51,0.15)' }}>{item.num}</span>
                  <h4 className="font-bold brand-green text-sm uppercase tracking-widest mt-2">{item.title}</h4>
                </div>
                {item.href ? (
                  <a href={item.href} className="text-gray-600 text-base leading-relaxed underline decoration-gold/50 underline-offset-4 transition-colors hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                    {item.text}
                  </a>
                ) : (
                  <p className="text-gray-600 text-base leading-relaxed">{item.text}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== LOS 4 PILARES ====== */}
      <section className="py-16 md:py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 data-reveal className="text-3xl md:text-5xl serif-title brand-green mb-5" style={{ lineHeight: '1.1' }}>
            {t.familion.pilares.title}
          </h2>
          <p data-reveal data-delay="1" className="text-gray-500 text-base md:text-lg leading-relaxed max-w-2xl mb-10 font-light">
            {t.familion.pilares.subtitle}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16">
            {t.familion.pilares.items.map((item: any, i: number) => {
              const Icon = PILAR_ICONS[i];
              return (
                <div key={item.num} data-reveal data-delay={String(i + 1)} className={`py-7 flex items-start gap-6 ${i < 2 ? 'border-b border-[#E8E4D9]' : ''} ${i > 1 ? 'border-b border-[#E8E4D9] md:border-b-0' : ''}`}>
                  <span className="serif-title text-2xl font-light flex-shrink-0 w-9 leading-none mt-0.5" style={{ color: 'rgba(0,83,51,0.15)' }}>{item.num}</span>
                  <div>
                    <h4 className="font-bold brand-green text-sm uppercase tracking-widest mb-1 flex items-center gap-2">
                      <Icon weight="light" className="w-4 h-4 flex-shrink-0 opacity-60" aria-hidden="true" />
                      {item.title}
                    </h4>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====== CRONOGRAMA ====== */}
      <section className="py-16 md:py-24 px-6 bg-[#FAF9F5]">
        <div className="max-w-5xl mx-auto">
          <div data-reveal className="mb-10 md:mb-14">
            <p className="font-medium uppercase tracking-[0.2em] text-[11px] brand-green mb-3">{t.familion.cronograma.tag}</p>
            <h2 className="text-4xl md:text-5xl serif-title brand-green" style={{ lineHeight: '1.1' }}>
              {t.familion.cronograma.title}
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {t.familion.cronograma.dates.map((date: string, i: number) => (
                <span key={i} className={`px-3 py-1 ${i === 0 ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 'bg-brand-gold/10 text-brand-gold border-brand-gold/20'} text-xs font-bold rounded-full border whitespace-nowrap`}>
                  {date}
                </span>
              ))}
            </div>
          </div>

          <div className="max-w-4xl">
            {t.familion.cronograma.days.map((day: any, i: number) => {
              const Icon = CRONO_ICONS[i];
              return (
                <React.Fragment key={day.num}>
                  <div data-reveal data-delay={String(i + 1)} className="pb-10 md:pb-14">
                    <div className="flex items-end gap-5 md:gap-8 pb-5 mb-6 border-b border-[#E8E4D9]">
                      <span className="serif-title text-[88px] md:text-[120px] font-light leading-none select-none" style={{ color: '#005333', opacity: 0.08 }}>{day.num}</span>
                      <div className="pb-2 flex items-end gap-4">
                        <div>
                          <p className="font-medium uppercase tracking-[0.22em] text-[11px] brand-green mb-1">{day.tag}</p>
                          <h3 className="text-2xl md:text-3xl serif-title brand-green">{day.title}</h3>
                        </div>
                        <Icon weight="light" className="w-7 h-7 text-brand-gold mb-1 flex-shrink-0" />
                      </div>
                    </div>
                    <div className="divide-y divide-[#EDEBE3] md:pl-12">
                      {day.items.map((item: string, idx: number) => (
                        <p key={idx} className="py-3 text-gray-600 font-light text-base leading-relaxed">{item}</p>
                      ))}
                    </div>
                  </div>
                  {i < 2 && <div className="w-12 h-px bg-[#D4AF37] mb-10 md:mb-14" />}
                </React.Fragment>
              );
            })}
          </div>

          <p className="mt-12 text-gray-400 text-sm font-light italic max-w-xl">
            {t.familion.cronograma.footer}
          </p>
        </div>
      </section>

      {/* ====== TESTIMONIOS ====== */}
      <section className="py-16 md:py-24 px-6 bg-[#FAF9F5]">
        <div className="max-w-5xl mx-auto">
          <h2 data-reveal className="text-3xl md:text-5xl serif-title brand-green text-center mb-8 md:mb-10">
            {t.familion.testimonials.title}
          </h2>

          <HorizontalCardRail previousLabel={t.ui.prev} nextLabel={t.ui.next} desktopGridClassName="md:grid-cols-2" gapClassName="gap-8 md:gap-10">
            {t.familion.testimonials.items.map((testi: any, i: number) => (
              <div key={i} data-reveal data-delay={String(i)} className="h-full p-8 md:p-10 bg-white rounded-2xl card-hover border border-brand-green/10">
                <div className="testimonial-quote mb-6">
                  <p className="text-gray-700 italic text-sm md:text-base leading-relaxed">
                    {testi.text}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <img src={i === 0 ? "/uploads/tefi y familia.webp" : "/uploads/portada familion.webp"} alt={testi.name} loading="lazy" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                  <div>
                    <p className="font-bold text-brand-green text-sm">{testi.name}</p>
                    <p className="text-xs text-gray-400">{testi.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </HorizontalCardRail>

          <div className="mt-16 md:mt-24">
            <h3 className="text-2xl md:text-3xl serif-title brand-green text-center mb-8 md:mb-10">{t.familion.testimonials.subtitle}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-center">
              <div className="flex justify-center">
                <div className="video-aspect w-full max-w-[12rem] sm:max-w-[13rem] md:max-w-[15rem] bg-white rounded-3xl border-2 border-brand-gold/50 overflow-hidden shadow-2xl">
                  <iframe
                    width="360"
                    height="640"
                    src="https://www.youtube-nocookie.com/embed/IfMqF4oW_fM"
                    title="Testimonios Familion - Parte 1"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;"
                    allowFullScreen
                    className="w-full h-full rounded-3xl"
                  ></iframe>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="video-aspect w-full max-w-[12rem] sm:max-w-[13rem] md:max-w-[15rem] bg-white rounded-3xl border-2 border-brand-gold/50 overflow-hidden shadow-2xl">
                  <iframe
                    width="360"
                    height="640"
                    src="https://www.youtube-nocookie.com/embed/wVNmRkIj0-o"
                    title="Testimonios Familion - Parte 2"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;"
                    allowFullScreen
                    className="w-full h-full rounded-3xl"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FamilionMagico />
      <FamilionPrecios />
      <FamilionFAQ />
      <FamilionRecetario />

      {/* ====== CTA FINAL ====== */}
      <section className="py-16 md:py-24 px-6 bg-[#005333]/[0.04]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 data-reveal className="text-3xl md:text-5xl serif-title brand-green mb-6" style={{ lineHeight: '1.12' }}>
            {t.familion.cta_final.title}
          </h2>
          <p data-reveal data-delay="1" className="text-gray-500 text-base md:text-lg leading-relaxed mb-8 max-w-xl mx-auto font-light">
            {t.familion.cta_final.subtitle}
          </p>
          <a data-reveal data-delay="2" href={"https://wa.me/" + WA_MAGICO + "?text=Hola!%20Vengo%20de%20Familion%20y%20quiero%20consultar%20la%20experiencia."} className="btn-gold inline-block">
            {t.familion.cta_final.btn}
          </a>
        </div>
      </section>

      {/* ====== VIDEO DESPEDIDA ====== */}
      <section className="py-16 md:py-24 px-6 bg-[#FAF9F5]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl serif-title brand-green mb-8 md:mb-10">{t.familion.video_closing.title}</h2>
          <p className="text-gray-600 text-sm md:text-base mb-8 leading-relaxed">{t.familion.video_closing.text}</p>
          <div className="flex justify-center">
            <div className="video-aspect w-full max-w-[12rem] sm:max-w-[13rem] md:max-w-[15rem] bg-white rounded-3xl border-2 border-brand-gold/50 overflow-hidden shadow-2xl">
              <iframe
                width="360"
                height="640"
                src="https://www.youtube-nocookie.com/embed/QqGrzFloHsE"
                title="Familion - Agradecimiento por la comida"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;"
                allowFullScreen
                className="w-full h-full rounded-3xl"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      
      <div className="bg-brand-green/5 text-brand-green/60 text-center text-xs py-3 border-t border-brand-green/10">
        Growth systems & digital experience by Catálisis
      </div>
    </div>
  );
};

const Familion: React.FC = () => {
  return <FamilionContent />;
};

export default Familion;
