import { PushNotifications, Token, PushNotificationSchema, ActionPerformed, RegistrationError } from '@capacitor/push-notifications';
import { PluginListenerHandle } from '@capacitor/core';
import { useEffect, useState, useRef } from 'react';

export interface UsePushNotificationsReturn {
  register: () => Promise<void>;
  isRegistered: boolean;
  token: string | null;
  notifications: PushNotificationSchema[];
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isRegistered, setIsRegistered] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<PushNotificationSchema[]>([]);
  const notificationListenerRef = useRef<PluginListenerHandle | null>(null);
  const actionListenerRef = useRef<PluginListenerHandle | null>(null);

  useEffect(() => {
    // Limpiar listeners al desmontar
    return () => {
      if (notificationListenerRef.current) {
        notificationListenerRef.current.remove();
      }
      if (actionListenerRef.current) {
        actionListenerRef.current.remove();
      }
    };
  }, []);

  const register = async (): Promise<void> => {
    try {
      // Solicitar permisos
      const permission = await PushNotifications.requestPermissions();
      if (permission.receive === 'granted') {
        // Registrar para recibir notificaciones
        await PushNotifications.register();
        setIsRegistered(true);
      } else {
        console.warn('Permisos de notificaciones denegados');
      }
    } catch (error) {
      console.error('Error al registrar notificaciones push:', error);
    }
  };

  useEffect(() => {
    if (!isRegistered) return;

    let tokenListener: PluginListenerHandle | null = null;
    let registrationErrorListener: PluginListenerHandle | null = null;
    let notificationListener: PluginListenerHandle | null = null;
    let actionListener: PluginListenerHandle | null = null;

    // Configurar listeners de forma asíncrona
    const setupListeners = async () => {
      // Listener para cuando se recibe un token
      tokenListener = await PushNotifications.addListener('registration', (token: Token) => {
        setToken(token.value);
        console.log('Token de notificaciones:', token.value);
        // Aquí deberías enviar el token a tu servidor para guardarlo
      });

      // Listener para errores de registro
      registrationErrorListener = await PushNotifications.addListener(
        'registrationError',
        (error: RegistrationError) => {
          console.error('Error en registro de notificaciones:', error);
        }
      );

      // Listener para notificaciones recibidas cuando la app está en primer plano
      notificationListener = await PushNotifications.addListener(
        'pushNotificationReceived',
        (notification: PushNotificationSchema) => {
          setNotifications((prev) => [notification, ...prev]);
          console.log('Notificación recibida:', notification);
        }
      );
      notificationListenerRef.current = notificationListener;

      // Listener para cuando el usuario toca una notificación
      actionListener = await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (action: ActionPerformed) => {
          console.log('Notificación tocada:', action);
          // Aquí puedes navegar a una ruta específica según la notificación
        }
      );
      actionListenerRef.current = actionListener;
    };

    setupListeners();

    return () => {
      if (tokenListener) {
        tokenListener.remove();
      }
      if (registrationErrorListener) {
        registrationErrorListener.remove();
      }
      if (notificationListener) {
        notificationListener.remove();
      }
      if (actionListener) {
        actionListener.remove();
      }
    };
  }, [isRegistered]);

  return {
    register,
    isRegistered,
    token,
    notifications,
  };
}

