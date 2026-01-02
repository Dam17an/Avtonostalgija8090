import { apiFetch } from './client';
import { Event } from '../types';

export const getEvents = (): Promise<Event[]> => apiFetch('/api/events', []);