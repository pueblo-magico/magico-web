import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export type ContextualLink = {
  href: string;
  title: string;
  description: string;
};

export const ContextualJourneyLinks = ({ links }: { links: ContextualLink[] }) => {
  const { language } = useLanguage();

  return (
    <section className="bg-[#F1ECE2] py-14">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-brand/55">
          {language === 'es' ? 'Tu próximo paso' : 'Your next step'}
        </p>
        <h2 className="mb-8 font-serif text-3xl text-brand md:text-4xl">
          {language === 'es' ? 'Seguí explorando según lo que necesitás' : 'Keep exploring what matters to you'}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {links.map(link => (
            <a key={link.href} href={link.href} data-journey-event="hub_contextual_next_step" className="group rounded-2xl border border-brand/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <h3 className="font-serif text-xl text-brand">{link.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-dark/65">{link.description}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold">
                {language === 'es' ? 'Ver opción' : 'Explore'}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
