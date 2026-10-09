import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ShowMoreButton } from '../../components/ShowMoreButton';
import { WA_MAGICO } from '../data/config';

// Momentos de la jornada visibles antes de "Ver más"
const VISIBLE_STEPS = 2;

const STEP_PHOTOS = [
  '/uploads/exterior.webp',
  '/uploads/494815924_1424799465353456_392615711940557767_n.webp',
  '/uploads/469731807_3987061274856806_2943773444767775905_n.jpg',
];

const EmpresasJornada: React.FC = () => {
  const { t } = useLanguage();
  const j = t.empresas.jornada;
  const [showAll, setShowAll] = useState(false);
  const waPrograma = `https://wa.me/${WA_MAGICO}?text=${encodeURIComponent(t.empresas.hero.wa_query_programa)}`;

  return (
    <section className="py-16 md:py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 md:mb-12">
          <h2 data-reveal className="text-3xl md:text-5xl serif-title brand-green mb-5 max-w-2xl" style={{ lineHeight: '1.1' }}>
            {j.title}
          </h2>
          <p data-reveal data-delay="1" className="text-gray-500 text-base md:text-lg leading-relaxed font-light max-w-2xl">
            {j.subtitle}
          </p>
        </div>

        <div data-reveal data-delay="1" className="grid grid-cols-3 gap-3 md:gap-4 mb-12 md:mb-16">
          {STEP_PHOTOS.map((src, i) => (
            <div key={i} className="rounded-2xl overflow-hidden h-40 md:h-64">
              <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        <div data-reveal>
        <div id="empresas-jornada-pasos" className="divide-y divide-[#E8E4D9]">
          {(showAll ? j.steps : j.steps.slice(0, VISIBLE_STEPS)).map((step: any) => (
            <div key={step.num} className="py-7 flex flex-col md:flex-row gap-3 md:gap-10 items-start">
              <span className="serif-title text-4xl font-light block leading-none md:w-16 flex-shrink-0" style={{ color: 'rgba(0,83,51,0.15)' }}>
                {step.num}
              </span>
              <div>
                <h4 className="font-bold brand-green text-sm uppercase tracking-widest mb-2">{step.title}</h4>
                <p className="text-gray-600 text-base leading-relaxed font-light max-w-2xl">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
        {j.steps.length > VISIBLE_STEPS && (
          <div className="mt-2 text-center">
            <ShowMoreButton
              open={showAll}
              onToggle={() => setShowAll(v => !v)}
              moreLabel={t.ui.showMore}
              lessLabel={t.ui.showLess}
              controls="empresas-jornada-pasos"
              hiddenCount={j.steps.length - VISIBLE_STEPS}
            />
          </div>
        )}
        </div>

        <div data-reveal className="mt-10 pt-8 border-t border-[#E8E4D9]">
          <p className="text-gray-500 text-sm leading-relaxed font-light italic max-w-3xl">
            {j.benchmark}
          </p>
        </div>

        {/* CTA intermedio: corta el tramo largo sin contacto entre el hero y el resto de la página */}
        <div data-reveal>
          <div className="mt-12 rounded-2xl bg-[#005333] px-6 py-8 md:px-10 flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-left">
            <p className="serif-title text-2xl md:text-3xl text-white" style={{ lineHeight: '1.2' }}>{j.cta_lead}</p>
            <a
              href={waPrograma}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold btn-icon-inline !inline-flex !max-w-full !whitespace-normal text-center !leading-snug flex-shrink-0"
            >
              <MessageCircle size={18} className="shrink-0" aria-hidden="true" />
              {t.empresas.hero.cta_primary}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EmpresasJornada;
