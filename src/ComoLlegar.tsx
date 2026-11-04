import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { JourneyPage } from './components/JourneyPage';
import { ContextualJourneyLinks } from './components/ContextualJourneyLinks';
import { SectionComoLlegar } from '../components/SectionComoLlegar';
import { SectionFAQ } from '../components/SectionFAQ';
import { SectionContacto } from '../components/SectionContacto';
import { ROUTES } from './routes';

export default function ComoLlegar() {
  const { language } = useLanguage();
  return (
    <JourneyPage
      eyebrow={language === 'es' ? 'Cómo llegar & FAQs' : 'Getting here & FAQs'}
      title={language === 'es' ? 'Prepará tu llegada a la montaña' : 'Prepare your arrival in the mountains'}
      intro={language === 'es' ? 'Ubicación, camino, transporte y respuestas prácticas reunidas antes de que consultes o reserves.' : 'Location, road, transport and practical answers gathered before you inquire or book.'}
      image="/uploads/img_6948.webp"
      path={ROUTES.COMO_LLEGAR}
      seoTitle={language === 'es' ? 'Cómo llegar a Pueblo Mágico | Los Gigantes' : 'Getting to Pueblo Mágico | Los Gigantes'}
      seoDescription={language === 'es' ? 'Ubicación, acceso, transporte, clima y preguntas frecuentes para visitar Pueblo Mágico en Los Gigantes, Córdoba.' : 'Location, access, transport, weather and FAQs for visiting Pueblo Mágico in Los Gigantes, Córdoba.'}
    >
      <SectionComoLlegar />
      <SectionFAQ />
      <ContextualJourneyLinks links={language === 'es' ? [
        { href: ROUTES.ESTADIA, title: 'Comparar estadías', description: 'Alojamiento, comidas, baños e inclusiones.' },
        { href: ROUTES.EXPERIENCIAS, title: 'Ver agenda', description: 'Fechas y experiencias disponibles durante tu visita.' },
        { href: ROUTES.NUESTRO_PROYECTO, title: 'Conocer el lugar', description: 'Historia, filosofía y cuidado del territorio.' },
      ] : [
        { href: ROUTES.ESTADIA, title: 'Compare stays', description: 'Accommodation, meals, bathrooms and inclusions.' },
        { href: ROUTES.EXPERIENCIAS, title: 'See the calendar', description: 'Dates and experiences available during your visit.' },
        { href: ROUTES.NUESTRO_PROYECTO, title: 'Discover the place', description: 'History, philosophy and care for the land.' },
      ]} />
      <SectionContacto />
    </JourneyPage>
  );
}
