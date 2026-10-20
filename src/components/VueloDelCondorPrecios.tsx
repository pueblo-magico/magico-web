import React from 'react';
import { CheckCircle, XCircle, Star } from '@phosphor-icons/react';
import { RESERVATION_START_PATH } from '../data/config';
import { RETREATS_DATA } from '../data/retreats';

const VueloDelCondorPrecios: React.FC = () => {
  return (
    <section id="reservar" className="py-16 md:py-24 px-6 bg-slate-50 mt-16 md:mt-24">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl serif-title brand-green mb-4">
            Inversión y Detalles
          </h2>
          <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
            Asegurá tu lugar en esta experiencia transformadora.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Qué Incluye / No Incluye */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-brand-green mb-6 border-b border-gray-100 pb-4">
                La experiencia incluye
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle weight="fill" className="text-brand-green w-5 h-5 shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm md:text-base">Alojamiento durante los 7 días.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle weight="fill" className="text-brand-green w-5 h-5 shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm md:text-base">Todas las comidas.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle weight="fill" className="text-brand-green w-5 h-5 shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm md:text-base">Todas las actividades, ceremonias y rituales detallados.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle weight="fill" className="text-brand-green w-5 h-5 shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm md:text-base">Todos los traslados internos en Perú.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-red-800 mb-6 border-b border-gray-100 pb-4">
                No incluye
              </h3>
              <ul className="space-y-4 mb-6">
                <li className="flex items-start gap-3">
                  <XCircle weight="fill" className="text-red-500 w-5 h-5 shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm md:text-base">Vuelos internacionales/nacionales hasta Cuzco.</span>
                </li>
              </ul>
              <div className="bg-amber-50 p-4 rounded-lg flex items-start gap-3 border border-amber-100">
                <Star weight="fill" className="text-amber-600 w-6 h-6 shrink-0 mt-0.5" />
                <p className="text-amber-800 text-sm">
                  <strong>Ayuda con los vuelos:</strong> Te ayudamos a coordinar pasajes y vuelos con todo lo necesario para que puedas conseguir las mejores posibilidades de viaje.
                </p>
              </div>
            </div>
          </div>

          {/* Tarjeta de Precio */}
          <div className="bg-white rounded-2xl p-8 md:p-10 shadow-xl border border-brand-green/10 relative overflow-hidden flex flex-col h-full">
            <div className="absolute top-0 right-0 bg-brand-gold text-white text-xs font-bold px-4 py-1 rounded-bl-lg uppercase tracking-wider">
              Cupos Limitados
            </div>
            
            <div className="text-center mb-8 pt-4">
              <h3 className="text-2xl font-serif text-brand-green mb-2">Inversión Total</h3>
              <div className="flex justify-center items-baseline gap-1 text-brand-green">
                <span className="text-2xl md:text-3xl font-semibold">{RETREATS_DATA.vueloDelCondor.currency}</span>
                <span className="text-5xl md:text-6xl font-bold tracking-tight">{RETREATS_DATA.vueloDelCondor.price.toLocaleString('en-US')}</span>
              </div>
            </div>

            <div className="space-y-6 flex-grow">
              <p className="text-gray-600 text-center text-sm md:text-base">
                El lugar se reserva con una seña inicial.
                <br />
                <strong>Contamos con opciones de financiación.</strong>
              </p>

              <div className="bg-brand-green/5 p-4 rounded-xl border border-brand-green/10 text-center">
                <p className="text-brand-green italic text-sm">
                  "Si sentís el llamado, escribinos. No lo racionalices demasiado. Estos viajes no se entienden, se sienten. Te acompañamos en todo el proceso para que puedas ser parte."
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <a 
                href={RESERVATION_START_PATH}
                className="btn-gold w-full text-center inline-block py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Quiero reservar mi lugar
              </a>
              <p className="text-gray-400 text-xs mt-4">
                Al hacer clic, serás redirigido a WhatsApp para coordinar tu reserva de forma personalizada.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default VueloDelCondorPrecios;
