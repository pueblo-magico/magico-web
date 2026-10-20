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
  ariaLabel?: string;
  keepScrollableOnDesktop?: boolean;
  showArrowsOnDesktop?: boolean;
  inverseArrows?: boolean;
  arrowPositionClassName?: string;
};

export const HorizontalCardRail: React.FC<HorizontalCardRailProps> = ({
  children,
  previousLabel,
  nextLabel,
  desktopGridClassName = 'md:grid-cols-3',
  mobileItemClassName = 'w-[85vw]',
  gapClassName = 'gap-4 md:gap-8',
  className = '',
  ariaLabel,
  keepScrollableOnDesktop = false,
  showArrowsOnDesktop = false,
  inverseArrows = false,
  arrowPositionClassName = 'top-1/2',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const items = React.Children.toArray(children);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cards = Array.from(container.querySelectorAll<HTMLElement>('[data-horizontal-card-item]'));
    if (!cards.length) return;

    const maximumScroll = Math.max(0, container.scrollWidth - container.clientWidth);
    const alignToStart = keepScrollableOnDesktop && window.matchMedia('(min-width: 768px)').matches;
    const firstOffset = cards[0].offsetLeft;
    const snapPositions = cards.map((card) => {
      const centeredPosition = card.offsetLeft - (container.clientWidth - card.offsetWidth) / 2;
      const targetPosition = alignToStart ? card.offsetLeft - firstOffset : centeredPosition;
      return Math.min(maximumScroll, Math.max(0, targetPosition));
    });
    const currentIndex = snapPositions.reduce((closestIndex, position, index) => (
      Math.abs(position - container.scrollLeft) < Math.abs(snapPositions[closestIndex] - container.scrollLeft)
        ? index
        : closestIndex
    ), 0);
    const targetIndex = Math.min(
      cards.length - 1,
      Math.max(0, currentIndex + (direction === 'left' ? -1 : 1)),
    );

    container.scrollTo({
      left: snapPositions[targetIndex],
      behavior: 'smooth',
    });
  };

  const arrowVisibilityClassName = showArrowsOnDesktop ? '' : 'md:hidden';
  const arrowColorClassName = inverseArrows
    ? 'border-white/25 bg-[#FFFDF5]/95 text-[#003A34] hover:bg-[#FFD166]'
    : 'border-brand/10 bg-white/95 text-brand hover:border-[#FF6A00] hover:bg-[#FFF6E3]';
  const desktopLayoutClassName = keepScrollableOnDesktop
    ? 'md:-mx-10 md:flex md:scroll-px-10 md:px-10 md:pb-4'
    : `md:mx-0 md:grid md:px-0 md:pb-0 ${desktopGridClassName}`;

  return (
    <div className={`relative ${className}`}>
      {items.length > 1 && (
        <>
          <button type="button" onClick={() => scroll('left')} className={`absolute left-0 z-20 -ml-2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border shadow-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF6A00] ${arrowPositionClassName} ${arrowVisibilityClassName} ${arrowColorClassName}`} aria-label={previousLabel}>
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => scroll('right')} className={`absolute right-0 z-20 -mr-2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border shadow-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF6A00] ${arrowPositionClassName} ${arrowVisibilityClassName} ${arrowColorClassName}`} aria-label={nextLabel}>
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </>
      )}

      <div
        ref={scrollContainerRef}
        aria-label={ariaLabel}
        className={`scrollbar-hide -mx-6 flex touch-pan-x touch-pan-y snap-x snap-mandatory scroll-px-6 overflow-x-auto overflow-y-hidden overscroll-x-contain px-6 pb-8 ${desktopLayoutClassName} ${gapClassName}`}
      >
        {items.map((item, index) => (
          <div
            key={(item as React.ReactElement).key || index}
            data-horizontal-card-item
            className={`${mobileItemClassName} h-auto shrink-0 snap-center ${keepScrollableOnDesktop ? 'md:snap-start' : 'md:w-auto md:min-w-0'}`}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};
