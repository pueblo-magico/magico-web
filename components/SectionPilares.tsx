import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Tree, UsersThree, SunHorizon, Eye } from '@phosphor-icons/react';
import { ROUTES } from '../src/routes';

export const SectionPilares: React.FC = () => {
  const { t } = useLanguage();

  const getIcon = (id: number) => {
    const cls = 'w-6 h-6 md:w-7 md:h-7';
    switch (id) {
      case 1: return <Tree className={cls} weight="duotone" />;
      case 2: return <UsersThree className={cls} weight="duotone" />;
      case 3: return <SunHorizon className={cls} weight="duotone" />;
      case 4: return <Eye className={cls} weight="duotone" />;
      default: return <Tree className={cls} weight="duotone" />;
    }
  };

  return (
    <section id="pilares" className="py-20 bg-white border-y border-brand/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div data-reveal className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {t.pillars.map((pillar) => {
            const content = <>
              <div className="w-12 h-12 md:w-14 md:h-14 mx-auto bg-bone rounded-full flex items-center justify-center mb-4 group-hover:bg-brand transition-colors duration-300 text-brand group-hover:text-gold">
                {getIcon(pillar.id)}
              </div>
              <h3 className="text-base md:text-lg mb-2 text-brand font-serif">{pillar.title}</h3>
              <p className="text-xs md:text-sm text-dark/60 leading-relaxed">{pillar.subtitle}</p>
            </>;

            return pillar.id === 1 ? (
              <a
                key={pillar.id}
                href={ROUTES.REFORESTACION}
                className="group block rounded-2xl text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-4"
                aria-label={`${pillar.title}: ${pillar.subtitle}`}
              >
                {content}
              </a>
            ) : (
              <div key={pillar.id} className="group text-center">
                {content}
              </div>
            );
          })}
        </div>

        {/* Donations Section */}
        <div className="mt-20 text-center">
          <p className="text-brand/80 font-serif text-lg mb-8 max-w-2xl mx-auto">
            {t.donations.text}
          </p>
          <a
            href={t.donations.link}
            className="inline-block px-8 py-3 border border-brand text-brand hover:bg-brand hover:text-white rounded-full transition-[background-color,color,border-color] duration-300 text-xs font-bold uppercase tracking-widest"
          >
            {t.donations.btn}
          </a>
        </div>
      </div>
    </section>
  );
};
