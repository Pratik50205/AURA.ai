'use client';

import { useEffect } from 'react';

export default function ThemeInitializer() {
  useEffect(() => {
    try {
      const pref = localStorage.getItem('aura-theme-preference');
      // Default to light theme unless explicitly set to 'false' (dark)
      if (pref === 'false' || pref === '"dark"') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  return null;
}
