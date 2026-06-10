import type { Metadata } from 'next';
import { Providers } from './providers';
import '../index.css';

export const metadata: Metadata = {
  title: 'CampusConnect',
  description: 'CampusConnect - Learn. Connect. Trade.',
  icons: {
    icon: '/vite.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
