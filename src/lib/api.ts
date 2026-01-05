import { Capacitor } from '@capacitor/core';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Obtiene la URL completa para una ruta de API
 * - En app nativa: usa la URL completa de Vercel
 * - En web: usa ruta relativa
 */
export function getApiUrl(path: string): string {
  // Si estamos en app nativa, usar URL completa
  if (Capacitor.isNativePlatform()) {
    return `${API_BASE_URL}${path}`;
  }
  // En web, usar ruta relativa
  return path;
}

/**
 * Función centralizada para hacer llamadas a la API
 * Detecta automáticamente si está en móvil o web y usa la URL correcta
 */
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(getApiUrl(path), options);
}

