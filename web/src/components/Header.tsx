'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Search, Bell, Menu, Moon, Sun, X, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { siteConfig } from '@/lib/site';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  toggleSidebar: () => void;
  isLightMode: boolean;
  toggleTheme: () => void;
  userName?: string;
  userAvatar?: string;
}

export default function Header({
  searchQuery,
  setSearchQuery,
  toggleSidebar,
  isLightMode,
  toggleTheme,
  userName = 'Pratik',
  userAvatar,
}: HeaderProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search - only update context after 300ms of no typing
  const handleSearchChange = useCallback((value: string) => {
    setDebouncedQuery(value);
    setIsSearching(true);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setSearchQuery(value);
      setIsSearching(false);
    }, 300);
  }, [setSearchQuery]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Escape to clear search or close profile
      if (e.key === 'Escape') {
        inputRef.current?.blur();
        setIsProfileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const avatarUrl = userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}&backgroundColor=D9042B`;

  return (
    <header className={cn(
      "sticky top-0 z-50 h-20 px-6 md:px-8 flex items-center justify-between gap-4 backdrop-blur-xl border-b transition-colors",
      isLightMode
        ? "bg-white/80 border-gray-200/50"
        : "bg-background/80 border-white/5"
    )}>
      {/* Left: Menu + Logo */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1">
        <button
          onClick={toggleSidebar}
          className={cn(
            "p-2 rounded-xl transition-colors shrink-0",
            isLightMode ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100" : "text-white/70 hover:text-white hover:bg-white/10"
          )}
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          {/* New AURA Logo */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden shadow-aura-glow">
            <img
              src="/aura-icon.svg"
              alt="AURA"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className={cn(
            "text-xl sm:text-2xl font-bold tracking-tight hidden lg:block",
            isLightMode ? "text-gray-900" : "text-white"
          )}>
            {siteConfig.name}
          </h1>
        </Link>
      </div>

      {/* Center: Search */}
      <div className="flex-[2] flex justify-center w-full max-w-xl hidden lg:block">
        <div className={cn('relative max-w-xl w-full transition-all duration-300', isFocused && 'scale-[1.02]')}>
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className={cn(
              'w-5 h-5 transition-colors',
              isFocused ? 'text-aura-primary' : (isLightMode ? 'text-gray-400' : 'text-white/40')
            )} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={debouncedQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className={cn(
              "w-full border rounded-2xl pl-12 pr-16 py-3 focus:outline-none focus:ring-2 focus:ring-aura-primary/50 focus:border-aura-primary/50 transition-all shadow-inner",
              isLightMode
                ? "bg-gray-100/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:bg-white"
                : "bg-surface/50 border-white/10 text-white placeholder-white/40 focus:bg-surface"
            )}
            placeholder="Describe what you want to achieve... e.g. 'remove background from a video'"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-label="Search AI tools"
            autoComplete="off"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
            {debouncedQuery && (
              <button
                onClick={() => {
                  if (debounceTimer.current) {
                    clearTimeout(debounceTimer.current);
                  }
                  setDebouncedQuery('');
                  setSearchQuery('');
                  setIsSearching(false);
                  inputRef.current?.focus();
                }}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  isLightMode ? "text-gray-400 hover:text-gray-600 hover:bg-gray-200" : "text-white/40 hover:text-white/60 hover:bg-white/10"
                )}
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className={cn(
              "px-2 py-1 rounded border text-[10px] font-semibold tracking-widest",
              isLightMode
                ? "bg-gray-200/80 border-gray-300 text-gray-500"
                : "bg-white/10 border-white/10 text-white/60"
            )}>
              ⌘K
            </div>
          </div>
          {isSearching && (
            <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-muted">
              <div className="w-3 h-3 border-2 border-aura-primary border-t-transparent rounded-full animate-spin" />
              <span>Searching...</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Theme Toggle + Notifications + Profile */}
      <div className="flex items-center justify-end gap-2 sm:gap-3 flex-1 lg:justify-end">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className={cn(
            "p-2 rounded-xl transition-all",
            isLightMode
              ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              : "text-white/70 hover:text-white hover:bg-white/10"
          )}
          aria-label={isLightMode ? "Switch to dark mode" : "Switch to light mode"}
        >
          {isLightMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        <button className={cn(
          "relative p-2 rounded-xl transition-colors",
          isLightMode ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100" : "text-white/70 hover:text-white hover:bg-white/10"
        )} aria-label="Notifications">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-aura-accent rounded-full animate-pulse" aria-hidden="true" />
        </button>

        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={cn(
              "flex items-center gap-2 p-1 pr-3 border rounded-full transition-all group",
              isLightMode
                ? "bg-gray-100/80 border-gray-200 hover:bg-gray-200/80"
                : "bg-surface/50 border-white/10 hover:bg-white/10"
            )}
            aria-expanded={isProfileOpen}
            aria-haspopup="true"
          >
            <img
              src={avatarUrl}
              alt={userName}
              className={cn(
                "w-8 h-8 rounded-full transition-colors",
                isLightMode ? "border-2 border-gray-200 group-hover:border-aura-primary/50" : "border border-white/20 group-hover:border-aura-primary/50"
              )}
            />
            <span className={cn(
              "text-sm font-medium hidden sm:block",
              isLightMode ? "text-gray-700" : "text-white/90"
            )}>{userName}</span>
          </button>

          {isProfileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} aria-hidden="true" />
              <div className={cn(
                "absolute right-0 mt-2 w-56 glass-card rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200",
                isLightMode ? "border border-gray-200" : "border border-white/10"
              )}>
                <Link
                  href="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className={cn(
                    "block px-4 py-2 text-sm transition-colors",
                    isLightMode ? "text-gray-700 hover:bg-gray-100 hover:text-gray-900" : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  Profile Settings
                </Link>
                <button
                  onClick={toggleTheme}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2 text-sm transition-colors text-left",
                    isLightMode ? "text-gray-700 hover:bg-gray-100 hover:text-gray-900" : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <span>{isLightMode ? 'Dark Mode' : 'Light Mode'}</span>
                  {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </button>
                <div className={cn("border-t my-2", isLightMode ? "border-gray-200" : "border-white/10")} />
                <button
                  onClick={async () => {
                    setIsProfileOpen(false);
                    await signOut({ redirect: false });
                    window.location.href = '/login';
                  }}
                  className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
