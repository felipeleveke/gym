'use client';

import { AuthTabs } from '@/components/auth/auth-tabs';

export default function LoginPage() {
  return (
    <div className="container-mobile py-8 sm:py-12 min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold">Gym Training Tracker</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Inicia sesión para continuar
          </p>
        </div>

        <AuthTabs />
      </div>
    </div>
  );
}

