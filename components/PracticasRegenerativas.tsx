import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// Prácticas de la operación diaria (solar, baños secos, compost), compartidas
// entre /empresas (fondo verde → "dark") y /reforestacion (fondo claro → "light").
// Data: t.practicas.
export const PracticasRegenerativas: React.FC<{ variant?: 'dark' | 'light' }> = ({ variant = 'dark' }) => {
  const { t } = useLanguage();
  const p = t.practicas;
  const dark = variant === 'dark';

  return (
    <div>
      <p className={`font-medium uppercase tracking-[0.2em] text-[11px] mb-5 ${dark ? 'text-[#D4AF37]' : 'text-brand font-bold text-center'}`}>
        {p.title}
      </p>
      <div className="grid sm:grid-cols-3 gap-4">
        {p.items.map((item: any, i: number) => (
          <div
            key={i}
            className={dark ? 'rounded-2xl border border-white/10 bg-white/[0.04] p-5' : 'rounded-2xl border border-brand/10 bg-bone p-5'}
          >
            <div className={`font-semibold mb-1 ${dark ? 'text-white' : 'text-dark'}`}>{item.title}</div>
            <p className={`text-sm leading-relaxed ${dark ? 'text-white/60' : 'text-gray-500 font-light'}`}>{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
