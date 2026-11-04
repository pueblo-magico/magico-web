import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { HorizontalCardRail } from './HorizontalCardRail';
import { shouldShowMainCalendarEvent } from '../src/utils/eventCalendar';

export const SectionEventos: React.FC = () => {
  const { t } = useLanguage();
  const mainEvents = t.events.cards.filter((card: any) => shouldShowMainCalendarEvent(card));

  return (
    <section id="eventos" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <p className="text-brand font-bold tracking-widest uppercase text-xs mb-4">
            {t.events.tag}
          </p>
          <h2 data-reveal className="text-3xl md:text-5xl text-brand font-serif mb-6">
            {t.events.title}
          </h2>
        </div>
        <HorizontalCardRail previousLabel={t.ui.prev} nextLabel={t.ui.next} desktopGridClassName="md:grid-cols-3">
          {mainEvents.map((card: any) => (
            <article
              key={`${card.link}-${card.title}`}
              className="group flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-brand/10 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                <img 
                  src={card.image || "https://images.pexels.com/photos/3077882/pexels-photo-3077882.jpeg"} 
                  alt={card.title} 
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  style={{ objectPosition: card.imagePosition || 'center' }}
                  loading="lazy"
                />
                <div className="absolute left-5 top-5 z-10 max-w-[calc(100%-2.5rem)] rounded-full bg-white/95 px-4 py-2 shadow-md backdrop-blur-sm">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-brand">
                    {card.statusLabel || card.date}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-grow flex-col p-6 md:p-8">
                {card.labels?.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {card.labels.map((label: string) => (
                      <span key={label} className="rounded-full bg-brand/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-brand/65">
                        {label}
                      </span>
                    ))}
                  </div>
                )}

                <h3 className="font-serif text-2xl leading-tight text-brand transition-colors group-hover:text-gold md:text-[28px]">
                  {card.title}
                </h3>

                {card.date && (
                  <p className="mt-3 flex items-start gap-2 text-xs font-bold uppercase tracking-[0.08em] text-gold">
                    <CalendarDays className="mt-px h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    <span className="whitespace-pre-line">{card.date}</span>
                  </p>
                )}
                
                <p className="mt-5 line-clamp-5 flex-grow whitespace-pre-line text-sm leading-7 text-dark/65">
                  {card.desc}
                </p>
                
                <a
                  href={card.link}
                  {...(/^https?:/.test(card.link) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="mt-7 inline-flex items-center gap-3 self-start text-xs font-bold uppercase tracking-[0.18em] text-gold transition-colors hover:text-brand"
                >
                  {card.btn}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
                {card.pdfLink && (
                  <a 
                    href={card.pdfLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 self-start text-[10px] font-bold uppercase tracking-widest text-brand/60 transition-colors hover:text-brand md:text-xs"
                  >
                    <span>
                    {(t.events as any).btnPdf || "+ Info"}
                    </span>
                    <ArrowRight className="h-3 w-3 md:h-4 md:w-4" aria-hidden="true" />
                  </a>
                )}
              </div>
            </article>
          ))}
        </HorizontalCardRail>
      </div>
    </section>
  );
};
