import React from 'react';
import { WA_GONDOR } from '../data/config';
import { formatPrice, RETREATS_DATA } from '../data/retreats';
import { useLanguage } from '../../contexts/LanguageContext';

const INCLUYE = [
  'Arco funcional que te llevás a casa',
  'Gastronomía completa (pensión completa)',
  'Todas las herramientas y materiales',
  'Guía experta durante todo el proceso',
  'Alojamiento 3 noches en Pueblo Mágico',
  'Experiencia inmersiva en la sierra',
];

const GondorbowsPrecios: React.FC = () => {
  const { language } = useLanguage();
  const price = language === 'en' ? RETREATS_DATA.gondorbows.priceUsd : RETREATS_DATA.gondorbows.price;
  const waMain = 'https://wa.me/' + WA_GONDOR + '?text=' +
    encodeURIComponent(RETREATS_DATA.gondorbows.message);

  const waFechas = 'https://wa.me/' + WA_GONDOR + '?text=' +
    encodeURIComponent('¡Hola Fausto! Me encantó la propuesta de Gondorbows pero no puedo en esta fecha. ¿Me avisás cuando lancen nuevas fechas? 🗓️');

  return (
    <>
      {/* ── Testimonios (Shorts) ── */}
      <section className="py-16 md:py-24 px-4 md:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-gold text-[10px] tracking-[0.4em] uppercase font-bold text-center mb-5">Comunidad</p>
          <h2 className="text-3xl md:text-5xl serif-title text-brand text-center mb-10 md:mb-14">
            La experiencia Gondorbows
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto">
            {[
              'https://www.youtube-nocookie.com/embed/uQy7HgK-L_E',
              'https://www.youtube-nocookie.com/embed/4pQ2DTh2rd8',
              'https://www.youtube-nocookie.com/embed/wRamh8nZXNQ',
            ].map((src) => (
              <div
                key={src}
                className="rounded-2xl overflow-hidden"
                style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.14)' }}
              >
                <div className="relative aspect-[9/16] w-full">
                  <iframe
                    src={src}
                    className="absolute inset-0 w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                    title="Testimonio"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="precios" className="py-20 md:py-28 px-4 md:px-6 bg-brand text-white">
        <div className="max-w-3xl mx-auto text-center">

          {/* Badges */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mb-12">
            <span className="text-gold text-[11px] tracking-[0.25em] uppercase font-bold border border-gold/40 px-5 py-2 rounded-full">
              {RETREATS_DATA.gondorbows.dates}
            </span>
            <span className="hidden sm:block text-gold/40">·</span>
            <span className="text-gold text-[11px] tracking-[0.25em] uppercase font-bold border border-gold/40 px-5 py-2 rounded-full">
              Los Gigantes, Córdoba
            </span>
          </div>

          <p className="text-gold text-[10px] tracking-[0.4em] uppercase font-bold mb-5">Tu inversión</p>
          <h2 className="text-3xl md:text-5xl serif-title text-white mb-6 leading-tight">
            Asegurá tu lugar en la forja
          </h2>
          <p className="text-white/55 text-sm md:text-base mb-14 mx-auto leading-relaxed" style={{ maxWidth: '44ch' }}>
            Solo 12 plazas para garantizar la excelencia en la enseñanza.
          </p>

          {/* Price card */}
          <div className="bg-white rounded-2xl p-10 md:p-14 text-center mb-10 mx-auto" style={{ maxWidth: '480px' }}>
            <p className="text-brand font-bold text-sm uppercase tracking-widest mb-5">Valor total de la experiencia</p>
            <p className="font-serif text-brand leading-none mb-5" style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)' }}>
              {formatPrice(price, language)}
            </p>
            <p className="text-brand/50 text-xs uppercase tracking-widest mb-6">{language === 'en' ? 'USD' : RETREATS_DATA.gondorbows.currency}</p>
            <p className="text-brand/70 text-sm">Todo incluido · 3 días de inmersión completa</p>
          </div>

          {/* Includes grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-left max-w-xl mx-auto mb-12">
            {INCLUYE.map((item) => (
              <div key={item} className="flex items-start gap-3 text-white/75 text-sm leading-relaxed">
                <span className="w-1 h-1 rounded-full bg-gold flex-shrink-0 mt-2" />
                {item}
              </div>
            ))}
          </div>

          {/* Payment info */}
          <div className="text-white/50 text-sm leading-relaxed mb-12 space-y-2">
            <p>Confirmá tu asistencia con una seña — el saldo se abona durante el retiro.</p>
            <p>Consultá por opciones de financiación e intercambio.</p>
            <p className="text-white/30 text-xs">Inscripciones cierran el 24 de mayo o al completar los cupos.</p>
          </div>

          {/* Discounts */}
          <div className="inline-block text-left border border-gold/30 rounded-xl px-7 py-6 mb-10">
            <p className="text-gold font-bold text-sm uppercase tracking-wider mb-3">Beneficios</p>
            <ul className="text-white/80 text-sm space-y-2">
              <li className="flex items-start gap-2"><span className="text-gold">·</span> 10% OFF viniendo de a dos o más personas.</li>
              <li className="flex items-start gap-2"><span className="text-gold">·</span> 10% OFF para ex-alumnos o invitados por uno.</li>
            </ul>
            <p className="text-white/35 text-xs mt-3 italic">(Escribinos al WhatsApp para aplicar tu descuento)</p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col items-center gap-4 pb-4">
            <a href={waMain} className="btn-gold">RESERVAR MI LUGAR AHORA</a>
            <a href={waFechas} className="text-white/55 hover:text-gold transition-colors text-sm underline underline-offset-4">
              ¿No podés en esta fecha? Consultá otras fechas.
            </a>
            <a href="/reforestacion" className="block text-white/35 text-xs italic mt-4 max-w-xs mx-auto text-center leading-relaxed font-serif underline decoration-gold/40 underline-offset-4 transition-colors hover:text-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
              El 10% de tu inversión se destina a reforestar tabaquillos y restaurar las sierras.
            </a>
          </div>

        </div>
      </section>
    </>
  );
};

export default GondorbowsPrecios;
