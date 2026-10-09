import React, { useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { BookOpenText, CheckCircle } from '@phosphor-icons/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { marked } from 'marked';

export const SectionExperiencias: React.FC = () => {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -scrollRef.current.clientWidth * 0.85 : scrollRef.current.clientWidth * 0.85, behavior: 'smooth' });
  };

  return (
    <section id="experiencias" className="py-14 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-8">
          <p className="text-brand font-bold tracking-widest uppercase text-xs mb-3">
            {t.experiences.tag}
          </p>
          <h2
            data-reveal
            className="text-3xl md:text-4xl text-brand mb-4 font-serif"
            dangerouslySetInnerHTML={{ __html: marked.parse(t.experiences.title as string) as string }}
          />
          <p className="text-dark/65 text-base max-w-2xl mx-auto leading-relaxed"
            dangerouslySetInnerHTML={{ __html: (t.experiences as any).intro_p1 }} />
        </div>

        {/* Reset Vital */}
        <div className="mb-10 bg-bone rounded-2xl p-6 md:p-8 shadow-sm border-l-4 border-[#005333]/20 relative overflow-hidden" data-reveal>
          <BookOpenText className="absolute -right-10 -bottom-10 w-64 h-64 text-brand/5 rotate-12" weight="duotone" />
          <div className="w-full">
            <span className="text-gold font-bold tracking-widest uppercase text-xs mb-2 block opacity-90">
              {t.experiences.resetVital.subtitle}
            </span>
            <h3 className="text-3xl font-serif text-brand mb-6">
              {t.experiences.resetVital.title}
            </h3>
            <div
              className="text-dark/80 mb-10 font-light leading-relaxed text-lg max-w-4xl [&_strong]:text-[#8B6914] [&_strong]:font-medium"
              dangerouslySetInnerHTML={{ __html: marked.parse(t.experiences.resetVital.description as string) as string }}
            />
            <ul className="space-y-6">
              {t.experiences.resetVital.items.map((item: any, idx: number) => (
                <li key={idx} className="flex flex-col gap-1">
                  <strong className="text-brand text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-gold flex-shrink-0" weight="duotone" />
                    {item.title}
                  </strong>
                  <span className="text-sm text-dark/70 pl-6 border-l border-brand/10">{item.desc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Cards */}
        <div className="text-center mb-6">
          <span className="text-brand/80 font-bold tracking-widest uppercase text-xs">
            {(t.experiences as any).personalizeStay}
          </span>
        </div>

        <div className="relative">
          <button onClick={() => scroll('left')}
            className="md:hidden absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 p-2 rounded-full shadow-lg text-brand border border-brand/10 -ml-2"
            aria-label={t.ui.prev}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => scroll('right')}
            className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 p-2 rounded-full shadow-lg text-brand border border-brand/10 -mr-2"
            aria-label={t.ui.next}>
            <ChevronRight className="w-5 h-5" />
          </button>

          <div ref={scrollRef}
            className="flex overflow-x-auto md:grid md:grid-cols-3 gap-4 md:gap-8 pb-6 md:pb-0 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
            {t.experiences.cards.map((card: any) => {
              const isEcoRefugio = card.ctaLink === '/estadia';
              return (
                <div key={card.id}
                  className="min-w-[90vw] md:min-w-0 snap-center bg-bone rounded-2xl overflow-hidden shadow-lg group hover:-translate-y-1 transition-transform duration-300 border-t-4 border-gold relative flex flex-col h-full">
                  {isEcoRefugio && (
                    <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
                      <div className="bg-brand text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md pointer-events-auto">{(t.experiences as any).badge_accommodation}</div>
                      <div className="bg-gold text-brand text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md pointer-events-auto">{(t.experiences as any).coworkingBadge}</div>
                    </div>
                  )}
                  <div className="relative aspect-video md:aspect-[4/3] overflow-hidden bg-gray-100">
                    <img src={card.image} alt={card.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-xl font-serif text-brand mb-2">{card.title}</h3>
                    <p className="text-dark/70 mb-4 text-sm leading-relaxed flex-grow">{card.description}{isEcoRefugio && ` ${(t.experiences as any).card_extra_text}`}</p>
                    {card.ctaLink?.startsWith('/') ? (
                      <a href={card.ctaLink} className="text-[#8B6914] font-bold uppercase text-xs tracking-wider hover:text-brand transition-colors">{card.ctaText} →</a>
                    ) : (
                      <a href={card.ctaLink} target="_blank" rel="noopener noreferrer" className="text-[#8B6914] font-bold uppercase text-xs tracking-wider hover:text-brand transition-colors">{card.ctaText} →</a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <p className="md:hidden text-[10px] text-center text-dark/30 mt-2">{t.ui.swipeMore}</p>
      </div>
    </section>
  );
};
