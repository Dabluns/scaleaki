import './globals.css';
import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import { NichoProvider } from '@/context/NichoContext';
import { OfertaProvider } from '@/context/OfertaContext';
import { SearchProvider } from '@/context/SearchContext';
import { ToastProvider } from '@/components/ui/Toast';
import { ThemeProvider } from '@/context/ThemeContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { GamificationProvider } from '@/context/GamificationContext';
import { ThemeInitializer } from '@/components/gamification/ThemeInitializer';
import '@/lib/migrateStorage'; // Executa migração automaticamente

// ─────────────────────────────────────────────────────────────────
// @architect (Aria) · Fix-HP-002: Tipografia premium via next/font
// Self-hosted automaticamente pelo Next.js — zero layout shift (CLS=0)
// Inter      → corpo, UI, textos gerais
// SpaceGrot  → headings, números de métricas, elementos de destaque
// JetBrainsMono → valores técnicos, códigos, IDs, métricas numéricas
// ─────────────────────────────────────────────────────────────────
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Skaleaki — Ofertas Facebook Ads',
  description: 'Acesse, copie e baixe as melhores ofertas de Facebook Ads com inteligência artificial',
};

import { PageProgressBar } from '@/components/ui/PageProgressBar';
import { Suspense } from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('saas-theme') || 'system';
                  if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <Suspense fallback={null}>
          <PageProgressBar />
        </Suspense>
        <ThemeInitializer />
        <ThemeProvider>
          <SettingsProvider>
            <AuthProvider>
              <GamificationProvider>
                <ToastProvider>
                  <NichoProvider>
                    <OfertaProvider>
                      <SearchProvider>
                        {children}
                      </SearchProvider>
                    </OfertaProvider>
                  </NichoProvider>
                </ToastProvider>
              </GamificationProvider>
            </AuthProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
