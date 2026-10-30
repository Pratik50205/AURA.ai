'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  Search, 
  Moon, 
  Sun, 
  LogOut, 
  ShieldCheck, 
  UserCheck, 
  Sparkles,
  Compass,
  Layers,
  Bookmark,
  LayoutDashboard,
  ArrowLeftRight,
  Menu,
  Grid,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import SearchSpotlightModal from '@/components/SearchSpotlightModal';

interface HeaderProps {
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  toggleSidebar?: () => void;
  isLightMode?: boolean;
  toggleTheme?: () => void;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  userAvatar?: string;
}

export default function Header({
  isLightMode = true,
  toggleTheme,
  userName,
  userEmail,
  userRole,
  userAvatar,
}: HeaderProps) {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [shortcutKey, setShortcutKey] = useState('Ctrl+K');

  // Detect Windows vs Mac for shortcut badge
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMac = navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
      setShortcutKey(isMac ? '⌘K' : 'Ctrl+K');
    }
  }, []);

  // Global keyboard shortcut: Ctrl+K or Cmd+K opens the Spotlight search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSpotlightOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsProfileOpen(false);
        setIsMobileMenuOpen(false);
        setIsSpotlightOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
    setIsSpotlightOpen(false);
  }, [pathname]);

  const isLoggedIn = Boolean(userName || userEmail);
  const displayName = userName || (userEmail ? userEmail.split('@')[0] : 'Member');
  const isAdmin = userRole === 'ADMIN';
  const avatarUrl = userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}&backgroundColor=D9042B`;

  // Top navigation tabs (Dashboard safely removed from main bar as Discover serves discovery)
  const navLinks = [
    { label: 'Discover', href: '/discover', icon: Compass },
    { label: 'Workflows', href: '/workflows', icon: Layers },
    { label: 'Categories', href: '/categories', icon: Grid },
    { label: 'Compare', href: '/compare', icon: ArrowLeftRight },
    { label: 'Saved', href: '/saved', icon: Bookmark },
  ];

  return (
    <>
      <header className={cn(
        "sticky top-0 z-40 h-20 backdrop-blur-2xl border-b transition-colors duration-300 w-full",
        isLightMode
          ? "bg-white/90 border-slate-200/90 shadow-sm shadow-slate-200/40"
          : "bg-[#090A0F]/90 border-white/10 shadow-lg shadow-black/40"
      )}>
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <Link href="/" className="flex items-center gap-3 group select-none">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden shadow-lg shadow-red-500/25 group-hover:scale-105 group-hover:shadow-red-500/40 transition-all">
                <img src="/aura-icon.svg" alt="AURA" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col line-tight">
                <span className={cn(
                  "text-lg font-black tracking-tight transition-colors",
                  isLightMode ? "text-slate-900" : "text-white"
                )}>
                  AURA<span className="text-[#FF3344]">.ai</span>
                </span>
                <span className="text-[9px] font-bold tracking-widest text-[#FF7B00] uppercase -mt-0.5 hidden sm:inline whitespace-nowrap">
                  AI UTILITY RECOMMENDATION
                </span>
              </div>
            </Link>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
                    isActive
                      ? (isLightMode ? "bg-red-500/10 text-red-600 border border-red-500/20 shadow-sm" : "bg-red-500/15 text-red-400 border border-red-500/30")
                      : (isLightMode ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100" : "text-white/70 hover:text-white hover:bg-white/5")
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5", isActive ? "text-[#FF3344]" : "")} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Exclusive Spotlight Search Trigger Button */}
          <div className="flex-1 max-w-xs md:max-w-sm hidden sm:block">
            <button
              onClick={() => setIsSpotlightOpen(true)}
              className={cn(
                'w-full rounded-2xl border transition-all duration-200 shadow-sm flex items-center justify-between px-3.5 py-2 text-left group cursor-pointer',
                isLightMode 
                  ? 'bg-slate-100/90 hover:bg-slate-200/80 hover:border-slate-300 border-slate-200 text-slate-500' 
                  : 'bg-white/5 hover:bg-white/10 hover:border-white/20 border-white/10 text-white/50'
              )}
              title={`Open Spotlight Search (${shortcutKey})`}
              aria-label="Search AI tools"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Search className="w-4 h-4 text-[#FF3344] group-hover:scale-110 transition-transform shrink-0" />
                <span className="text-xs sm:text-sm font-medium truncate">
                  Search tools, prompts, tasks...
                </span>
              </div>
              <kbd className={cn(
                "px-2 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 select-none shadow-sm transition-colors",
                isLightMode 
                  ? "bg-white border-slate-200 text-slate-600 group-hover:border-red-500/30 group-hover:text-red-600" 
                  : "bg-white/10 border-white/10 text-white/70 group-hover:border-red-500/40 group-hover:text-white"
              )}>
                {shortcutKey}
              </kbd>
            </button>
          </div>

          {/* Right Controls: Theme Switcher + Auth + Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Mobile Search Icon */}
            <button
              onClick={() => setIsSpotlightOpen(true)}
              className={cn(
                "p-2.5 rounded-xl border transition-colors sm:hidden",
                isLightMode ? "bg-slate-100 border-slate-200 text-slate-700" : "bg-white/5 border-white/10 text-white/70"
              )}
              title="Search AI Tools"
            >
              <Search className="w-4 h-4 text-[#FF3344]" />
            </button>

            {/* Instant Theme Toggle (Sun/Moon) */}
            {toggleTheme && (
              <button
                onClick={toggleTheme}
                className={cn(
                  "p-2.5 rounded-xl border transition-all active:scale-95 shadow-sm",
                  isLightMode
                    ? "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                    : "bg-white/5 border-white/10 text-yellow-400 hover:bg-white/10 hover:text-yellow-300"
                )}
                title={`Switch to ${isLightMode ? 'Dark Theme' : 'Light Theme'}`}
                aria-label={isLightMode ? "Switch to dark mode" : "Switch to light mode"}
              >
                {isLightMode ? (
                  <Moon className="w-4 h-4 text-slate-700 hover:text-[#D9042B] transition-colors" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400 hover:text-amber-300 transition-colors" />
                )}
              </button>
            )}

            {!isLoggedIn ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors",
                    isLightMode ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100" : "text-white/80 hover:text-white hover:bg-white/10"
                  )}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#D9042B] to-[#FF7B00] hover:opacity-95 shadow-md shadow-red-500/25 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Get Started</span>
                  <span className="sm:hidden">Join</span>
                </Link>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={cn(
                    "flex items-center gap-2 p-1.5 pr-3 border rounded-2xl transition-all shadow-sm group",
                    isLightMode
                      ? "bg-slate-100 border-slate-200 hover:bg-slate-200"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  )}
                  aria-expanded={isProfileOpen}
                >
                  <div className="w-7 h-7 rounded-xl overflow-hidden shrink-0 border border-red-500/30">
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  </div>
                  <span className={cn(
                    "text-xs font-semibold max-w-[90px] truncate hidden sm:inline",
                    isLightMode ? "text-slate-800" : "text-white"
                  )}>
                    {displayName}
                  </span>
                  {isAdmin && (
                    <span className="hidden sm:inline-flex text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30">
                      Admin
                    </span>
                  )}
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileOpen && (
                  <div
                    className={cn(
                      "absolute right-0 top-full mt-2 w-60 rounded-2xl border p-2 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150",
                      isLightMode
                        ? "bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/40"
                        : "bg-[#141520]/95 border-white/10 text-white shadow-black/80"
                    )}
                  >
                    <div className={cn("px-3 py-2.5 border-b mb-1", isLightMode ? "border-slate-100" : "border-white/10")}>
                      <p className="text-xs font-bold truncate">{displayName}</p>
                      <p className={cn("text-[11px] truncate", isLightMode ? "text-slate-500" : "text-white/50")}>{userEmail}</p>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setIsProfileOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors",
                        isLightMode ? "hover:bg-slate-100" : "hover:bg-white/10"
                      )}
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#D9042B]" />
                      <span>Workspace Dashboard</span>
                    </Link>

                    <Link
                      href="/saved"
                      onClick={() => setIsProfileOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors",
                        isLightMode ? "hover:bg-slate-100" : "hover:bg-white/10"
                      )}
                    >
                      <Bookmark className="w-4 h-4 text-[#FF7B00]" />
                      <span>Saved Bookmarks</span>
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors",
                        isLightMode ? "hover:bg-slate-100" : "hover:bg-white/10"
                      )}
                    >
                      <UserCheck className="w-4 h-4 text-blue-500" />
                      <span>Account Settings</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setIsProfileOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-purple-600 dark:text-purple-400 transition-colors",
                          isLightMode ? "hover:bg-purple-50" : "hover:bg-purple-500/10"
                        )}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Admin Console</span>
                      </Link>
                    )}

                    <div className={cn("border-t my-1", isLightMode ? "border-slate-100" : "border-white/10")} />

                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 transition-colors text-left",
                        isLightMode ? "hover:bg-red-50" : "hover:bg-red-500/10"
                      )}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={cn(
                "p-2.5 rounded-xl border transition-colors lg:hidden",
                isLightMode 
                  ? "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900" 
                  : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
              )}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Exclusive Spotlight Command Palette Search Modal */}
      <SearchSpotlightModal
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        isLightMode={isLightMode}
      />

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-20 z-40 lg:hidden animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)} 
          />
          <div className={cn(
            "relative w-full max-w-sm p-6 shadow-2xl border-b space-y-4 max-h-[calc(100vh-80px)] overflow-y-auto",
            isLightMode ? "bg-white border-slate-200 text-slate-900" : "bg-[#10111A] border-white/10 text-white"
          )}>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Navigation</p>
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all",
                      isActive
                        ? "bg-gradient-to-r from-[#D9042B] to-[#FF7B00] text-white shadow-md shadow-red-500/20"
                        : isLightMode
                          ? "text-slate-700 hover:bg-slate-100"
                          : "text-white/80 hover:bg-white/10"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {isAdmin && (
              <div className="pt-2 border-t border-slate-100 dark:border-white/10">
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Console</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
