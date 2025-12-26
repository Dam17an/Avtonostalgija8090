
export type Language = 'si' | 'en';

export interface NavLink {
  label: string;
  path: string;
}

export interface SiteSettings {
  heroImage: string;
  aboutImage: string;
  memberCount: string;
  eventCount: string;
}

export interface Article {
  id: string;
  title: Record<Language, string>;
  slug: string;
  excerpt: Record<Language, string>;
  content: Record<Language, string>;
  image: string;
  author: string;
  date: string;
  category: string;
  tags: string[];
}

export interface Event {
  id: string;
  title: Record<Language, string>;
  slug: string;
  description: Record<Language, string>;
  date: string;
  author: string;
  image: string;
  location: string;
  mapUrl: string;
}

export interface GalleryItem {
  id: string;
  eventId: string;
  title: Record<Language, string>;
  images: string[];
}

export interface ActivityLog {
  id: string;
  action: 'create' | 'update' | 'delete';
  type: 'article' | 'event' | 'gallery' | 'settings';
  targetId: string;
  timestamp: string;
}
