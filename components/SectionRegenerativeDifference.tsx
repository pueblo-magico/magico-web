import React from 'react';
import { ArrowRight, Leaf, Sprout, UsersRound } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { ROUTES } from '../src/routes';

export const SectionRegenerativeDifference = () => {
  const { language } = useLanguage();
  const content = language === 'es' ? {
    eyebrow: 'Lo que hace diferente al lugar',
    title: 'No sólo venís a la montaña: entrás en un proyecto vivo',
    body: 'Pueblo Mágico combina descanso, comunidad y cuidado real del territorio. La regeneración no es decoración: forma parte de cómo habitamos, producimos y recibimos.',
    items: [
      ['+25.000 árboles nativos', 'Plantados en un proceso sostenido de restauración.'],
      ['+200 hectáreas cuidadas', 'Territorio de montaña acompañado durante 25 años.'],
      ['Participación concreta', 'Jornadas, voluntariado y alianzas con impacto visible.'],
    ],
    cta: 'Conocer nuestro proyecto',
  } : {
    eyebrow: 'What makes this place different',
    title: 'You are not only visiting the mountains: you enter a living project',
    body: 'Pueblo Mágico combines rest, community and real care for the land. Regeneration is not decoration: it shapes how we live, produce and welcome people.',
    items: [
      ['25,000+ native trees', 'Planted through a sustained restoration process.'],
      ['200+ hectares cared for', 'Mountain territory tended for 25 years.'],
      ['Concrete participation', 'Planting days, volunteering and visible partnerships.'],
    ],
    cta: 'Discover our project',
  };
  const icons = [Leaf, Sprout, UsersRound];

  return (
    <section className="bg-brand py-16 text-white md:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[1.05fr_1fr] lg:px-12">
        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-gold">{content.eyebrow}</p>
          <h2 className="max-w-xl font-serif text-3xl leading-tight md:text-5xl">{content.title}</h2>
          <p className="mt-6 max-w-xl leading-relaxed text-white/75">{content.body}</p>
          <a href={ROUTES.NUESTRO_PROYECTO} className="mt-8 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-xs font-bold uppercase tracking-widest text-brand transition hover:bg-white">
            {content.cta}<ArrowRight className="h-4 w-4" />
          </a>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {content.items.map(([title, description], index) => {
            const Icon = icons[index];
            return (
              <div key={title} className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                <Icon className="mb-3 h-6 w-6 text-gold" />
                <h3 className="font-serif text-xl">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
