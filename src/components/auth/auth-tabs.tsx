'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PasswordForm } from './password-form';
import { MagicLinkForm } from './magic-link-form';
import { OTPForm } from './otp-form';

export function AuthTabs() {
  return (
    <Tabs defaultValue="password" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="password" className="text-xs sm:text-sm">
          Email/Contraseña
        </TabsTrigger>
        <TabsTrigger value="magic" className="text-xs sm:text-sm">
          Magic Link
        </TabsTrigger>
        <TabsTrigger value="otp" className="text-xs sm:text-sm">
          OTP
        </TabsTrigger>
      </TabsList>
      <TabsContent value="password" className="mt-4">
        <PasswordForm />
      </TabsContent>
      <TabsContent value="magic" className="mt-4">
        <MagicLinkForm />
      </TabsContent>
      <TabsContent value="otp" className="mt-4">
        <OTPForm />
      </TabsContent>
    </Tabs>
  );
}



