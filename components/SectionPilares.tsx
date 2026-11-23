import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowRight, Tree, UsersThree, SunHorizon, Eye } from '@phosphor-icons/react';
import { ROUTES } from '../src/routes';

export const SectionPilares: React.FC = () => {
  const { t, language } = useLanguage();
  const practicesCopy = language === 'es' ? {
    eyebrow: 'Pilares en acción',
    title: 'Prácticas que sostienen nuestra visión',
    text: 'La palabra, la música, el fuego, la artesanía, el rezo y el temazcal son formas de integrar, incorporar y expresar lo que somos.',
    cta: 'Conocer nuestras prácticas',
  } : {
    eyebrow: 'Pillars in action',
    title: 'Practices that sustain our vision',
    text: 'Word, music, fire, craft, prayer and temazcal are ways of integrating, embodying and expressing who we are.',
    cta: 'Discover our practices',
  };

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

            const pillarHref = pillar.id === 1
              ? ROUTES.REFORESTACION
              : pillar.id === 4
                ? ROUTES.PRACTICAS
                : null;

            return pillarHref ? (
              <a
                key={pillar.id}
                href={pillarHref}
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

        <a href={ROUTES.PRACTICAS} className="group mt-16 grid overflow-hidden rounded-[30px] border border-brand/10 bg-[#F7F1E7] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(23,49,39,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-4 md:grid-cols-[0.8fr_1.2fr]">
          <div className="grid min-h-[280px] grid-cols-2 grid-rows-2 gap-1 overflow-hidden md:min-h-full">
            <img src="/uploads/sunset-rio-amigos.webp" alt={language === 'es' ? 'Comunidad reunida en círculo' : 'Community gathered in a circle'} className="row-span-2 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
            <img src="/uploads/sunset-rio-guitarreada.webp" alt={language === 'es' ? 'Música compartida junto al fuego' : 'Music shared by the fire'} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
            <img src="/uploads/fausto-tallando.jpg" alt={language === 'es' ? 'Trabajo artesanal en madera' : 'Wood craftsmanship'} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
          </div>
          <div className="flex flex-col justify-center p-8 md:p-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#A94A2B]">{practicesCopy.eyebrow}</p>
            <h3 className="mt-4 font-serif text-3xl leading-tight text-brand md:text-4xl">{practicesCopy.title}</h3>
            <p className="mt-4 max-w-xl text-sm leading-7 text-dark/65 md:text-base">{practicesCopy.text}</p>
            <span className="mt-7 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-gold transition-colors group-hover:text-brand">
              {practicesCopy.cta}<ArrowRight size={17} weight="bold" aria-hidden="true" />
            </span>
          </div>
        </a>

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
