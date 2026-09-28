import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDot,
  Clock3,
  Hammer,
  HandHeart,
  HeartHandshake,
  Home,
  Leaf,
  MessageCircle,
  Mountain,
  Palette,
  Play,
  Quote,
  Recycle,
  ShieldCheck,
  Sparkles,
  Sprout,
  Sun,
  TreePine,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { HorizontalCardRail } from '../components/HorizontalCardRail';
import { useLanguage } from '../contexts/LanguageContext';
import { SITE_URL } from './data/config';
import { ROUTES } from './routes';

const areaIcons = [UtensilsCrossed, Home, Sprout, TreePine, Hammer, Palette, Recycle];
const modalityIcons = [Sparkles, HeartHandshake, CalendarDays, Sun, CircleDot];
const dayIcons = [Sun, Users, Leaf, Sparkles];
const faqIcons = [Sprout, Clock3, Home, CircleDot, Hammer, Mountain];

const Voluntariado: React.FC = () => {
  const { t, language } = useLanguage();
  const content = (t as any).volunteerPage;
  const volunteerEvents = ((t as any).events?.cards || []).filter((event: any) => event.isVolunariado === true);
  const volunteerReviews = (t as any).volunteer?.testimonials || [];
  const volunteerImage = (t as any).volunteer.image as string;
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const getEventApplicationLink = (eventTitle: string) => {
    const applicationUrl = new URL(content.applyLink);
    applicationUrl.searchParams.set('text', content.calendar.applyMessage.replace('{event}', eventTitle));
    return applicationUrl.toString();
  };

  const renderModalityCard = (item: any, index: number) => {
    const Icon = modalityIcons[index] || Sparkles;
    const isResidentialProgram = index < 2;

    return (
      <div data-reveal key={item.title}>
        <article className={`h-full rounded-2xl p-7 md:p-8 border ${isResidentialProgram ? 'bg-brand text-white border-brand' : 'bg-white border-brand/10'} shadow-sm`}>
          <Icon className={isResidentialProgram ? 'text-gold' : 'text-brand'} size={30} aria-hidden="true" />
          <p className="text-xs uppercase tracking-[0.18em] font-bold mt-6 mb-2 text-gold">{item.tag}</p>
          <h3 className="font-serif text-3xl mb-4">{item.title}</h3>
          <p className={`font-light leading-relaxed ${isResidentialProgram ? 'text-white/75' : 'text-dark/65'}`}>{item.description}</p>
        </article>
      </div>
    );
  };

  useEffect(() => {
    const previousTitle = document.title;
    const url = SITE_URL + ROUTES.VOLUNTARIADO;
    const image = SITE_URL + volunteerImage;
    document.title = content.seo.title;

    const setMeta = (selector: string, key: 'name' | 'property', keyValue: string, value: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(key, keyValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', value);
    };

    setMeta('meta[name="description"]', 'name', 'description', content.seo.description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', content.seo.title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', content.seo.description);
    setMeta('meta[property="og:image"]', 'property', 'og:image', image);
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
    setMeta('meta[property="og:locale"]', 'property', 'og:locale', language === 'es' ? 'es_AR' : 'en_US');
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    return () => {
      document.title = previousTitle;
    };
  }, [content, language, volunteerImage]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    );
    document.querySelectorAll('[data-reveal]').forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-bone text-dark overflow-x-hidden">
      <Header />
      <main>
        <section className="relative min-h-[760px] h-[96vh] flex items-end overflow-hidden">
          <img src={volunteerImage} alt={content.hero.imageAlt} className="absolute inset-0 h-full w-full object-cover object-[center_70%] md:object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#10251d]/95 via-[#10251d]/55 to-black/20" />
          <div className="relative z-10 max-w-7xl mx-auto w-full px-6 lg:px-12 pb-16 md:pb-24 text-white">
            <div data-reveal>
              <p className="text-gold text-xs md:text-sm font-bold uppercase tracking-[0.28em] mb-5">{content.hero.eyebrow}</p>
              <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[0.95] max-w-5xl mb-7">{content.hero.title}</h1>
              <p className="text-lg md:text-2xl font-light leading-relaxed text-white/85 max-w-3xl mb-9">{content.hero.subtitle}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="#programa" className="btn-gold !inline-flex items-center gap-2 justify-center">
                  {content.hero.primaryCta}<ArrowRight size={18} aria-hidden="true" />
                </a>
                <a href={content.applyLink} target="_blank" rel="noopener noreferrer" className="btn-glass !inline-flex items-center gap-2 justify-center">
                  <MessageCircle size={18} aria-hidden="true" />{content.hero.secondaryCta}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="programa" className="py-20 md:py-28 bg-white scroll-mt-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-[0.9fr_1.1fr] gap-14 lg:gap-24 items-center">
            <div data-reveal>
              <p className="text-gold font-bold uppercase tracking-[0.2em] text-xs mb-4">{content.intro.eyebrow}</p>
              <h2 className="font-serif text-4xl md:text-6xl text-brand leading-tight mb-7">{content.intro.title}</h2>
              <p className="text-lg text-dark/75 font-light leading-relaxed mb-6">{content.intro.p1}</p>
              <p className="text-dark/65 font-light leading-relaxed">{content.intro.p2}</p>
            </div>
            <div data-reveal>
              <div className="relative">
                <img src="/uploads/dji_0074.webp" alt={content.intro.imageAlt} className="w-full h-[520px] object-cover rounded-[2rem] shadow-xl" loading="lazy" />
                <div className="absolute -bottom-7 left-5 md:-left-9 bg-brand text-white p-7 md:p-9 rounded-2xl max-w-sm shadow-xl">
                  <Mountain className="text-gold mb-4" size={30} aria-hidden="true" />
                  <p className="font-serif text-2xl leading-snug">{content.intro.quote}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="modalidades" className="py-20 md:py-28 bg-bone scroll-mt-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="max-w-3xl mb-14" data-reveal>
              <p className="text-gold font-bold uppercase tracking-[0.2em] text-xs mb-4">{content.modalities.eyebrow}</p>
              <h2 className="font-serif text-4xl md:text-6xl text-brand mb-6">{content.modalities.title}</h2>
              <p className="text-dark/65 text-lg font-light leading-relaxed">{content.modalities.description}</p>
            </div>
            <div className="space-y-14">
              <div>
                <div className="mb-6" data-reveal>
                  <p className="text-gold text-xs font-bold uppercase tracking-[0.18em] mb-2">{content.modalities.residential.eyebrow}</p>
                  <h3 className="font-serif text-3xl md:text-4xl text-brand">{content.modalities.residential.title}</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-5 max-w-4xl">
                  {content.modalities.items.slice(0, 2).map((item: any, index: number) => renderModalityCard(item, index))}
                </div>
              </div>

              <div className="pt-12 border-t border-brand/10">
                <div className="mb-6" data-reveal>
                  <p className="text-gold text-xs font-bold uppercase tracking-[0.18em] mb-2">{content.modalities.occasional.eyebrow}</p>
                  <h3 className="font-serif text-3xl md:text-4xl text-brand">{content.modalities.occasional.title}</h3>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {content.modalities.items.slice(2).map((item: any, index: number) => renderModalityCard(item, index + 2))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28 bg-brand text-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-14 lg:gap-24 items-start">
              <div data-reveal>
                <p className="text-gold font-bold uppercase tracking-[0.2em] text-xs mb-4">{content.exchange.eyebrow}</p>
                <h2 className="font-serif text-4xl md:text-6xl leading-tight mb-6">{content.exchange.title}</h2>
                <p className="text-white/70 text-lg font-light leading-relaxed">{content.exchange.description}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                {content.exchange.columns.map((column: any, columnIndex: number) => (
                  <div data-reveal key={column.title}>
                    <div className="h-full bg-white/8 border border-white/15 rounded-2xl p-7 backdrop-blur-sm">
                      {columnIndex === 0 ? <HandHeart className="text-gold mb-5" /> : <HeartHandshake className="text-gold mb-5" />}
                      <h3 className="font-serif text-2xl mb-5">{column.title}</h3>
                      <ul className="space-y-4">
                        {column.items.map((item: string) => (
                          <li key={item} className="flex gap-3 text-white/75 font-light leading-relaxed">
                            <Check className="text-gold flex-none mt-1" size={16} aria-hidden="true" />{item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div data-reveal>
              <div className="mt-10 border-l-2 border-gold pl-5 text-white/65 max-w-4xl text-sm leading-relaxed">{content.exchange.note}</div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center max-w-3xl mx-auto mb-14" data-reveal>
              <p className="text-gold font-bold uppercase tracking-[0.2em] text-xs mb-4">{content.areas.eyebrow}</p>
              <h2 className="font-serif text-4xl md:text-6xl text-brand mb-6">{content.areas.title}</h2>
              <p className="text-dark/65 text-lg font-light">{content.areas.description}</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {content.areas.items.map((item: any, index: number) => {
                const Icon = areaIcons[index] || Leaf;
                return (
                  <div data-reveal key={item.title}>
                    <article className="group h-full p-7 rounded-2xl bg-bone border border-brand/5 hover:border-gold/40 hover:-translate-y-1 transition-all duration-300">
                      <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center mb-6 group-hover:bg-gold transition-colors">
                        <Icon size={23} aria-hidden="true" />
                      </div>
                      <h3 className="font-serif text-2xl text-brand mb-3">{item.title}</h3>
                      <p className="text-dark/65 font-light leading-relaxed mb-5">{item.description}</p>
                      <ul className="space-y-2">
                        {item.tasks.map((task: string) => <li key={task} className="text-sm text-dark/55 flex gap-2"><span className="text-gold">•</span>{task}</li>)}
                      </ul>
                    </article>
                  </div>
                );
              })}
            </div>
            <div data-reveal>
              <div className="mt-8 rounded-2xl border border-gold/25 bg-gold/5 p-6 flex gap-4 items-start max-w-4xl mx-auto">
                <ShieldCheck className="text-gold flex-none" aria-hidden="true" />
                <p className="text-sm text-dark/65 leading-relaxed">{content.areas.safety}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28 bg-bone">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-14 lg:gap-20">
              <div data-reveal>
                <p className="text-gold font-bold uppercase tracking-[0.2em] text-xs mb-4">{content.day.eyebrow}</p>
                <h2 className="font-serif text-4xl md:text-6xl text-brand mb-6">{content.day.title}</h2>
                <p className="text-dark/65 text-lg font-light leading-relaxed">{content.day.description}</p>
              </div>
              <div className="space-y-4">
                {content.day.items.map((item: any, index: number) => {
                  const Icon = dayIcons[index] || Clock3;
                  return (
                    <div data-reveal key={item.title}>
                      <div className="bg-white rounded-2xl p-6 md:p-7 flex gap-5 border border-brand/5">
                        <div className="w-11 h-11 rounded-full bg-brand/10 text-brand flex-none flex items-center justify-center"><Icon size={21} aria-hidden="true" /></div>
                        <div><p className="text-gold text-xs uppercase tracking-widest font-bold mb-1">{item.time}</p><h3 className="font-serif text-2xl text-brand mb-2">{item.title}</h3><p className="text-dark/60 font-light leading-relaxed">{item.description}</p></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-14 lg:gap-24 items-center">
            <div className="grid grid-cols-2 gap-4" data-reveal>
              <img src="/uploads/comida.jpg" alt={content.organization.imageAltOne} className="w-full h-72 object-cover rounded-2xl mt-10" loading="lazy" />
              <img src="/uploads/herramientas.jpg" alt={content.organization.imageAltTwo} className="w-full h-72 object-cover rounded-2xl" loading="lazy" />
            </div>
            <div data-reveal>
              <p className="text-gold font-bold uppercase tracking-[0.2em] text-xs mb-4">{content.organization.eyebrow}</p>
              <h2 className="font-serif text-4xl md:text-6xl text-brand mb-6">{content.organization.title}</h2>
              <p className="text-dark/65 text-lg font-light leading-relaxed mb-8">{content.organization.description}</p>
              <div className="space-y-5">
                {content.organization.steps.map((step: any, index: number) => (
                  <div key={step.title} className="flex gap-4">
                    <span className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold flex-none">{index + 1}</span>
                    <div><h3 className="font-serif text-xl text-brand">{step.title}</h3><p className="text-dark/55 font-light mt-1">{step.description}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28 bg-[#EEE8DC]">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center max-w-3xl mx-auto mb-14" data-reveal>
              <p className="text-gold font-bold uppercase tracking-[0.2em] text-xs mb-4">{content.culture.eyebrow}</p>
              <h2 className="font-serif text-4xl md:text-6xl text-brand mb-6">{content.culture.title}</h2>
              <p className="text-dark/65 text-lg font-light">{content.culture.description}</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {content.culture.items.map((item: any, index: number) => (
                <div data-reveal key={item.title}>
                  <div className="bg-white h-full rounded-2xl p-7 text-center">
                    {[Users, MessageCircle, HandHeart, HeartHandshake][index] && React.createElement([Users, MessageCircle, HandHeart, HeartHandshake][index], { className: 'text-gold mx-auto mb-5', size: 28, 'aria-hidden': true })}
                    <h3 className="font-serif text-2xl text-brand mb-3">{item.title}</h3>
                    <p className="text-dark/60 font-light leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center max-w-4xl mx-auto mt-9 text-dark/55 text-sm leading-relaxed">{content.culture.note}</p>
          </div>
        </section>

        <section className="py-20 md:py-28 bg-brand text-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="max-w-3xl mb-14" data-reveal>
              <p className="text-gold font-bold uppercase tracking-[0.2em] text-xs mb-4">{content.reviews.eyebrow}</p>
              <h2 className="font-serif text-4xl md:text-6xl mb-6">{content.reviews.title}</h2>
              <p className="text-white/70 text-lg font-light leading-relaxed">{content.reviews.description}</p>
            </div>

            <HorizontalCardRail previousLabel={t.ui.prev} nextLabel={t.ui.next} desktopGridClassName="md:grid-cols-2 lg:grid-cols-4" gapClassName="gap-5">
              {volunteerReviews.map((review: any, index: number) => (
                <article key={`${review.name}-${index}`} data-reveal className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07] backdrop-blur-sm">
                  {review.video ? (
                    <div className="relative aspect-[4/3] overflow-hidden bg-black/30">
                      <video controls playsInline preload="metadata" poster={review.image} className="h-full w-full object-cover" aria-label={`${content.reviews.videoLabel}: ${review.name}`}>
                        <source src={review.video} />
                      </video>
                      <span className="pointer-events-none absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-gold text-brand shadow-lg" aria-hidden="true"><Play size={17} fill="currentColor" /></span>
                    </div>
                  ) : (
                    <div className="aspect-[4/3] overflow-hidden bg-white/5">
                      <img src={review.image} alt={review.name} className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]" loading="lazy" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    <Quote className="mb-5 text-gold/50" size={30} aria-hidden="true" />
                    <blockquote className="flex-1 text-white/75 font-light italic leading-relaxed">“{review.text}”</blockquote>
                    <p className="mt-6 border-t border-white/10 pt-4 font-serif text-xl text-gold">{review.name}</p>
                  </div>
                </article>
              ))}
            </HorizontalCardRail>
          </div>
        </section>

        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-14 lg:gap-20">
              <div data-reveal>
                <p className="text-gold font-bold uppercase tracking-[0.2em] text-xs mb-4">{content.process.eyebrow}</p>
                <h2 className="font-serif text-4xl md:text-6xl text-brand mb-6">{content.process.title}</h2>
                <p className="text-dark/65 text-lg font-light leading-relaxed">{content.process.description}</p>
              </div>
              <ol className="grid sm:grid-cols-2 gap-5">
                {content.process.steps.map((step: any, index: number) => (
                  <li key={step.title} data-reveal>
                    <div className="h-full rounded-2xl bg-bone border border-brand/5 p-6">
                      <span className="text-gold text-xs font-bold tracking-widest">{String(index + 1).padStart(2, '0')}</span>
                      <h3 className="font-serif text-2xl text-brand mt-3 mb-2">{step.title}</h3>
                      <p className="text-dark/60 text-sm font-light leading-relaxed">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="convocatorias" className="py-20 md:py-28 bg-brand text-white scroll-mt-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="max-w-3xl mx-auto text-center mb-12" data-reveal>
              <CalendarDays className="text-gold mx-auto mb-6" size={38} aria-hidden="true" />
              <p className="text-gold font-bold uppercase tracking-[0.2em] text-xs mb-4">{content.calendar.eyebrow}</p>
              <h2 className="font-serif text-4xl md:text-6xl mb-6">{content.calendar.title}</h2>
              <p className="text-white/70 text-lg font-light leading-relaxed">{content.calendar.description}</p>
            </div>

            {volunteerEvents.length > 0 ? (
              <HorizontalCardRail previousLabel={t.ui.prev} nextLabel={t.ui.next} desktopGridClassName={volunteerEvents.length === 1 ? 'md:grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'} gapClassName="gap-5" className={volunteerEvents.length === 1 ? 'mx-auto max-w-md' : ''}>
                {volunteerEvents.map((event: any) => (
                  <article key={`${event.date}-${event.title}`} data-reveal className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/15 bg-white text-dark shadow-xl">
                    <div className="relative aspect-[4/3] overflow-hidden bg-brand/10">
                      <img src={event.image} alt={event.title} className="h-full w-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                      <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-brand shadow-lg">
                        <CalendarDays size={13} aria-hidden="true" />{event.date}
                      </div>
                      <div className="absolute bottom-4 left-4 rounded-full bg-gold px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-brand">
                        {content.calendar.volunteerBadge}
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-serif text-2xl leading-tight text-brand mb-2">{event.title}</h3>
                      <p className="text-sm text-dark/65 font-light leading-relaxed mb-5">{event.desc}</p>
                      <div className="mt-auto flex flex-col items-stretch gap-3 pt-1 sm:items-start">
                        <a href={getEventApplicationLink(event.title)} target="_blank" rel="noopener noreferrer" className="btn-gold !inline-flex !px-5 !py-3 items-center gap-2 justify-center text-[11px]">
                          <MessageCircle size={16} aria-hidden="true" />{content.calendar.applyCta}
                        </a>
                        {event.link && (
                          <a href={event.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-brand/20 px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-brand transition-colors hover:border-brand hover:bg-brand hover:text-white">
                            {content.calendar.eventCta}<ArrowRight size={15} aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </HorizontalCardRail>
            ) : (
              <div data-reveal className="max-w-3xl mx-auto rounded-2xl border border-white/15 bg-white/5 p-8 text-center">
                <p className="text-white/70 mb-6">{content.calendar.empty}</p>
                <a href={content.applyLink} target="_blank" rel="noopener noreferrer" className="btn-gold !inline-flex items-center gap-2 justify-center">
                  <MessageCircle size={18} aria-hidden="true" />{content.calendar.generalCta}
                </a>
              </div>
            )}
            <p className="text-white/45 text-xs mt-8 text-center">{content.calendar.note}</p>
          </div>
        </section>

        <section className="py-20 md:py-28 bg-bone">
          <div className="max-w-4xl mx-auto px-6 lg:px-12">
            <div className="mb-12" data-reveal>
              <p className="text-brand/80 font-bold uppercase tracking-[0.2em] text-xs mb-4">{content.faq.eyebrow}</p>
              <h2 className="font-serif text-4xl md:text-6xl text-brand">{content.faq.title}</h2>
            </div>
            <div className="space-y-3 md:space-y-4">
              {content.faq.items.map((item: any, index: number) => {
                const isActive = openFaq === index;
                const Icon = faqIcons[index] || Sprout;

                return (
                  <div key={item.question} data-reveal>
                    <div className={`bg-white rounded-2xl border overflow-hidden transition-[border-color,box-shadow] duration-300 ${isActive ? 'border-gold shadow-md' : 'border-brand/5 shadow-sm hover:border-brand/15'}`}>
                      <button
                        type="button"
                        className="w-full flex items-center gap-4 px-6 py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 md:px-8 md:py-6"
                        onClick={() => setOpenFaq(isActive ? null : index)}
                        aria-expanded={isActive}
                      >
                        <Icon className={`flex-none transition-colors duration-300 ${isActive ? 'text-brand' : 'text-brand/30'}`} size={21} strokeWidth={1.6} aria-hidden="true" />
                        <span className={`flex-1 font-serif text-lg leading-snug transition-colors duration-300 md:text-xl ${isActive ? 'text-brand' : 'text-dark'}`}>{item.question}</span>
                        <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-full transition-[transform,background-color,color] duration-300 ${isActive ? 'rotate-180 bg-brand text-gold' : 'bg-brand/5 text-brand'}`} aria-hidden="true">
                          <ChevronDown size={17} strokeWidth={2.5} />
                        </span>
                      </button>
                      <div
                        className="grid overflow-hidden transition-[grid-template-rows,opacity] duration-500 ease-in-out"
                        style={{ gridTemplateRows: isActive ? '1fr' : '0fr', opacity: isActive ? 1 : 0 }}
                      >
                        <div className="min-h-0 overflow-hidden">
                          <div className="pb-6 pl-[3.75rem] pr-6 pt-1 md:pb-7 md:pl-[4.75rem] md:pr-8">
                            <div className="mb-5 h-px w-full bg-brand/10" />
                            <p className="text-sm font-light leading-relaxed text-dark/65 md:text-base">{item.answer}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative py-24 md:py-32 overflow-hidden">
          <img src="/uploads/pachamama-fogon-grupo-cielo.webp" alt={content.finalCta.imageAlt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-[#10251d]/80" />
          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white" data-reveal>
            <h2 className="font-serif text-4xl md:text-6xl mb-6">{content.finalCta.title}</h2>
            <p className="text-white/75 text-lg font-light leading-relaxed max-w-2xl mx-auto mb-9">{content.finalCta.description}</p>
            <a href={content.applyLink} target="_blank" rel="noopener noreferrer" className="btn-gold !inline-flex items-center gap-2 justify-center">
              {content.finalCta.cta}<ArrowRight size={18} aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Voluntariado;
