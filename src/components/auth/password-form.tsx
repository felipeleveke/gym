'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const signUpSchema = loginSchema.extend({
  confirmPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

export function PasswordForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const { signInWithPassword, signUp, loading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData | SignUpFormData>({
    resolver: zodResolver(isSignUp ? signUpSchema : loginSchema),
  });

  const onSubmit = async (data: LoginFormData | SignUpFormData) => {
    if (isSignUp) {
      const signUpData = data as SignUpFormData;
      await signUp({
        email: signUpData.email,
        password: signUpData.password,
      });
    } else {
      const loginData = data as LoginFormData;
      await signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="tu@email.com"
          {...register('email')}
          disabled={loading}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register('password')}
          disabled={loading}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      {isSignUp && (
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            {...register('confirmPassword')}
            disabled={loading}
          />
          {'confirmPassword' in errors && errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
      )}

      {!isSignUp && (
        <div className="text-right">
          <a
            href="/auth/reset-password"
            className="text-sm text-primary hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading
          ? 'Cargando...'
          : isSignUp
          ? 'Crear Cuenta'
          : 'Iniciar Sesión'}
      </Button>

      <div className="text-center text-sm">
        <button
          type="button"
          onClick={toggleMode}
          className="text-primary hover:underline"
        >
          {isSignUp
            ? '¿Ya tienes cuenta? Inicia sesión'
            : '¿No tienes cuenta? Regístrate'}
        </button>
      </div>
    </form>
  );
}



