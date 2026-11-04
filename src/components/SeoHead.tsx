import { useEffect } from 'react';
import { SITE_URL } from '../data/config';

type SeoHeadProps = {
  title: string;
  description: string;
  path: string;
  image?: string;
  schema?: Record<string, unknown>;
};

export const SeoHead = ({ title, description, path, image = '/uploads/img_6948.webp', schema }: SeoHeadProps) => {
  useEffect(() => {
    const url = `${SITE_URL}${path}`;
    const imageUrl = image.startsWith('http') ? image : `${SITE_URL}${image}`;
    const previousTitle = document.title;

    const setMeta = (selector: string, attribute: 'name' | 'property', key: string, value: string) => {
      let element = document.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', value);
    };

    const setCanonical = () => {
      let element = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!element) {
        element = document.createElement('link');
        element.rel = 'canonical';
        document.head.appendChild(element);
      }
      element.href = url;
    };

    document.title = title;
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:image"]', 'property', 'og:image', imageUrl);
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', imageUrl);
    setCanonical();

    const schemaElement = document.createElement('script');
    schemaElement.type = 'application/ld+json';
    schemaElement.dataset.journeySeo = 'true';
    schemaElement.textContent = JSON.stringify(schema || {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description,
      url,
      isPartOf: { '@type': 'WebSite', name: 'Pueblo Mágico', url: SITE_URL },
    });
    document.head.appendChild(schemaElement);

    return () => {
      document.title = previousTitle;
      schemaElement.remove();
    };
  }, [description, image, path, schema, title]);

  return null;
};
