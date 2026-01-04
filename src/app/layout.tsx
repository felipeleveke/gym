import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import { PWARegister } from '@/components/pwa-register';
import { SidebarWrapper } from '@/components/sidebar-wrapper';
import { ModeToggle } from '@/components/mode-toggle';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Gym Training Tracker',
  description: 'Sistema de seguimiento de entrenamientos en gimnasio y deportes',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Gym Tracker',
  },
};

export const viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
          <SidebarWrapper>
            {children}
          </SidebarWrapper>
          <Toaster />
          <PWARegister />
          <div className="fixed bottom-4 right-4 z-50">
            <ModeToggle />
          </div>
        </Providers>
      </body>
    </html>
  );
}

