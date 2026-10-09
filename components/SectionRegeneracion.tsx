import React from 'react';
import { TreePine, Sun, Droplets, Leaf, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { ROUTES } from '../src/routes';

const ICONS = [TreePine, Sun, Droplets, Leaf];

// Bloque "Tu inversión genera regeneración". `embedded` = solo la tarjeta, para usar dentro de una sección verde existente.
export const SectionRegeneracion: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const { t } = useLanguage();
  const content = t.regeneration;

  const card = (
    <div className="bg-gold/10 rounded-2xl p-6 sm:p-8 md:p-12 border border-gold/30 text-center text-white">
      <h2 className="text-2xl md:text-4xl serif-title text-gold mb-8 uppercase tracking-wide">
        {content.title}
      </h2>
      <ul className="text-white/90 text-base md:text-lg leading-relaxed space-y-6 text-left max-w-2xl mx-auto mb-8">
        {content.items.map((item: any, index: number) => {
          const Icon = ICONS[index] || Leaf;
          return (
            <li key={item.lead} className="flex items-start gap-4">
              <Icon strokeWidth={1.5} className="w-7 h-7 text-gold flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span><strong>{item.lead}</strong>{item.text}</span>
            </li>
          );
        })}
      </ul>
      <p className="text-white font-serif text-lg md:text-xl italic mb-8">
        {content.closing}
      </p>
      <a href={ROUTES.REFORESTACION} className="btn-glass btn-icon-inline inline-flex !max-w-full !whitespace-normal text-center !leading-snug">
        {content.cta}
        <ArrowRight size={18} className="shrink-0" aria-hidden="true" />
      </a>
    </div>
  );

  if (embedded) return <div className="max-w-4xl mx-auto mb-10">{card}</div>;

  return (
    <section className="py-20 md:py-28 px-6 bg-brand-green">
      <div data-reveal>
        <div className="max-w-4xl mx-auto">{card}</div>
      </div>
    </section>
  );
};
