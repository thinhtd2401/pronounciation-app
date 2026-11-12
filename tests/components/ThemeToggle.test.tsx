import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme } from '../../src/context/ThemeContext';
import ThemeToggle from '../../src/components/layout/ThemeToggle';
import Navbar from '../../src/components/layout/Navbar';
import ClientLayout from '../../src/components/layout/ClientLayout';

function TestComponent() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}

// Ensure mock localStorage and matchMedia in test environment
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = String(value);
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  },
  get length() {
    return Object.keys(mockStorage).length;
  },
  key: (i: number) => Object.keys(mockStorage)[i] ?? null,
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

describe('Theme Context & Toggle', () => {
  beforeEach(() => {
    localStorageMock.clear();
    document.documentElement.className = '';
  });

  it('switches between light and dark mode with TestComponent', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const themeSpan = screen.getByTestId('current-theme');
    const btn = screen.getByText('Toggle');

    expect(['light', 'dark']).toContain(themeSpan.textContent);
    const initialTheme = themeSpan.textContent;

    fireEvent.click(btn);
    expect(themeSpan.textContent).not.toBe(initialTheme);
  });

  it('renders ThemeToggle button and toggles dark mode class on html', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByRole('button', { name: /toggle dark\/light mode/i });
    expect(toggleBtn).toBeDefined();

    // Toggle once -> goes to dark
    fireEvent.click(toggleBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Toggle back -> goes to light
    fireEvent.click(toggleBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('restores theme from localStorage if present', () => {
    localStorageMock.setItem('app-theme', 'dark');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const themeSpan = screen.getByTestId('current-theme');
    expect(themeSpan.textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('renders EasyDictation inspired Navbar with brand, nav links, streak badge, and theme toggle', () => {
    render(
      <ThemeProvider>
        <Navbar currentStreak={5} />
      </ThemeProvider>
    );

    // Brand / Logo
    expect(screen.getByText(/English Pronunciation/i)).toBeDefined();

    // Nav links
    expect(screen.getByText(/Phòng học \(Study Room\)/i)).toBeDefined();
    expect(screen.getByText(/Quản trị \(Admin Portal\)/i)).toBeDefined();

    // Streak / Daily goal badge
    expect(screen.getByText(/5 ngày streak/i)).toBeDefined();

    // Theme toggle button
    expect(screen.getByRole('button', { name: /toggle dark\/light mode/i })).toBeDefined();
  });

  it('renders ClientLayout wrapping Navbar and child content correctly', () => {
    render(
      <ClientLayout>
        <div data-testid="child-content">Study Workspace Content</div>
      </ClientLayout>
    );

    expect(screen.getByTestId('child-content')).toBeDefined();
    expect(screen.getByText('Study Workspace Content')).toBeDefined();
    expect(screen.getByRole('button', { name: /toggle dark\/light mode/i })).toBeDefined();
  });
});
