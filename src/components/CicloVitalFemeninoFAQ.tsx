import React, { useState } from 'react';
import { CaretDownIcon, MoonIcon, FireIcon, UsersThreeIcon, HouseIcon, HeartIcon, PawPrintIcon, WheelchairIcon } from '@phosphor-icons/react';
import { formatPrice, RETREATS_DATA, type PricingLanguage } from '../data/retreats';
import { useLanguage } from '../../contexts/LanguageContext';

function getFaqs(language: PricingLanguage) {
  const data = RETREATS_DATA.cicloVitalFemenino;
  const prices = language === 'en'
    ? data.pricesUsd
    : {
        priceSola: data.priceSola,
        priceAcompanada: data.priceAcompanada,
        senia: data.senia,
        segundoPago: data.segundoPago,
      };
  return [
  {
    Icon: UsersThreeIcon,
    question: '¿Necesito experiencia previa en retiros o círculos de mujeres?',
    answer: 'No, para nada. Este encuentro está pensado para recibir a cualquier mujer que sienta el llamado a hacer una pausa, sin importar si es tu primer retiro o si ya transitaste otros procesos. Todas las prácticas se guían con cuidado y sin exigencia.',
  },
  {
    Icon: FireIcon,
    question: '¿Qué es el temazcal y es obligatorio participar?',
    answer: 'El temazcal es un ritual ancestral de purificación en una cabaña de vapor, uno de los momentos centrales del encuentro. Se guía con acompañamiento profesional y cada participante avanza a su propio ritmo — nada es forzado, siempre podés elegir tu nivel de participación.',
  },
  {
    Icon: MoonIcon,
    question: '¿Cómo es el clima en la montaña a fines de agosto?',
    answer: 'Estamos en Los Gigantes, Córdoba, a 1800 msnm — las noches son frías y los días templados. Te recomendamos venir con abrigo en capas, calzado cerrado y algo de ropa cómoda para movimiento. Ante cualquier duda te ayudamos a armar el bolso desde WhatsApp.',
  },
  {
    Icon: HouseIcon,
    question: '¿Cómo es el alojamiento y qué incluyen las comidas?',
    answer: 'Te hospedás dos noches en Pueblo Mágico, nuestro ecolodge de montaña, con ropa de cama y biocosmética incluidas. Las comidas están pensadas para nutrir y acompañar el proceso — todas incluidas durante los tres días. Tenemos opciones sin gluten y podemos garantizar platos que no llevan gluten entre sus ingredientes, pero no un ambiente 100% libre de contaminación cruzada (cocinamos en una cocina y mesada compartida) — para celiaquía severa o intolerancia alta, contanos tu caso al reservar.',
  },
  {
    Icon: HeartIcon,
    question: '¿Cómo reservo mi lugar y qué formas de pago hay?',
    answer: `La experiencia cuesta ${formatPrice(prices.priceSola, language)} si venís sola, o ${formatPrice(prices.priceAcompanada, language)} por persona si venís acompañada. Reservás con una seña recomendada de ${formatPrice(prices.senia, language)}, otros ${formatPrice(prices.segundoPago, language)} antes del ${data.segundoPagoFecha}, y el saldo se cancela durante el retiro. Quedan ${data.cupos} lugares y las inscripciones cierran el ${data.fechaLimiteInscripcion}, así que te recomendamos escribirnos por WhatsApp cuanto antes.`,
  },
  {
    Icon: PawPrintIcon,
    question: '¿Puedo llevar a mi mascota?',
    answer: 'No, por el momento no aceptamos mascotas: en el campo hay animales de granja cerca y no contamos con instalaciones adecuadas para recibirlas.',
  },
  {
    Icon: WheelchairIcon,
    question: '¿Tienen accesibilidad para sillas de ruedas?',
    answer: 'Por el momento no contamos con rampas ni espacios especialmente preparados para sillas de ruedas. Si tenés dudas puntuales sobre accesibilidad, escribinos por WhatsApp y lo vemos juntos.',
  },
  ];
}

const CicloVitalFemeninoFAQ: React.FC = () => {
  const { language } = useLanguage();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const faqs = getFaqs(language);

  const toggle = (index: number) => setActiveIndex(activeIndex === index ? null : index);

  return (
    <section className="py-16 md:py-24 px-6" style={{ background: '#FAF5EE' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-12" data-reveal>
          <p className="text-[#AA3E11] text-[10px] tracking-[0.4em] uppercase font-bold mb-4">Dudas frecuentes</p>
          <h2 className="text-3xl md:text-5xl serif-title brand-green mb-4">Preguntas Frecuentes</h2>
          <p className="text-gray-500 text-base md:text-lg font-light">Todo lo que necesitás saber antes de sumarte al encuentro.</p>
        </div>

        <div className="space-y-3 md:space-y-4">
          {faqs.map((faq, index) => {
            const isActive = activeIndex === index;
            const Icon = faq.Icon;

            return (
              <div key={index} data-reveal>
                <div
                  className={`bg-white rounded-2xl border transition-colors duration-300 overflow-hidden ${
                    isActive ? 'border-[#AA3E11] shadow-md' : 'border-gray-100 hover:border-gray-200 shadow-sm'
                  }`}
                >
                  <button
                    className="w-full text-left px-6 py-5 md:px-8 md:py-6 flex items-center gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005333]/40"
                    onClick={() => toggle(index)}
                    aria-expanded={isActive}
                  >
                    <span className={`flex-shrink-0 transition-colors duration-300 ${isActive ? 'text-[#005333]' : 'text-[#005333]/30'}`}>
                      <Icon weight="light" className="w-5 h-5" aria-hidden="true" />
                    </span>

                    <h3 className={`flex-1 serif-title text-base md:text-lg leading-snug transition-colors duration-300 ${isActive ? 'text-[#005333]' : 'text-gray-800'}`}>
                      {faq.question}
                    </h3>

                    <span
                      className={`flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-[transform,background-color,color] duration-300 ${
                        isActive ? 'bg-[#005333] text-[#E88A5C] rotate-180' : 'bg-gray-100 text-[#005333]'
                      }`}
                      aria-hidden="true"
                    >
                      <CaretDownIcon weight="bold" className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </span>
                  </button>

                  <div
                    className="transition-all duration-500 ease-in-out overflow-hidden"
                    style={{
                      display: 'grid',
                      gridTemplateRows: isActive ? '1fr' : '0fr',
                      opacity: isActive ? 1 : 0,
                    }}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="pl-[3.75rem] pr-6 md:pl-[4.5rem] md:pr-8 pb-6 md:pb-7 pt-1">
                        <div className="w-full h-px bg-gray-100 mb-5"></div>
                        <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CicloVitalFemeninoFAQ;
