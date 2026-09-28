import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  Building2,
  CalendarDays,
  Camera,
  Check,
  Copy,
  Heart,
  HandHeart,
  Leaf,
  MessageCircle,
  MapPinned,
  ShieldCheck,
  Sprout,
  Target,
  TreePine,
  Users,
  X,
} from 'lucide-react';
import { Header } from '../components/Header';
import { HorizontalCardRail } from '../components/HorizontalCardRail';
import { Footer } from '../components/Footer';
import { useLanguage } from '../contexts/LanguageContext';
import { REFORESTATION_CONTRIBUTION, SITE_URL, WA_MAGICO, WA_VOLUNTEERS } from './data/config';
import { ROUTES } from './routes';

const HERO_IMAGE = '/uploads/reforestacion/jornada-comunidad.jpeg';
const IMPACT_BACKGROUND_IMAGE = '/uploads/reforestacion/territorio-restauracion.jpeg';
const FUNDING_BACKGROUND_IMAGE = '/uploads/reforestacion/jornada-plantacion.jpeg';

const Reforestacion: React.FC = () => {
  const { t, language } = useLanguage();
  const content = t.reforestation;
  const reforestationEvents = [...(t.events?.cards || [])]
    .filter((event: any) => event.isReforestacion === true)
    .sort((first: any, second: any) => (first.startDate || '').localeCompare(second.startDate || ''));
  const [copiedField, setCopiedField] = useState<'alias' | 'cbu' | null>(null);
  const [donationModalOpen, setDonationModalOpen] = useState(false);
  const [expandedImage, setExpandedImage] = useState<{ src: string; alt: string; caption: string } | null>(null);
  const hasAlias = Boolean(REFORESTATION_CONTRIBUTION.alias);
  const phaseOneGoal = 1_500_000;
  const raisedAmount = Number.isFinite(REFORESTATION_CONTRIBUTION.raisedAmount)
    ? Math.max(0, REFORESTATION_CONTRIBUTION.raisedAmount)
    : 0;
  const progressPercentage = Math.min(100, (raisedAmount / phaseOneGoal) * 100);
  const displayedPercentage = Math.round((raisedAmount / phaseOneGoal) * 100);
  const currencyFormatter = new Intl.NumberFormat(language === 'es' ? 'es-AR' : 'en-US', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });
  const whatsappUrl = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent(content.contribution.whatsappMessage)}`;
  const corporateWhatsappUrl = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent(content.corporate.whatsappMessage)}`;
  const getVolunteerWhatsappUrl = (event: { title: string; date: string }) => {
    const message = content.volunteering.applyMessage
      .replace('{event}', event.title)
      .replace('{date}', event.date);
    return `https://wa.me/${WA_VOLUNTEERS}?text=${encodeURIComponent(message)}`;
  };

  useEffect(() => {
    const title = content.seo.title;
    const description = content.seo.description;
    const url = SITE_URL + ROUTES.REFORESTACION;
    const image = SITE_URL + HERO_IMAGE;
    const previousTitle = document.title;

    document.title = title;

    const setMeta = (selector: string, key: 'name' | 'property', keyValue: string, value: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(key, keyValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', value);
    };

    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:image"]', 'property', 'og:image', image);
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
    setMeta('meta[property="og:locale"]', 'property', 'og:locale', language === 'es' ? 'es_AR' : 'en_US');
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    const schema = document.createElement('script');
    schema.type = 'application/ld+json';
    schema.id = 'ld-reforestacion';
    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'DonateAction',
      name: content.hero.title,
      description,
      recipient: {
        '@type': 'Organization',
        name: 'Pueblo Mágico',
        url: SITE_URL,
      },
      target: url,
    });
    document.getElementById(schema.id)?.remove();
    document.head.appendChild(schema);

    return () => {
      document.title = previousTitle;
      document.getElementById(schema.id)?.remove();
    };
  }, [content, language]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -32px 0px' },
    );
    document.querySelectorAll('[data-reveal]').forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!donationModalOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDonationModalOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [donationModalOpen]);

  const copyValue = async (field: 'alias' | 'cbu', value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(current => current === field ? null : current), 2200);
  };

  const impactIcons = [TreePine, Sprout, Users];
  const useIcons = [Sprout, ShieldCheck, Heart, Leaf];
  const phaseIcons = [Target, Sprout, Heart, TreePine];

  return (
    <div className="bg-bone text-dark overflow-x-hidden">
      <Header />

      <main>
        <section className="relative min-h-[720px] h-[94vh] flex items-end overflow-hidden">
          <img
            src={HERO_IMAGE}
            alt={content.hero.imageAlt}
            className="absolute inset-0 h-full w-full object-cover object-center"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071d14]/95 via-[#071d14]/45 to-[#071d14]/10" />
          <div className="relative z-10 w-full max-w-6xl mx-auto px-6 pb-16 md:pb-24">
            <p className="text-gold text-[11px] uppercase tracking-[0.28em] font-bold mb-5">
              {content.hero.eyebrow}
            </p>
            <h1 className="max-w-4xl text-white font-serif text-5xl sm:text-6xl md:text-7xl leading-[0.98] font-light mb-6">
              {content.hero.title}
            </h1>
            <p className="max-w-2xl text-white/80 text-lg md:text-xl font-light leading-relaxed mb-9">
              {content.hero.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#metas" className="btn-gold btn-icon-inline">
                {content.hero.primaryCta}
                <ArrowDown size={17} aria-hidden="true" />
              </a>
              <a href="#impacto" className="btn-glass inline-flex items-center justify-center">
                {content.hero.secondaryCta}
              </a>
            </div>
          </div>
        </section>

        <section id="impacto" className="relative overflow-hidden bg-white px-6 py-20 md:py-28">
          <img
            src={IMPACT_BACKGROUND_IMAGE}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-[0.38]"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/82 via-white/76 to-white/90" aria-hidden="true" />
          <div className="relative max-w-6xl mx-auto">
            <div data-reveal>
              <div className="max-w-3xl mx-auto text-center mb-14">
                <p className="text-brand text-[11px] uppercase tracking-[0.25em] font-bold mb-4">{content.impact.eyebrow}</p>
                <h2 className="font-serif text-4xl md:text-5xl text-brand leading-tight mb-6">{content.impact.title}</h2>
                <p className="text-gray-600 text-lg font-light leading-relaxed">{content.impact.description}</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {content.impact.stats.map((stat: { value: string; label: string; description: string; href: string; action: string }, index: number) => {
                const Icon = impactIcons[index];
                return (
                  <div data-reveal data-delay={String(index + 1)} key={stat.label}>
                    <a href={stat.href} className="group block h-full rounded-2xl border border-brand/10 bg-bone p-7 text-center transition-all hover:-translate-y-1 hover:border-gold/50 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                      <Icon size={30} strokeWidth={1.5} className="mx-auto text-gold mb-5" aria-hidden="true" />
                      <p className="font-serif text-4xl text-brand mb-2">{stat.value}</p>
                      <h3 className="font-semibold text-dark mb-3">{stat.label}</h3>
                      <p className="text-sm text-gray-500 font-light leading-relaxed">{stat.description}</p>
                      <span className="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-brand/20 bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-brand shadow-sm transition-all group-hover:border-brand group-hover:bg-brand group-hover:text-white">
                        {stat.action}
                        <ArrowRight size={15} aria-hidden="true" />
                      </span>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="metas" className="relative overflow-hidden bg-bone px-6 py-20 md:py-28">
          <img
            src={FUNDING_BACKGROUND_IMAGE}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-[0.28]"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-bone/82" aria-hidden="true" />
          <div className="relative max-w-6xl mx-auto">
            <div data-reveal className="max-w-3xl mx-auto text-center mb-12">
              <p className="text-brand text-[11px] uppercase tracking-[0.25em] font-bold mb-4">{content.funding.eyebrow}</p>
              <h2 className="font-serif text-4xl md:text-5xl text-brand leading-tight mb-6">{content.funding.title}</h2>
              <p className="text-gray-600 text-lg font-light leading-relaxed">{content.funding.description}</p>
            </div>

            <div data-reveal data-delay="1" className="rounded-3xl bg-brand p-7 md:p-10 text-white shadow-[0_24px_80px_rgba(0,83,51,0.16)] mb-10">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-7">
                <div>
                  <p className="text-gold text-xs uppercase tracking-[0.2em] font-bold mb-2">{content.funding.currentLabel}</p>
                  <p className="font-serif text-4xl md:text-5xl">{currencyFormatter.format(raisedAmount)}</p>
                </div>
                <div className="md:text-right">
                  <p className="text-3xl font-semibold text-gold">{displayedPercentage}%</p>
                  <p className="text-white/65 text-sm">{content.funding.ofGoal} {currencyFormatter.format(phaseOneGoal)}</p>
                </div>
              </div>
              <div
                className="h-4 rounded-full bg-white/15 overflow-hidden"
                role="progressbar"
                aria-label={content.funding.progressLabel}
                aria-valuemin={0}
                aria-valuemax={phaseOneGoal}
                aria-valuenow={Math.min(raisedAmount, phaseOneGoal)}
              >
                <div className="h-full rounded-full bg-gold transition-[width] duration-700" style={{ width: `${progressPercentage}%` }} />
              </div>
              <p className="text-white/55 text-xs mt-4">{content.funding.updatedNote}</p>
            </div>

            <ol className="relative grid gap-5 md:grid-cols-2 lg:grid-cols-4 lg:gap-4 before:hidden lg:before:block lg:before:absolute lg:before:left-[12.5%] lg:before:right-[12.5%] lg:before:top-8 lg:before:h-px lg:before:bg-brand/15">
              {content.funding.phases.map((phase: { number: string; status: string; title: string; goal: string; description: string }, index: number) => {
                const Icon = phaseIcons[index] ?? Sprout;
                return (
                  <li key={phase.number} data-reveal data-delay={String(index + 1)} className="relative flex">
                    <article className={`flex w-full flex-col rounded-2xl border p-6 transition-transform duration-300 hover:-translate-y-1 md:p-7 ${index === 0 ? 'bg-white border-gold/50 shadow-[0_16px_45px_rgba(0,83,51,0.11)]' : 'bg-white/70 border-brand/10 shadow-[0_8px_28px_rgba(0,83,51,0.04)]'}`}>
                      <div className="mb-6 flex items-start justify-between gap-3">
                        <div className={`relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-[6px] border-bone ${index === 0 ? 'bg-brand text-gold' : 'bg-[#e7efeb] text-brand'}`}>
                          <Icon size={23} strokeWidth={1.5} aria-hidden="true" />
                          <span className={`absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white px-1 text-[10px] font-bold ${index === 0 ? 'bg-gold text-brand' : 'bg-white text-brand shadow-sm'}`}>
                            {index + 1}
                          </span>
                        </div>
                        <span className={`mt-1 rounded-full px-3 py-1.5 text-[9px] uppercase tracking-[0.14em] font-bold text-center ${index === 0 ? 'bg-gold/20 text-[#76570d]' : 'bg-gray-100 text-gray-500'}`}>{phase.status}</span>
                      </div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{phase.number}</p>
                      <h3 className="mb-4 font-serif text-[1.7rem] leading-tight text-brand">{phase.title}</h3>
                      <div className={`mb-4 flex items-start gap-2 rounded-xl px-3.5 py-3 text-sm font-semibold ${index === 0 ? 'bg-gold/10 text-[#76570d]' : 'bg-brand/[0.055] text-brand'}`}>
                        <Target size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
                        <span>{phase.goal}</span>
                      </div>
                      <p className="mt-auto text-sm font-light leading-relaxed text-gray-600">{phase.description}</p>
                    </article>
                  </li>
                );
              })}
            </ol>
            <div data-reveal className="mt-10 flex flex-col items-center justify-center gap-3 rounded-2xl border border-brand/10 bg-white/65 p-5 sm:flex-row sm:flex-wrap md:p-6">
              <button type="button" onClick={() => setDonationModalOpen(true)} className="btn-gold btn-icon-inline">
                <Heart size={18} aria-hidden="true" />
                {content.funding.cta}
              </button>
              <a href={`${ROUTES.VOLUNTARIADO}#convocatorias`} className="inline-flex items-center justify-center gap-2 rounded-full border border-brand/20 bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-brand transition-colors hover:border-brand hover:bg-brand hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                <HandHeart size={18} aria-hidden="true" />
                {content.funding.volunteerCta}
              </a>
              <a href={language === 'es' ? '#mapas' : '#maps'} className="inline-flex items-center justify-center gap-2 rounded-full border border-brand/20 bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-brand transition-colors hover:border-brand hover:bg-brand hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                <MapPinned size={18} aria-hidden="true" />
                {content.funding.mapsCta}
              </a>
            </div>
          </div>
        </section>

        <section id="avances" className="py-20 md:py-28 px-6 bg-[#eef3ed]">
          <div className="max-w-6xl mx-auto">
            <div data-reveal className="max-w-3xl mx-auto text-center mb-14">
              <p className="text-brand text-[11px] uppercase tracking-[0.25em] font-bold mb-4">{content.updates.eyebrow}</p>
              <h2 className="font-serif text-4xl md:text-5xl text-brand leading-tight mb-6">{content.updates.title}</h2>
              <p className="text-gray-600 text-lg font-light leading-relaxed">{content.updates.description}</p>
            </div>

            <div className="space-y-8">
              {content.updates.phases.map((phase: {
                number: string;
                title: string;
                status: string;
                description: string;
                plannedDate?: string;
                note?: string;
                steps: Array<{ title: string; status: string; state: 'active' | 'completed' | 'upcoming' }>;
                photos: Array<{ src: string; alt: string; caption: string; type?: 'image' | 'video' }>;
              }, phaseIndex: number) => {
                const Icon = phaseIcons[phaseIndex] ?? Sprout;
                return (
                  <article key={phase.number} data-reveal className="rounded-3xl border border-brand/10 bg-white p-6 md:p-9 shadow-[0_16px_50px_rgba(0,83,51,0.07)]">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 mb-7">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-full flex shrink-0 items-center justify-center ${phaseIndex === 0 ? 'bg-brand text-gold' : 'bg-brand/10 text-brand'}`}>
                          <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold mb-1">{phase.number}</p>
                          <h3 className="font-serif text-3xl text-brand">{phase.title}</h3>
                        </div>
                      </div>
                      <span className={`self-start rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] font-bold ${phaseIndex === 0 ? 'bg-gold/20 text-[#76570d]' : 'bg-gray-100 text-gray-500'}`}>{phase.status}</span>
                    </div>
                    <p className="max-w-3xl text-gray-600 font-light leading-relaxed mb-7">{phase.description}</p>
                    {phase.plannedDate && (
                      <p className="mb-7 inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-2 text-sm font-semibold text-brand">
                        <CalendarDays size={17} aria-hidden="true" />
                        {phase.plannedDate}
                      </p>
                    )}

                    {phase.steps.length > 0 && (
                      <div className="grid sm:grid-cols-2 gap-3 mb-8">
                        {phase.steps.map((step, stepIndex) => (
                          <div key={step.title} className={`flex items-center gap-3 rounded-xl border px-4 py-4 ${step.state === 'active' ? 'border-gold/45 bg-gold/10' : step.state === 'completed' ? 'border-brand/25 bg-brand/5' : 'border-brand/10 bg-bone'}`}>
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${step.state === 'active' ? 'bg-gold text-brand' : step.state === 'completed' ? 'bg-brand text-white' : 'bg-brand/10 text-brand'}`}>
                              {step.state === 'completed' ? <Check size={16} aria-hidden="true" /> : stepIndex + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-dark">{step.title}</p>
                              <p className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] font-bold ${step.state === 'active' ? 'bg-gold/25 text-[#76570d]' : step.state === 'completed' ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-500'}`}>{step.status}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {phase.photos.length > 0 ? (
                      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4" aria-label={content.updates.carouselLabel}>
                        {phase.photos.map(photo => (
                          <figure key={photo.src} className="flex w-[68vw] max-w-72 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-brand/10 bg-white shadow-lg sm:w-72">
                            {photo.type === 'video' ? (
                              <div className="flex aspect-square items-center justify-center overflow-hidden bg-bone">
                                <video controls playsInline preload="metadata" className="h-full w-full object-cover" aria-label={photo.alt}>
                                  <source src={photo.src} />
                                  <a href={photo.src}>{content.updates.videoFallback}</a>
                                </video>
                              </div>
                            ) : (
                              <button type="button" onClick={() => setExpandedImage(photo)} className="group block aspect-square w-full overflow-hidden bg-bone focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-gold" aria-label={`${content.updates.goTo}: ${photo.alt}`}>
                                <img src={photo.src} alt={photo.alt} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" loading="lazy" decoding="async" />
                              </button>
                            )}
                            <figcaption className="min-h-20 flex-1 p-4 text-sm leading-relaxed text-gray-600">{photo.caption}</figcaption>
                          </figure>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 rounded-xl border border-dashed border-brand/20 bg-bone/70 px-5 py-6 text-center sm:text-left">
                        <Camera size={23} strokeWidth={1.5} className="text-gold" aria-hidden="true" />
                        <p className="text-sm text-gray-500 font-light">{content.updates.noPhotos}</p>
                      </div>
                    )}

                    {phase.note && (
                      <p className="mt-5 rounded-xl border border-gold/25 bg-gold/10 px-5 py-4 text-sm text-gray-600 leading-relaxed">
                        {phase.note}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28 px-6 bg-bone">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div data-reveal>
              <img
                src="/uploads/reforestacion/jornada-plantines.jpeg"
                alt={content.story.imageAlt}
                className="w-full aspect-[4/3] object-cover rounded-2xl shadow-xl"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div data-reveal data-delay="1">
              <p className="text-brand text-[11px] uppercase tracking-[0.25em] font-bold mb-4">{content.story.eyebrow}</p>
              <h2 className="font-serif text-4xl md:text-5xl text-brand leading-tight mb-6">{content.story.title}</h2>
              {content.story.paragraphs.map((paragraph: string) => (
                <p key={paragraph} className="text-gray-600 text-lg font-light leading-relaxed mb-5">{paragraph}</p>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-brand py-20 md:py-28 px-6 text-white">
          <div className="max-w-6xl mx-auto">
            <div data-reveal>
              <div className="max-w-3xl mb-14">
                <p className="text-gold text-[11px] uppercase tracking-[0.25em] font-bold mb-4">{content.use.eyebrow}</p>
                <h2 className="font-serif text-4xl md:text-5xl leading-tight mb-6">{content.use.title}</h2>
                <p className="text-white/70 text-lg font-light leading-relaxed">{content.use.description}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {content.use.items.map((item: { title: string; description: string }, index: number) => {
                const Icon = useIcons[index];
                return (
                  <div data-reveal data-delay={String(index + 1)} key={item.title}>
                    <article className="h-full rounded-2xl border border-white/15 bg-white/5 p-6">
                      <Icon size={28} strokeWidth={1.5} className="text-gold mb-5" aria-hidden="true" />
                      <h3 className="font-serif text-2xl mb-3">{item.title}</h3>
                      <p className="text-white/65 text-sm font-light leading-relaxed">{item.description}</p>
                    </article>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28 px-6 bg-white">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-20 items-center">
            <div data-reveal className="lg:order-2">
              <img
                src="/uploads/reforestacion/vivero-plantines.jpeg"
                alt={content.community.imageAlt}
                className="w-full max-h-[680px] object-cover rounded-2xl shadow-xl"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div data-reveal className="lg:order-1">
              <p className="text-brand text-[11px] uppercase tracking-[0.25em] font-bold mb-4">{content.community.eyebrow}</p>
              <h2 className="font-serif text-4xl md:text-5xl text-brand leading-tight mb-6">{content.community.title}</h2>
              <p className="text-gray-600 text-lg font-light leading-relaxed mb-8">{content.community.description}</p>
              <ul className="space-y-4">
                {content.community.items.map((item: string) => (
                  <li key={item} className="flex gap-3 text-gray-600 font-light">
                    <Check size={20} className="text-gold flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id={language === 'es' ? 'voluntariado' : 'volunteering'} className="bg-bone px-6 py-20 md:py-24">
          <div className="mx-auto max-w-6xl">
            <div data-reveal className="overflow-hidden rounded-3xl border border-gold/25 bg-gold/10 p-7 shadow-[0_18px_60px_rgba(0,83,51,0.08)] md:p-10 lg:p-12">
              <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
                <div>
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-gold">
                    <HandHeart size={28} strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.25em] text-brand">{content.volunteering.eyebrow}</p>
                  <h2 className="mb-6 font-serif text-4xl leading-tight text-brand md:text-5xl">{content.volunteering.title}</h2>
                  <p className="text-lg font-light leading-relaxed text-gray-600">{content.volunteering.description}</p>
                </div>
                <ul className="space-y-4">
                  {content.volunteering.items.map((item: string) => (
                    <li key={item} className="flex gap-3 text-gray-700">
                      <Check size={20} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-14">
              <div data-reveal className="mx-auto mb-10 max-w-3xl text-center">
                <CalendarDays size={34} strokeWidth={1.5} className="mx-auto mb-5 text-gold" aria-hidden="true" />
                <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.25em] text-brand">{content.volunteering.scheduleEyebrow}</p>
                <h3 className="mb-5 font-serif text-4xl leading-tight text-brand md:text-5xl">{content.volunteering.scheduleTitle}</h3>
                <p className="text-lg font-light leading-relaxed text-gray-600">{content.volunteering.scheduleDescription}</p>
              </div>

              <HorizontalCardRail previousLabel={t.ui.prev} nextLabel={t.ui.next} desktopGridClassName="md:grid-cols-2" gapClassName="gap-6">
                {reforestationEvents.map((event: any, index: number) => (
                  <article key={`${event.date}-${event.title}`} data-reveal data-delay={String(index + 1)} className="flex h-full flex-col overflow-hidden rounded-2xl border border-brand/10 bg-white shadow-[0_12px_35px_rgba(0,83,51,0.08)]">
                    <div className="relative aspect-[16/9] overflow-hidden bg-brand/5">
                      <img src={event.image} alt={event.title} className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.02]" loading="lazy" decoding="async" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#071d14]/75 via-transparent to-transparent" />
                      <span className="absolute left-4 top-4 rounded-full bg-gold px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-brand">{content.volunteering.eventBadge}</span>
                      <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white">
                        <CalendarDays size={16} className="text-gold" aria-hidden="true" />
                        {event.date}
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-6 md:p-7">
                      <h4 className="mb-3 font-serif text-3xl leading-tight text-brand">{event.title}</h4>
                      <p className="mb-5 flex-1 font-light leading-relaxed text-gray-600">{event.desc}</p>
                      <div className="mb-5 rounded-xl bg-brand/5 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand/60">{content.volunteering.eventGoalLabel}</p>
                        <p className="mt-1 font-serif text-xl text-brand">{content.volunteering.eventGoal}</p>
                      </div>
                      <p className="mb-6 text-sm leading-relaxed text-gray-500">{content.volunteering.eventDetails}</p>
                      <a href={getVolunteerWhatsappUrl(event)} target="_blank" rel="noopener noreferrer" className="btn-gold btn-icon-inline self-start">
                        <MessageCircle size={18} aria-hidden="true" />
                        {content.volunteering.cta}
                      </a>
                    </div>
                  </article>
                ))}
              </HorizontalCardRail>
            </div>
          </div>
        </section>

        <section id={language === 'es' ? 'mapas' : 'maps'} className="bg-white px-6 py-20 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div data-reveal className="mx-auto mb-12 max-w-3xl text-center">
              <MapPinned size={34} strokeWidth={1.5} className="mx-auto mb-5 text-gold" aria-hidden="true" />
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.25em] text-brand">{content.maps.eyebrow}</p>
              <h2 className="mb-6 font-serif text-4xl leading-tight text-brand md:text-5xl">{content.maps.title}</h2>
              <p className="text-lg font-light leading-relaxed text-gray-600">{content.maps.description}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {content.maps.areas.map((area: { status: string; title: string; description: string; image: string; imageAlt: string }, index: number) => (
                <article key={area.title} data-reveal data-delay={String(index + 1)} className="overflow-hidden rounded-2xl border border-brand/10 bg-bone shadow-[0_12px_35px_rgba(0,83,51,0.07)]">
                  <button type="button" onClick={() => setExpandedImage({ src: area.image, alt: area.imageAlt, caption: area.title })} className="group block aspect-[16/10] w-full overflow-hidden bg-brand/5 focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-gold" aria-label={`${content.updates.goTo}: ${area.imageAlt}`}>
                    <img src={area.image} alt={area.imageAlt} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" loading="lazy" decoding="async" />
                  </button>
                  <div className="p-7 md:p-8">
                    <span className="mb-5 inline-flex rounded-full bg-brand/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-brand">{area.status}</span>
                    <h3 className="mb-3 font-serif text-3xl text-brand">{area.title}</h3>
                    <p className="font-light leading-relaxed text-gray-600">{area.description}</p>
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-6 rounded-xl border border-gold/25 bg-gold/10 px-5 py-4 text-center text-sm leading-relaxed text-gray-600">{content.maps.note}</p>
          </div>
        </section>

        <section className="bg-brand px-6 py-20 text-white md:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">
            <div data-reveal>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-brand">
                <Building2 size={28} strokeWidth={1.5} aria-hidden="true" />
              </div>
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.25em] text-gold">{content.corporate.eyebrow}</p>
              <h2 className="mb-6 font-serif text-4xl leading-tight md:text-5xl">{content.corporate.title}</h2>
              <p className="max-w-xl text-lg font-light leading-relaxed text-white/75">{content.corporate.description}</p>
            </div>

            <div data-reveal data-delay="1">
              <div className="space-y-3">
                {content.corporate.items.map((item: { title: string; description: string }, index: number) => {
                  const Icon = [TreePine, Users, ShieldCheck][index] ?? TreePine;
                  return (
                    <article key={item.title} className="flex gap-4 rounded-2xl border border-white/15 bg-white/[0.06] p-5 backdrop-blur-sm">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                        <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="mb-1 font-serif text-xl">{item.title}</h3>
                        <p className="text-sm font-light leading-relaxed text-white/65">{item.description}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a href={ROUTES.EMPRESAS} className="btn-gold btn-icon-inline">
                  {content.corporate.cta}
                  <ArrowRight size={18} aria-hidden="true" />
                </a>
                <a href={corporateWhatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-glass btn-icon-inline">
                  <MessageCircle size={18} aria-hidden="true" />
                  {content.corporate.contactCta}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="aportar" className="py-20 md:py-28 px-6 bg-bone">
          <div className="max-w-5xl mx-auto">
            <div data-reveal>
              <div className="max-w-3xl mx-auto text-center mb-12">
                <p className="text-brand text-[11px] uppercase tracking-[0.25em] font-bold mb-4">{content.contribution.eyebrow}</p>
                <h2 className="font-serif text-4xl md:text-5xl text-brand leading-tight mb-6">{content.contribution.title}</h2>
                <p className="text-gray-600 text-lg font-light leading-relaxed">{content.contribution.description}</p>
              </div>
            </div>

            <div data-reveal data-delay="1">
              <div className="rounded-3xl bg-white border border-brand/10 shadow-[0_24px_80px_rgba(0,83,51,0.10)] overflow-hidden">
                <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
                  <div className="bg-brand p-8 md:p-10 text-white">
                    <Sprout size={36} strokeWidth={1.5} className="text-gold mb-6" aria-hidden="true" />
                    <h3 className="font-serif text-3xl mb-4">{content.contribution.cardTitle}</h3>
                    <p className="text-white/70 font-light leading-relaxed mb-8">{content.contribution.cardDescription}</p>
                    <div className="space-y-3 text-sm text-white/75">
                      {content.contribution.notes.map((note: string) => (
                        <p key={note} className="flex gap-3">
                          <Check size={17} className="text-gold flex-shrink-0 mt-0.5" aria-hidden="true" />
                          <span>{note}</span>
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="p-8 md:p-10">
                    {hasAlias ? (
                      <>
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-semibold mb-3">{content.contribution.aliasLabel}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-brand/15 bg-bone p-5 mb-5">
                          <code className="text-brand text-xl md:text-2xl font-semibold break-all flex-1">{REFORESTATION_CONTRIBUTION.alias}</code>
                          <button
                            type="button"
                            onClick={() => copyValue('alias', REFORESTATION_CONTRIBUTION.alias)}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand text-white px-5 py-3 text-xs font-bold uppercase tracking-wider hover:bg-gold hover:text-brand transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                          >
                            {copiedField === 'alias' ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                            {copiedField === 'alias' ? content.contribution.copied : content.contribution.copy}
                          </button>
                        </div>
                        {REFORESTATION_CONTRIBUTION.accountHolder && (
                          <p className="text-sm text-gray-500 mb-4">
                            <span className="font-semibold text-gray-700">{content.contribution.holderLabel}:</span>{' '}
                            {REFORESTATION_CONTRIBUTION.accountHolder}
                          </p>
                        )}
                        {REFORESTATION_CONTRIBUTION.cbu && (
                          <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-4 mb-6">
                            <p className="text-sm text-gray-500 break-all"><span className="font-semibold text-gray-700">{content.contribution.cbuLabel}:</span> {REFORESTATION_CONTRIBUTION.cbu}</p>
                            <button
                              type="button"
                              onClick={() => copyValue('cbu', REFORESTATION_CONTRIBUTION.cbu)}
                              aria-label={content.contribution.copyCbu}
                              className="p-2 text-brand hover:text-gold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-full"
                            >
                              {copiedField === 'cbu' ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
                            </button>
                          </div>
                        )}
                        <p className="sr-only" aria-live="polite">{copiedField ? content.contribution.copyConfirmation : ''}</p>
                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-gold btn-icon-inline w-full">
                          <MessageCircle size={18} aria-hidden="true" />
                          {content.contribution.confirmCta}
                        </a>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <MessageCircle size={36} strokeWidth={1.5} className="text-gold mx-auto mb-5" aria-hidden="true" />
                        <h3 className="font-serif text-3xl text-brand mb-4">{content.contribution.fallbackTitle}</h3>
                        <p className="text-gray-500 font-light leading-relaxed mb-7">{content.contribution.fallbackDescription}</p>
                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-gold btn-icon-inline">
                          <MessageCircle size={18} aria-hidden="true" />
                          {content.contribution.fallbackCta}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <p className="max-w-3xl mx-auto text-center text-xs text-gray-400 font-light leading-relaxed mt-6">{content.contribution.legalNote}</p>
          </div>
        </section>

        <section className="relative py-24 md:py-32 px-6 overflow-hidden">
          <img
            src="/uploads/reforestacion/plantacion-detalle.jpeg"
            alt={content.closing.imageAlt}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-[#071d14]/78" />
          <div data-reveal>
            <div className="relative z-10 max-w-3xl mx-auto text-center text-white">
              <Leaf size={34} strokeWidth={1.5} className="text-gold mx-auto mb-6" aria-hidden="true" />
              <h2 className="font-serif text-4xl md:text-6xl leading-tight mb-6">{content.closing.title}</h2>
              <p className="text-white/75 text-lg font-light leading-relaxed mb-8">{content.closing.description}</p>
              <button type="button" onClick={() => setDonationModalOpen(true)} className="btn-gold inline-flex items-center justify-center">{content.closing.cta}</button>
            </div>
          </div>
        </section>
      </main>

      {expandedImage && (
        <div
          className="fixed inset-0 z-[6000] flex items-center justify-center bg-[#071d14]/90 p-4 backdrop-blur-sm md:p-8"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setExpandedImage(null);
          }}
        >
          <section role="dialog" aria-modal="true" aria-label={expandedImage.alt} className="relative flex max-h-full w-full max-w-6xl flex-col items-center">
            <button
              type="button"
              onClick={() => setExpandedImage(null)}
              aria-label={content.contribution.closeModal}
              className="absolute right-2 top-2 z-10 rounded-full bg-white/95 p-2.5 text-brand shadow-lg transition-colors hover:bg-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold md:right-4 md:top-4"
            >
              <X size={24} aria-hidden="true" />
            </button>
            <img src={expandedImage.src} alt={expandedImage.alt} className="max-h-[82vh] max-w-full rounded-2xl object-contain shadow-2xl" />
            <p className="mt-3 max-w-3xl rounded-full bg-white/95 px-5 py-2 text-center text-sm text-gray-700 shadow-lg">{expandedImage.caption}</p>
          </section>
        </div>
      )}

      {donationModalOpen && (
        <div
          className="fixed inset-0 z-[5000] flex items-center justify-center bg-[#071d14]/80 px-4 py-8 backdrop-blur-sm"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setDonationModalOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="donation-modal-title"
            className="relative w-full max-w-xl max-h-full overflow-y-auto rounded-3xl bg-white p-7 md:p-10 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setDonationModalOpen(false)}
              aria-label={content.contribution.closeModal}
              className="absolute right-5 top-5 rounded-full p-2 text-gray-400 transition-colors hover:bg-bone hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <X size={22} aria-hidden="true" />
            </button>
            <Sprout size={34} strokeWidth={1.5} className="text-gold mb-5" aria-hidden="true" />
            <p className="text-brand text-[11px] uppercase tracking-[0.22em] font-bold mb-3">{content.contribution.eyebrow}</p>
            <h2 id="donation-modal-title" className="font-serif text-3xl md:text-4xl text-brand leading-tight mb-4">{content.contribution.modalTitle}</h2>
            <p className="text-gray-600 font-light leading-relaxed mb-7">{content.contribution.modalDescription}</p>

            {hasAlias ? (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-semibold mb-3">{content.contribution.aliasLabel}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-brand/15 bg-bone p-5 mb-5">
                  <code className="text-brand text-xl md:text-2xl font-semibold break-all flex-1">{REFORESTATION_CONTRIBUTION.alias}</code>
                  <button type="button" onClick={() => copyValue('alias', REFORESTATION_CONTRIBUTION.alias)} className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-gold hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                    {copiedField === 'alias' ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                    {copiedField === 'alias' ? content.contribution.copied : content.contribution.copy}
                  </button>
                </div>
                {REFORESTATION_CONTRIBUTION.accountHolder && <p className="text-sm text-gray-500 mb-3"><span className="font-semibold text-gray-700">{content.contribution.holderLabel}:</span> {REFORESTATION_CONTRIBUTION.accountHolder}</p>}
                {REFORESTATION_CONTRIBUTION.cbu && <p className="text-sm text-gray-500 break-all mb-6"><span className="font-semibold text-gray-700">{content.contribution.cbuLabel}:</span> {REFORESTATION_CONTRIBUTION.cbu}</p>}
                <p className="sr-only" aria-live="polite">{copiedField ? content.contribution.copyConfirmation : ''}</p>
              </div>
            ) : (
              <div className="rounded-2xl bg-bone p-5 mb-6">
                <p className="text-gray-600 font-light leading-relaxed">{content.contribution.fallbackDescription}</p>
              </div>
            )}

            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-gold btn-icon-inline w-full">
              <MessageCircle size={18} aria-hidden="true" />
              {hasAlias ? content.contribution.confirmCta : content.contribution.fallbackCta}
            </a>
          </section>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Reforestacion;
