import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import { PWARegister } from '@/components/pwa-register';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Gym Training Tracker',
  description: 'Sistema de seguimiento de entrenamientos en gimnasio y deportes',
  manifest: '/manifest.json',
  themeColor: '#ffffff',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Gym Tracker',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
          <PWARegister />
        </Providers>
      </body>
    </html>
  );
}

