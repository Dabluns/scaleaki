'use client';

import { useEffect } from 'react';
import { initializeTheme } from '@/lib/themes';

export const ThemeInitializer: React.FC = () => {
  useEffect(() => {
    initializeTheme();
  }, []);

  return null;
};

