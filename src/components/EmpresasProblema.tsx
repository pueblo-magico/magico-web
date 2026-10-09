import React from 'react';
import { Sprout, Users, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const DIMENSION_ICONS = [Sprout, Users, HeartHandshake];
const DIMENSION_PHOTOS = [
  '/uploads/Aula Verde/IMG-20251120-WA0063.jpg',
  '/uploads/voluntarios.webp',
  '/uploads/bienestar-balance.webp',
];

const EmpresasProblema: React.FC = () => {
  const { t } = useLanguage();
  const p = t.empresas.problema;
  const d = t.empresas.dimensiones;

  return (
    <>
      {/* ====== DE LOS COMPROMISOS A LA ACCIÓN ====== */}
      <section className="py-16 md:py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="font-medium uppercase tracking-[0.2em] text-[11px] brand-green mb-4" data-reveal>{p.tag}</p>
          <h2 data-reveal data-delay="1" className="text-3xl md:text-5xl serif-title brand-green mb-6 max-w-2xl" style={{ lineHeight: '1.1' }}>
            {p.title}
          </h2>
          <p data-reveal data-delay="2" className="text-gray-600 text-base md:text-lg leading-relaxed max-w-2xl mb-10 font-light">
            {p.intro}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-8 md:gap-10 items-stretch">
            <div className="flex flex-col">
              <div data-reveal data-delay="2" className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {p.items.map((item: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 bg-[#005333]/[0.04] rounded-xl px-4 py-3">
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37] flex-shrink-0" aria-hidden="true" />
                    <span className="text-gray-700 text-sm font-light">{item}</span>
                  </div>
                ))}
              </div>

              <div data-reveal data-delay="3" className="border-l-2 border-[#D4AF37] pl-6 mt-auto">
                <p className="text-gray-700 text-base md:text-lg leading-relaxed mb-3">{p.closing1}</p>
                <p className="text-gray-500 text-base leading-relaxed font-light">{p.closing2}</p>
              </div>

              {/* Argumento para RRHH, con fuente citada */}
              {p.hr_note && (
                <p className="text-gray-500 text-sm leading-relaxed font-light mt-6">
                  {p.hr_note.text}{' '}
                  <a href={p.hr_note.url} target="_blank" rel="noopener noreferrer" className="italic underline decoration-[#D4AF37]/50 underline-offset-2 hover:text-[#005333]">
                    {p.hr_note.source}
                  </a>
                </p>
              )}
            </div>

            <div data-reveal data-delay="3" className="rounded-2xl overflow-hidden min-h-[280px] md:min-h-full">
              <img src="/uploads/exterior.webp" alt="" loading="lazy" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ====== TRES DIMENSIONES ====== */}
      <section className="py-16 md:py-24 px-6 bg-[#FAF9F5]">
        <div className="max-w-5xl mx-auto">
          <h2 data-reveal className="text-3xl md:text-5xl serif-title brand-green mb-12 md:mb-16 max-w-2xl" style={{ lineHeight: '1.1' }}>
            {d.title}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {d.items.map((item: any, i: number) => {
              const Icon = DIMENSION_ICONS[i];
              return (
                <div key={i} data-reveal data-delay={String(i + 1)} className="bg-white rounded-2xl border border-[#E8E4D9] overflow-hidden flex flex-col">
                  <div className="h-36 overflow-hidden">
                    <img src={DIMENSION_PHOTOS[i]} alt="" loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-6 md:p-7 flex flex-col flex-grow">
                    <div className="w-11 h-11 rounded-xl bg-[#005333]/8 flex items-center justify-center mb-5">
                      <Icon className="w-5 h-5 text-[#005333]" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl serif-title brand-green mb-5 leading-snug">{item.title}</h3>
                    <ul className="space-y-3">
                      {item.items.map((line: string, j: number) => (
                        <li key={j} className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] flex-shrink-0 mt-[7px]" />
                          <span className="text-gray-500 font-light text-sm leading-relaxed">{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          <p data-reveal data-delay="4" className="text-gray-500 text-sm leading-relaxed font-light italic mt-10 max-w-xl">
            {d.note}
          </p>
        </div>
      </section>
    </>
  );
};

export default EmpresasProblema;
