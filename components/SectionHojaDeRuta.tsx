import React, { useState } from 'react';
import { MapPinned, Satellite, GraduationCap, Mountain, TreePine, ClipboardCheck, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { ShowMoreButton } from './ShowMoreButton';

const ICONS = [MapPinned, Satellite, GraduationCap, Mountain, TreePine, ClipboardCheck];

// "En qué estamos trabajando": iniciativas en curso para que el impacto sea verificable por terceros.
// Solo listar acá lo que realmente está en marcha; cuando algo se concrete, moverlo a la sección de logros.
// `visibleCount`: si se pasa, muestra solo esa cantidad de iniciativas y el resto detrás de "Ver más" (usado en /empresas).
export const SectionHojaDeRuta: React.FC<{ visibleCount?: number }> = ({ visibleCount }) => {
  const { t } = useLanguage();
  const r = t.roadmap;
  const [showAll, setShowAll] = useState(false);
  const collapsible = visibleCount !== undefined && r.items.length > visibleCount;
  const items = collapsible && !showAll ? r.items.slice(0, visibleCount) : r.items;

  return (
    <section id="hoja-de-ruta" className="py-16 md:py-24 px-6 bg-white scroll-mt-24">
      <div className="max-w-5xl mx-auto">
        <div data-reveal>
          <div className="mb-10 md:mb-12 max-w-3xl">
            <p className="font-medium uppercase tracking-[0.2em] text-[11px] text-[#D4AF37] mb-4">{r.tag}</p>
            <h2 className="text-3xl md:text-5xl serif-title brand-green mb-5" style={{ lineHeight: '1.1' }}>{r.title}</h2>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed font-light">{r.intro}</p>
          </div>
        </div>

        <div id="hoja-de-ruta-items" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item: { status: string; title: string; text: string }, i: number) => {
            const Icon = ICONS[i] || Clock;
            // Los ítems que aparecen al expandir no llevan data-reveal (quedarían invisibles)
            const reveal = !collapsible || i < (visibleCount as number) ? { 'data-reveal': true, 'data-delay': String((i % 3) + 1) } : {};
            return (
              <div key={item.title} {...reveal}>
                <article className="h-full rounded-2xl border border-[#E8E4D9] bg-[#FAF9F5] p-6 md:p-7">
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <Icon size={26} strokeWidth={1.5} className="text-[#005333]" aria-hidden="true" />
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#9a7b1c]">
                      <Clock size={12} aria-hidden="true" />
                      {item.status}
                    </span>
                  </div>
                  <h3 className="font-bold brand-green text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed font-light">{item.text}</p>
                </article>
              </div>
            );
          })}
        </div>

        {collapsible && (
          <div className="mt-6 text-center">
            <ShowMoreButton
              open={showAll}
              onToggle={() => setShowAll(v => !v)}
              moreLabel={t.ui.showMore}
              lessLabel={t.ui.showLess}
              controls="hoja-de-ruta-items"
              hiddenCount={r.items.length - (visibleCount as number)}
            />
          </div>
        )}

        <div data-reveal>
          <p className="mt-8 text-center text-gray-500 text-sm italic">{r.closing}</p>
        </div>
      </div>
    </section>
  );
};
