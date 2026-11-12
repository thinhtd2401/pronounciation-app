import type { Metadata } from 'next';
import './globals.css';
import ClientLayout from '@/components/layout/ClientLayout';

export const metadata: Metadata = {
  title: 'English Pronunciation Master',
  description: 'Interactive English pronunciation learning platform with video transcription and spaced repetition',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
