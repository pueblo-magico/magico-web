import React from 'react';
import { Check, Warning, CalendarCheck, Gift } from '@phosphor-icons/react';
import { WA_MAGICO } from '../data/config';
import { formatPrice, RETREATS_DATA } from '../data/retreats';
import { useLanguage } from '../../contexts/LanguageContext';

const AchalaVivaPrecios: React.FC = () => {
  const { language } = useLanguage();
  const price = language === 'en' ? RETREATS_DATA.achalaViva.priceUsd : RETREATS_DATA.achalaViva.price;
  const waLinkMain = "https://wa.me/" + WA_MAGICO + "?text=" +
    encodeURIComponent(RETREATS_DATA.achalaViva.message);

  return (
    <>
      <section id="precios" className="py-16 md:py-24 px-4 md:px-6 bg-[#005333] text-white rounded-2xl md:rounded-3xl relative mx-2 md:mx-0 mt-16 md:mt-24 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 border border-white/20 rounded-2xl md:rounded-3xl pointer-events-none"></div>

        <div className="max-w-4xl mx-auto relative z-10 text-center pt-16 md:pt-24 pb-8">
          <h2 className="text-3xl md:text-5xl serif-title mb-8 md:mb-10 tracking-[0.05em] uppercase text-white/95">
            Reservá tu lugar en la inmersión
          </h2>

          <div className="flex justify-center items-center mb-12 md:mb-16">
            <span className="bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/40 px-6 md:px-8 py-2 md:py-3 rounded-full font-bold uppercase tracking-widest text-xs md:text-sm shadow-lg shadow-black/20">
              {RETREATS_DATA.achalaViva.dates} · Los Gigantes, Córdoba
            </span>
          </div>

          {/* Tarjeta de precio — sin float, sin border-t-4 */}
          <div className="w-full flex justify-center px-4 mb-12">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden relative w-full max-w-2xl p-8 md:p-14 text-center flex flex-col items-center hover:shadow-yellow-500/20 transition-shadow duration-500">
              <p className="font-bold text-base md:text-xl mb-4 md:mb-6 uppercase tracking-widest" style={{ color: '#005333' }}>Valor total de la experiencia</p>
              <div className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-wide mb-6 md:mb-8 font-serif" style={{ color: '#005333' }}>{formatPrice(price, language)}</div>
              <p className="text-sm md:text-base opacity-80 font-medium tracking-wide" style={{ color: '#005333' }}>Financiación disponible · Seña del 50%</p>
            </div>
          </div>

          {/* Qué incluye */}
          <div className="bg-white/5 border border-white/20 rounded-2xl md:rounded-3xl p-6 md:p-10 mb-8 max-w-4xl mx-auto">
            <h4 className="text-white font-bold uppercase tracking-widest text-sm md:text-base mb-8 text-center serif-title">¿Qué incluye tu inversión?</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 text-left">
              <div className="flex items-center gap-3 text-white/90">
                <Check weight="light" className="w-6 h-6 text-[#D4AF37] flex-shrink-0" />
                <span><strong>Alojamiento inmersivo</strong> (2 Días / 1 Noche).</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <Check weight="light" className="w-6 h-6 text-[#D4AF37] flex-shrink-0" />
                <span><strong>Pensión completa</strong> (4 comidas de sábado a domingo).</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <Check weight="light" className="w-6 h-6 text-[#D4AF37] flex-shrink-0" />
                <span><strong>Guía experto 24/7</strong> (Biólogo Walter Cejas).</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <Check weight="light" className="w-6 h-6 text-[#D4AF37] flex-shrink-0" />
                <span><strong>Todos los talleres</strong> (Astroturismo, Avistaje, Fotografía).</span>
              </div>
              <div className="flex items-center gap-3 text-white/90 md:col-span-2">
                <Check weight="light" className="w-6 h-6 text-[#D4AF37] flex-shrink-0" />
                <span><strong>Uso libre</strong> de la reserva de 200 hectáreas.</span>
              </div>
            </div>
          </div>

          {/* Cupos */}
          <div className="bg-white/5 border border-white/20 rounded-2xl md:rounded-3xl p-6 md:p-8 mb-12 max-w-4xl mx-auto text-center">
            <h4 className="text-white font-bold tracking-widest text-base mb-4 uppercase flex items-center justify-center gap-2">
              <Warning weight="light" className="w-6 h-6 text-[#D4AF37] flex-shrink-0" /> Cupos limitados a 15 personas
            </h4>
            <p className="text-white/80 text-sm md:text-base mb-4">
              Para garantizar el silencio, el respeto por la fauna y la atención personalizada del guía, no podemos sumar a nadie más.
            </p>

          </div>

          {/* Button */}
          <div className="mt-8 md:mt-12 pb-16 flex flex-col items-center">

            {/* Beneficios Especiales */}
            <div className="mb-8 text-center bg-white/5 p-6 md:p-8 rounded-2xl border border-[#D4AF37]/40 w-full max-w-lg shadow-xl shadow-black/10">
              <p className="font-bold text-[#D4AF37] mb-4 text-base flex items-center justify-center gap-2">
                <Gift weight="light" className="w-5 h-5 flex-shrink-0" /> Beneficios especiales
              </p>
              <ul className="text-white/90 text-sm md:text-base space-y-3 text-left w-fit mx-auto font-medium">
                <li className="flex items-start gap-3"><span className="text-[#D4AF37] font-bold">10% OFF</span> viniendo de a dos.</li>
                <li className="flex items-start gap-3"><span className="text-[#D4AF37] font-bold">10% OFF</span> Ex-alumnos o referidos.</li>
              </ul>
            </div>

            <a href={waLinkMain}
              style={{ backgroundColor: '#E5B84A', color: '#005333' }}
              className="inline-flex justify-center items-center transition-all hover:bg-yellow-400 py-3 md:py-4 px-10 md:px-14 w-fit mx-auto rounded-full font-bold text-sm md:text-base tracking-[0.12em] uppercase shadow-lg shadow-black/20 hover:shadow-xl hover:-translate-y-1 duration-300 text-center">
              Consultar próximas fechas
            </a>
          </div>

        </div>
      </section>
    </>
  );
};

export default AchalaVivaPrecios;
