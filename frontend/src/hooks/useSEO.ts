import { useEffect } from 'react';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  siteName?: string;
  structuredData?: object;
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

const DEFAULT_TITLE = 'ACBMarket - Philippine Prediction Market';
const DEFAULT_DESCRIPTION = 'ACBMarket is a Philippine prediction market platform where users can make forecasts on various events using virtual chips. Join the community and test your prediction skills!';
const DEFAULT_KEYWORDS = 'prediction market, Philippines, forecasting, virtual chips, ACBMarket, prediction platform, market predictions, Philippine events';
const DEFAULT_IMAGE = '/logo.png';
const DEFAULT_SITE_NAME = 'ACBMarket';
const BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

export const useSEO = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  siteName = DEFAULT_SITE_NAME,
  structuredData,
  canonical,
  noindex = false,
  nofollow = false,
}: SEOProps) => {
  useEffect(() => {
    // Set document title
    const fullTitle = title ? `${title} | ${DEFAULT_SITE_NAME}` : DEFAULT_TITLE;
    document.title = fullTitle;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, attribute: 'name' | 'property' = 'name') => {
      const selector = attribute === 'name' 
        ? `meta[name="${name}"]` 
        : `meta[property="${name}"]`;
      
      let meta = document.querySelector(selector) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        if (attribute === 'name') {
          meta.setAttribute('name', name);
        } else {
          meta.setAttribute('property', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', description || DEFAULT_DESCRIPTION);
    if (keywords) {
      updateMetaTag('keywords', keywords);
    }

    // Open Graph tags
    updateMetaTag('og:title', fullTitle, 'property');
    updateMetaTag('og:description', description || DEFAULT_DESCRIPTION, 'property');
    updateMetaTag('og:image', image || `${BASE_URL}${DEFAULT_IMAGE}`, 'property');
    updateMetaTag('og:url', url || (typeof window !== 'undefined' ? window.location.href : ''), 'property');
    updateMetaTag('og:type', type, 'property');
    updateMetaTag('og:site_name', siteName, 'property');

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', fullTitle);
    updateMetaTag('twitter:description', description || DEFAULT_DESCRIPTION);
    updateMetaTag('twitter:image', image || `${BASE_URL}${DEFAULT_IMAGE}`);

    // Canonical URL
    if (canonical || (typeof window !== 'undefined' && window.location.href)) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonical || (typeof window !== 'undefined' ? window.location.href : ''));
    }

    // Robots meta tag
    if (noindex || nofollow) {
      const robotsContent = [];
      if (noindex) robotsContent.push('noindex');
      if (nofollow) robotsContent.push('nofollow');
      updateMetaTag('robots', robotsContent.join(', '));
    } else {
      // Remove robots meta tag if it exists and we don't need it
      const robotsMeta = document.querySelector('meta[name="robots"]');
      if (robotsMeta) {
        robotsMeta.remove();
      }
    }

    // Structured data (JSON-LD)
    if (structuredData) {
      // Remove existing structured data script if it exists
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    // Cleanup function
    return () => {
      // Optionally reset to defaults on unmount
      // For now, we'll let the next page set its own SEO
    };
  }, [title, description, keywords, image, url, type, siteName, structuredData, canonical, noindex, nofollow]);
};
