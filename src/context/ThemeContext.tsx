'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSafeLocalStorage() {
  if (typeof window !== 'undefined') {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }
  return null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    try {
      const storage = getSafeLocalStorage();
      const saved = storage ? (storage.getItem('app-theme') as Theme | null) : null;
      if (saved === 'light' || saved === 'dark') {
        setThemeState(saved);
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', saved === 'dark');
        }
        return;
      }

      if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initial: Theme = prefersDark ? 'dark' : 'light';
        setThemeState(initial);
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', initial === 'dark');
        }
      }
    } catch {
      // Gracefully fall back if localStorage or window is unavailable
    }
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setThemeState(next);
    try {
      const storage = getSafeLocalStorage();
      if (storage) {
        storage.setItem('app-theme', next);
      }
    } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', next === 'dark');
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      const storage = getSafeLocalStorage();
      if (storage) {
        storage.setItem('app-theme', newTheme);
      }
    } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
