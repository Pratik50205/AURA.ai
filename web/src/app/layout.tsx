import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import './globals.css';
import { siteConfig } from '@/lib/site';
import ThemeInitializer from '@/components/ThemeInitializer';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'AURA.ai - AI Tool Discovery & Recommendation Platform',
    template: '%s | AURA.ai',
  },
  description: siteConfig.description,
  keywords: [
    'AI tools',
    'AI discovery',
    'tool recommendation',
    'artificial intelligence',
    'AI software',
    'machine learning tools',
    'AI productivity',
  ],
  authors: [{ name: 'AURA.ai' }],
  creator: 'AURA.ai',
  publisher: 'AURA.ai',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: 'AURA.ai - AI Tool Discovery & Recommendation Platform',
    description: siteConfig.description,
    siteName: 'AURA.ai',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AURA.ai - AI Tool Discovery & Recommendation Platform',
    description: siteConfig.description,
    creator: '@aura_ai',
  },
  verification: {
    google: 'google-site-verification-code',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <SessionProvider>
          <ThemeInitializer />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
