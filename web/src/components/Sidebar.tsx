'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Compass, 
  Bookmark, 
  Settings, 
  ShieldCheck, 
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isLightMode: boolean;
  userRole?: string;
}

export default function Sidebar({ isOpen, setIsOpen, isLightMode, userRole }: SidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const pathname = usePathname();

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!sidebarRef.current) return;
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - startX.current;

    if (isOpen && deltaX < -50) {
      setIsOpen(false);
    } else if (!isOpen && deltaX > 50 && startX.current < 50) {
      setIsOpen(true);
    }
  }, [isOpen, setIsOpen]);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  }, [pathname, setIsOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const focusableElements = sidebar.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    sidebar.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => sidebar.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  const items = [
    { label: 'Discover Tools', href: '/discover', icon: Compass, badge: '320+' },
    { label: 'Workflows & Pipelines', href: '/#workflows', icon: Layers, badge: 'New' },
    { label: 'Workspace Dashboard', href: '/dashboard', icon: Home },
    { label: 'Saved Bookmarks', href: '/saved', icon: Bookmark },
    { label: 'Account Settings', href: '/settings', icon: Settings },
  ];

  if (userRole === 'ADMIN') {
    items.push({
      label: 'Admin Console',
      href: '/admin',
      icon: ShieldCheck,
      badge: 'Admin'
    });
  }

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <motion.div
            className={cn(
              "fixed inset-0 backdrop-blur-md z-40 md:hidden",
              isLightMode ? "bg-slate-900/30" : "bg-black/60"
            )}
            onClick={() => setIsOpen(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Sidebar Drawer */}
          <motion.aside
            ref={sidebarRef}
            className={cn(
              "w-72 flex flex-col rounded-3xl border shadow-2xl overflow-hidden z-50 shrink-0 fixed top-4 bottom-4 left-4 md:relative md:top-auto md:bottom-auto md:left-auto md:m-4 md:h-auto backdrop-blur-2xl transition-colors duration-300",
              isLightMode
                ? "bg-white/95 border-slate-200/90 shadow-slate-200/60"
                : "bg-[#0D0E16]/95 border-white/10 shadow-black/80"
            )}
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          >
            {/* Top Brand Box */}
            <div className={cn(
              "p-5 border-b flex items-center justify-between",
              isLightMode ? "border-slate-100" : "border-white/10"
            )}>
              <Link href="/" className="flex items-center gap-3 group select-none">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-md shadow-red-500/20 group-hover:scale-105 transition-all">
                  <img src="/aura-icon.svg" alt="AURA" className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col">
                  <span className={cn("text-base font-extrabold tracking-tight", isLightMode ? "text-slate-900" : "text-white")}>
                    AURA<span className="text-[#FF3344]">.ai</span>
                  </span>
                  <span className="text-[8px] font-bold tracking-widest text-[#FF7B00] uppercase">
                    AI UTILITY PLATFORM
                  </span>
                </div>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="px-3.5 py-6 flex-1 overflow-y-auto scrollbar-hide">
              <p className={cn(
                "text-[10px] font-bold uppercase tracking-widest mb-3 px-3",
                isLightMode ? "text-slate-400" : "text-white/40"
              )}>
                Navigation
              </p>

              <nav className="space-y-1.5" aria-label="Main navigation">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/' && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all duration-200 relative group overflow-hidden text-xs sm:text-sm font-semibold',
                        isActive
                          ? (isLightMode ? 'text-red-600 bg-red-50 border border-red-200/80 shadow-sm' : 'text-white bg-white/10 border border-white/15 shadow-md')
                          : (isLightMode ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent' : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent')
                      )}
                    >
                      <div className="flex items-center gap-3 relative z-10">
                        <Icon className={cn(
                          'w-4 h-4 transition-colors',
                          isActive ? 'text-[#FF3344]' : (isLightMode ? 'text-slate-500 group-hover:text-slate-900' : 'text-white/50 group-hover:text-white')
                        )} />
                        <span>{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className={cn(
                          "relative z-10 text-[10px] font-bold px-2 py-0.5 rounded-md",
                          isActive
                            ? "bg-[#D9042B] text-white"
                            : isLightMode
                              ? "bg-slate-200/80 text-slate-600"
                              : "bg-white/10 text-white/60"
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Promo / Copilot Widget */}
            <div className={cn(
              "p-4 border-t m-3 rounded-2xl",
              isLightMode
                ? "bg-slate-50 border-slate-200 text-slate-700"
                : "bg-white/5 border-white/10 text-white/80"
            )}>
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FF7B00]" />
                <span className="text-xs font-bold">AURA Copilot</span>
              </div>
              <p className={cn("text-[11px] leading-relaxed mb-3", isLightMode ? "text-slate-500" : "text-white/60")}>
                Ask our neural assistant anytime for real-time comparison matrices.
              </p>
              <Link
                href="/discover"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF3344] hover:text-[#D9042B] transition-colors"
              >
                <span>Discover AI Tools</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
