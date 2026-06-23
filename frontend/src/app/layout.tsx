import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import '../index.css';

export const metadata: Metadata = {
  title: 'CampusConnect',
  description: 'Learn. Connect. Trade. Your campus community platform.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CampusConnect',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-192.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icons/icon-192.svg" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CampusConnect" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
                let refreshing = false;
                navigator.serviceWorker.addEventListener('controllerchange', function() {
                  if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
