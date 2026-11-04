import React, { useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { JourneyPage } from './components/JourneyPage';
import { ContextualJourneyLinks } from './components/ContextualJourneyLinks';
import { experienceMeta, journeyCopy, transversalThemes, type ExperienceCategory, type ExperienceStatus } from './data/journey';
import { getEventCalendarDateKey } from './utils/eventCalendar';
import { ROUTES } from './routes';

const resolveStatus = (card: any, forced?: ExperienceStatus): ExperienceStatus => {
  if (forced) return forced;
  const today = getEventCalendarDateKey();
  const end = card.endDate || card.startDate;
  if (end && end < today) return 'past';
  if (card.startDate && card.startDate >= today) return 'upcoming';
  return 'ongoing';
};

export default function Experiencias() {
  const { language, t } = useLanguage();
  const copy = journeyCopy[language];
  const [category, setCategory] = useState<'all' | ExperienceCategory | 'past'>(() => {
    if (typeof window === 'undefined') return 'all';
    const value = new URLSearchParams(window.location.search).get('categoria');
    return ['wellbeing', 'nature', 'music', 'regeneration', 'past'].includes(value || '')
      ? value as ExperienceCategory | 'past'
      : 'all';
  });
  const [query, setQuery] = useState('');

  const experiences = useMemo(() => t.events.cards.flatMap((card: any) => {
    const meta = experienceMeta.find(item => item.link === card.link || (item.title && card.title.includes(item.title)));
    if (!meta || meta.publicCatalog === false || card.showInExperienceCatalog === false) return [];
    return [{ ...card, categories: meta.categories, status: resolveStatus(card, meta.status) }];
  }), [t.events.cards]);

  const visible = experiences.filter((card: any) => {
    const matchesCategory = category === 'all'
      || (category === 'past' ? card.status === 'past' : card.categories.includes(category));
    const normalized = `${card.title} ${card.desc}`.toLocaleLowerCase(language === 'es' ? 'es-AR' : 'en');
    return matchesCategory && normalized.includes(query.trim().toLocaleLowerCase(language === 'es' ? 'es-AR' : 'en'));
  });

  const filters: Array<'all' | ExperienceCategory | 'past'> = ['all', 'wellbeing', 'nature', 'music', 'regeneration', 'past'];
  const filterLabel = (filter: typeof filters[number]) => {
    if (filter === 'all') return language === 'es' ? 'Todas' : 'All';
    if (filter === 'past') return language === 'es' ? 'Archivo' : 'Archive';
    return copy.categories[filter];
  };

  return (
    <JourneyPage
      eyebrow={language === 'es' ? 'Experiencias & Agenda' : 'Experiences & Calendar'}
      title={language === 'es' ? 'Encontrá la experiencia adecuada para este momento' : 'Find the right experience for this moment'}
      intro={language === 'es'
        ? 'Fechas, propuestas permanentes y experiencias a pedido, organizadas para que sepas qué está disponible antes de consultar.'
        : 'Dates, permanent offerings and on-request experiences, organized so you know what is available before asking.'}
      image="/uploads/yoga_salon.webp"
      path={ROUTES.EXPERIENCIAS}
      seoTitle={language === 'es' ? 'Experiencias y agenda | Pueblo Mágico' : 'Experiences and calendar | Pueblo Mágico'}
      seoDescription={language === 'es' ? 'Bienestar, naturaleza, música y regeneración en Los Gigantes, Córdoba. Consultá fechas y estados reales.' : 'Wellbeing, nature, music and regeneration in Los Gigantes, Córdoba. Check real dates and availability states.'}
    >
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid gap-5 rounded-[28px] border border-brand/10 bg-[#F8F5EE] p-5 md:grid-cols-[1fr_auto] md:items-center md:p-7">
            <label className="relative block">
              <span className="sr-only">{language === 'es' ? 'Buscar experiencias' : 'Search experiences'}</span>
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand/45" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder={language === 'es' ? 'Buscar por nombre o propuesta…' : 'Search by name or offering…'}
                className="w-full rounded-full border border-brand/15 bg-white py-3 pl-12 pr-5 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
              />
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1 md:max-w-[54vw]">
              {filters.map(filter => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setCategory(filter)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${category === filter ? 'bg-brand text-white' : 'border border-brand/15 bg-white text-brand hover:border-gold'}`}
                >
                  {filterLabel(filter)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((card: any) => (
              <article key={`${card.link}-${card.title}`} className="flex overflow-hidden rounded-[24px] border border-brand/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="flex w-full flex-col">
                  <div className="relative aspect-[4/3] overflow-hidden bg-stone-200">
                    <img src={card.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                    <span className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${card.status === 'past' ? 'bg-stone-800/80 text-white' : 'bg-white text-brand shadow'}`}>
                      {copy.status[card.status as ExperienceStatus]}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-3 flex flex-wrap gap-2">
                      {card.categories.map((item: ExperienceCategory) => (
                        <span key={item} className="rounded-full bg-brand/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand/65">{copy.categories[item]}</span>
                      ))}
                    </div>
                    <h2 className="font-serif text-2xl text-brand">{card.title}</h2>
                    {card.status !== 'on-request' && card.date && (
                      <p className="mt-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold"><CalendarDays className="h-4 w-4" />{card.date}</p>
                    )}
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-dark/65">{card.desc}</p>
                    <a href={card.link} data-journey-event="experience_catalog_detail" className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold hover:text-brand">
                      {card.status === 'past' ? (language === 'es' ? 'Ver archivo' : 'View archive') : card.btn}
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {visible.length === 0 && (
            <p className="mt-10 rounded-2xl border border-brand/10 bg-[#F8F5EE] p-8 text-center text-dark/65">
              {language === 'es' ? 'No encontramos experiencias con esos filtros.' : 'No experiences match those filters.'}
            </p>
          )}
        </div>
      </section>

      <section className="bg-brand py-16 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-gold">{language === 'es' ? 'Experiencias transversales' : 'Cross-cutting experiences'}</p>
          <h2 className="mt-3 max-w-3xl font-serif text-3xl md:text-5xl">{language === 'es' ? 'Hilos que conectan todo el ecosistema' : 'Themes connecting the whole ecosystem'}</h2>
          <p className="mt-4 max-w-3xl text-white/70">{language === 'es' ? 'No son otra sección del menú. Aparecen donde ayudan a descubrir una relación relevante entre una estadía, una actividad, un grupo o el territorio.' : 'They are not another menu section. They appear wherever they reveal a relevant relationship between a stay, an activity, a group or the land.'}</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {transversalThemes[language].map(theme => (
              <div key={theme.title} className="rounded-2xl border border-white/15 bg-white/10 p-5">
                <h3 className="font-serif text-xl">{theme.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{theme.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ContextualJourneyLinks links={language === 'es' ? [
        { href: ROUTES.ESTADIA, title: 'Quedarte en Pueblo Mágico', description: 'Compará alojamientos, inclusiones y condiciones.' },
        { href: ROUTES.GRUPOS_RETIROS, title: 'Traer a tu comunidad', description: 'Propuestas para facilitadores, escuelas y empresas.' },
        { href: ROUTES.COMO_LLEGAR, title: 'Preparar tu visita', description: 'Camino, transporte, clima y preguntas frecuentes.' },
      ] : [
        { href: ROUTES.ESTADIA, title: 'Stay at Pueblo Mágico', description: 'Compare accommodation, inclusions and conditions.' },
        { href: ROUTES.GRUPOS_RETIROS, title: 'Bring your community', description: 'Offerings for facilitators, schools and companies.' },
        { href: ROUTES.COMO_LLEGAR, title: 'Prepare your visit', description: 'Road, transport, weather and frequently asked questions.' },
      ]} />
    </JourneyPage>
  );
}
