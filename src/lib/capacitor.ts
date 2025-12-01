import { Capacitor } from '@capacitor/core';

/**
 * Utilidades para detectar la plataforma y características de Capacitor
 */

export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const getPlatform = (): 'web' | 'ios' | 'android' => {
  return Capacitor.getPlatform() as 'web' | 'ios' | 'android';
};

export const isIOS = (): boolean => {
  return Capacitor.getPlatform() === 'ios';
};

export const isAndroid = (): boolean => {
  return Capacitor.getPlatform() === 'android';
};

export const isWeb = (): boolean => {
  return Capacitor.getPlatform() === 'web';
};

/**
 * Obtiene la URL base de la API según la plataforma
 * En web usa rutas relativas, en móvil usa la URL de producción
 */
export const getApiUrl = (): string => {
  if (isWeb()) {
    return ''; // Rutas relativas en web
  }
  
  // En móvil, usar la URL de producción de Vercel
  // Esto debe configurarse en las variables de entorno
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://tu-app.vercel.app';
  return apiUrl;
};

/**
 * Convierte una ruta de API para que funcione en móvil
 */
export const getApiRoute = (route: string): string => {
  const apiUrl = getApiUrl();
  if (apiUrl) {
    return `${apiUrl}${route}`;
  }
  return route;
};

