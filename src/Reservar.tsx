import React from 'react';
import { ArrowLeft, LogOut } from 'lucide-react';
import { BookingWidget } from '../components/BookingWidget';
import { WithdrawalAccessLink } from '../components/WithdrawalAccessLink';
import { useLanguage } from '../contexts/LanguageContext';
import './Reservar.css';

const PAGE_COPY = {
  es: {
    back: 'Volver a alojamientos',
    exit: 'Salir',
    eyebrow: 'Reserva online',
    trust: 'Disponibilidad y precios verificados antes de reservar',
  },
  en: {
    back: 'Back to accommodation',
    exit: 'Exit',
    eyebrow: 'Online booking',
    trust: 'Availability and pricing verified before booking',
  },
} as const;

const Reservar: React.FC = () => {
  const { language } = useLanguage();
  const copy = PAGE_COPY[language];

  return (
    <main className="reservation-page">
      <header className="reservation-page__topbar">
        <a className="reservation-page__brand" href="/" aria-label="Pueblo Mágico">
          <img src="/uploads/pueblo_magico_logo_marron.svg" alt="Pueblo Mágico" width="150" height="72" />
          <span>{copy.eyebrow}</span>
        </a>
        <div className="reservation-page__topbar-actions">
          <span className="reservation-page__trust">{copy.trust}</span>
          <a className="reservation-page__exit" href="/estadia#alojamientos"><LogOut size={18} aria-hidden="true" /> {copy.exit}</a>
        </div>
      </header>

      <div className="reservation-page__back-row">
        <a href="/estadia#alojamientos"><ArrowLeft size={18} aria-hidden="true" /> {copy.back}</a>
      </div>

      <div className="reservation-page__content">
        <BookingWidget page />
        <div className="reservation-page__legal"><WithdrawalAccessLink embedded /></div>
      </div>
    </main>
  );
};

export default Reservar;
