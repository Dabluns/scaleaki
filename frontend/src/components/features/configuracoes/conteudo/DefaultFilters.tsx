"use client";
import React from 'react';
import { useSettings } from '@/context/SettingsContext';
import { Card3D } from '@/components/ui/Card3D';
import { Filter } from 'lucide-react';

const STATUS_OPTS = ['ativa','pausada','arquivada','teste'];
const TIPO_OPTS = ['ecommerce','lead_generation','app_install','brand_awareness','video_views','conversions','traffic'];
const LANGS = ['pt_BR','en_US','es_ES','fr_FR'];

function formatLabel(str: string): string {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function DefaultFilters() {
  const { settings, setSettings } = useSettings();
  const s: any = settings || {};
  const status: string[] = Array.isArray(s.defaultStatus) ? s.defaultStatus : (s.defaultStatus ? JSON.parse(s.defaultStatus) : ['ativa','pausada','teste']);
  const tipos: string[] = Array.isArray(s.preferredTipoOferta) ? s.preferredTipoOferta : (s.preferredTipoOferta ? JSON.parse(s.preferredTipoOferta) : []);
  const langs: string[] = Array.isArray(s.preferredLanguages) ? s.preferredLanguages : (s.preferredLanguages ? JSON.parse(s.preferredLanguages) : ['pt_BR']);

  function toggle(arr: string[], key: string, field: string) {
    const set = new Set(arr);
    if (set.has(key)) set.delete(key); else set.add(key);
    setSettings({ [field]: Array.from(set) } as any);
  }

  return (
    <Card3D 
      variant="elevated" 
      hover={true}
      glow={true}
      has3DRotation={true}
      animatedBorder={true}
      className="p-8 relative overflow-hidden group"
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-2xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 shimmer opacity-20" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative group/icon">
            <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full blur-lg opacity-30 group-hover/icon:opacity-50 transition-opacity duration-300" />
            <div className="relative w-12 h-12 bg-gradient-to-br from-emerald-500/30 via-teal-500/30 to-cyan-500/30 rounded-full flex items-center justify-center border-2 border-emerald-500/50 backdrop-blur-sm">
              <Filter className="w-6 h-6 text-emerald-400" style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))' }} />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mb-1">
              Filtros Padrão
            </h2>
            <p className="text-text-secondary">
              Status, tipo de oferta e idioma.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="font-semibold text-text-primary mb-3">Status</div>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTS.map(st => (
                <div
                  key={st}
                  className={`px-4 py-2 rounded-lg border-2 transition-all duration-300 cursor-pointer ${
                    status.includes(st)
                      ? 'border-emerald-500/50 bg-emerald-500/10 hover:border-emerald-500/70'
                      : 'border-border bg-surface-secondary/50 hover:border-emerald-500/50'
                  }`}
                  onClick={() => toggle(status, st, 'defaultStatus')}
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={status.includes(st)}
                      onChange={() => toggle(status, st, 'defaultStatus')}
                    />
                    <span className="text-sm font-medium text-text-primary">{formatLabel(st)}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="font-semibold text-text-primary mb-3">Tipo de Oferta</div>
            <div className="flex flex-wrap gap-2">
              {TIPO_OPTS.map(t => (
                <div
                  key={t}
                  className={`px-4 py-2 rounded-lg border-2 transition-all duration-300 cursor-pointer ${
                    tipos.includes(t)
                      ? 'border-emerald-500/50 bg-emerald-500/10 hover:border-emerald-500/70'
                      : 'border-border bg-surface-secondary/50 hover:border-emerald-500/50'
                  }`}
                  onClick={() => toggle(tipos, t, 'preferredTipoOferta')}
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={tipos.includes(t)}
                      onChange={() => toggle(tipos, t, 'preferredTipoOferta')}
                    />
                    <span className="text-sm font-medium text-text-primary">{formatLabel(t)}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="font-semibold text-text-primary mb-3">Idioma</div>
            <div className="flex flex-wrap gap-2">
              {LANGS.map(l => (
                <div
                  key={l}
                  className={`px-4 py-2 rounded-lg border-2 transition-all duration-300 cursor-pointer ${
                    langs.includes(l)
                      ? 'border-emerald-500/50 bg-emerald-500/10 hover:border-emerald-500/70'
                      : 'border-border bg-surface-secondary/50 hover:border-emerald-500/50'
                  }`}
                  onClick={() => toggle(langs, l, 'preferredLanguages')}
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={langs.includes(l)}
                      onChange={() => toggle(langs, l, 'preferredLanguages')}
                    />
                    <span className="text-sm font-medium text-text-primary">{l.replace('_', '-').toUpperCase()}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card3D>
  );
}
