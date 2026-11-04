import { useEffect } from 'react';

type JourneyEventDetail = {
  event: 'journey_click';
  journeyEvent: string;
  href: string;
  label: string;
  sourcePath: string;
};

/**
 * Privacy-safe journey instrumentation. The site remains functional without an
 * analytics provider; when a dataLayer is present the same event is forwarded
 * to it, and a DOM event is always emitted for QA and future integrations.
 */
export const JourneyAnalytics = () => {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>('[data-journey-event], a[href*="wa.me"], a[href*="api.whatsapp.com"]')
        : null;
      if (!target) return;

      const detail: JourneyEventDetail = {
        event: 'journey_click',
        journeyEvent: target.dataset.journeyEvent || 'whatsapp_inquiry',
        href: target.getAttribute('href') || '',
        label: (target.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120),
        sourcePath: window.location.pathname,
      };

      window.dispatchEvent(new CustomEvent<JourneyEventDetail>('pueblo:journey', { detail }));
      const analyticsWindow = window as Window & { dataLayer?: JourneyEventDetail[] };
      analyticsWindow.dataLayer?.push(detail);
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
};
