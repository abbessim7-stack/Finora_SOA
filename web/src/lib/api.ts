import type { Api } from './types';
import { localApi } from './localApi';
import { httpApi } from './httpApi';

/**
 * Par défaut, l'application tourne sur le client de démonstration (localStorage).
 * Pour brancher l'API NestJS + MySQL : créer `web/.env.local` avec
 *   VITE_API_MODE=http
 * puis lancer `npm run dev` (le proxy Vite renvoie /api vers localhost:3000).
 */
export const apiMode = import.meta.env.VITE_API_MODE === 'http' ? 'http' : 'demo';

export const api: Api = apiMode === 'http' ? httpApi : localApi;
