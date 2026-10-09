import React, { useState } from 'react';
import { CaretDownIcon, MagnifyingGlassIcon, PersonSimpleHikeIcon, CloudRainIcon, HouseIcon, CarIcon, PawPrintIcon, WheelchairIcon } from '@phosphor-icons/react';

const faqs = [
  {
    Icon: MagnifyingGlassIcon,
    question: "¿Necesito tener conocimientos previos o equipo profesional?",
    answer: "No hace falta experiencia previa. La propuesta es multinivel y está pensada para que aprendas Desde cero o profundices tus conocimientos. Solo necesitás curiosidad. Si tenés binoculares o cámara de fotos, traelos, pero no son excluyentes para disfrutar."
  },
  {
    Icon: PersonSimpleHikeIcon,
    question: "¿Es una experiencia de alta exigencia física?",
    answer: "No. Es un retiro de inmersión contemplativa. Haremos caminatas de baja y media dificultad por senderos serranos con pausas constantes para observar y aprender, apto para cualquier persona con un estado físico promedio."
  },
  {
    Icon: CloudRainIcon,
    question: "¿Qué pasa si está nublado y no se ven las estrellas?",
    answer: "Si bien la noche de Astroturismo es mágica con cielo despejado, si las nubes no nos dejan ver las estrellas adaptamos la experiencia. Realizamos una charla inmersiva sobre el cosmos, proyecciones interactivas y un fogón con historias bajo el techo de nuestro Octógono."
  },
  {
    Icon: HouseIcon,
    question: "¿Está incluido todo el equipamiento?",
    answer: "Tu estadía en el Refugio de Piedra incluye la ropa de cama (sábanas y mantas cálidas) y todas las comidas de la estadía. Solo necesitás traer tu mochila personal, ropa cómoda, buen calzado de trekking y abrigo, ya que en la sierra la temperatura baja por la noche. Tenemos opciones sin gluten y podemos garantizar platos que no llevan gluten entre sus ingredientes, pero no un ambiente 100% libre de contaminación cruzada (cocinamos en una cocina y mesada compartida) — para celiaquía severa o intolerancia alta, contanos tu caso al reservar."
  },
  {
    Icon: CarIcon,
    question: "¿Se puede llegar en vehículo normal o auto bajo?",
    answer: "Sí, el camino de acceso de ripio (aprox. 50km Desde Tanti) está mantenido y es apto para vehículos estándar. Al momento de confirmar tu reserva, te enviamos las indicaciones precisas y el punto GPS para que llegues sin problemas."
  },
  {
    Icon: PawPrintIcon,
    question: "¿Puedo llevar a mi mascota?",
    answer: "No, por el momento no aceptamos mascotas: en el campo hay animales de granja cerca y no contamos con instalaciones adecuadas para recibirlas."
  },
  {
    Icon: WheelchairIcon,
    question: "¿Tienen accesibilidad para sillas de ruedas?",
    answer: "Por el momento no contamos con rampas ni espacios especialmente preparados para sillas de ruedas. Si tenés dudas puntuales sobre accesibilidad, escribinos por WhatsApp y lo vemos juntos."
  }
];

const AchalaVivaFAQ: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggle = (index: number) => setActiveIndex(activeIndex === index ? null : index);

  return (
    <section className="py-16 md:py-24 px-6 bg-[#FAF9F5]">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12" data-reveal>
          <h2 className="text-3xl md:text-5xl serif-title brand-green mb-4">Preguntas Frecuentes</h2>
          <p className="text-gray-500 text-base md:text-lg font-light">Todo lo que necesitás saber antes de tu inmersión natural.</p>
        </div>

        <div className="space-y-3 md:space-y-4">
          {faqs.map((faq, index) => {
            const isActive = activeIndex === index;
            const Icon = faq.Icon;

            return (
              <div key={index} data-reveal>
                <div
                  className={`bg-white rounded-2xl border transition-colors duration-300 overflow-hidden ${
                    isActive ? 'border-[#D4AF37] shadow-md' : 'border-gray-100 hover:border-gray-200 shadow-sm'
                  }`}
                >
                  <button
                    className="w-full text-left px-6 py-5 md:px-8 md:py-6 flex items-center gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005333]/40"
                    onClick={() => toggle(index)}
                    aria-expanded={isActive}
                  >
                    {/* Contextual icon */}
                    <span className={`flex-shrink-0 transition-colors duration-300 ${isActive ? 'text-[#005333]' : 'text-[#005333]/30'}`}>
                      <Icon weight="light" className="w-5 h-5" aria-hidden="true" />
                    </span>

                    <h3 className={`flex-1 serif-title text-base md:text-lg leading-snug transition-colors duration-300 ${isActive ? 'text-[#005333]' : 'text-gray-800'}`}>
                      {faq.question}
                    </h3>

                    {/* Chevron */}
                    <span
                      className={`flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-[transform,background-color,color] duration-300 ${
                        isActive ? 'bg-[#005333] text-[#D4AF37] rotate-180' : 'bg-gray-100 text-[#005333]'
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
                      opacity: isActive ? 1 : 0
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

export default AchalaVivaFAQ;
