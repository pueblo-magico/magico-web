import React from 'react';
import { Check } from 'lucide-react';
import { RESERVATION_START_PATH, WA_MAGICO } from '../data/config';
import { useLanguage } from '../../contexts/LanguageContext';

const AulaVerdePrecios: React.FC = () => {
  const { t } = useLanguage();

  const getWaLink = (plan: string) => "https://wa.me/" + WA_MAGICO + "?text=" +
    encodeURIComponent(t.aula_verde.magico.wa_query + " Plan: " + plan);

  const waLinkGeneral = "https://wa.me/" + WA_MAGICO + "?text=" +
    encodeURIComponent(t.aula_verde.magico.wa_query);

  return (
    <section id="precios" className="py-16 md:py-24 px-6 bg-brand-green text-white rounded-3xl relative overflow-hidden">
      <div className="absolute inset-0 border border-white/20 rounded-3xl backdrop-blur-sm pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10 text-center" data-reveal>
        <h2 className="text-3xl md:text-5xl serif-title mb-4 md:mb-6 tracking-[0.15em] uppercase text-white/90">
          {t.aula_verde.precios.title}
        </h2>
        <p className="text-white/80 text-sm md:text-base mb-8 md:mb-10 max-w-2xl mx-auto">
          {t.aula_verde.precios.subtitle}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">

          {t.aula_verde.precios.cards.map((card: any, index: number) => {
            const isFeatured = !!card.badge;
            const isCustom = index === 2;
            const startsReservation = /reserv|book/i.test(card.btn);

            return (
              <div key={index} className={`w-full h-full ${isFeatured ? 'z-10 md:-translate-y-4' : 'md:py-6 lg:py-10'}`} data-reveal data-delay={String(index + 1)}>
                <div 
                  className={`flex flex-col rounded-2xl p-6 lg:p-8 h-full shadow-2xl relative ${
                    isFeatured 
                    ? 'bg-white' 
                    : isCustom 
                      ? 'backdrop-blur-sm' 
                      : 'bg-transparent border border-green-700/50'
                  }`}
                  style={{ 
                    border: isFeatured ? '4px solid #D4AF37' : isCustom ? '1px solid rgba(212, 175, 55, 0.4)' : undefined,
                    backgroundColor: isCustom ? 'rgba(0, 0, 0, 0.20)' : undefined
                  }}
                >
                  {card.badge && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-6 py-1.5 rounded-full text-xs font-extrabold tracking-wider uppercase whitespace-nowrap shadow-md z-20" style={{ backgroundColor: '#D4AF37', color: '#005333' }}>
                      {card.badge}
                    </div>
                  )}
                  
                  <div className="text-center mb-8 mt-6">
                    <h3 className={`text-xl font-bold mb-2 ${isFeatured ? 'text-[#005333]' : 'text-white'}`}>{card.title}</h3>
                    <div className="text-3xl font-extrabold text-[#D4AF37] mb-1">{card.price}</div>
                    {card.unit && <div className={`text-sm ${isFeatured ? 'text-[#005333]' : 'text-green-100'}`}>{card.unit}</div>}
                    {card.tag && <div className="text-xs text-[#D4AF37] uppercase tracking-widest font-bold mt-2">{card.tag}</div>}
                  </div>

                  <ul className={`space-y-4 text-sm md:text-base text-left flex-grow mb-8 ${isFeatured ? 'text-[#005333]' : 'text-white'}`}>
                    {card.features.map((feature: string, fIndex: number) => (
                      <li key={fIndex} className="flex items-start gap-3">
                        <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#D4AF37' }} />
                        <span className={fIndex === 0 && isFeatured ? 'font-bold' : ''}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto text-center">
                    <a
                      href={startsReservation ? RESERVATION_START_PATH : getWaLink(card.title)}
                      {...(!startsReservation ? { target: '_blank', rel: 'noreferrer' } : {})}
                      className="inline-block w-full"
                    >
                      <button 
                        className={`w-full font-bold px-6 py-3 rounded-full text-sm uppercase transition-all duration-200 shadow-lg ${
                          isFeatured 
                          ? 'bg-[#005333] text-white border-2 border-[#D4AF37] hover:opacity-90' 
                          : isCustom 
                            ? 'bg-[#D4AF37] text-[#005333] hover:opacity-90' 
                            : 'bg-transparent text-[#D4AF37] border border-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#005333]'
                        }`}
                      >
                        {card.btn}
                      </button>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}

        </div>

        {/* TEXTO LEGAL Y BOTÓN FINAL */}
        <div className="mt-12 text-center flex flex-col items-center" data-reveal data-delay="4">
          <p className="text-sm italic text-green-100 mb-6 font-medium">
            {t.aula_verde.precios.note}
          </p>
          <a href={waLinkGeneral} target="_blank" rel="noreferrer">
            <button className="bg-[#D4AF37] text-green-900 font-extrabold px-8 py-4 rounded-full text-sm md:text-base uppercase shadow-xl hover:opacity-90 transition-opacity duration-200">
              {t.aula_verde.precios.global_btn}
            </button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default AulaVerdePrecios;
