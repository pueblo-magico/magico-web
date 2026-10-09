import React, { useState } from 'react';
import { CaretDownIcon, BowlFoodIcon, TreeEvergreenIcon, WrenchIcon, UsersThreeIcon, HouseIcon, PawPrintIcon, WheelchairIcon } from '@phosphor-icons/react';

const faqs = [
  {
    Icon: BowlFoodIcon,
    question: "¿Necesito fuerza física especial para desbastar o tensar el arco?",
    answer: "Para nada. El taller está diseñado paso a paso y te enseñaremos la técnica correcta de desbaste, que requiere más paciencia y método que fuerza bruta. Los arcos además se adaptan y calibran a la contextura y libraje ideal de cada participante."
  },
  {
    Icon: TreeEvergreenIcon,
    question: "¿Me llevo el arco terminado?",
    answer: "¡Sí! El objetivo de la inmersión es que termines el taller disparando las primeras flechas con tu propio arco artesanal, que luego te llevarás a casa como tu compañero de aventuras para seguir practicando."
  },
  {
    Icon: WrenchIcon,
    question: "¿Necesito llevar herramientas o materiales?",
    answer: "No es necesario. Gondorbows provee todos los materiales, los vástagos de madera seleccionados y el set completo de herramientas tradicionales (bastrenes, escofinas, lijas, formones) para cada uno."
  },
  {
    Icon: UsersThreeIcon,
    question: "¿Puedo participar si nunca toqué un arco en mi vida?",
    answer: "Completamente. Es un taller multinivel. Recibirás acompañamiento personalizado tanto si es tu primera vez acercándote a la arquería como si ya tenés experiencia y querés perfeccionar tu técnica de forja."
  },
  {
    Icon: HouseIcon,
    question: "¿Cómo es el alojamiento y la comida?",
    answer: "La estadía incluye alojamiento en Domos Geodésicos o en el Refugio de Piedra (compartido) con ropa de cama y abrigo, duchas con agua caliente 24hs y todas las comidas caseras (desayuno, almuerzo, merienda y cena) incluidas durante los tres días. Tenemos opciones sin gluten y podemos garantizar platos que no llevan gluten entre sus ingredientes, pero no un ambiente 100% libre de contaminación cruzada (cocinamos en una cocina y mesada compartida) — para celiaquía severa o intolerancia alta, contanos tu caso al reservar."
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

const GondorbowsFAQ: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggle = (index: number) => setActiveIndex(activeIndex === index ? null : index);

  return (
    <section className="py-16 md:py-24 px-6 bg-slate-50">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12" data-reveal>
          <h2 className="text-3xl md:text-5xl serif-title brand-green mb-4">Preguntas Frecuentes</h2>
          <p className="text-gray-500 text-base md:text-lg font-light">Resolvé todas tus dudas antes de empezar tu camino.</p>
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

export default GondorbowsFAQ;
