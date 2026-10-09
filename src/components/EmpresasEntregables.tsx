import React from 'react';
import { Check, FileCheck2, Clock, Sprout, ArrowDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

// Qué incluye cada jornada, qué recibe la organización y alineación con ODS.
// Lo marcado como `soon` todavía no se ofrece: se muestra explícitamente como "En desarrollo".
const EmpresasEntregables: React.FC = () => {
  const { t } = useLanguage();
  const e = t.empresas.entregables;

  return (
    <section className="py-16 md:py-24 px-6 bg-[#FAF9F5]">
      <div className="max-w-5xl mx-auto">
        <div data-reveal>
          <div className="mb-10 md:mb-12">
            <p className="font-medium uppercase tracking-[0.2em] text-[11px] text-[#D4AF37] mb-4">{e.tag}</p>
            <h2 className="text-3xl md:text-5xl serif-title brand-green max-w-3xl" style={{ lineHeight: '1.1' }}>{e.title}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div data-reveal data-delay="1">
            <div className="h-full bg-white rounded-2xl border border-[#E8E4D9] p-7 md:p-8">
              <h3 className="font-bold brand-green text-sm uppercase tracking-widest mb-5">{e.included_title}</h3>
              <ul className="space-y-3">
                {e.included.map((item: string) => (
                  <li key={item} className="flex gap-3 items-start text-gray-600 text-sm md:text-base leading-relaxed font-light">
                    <Check size={18} className="text-[#D4AF37] flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div data-reveal data-delay="2">
            <div className="h-full bg-[#005333] rounded-2xl p-7 md:p-8 text-white">
              <h3 className="font-bold text-[#D4AF37] text-sm uppercase tracking-widest mb-5">{e.receive_title}</h3>
              <ul className="space-y-3 mb-6">
                {e.receive.map((item: string) => (
                  <li key={item} className="flex gap-3 items-start text-white/85 text-sm md:text-base leading-relaxed font-light">
                    <FileCheck2 size={18} className="text-[#D4AF37] flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-white/15 pt-5">
                <span className="inline-block rounded-full border border-[#D4AF37]/50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mb-3">
                  {e.soon_label}
                </span>
                {/* El detalle de lo que está en desarrollo vive en la Hoja de ruta (más abajo): acá solo un resumen con link, para no repetirlo */}
                <p className="flex gap-3 items-start text-white/60 text-sm leading-relaxed font-light mb-3">
                  <Clock size={16} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{e.roadmap_text}</span>
                </p>
                <a href="#hoja-de-ruta" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#D4AF37] hover:text-white transition-colors">
                  {e.roadmap_cta} <ArrowDown size={15} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {e.care && (
          <div data-reveal data-delay="3">
            <div className="mt-5 rounded-2xl border border-[#E8E4D9] bg-white p-6 md:p-7 flex gap-4 items-start">
              <Sprout size={22} className="text-[#005333] flex-shrink-0 mt-0.5" strokeWidth={1.6} aria-hidden="true" />
              <div>
                <h3 className="font-bold brand-green text-base mb-1.5">{e.care.title}</h3>
                <p className="text-gray-500 text-sm md:text-base leading-relaxed font-light">{e.care.text}</p>
              </div>
            </div>
          </div>
        )}

        <div data-reveal data-delay="3">
          <div className="mt-8 flex flex-col gap-3">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{e.ods_title}</p>
            <div className="flex flex-wrap gap-2">
              {e.ods.map((o: any) => (
                <span key={o.n} className="inline-flex items-center gap-2 rounded-full border border-[#005333]/15 bg-white px-3 py-1.5 text-xs text-[#005333]">
                  <span className="font-bold">ODS {o.n}</span>
                  <span className="text-gray-500">{o.label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EmpresasEntregables;
