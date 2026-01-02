import { apiFetch } from './client';
import { SiteSettings } from '../types';

export const getSettings = (): Promise<SiteSettings | null> => apiFetch('/api/settings', null);