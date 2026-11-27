import React, { useEffect, useState } from 'react';
import { CookieBanner } from '../components/CookieBanner';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { PageSectionNav, type PageNavigation } from '../components/PageSectionNav';
import { useLanguage } from '../contexts/LanguageContext';
import { SITE_URL, WA_UMBRAL } from './data/config';
import { ROUTES } from './routes';

const HALL = { src: '/uploads/yoga_salon.webp', w: 1920, h: 1280 };
const MOUNTAIN = { src: '/uploads/reforestacion/montana-hero.webp', w: 2048, h: 988 };
const AERIAL = { src: '/uploads/campoentero.webp', w: 1920, h: 1080 };
const RIVER = { src: '/uploads/sunset-rio-rio-real.webp', w: 1024, h: 1536 };
const FIRE = { src: '/uploads/fogon_nocturno.webp', w: 1920, h: 1288 };
const DOMES = { src: '/uploads/domos.webp', w: 1200, h: 800 };
const DOME_VIEW = { src: '/uploads/domos_2.jpg', w: 1200, h: 800 };
const FOOD = { src: '/uploads/propuestas/jesus-cordoba-gastronomia-v2.webp', w: 1200, h: 800 };
const REFUGE = { src: '/uploads/refu.webp', w: 549, h: 366 };

const SOUND_HERO = { src: '/exe.jpeg', w: 1248, h: 1248 };
const FACILITATOR_PHOTO = { src: '/exefoto10.jpeg', w: 900, h: 1200 };
const SOUND_CIRCLE = { src: '/exe3.jpeg', w: 853, h: 1280 };
const SOUND_BATH = { src: '/exe4.jpeg', w: 857, h: 1280 };
const SOUND_GROUP = { src: '/exe5.jpeg', w: 1280, h: 853 };
const DIDGERIDOO = { src: '/exe6.jpeg', w: 853, h: 1280 };
const EXPLORE_PHOTOS = [SOUND_BATH, SOUND_CIRCLE, DIDGERIDOO, SOUND_GROUP];
const EXTRA_SOUND_PHOTOS = [1, 2, 3, 4, 5, 6].map(n => ({ src: `/exefoto${n}.jpeg`, w: 1200, h: 900 }));
const FEEL_PHOTOS = EXTRA_SOUND_PHOTOS;
const PLACE_PHOTOS = [AERIAL, MOUNTAIN, RIVER, HALL, REFUGE, DOME_VIEW];
const STAY_PHOTOS = [DOMES, FOOD, HALL, { src: '/uploads/bienestar-balance.webp', w: 1920, h: 1280 }];
const OG_IMAGE = `${SITE_URL}${SOUND_HERO.src}`;

const btn = 'inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-7 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1C2822] transition-colors hover:bg-[#E7D7A8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F6F1E6]';
const btnGhost = 'inline-flex items-center justify-center rounded-full border border-current px-7 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em]';

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
  <div data-reveal {...(delay ? { 'data-delay': delay } : {})}>{children}</div>
);

const Frame: React.FC<{
  photo: { src: string; w: number; h: number };
  alt: string;
  className?: string;
  priority?: boolean;
}> = ({ photo, alt, className = '', priority = false }) => (
  <img
    src={photo.src}
    alt={alt}
    width={photo.w}
    height={photo.h}
    {...(priority ? { fetchPriority: 'high' as const } : { loading: 'lazy' as const })}
    decoding="async"
    className={`rounded-[2rem] object-cover ${className}`}
  />
);

const Umbral: React.FC = () => {
  const { language, t } = useLanguage();
  const copy = t.umbral;
  const pageUrl = `${SITE_URL}${ROUTES.UMBRAL}`;
  const reserveHref = waLink(copy.whatsapp);
  const consultHref = waLink(language === 'es' ? '¡Hola! Me interesa Huella Sonora y quisiera hacer una consulta antes de reservar. ¿Podemos conversar?' : 'Hi! I am interested in Huella Sonora and have a question before booking. Could we chat?');
  const consultLabel = language === 'es' ? 'Quiero hacer una consulta' : 'I have a question';
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
        name: 'HUELLA SONORA — El Viaje de la Escucha',
        description: copy.seo.description,
        startDate: '2027-01-08T15:00:00-03:00',
        endDate: '2027-01-11T14:00:00-03:00',
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        inLanguage: language,
        image: OG_IMAGE,
        url: pageUrl,
        location: {
          '@type': 'Place',
          name: 'Pueblo Mágico',
          address: { '@type': 'PostalAddress', addressLocality: 'Los Gigantes', addressRegion: 'Córdoba', addressCountry: 'AR' },
        },
        organizer: { '@type': 'Organization', name: 'SonCura – Caminos del Sonido' },
        performer: { '@type': 'Person', name: 'Exequiel Lopez Benavidez' },
        offers: {
          '@type': 'Offer',
          price: '710000',
          priceCurrency: 'ARS',
          availability: 'https://schema.org/LimitedAvailability',
          url: pageUrl,
          validThrough: '2026-12-10',
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

  return (
    <div className={`min-h-screen overflow-x-hidden bg-[#F3EEE4] text-[#1C2822] ${showSticky ? 'pb-20 md:pb-0' : ''}`}>
      <a href="#contenido-umbral" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[1200] focus:bg-white focus:px-4 focus:py-3">
        {copy.skip}
      </a>
      <Header subNavigation={<PageSectionNav navigation={copy.nav as PageNavigation} />} />
      <main id="contenido-umbral">
        <section className="relative flex min-h-[100svh] items-end overflow-hidden bg-[#14211B]">
          <img src={SOUND_HERO.src} alt={copy.hero.imageAlt} width={SOUND_HERO.w} height={SOUND_HERO.h} fetchPriority="high" decoding="async" className="absolute inset-0 h-full w-full object-cover object-[center_72%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101A15] via-[#101A15]/35 to-[#101A15]/20" />
          <div className="relative mx-auto w-full max-w-6xl px-6 pb-16 pt-32 md:px-10 md:pb-24">
            <div className="mb-5 flex flex-wrap items-center gap-4 sm:gap-6">
              <img src="/exelogo.jpeg" alt="SonCura – Caminos del Sonido" decoding="async" className="h-auto max-h-20 w-36 object-contain sm:w-44" style={{ filter: "grayscale(1) invert(1) contrast(5) brightness(1.1)", mixBlendMode: "screen" }} />
              <span aria-hidden="true" className="text-lg text-[#E7D7A8]/70">×</span>
              <span className="serif-title text-xl tracking-wide text-[#F6F1E6] sm:text-2xl">Pueblo Mágico</span>
            </div>
            <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.28em] text-[#F6F1E6]/75">{copy.hero.category}</p>
            <h1 className="serif-title mt-5 text-[clamp(3.2rem,9vw,7rem)] leading-[0.82] tracking-[0.06em] text-[#F6F1E6]">{copy.hero.title}</h1>
            <p className="serif-title mt-4 text-[clamp(1.7rem,3.2vw,2.7rem)] italic leading-tight text-[#E7D7A8]">{copy.hero.subtitle}</p>
            <p className="serif-title mt-6 max-w-xl text-2xl leading-snug text-[#F6F1E6] md:text-3xl">
              {copy.hero.phrase.map((line: string) => <span key={line} className="block">{line}</span>)}
            </p>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#F6F1E6]/85 md:text-lg">{copy.hero.text}</p>
            <dl className="mt-8 flex max-w-2xl flex-col gap-3 text-sm text-[#F6F1E6]/85 sm:flex-row sm:flex-wrap sm:gap-x-8">
              {copy.hero.meta.map((item: { label: string; value: string }) => (
                <div key={item.label}>
                  <dt className="text-[10px] uppercase tracking-[0.22em] text-[#E7D7A8]">{item.label}</dt>
                  <dd className="mt-1">{item.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-sm text-[#E7D7A8]">{copy.hero.early}</p>
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <a href={reserveHref} target="_blank" rel="noopener noreferrer" className={btn}>{copy.hero.cta}</a>
              <a href={consultHref} target="_blank" rel="noopener noreferrer" className={`${btnGhost} text-[#F6F1E6]`}>{consultLabel}</a>
              <a href="#experiencia" className="self-center text-sm text-[#F6F1E6]/85 underline underline-offset-4">{copy.hero.ctaSecondary}</a>
            </div>
          </div>
        </section>

        <section id="experiencia" className="scroll-mt-36">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 md:grid-cols-2 md:px-10 md:py-32">
            <Reveal>
              <h2 className="serif-title text-4xl leading-tight text-[#1C3328] md:text-5xl">{copy.sense.title}</h2>
              {copy.sense.paragraphs.map((paragraph: string) => (
                <p key={paragraph} className="mt-6 text-base leading-8 text-[#3C463F] md:text-lg">{paragraph}</p>
              ))}
            </Reveal>
            <Reveal delay="2">
              <figure>
                <Frame photo={MOUNTAIN} alt={copy.sense.imageAlt} className="h-[68vh] min-h-[420px] w-full" />
              </figure>
            </Reveal>
          </div>
          <div className="bg-[#14211B] px-6 py-16 text-[#F6F1E6] md:py-24">
            <p className="serif-title mx-auto max-w-4xl text-center text-3xl leading-snug md:text-5xl">{copy.sense.quote}</p>
          </div>
        </section>

        <section id="aprender" className="scroll-mt-36 px-4 py-20 md:px-8 md:py-28">
          <div className="mx-auto max-w-3xl px-2 text-center">
            <Reveal>
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#6A5344]">{copy.explore.kicker}</p>
              <h2 className="serif-title mt-4 text-4xl leading-tight text-[#1C3328] md:text-5xl">{copy.explore.title}</h2>
              <p className="mt-5 text-lg leading-8 text-[#3C463F]">{copy.explore.subtitle}</p>
            </Reveal>
          </div>
          <div className="mx-auto mt-16 max-w-6xl space-y-20">
            {copy.explore.items.map((item: { index: string; title: string; text: string; practices: string[]; imageAlt: string; caption: string }, index: number) => (
              <article key={item.title} className={`grid items-center gap-8 md:grid-cols-2 md:gap-14 ${index % 2 === 1 ? 'md:[&>figure]:order-2' : ''}`}>
                <figure>
                  <Frame photo={EXPLORE_PHOTOS[index]} alt={item.imageAlt} className="h-[52vh] min-h-[320px] w-full" />
                </figure>
                <div>
                  <p className="serif-title text-3xl text-[#8A9A84]">{item.index}</p>
                  <h3 className="serif-title mt-2 text-3xl text-[#1C3328] md:text-4xl">{item.title}</h3>
                  <p className="mt-4 leading-8 text-[#3C463F]">{item.text}</p>
                  <ul className="mt-6 space-y-2 border-t border-[#1C2822]/15 pt-4">
                    {item.practices.map((practice: string) => (
                      <li key={practice} className="leading-7 text-[#1C2822]">{practice}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[#14211B] px-6 py-24 text-[#F6F1E6] md:py-32">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <h2 className="serif-title text-4xl leading-tight md:text-5xl">{copy.takeaways.title}</h2>
              <p className="mt-6 text-lg leading-8 text-[#F6F1E6]/85">{copy.takeaways.text}</p>
            </Reveal>
            <ul className="mt-10">
              {copy.takeaways.items.map((item: string) => (
                <li key={item} className="border-t border-white/15 py-4 text-lg leading-7">{item}</li>
              ))}
            </ul>
            <p className="mt-8 text-sm leading-7 text-[#E7D7A8]">{copy.takeaways.note}</p>
            <div className="mt-10 flex flex-wrap gap-3"><a href={reserveHref} target="_blank" rel="noopener noreferrer" className={btn}>{copy.takeaways.cta}</a><a href={consultHref} target="_blank" rel="noopener noreferrer" className={`${btnGhost} text-[#F6F1E6]`}>{consultLabel}</a></div>
          </div>
        </section>

        <section id="programa" className="scroll-mt-36 mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
          <Reveal>
            <h2 className="serif-title max-w-3xl text-4xl leading-tight text-[#1C3328] md:text-5xl">{copy.program.title}</h2>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#3C463F]">{copy.program.intro}</p>
          </Reveal>
          <div className="mt-14 space-y-4">
            {copy.program.days.map((day: { label: string; date: string; title: string; text: string; slots: { when: string; what: string }[] }, index: number) => (
              <details key={day.date} open={index === 0} className="group overflow-hidden rounded-[2rem] bg-[#E9E1D2]">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 px-6 py-6 md:px-8 [&::-webkit-details-marker]:hidden">
                  <span>
                    <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#6A5344]">{day.label} · {day.date}</span>
                    <span className="serif-title mt-2 block text-3xl text-[#1C3328]">{day.title}</span>
                  </span>
                  <span aria-hidden="true" className="text-2xl text-[#6A5344] group-open:rotate-45">+</span>
                </summary>
                <div className="grid gap-8 px-6 pb-8 md:grid-cols-[0.8fr_1.2fr] md:px-8">
                  <p className="leading-8 text-[#3C463F]">{day.text}</p>
                  <ul>
                    {day.slots.map((slot: { when: string; what: string }) => (
                      <li key={`${slot.when}-${slot.what}`} className="grid gap-1 border-t border-[#1C2822]/15 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4">
                        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#6A5344]">{slot.when}</span>
                        <span className="leading-7">{slot.what}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            ))}
          </div>
          <p className="mt-8 text-sm leading-7 text-[#6A5344]">{copy.program.note}</p>
        </section>

        <section className="bg-[#101A15] px-4 py-16 text-[#F6F1E6] md:px-8 md:py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="serif-title max-w-3xl px-2 text-4xl leading-tight md:text-5xl">{copy.feel.title}</h2>
            <p className="mt-5 max-w-2xl px-2 leading-8 text-[#F6F1E6]/80">{copy.feel.text}</p>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 px-2 text-sm uppercase tracking-[0.14em] text-[#E7D7A8]">
              {copy.feel.moments.map((moment: string) => <li key={moment}>{moment}</li>)}
            </ul>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {FEEL_PHOTOS.map((photo, index) => (
                <figure key={photo.src}>
                  <Frame photo={photo} alt={copy.facilitator.project} className="h-72 w-full md:h-96" />
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section id="facilitador" className="scroll-mt-36 mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#6A5344]">{copy.facilitator.kicker}</p>
          <h2 className="serif-title mt-4 max-w-xl text-4xl text-[#1C3328] md:text-5xl">{copy.facilitator.title}</h2>
          <div className="mt-12 grid gap-10 border-t border-[#1C2822]/15 pt-10 md:grid-cols-[1.1fr_0.9fr]">
            <div>
              <Frame photo={FACILITATOR_PHOTO} alt={copy.facilitator.name} className="mb-8 h-[480px] w-full object-center md:h-[560px]" />
              <p className="serif-title text-5xl leading-[1.02] text-[#1C3328] md:text-6xl">{copy.facilitator.name}</p>
              <p className="mt-6 text-lg leading-8 text-[#3C463F]">{copy.facilitator.bio}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#6A5344]">{copy.facilitator.projectLabel}</p>
              <img src="/exelogo.jpeg" alt="SonCura – Caminos del Sonido" loading="lazy" decoding="async" className="mx-auto mt-4 h-auto w-[85%] max-w-[300px] object-contain mix-blend-multiply md:mx-0 md:max-h-32 md:w-36" />
              <p className="serif-title mt-3 text-3xl text-[#1C3328]">{copy.facilitator.project}</p>

              {copy.facilitator.paragraphs.map((paragraph: string) => (
                <p key={paragraph} className="mt-5 leading-8 text-[#3C463F]">{paragraph}</p>
              ))}
              <div className="mt-8 flex flex-wrap gap-3 border-t border-[#1C2822]/15 pt-6">
                {['Soncura_caminosdelsonido', 'Exequiel.lopezzz'].map(handle => (
                  <a key={handle} href={`https://www.instagram.com/${handle}/`} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#1C3328]/25 px-4 py-2.5 text-xs font-medium text-[#1C3328] transition-colors hover:bg-[#1C3328] hover:text-white">
                    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="shrink-0"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
                    <span className="break-all">@{handle}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="lugar" className="scroll-mt-36 bg-[#E9E1D2] px-4 py-20 md:px-8 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl px-2">
              <h2 className="serif-title text-4xl leading-tight text-[#1C3328] md:text-5xl">{copy.place.title}</h2>
              {copy.place.paragraphs.map((paragraph: string) => (
                <p key={paragraph} className="mt-6 text-lg leading-8 text-[#3C463F]">{paragraph}</p>
              ))}
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-2">
              {PLACE_PHOTOS.map((photo, index) => (
                <figure key={copy.place.captions[index]} className={index === 0 ? 'md:col-span-2' : ''}>
                  <Frame photo={photo} alt={copy.place.captions[index]} className={index === 0 ? 'h-[62vh] min-h-[380px] w-full' : 'h-80 w-full'} />
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section id="estadia" className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
          <h2 className="serif-title max-w-3xl text-4xl leading-tight text-[#1C3328] md:text-5xl">{copy.stay.title}</h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#3C463F]">{copy.stay.subtitle}</p>
          <div className="mt-16 space-y-20">
            {copy.stay.blocks.map((block: { kicker: string; title: string; text: string; items: string[]; imageAlt: string; caption: string }, index: number) => (
              <article key={block.title} className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
                <figure className={index % 2 === 1 ? 'md:order-2' : ''}>
                  <Frame photo={STAY_PHOTOS[index]} alt={block.imageAlt} className="h-80 w-full md:h-[420px]" />
                </figure>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#6A5344]">{block.kicker}</p>
                  <h3 className="serif-title mt-3 text-3xl text-[#1C3328]">{block.title}</h3>
                  <p className="mt-4 leading-8 text-[#3C463F]">{block.text}</p>
                  <ul className="mt-5">
                    {block.items.map((item: string) => (
                      <li key={item} className="border-t border-[#1C2822]/15 py-3 leading-7">{item}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-12 max-w-3xl border-t border-[#1C2822]/15 pt-6 text-sm leading-7 text-[#6A5344]">{copy.stay.loan}</p>
        </section>

        <section className="bg-[#E9E1D2] px-6 py-20 md:py-28">
          <div className="mx-auto max-w-3xl">
            <h2 className="serif-title text-4xl leading-tight text-[#1C3328] md:text-5xl">{copy.audience.title}</h2>
            <ul className="mt-8">
              {copy.audience.items.map((item: string) => (
                <li key={item} className="border-t border-[#1C2822]/15 py-4 text-lg leading-7">{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section id="inversion" className="scroll-mt-36 bg-[#14211B] px-6 py-24 text-[#F6F1E6] md:py-32">
          <div className="mx-auto grid max-w-6xl gap-14 md:grid-cols-[1.15fr_0.85fr]">
            <div>
              <h2 className="serif-title text-4xl md:text-6xl">{copy.investment.title}</h2>
              <p className="mt-4 max-w-xl text-lg leading-8 text-[#F6F1E6]/80">{copy.investment.subtitle}</p>
              <p className="mt-12 text-[11px] font-medium uppercase tracking-[0.24em] text-[#E7D7A8]">{copy.investment.earlyLabel}</p>
              <p className="serif-title mt-3 text-6xl text-[#F6F1E6] md:text-7xl">{copy.investment.earlyPrice}</p>
              <p className="mt-3 text-lg text-[#F6F1E6]/70">
                <span className="line-through">{copy.investment.regularPrice}</span>
                <span className="ml-3 text-[#E7D7A8]">{copy.investment.save}</span>
              </p>
              <p className="mt-4 max-w-md text-sm leading-7 text-[#F6F1E6]/75">{copy.investment.promo}</p>
              <div className="mt-8 rounded-2xl border border-[#E7D7A8]/40 p-5">
                <p className="text-sm font-semibold text-[#E7D7A8]">{copy.investment.cardLabel}</p>
                <p className="mt-3 text-lg">{copy.investment.cardEarly}</p>
                <p className="mt-2 text-lg">{copy.investment.cardRegular}</p>
              </div>
              <div className="mt-10 border-t border-white/15 pt-8">
                <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#E7D7A8]">{copy.investment.regularLabel}</p>
                <p className="serif-title mt-3 text-4xl">{copy.investment.regularAmount}</p>
                <p className="mt-3 text-sm leading-7 text-[#F6F1E6]/75">{copy.investment.regularNote}</p>
              </div>
            </div>
            <div>
              <h3 className="serif-title text-3xl">{copy.investment.includesTitle}</h3>
              <ul className="mt-6">
                {copy.investment.includes.map((item: string) => (
                  <li key={item} className="border-t border-white/15 py-3 leading-7">{item}</li>
                ))}
              </ul>
              <div className="mt-10 border-t border-white/15 pt-8">
                <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#E7D7A8]">{copy.investment.depositTitle}</p>
                <p className="serif-title mt-3 text-5xl">{copy.investment.depositPrice}</p>
                <ul className="mt-5 space-y-2 text-sm leading-7 text-[#F6F1E6]/85">
                  {copy.investment.depositLines.map((line: string) => <li key={line}>{line}</li>)}
                </ul>
              </div>
              <div className="mt-8 flex flex-col items-start gap-3">
                <a href={reserveHref} target="_blank" rel="noopener noreferrer" className={btn}>{copy.investment.cta}</a>
                <a href={consultHref} target="_blank" rel="noopener noreferrer" className={`${btnGhost} text-[#F6F1E6]`}>{copy.investment.ctaSecondary}</a>
              </div>
              <p className="mt-6 text-base leading-7 text-[#E7D7A8]">{copy.investment.flexibility}</p>
              <p className="mt-6 text-xs leading-6 text-[#F6F1E6]/60">{copy.investment.disclaimer}</p>
            </div>
          </div>
        </section>

        <section id="preguntas" className="scroll-mt-36 mx-auto max-w-3xl px-6 py-24 md:py-32">
          <h2 className="serif-title text-4xl text-[#1C3328] md:text-5xl">{copy.faq.title}</h2>
          <div className="mt-8 border-b border-[#1C2822]/15">
            {copy.faq.items.map((item: { q: string; a: string; links?: { label: string; href: string }[] }) => (
              <details key={item.q} className="group border-t border-[#1C2822]/15">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-left [&::-webkit-details-marker]:hidden">
                  <span className="serif-title text-xl text-[#1C3328]">{item.q}</span>
                  <span aria-hidden="true" className="text-2xl text-[#6A5344] group-open:rotate-45">+</span>
                </summary>
                <p className="max-w-2xl pb-3 leading-8 text-[#3C463F]">{item.a}</p>
                {item.links?.map(link => (
                  <a key={link.href} href={link.href} target={link.href.startsWith('http') ? '_blank' : undefined} rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined} className="mb-5 mr-5 inline-flex text-sm underline decoration-[#8A9A84] underline-offset-4">
                    {link.label}
                  </a>
                ))}
              </details>
            ))}
          </div>
          <div className="mt-8 text-center">
            <p className="mb-4 text-[#3C463F]">{language === 'es' ? '¿Te quedó alguna duda? Estamos para acompañarte.' : 'Still have a question? We are here to help.'}</p>
            <a href={consultHref} target="_blank" rel="noopener noreferrer" className={`${btnGhost} text-[#1C3328]`}>{consultLabel}</a>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#101A15] text-[#F6F1E6]">
          <img src={MOUNTAIN.src} alt="" width={MOUNTAIN.w} height={MOUNTAIN.h} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-[#101A15]/65" />
          <div className="relative mx-auto max-w-3xl px-6 py-28 text-center md:py-36">
            <h2 className="serif-title text-4xl leading-tight md:text-6xl">{copy.closing.title}</h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-[#F6F1E6]/85">{copy.closing.text}</p>
            <ul className="mt-8 space-y-1 text-sm uppercase tracking-[0.16em] text-[#E7D7A8]">
              {copy.closing.lines.map((line: string) => <li key={line}>{line}</li>)}
            </ul>
            <div className="mt-10 flex flex-col items-center gap-4">
              <a href={reserveHref} target="_blank" rel="noopener noreferrer" className={btn}>{copy.closing.cta}</a>
              <a href={consultHref} target="_blank" rel="noopener noreferrer" className={`${btnGhost} text-[#F6F1E6]`}>{consultLabel}</a>
              <a href={reserveHref} target="_blank" rel="noopener noreferrer" className="text-sm underline decoration-[#E7D7A8] underline-offset-4">{copy.closing.secondary}</a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <CookieBanner />
      {showSticky && (
        <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-white/10 bg-[#14211B]/95 px-4 py-3 backdrop-blur-sm md:hidden">
          <a href={reserveHref} target="_blank" rel="noopener noreferrer" className={`${btn} w-full`}>{copy.stickyCta}</a>
        </div>
      )}
    </div>
  );
};

export default Umbral;
