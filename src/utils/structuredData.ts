/**
 * Structured Data (JSON-LD) Utilities
 * Generates schema.org structured data for SEO
 */

export interface OrganizationData {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
  contactPoint?: {
    contactType: string;
    email?: string;
    telephone?: string;
  };
}

export interface EventData {
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: {
    name: string;
    address?: {
      streetAddress?: string;
      addressLocality: string;
      addressCountry: string;
    };
  };
  image?: string;
  organizer?: {
    name: string;
    url: string;
  };
  eventStatus?: 'EventScheduled' | 'EventCancelled' | 'EventPostponed';
  eventAttendanceMode?: 'OfflineEventAttendanceMode' | 'OnlineEventAttendanceMode' | 'MixedEventAttendanceMode';
}

export interface PersonData {
  name: string;
  alternateName?: string;
  description?: string;
  image?: string;
  url?: string;
  jobTitle?: string;
  sameAs?: string[];
}

export interface BreadcrumbData {
  items: Array<{
    name: string;
    url: string;
  }>;
}

/**
 * Generate Organization structured data
 */
export function generateOrganizationData(data: OrganizationData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: data.name,
    url: data.url,
    ...(data.logo && { logo: data.logo }),
    ...(data.description && { description: data.description }),
    ...(data.sameAs && data.sameAs.length > 0 && { sameAs: data.sameAs }),
    ...(data.contactPoint && {
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: data.contactPoint.contactType,
        ...(data.contactPoint.email && { email: data.contactPoint.email }),
        ...(data.contactPoint.telephone && { telephone: data.contactPoint.telephone }),
      },
    }),
  };
}

/**
 * Generate Event structured data
 */
export function generateEventData(data: EventData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: data.name,
    description: data.description,
    startDate: data.startDate,
    ...(data.endDate && { endDate: data.endDate }),
    location: {
      '@type': 'Place',
      name: data.location.name,
      ...(data.location.address && {
        address: {
          '@type': 'PostalAddress',
          ...(data.location.address.streetAddress && { streetAddress: data.location.address.streetAddress }),
          addressLocality: data.location.address.addressLocality,
          addressCountry: data.location.address.addressCountry,
        },
      }),
    },
    ...(data.image && { image: data.image }),
    ...(data.organizer && {
      organizer: {
        '@type': 'Organization',
        name: data.organizer.name,
        url: data.organizer.url,
      },
    }),
    ...(data.eventStatus && { eventStatus: `https://schema.org/${data.eventStatus}` }),
    ...(data.eventAttendanceMode && { eventAttendanceMode: `https://schema.org/${data.eventAttendanceMode}` }),
  };
}

/**
 * Generate Person structured data (for artists)
 */
export function generatePersonData(data: PersonData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: data.name,
    ...(data.alternateName && { alternateName: data.alternateName }),
    ...(data.description && { description: data.description }),
    ...(data.image && { image: data.image }),
    ...(data.url && { url: data.url }),
    ...(data.jobTitle && { jobTitle: data.jobTitle }),
    ...(data.sameAs && data.sameAs.length > 0 && { sameAs: data.sameAs }),
  };
}

/**
 * Generate BreadcrumbList structured data
 */
export function generateBreadcrumbData(data: BreadcrumbData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: data.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate WebSite structured data
 */
export function generateWebSiteData(url: string, name: string, description?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: name,
    url: url,
    ...(description && { description: description }),
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate default organization data for Elektr-Âme
 */
export function getDefaultOrganizationData() {
  return generateOrganizationData({
    name: 'Elektr-Âme',
    url: 'https://www.elektr-ame.com',
    logo: 'https://www.elektr-ame.com/elektr-ame-media/85e5425f-9e5d-4f41-a064-2e7734dc6c51.png',
    description: "Barcelona's electronic music association. Join our community of artists, DJs, producers, and music lovers.",
    sameAs: [
      // Add social media links when available
      // 'https://www.facebook.com/elektr-ame',
      // 'https://www.instagram.com/elektr_ame',
      // 'https://twitter.com/elektr_ame',
    ],
    contactPoint: {
      contactType: 'Customer Service',
      email: 'info@elektr-ame.com',
    },
  });
}

