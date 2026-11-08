import React, { useRef } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { ROUTES } from '../src/routes';

export const SectionNichos: React.FC = () => {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -scrollRef.current.clientWidth * 0.85 : scrollRef.current.clientWidth * 0.85, behavior: 'smooth' });
  };

  const cards = [
    {
      tag:   (t as any).coliving.tag as string,
      title: (t as any).coliving.title as string,
      desc:  (t as any).coliving.description as string,
      image: (t as any).coliving.image as string,
      href:  (t as any).coliving.link as string,
      cta:   (t as any).coliving.btn as string,
      external: false,
    },
    {
      tag:   t.retreats.tag as string,
      title: (t.retreats as any).shortTitle as string,
      desc:  t.retreats.description as string,
      image: (t.retreats.images[0] as any).image,
      href:  ROUTES.ORGANIZA_TU_RETIRO,
      cta:   (t.retreats as any).shortCta as string,
      external: false,
    },
    {
      tag:   (t as any).schools.tag as string,
      title: (t as any).schools.title as string,
      desc:  (t as any).schools.description as string,
      image: '/uploads/Aula Verde/IMG-20251120-WA0057.jpg',
      href:  (t as any).schools.link as string,
      cta:   (t as any).schools.btn as string,
      external: false,
    },
    {
      tag:   (t.volunteer as any).tag as string,
      title: (t.volunteer as any).shortTitle as string,
      desc:  (t.volunteer.description as string).slice(0, 160) + '…',
      image: t.volunteer.image as string,
      href:  t.volunteer.link as string,
      cta:   t.volunteer.btn as string,
      external: false,
    },
  ];

  return (
    <>
      <span id="retiros" className="block -mt-20 pt-20" aria-hidden="true" />
      <span id="voluntariados" className="block" aria-hidden="true" />
      <section className="py-16 md:py-20 bg-[#F5F3EE]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">

          <div data-reveal className="text-center mb-12">
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-brand/50 mb-3">
              {(t as any).nichos.eyebrow}
            </p>
            <h2 className="text-3xl md:text-4xl font-serif text-brand">
              {(t as any).nichos.title}
            </h2>
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
              className="flex overflow-x-auto md:grid md:grid-cols-3 gap-4 md:gap-6 pb-6 md:pb-0 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
              {cards.map((card, i) => (
                <div key={i}
                  className="min-w-[90vw] md:min-w-0 snap-center bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 border border-brand/5 flex flex-col h-full group">
                  <div className="relative aspect-video md:aspect-[4/3] overflow-hidden bg-gray-100">
                    <img src={card.image} alt={card.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand/60 to-transparent" />
                    <span className="absolute top-3 left-3 bg-white/15 backdrop-blur-sm border border-white/25 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">{card.tag}</span>
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="font-serif text-xl text-brand mb-2">{card.title}</h3>
                    <p className="text-dark/60 text-sm leading-relaxed flex-grow">{card.desc}</p>
                    <a href={card.href} target={card.external ? '_blank' : undefined} rel={card.external ? 'noopener noreferrer' : undefined}
                      className="mt-5 inline-flex items-center gap-1.5 text-gold font-bold text-xs uppercase tracking-widest hover:text-brand transition-colors group/link">
                      {card.cta}<ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="md:hidden text-[10px] text-center text-brand/30 mt-2">{t.ui.swipeMore}</p>
        </div>
      </section>
    </>
  );
};
