import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Vapestyle.cz',
  description: 'Systém pro řízení maloobchodních operací',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body className={`${inter.className} bg-dashboard h-screen flex flex-col overflow-hidden text-slate-900`}>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
