'use client';

import { useThemeInit } from '@/hooks/useThemeInit';
import { ReactNode } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeProvider = ({ children }: ThemeProviderProps) => {
  useThemeInit();
  return <>{children}</>;
};

export default ThemeProvider;