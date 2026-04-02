import type { Metadata } from 'next';
import { Manrope, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/features/auth/AuthContext';

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
});

const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  weight: ['400', '500'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MandiPlus Field PWA',
  description: 'Standalone field operations progressive web app for the MandiPlus team.',
  manifest: '/manifest.webmanifest',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${plexMono.variable}`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
