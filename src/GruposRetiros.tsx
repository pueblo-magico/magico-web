import React from 'react';
import { ArrowRight, Briefcase as BriefcaseBusiness, GraduationCap, UsersRound } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { JourneyPage } from './components/JourneyPage';
import { ContextualJourneyLinks } from './components/ContextualJourneyLinks';
import { ROUTES } from './routes';

export default function GruposRetiros() {
  const { language } = useLanguage();
  const options = language === 'es' ? [
    { href: ROUTES.ORGANIZA_EXPERIENCIA, title: 'Facilitadores y retiros', description: 'Traé tu comunidad. Diseñamos juntos alojamiento, alimentación, espacios y logística.', cta: 'Organizar una experiencia', icon: UsersRound },
    { href: ROUTES.ESCUELAS, title: 'Escuelas · Aula Verde', description: 'Una experiencia educativa en la montaña con naturaleza, convivencia y aprendizaje ambiental.', cta: 'Conocer Aula Verde', icon: GraduationCap },
    { href: ROUTES.EMPRESAS, title: 'Empresas y equipos', description: 'Jornadas con objetivos claros para bienestar, colaboración, estrategia o impacto regenerativo.', cta: 'Ver propuesta para empresas', icon: BriefcaseBusiness },
  ] : [
    { href: ROUTES.ORGANIZA_EXPERIENCIA, title: 'Facilitators & retreats', description: 'Bring your community. We co-design accommodation, meals, spaces and logistics.', cta: 'Organize an experience', icon: UsersRound },
    { href: ROUTES.ESCUELAS, title: 'Schools · Green Classroom', description: 'A mountain learning experience combining nature, shared living and environmental education.', cta: 'Discover Green Classroom', icon: GraduationCap },
    { href: ROUTES.EMPRESAS, title: 'Companies & teams', description: 'Purposeful days for wellbeing, collaboration, strategy or regenerative impact.', cta: 'See company offering', icon: BriefcaseBusiness },
  ];

  return (
    <JourneyPage
      eyebrow={language === 'es' ? 'Grupos & Retiros' : 'Groups & Retreats'}
      title={language === 'es' ? 'Un lugar para reunir a tu comunidad con propósito' : 'A place to gather your community with purpose'}
      intro={language === 'es' ? 'Tres caminos distintos, una consulta clara. Elegí el tipo de grupo para ver capacidades, servicios y el siguiente paso.' : 'Three distinct paths and one clear inquiry. Choose your group type to see capacity, services and the next step.'}
      image="/uploads/atardeser/comunidad.jpeg"
      path={ROUTES.GRUPOS_RETIROS}
      seoTitle={language === 'es' ? 'Grupos y retiros en Córdoba | Pueblo Mágico' : 'Groups and retreats in Córdoba | Pueblo Mágico'}
      seoDescription={language === 'es' ? 'Espacios y propuestas para facilitadores, escuelas y empresas en las Sierras Grandes de Córdoba.' : 'Spaces and offerings for facilitators, schools and companies in Córdoba’s Sierras Grandes.'}
    >
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid gap-6 lg:grid-cols-3">
            {options.map(option => {
              const Icon = option.icon;
              return (
                <article key={option.href} className="flex flex-col rounded-[28px] border border-brand/10 bg-[#F8F5EE] p-7 shadow-sm">
                  <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-gold"><Icon className="h-6 w-6" /></span>
                  <h2 className="font-serif text-2xl text-brand">{option.title}</h2>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-dark/65">{option.description}</p>
                  <a href={option.href} data-journey-event="group_route_detail" className="mt-7 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold hover:text-brand">{option.cta}<ArrowRight className="h-4 w-4" /></a>
                </article>
              );
            })}
          </div>
          <div className="mt-12 rounded-[28px] bg-brand p-7 text-white md:p-10">
            <h2 className="font-serif text-3xl">{language === 'es' ? 'Qué necesitamos para orientarte bien' : 'What we need to guide you well'}</h2>
            <ul className="mt-6 grid gap-3 text-sm text-white/75 md:grid-cols-2">
              {(language === 'es' ? ['Fechas tentativas y cantidad de personas', 'Objetivo y tipo de experiencia', 'Necesidades de alojamiento y alimentación', 'Actividades, facilitadores y presupuesto orientativo'] : ['Tentative dates and group size', 'Purpose and type of experience', 'Accommodation and meal needs', 'Activities, facilitators and indicative budget']).map(item => <li key={item} className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">{item}</li>)}
            </ul>
          </div>
        </div>
      </section>
      <ContextualJourneyLinks links={language === 'es' ? [
        { href: ROUTES.ESTADIA, title: 'Alojamiento y capacidades', description: 'Conocé domos, Refugio de Piedra y camping.' },
        { href: ROUTES.EXPERIENCIAS, title: 'Experiencias relacionadas', description: 'Sumá naturaleza, bienestar o regeneración a la propuesta.' },
        { href: ROUTES.NUESTRO_PROYECTO, title: 'Impacto y territorio', description: 'Conocé el proyecto regenerativo detrás del lugar.' },
      ] : [
        { href: ROUTES.ESTADIA, title: 'Accommodation & capacity', description: 'Discover domes, the Stone Lodge and camping.' },
        { href: ROUTES.EXPERIENCIAS, title: 'Related experiences', description: 'Add nature, wellbeing or regeneration to the proposal.' },
        { href: ROUTES.NUESTRO_PROYECTO, title: 'Impact & territory', description: 'Discover the regenerative project behind the place.' },
      ]} />
    </JourneyPage>
  );
}
