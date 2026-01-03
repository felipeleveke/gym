import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { useState } from 'react';

export interface UseCameraReturn {
  takePhoto: () => Promise<Photo | null>;
  pickFromGallery: () => Promise<Photo | null>;
  isLoading: boolean;
  error: string | null;
}

export function useCamera(): UseCameraReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const takePhoto = async (): Promise<Photo | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });
      setIsLoading(false);
      return photo;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al tomar la foto';
      setError(errorMessage);
      setIsLoading(false);
      // Si el usuario cancela, no es un error real
      if (errorMessage.includes('cancel') || errorMessage.includes('User cancelled')) {
        return null;
      }
      return null;
    }
  };

  const pickFromGallery = async (): Promise<Photo | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
      });
      setIsLoading(false);
      return photo;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al seleccionar la foto';
      setError(errorMessage);
      setIsLoading(false);
      // Si el usuario cancela, no es un error real
      if (errorMessage.includes('cancel') || errorMessage.includes('User cancelled')) {
        return null;
      }
      return null;
    }
  };

  return {
    takePhoto,
    pickFromGallery,
    isLoading,
    error,
  };
}
















