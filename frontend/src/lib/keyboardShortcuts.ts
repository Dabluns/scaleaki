'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';

export interface KeyboardShortcut {
  keys: string[];
  description: string;
  action: () => void;
}

export const useGlobalKeyboardShortcuts = () => {
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' || 
                       target.getAttribute('contenteditable') === 'true';

      if (isTyping) return; // Não capturar quando estiver digitando

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? '⌘' : 'Ctrl';

      // Ctrl/Cmd + K - Busca rápida
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('header-search') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          toast.showInfo(`🔍 Busca rápida aberta (${modifier}+K)`, 2000);
        }
      }

      // Ctrl/Cmd + D - Dashboard
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        router.push('/dashboard');
        toast.showInfo(`📊 Dashboard (${modifier}+D)`, 2000);
      }

      // Ctrl/Cmd + O - Ofertas
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        router.push('/ofertas');
        toast.showInfo(`💰 Ofertas (${modifier}+O)`, 2000);
      }

      // Ctrl/Cmd + N - Nichos
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        router.push('/nichos');
        toast.showInfo(`🎯 Nichos (${modifier}+N)`, 2000);
      }

      // Ctrl/Cmd + F - Favoritos
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        router.push('/favoritos');
        toast.showInfo(`❤️ Favoritos (${modifier}+F)`, 2000);
      }

      // Ctrl/Cmd + ? - Mostrar ajuda completa
      if ((e.ctrlKey || e.metaKey) && e.key === '?') {
        e.preventDefault();
        toast.showInfo(
          `⌨️ Atalhos: ${modifier}+K (busca), ${modifier}+D (dashboard), ${modifier}+O (ofertas), ${modifier}+N (nichos), ${modifier}+F (favoritos), / (sidebar)`,
          5000
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, toast]);
};

