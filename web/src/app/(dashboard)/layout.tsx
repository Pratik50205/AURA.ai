'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuraAssistantModal from '@/components/AuraAssistantModal';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

// Context for sharing state across dashboard & discovery pages
interface DashboardContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  savedTools: string[];
  toggleSaveTool: (toolId: string) => void;
  isLightMode: boolean;
  toggleTheme: () => void;
  isHydrated: boolean;
  user: { id: string; name?: string | null; email?: string | null; image?: string | null; role?: string } | null;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    return {
      searchQuery: '',
      setSearchQuery: () => {},
      savedTools: [] as string[],
      toggleSaveTool: () => {},
      isLightMode: typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') !== 'dark' : true,
      toggleTheme: () => {},
      isHydrated: true,
      user: null,
    };
  }
  return context;
}

interface DashboardProviderProps {
  children: ReactNode;
}

const THEME_STORAGE_KEY = 'aura-theme-preference';
const SAVED_TOOLS_KEY = 'aura-saved-tools';

export function DashboardProvider({ children }: DashboardProviderProps) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [savedTools, setSavedTools] = useState<string[]>([]);
  const [isLightMode, setIsLightMode] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load theme and saved tools from localStorage on initial hydration
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme !== null) {
        setIsLightMode(JSON.parse(storedTheme));
      } else {
        setIsLightMode(true);
        document.documentElement.setAttribute('data-theme', 'light');
      }
      const storedTools = localStorage.getItem(SAVED_TOOLS_KEY);
      if (storedTools !== null) {
        setSavedTools(JSON.parse(storedTools));
      }
    } catch {
      setIsLightMode(true);
    }
    setIsHydrated(true);
  }, []);

  // Persist theme to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(isLightMode));
    } catch {
      // Ignore storage errors
    }
  }, [isLightMode, isHydrated]);

  // Persist saved tools to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(SAVED_TOOLS_KEY, JSON.stringify(savedTools));
    } catch {
      // Ignore storage errors
    }
  }, [savedTools, isHydrated]);

  const toggleSaveTool = useCallback((toolId: string) => {
    setSavedTools((prev) => (prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]));
  }, []);

  const toggleTheme = useCallback(() => {
    const nextMode = !isLightMode;
    if (typeof window !== 'undefined' && 'startViewTransition' in document) {
      (document as any).startViewTransition(() => {
        setIsLightMode(nextMode);
      });
    } else {
      setIsLightMode(nextMode);
    }
  }, [isLightMode]);

  // Update data-theme attribute on document when theme changes
  useEffect(() => {
    if (!isHydrated) return;
    document.documentElement.setAttribute('data-theme', isLightMode ? 'light' : 'dark');
  }, [isLightMode, isHydrated]);

  const user = session?.user ? {
    id: (session.user as any).id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    role: (session.user as any).role || 'USER',
  } : null;

  const value = {
    searchQuery,
    setSearchQuery,
    savedTools,
    toggleSaveTool,
    isLightMode,
    toggleTheme,
    isHydrated,
    user,
  };

  return (
    <DashboardContext.Provider value={value}>
      <div className={cn(
        "min-h-screen flex flex-col transition-colors duration-300 relative",
        isLightMode ? "bg-[#F8FAFC] text-slate-900" : "bg-[#090A0F] text-white"
      )}>
        {/* Background Ambient Radial Glows */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className={cn(
            "absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[130px] transition-opacity duration-700",
            isLightMode
              ? "bg-gradient-to-tr from-[#D9042B]/8 via-[#FF7B00]/6 to-transparent opacity-70"
              : "bg-gradient-to-tr from-[#D9042B]/18 via-[#FF7B00]/10 to-transparent opacity-100"
          )} />
        </div>

        {/* Content rendered once hydrated */}
        {isHydrated ? (
          <>
            <Header
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              isLightMode={isLightMode}
              toggleTheme={toggleTheme}
              userName={user?.name || undefined}
              userEmail={user?.email || undefined}
              userRole={user?.role || undefined}
              userAvatar={user?.image || undefined}
            />
            <main className="flex-1 w-full relative z-10">
              {children}
            </main>
            <Footer isLightMode={isLightMode} />
            <AuraAssistantModal />
          </>
        ) : (
          <div className="min-h-screen flex items-center justify-center relative z-10">
            <div className="flex items-center gap-3 text-muted">
              <div className="w-6 h-6 border-2 border-aura-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Loading AURA...</span>
            </div>
          </div>
        )}
      </div>
    </DashboardContext.Provider>
  );
}

// Default export for Next.js App Router
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardProvider>{children}</DashboardProvider>;
}
