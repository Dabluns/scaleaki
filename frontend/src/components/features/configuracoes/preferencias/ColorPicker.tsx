"use client";
import React from 'react';
import { useSettings } from '@/context/SettingsContext';
import { Check } from 'lucide-react';

const PRESET_COLORS = [
  { value: '#22c55e', name: 'Verde', gradient: 'from-green-500 to-green-600' },
  { value: '#06b6d4', name: 'Ciano', gradient: 'from-cyan-500 to-cyan-600' },
  { value: '#a855f7', name: 'Roxo', gradient: 'from-purple-500 to-purple-600' },
  { value: '#3b82f6', name: 'Azul', gradient: 'from-blue-500 to-blue-600' },
  { value: '#ec4899', name: 'Rosa', gradient: 'from-pink-500 to-pink-600' },
  { value: '#f59e0b', name: 'Laranja', gradient: 'from-orange-500 to-orange-600' },
];

export default function ColorPicker() {
  const { settings, setSettings } = useSettings();
  const current = (settings?.accentColor as string) || '#22c55e';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {PRESET_COLORS.map((color) => {
          const isSelected = current === color.value;
          return (
            <button
              key={color.value}
              type="button"
              onClick={() => setSettings({ accentColor: color.value })}
              className={`group relative h-14 w-14 rounded-xl border-2 transition-all duration-300 ${
                isSelected 
                  ? 'border-green-500 scale-110 shadow-[0_0_20px_rgba(34,197,94,0.6)]' 
                  : 'border-border hover:border-green-500/50 hover:scale-105'
              }`}
              style={{ 
                background: `linear-gradient(135deg, ${color.value} 0%, ${color.value}dd 100%)`,
              }}
              aria-label={`Selecionar cor ${color.name}`}
            >
              {isSelected && (
                <>
                  <div className="absolute -inset-1 bg-green-500 rounded-xl blur-lg opacity-40 animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]" />
                  </div>
                </>
              )}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                {color.name}
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Color Picker Customizado */}
      <div className="pt-4 border-t border-border/50">
        <label className="block text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-purple-500 rounded-full" />
          Cor personalizada
        </label>
        <div className="relative group/input">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-lg blur opacity-0 group-hover/input:opacity-30 transition-opacity duration-300" />
          <input
            type="color"
            value={current}
            onChange={(e) => setSettings({ accentColor: e.target.value })}
            className="relative h-12 w-full cursor-pointer rounded-lg border-2 border-border bg-surface/80 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300"
          />
        </div>
      </div>
    </div>
  );
}


