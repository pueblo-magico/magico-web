import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// Bloque de ONG aliadas compartido entre /empresas y /reforestacion (data: t.aliados).
// Logos en blanco sobre verde (public/uploads/aliados). Acción Ambiental no
// publica versión blanca: la suya es una versión de dos tonos generada a partir
// del isologo, con el árbol translúcido para que la "A" se siga leyendo — no
// aplicar brightness/invert, la aplanaría. Si una organización no tiene logo
// (p. ej. Consciencia Nativa), se muestra su nombre en tipografía serif.
export const AliadosAmbientales: React.FC = () => {
  const { t } = useLanguage();
  const a = t.aliados;

  return (
    <div className="rounded-3xl bg-[#005333] px-6 py-10 md:px-12 md:py-12">
      <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.25em] text-center mb-8">
        {a.title}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-8 items-start">
        {a.items.map((ally: any) => {
          const content = (
            <>
              <span className="h-16 md:h-20 w-full flex items-center justify-center mb-4">
                {ally.logo ? (
                  <img
                    src={ally.logo}
                    alt={ally.name}
                    loading="lazy"
                    className="max-h-full max-w-[180px] w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                ) : (
                  <span className="serif-title text-white text-2xl md:text-3xl leading-tight">{ally.name}</span>
                )}
              </span>
              <span className="text-white/70 text-sm leading-relaxed font-light max-w-[260px]">{ally.text}</span>
            </>
          );
          return ally.url ? (
            <a
              key={ally.name}
              href={ally.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center text-center"
            >
              {content}
            </a>
          ) : (
            <div key={ally.name} className="flex flex-col items-center text-center">
              {content}
            </div>
          );
        })}
      </div>
      {a.note && (
        <p className="text-white/60 text-sm leading-relaxed font-light italic text-center max-w-2xl mx-auto mt-10 pt-6 border-t border-white/10">
          {a.note}
        </p>
      )}
    </div>
  );
};
