'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const emailSchema = z.object({
  email: z.string().email('Email inválido'),
});

const otpSchema = z.object({
  token: z.string().length(6, 'El código debe tener 6 dígitos').regex(/^\d+$/, 'Solo se permiten números'),
});

type EmailFormData = z.infer<typeof emailSchema>;
type OTPFormData = z.infer<typeof otpSchema>;

export function OTPForm() {
  const [codeSent, setCodeSent] = useState(false);
  const [email, setEmail] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const { signInWithOTP, loading } = useAuth();

  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
    getValues: getEmailValues,
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const {
    register: registerOTP,
    handleSubmit: handleSubmitOTP,
    formState: { errors: otpErrors },
  } = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
  });

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const onSubmitEmail = async (data: EmailFormData) => {
    const result = await signInWithOTP({ email: data.email });
    if (!result.error && result.sent) {
      setEmail(data.email);
      setCodeSent(true);
      setResendTimer(60);
    }
  };

  const onSubmitOTP = async (data: OTPFormData) => {
    await signInWithOTP({ email, token: data.token });
  };

  const handleResend = async () => {
    if (resendTimer === 0) {
      const emailValue = getEmailValues('email');
      if (emailValue) {
        await onSubmitEmail({ email: emailValue });
      }
    }
  };

  if (codeSent) {
    return (
      <form onSubmit={handleSubmitOTP(onSubmitOTP)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp-code">Código de verificación</Label>
          <Input
            id="otp-code"
            type="text"
            placeholder="000000"
            maxLength={6}
            {...registerOTP('token')}
            disabled={loading}
            className="text-center text-2xl tracking-widest"
          />
          {otpErrors.token && (
            <p className="text-sm text-destructive">{otpErrors.token.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Verificando...' : 'Verificar Código'}
        </Button>

        <div className="text-center text-sm">
          {resendTimer > 0 ? (
            <p className="text-muted-foreground">
              Reenviar código en {resendTimer}s
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-primary hover:underline"
            >
              Reenviar código
            </button>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setCodeSent(false);
            setResendTimer(0);
          }}
          className="w-full"
        >
          Cambiar email
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmitEmail(onSubmitEmail)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="otp-email">Email</Label>
        <Input
          id="otp-email"
          type="email"
          placeholder="tu@email.com"
          {...registerEmail('email')}
          disabled={loading}
        />
        {emailErrors.email && (
          <p className="text-sm text-destructive">{emailErrors.email.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar Código OTP'}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Te enviaremos un código de 6 dígitos a tu email para iniciar sesión.
      </p>
    </form>
  );
}



