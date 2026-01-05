import { CapacitorConfig } from '@capacitor/cli';

// URL de producción
const PRODUCTION_URL = 'https://entrenamiento.app';

const config: CapacitorConfig = {
  appId: 'com.gymtracker.app',
  appName: 'Gym Training Tracker',
  webDir: 'dist',
  // La app móvil carga directamente desde Vercel
  // Esto permite actualizaciones sin re-publicar el APK
  server: {
    url: PRODUCTION_URL,
    cleartext: false,
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    Camera: {
      permissions: {
        camera: 'Esta app necesita acceso a la cámara para tomar fotos de progreso físico.',
        photos: 'Esta app necesita acceso a tus fotos para guardar imágenes de entrenamientos.',
      },
    },
    Geolocation: {
      permissions: {
        location: 'Esta app necesita acceso a tu ubicación para rastrear entrenamientos al aire libre.',
      },
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    StatusBar: {
      style: 'default',
      backgroundColor: '#ffffff',
    },
    Keyboard: {
      resize: 'body',
      style: 'light',
      resizeOnFullScreen: true,
    },
  },
};

export default config;

