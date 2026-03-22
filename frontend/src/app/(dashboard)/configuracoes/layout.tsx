import React from 'react';
import { SettingsProvider } from '@/context/SettingsContext';
import SettingsLayout from '@/components/features/configuracoes/SettingsLayout';

export default function SettingsRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <SettingsLayout>
        {children}
      </SettingsLayout>
    </SettingsProvider>
  );
}


