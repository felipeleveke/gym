'use client';

import { GoogleButton } from '@/components/auth/google-button';

export default function LoginPage() {
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

