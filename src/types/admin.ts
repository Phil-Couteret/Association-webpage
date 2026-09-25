export interface SocialLinks {
  soundcloud?: string;
  instagram?: string;
  linktree?: string;
  spotify?: string;
}

export interface Artist {
  id: string;
  name: string;
  nickname?: string;
  bio: string; // Fallback bio (usually English)
  bioKey?: string; // Translation key for bio text
  bioTranslations?: { // Direct translations for bio text
    en?: string;
    es?: string;
    ca?: string;
  };
  picture?: string;
  pressKitUrl?: string; // URL or file path to press-kit document
  song1Url?: string; // URL to first song
  song2Url?: string; // URL to second song
  song3Url?: string; // URL to third song
  stream1Url?: string; // URL to first stream (YouTube, etc.)
  stream2Url?: string; // URL to second stream
  stream3Url?: string; // URL to third stream
  socialLinks: SocialLinks;
  createdAt: string;
  updatedAt: string;
}

export interface MusicEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  image?: string;
  price?: string;
  ticketLink?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  image: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminData {
  events: MusicEvent[];
  artists: Artist[];
  gallery: GalleryItem[];
}
