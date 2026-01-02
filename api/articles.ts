import { apiFetch } from './client';
import { Article } from '../types';

export const getArticles = (): Promise<Article[]> => apiFetch('/api/articles', []);