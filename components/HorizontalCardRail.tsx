import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type HorizontalCardRailProps = {
  children: React.ReactNode;
  previousLabel: string;
  nextLabel: string;
  desktopGridClassName?: string;
  mobileItemClassName?: string;
  gapClassName?: string;
  className?: string;
};

export const HorizontalCardRail: React.FC<HorizontalCardRailProps> = ({
  children,
  previousLabel,
  nextLabel,
  desktopGridClassName = 'md:grid-cols-3',
  mobileItemClassName = 'w-[85vw]',
  gapClassName = 'gap-4 md:gap-8',
  className = '',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const items = React.Children.toArray(children);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({
      left: direction === 'left' ? -container.clientWidth * 0.8 : container.clientWidth * 0.8,
      behavior: 'smooth',
    });
  };

  return (
    <div className={`relative ${className}`}>
      {items.length > 1 && (
        <>
          <button type="button" onClick={() => scroll('left')} className="absolute left-0 top-1/2 z-10 -ml-2 -translate-y-1/2 rounded-full border border-brand/10 bg-white/95 p-2 text-brand shadow-lg md:hidden" aria-label={previousLabel}>
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => scroll('right')} className="absolute right-0 top-1/2 z-10 -mr-2 -translate-y-1/2 rounded-full border border-brand/10 bg-white/95 p-2 text-brand shadow-lg md:hidden" aria-label={nextLabel}>
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </>
      )}

      <div ref={scrollContainerRef} className={`scrollbar-hide -mx-6 flex snap-x snap-mandatory overflow-x-auto px-6 pb-8 md:mx-0 md:grid md:px-0 md:pb-0 ${desktopGridClassName} ${gapClassName}`}>
        {items.map((item, index) => (
          <div key={(item as React.ReactElement).key || index} className={`${mobileItemClassName} h-auto shrink-0 snap-center md:w-auto md:min-w-0`}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};
