import { useEffect } from 'react';

const PRIVATE_ROBOTS = 'noindex, nofollow, noarchive, nosnippet';
const PUBLIC_SEO_SELECTOR = [
  'meta[name="description"]',
  'meta[name^="twitter:"]',
  'meta[property^="og:"]',
  'link[rel="canonical"]',
  'script[type="application/ld+json"]',
].join(',');

export function usePrivateProposalMeta(title: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const removedPublicSeo = Array.from(document.head.querySelectorAll(PUBLIC_SEO_SELECTOR));
    removedPublicSeo.forEach(node => node.remove());

    const privateMeta = [
      { name: 'robots', content: PRIVATE_ROBOTS },
      { name: 'googlebot', content: PRIVATE_ROBOTS },
      { name: 'referrer', content: 'no-referrer' },
    ].map(({ name, content }) => {
      const existing = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
      const previousContent = existing?.content;
      const element = existing || document.createElement('meta');
      element.name = name;
      element.content = content;
      if (!existing) document.head.appendChild(element);
      return { element, existed: Boolean(existing), previousContent };
    });

    return () => {
      document.title = previousTitle;
      privateMeta.forEach(({ element, existed, previousContent }) => {
        if (existed) element.content = previousContent || '';
        else element.remove();
      });
      removedPublicSeo.forEach(node => document.head.appendChild(node));
    };
  }, [title]);
}
