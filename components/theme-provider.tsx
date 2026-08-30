'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'akoin_theme_preference';

export const ThemeScript = () => {
  const scriptSrc = `
    (function() {
      try {
        var key = '${STORAGE_KEY}';
        var stored = localStorage.getItem(key);
        var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
        var theme = stored || 'system';
        var resolved = theme === 'system' ? (darkQuery.matches ? 'dark' : 'light') : theme;
        document.documentElement.setAttribute('data-theme', resolved);
        if (resolved === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: scriptSrc }} />;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme) || 'system';
    setThemeState(stored);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = () => {
      const active = stored === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : stored;
      setResolvedTheme(active);
      document.documentElement.setAttribute('data-theme', active);
      document.documentElement.classList.toggle('dark', active === 'dark');
    };

    updateTheme();
    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const active = newTheme === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : newTheme;
    setResolvedTheme(active);
    document.documentElement.setAttribute('data-theme', active);
    document.documentElement.classList.toggle('dark', active === 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
