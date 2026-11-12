'use client';
import React from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import Navbar from './Navbar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-100 transition-colors duration-150">
        <Navbar />
        <main className="flex-1 w-full">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
