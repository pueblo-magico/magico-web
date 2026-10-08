import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { formatPrice, getEstadiaPrices } from '../src/data/retreats';
import {
  House,
  WifiHigh,
  Campfire,
  SolarPanel,
  BookOpen,
  Towel,
  Drop,
} from '@phosphor-icons/react';

const ICONS = [
  <House weight="duotone" className="w-8 h-8" />,
  <Towel weight="duotone" className="w-8 h-8" />,
  <WifiHigh weight="duotone" className="w-8 h-8" />,
  <Campfire weight="duotone" className="w-8 h-8" />,
  <SolarPanel weight="duotone" className="w-8 h-8" />,
  <BookOpen weight="duotone" className="w-8 h-8" />,
  <Drop weight="duotone" className="w-8 h-8" />,
];

export const SectionInclusiones: React.FC = () => {
  const { t, language } = useLanguage();
  const i = t.inclusiones;
  const prices = getEstadiaPrices(language);
  const carpaDesde = prices.carpaDesde;
  const domoPrivadoDesde = prices.domoPrivado;
  const hasCarpaPrice = typeof carpaDesde === 'number' && Number.isFinite(carpaDesde);
  const hasDomoPrice = typeof domoPrivadoDesde === 'number' && Number.isFinite(domoPrivadoDesde);

  return (
    <>
      <span id="inclusiones" className="block -mt-20 pt-20" aria-hidden="true"></span>
      <section className="py-12 bg-brand text-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">

          <div className="text-center mb-7" data-reveal>
            <p className="text-gold font-bold tracking-widest uppercase text-xs mb-2 opacity-90">
              {i.eyebrow}
            </p>
            <h2 className="text-2xl md:text-3xl font-serif text-white leading-tight">
              {i.title}
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8" data-reveal>
            {i.items.map((item: { label: string; sub: string }, idx: number) => (
              <div
                key={idx}
                className="flex flex-col items-center text-center bg-white/10 rounded-xl px-4 py-4 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-colors duration-300"
              >
                <span className="text-gold mb-2 [&_svg]:w-6 [&_svg]:h-6">{ICONS[idx]}</span>
                <span className="font-semibold text-white text-sm mb-1">{item.label}</span>
                <span className="text-white/60 text-xs">{item.sub}</span>
              </div>
            ))}
          </div>

          {(hasCarpaPrice || hasDomoPrice) && (
            <div className="flex flex-col sm:flex-row justify-center gap-4" data-reveal>
              {hasCarpaPrice && (
                <div className="bg-white/10 border border-white/20 rounded-xl px-6 py-4 text-center backdrop-blur-sm">
                  <p className="text-white/70 font-bold tracking-widest uppercase text-xs mb-1">{i.price_solo_label}</p>
                  <p className="text-white text-2xl font-serif">
                    {formatPrice(carpaDesde, language)} <span className="text-base font-sans font-light">{i.price_unit}</span>
                  </p>
                  <p className="text-white/50 text-xs mt-1">{i.price_solo_sub}</p>
                </div>
              )}
              {hasDomoPrice && (
                <div className="bg-gold/20 border border-gold/40 rounded-xl px-6 py-4 text-center backdrop-blur-sm">
                  <p className="text-gold font-bold tracking-widest uppercase text-xs mb-1">{i.price_pension_label}</p>
                  <p className="text-white text-2xl font-serif">
                    {formatPrice(domoPrivadoDesde, language)} <span className="text-base font-sans font-light">{i.price_pension_unit}</span>
                  </p>
                  <p className="text-white/50 text-xs mt-1">{i.price_pension_sub}</p>
                </div>
              )}
            </div>
          )}

        </div>
      </section>
    </>
  );
};
