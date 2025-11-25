'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const magicLinkSchema = z.object({
  email: z.string().email('Email inválido'),
});

type MagicLinkFormData = z.infer<typeof magicLinkSchema>;

export function MagicLinkForm() {
  const [emailSent, setEmailSent] = useState(false);
  const { signInWithMagicLink, loading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
  });

  const onSubmit = async (data: MagicLinkFormData) => {
    const result = await signInWithMagicLink(data.email);
    if (!result.error) {
      setEmailSent(true);
    }
  };

  if (emailSent) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-md bg-muted p-4">
          <p className="text-sm font-medium">Magic link enviado</p>
          <p className="text-sm text-muted-foreground mt-2">
            Revisa tu email ({getValues('email')}) y haz clic en el enlace para
            iniciar sesión.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setEmailSent(false)}
          className="w-full"
        >
          Enviar otro link
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="magic-email">Email</Label>
        <Input
          id="magic-email"
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
        {loading ? 'Enviando...' : 'Enviar Magic Link'}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Te enviaremos un enlace mágico a tu email para iniciar sesión sin
        contraseña.
      </p>
    </form>
  );
}



