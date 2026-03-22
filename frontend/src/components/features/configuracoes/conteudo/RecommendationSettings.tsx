"use client";
import React from 'react';
import { useSettings } from '@/context/SettingsContext';
import { Card3D } from '@/components/ui/Card3D';
import { Sparkles } from 'lucide-react';

export default function RecommendationSettings() {
  const { settings, setSettings } = useSettings();
  const s: any = settings || {};

  return (
    <Card3D 
      variant="elevated" 
      hover={true}
      glow={true}
      has3DRotation={true}
      animatedBorder={true}
      className="p-8 relative overflow-hidden group"
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/20 via-rose-500/20 to-fuchsia-500/20 rounded-2xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 shimmer opacity-20" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative group/icon">
            <div className="absolute -inset-2 bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 rounded-full blur-lg opacity-30 group-hover/icon:opacity-50 transition-opacity duration-300" />
            <div className="relative w-12 h-12 bg-gradient-to-br from-pink-500/30 via-rose-500/30 to-fuchsia-500/30 rounded-full flex items-center justify-center border-2 border-pink-500/50 backdrop-blur-sm">
              <Sparkles className="w-6 h-6 text-pink-400" style={{ filter: 'drop-shadow(0 0 6px rgba(236, 72, 153, 0.6))' }} />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black bg-gradient-to-r from-pink-400 via-rose-400 to-fuchsia-400 bg-clip-text text-transparent mb-1">
              Recomendações
            </h2>
            <p className="text-text-secondary">
              Personalize o algoritmo e a diversidade.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg border-2 border-border bg-surface-secondary/50 hover:border-pink-500/50 transition-all duration-300">
            <label className="block text-sm font-semibold text-text-primary mb-2">Algoritmo</label>
            <select
              className="w-full rounded-lg border-2 border-border bg-surface px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
              value={s.recoAlgorithm || 'hybrid'}
              onChange={(e) => setSettings({ recoAlgorithm: e.target.value } as any)}
            >
              <option value="favorites">Baseado em favoritos</option>
              <option value="trending">Tendências</option>
              <option value="hybrid">Híbrido</option>
            </select>
          </div>

          <div className="p-4 rounded-lg border-2 border-border bg-surface-secondary/50 hover:border-pink-500/50 transition-all duration-300">
            <label className="block text-sm font-semibold text-text-primary mb-2">Frequência</label>
            <select
              className="w-full rounded-lg border-2 border-border bg-surface px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
              value={s.recoFrequency || 'medium'}
              onChange={(e) => setSettings({ recoFrequency: e.target.value } as any)}
            >
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>
          </div>

          <div className="p-4 rounded-lg border-2 border-border bg-surface-secondary/50 hover:border-pink-500/50 transition-all duration-300">
            <label className="block text-sm font-semibold text-text-primary mb-2">Diversidade</label>
            <select
              className="w-full rounded-lg border-2 border-border bg-surface px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
              value={s.recoDiversity || 'balanced'}
              onChange={(e) => setSettings({ recoDiversity: e.target.value } as any)}
            >
              <option value="explore">Explorar</option>
              <option value="balanced">Balanceado</option>
              <option value="focus">Focar</option>
            </select>
          </div>
        </div>
      </div>
    </Card3D>
  );
}
