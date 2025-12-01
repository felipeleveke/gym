'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useAuth() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const getRedirectUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/auth/callback`;
    }
    return '/auth/callback';
  };

  const handleError = (error: any, defaultMessage: string) => {
    let message = defaultMessage;
    
    if (error?.message) {
      const errorMessages: Record<string, string> = {
        'OAuth error': 'Error al autenticar con Google',
        'Email rate limit exceeded': 'Demasiados intentos. Por favor espera unos minutos',
      };
      
      message = errorMessages[error.message] || error.message;
    }
    
    toast({
      variant: 'destructive',
      title: 'Error',
      description: message,
    });
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getRedirectUrl(),
        },
      });

      if (error) {
        handleError(error, 'Error al iniciar sesión con Google');
        setLoading(false);
        return { error };
      }

      // La redirección se maneja automáticamente por Supabase
      return { error: null };
    } catch (error) {
      handleError(error, 'Error inesperado al iniciar sesión con Google');
      setLoading(false);
      return { error };
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        handleError(error, 'Error al cerrar sesión');
        return { error };
      }

      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión correctamente',
      });

      router.push('/auth/login');
      router.refresh();
      return { error: null };
    } catch (error) {
      handleError(error, 'Error inesperado al cerrar sesión');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    signInWithGoogle,
    logout,
  };
}



