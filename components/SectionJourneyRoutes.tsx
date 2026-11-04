import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { journeyHubs } from '../src/data/journey';

export const SectionJourneyRoutes = () => {
  const { language } = useLanguage();

  return (
    <section className="bg-[#F8F5EE] py-16 md:py-24" aria-labelledby="journey-routes-title">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-brand/55">
            {language === 'es' ? 'Elegí tu camino' : 'Choose your path'}
          </p>
          <h2 id="journey-routes-title" className="font-serif text-3xl text-brand md:text-5xl">
            {language === 'es' ? 'Tres formas de vivir Pueblo Mágico' : 'Three ways to experience Pueblo Mágico'}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-dark/65">
            {language === 'es'
              ? 'Empezá por lo que hoy necesitás. En cada recorrido vas a encontrar la información práctica y el siguiente paso correspondiente.'
              : 'Start with what you need today. Each route includes practical information and the right next step.'}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {journeyHubs.map(hub => (
            <a
              key={hub.href}
              href={hub.href}
              data-journey-event={`home_route_${hub.href.replace(/^\//, '').replaceAll('/', '_')}`}
              className="group overflow-hidden rounded-[28px] border border-brand/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="aspect-[4/3] overflow-hidden bg-stone-200">
                <img src={hub.image} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
              </div>
              <div className="p-7">
                <h3 className="font-serif text-2xl text-brand">{hub.title[language]}</h3>
                <p className="mt-3 min-h-[4.5rem] text-sm leading-relaxed text-dark/65">{hub.description[language]}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold">
                  {language === 'es' ? 'Explorar' : 'Explore'}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
