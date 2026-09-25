'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import AuraAssistantModal from '@/components/AuraAssistantModal';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

// Context for sharing state across dashboard pages
interface DashboardContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  savedTools: string[];
  toggleSaveTool: (toolId: string) => void;
  isLightMode: boolean;
  toggleTheme: () => void;
  isHydrated: boolean;
  user: { id: string; name?: string | null; email?: string | null; image?: string | null } | null;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [savedTools, setSavedTools] = useState<string[]>([]);
  const [isLightMode, setIsLightMode] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load theme and saved tools from localStorage on initial hydration
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme !== null) {
        setIsLightMode(JSON.parse(storedTheme));
      }
      const storedTools = localStorage.getItem(SAVED_TOOLS_KEY);
      if (storedTools !== null) {
        setSavedTools(JSON.parse(storedTools));
      }
    } catch {
      // Ignore parse errors, use default
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

  // Set the initial sidebar state once; later changes are controlled by the menu button.
  useEffect(() => {
    setIsSidebarOpen(window.innerWidth >= 768);
  }, []);

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
      <div className={cn("flex flex-col h-screen overflow-hidden", "bg-background")}>
        {/* Only render header/sidebar after hydration to prevent mismatch */}
        {isHydrated && (
          <>
            <Header
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              isLightMode={isLightMode}
              toggleTheme={toggleTheme}
              userName={user?.name || 'User'}
              userAvatar={user?.image || undefined}
            />
            <div className="flex-1 flex overflow-hidden relative">
              <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} isLightMode={isLightMode} />
              <main className="flex-1 overflow-y-auto p-6 md:p-8">
                {children}
              </main>
            </div>
            <AuraAssistantModal />
          </>
        )}
        {!isHydrated && (
          <div className="flex-1 flex items-center justify-center">
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
