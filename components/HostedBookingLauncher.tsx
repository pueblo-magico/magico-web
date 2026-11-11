import React from 'react';
import { ArrowRight, CalendarCheck, CheckCircle, ShieldCheck } from '@phosphor-icons/react';
import { buttonVariants } from '@pueblo-magico/react-ui';
import { useLanguage } from '../contexts/LanguageContext';
import { RESERVAS_PUBLIC_URL } from '../src/data/config';

const COPY = {
  es: {
    eyebrow: 'Reserva online',
    title: 'Encontrá tu lugar en la montaña',
    description: 'Elegí fechas, alojamiento y comidas con disponibilidad y precio verificados en el momento.',
    button: 'Comenzar reserva',
    trust: ['Disponibilidad en tiempo real', 'Precio final antes de reservar', 'Estado de tu reserva online'],
  },
  en: {
    eyebrow: 'Online booking',
    title: 'Find your place in the mountains',
    description: 'Choose dates, accommodation and meals with availability and pricing verified in real time.',
    button: 'Start booking',
    trust: ['Live availability', 'Final price before booking', 'Online reservation status'],
  },
} as const;

interface HostedBookingLauncherProps {
  compact?: boolean;
  surface?: 'light' | 'hero';
}

export const HostedBookingLauncher: React.FC<HostedBookingLauncherProps> = ({
  compact = false,
  surface = 'light',
}) => {
  const { language } = useLanguage();
  const copy = COPY[language];
  const isHero = surface === 'hero';

  return (
    <section
      aria-labelledby={`hosted-booking-${compact ? 'compact' : 'full'}`}
      style={{
        padding: compact ? '18px 18px 20px' : '24px',
        color: isHero ? 'white' : '#173127',
        background: isHero ? 'rgba(0, 83, 51, 0.96)' : 'white',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <CalendarCheck size={18} weight="duotone" color="#D4AF37" aria-hidden="true" />
        <p style={{ margin: 0, color: '#B28B21', fontSize: 10, fontWeight: 800, letterSpacing: '0.24em', textTransform: 'uppercase' }}>
          {copy.eyebrow}
        </p>
      </div>
      <h2
        id={`hosted-booking-${compact ? 'compact' : 'full'}`}
        style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: compact ? 19 : 23, fontWeight: 400, lineHeight: 1.25 }}
      >
        {copy.title}
      </h2>
      <p style={{ margin: '9px 0 16px', color: isHero ? 'rgba(255,255,255,0.76)' : '#52645d', fontSize: 13, lineHeight: 1.55 }}>
        {copy.description}
      </p>
      {!compact && (
        <ul style={{ margin: '0 0 18px', padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
          {copy.trust.map((item) => (
            <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: isHero ? 'rgba(255,255,255,0.82)' : '#52645d' }}>
              <CheckCircle size={16} weight="fill" color="#D4AF37" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      )}
      <a
        href={RESERVAS_PUBLIC_URL}
        className={buttonVariants({ shape: 'pill', size: 'lg', variant: 'accent' })}
        style={{
          width: '100%',
          fontSize: 12,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          textDecoration: 'none',
        }}
      >
        {copy.button}
        <ArrowRight size={17} weight="bold" aria-hidden="true" />
      </a>
      <p style={{ margin: '12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: isHero ? 'rgba(255,255,255,0.58)' : '#718078', fontSize: 10 }}>
        <ShieldCheck size={14} weight="duotone" aria-hidden="true" />
        Pueblo Mágico Reservas
      </p>
    </section>
  );
};
