import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

// Preguntas frecuentes de empresas: <details> nativo → cerrado por defecto, ocupa poco y es accesible sin JS extra
const EmpresasFAQ: React.FC = () => {
  const { t } = useLanguage();
  const faq = t.empresas.faq;

  return (
    <section className="py-16 md:py-24 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 data-reveal className="text-3xl md:text-5xl serif-title brand-green mb-10 md:mb-12" style={{ lineHeight: '1.1' }}>
          {faq.title}
        </h2>

        <div data-reveal data-delay="1">
          <div className="divide-y divide-[#E8E4D9] border-y border-[#E8E4D9]">
            {faq.items.map((item: any) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-gray-800 text-base md:text-lg [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronDown size={20} className="text-[#005333] flex-shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="mt-3 text-gray-500 text-sm md:text-base leading-relaxed font-light">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EmpresasFAQ;
