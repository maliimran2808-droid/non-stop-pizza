'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';

export const useThemeInit = () => {
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    // Apply theme on mount
    const savedTheme = localStorage.getItem('nonstop-pizza-theme');
    if (savedTheme) {
      const parsed = JSON.parse(savedTheme);
      setTheme(parsed.state.theme);
    } else {
      setTheme('light');
    }
  }, [setTheme]);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  return theme;
};