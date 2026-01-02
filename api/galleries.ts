import { apiFetch } from './client';
import { GalleryItem } from '../types';

export const getGalleries = (): Promise<GalleryItem[]> => apiFetch('/api/galleries', []);