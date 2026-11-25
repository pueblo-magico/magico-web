import React, { useEffect, useState } from 'react';
import { CookieBanner } from '../components/CookieBanner';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { PageSectionNav, type PageNavigation } from '../components/PageSectionNav';
import { useLanguage } from '../contexts/LanguageContext';
import { SITE_URL, WA_UMBRAL } from './data/config';
import { ROUTES } from './routes';

const HERO = '/uploads/reforestacion/montana-hero.webp';
const HALL = '/uploads/yoga_salon.webp';
const AERIAL = '/uploads/campoentero.webp';
const OG_IMAGE = `${SITE_URL}/uploads/reforestacion/montana-hero.webp`;

const upsertMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
  let element = document.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};

const waLink = (message: string) => `https://wa.me/${WA_UMBRAL}?text=${encodeURIComponent(message)}`;

const Reveal: React.FC<{ children: React.ReactNode; delay?: string }> = ({ children, delay }) => (
  <div data-reveal {...(delay ? { 'data-delay': delay } : {})}>
    {children}
  </div>
);

const Umbral: React.FC = () => {
  const { language, t } = useLanguage();
  const copy = t.umbral;
  const pageUrl = `${SITE_URL}${ROUTES.UMBRAL}`;
  const reserveHref = waLink(copy.whatsapp);
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = copy.seo.title;
    upsertMeta('meta[name="description"]', 'name', 'description', copy.seo.description);
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', copy.seo.title);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', copy.seo.description);
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', OG_IMAGE);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', pageUrl);
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
    upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', copy.seo.title);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', copy.seo.description);
    upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', OG_IMAGE);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = pageUrl;

    let createdScript: HTMLScriptElement | null = null;
    if (!document.getElementById('umbral-event-schema')) {
      createdScript = document.createElement('script');
      createdScript.id = 'umbral-event-schema';
      createdScript.type = 'application/ld+json';
      createdScript.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: 'UMBRAL — El Viaje de la Escucha',
        description: copy.seo.description,
        startDate: '2027-01-08T15:00:00-03:00',
        endDate: '2027-01-11T14:00:00-03:00',
        eventStatus: 'https://schema.org/EventScheduled',
        inLanguage: language,
        image: OG_IMAGE,
        url: pageUrl,
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
          '@type': 'Place',
          name: 'Pueblo Mágico',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Los Gigantes',
            addressRegion: 'Córdoba',
            addressCountry: 'AR',
          },
        },
        organizer: {
          '@type': 'Organization',
          name: 'SonCura – Caminos del Sonido',
        },
        performer: {
          '@type': 'Person',
          name: 'Ezequiel López Benavidez',
        },
      });
      document.head.appendChild(createdScript);
    }

    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -32px 0px' },
    );
    document.querySelectorAll('[data-reveal]').forEach(element => observer.observe(element));

    const onScroll = () => setShowSticky(window.scrollY > window.innerHeight * 0.85);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      document.title = previousTitle;
      createdScript?.remove();
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [copy.seo.description, copy.seo.title, language, pageUrl]);

  const navigation = copy.nav as PageNavigation;

  return (
    <div className={`min-h-screen overflow-x-hidden bg-[#F3EEE4] text-[#1C2822] ${showSticky ? 'pb-20 md:pb-0' : ''}`}>
      <a
        href="#contenido-umbral"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[1200] focus:bg-white focus:px-4 focus:py-3 focus:text-[#1C2822]"
      >
        {copy.skip}
      </a>
      <Header subNavigation={<PageSectionNav navigation={navigation} />} />
      <main id="contenido-umbral">
        <section className="relative flex min-h-[100svh] items-end overflow-hidden bg-[#14211B]">
          <img
            src={HERO}
            alt={copy.hero.imageAlt}
            width={2048}
            height={988}
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101A15] via-[#101A15]/45 to-[#101A15]/55" />
          <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-16 pt-32 md:px-10 md:pb-24">
            <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[#F6F1E6]/75">
              {copy.hero.category}
            </p>
            <h1 className="serif-title mt-5 text-[clamp(4.6rem,15vw,9.2rem)] leading-[0.82] tracking-[0.06em] text-[#F6F1E6]">
              {copy.hero.title}
            </h1>
            <p className="serif-title mt-4 max-w-xl text-[clamp(1.7rem,3.4vw,2.8rem)] italic leading-tight text-[#E7D7A8]">
              {copy.hero.subtitle}
            </p>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#F6F1E6]/85 md:text-lg">
              {copy.hero.lead}
            </p>
            <dl className="mt-8 flex max-w-2xl flex-col gap-3 text-sm text-[#F6F1E6]/80 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-2">
              {copy.hero.meta.map((item: { label: string; value: string }) => (
                <div key={item.label}>
                  <dt className="text-[10px] uppercase tracking-[0.22em] text-[#E7D7A8]/80">{item.label}</dt>
                  <dd className="mt-1">{item.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <a
                href={reserveHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex bg-[#D4AF37] px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1C2822] transition-colors hover:bg-[#E7D7A8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F6F1E6]"
              >
                {copy.hero.cta}
              </a>
              <a
                href="#escucha"
                className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F6F1E6] underline decoration-[#E7D7A8]/70 underline-offset-8 hover:decoration-[#F6F1E6]"
              >
                {copy.hero.ctaSecondary}
              </a>
            </div>
          </div>
        </section>

        <section id="escucha" className="mx-auto grid max-w-6xl scroll-mt-36 items-center gap-12 px-6 py-24 md:grid-cols-2 md:gap-20 md:px-10 md:py-32">
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#6A5344]">{copy.intro.kicker}</p>
            <h2 className="serif-title mt-4 text-4xl leading-tight text-[#1C3328] md:text-5xl">{copy.intro.title}</h2>
            {copy.intro.paragraphs.map((paragraph: string) => (
              <p key={paragraph} className="mt-6 text-base leading-8 text-[#3C463F] md:text-lg">
                {paragraph}
              </p>
            ))}
          </Reveal>
          <Reveal delay="2">
            <figure>
              <img
                src={HALL}
                alt={copy.intro.imageAlt}
                width={1920}
                height={1280}
                loading="lazy"
                decoding="async"
                className="h-auto w-full object-cover"
              />
              <figcaption className="mt-4 text-sm leading-6 text-[#6A5344]">{copy.intro.caption}</figcaption>
            </figure>
          </Reveal>
        </section>

        <section id="datos" className="scroll-mt-36 border-y border-[#1C2822]/10 bg-[#E9E1D2]">
          <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
            <Reveal>
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#6A5344]">{copy.facts.kicker}</p>
              <h2 className="serif-title mt-4 max-w-xl text-4xl text-[#1C3328] md:text-5xl">{copy.facts.title}</h2>
            </Reveal>
            <dl className="mt-12 grid md:grid-cols-2">
              {copy.facts.items.map((item: { label: string; value: string }, index: number) => (
                <div key={item.label} className="border-t border-[#1C2822]/15 py-6 md:px-8 md:odd:pl-0 md:even:pr-0">
                  <Reveal delay={index % 2 === 0 ? undefined : '1'}>
                    <dt className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#6A5344]">{item.label}</dt>
                    <dd className="serif-title mt-2 text-2xl leading-snug text-[#1C3328] md:text-[1.7rem]">{item.value}</dd>
                  </Reveal>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="viaje" className="mx-auto max-w-6xl scroll-mt-36 px-6 py-24 md:px-10 md:py-32">
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#6A5344]">{copy.journey.kicker}</p>
            <h2 className="serif-title mt-4 max-w-2xl text-4xl leading-tight text-[#1C3328] md:text-5xl">{copy.journey.title}</h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#3C463F]">{copy.journey.lead}</p>
          </Reveal>
          <ol className="mt-16">
            {copy.journey.steps.map((step: { index: string; title: string; text: string }, index: number) => (
              <li key={step.title} className="border-t border-[#1C2822]/15 py-10">
                <Reveal delay={String(Math.min(index + 1, 4))}>
                  <div className="grid gap-3 md:grid-cols-[7rem_1fr] md:gap-10">
                    <p className="serif-title text-3xl text-[#8A9A84]">{step.index}</p>
                    <div>
                      <h3 className="serif-title text-3xl text-[#1C3328]">{step.title}</h3>
                      <p className="mt-4 max-w-2xl text-base leading-8 text-[#3C463F]">{step.text}</p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        <section id="lugar" className="scroll-mt-36 bg-[#14211B] text-[#F6F1E6]">
          <figure className="relative">
            <img
              src={AERIAL}
              alt={copy.place.aerialAlt}
              width={1920}
              height={1080}
              loading="lazy"
              decoding="async"
              className="h-[70vh] min-h-[460px] w-full object-cover"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#101A15] to-transparent px-6 pb-8 pt-24 md:px-10">
              <p className="mx-auto max-w-6xl text-sm tracking-wide text-[#F6F1E6]/80">{copy.place.aerialCaption}</p>
            </figcaption>
          </figure>
          <div className="mx-auto max-w-3xl px-6 py-20 md:px-10 md:py-28">
            <Reveal>
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#E7D7A8]">{copy.place.kicker}</p>
              <h2 className="serif-title mt-4 text-4xl leading-tight md:text-5xl">{copy.place.title}</h2>
              {copy.place.paragraphs.map((paragraph: string) => (
                <p key={paragraph} className="mt-6 text-base leading-8 text-[#F6F1E6]/80 md:text-lg">
                  {paragraph}
                </p>
              ))}
            </Reveal>
          </div>
        </section>

        <section id="facilita" className="mx-auto grid max-w-6xl scroll-mt-36 gap-10 px-6 py-24 md:grid-cols-[0.8fr_1.2fr] md:px-10 md:py-32">
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#6A5344]">{copy.facilitator.kicker}</p>
            <h2 className="serif-title mt-4 text-4xl leading-[1.05] text-[#1C3328] md:text-6xl">{copy.facilitator.name}</h2>
            <p className="mt-6 text-sm uppercase tracking-[0.18em] text-[#1C3328]">{copy.facilitator.role}</p>
            <p className="mt-2 text-sm text-[#6A5344]">{copy.facilitator.org}</p>
          </Reveal>
          <Reveal delay="2">
            {copy.facilitator.paragraphs.map((paragraph: string) => (
              <p key={paragraph} className="mt-6 text-lg leading-8 text-[#3C463F] first:mt-0">
                {paragraph}
              </p>
            ))}
          </Reveal>
        </section>

        <section id="estadia" className="scroll-mt-36 border-t border-[#1C2822]/10">
          <div className="mx-auto grid max-w-6xl gap-16 px-6 py-24 md:grid-cols-2 md:px-10 md:py-32">
            <div>
              <Reveal>
                <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#6A5344]">{copy.includes.kicker}</p>
                <h2 className="serif-title mt-4 text-4xl leading-tight text-[#1C3328] md:text-5xl">{copy.includes.title}</h2>
                <p className="mt-6 leading-8 text-[#3C463F]">{copy.includes.lead}</p>
              </Reveal>
              <ul className="mt-8">
                {copy.includes.items.map((item: string) => (
                  <li key={item} className="border-t border-[#1C2822]/15 py-4 text-base leading-7 text-[#1C2822]">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Reveal delay="2">
                <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#6A5344]">{copy.audience.kicker}</p>
                <h2 className="serif-title mt-4 text-4xl leading-tight text-[#1C3328] md:text-5xl">{copy.audience.title}</h2>
              </Reveal>
              <ul className="mt-8">
                {copy.audience.items.map((item: string) => (
                  <li key={item} className="border-t border-[#1C2822]/15 py-4 text-base leading-7 text-[#1C2822]">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="preguntas" className="scroll-mt-36 bg-[#E9E1D2]">
          <div className="mx-auto max-w-3xl px-6 py-24 md:px-10 md:py-32">
            <Reveal>
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#6A5344]">{copy.faq.kicker}</p>
              <h2 className="serif-title mt-4 text-4xl text-[#1C3328] md:text-5xl">{copy.faq.title}</h2>
            </Reveal>
            <div className="mt-10 border-b border-[#1C2822]/15">
              {copy.faq.items.map((item: { q: string; a: string }) => (
                <details key={item.q} className="group border-t border-[#1C2822]/15">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 text-left text-lg text-[#1C3328] [&::-webkit-details-marker]:hidden">
                    <span className="serif-title">{item.q}</span>
                    <span aria-hidden="true" className="mt-1 text-2xl leading-none text-[#6A5344] transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="max-w-2xl pb-6 leading-8 text-[#3C463F]">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="inscripcion" className="relative scroll-mt-36 overflow-hidden bg-[#14211B] text-[#F6F1E6]">
          <img
            src={HERO}
            alt=""
            width={2048}
            height={988}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-[#101A15]/70" />
          <div className="relative mx-auto max-w-3xl px-6 py-28 text-center md:py-36">
            <Reveal>
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#E7D7A8]">{copy.closing.kicker}</p>
              <h2 className="serif-title mt-5 text-4xl leading-tight md:text-6xl">{copy.closing.title}</h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-[#F6F1E6]/85">{copy.closing.text}</p>
              <a
                href={reserveHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-10 inline-flex bg-[#D4AF37] px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1C2822] transition-colors hover:bg-[#E7D7A8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F6F1E6]"
              >
                {copy.closing.cta}
              </a>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
      <CookieBanner />
      {showSticky && (
        <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-white/10 bg-[#14211B]/95 px-4 py-3 backdrop-blur-sm md:hidden">
          <a
            href={reserveHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center bg-[#D4AF37] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1C2822]"
          >
            {copy.stickyCta}
          </a>
        </div>
      )}
    </div>
  );
};

export default Umbral;
