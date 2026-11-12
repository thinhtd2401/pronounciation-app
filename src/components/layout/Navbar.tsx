'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Headphones, Search, Flame, LayoutDashboard, BookOpen, Calendar, Menu, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface NavbarProps {
  currentStreak?: number;
}

export default function Navbar({ currentStreak = 1 }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  let pathname = '/';
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const path = usePathname();
    if (path) pathname = path;
  } catch {
    // Safe fallback if rendered outside Next.js App Router context (e.g. testing)
    pathname = '/';
  }

  const navLinks = [
    {
      name: 'Phòng học (Study Room)',
      href: '/',
      icon: BookOpen,
      isActive: pathname === '/' || pathname.startsWith('/study'),
    },
    {
      name: 'Kế hoạch học',
      href: '/plan',
      icon: Calendar,
      isActive: pathname.startsWith('/plan'),
    },
    {
      name: 'Quản trị (Admin Portal)',
      href: '/admin',
      icon: LayoutDashboard,
      isActive: pathname.startsWith('/admin'),
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-white group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-sm shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Headphones className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-brand-700 to-emerald-600 dark:from-white dark:via-brand-500 dark:to-emerald-400 bg-clip-text text-transparent">
                English Pronunciation
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 -mt-1">
                EasyDictation Studio
              </span>
            </div>
          </Link>

          {/* Quick Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm bài học, phiên âm /i:/, /e/, từ khóa..."
                className="w-full pl-9 pr-12 py-1.5 text-sm bg-slate-100/80 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all"
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-zinc-500 bg-slate-200/60 dark:bg-zinc-700/60 rounded border border-slate-300 dark:border-zinc-600">
                  Ctrl K
                </kbd>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links & Action Badges */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    link.isActive
                      ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 font-semibold'
                      : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Daily Streak Badge & Actions */}
          <div className="flex items-center gap-2">
            {/* Streak Badge */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-amber-700 dark:text-amber-400 text-xs font-semibold shadow-xs"
              title="Chuỗi ngày học liên tục"
            >
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
              <span>{currentStreak} ngày streak</span>
            </div>

            {/* Dark/Light Mode Toggle */}
            <ThemeToggle />

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer / Collapsible Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 px-4 pt-3 pb-5 space-y-3 shadow-lg">
          {/* Mobile Search */}
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bài học..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none text-slate-800 dark:text-zinc-200"
            />
          </div>

          {/* Mobile Nav Links */}
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    link.isActive
                      ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 font-semibold'
                      : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
