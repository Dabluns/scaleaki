"use client";
import React from 'react';
import { useSettings } from '@/context/SettingsContext';
import { Globe, Check } from 'lucide-react';

const LANGS = [
  { key: 'pt_BR', label: 'Português (Brasil)', flag: '🇧🇷' },
  { key: 'en_US', label: 'English (US)', flag: '🇺🇸' },
  { key: 'es_ES', label: 'Español', flag: '🇪🇸' },
  { key: 'fr_FR', label: 'Français', flag: '🇫🇷' },
];

export default function LanguageSelector() {
  const { settings, setSettings } = useSettings();
  const lang = (settings as any)?.language || 'pt_BR';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {LANGS.map((l) => {
          const isSelected = lang === l.key;
          return (
            <button
              key={l.key}
              type="button"
              onClick={() => setSettings({ language: l.key } as any)}
              className={`group relative flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all duration-300 ${
                isSelected 
                  ? 'border-cyan-500 bg-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
                  : 'border-border bg-surface-secondary/50 hover:border-cyan-500/50 hover:bg-cyan-500/10'
              }`}
              aria-label={`Selecionar idioma ${l.label}`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <Check className="w-5 h-5 text-cyan-400" />
                </div>
              )}
              <span className="text-2xl">{l.flag}</span>
              <div>
                <div className="font-semibold text-text-primary">{l.label}</div>
                <div className="text-xs text-text-secondary">{l.key}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}


