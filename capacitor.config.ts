import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gymtracker.app',
  appName: 'Gym Training Tracker',
  webDir: 'dist',
  // En desarrollo, usar el servidor local de Next.js
  // Descomentar para desarrollo local:
  // server: {
  //   url: 'http://localhost:3007',
  //   cleartext: true,
  // },
  // En producción, las API routes estarán en Vercel
  // y se llamarán directamente desde la app móvil
  server: {
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

