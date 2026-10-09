import React, { useState } from 'react';
import { HelpCircle, Users2, CheckCircle2, Video, MapPin, Mountain } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ShowMoreButton } from '../../components/ShowMoreButton';
import { WA_MAGICO } from '../data/config';

const MODALIDAD_ICONS = [Video, MapPin, Mountain];

const EmpresasPreview: React.FC = () => {
  const { t } = useLanguage();
  const p = t.empresas.preview;
  // Preguntas, público e "incluye" son detalle: plegados para acortar la página
  const [showDetails, setShowDetails] = useState(false);

  const waJornada = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent(t.empresas.hero.wa_query_jornada)}`;

  return (
    <section id="preview" className="py-16 md:py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="rounded-3xl border-2 border-[#D4AF37]/40 bg-[#005333]/[0.03] p-7 md:p-14">
          <p data-reveal className="font-medium uppercase tracking-[0.2em] text-[11px] brand-green mb-4">{p.tag}</p>
          <h2 data-reveal data-delay="1" className="text-3xl md:text-5xl serif-title brand-green mb-6" style={{ lineHeight: '1.1' }}>
            {p.title}
          </h2>
          <p data-reveal data-delay="1" className="text-gray-600 text-base md:text-lg leading-relaxed mb-8 font-light max-w-2xl">
            {p.intro}
          </p>

          {p.modalidades && (
            <div data-reveal data-delay="1" className="mb-10">
              <p className="font-bold brand-green text-sm uppercase tracking-widest mb-4">{p.modalidades_title}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {p.modalidades.map((m: any, i: number) => {
                  const Icon = MODALIDAD_ICONS[i];
                  return (
                    <div key={i} className="bg-white rounded-2xl border border-[#E8E4D9] p-5">
                      <div className="w-9 h-9 rounded-lg bg-[#005333]/8 flex items-center justify-center mb-3">
                        <Icon className="w-4 h-4 text-[#005333]" aria-hidden="true" />
                      </div>
                      <h4 className="font-bold brand-green text-sm mb-2">{m.title}</h4>
                      <p className="text-gray-500 text-sm font-light leading-relaxed">{m.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div data-reveal data-delay="1" className="grid grid-cols-3 gap-3 md:gap-4 mb-10">
            {['/uploads/img_6948.webp', '/uploads/domos_2.jpg', '/uploads/469280911_444096748740233_2818770490495002077_n.webp'].map((src, i) => (
              <div key={i} className="rounded-xl overflow-hidden h-28 md:h-40">
                <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          <div data-reveal>
            <div className="text-center">
              <ShowMoreButton
                open={showDetails}
                onToggle={() => setShowDetails(v => !v)}
                moreLabel={t.ui.showMore}
                lessLabel={t.ui.showLess}
                controls="empresas-preview-detalle"
              />
            </div>
          </div>

          {showDetails && (
          <div id="empresas-preview-detalle" className="mt-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14">
            {/* Preguntas */}
            <div>
              <div className="flex items-start gap-2 mb-5">
                <HelpCircle className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="font-bold brand-green text-sm uppercase tracking-widest">
                  {p.questions_label}
                </p>
              </div>
              <ul className="space-y-3">
                {p.questions.map((q: string, i: number) => (
                  <li key={i} className="text-gray-600 text-sm leading-relaxed font-light border-b border-[#E8E4D9] pb-3">
                    {q}
                  </li>
                ))}
              </ul>
            </div>

            {/* A quién está dirigida */}
            <div>
              <div className="flex items-start gap-2 mb-5">
                <Users2 className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="font-bold brand-green text-sm uppercase tracking-widest leading-relaxed">{p.audience_title}</p>
              </div>
              <ul className="space-y-3 mb-6">
                {p.audience_items.map((a: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] flex-shrink-0 mt-[7px]" />
                    <span className="text-gray-600 text-sm font-light leading-relaxed">{a}</span>
                  </li>
                ))}
              </ul>
              <p className="text-gray-500 text-sm font-light italic">{p.group_note}</p>
            </div>
          </div>

          {/* Qué incluye */}
          <div className="mt-12 pt-10 border-t border-[#005333]/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {p.includes.map((item: string, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#005333] flex-shrink-0" aria-hidden="true" />
                <span className="text-gray-700 text-sm font-light">{item}</span>
              </div>
            ))}
          </div>
          </div>
          )}

          <div data-reveal>
          <div className="mt-12 pt-10 border-t border-[#005333]/10">
            <p className="serif-title text-xl brand-green mb-2">{p.closing}</p>

            <a
              href={waJornada}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold inline-block text-center mt-6"
              style={{ whiteSpace: 'normal' }}
            >
              {p.cta}
            </a>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EmpresasPreview;
