'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { navItems } from '@/lib/site';
import { Home, Compass, Bookmark, Settings } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  Compass,
  Bookmark,
  Settings,
};

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isLightMode: boolean;
}

export default function Sidebar({ isOpen, setIsOpen, isLightMode }: SidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const pathname = usePathname();

  // Handle swipe gesture on mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!sidebarRef.current) return;
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - startX.current;

    // Swipe right to open (from left edge)
    // Swipe left to close
    if (isOpen && deltaX < -50) {
      setIsOpen(false);
    } else if (!isOpen && deltaX > 50 && startX.current < 50) {
      setIsOpen(true);
    }
  }, [isOpen, setIsOpen]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  }, [pathname, setIsOpen]);

  // Trap focus in sidebar when open (accessibility)
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

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Mobile Backdrop with tap to close */}
          <motion.div
            className={cn(
              "fixed inset-0 backdrop-blur-sm z-40 md:hidden",
              isLightMode ? "bg-black/30" : "bg-black/50"
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

          {/* Sidebar Panel */}
          <motion.div
            ref={sidebarRef}
            className={cn(
              "w-64 glass-card flex flex-col rounded-3xl border shadow-2xl overflow-hidden z-50 shrink-0 absolute top-4 bottom-4 left-4 bg-background md:relative md:top-auto md:bottom-auto md:left-auto md:m-4 md:bg-transparent md:h-auto",
              isLightMode ? "border-gray-200" : "border-white/10"
            )}
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          >
            <div className="px-4 py-6 flex-1 mt-2">
              <p className={cn(
                "text-xs font-semibold uppercase tracking-wider mb-4 px-2",
                isLightMode ? "text-gray-500" : "text-white/40"
              )}>Menu</p>
              <nav className="space-y-1" aria-label="Main navigation">
                {navItems.map((item) => {
                  const Icon = iconMap[item.icon] || Home;
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 relative group overflow-hidden',
                        isActive
                          ? (isLightMode ? 'text-gray-900 bg-gray-100' : 'text-white bg-white/10')
                          : (isLightMode ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' : 'text-white/60 hover:text-white hover:bg-white/5')
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active"
                          className={cn(
                            "absolute inset-0 bg-gradient-to-r from-aura-primary/20 to-transparent border-l-2 border-aura-primary",
                            isLightMode && "from-aura-primary/15"
                          )}
                          initial={false}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                      <Icon className={cn(
                        'w-5 h-5 relative z-10',
                        isActive ? 'text-aura-primary' : 'group-hover:text-aura-primary transition-colors'
                      )} aria-hidden="true" />
                      <span className="relative z-10 font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
