import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { JourneyPage } from './components/JourneyPage';
import { ContextualJourneyLinks } from './components/ContextualJourneyLinks';
import { SectionNosotros } from '../components/SectionNosotros';
import { SectionPilares } from '../components/SectionPilares';
import { SectionVideo } from '../components/SectionVideo';
import { ROUTES } from './routes';

export default function NuestroProyecto() {
  const { language } = useLanguage();
  return (
    <JourneyPage
      eyebrow={language === 'es' ? 'Nuestro Proyecto' : 'Our Project'}
      title={language === 'es' ? 'Un refugio vivo que cuida el territorio' : 'A living refuge caring for the land'}
      intro={language === 'es' ? 'Historia, filosofía, regeneración y participación reunidas en un recorrido para comprender por qué Pueblo Mágico es más que un alojamiento.' : 'History, philosophy, regeneration and participation in one journey explaining why Pueblo Mágico is more than accommodation.'}
      image="/uploads/reforestacion/montana-hero.webp"
      path={ROUTES.NUESTRO_PROYECTO}
      seoTitle={language === 'es' ? 'Nuestro proyecto regenerativo | Pueblo Mágico' : 'Our regenerative project | Pueblo Mágico'}
      seoDescription={language === 'es' ? 'Conocé la historia, filosofía, reforestación y Programa Semilla de Pueblo Mágico en Los Gigantes.' : 'Discover Pueblo Mágico’s history, philosophy, reforestation and Seed Program in Los Gigantes.'}
    >
      <SectionNosotros />
      <SectionPilares />
      <SectionVideo />
      <section className="bg-brand py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 md:grid-cols-2 lg:px-12">
          <a href={ROUTES.REFORESTACION} data-journey-event="project_to_reforestation" className="group rounded-[28px] border border-white/15 bg-white/10 p-7 transition hover:bg-white/15">
            <p className="text-xs font-bold uppercase tracking-widest text-gold">{language === 'es' ? 'Contribuir' : 'Contribute'}</p>
            <h2 className="mt-3 font-serif text-3xl">{language === 'es' ? 'Reforestación' : 'Reforestation'}</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">{language === 'es' ? 'Conocé las áreas, las próximas jornadas y las formas concretas de aportar.' : 'See the areas, upcoming planting days and concrete ways to contribute.'}</p>
            <span className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold">{language === 'es' ? 'Ver proyecto' : 'See project'}<ArrowRight className="h-4 w-4 group-hover:translate-x-1" /></span>
          </a>
          <a href={ROUTES.VOLUNTARIADO} data-journey-event="project_to_volunteering" className="group rounded-[28px] border border-white/15 bg-white/10 p-7 transition hover:bg-white/15">
            <p className="text-xs font-bold uppercase tracking-widest text-gold">{language === 'es' ? 'Participar' : 'Participate'}</p>
            <h2 className="mt-3 font-serif text-3xl">{language === 'es' ? 'Programa Semilla' : 'Seed Program'}</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">{language === 'es' ? 'Revisá expectativas, proceso de postulación y formas de convivencia antes de aplicar.' : 'Review expectations, the application process and shared-living agreements before applying.'}</p>
            <span className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold">{language === 'es' ? 'Conocer programa' : 'See program'}<ArrowRight className="h-4 w-4 group-hover:translate-x-1" /></span>
          </a>
        </div>
      </section>
      <ContextualJourneyLinks links={language === 'es' ? [
        { href: ROUTES.ESTADIA, title: 'Habitar el proyecto', description: 'Conocé las opciones para quedarte en la montaña.' },
        { href: ROUTES.EXPERIENCIAS, title: 'Participar en una fecha', description: 'Explorá experiencias de naturaleza y regeneración.' },
        { href: ROUTES.GRUPOS_RETIROS, title: 'Colaborar como organización', description: 'Diseñemos una propuesta para tu equipo o comunidad.' },
      ] : [
        { href: ROUTES.ESTADIA, title: 'Stay in the project', description: 'Discover ways to stay in the mountains.' },
        { href: ROUTES.EXPERIENCIAS, title: 'Join a scheduled experience', description: 'Explore nature and regeneration experiences.' },
        { href: ROUTES.GRUPOS_RETIROS, title: 'Collaborate as an organization', description: 'Let’s design an offering for your team or community.' },
      ]} />
    </JourneyPage>
  );
}
