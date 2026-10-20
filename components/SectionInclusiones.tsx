import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePublicPricingSummary } from './booking/usePublicPricingSummary';
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
  const { data: pricing, loaded } = usePublicPricingSummary();
  const formatMoney = (centavos: number) => new Intl.NumberFormat(language === 'es' ? 'es-AR' : 'en-US', {
    style: 'currency', currency: pricing?.plan.moneda || 'ARS', maximumFractionDigits: 0,
  }).format(centavos / 100);
  const startingRate = (tipo: 'camping' | 'domo') => {
    const rules = pricing?.opciones.find(option => option.tipo_alojamiento === tipo)?.tarifas || [];
    const personRules = rules.filter(rule => rule.base_calculo === 'persona_noche');
    const candidates = personRules.length > 0 ? personRules : rules;
    if (candidates.length === 0) return null;
    return candidates.reduce((lowest, rule) => rule.importe_centavos < lowest.importe_centavos ? rule : lowest);
  };
  const rates = [
    { tipo: 'camping' as const, label: language === 'es' ? 'Camping' : 'Camping' },
    { tipo: 'domo' as const, label: language === 'es' ? 'Domo geodésico' : 'Geodesic dome' },
  ].map(item => ({ ...item, rule: startingRate(item.tipo) })).filter(item => item.rule !== null);

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

          {loaded && rates.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-center gap-4" data-reveal>
              {rates.map(({ tipo, label, rule }) => rule && (
                <div key={tipo} className={`${tipo === 'domo' ? 'bg-gold/20 border-gold/40' : 'bg-white/10 border-white/20'} border rounded-xl px-6 py-4 text-center backdrop-blur-sm`}>
                  <p className={`${tipo === 'domo' ? 'text-gold' : 'text-white/70'} font-bold tracking-widest uppercase text-xs mb-1`}>{label}</p>
                  <p className="text-white text-2xl font-serif">
                    {formatMoney(rule.importe_centavos)} <span className="text-base font-sans font-light">/ {rule.base_calculo === 'persona_noche' ? (language === 'es' ? 'persona / noche' : 'person / night') : (language === 'es' ? 'unidad / noche' : 'unit / night')}</span>
                  </p>
                  <p className="text-white/50 text-xs mt-1">{language === 'es' ? 'Alojamiento + desayuno · tarifa publicada' : 'Accommodation + breakfast · published rate'}</p>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>
    </>
  );
};
