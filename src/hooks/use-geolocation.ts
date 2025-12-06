import { Geolocation, Position } from '@capacitor/geolocation';
import { useState } from 'react';

export interface UseGeolocationReturn {
  getCurrentPosition: () => Promise<Position | null>;
  watchPosition: (callback: (position: Position) => void) => Promise<string | null>;
  clearWatch: (watchId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useGeolocation(): UseGeolocationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentPosition = async (): Promise<Position | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });
      setIsLoading(false);
      return position;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener la ubicación';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  };

  const watchPosition = async (
    callback: (position: Position) => void
  ): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
        },
        (position, err) => {
          if (err) {
            setError(err.message);
            setIsLoading(false);
            return;
          }
          if (position) {
            callback(position);
            setIsLoading(false);
          }
        }
      );
      return watchId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al rastrear la ubicación';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  };

  const clearWatch = async (watchId: string): Promise<void> => {
    try {
      await Geolocation.clearWatch({ id: watchId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al detener el rastreo';
      setError(errorMessage);
    }
  };

  return {
    getCurrentPosition,
    watchPosition,
    clearWatch,
    isLoading,
    error,
  };
}






