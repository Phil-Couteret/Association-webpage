import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  keywords?: string;
  structuredData?: object | object[];
  locale?: string;
  siteName?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  robots?: string;
}

export const SEO = ({
  title = "Elektr-Âme | Barcelona Electronic Music Association",
  description = "Elektr-Âme - Barcelona's electronic music association. Join our community of artists, DJs, producers, and music lovers.",
  image = "https://www.elektr-ame.com/elektr-ame-media/85e5425f-9e5d-4f41-a064-2e7734dc6c51.png",
  url = "https://www.elektr-ame.com",
  type = "website",
  keywords = "electronic music, Barcelona, DJ, producer, music association, events, concerts",
  structuredData,
  locale = "en_US",
  siteName = "Elektr-Âme",
  author = "Elektr-Âme",
  publishedTime,
  modifiedTime,
  section,
  tags = [],
  robots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
}: SEOProps) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, attribute: string = 'name') => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    // Basic meta tags
    updateMetaTag('description', description);
    if (keywords) {
      updateMetaTag('keywords', keywords);
    }
    if (author) {
      updateMetaTag('author', author);
    }
    
    // Additional important meta tags
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=5.0');
    updateMetaTag('theme-color', '#00D9FF');
    updateMetaTag('format-detection', 'telephone=no');
    updateMetaTag('robots', robots);

    // Open Graph tags
    updateMetaTag('og:title', title, 'property');
    updateMetaTag('og:description', description, 'property');
    updateMetaTag('og:type', type, 'property');
    updateMetaTag('og:url', url, 'property');
    updateMetaTag('og:image', image, 'property');
    updateMetaTag('og:image:width', '1200', 'property');
    updateMetaTag('og:image:height', '630', 'property');
    updateMetaTag('og:image:alt', title, 'property');
    updateMetaTag('og:site_name', siteName, 'property');
    updateMetaTag('og:locale', locale, 'property');
    updateMetaTag('og:locale:alternate', 'es_ES', 'property');
    updateMetaTag('og:locale:alternate', 'ca_ES', 'property');
    
    if (publishedTime) {
      updateMetaTag('article:published_time', publishedTime, 'property');
    }
    if (modifiedTime) {
      updateMetaTag('article:modified_time', modifiedTime, 'property');
    }
    if (section) {
      updateMetaTag('article:section', section, 'property');
    }
    tags.forEach((tag, index) => {
      updateMetaTag(`article:tag`, tag, 'property');
    });

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    updateMetaTag('twitter:image:alt', title);
    updateMetaTag('twitter:site', '@elektr_ame');
    updateMetaTag('twitter:creator', '@elektr_ame');

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    // Language alternates (for multi-language support)
    const languages = ['en', 'es', 'ca'];
    languages.forEach((lang) => {
      let alternate = document.querySelector(`link[rel="alternate"][hreflang="${lang}"]`) as HTMLLinkElement;
      if (!alternate) {
        alternate = document.createElement('link');
        alternate.rel = 'alternate';
        alternate.setAttribute('hreflang', lang);
        document.head.appendChild(alternate);
      }
      // For now, use the same URL - can be enhanced later with language-specific URLs
      alternate.href = url;
    });

    // Structured Data (JSON-LD)
    // Remove existing structured data scripts
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach((script) => script.remove());

    // Add new structured data
    if (structuredData) {
      const dataArray = Array.isArray(structuredData) ? structuredData : [structuredData];
      dataArray.forEach((data) => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(data);
        document.head.appendChild(script);
      });
    }
  }, [title, description, image, url, type, keywords, structuredData, locale, siteName, author, publishedTime, modifiedTime, section, tags, robots]);

  return null;
};

