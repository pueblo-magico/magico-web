import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Tree, UsersThree, Mountains } from '@phosphor-icons/react';
import { BookingWidget, G } from './BookingWidget';
import { WithdrawalAccessLink } from './WithdrawalAccessLink';

const PachamamaFestBadge: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { t } = useLanguage();
  const data = (t.hero as any).pachamamaBadge;

  if (!data) return null;

  return (
    <a href={data.link}
      style={{ display: 'flex', alignItems: 'center', gap: compact ? 6 : 8, background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.4)', borderRadius: 999, padding: compact ? '5px 12px' : '6px 14px', textDecoration: 'none' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4AF37', flexShrink: 0 }} />
      <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: compact ? 11 : 12, fontWeight: 700, letterSpacing: compact ? '0.2em' : '0.25em', textTransform: 'uppercase' }}>{data.label}</span>
    </a>
  );
};

export const HeroNuevo: React.FC = () => {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [compactBookingOpen, setCompactBookingOpen] = useState(false);
  const [desktopBookingOpen, setDesktopBookingOpen] = useState(false);
  const images   = (t.hero as any).bgImages || [t.hero.bgImage];
  const colivingBadge = (t.hero as any).colivingBadge;

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => setCurrentIndex(i => (i + 1) % images.length), 3000);
    return () => clearInterval(id);
  }, [images.length]);

  // ── Fondo compartido ────────────────────────────────────────────────────────
  const Background = (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
      {images.map((img: string, i: number) => (
        <img key={i} src={img} alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', transition: 'opacity 1s ease', opacity: i === currentIndex ? 1 : 0 }}
          loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />
      ))}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.40)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,83,51,0.92) 0%, rgba(0,83,51,0.12) 45%, transparent 70%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.15) 0%, transparent 60%)' }} />
    </div>
  );

  return (
    <section id="heroHome" style={{ position: 'relative', width: '100%', minHeight: '100vh' }}>
      {Background}

      {/* ═══════════════════════════════════════════════════════
          MOBILE: logo + H1 corto + widget directo
      ════════════════════════════════════════════════════════ */}
      <div className="lg:hidden flex flex-col" style={{ position: 'relative', zIndex: 10, padding: '6.5rem 1.25rem 1.5rem' }}>

        {/* Tag */}
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 14 }}>
          {(t.hero as any).tag}
        </p>

        {/* Título + posicionamiento */}
        <h1 style={{ fontSize: '2rem', fontFamily: 'Georgia, serif', color: 'white', lineHeight: 1.2, fontWeight: 300, marginBottom: 5 }}>
          {t.hero.title}
        </h1>
        <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 15, color: 'rgba(212,175,55,0.9)', marginBottom: 5 }}>
          {(t.hero as any).titleSub}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.70)', fontSize: 14, lineHeight: 1.6, marginBottom: 14 }}>
          {(t.hero.subtitle as string).split('.')[0]}.
        </p>

        {/* Diferencial compacto */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, color: 'rgba(212,175,55,0.80)', marginBottom: 16 }}>
          <span>{t.hero.stats_years as string}</span>
          <span style={{ color: 'rgba(212,175,55,0.25)' }}>|</span>
          <span>{t.hero.stats_trees as string}</span>
          <span style={{ color: 'rgba(212,175,55,0.25)' }}>|</span>
          <span>{(t.hero as any).stats_land}</span>
        </div>

        {/* Widget compacto */}
        <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.45)' }}>
          {!compactBookingOpen && <div style={{ background: G.green, padding: '11px 16px 9px' }}>
            <p style={{ fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase', fontWeight: 700, color: 'rgba(212,175,55,0.85)', marginBottom: 3 }}>
              {(t.hero as any).reservationKicker}
            </p>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 400, color: 'white', margin: 0 }}>
              {(t.hero as any).reservationCta}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(212,175,55,0.9)', fontWeight: 600, margin: '4px 0 0' }}>
              {(t.hero as any).reservationPricing}
            </p>
          </div>}
          <div style={{ background: 'rgba(255,255,255,0.97)' }}>
            <BookingWidget compact activeViewport="mobile" onOpenChange={setCompactBookingOpen} />
          </div>
        </div>
        <WithdrawalAccessLink embedded inverse />

        {/* Prueba social + links */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 16px', marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#fde047', fontSize: 13 }}>★★★★★</span>
            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>{(t.hero as any).stats_google}</span>
          </div>
          <PachamamaFestBadge compact />
          {colivingBadge && (
            <a href={colivingBadge.link}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 999, padding: '5px 12px', textDecoration: 'none' }}>
              <span style={{ color: 'rgba(255,255,255,0.90)', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>{colivingBadge.label}</span>
            </a>
          )}
          <a href={(t.hero as any).retreatLink}
            style={{ color: 'rgba(255,255,255,0.50)', fontSize: 12, fontWeight: 600, textDecoration: 'none', letterSpacing: '0.04em' }}>
            {t.hero.btnRetreat} ↗
          </a>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          DESKTOP: dos columnas — texto izquierda, widget derecha
      ════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex"
        style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem', alignItems: 'center', minHeight: '100vh' }}>

        {/* Columna texto */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingTop: '5rem', paddingBottom: '5rem', paddingRight: '2rem' }}>

          <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 22 }}>
            {(t.hero as any).tag}
          </p>

          <h1 style={{ fontSize: 'clamp(2.1rem, 3.4vw, 3.1rem)', fontFamily: 'Georgia, serif', color: 'white', lineHeight: 1.2, fontWeight: 300, marginBottom: 8, maxWidth: 480 }}>
            {t.hero.title}
          </h1>

          <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 16, color: 'rgba(212,175,55,0.88)', marginBottom: 16 }}>
            {(t.hero as any).titleSub}
          </p>

          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, lineHeight: 1.65, maxWidth: 400, marginBottom: 28 }}>
            {(t.hero.subtitle as string).split('.')[0]}.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, color: '#D4AF37', marginBottom: 20 }}>
            {([
              { Icon: Tree,       text: t.hero.stats_years },
              { Icon: UsersThree, text: t.hero.stats_trees },
              { Icon: Mountains,  text: (t.hero as any).stats_land },
            ] as const).map(({ Icon, text }, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span style={{ color: 'rgba(212,175,55,0.2)' }}>|</span>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon size={12} weight="fill" />
                  <span>{text as string}</span>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Trust chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
            <PachamamaFestBadge />
            {colivingBadge && (
              <a href={colivingBadge.link}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 999, padding: '6px 14px', textDecoration: 'none' }}>
                <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: 12, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase' }}>{colivingBadge.label}</span>
              </a>
            )}
            <a href="https://maps.app.goo.gl/4c1nrpBbQf5hYrsE9" target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999, padding: '6px 14px', textDecoration: 'none' }}>
              <span style={{ color: '#fde047', fontSize: 14 }}>★★★★★</span>
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 600 }}>{(t.hero as any).stats_google}</span>
            </a>
          </div>

          {/* Links secundarios */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', alignItems: 'center' }}>
            <a href={t.hero.bookLink as string}
              style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 600, textDecoration: 'none', letterSpacing: '0.04em' }}>
              {t.hero.btnBook} ↗
            </a>
            <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 12 }}>·</span>
            <a href={(t.hero as any).retreatLink}
              style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 600, textDecoration: 'none', letterSpacing: '0.04em' }}>
              {t.hero.btnRetreat} ↗
            </a>
          </div>
        </div>

        {/* Tarjeta flotante de reserva */}
        <div style={{ width: 370, flexShrink: 0, paddingTop: '5rem', paddingBottom: '5rem', paddingLeft: '1.5rem' }}>
          <div style={{ width: '100%', borderRadius: 22, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.32), 0 4px 16px rgba(0,0,0,0.18)' }}>
            {!desktopBookingOpen && <div style={{ background: G.green, padding: '18px 20px 16px' }}>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 21, fontWeight: 400, color: 'white', lineHeight: 1.25, margin: 0 }}>
                {(t.hero as any).reservationTitle}
              </h2>
              <p style={{ fontSize: 12, color: 'rgba(212,175,55,0.9)', fontWeight: 600, margin: '6px 0 0' }}>
                {(t.hero as any).reservationPricing}
              </p>
            </div>}
            <div style={{ background: 'rgba(255,255,255,0.96)' }}>
              <BookingWidget activeViewport="desktop" onOpenChange={setDesktopBookingOpen} />
            </div>
          </div>
          <WithdrawalAccessLink embedded inverse />
        </div>

      </div>
    </section>
  );
};
