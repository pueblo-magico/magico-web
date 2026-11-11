import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { RESERVAS_PUBLIC_URL } from '../src/data/config';
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

          <div className="mx-auto max-w-xl rounded-2xl border border-white/20 bg-white/10 px-6 py-5 text-center backdrop-blur-sm" data-reveal>
            <p className="font-serif text-xl text-white">
              {language === 'es' ? 'Disponibilidad y precio final en tiempo real' : 'Live availability and final pricing'}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/65">
              {language === 'es'
                ? 'Elegí fechas, alojamiento y comidas. Reservas verifica todo antes de crear tu reserva.'
                : 'Choose dates, accommodation and meals. Reservas verifies everything before creating your booking.'}
            </p>
            <a href={RESERVAS_PUBLIC_URL} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-gold px-6 text-xs font-bold uppercase tracking-widest text-brand transition-colors hover:bg-white">
              {language === 'es' ? 'Consultar y reservar' : 'Check and book'}
            </a>
          </div>

        </div>
      </section>
    </>
  );
};
