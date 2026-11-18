import React, { useEffect, useRef, useState } from 'react';
import { Sprout } from 'lucide-react';

export type PageNavigationItem = {
  id: string;
  label: string;
};

export type PageNavigation = {
  ariaLabel: string;
  pageEyebrow: string;
  pageTitle: string;
  sections: PageNavigationItem[];
};

type PageSectionNavProps = {
  navigation?: PageNavigation;
  autoDiscover?: boolean;
  locale?: 'es' | 'en';
  minimumSections?: number;
  syncHashOnScroll?: boolean;
  onAvailabilityChange?: (isAvailable: boolean) => void;
};

const formatIndex = (value: number) => String(value).padStart(2, '0');

const shortenLabel = (value: string) => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= 34) return normalized;
  const shortened = normalized.slice(0, 34).replace(/\s+\S*$/, '').trim();
  return `${shortened || normalized.slice(0, 31)}…`;
};

const readElementLabel = (element: HTMLElement | null) => {
  if (!element) return '';
  const lines = (element.innerText || element.textContent || '')
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  return lines[0] || '';
};

const createSemanticSlug = (label: string) => {
  const slug = label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  if (slug.length <= 64) return slug;

  const truncated = slug.slice(0, 64);
  const lastCompleteWord = truncated.lastIndexOf('-');
  return (lastCompleteWord >= 32 ? truncated.slice(0, lastCompleteWord) : truncated)
    .replace(/-+$/g, '');
};

const createSectionId = (label: string, section: HTMLElement, claimedIds: Set<string>) => {
  const baseId = createSemanticSlug(label) || 'contenido';
  let candidate = baseId;

  while (
    claimedIds.has(candidate)
    || (document.getElementById(candidate) && document.getElementById(candidate) !== section)
  ) {
    candidate = `${candidate}-detalle`;
  }

  claimedIds.add(candidate);
  return candidate;
};

export const PageSectionNav: React.FC<PageSectionNavProps> = ({
  navigation,
  autoDiscover = false,
  locale = 'es',
  minimumSections = 5,
  syncHashOnScroll = true,
  onAvailabilityChange,
}) => {
  const [discoveredNavigation, setDiscoveredNavigation] = useState<PageNavigation | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const tabRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const programmaticTargetRef = useRef<number | null>(null);
  const scrollEndTimeoutRef = useRef<number | null>(null);
  const pendingInitialHashRef = useRef(window.location.hash.substring(1));
  const resolvedNavigation = navigation || discoveredNavigation;

  const scrollSectionBelowHeader = (section: HTMLElement, behavior: ScrollBehavior | 'instant' = 'smooth') => {
    const mainHeaderBottom = document.querySelector<HTMLElement>('[data-header-main-row]')?.getBoundingClientRect().bottom
      || document.querySelector('header')?.getBoundingClientRect().bottom
      || 0;
    const targetTop = window.scrollY + section.getBoundingClientRect().top - mainHeaderBottom;
    const scrollTop = Math.max(0, targetTop);

    if (behavior === 'instant') {
      const root = document.documentElement;
      const previousScrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      root.getBoundingClientRect();
      window.scrollTo({ top: scrollTop, behavior: 'auto' });
      window.requestAnimationFrame(() => {
        root.style.scrollBehavior = previousScrollBehavior;
      });
      return;
    }

    window.scrollTo({ top: scrollTop, behavior });
  };

  useEffect(() => {
    if (!autoDiscover || navigation) {
      setDiscoveredNavigation(null);
      onAvailabilityChange?.(Boolean(navigation && navigation.sections.length >= minimumSections));
      return;
    }

    const discover = () => {
      const pageRoot = document.querySelector('main') || document.querySelector('header')?.parentElement;
      if (!pageRoot) {
        setDiscoveredNavigation(null);
        onAvailabilityChange?.(false);
        return;
      }

      const topLevelSections = Array.from(pageRoot.querySelectorAll<HTMLElement>('section'))
        .filter(section => !section.parentElement?.closest('section') && section.getAttribute('role') !== 'dialog');
      const contentSections = topLevelSections[0]?.querySelector('h1')
        ? topLevelSections.slice(1)
        : topLevelSections;

      const claimedIds = new Set<string>();
      const sections = contentSections.flatMap(section => {
        const heading = section.querySelector<HTMLElement>('[data-nav-label], h2, h3');
        const fullLabel = section.dataset.navLabel || readElementLabel(heading);
        if (!fullLabel) return [];

        const label = shortenLabel(fullLabel);
        if (!section.id) {
          section.id = createSectionId(fullLabel, section, claimedIds);
        } else {
          claimedIds.add(section.id);
        }

        return [{ id: section.id, label }];
      });

      if (sections.length < minimumSections) {
        setDiscoveredNavigation(null);
        onAvailabilityChange?.(false);
        return;
      }

      const pageHeading = pageRoot.querySelector<HTMLElement>('h1');
      const pageTitle = shortenLabel(readElementLabel(pageHeading) || (locale === 'es' ? 'Página' : 'Page'));
      setDiscoveredNavigation({
        ariaLabel: locale === 'es' ? 'Navegación de esta página' : 'On this page',
        pageEyebrow: locale === 'es' ? 'Página' : 'Page',
        pageTitle,
        sections,
      });
      onAvailabilityChange?.(true);
    };

    const frame = window.requestAnimationFrame(discover);
    return () => window.cancelAnimationFrame(frame);
  }, [autoDiscover, locale, minimumSections, navigation, onAvailabilityChange]);

  useEffect(() => {
    if (!resolvedNavigation) return;

    const updateActiveSection = () => {
      if (programmaticTargetRef.current !== null) {
        setActiveIndex(programmaticTargetRef.current);
        return;
      }

      if (pendingInitialHashRef.current) {
        const pendingIndex = resolvedNavigation.sections.findIndex(item => item.id === pendingInitialHashRef.current);
        if (pendingIndex >= 0) {
          setActiveIndex(pendingIndex);
          return;
        }
        pendingInitialHashRef.current = '';
      }

      const mainHeader = document.querySelector<HTMLElement>('[data-header-main-row]');
      const marker = (mainHeader?.getBoundingClientRect().bottom || 0) + 32;
      let nextIndex = -1;

      resolvedNavigation.sections.forEach((item, index) => {
        const section = document.getElementById(item.id);
        if (section && section.getBoundingClientRect().top <= marker) nextIndex = index;
      });

      setActiveIndex(nextIndex);
      const nextHash = nextIndex >= 0 ? `#${resolvedNavigation.sections[nextIndex].id}` : '';
      if (syncHashOnScroll && window.location.hash !== nextHash) {
        const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
        window.history.replaceState(window.history.state, '', nextUrl);
      }
    };

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);

    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
      if (scrollEndTimeoutRef.current !== null) window.clearTimeout(scrollEndTimeoutRef.current);
    };
  }, [resolvedNavigation, syncHashOnScroll]);

  useEffect(() => {
    if (!resolvedNavigation) return;
    const targetId = window.location.hash.substring(1);
    if (!targetId) return;

    const targetIndex = resolvedNavigation.sections.findIndex(item => item.id === targetId);
    const section = document.getElementById(targetId);
    if (targetIndex < 0 || !section) return;

    programmaticTargetRef.current = targetIndex;
    setActiveIndex(targetIndex);
    const firstFrame = window.requestAnimationFrame(() => scrollSectionBelowHeader(section));
    const settledLayout = window.setTimeout(() => {
      scrollSectionBelowHeader(section, 'instant');
      setActiveIndex(targetIndex);
      const targetHash = `#${targetId}`;
      if (window.location.hash !== targetHash) {
        window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}${targetHash}`);
      }
      programmaticTargetRef.current = null;
      pendingInitialHashRef.current = '';
    }, 1100);

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.clearTimeout(settledLayout);
      programmaticTargetRef.current = null;
    };
  }, [resolvedNavigation]);

  useEffect(() => {
    if (!resolvedNavigation) return;

    const handleHistoryNavigation = () => {
      const targetId = window.location.hash.substring(1);
      if (scrollEndTimeoutRef.current !== null) window.clearTimeout(scrollEndTimeoutRef.current);

      if (!targetId) {
        programmaticTargetRef.current = -1;
        setActiveIndex(-1);
        scrollEndTimeoutRef.current = window.setTimeout(() => {
          programmaticTargetRef.current = null;
          scrollEndTimeoutRef.current = null;
        }, 500);
        return;
      }

      const targetIndex = resolvedNavigation.sections.findIndex(item => item.id === targetId);
      const section = document.getElementById(targetId);
      if (targetIndex < 0 || !section) return;

      programmaticTargetRef.current = targetIndex;
      pendingInitialHashRef.current = '';
      setActiveIndex(targetIndex);
      window.requestAnimationFrame(() => scrollSectionBelowHeader(section));
      scrollEndTimeoutRef.current = window.setTimeout(() => {
        scrollSectionBelowHeader(section, 'instant');
        setActiveIndex(targetIndex);
        programmaticTargetRef.current = null;
        scrollEndTimeoutRef.current = null;
      }, 1100);
    };

    window.addEventListener('popstate', handleHistoryNavigation);
    return () => window.removeEventListener('popstate', handleHistoryNavigation);
  }, [resolvedNavigation]);

  useEffect(() => {
    if (activeIndex < 0) return;
    const container = scrollContainerRef.current;
    const tab = tabRefs.current[activeIndex];
    if (!container || !tab) return;

    const containerRect = container.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    const centeredLeft = container.scrollLeft
      + (tabRect.left - containerRect.left)
      - ((container.clientWidth - tabRect.width) / 2);
    container.scrollTo({ left: Math.max(0, centeredLeft), behavior: 'smooth' });
  }, [activeIndex]);

  if (!resolvedNavigation) return null;

  const progress = activeIndex >= 0 && resolvedNavigation.sections.length > 0
    ? ((activeIndex + 1) / resolvedNavigation.sections.length) * 100
    : 0;

  const handleNavigation = (event: React.MouseEvent<HTMLAnchorElement>, item: PageNavigationItem) => {
    event.preventDefault();
    const section = document.getElementById(item.id);
    if (!section) return;

    const itemIndex = resolvedNavigation.sections.findIndex(sectionItem => sectionItem.id === item.id);
    programmaticTargetRef.current = itemIndex;
    pendingInitialHashRef.current = '';
    setActiveIndex(itemIndex);
    scrollSectionBelowHeader(section);

    if (scrollEndTimeoutRef.current !== null) window.clearTimeout(scrollEndTimeoutRef.current);
    scrollEndTimeoutRef.current = window.setTimeout(() => {
      scrollSectionBelowHeader(section, 'instant');
      setActiveIndex(itemIndex);
      const targetHash = `#${item.id}`;
      if (window.location.hash !== targetHash) {
        window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}${targetHash}`);
      }
      programmaticTargetRef.current = null;
      scrollEndTimeoutRef.current = null;
    }, 1100);
    window.history.pushState(window.history.state, '', `#${item.id}`);
  };

  const handleHorizontalWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    if (!container || container.scrollWidth <= container.clientWidth) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    container.scrollBy({ left: event.deltaY, behavior: 'smooth' });
  };

  return (
    <div className="w-full min-w-0 max-w-full">
      <nav aria-label={resolvedNavigation.ariaLabel} className="w-full min-w-0 max-w-full overflow-hidden">
        <div className="flex min-h-[50px] w-full min-w-0 max-w-full items-stretch lg:min-h-[56px]">
          <div className="relative flex shrink-0 items-center gap-3 px-3 md:px-5 lg:min-w-[185px] after:absolute after:inset-y-2.5 after:right-0 after:w-px after:bg-brand/10">
            <Sprout className="text-brand" size={23} strokeWidth={1.7} aria-hidden="true" />
            <div className="hidden sm:block">
              <p className="mb-0.5 text-[8px] font-bold uppercase leading-none tracking-[0.15em] text-dark/45">{resolvedNavigation.pageEyebrow}</p>
              <p className="max-w-[150px] truncate font-serif text-base leading-none text-dark">{resolvedNavigation.pageTitle}</p>
            </div>
          </div>

          <div ref={scrollContainerRef} className="min-w-0 flex-1 touch-pan-x overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" onWheel={handleHorizontalWheel} tabIndex={0}>
            <div className="flex h-full min-w-max items-stretch px-2 md:px-2.5">
              {resolvedNavigation.sections.map((item, index) => {
                const isActive = index === activeIndex;
                return (
                  <a key={item.id} ref={element => { tabRefs.current[index] = element; }} href={`#${item.id}`} onClick={event => handleNavigation(event, item)} aria-current={isActive ? 'location' : undefined} className={`flex items-center whitespace-nowrap px-2.5 text-[11px] transition-colors md:px-3 md:text-xs ${isActive ? 'font-medium text-brand' : 'text-dark/65 hover:text-brand'}`}>
                    <span className={`rounded-lg px-2 py-2 transition-[background-color,color] duration-300 ease-out ${isActive ? 'bg-[#F5F0E4]' : 'bg-transparent'}`}>
                      <span className={`relative after:absolute after:-bottom-3 after:inset-x-0 after:h-0.5 after:origin-center after:rounded-full after:bg-gold after:transition-transform after:duration-300 after:ease-out ${isActive ? 'after:scale-x-100' : 'after:scale-x-0'}`}>{item.label}</span>
                    </span>
                  </a>
                );
              })}
            </div>
          </div>

          <div className="hidden w-[92px] shrink-0 flex-col justify-center border-l border-brand/10 px-4 xl:flex">
            <p className="mb-1 text-center text-[10px] leading-none tracking-[0.1em] text-dark/55">{formatIndex(Math.max(0, activeIndex + 1))} <span className="text-dark/25">/</span> {formatIndex(resolvedNavigation.sections.length)}</p>
            <div className="h-0.5 overflow-hidden rounded-full bg-brand/10"><div className="h-full rounded-full bg-gold transition-[width] duration-500" style={{ width: `${progress}%` }} /></div>
          </div>
        </div>
      </nav>
    </div>
  );
};
