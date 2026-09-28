import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Calendar, ArrowRight, Tag } from 'lucide-react';
import { HorizontalCardRail } from './HorizontalCardRail';

export const SectionEventos: React.FC = () => {
  const { t } = useLanguage();
  const mainEvents = t.events.cards.filter((card: any) => card.showInMainEvents !== false);

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
          {mainEvents.map((card: any, index: number) => (
            <div
              key={index}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-brand/5 flex flex-col h-full group"
            >
              {/* Imagen con Overlay de Fecha */}
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                <img 
                  src={card.image || "https://images.pexels.com/photos/3077882/pexels-photo-3077882.jpeg"} 
                  alt={card.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-xl shadow-lg flex items-start gap-2 z-10 max-w-[calc(100%-2rem)]">
                  <Calendar className="w-3 h-3 text-gold mt-0.5 flex-shrink-0" />
                  <span className="text-[9px] md:text-[10px] font-bold tracking-wider text-brand uppercase whitespace-pre-line leading-tight">
                    {card.date}
                  </span>
                </div>
                {card.price && (
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-xl shadow-lg flex items-center gap-1.5 z-10">
                    <Tag className="w-3 h-3 text-gold flex-shrink-0" />
                    <span className="text-[9px] md:text-[10px] font-bold tracking-wider text-brand uppercase whitespace-nowrap">
                      {card.price}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="p-6 md:p-8 flex flex-col flex-grow">
                <h3 className="text-xl md:text-2xl font-serif text-brand mb-3 leading-tight group-hover:text-gold transition-colors">
                  {card.title}
                </h3>
                
                <p className="text-dark/70 text-sm leading-relaxed mb-6 line-clamp-4 flex-grow whitespace-pre-line">
                  {card.desc}
                </p>
                
                <div className="flex flex-wrap items-center justify-start pt-4 border-t border-brand/5 mt-auto gap-3">
                <a 
                  href={card.link}
                  target="_blank"
                  rel="noopener noreferrer"
                    className="px-4 py-2 bg-brand text-white text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-full hover:bg-gold transition-colors shadow-sm whitespace-nowrap flex-grow text-center sm:flex-grow-0"
                >
                  {card.btn}
                </a>
                {card.pdfLink && (
                  <a 
                    href={card.pdfLink}
                    target="_blank"
                    rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 text-brand/60 hover:text-brand font-bold text-[10px] md:text-xs uppercase tracking-widest transition-colors group/pdf whitespace-nowrap flex-grow sm:flex-grow-0"
                  >
                      <span className="border-b border-transparent group-hover/pdf:border-brand transition-[border-color]">
                    {(t.events as any).btnPdf || "+ Info"}
                      </span>
                      <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                  </a>
                )}
                </div>
              </div>
            </div>
          ))}
        </HorizontalCardRail>
      </div>
    </section>
  );
};
