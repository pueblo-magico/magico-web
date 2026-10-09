import React from 'react';
import { ChevronDown } from 'lucide-react';

// Botón "Ver más / Ver menos" para plegar contenido secundario y acortar páginas largas.
// Ojo: lo que aparece al expandir NO debe llevar data-reveal (el IntersectionObserver ya corrió y quedaría invisible);
// poner data-reveal en el contenedor de la lista, no en cada ítem.
export const ShowMoreButton: React.FC<{
  open: boolean;
  onToggle: () => void;
  moreLabel: string;
  lessLabel: string;
  controls: string;
  hiddenCount?: number;
  tone?: 'light' | 'dark';
  className?: string;
}> = ({ open, onToggle, moreLabel, lessLabel, controls, hiddenCount, tone = 'light', className = '' }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-expanded={open}
    aria-controls={controls}
    className={`inline-flex items-center gap-2 rounded-full border px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
      tone === 'dark'
        ? 'border-white/30 text-white hover:bg-white hover:text-[#005333]'
        : 'border-[#005333]/20 text-[#005333] hover:border-[#005333] hover:bg-[#005333] hover:text-white'
    } ${className}`}
  >
    {open ? lessLabel : hiddenCount ? `${moreLabel} (+${hiddenCount})` : moreLabel}
    <ChevronDown size={16} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
  </button>
);
