import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const EmpresasImpacto: React.FC = () => {
  const { t } = useLanguage();
  const im = t.empresas.impacto;

  return (
    <section className="py-16 md:py-28 px-6 bg-[#005333] text-white overflow-hidden relative">
      <div
        className="absolute inset-0 opacity-25"
        style={{ backgroundImage: "url('/uploads/voluntarios.webp')", backgroundSize: 'cover', backgroundPosition: 'center' }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,83,51,0.55) 0%, rgba(0,83,51,0.92) 55%, rgba(0,83,51,1) 100%)' }}
      />
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/[0.03] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-[#D4AF37]/[0.06] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div data-reveal className="mb-10">
          <p className="font-medium uppercase tracking-[0.2em] text-[11px] text-[#D4AF37] mb-4">{im.tag}</p>
          <h2 className="text-3xl md:text-5xl serif-title text-white mb-5" style={{ lineHeight: '1.1' }}>{im.title}</h2>
          <p className="text-white/60 text-base md:text-lg leading-relaxed max-w-2xl font-light">{im.text}</p>
        </div>

        <div data-reveal data-delay="1" className="grid grid-cols-3 gap-4 mb-12">
          {im.stats.map((s: any, i: number) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 md:p-7 text-center">
              <div className="serif-title text-2xl md:text-4xl text-[#D4AF37] leading-none mb-2">{s.value}</div>
              <div className="text-white/60 text-[11px] md:text-xs uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>

        <div data-reveal data-delay="1">
          <div className="mb-12">
            <p className="font-medium uppercase tracking-[0.2em] text-[11px] text-[#D4AF37] mb-5">{im.practices_title}</p>
            <div className="grid sm:grid-cols-3 gap-4">
              {im.practices.map((p: any, i: number) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <div className="text-white font-semibold mb-1">{p.title}</div>
                  <p className="text-white/60 text-sm leading-relaxed">{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div data-reveal data-delay="2" className="rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/[0.07] p-8 md:p-10">
          <p className="text-white/80 text-base leading-relaxed mb-4">{im.partners_intro}</p>
          <div className="flex flex-wrap gap-3 mb-5">
            {im.partners.map((name: string, i: number) => (
              <span key={i} className="px-4 py-2 rounded-full border border-white/20 text-sm font-medium text-white/90">
                {name}
              </span>
            ))}
          </div>
          <p className="text-white/50 text-sm leading-relaxed italic border-t border-white/10 pt-5">{im.partners_note}</p>
        </div>
      </div>
    </section>
  );
};

export default EmpresasImpacto;
