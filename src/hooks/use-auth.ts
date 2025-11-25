'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SignUpData {
  email: string;
  password: string;
}

interface SignInData {
  email: string;
  password: string;
}

interface ResetPasswordData {
  email: string;
}

interface UpdatePasswordData {
  password: string;
}

interface OTPData {
  email: string;
  token?: string;
}

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
      // Traducir mensajes comunes de Supabase
      const errorMessages: Record<string, string> = {
        'Invalid login credentials': 'Credenciales inválidas',
        'Email not confirmed': 'Por favor confirma tu email antes de iniciar sesión',
        'User already registered': 'Este email ya está registrado',
        'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
        'Invalid email': 'Email inválido',
        'Email rate limit exceeded': 'Demasiados intentos. Por favor espera unos minutos',
        'Token has expired or is invalid': 'El enlace ha expirado o es inválido',
      };
      
      message = errorMessages[error.message] || error.message;
    }
    
    toast({
      variant: 'destructive',
      title: 'Error',
      description: message,
    });
  };

  const signUp = async (data: SignUpData) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: getRedirectUrl(),
        },
      });

      if (error) {
        handleError(error, 'Error al crear la cuenta');
        return { error };
      }

      toast({
        title: 'Cuenta creada',
        description: 'Revisa tu email para confirmar tu cuenta',
      });

      return { error: null };
    } catch (error) {
      handleError(error, 'Error inesperado al crear la cuenta');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signInWithPassword = async (data: SignInData) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        handleError(error, 'Error al iniciar sesión');
        return { error };
      }

      toast({
        title: 'Sesión iniciada',
        description: 'Bienvenido de nuevo',
      });

      router.push('/dashboard');
      router.refresh();
      return { error: null };
    } catch (error) {
      handleError(error, 'Error inesperado al iniciar sesión');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signInWithMagicLink = async (email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: getRedirectUrl(),
        },
      });

      if (error) {
        handleError(error, 'Error al enviar el magic link');
        return { error };
      }

      toast({
        title: 'Magic link enviado',
        description: 'Revisa tu email para continuar',
      });

      return { error: null };
    } catch (error) {
      handleError(error, 'Error inesperado al enviar el magic link');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signInWithOTP = async (data: OTPData) => {
    setLoading(true);
    try {
      if (!data.token) {
        // Solicitar código OTP
        const { error } = await supabase.auth.signInWithOtp({
          email: data.email,
          options: {
            shouldCreateUser: true,
          },
        });

        if (error) {
          handleError(error, 'Error al enviar el código OTP');
          return { error, sent: false };
        }

        toast({
          title: 'Código enviado',
          description: 'Revisa tu email para el código de verificación',
        });

        return { error: null, sent: true };
      } else {
        // Verificar código OTP
        const { error } = await supabase.auth.verifyOtp({
          email: data.email,
          token: data.token,
          type: 'email',
        });

        if (error) {
          handleError(error, 'Código inválido o expirado');
          return { error };
        }

        toast({
          title: 'Verificación exitosa',
          description: 'Bienvenido',
        });

        router.push('/dashboard');
        router.refresh();
        return { error: null };
      }
    } catch (error) {
      handleError(error, 'Error inesperado');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (data: ResetPasswordData) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${getRedirectUrl()}?type=recovery`,
      });

      if (error) {
        handleError(error, 'Error al enviar el email de recuperación');
        return { error };
      }

      toast({
        title: 'Email enviado',
        description: 'Revisa tu email para restablecer tu contraseña',
      });

      return { error: null };
    } catch (error) {
      handleError(error, 'Error inesperado al enviar el email');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (data: UpdatePasswordData) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        handleError(error, 'Error al actualizar la contraseña');
        return { error };
      }

      toast({
        title: 'Contraseña actualizada',
        description: 'Tu contraseña ha sido actualizada correctamente',
      });

      router.push('/dashboard');
      router.refresh();
      return { error: null };
    } catch (error) {
      handleError(error, 'Error inesperado al actualizar la contraseña');
      return { error };
    } finally {
      setLoading(false);
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
    signUp,
    signInWithPassword,
    signInWithMagicLink,
    signInWithOTP,
    resetPassword,
    updatePassword,
    logout,
  };
}



