"use client";
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evitar hidratação mismatch
  useEffect(() => setMounted(true), []);
  
  if (!mounted) {
    return (
      <div className="flex items-center gap-2 p-1 bg-surface-secondary rounded-lg border border-border">
        <div className="w-8 h-8" />
        <div className="w-8 h-8" />
        <div className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-1 bg-surface-secondary rounded-lg border border-border">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded transition ${
          theme === 'light' 
            ? 'bg-accent text-white' 
            : 'text-text-secondary hover:bg-surface-hover'
        }`}
        aria-label="Tema claro"
        title="Tema claro"
      >
        <Sun className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded transition ${
          theme === 'system' 
            ? 'bg-accent text-white' 
            : 'text-text-secondary hover:bg-surface-hover'
        }`}
        aria-label="Tema do sistema"
        title="Seguir sistema"
      >
        <Monitor className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded transition ${
          theme === 'dark' 
            ? 'bg-accent text-white' 
            : 'text-text-secondary hover:bg-surface-hover'
        }`}
        aria-label="Tema escuro"
        title="Tema escuro"
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  );
}

