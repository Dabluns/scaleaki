"use client";
import React from 'react';
import { useSettings } from '@/context/SettingsContext';

export default function ThemeSelector() {
  const { settings, setSettings } = useSettings();
  const value = (settings?.theme as string) || 'auto';
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-black">Tema</label>
      <div className="flex gap-2" role="radiogroup" aria-label="Selecionar tema">
        {['light', 'dark', 'auto'].map((mode) => {
          const active = value === mode;
          return (
            <button
              key={mode}
              onClick={() => setSettings({ theme: mode })}
              className={`flex items-center gap-2 rounded border px-3 py-1.5 text-sm transition ${
                active
                  ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/5 text-gray-900'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              } focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/40`}
              type="button"
              role="radio"
              aria-checked={active}
            >
              <span aria-hidden>
                {mode === 'light' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
                  </svg>
                )}
                {mode === 'dark' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-gray-700">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
                {mode === 'auto' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                    <path d="M20 12A8 8 0 1 1 4 12a8 8 0 0 1 16 0z" />
                    <path d="M2 12h20" />
                  </svg>
                )}
              </span>
              <span className="capitalize">{mode}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}


