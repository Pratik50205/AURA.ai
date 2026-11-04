'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Tool } from '@/lib/site';
import { tools as catalogTools } from '@/data/tools';

interface CompareContextType {
  selectedTools: Tool[];
  selectedCount: number;
  maxTools: number;
  addTool: (tool: Tool) => boolean;
  removeTool: (toolId: string) => void;
  toggleTool: (tool: Tool) => void;
  isToolSelected: (toolId: string) => boolean;
  clearCompare: () => void;
  loadToolsByIds: (ids: string[]) => void;
}

const MAX_COMPARE_TOOLS = 4;
const STORAGE_KEY = 'aura_compare_tool_ids';

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [selectedTools, setSelectedTools] = useState<Tool[]>([]);

  // Helper to persist IDs
  const persistIds = (toolList: Tool[]) => {
    if (typeof window === 'undefined') return;
    try {
      const ids = toolList.map((t) => t.id).filter(Boolean);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // Ignore localStorage errors
    }
  };

  // Hydrate tools by IDs from catalog
  const loadToolsByIds = useCallback((ids: string[]) => {
    const validIds = Array.from(new Set(ids.filter(Boolean))).slice(0, MAX_COMPARE_TOOLS);
    if (validIds.length === 0) return;

    const matched = validIds
      .map((id) => catalogTools.find((t) => t.id.toLowerCase() === id.toLowerCase()))
      .filter((t): t is Tool => Boolean(t));

    if (matched.length > 0) {
      setSelectedTools(matched);
      persistIds(matched);
    }
  }, []);

  // Initial load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        if (Array.isArray(ids) && ids.length > 0) {
          loadToolsByIds(ids);
        }
      }
    } catch {
      // Ignore parsing errors
    }
  }, [loadToolsByIds]);

  const isToolSelected = useCallback(
    (toolId: string) => {
      const normalized = toolId.toLowerCase();
      return selectedTools.some((t) => t.id.toLowerCase() === normalized);
    },
    [selectedTools]
  );

  const addTool = useCallback(
    (tool: Tool): boolean => {
      if (!tool.id) return false;
      const normalized = tool.id.toLowerCase();

      if (selectedTools.some((t) => t.id.toLowerCase() === normalized)) {
        return false;
      }

      if (selectedTools.length >= MAX_COMPARE_TOOLS) {
        return false;
      }

      const next = [...selectedTools, tool];
      setSelectedTools(next);
      persistIds(next);
      return true;
    },
    [selectedTools]
  );

  const removeTool = useCallback(
    (toolId: string) => {
      const normalized = toolId.toLowerCase();
      const next = selectedTools.filter((t) => t.id.toLowerCase() !== normalized);
      setSelectedTools(next);
      persistIds(next);
    },
    [selectedTools]
  );

  const toggleTool = useCallback(
    (tool: Tool) => {
      const normalized = tool.id.toLowerCase();
      if (selectedTools.some((t) => t.id.toLowerCase() === normalized)) {
        removeTool(tool.id);
      } else {
        addTool(tool);
      }
    },
    [selectedTools, addTool, removeTool]
  );

  const clearCompare = useCallback(() => {
    setSelectedTools([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
  }, []);

  return (
    <CompareContext.Provider
      value={{
        selectedTools,
        selectedCount: selectedTools.length,
        maxTools: MAX_COMPARE_TOOLS,
        addTool,
        removeTool,
        toggleTool,
        isToolSelected,
        clearCompare,
        loadToolsByIds,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    return {
      selectedTools: [] as Tool[],
      selectedCount: 0,
      maxTools: MAX_COMPARE_TOOLS,
      addTool: () => false,
      removeTool: () => {},
      toggleTool: () => {},
      isToolSelected: () => false,
      clearCompare: () => {},
      loadToolsByIds: () => {},
    };
  }
  return context;
}

