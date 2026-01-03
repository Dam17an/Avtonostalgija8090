export type Language = 'si' | 'en';

export interface SiteSettings {
  heroImage: string;
  aboutImage: string;
  memberCount: string;
  eventCount: string;
}

// Strapi v5 Flat Structure (Slovenian field names)
export interface StrapiArticle {
  id: number;
  Naslov: string;
  Vsebina: any; // Can be string or Strapi Blocks array
  Datum: string;
  Slika?: {
    url: string;
  };
}

export interface StrapiAnnouncement {
  id: number;
  Naslov: string;
  Vsebina: any; // Can be string or Strapi Blocks array
  Datum: string;
  Ura: string;
  Slika?: {
    url: string;
  };
}

export interface StrapiGallery {
  id: number;
  Naslov: string;
  Slike?: Array<{
    url: string;
  }>;
}
