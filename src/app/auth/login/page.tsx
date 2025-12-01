'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { GoogleButton } from '@/components/auth/google-button';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (error) {
      // Mensajes personalizados según el tipo de error
      let errorMessage = message || 'Ocurrió un error al iniciar sesión';
      
      if (error === 'cancelled') {
        errorMessage = 'Inicio de sesión cancelado. Puedes intentar de nuevo cuando quieras.';
      } else if (error === 'exchange_error') {
        errorMessage = 'Error al procesar la autenticación. Por favor intenta de nuevo.';
      } else if (error === 'oauth_error') {
        errorMessage = message || 'Error al autenticar con Google. Por favor intenta de nuevo.';
      }

      toast({
        variant: 'destructive',
        title: 'Error de autenticación',
        description: errorMessage,
      });
    }
  }, [searchParams, toast]);

  return (
    <div className="container-mobile py-8 sm:py-12 min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Gym Training Tracker</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Inicia sesión con tu cuenta de Google para continuar
          </p>
        </div>

        <div className="space-y-4">
          <GoogleButton />
        </div>
      </div>
    </div>
  );
}

