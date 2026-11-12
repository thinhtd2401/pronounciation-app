import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
