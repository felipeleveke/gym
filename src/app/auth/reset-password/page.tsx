'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const { resetPassword, loading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    const result = await resetPassword(data);
    if (!result.error) {
      // El toast ya se muestra en el hook
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    }
  };

  return (
    <div className="container-mobile py-8 sm:py-12 min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Restablecer Contraseña
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Ingresa tu email para recibir un enlace de recuperación
          </p>
        </div>

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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Email de Recuperación'}
          </Button>

          <div className="text-center">
            <a
              href="/auth/login"
              className="text-sm text-primary hover:underline"
            >
              Volver al inicio de sesión
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}



