'use client';

import React, { useMemo, useState } from 'react';
import { TrendingUp, Activity, Edit3, Save, X, Plus, Trash2, Database } from 'lucide-react';
import { Oferta } from '@/types/oferta';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium AnunciosChart v2.0
// Features: Mastery High-Fidelity, Industrial Technical Chart,
// Editorial Typography, Monospace Meta-Data, No Soft Gradients.
// ─────────────────────────────────────────────────────────────────

interface AnunciosChartProps {
  oferta: Oferta;
  onUpdate?: (data: DataPoint[]) => void;
}

interface DataPoint {
  month: string;
  year: number;
  monthIndex: number;
  anuncios: number;
  dateKey?: string;
}

export const AnunciosChart: React.FC<AnunciosChartProps> = ({ oferta, onUpdate }) => {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState<DataPoint[]>([]);
  const [saving, setSaving] = useState(false);

  const chartData = useMemo(() => {
    const metricas = oferta.metricas as any;
    if (metricas?.chartData && Array.isArray(metricas.chartData) && metricas.chartData.length > 0) {
      return metricas.chartData.map((d: any) => ({
        month: d.month,
        year: d.year,
        monthIndex: d.monthIndex,
        anuncios: d.anuncios || 0,
        dateKey: d.dateKey || `${d.year}-${d.monthIndex}`,
      }));
    }

    const createdAt = new Date(oferta.createdAt);
    const now = new Date();
    const months: DataPoint[] = [];
    let currentDate = new Date(createdAt);
    currentDate.setDate(1);

    while (currentDate <= now) {
      const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'short' });
      const year = currentDate.getFullYear();
      const monthIndex = currentDate.getMonth();
      const baseAnuncios = 0;
      months.push({
        month: monthName,
        year,
        monthIndex,
        anuncios: baseAnuncios,
        dateKey: `${year}-${monthIndex}`,
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return months;
  }, [oferta.createdAt, oferta.metricas]);

  const displayData = isEditing ? editingData : chartData;
  const maxAnunciosVal = Math.max(...displayData.map((d: DataPoint) => d.anuncios), 1);
  const totalAnuncios = displayData.reduce((sum: number, d: DataPoint) => sum + d.anuncios, 0);

  const chartHeight = 240;

  const handleEdit = () => {
    setEditingData([...chartData]);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      const metricas = { ...((oferta as any).metricas || {}), chartData: editingData };
      const res = await fetch('/api/ofertas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: (oferta as any).id, metricas }),
      });
      if (res.ok) {
        showToast('Matriz de dados atualizada.', 'success', 3000);
        setIsEditing(false);
        if (onUpdate) onUpdate(editingData);
        window.location.reload();
      }
    } catch {
      showToast('Erro na sincronização.', 'error', 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-12">

      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
        <div className="space-y-2">
          <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter">
            FLUXO DE <span className="text-green-500">PRESENÇA</span>
          </h2>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
            Mapeamento de Impulso Publicitário no Tempo
          </p>
        </div>

        <div className="flex items-center gap-10">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">DENSIDADE TOTAL</span>
            <span className="text-4xl font-black text-green-500 italic tracking-tighter">{totalAnuncios.toLocaleString('pt-BR')} <span className="text-sm not-italic opacity-30">ADS</span></span>
          </div>
          {isAdmin && (
            <button
              onClick={isEditing ? handleSave : handleEdit}
              disabled={saving}
              className={clsx(
                "flex items-center gap-3 px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                isEditing
                  ? "bg-green-500 text-black hover:scale-105"
                  : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
              )}
            >
              {isEditing ? <Save size={14} /> : <Edit3 size={14} />}
              {isEditing ? (saving ? 'SINCRONIZANDO...' : 'SALVAR MATRIZ') : 'MODIFICAR DADOS'}
            </button>
          )}
          {isEditing && (
            <button onClick={() => setIsEditing(false)} className="text-[10px] font-black text-white/30 hover:text-white uppercase tracking-widest transition-colors">DESCARTAR</button>
          )}
        </div>
      </div>

      {/* Main Terminal View */}
      <div className="relative">
        {isEditing ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {editingData.map((data, index) => (
              <div key={index} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-3">
                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{data.month} {data.year}</span>
                <input
                  type="number"
                  min="0"
                  value={data.anuncios}
                  onChange={(e) => {
                    const newData = [...editingData];
                    newData[index].anuncios = Math.max(0, parseInt(e.target.value) || 0);
                    setEditingData(newData);
                  }}
                  className="bg-black border border-white/10 rounded-xl px-4 py-2 text-white font-black italic text-lg outline-none focus:border-green-500/50"
                />
                <button onClick={() => setEditingData(editingData.filter((_, i) => i !== index))} className="text-[8px] font-black text-red-500/50 hover:text-red-500 uppercase self-end">REMOVER_NÓ</button>
              </div>
            ))}
            <button
              onClick={() => {
                const last = editingData[editingData.length - 1];
                const nextDate = new Date(last.year, last.monthIndex + 1, 1);
                setEditingData([...editingData, {
                  month: nextDate.toLocaleDateString('pt-BR', { month: 'short' }),
                  year: nextDate.getFullYear(),
                  monthIndex: nextDate.getMonth(),
                  anuncios: 0,
                  dateKey: `${nextDate.getFullYear()}-${nextDate.getMonth()}`
                }]);
              }}
              className="p-4 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center text-white/20 hover:text-white hover:border-white/30 transition-all font-black text-[10px] uppercase tracking-widest"
            >
              + ADICIONAR VARIÁVEL DE TEMPO
            </button>
          </motion.div>
        ) : (
          <div className="relative overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-white/10">
            <svg
              width={Math.max(800, displayData.length * 100)}
              height={chartHeight + 80}
              className="overflow-visible"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Tactical Grid */}
              {[0, 0.25, 0.5, 0.75, 1].map((p: number, i: number) => (
                <line key={i} x1="0" y1={chartHeight * p} x2="100%" y2={chartHeight * p} stroke="white" strokeOpacity="0.03" strokeWidth="1" strokeDasharray="4 4" />
              ))}

              {/* Line Path */}
              {displayData.length > 1 && (() => {
                const availableWidth = Math.max(800, displayData.length * 100);
                const step = availableWidth / (displayData.length - 1);
                const points = displayData.map((d: DataPoint, i: number) => ({
                  x: i * step,
                  y: chartHeight - (d.anuncios / maxAnunciosVal) * chartHeight
                }));

                const pathD = `M ${points.map((p: { x: number, y: number }) => `${p.x},${p.y}`).join(' L ')}`;
                const areaD = `${pathD} V ${chartHeight} H 0 Z`;

                return (
                  <>
                    <path d={areaD} fill="url(#chartGradient)" />
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="3"
                      className="drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                    />
                    {points.map((p: { x: number, y: number }, i: number) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="4" fill="white" className="drop-shadow-[0_0_4px_rgba(34,197,94,0.8)]" />
                        <text x={p.x} y={chartHeight + 35} textAnchor="middle" fill="white" fillOpacity="0.2" className="text-[9px] font-black uppercase tracking-widest">
                          {displayData[i].month.toUpperCase()}
                        </text>
                        <text x={p.x} y={chartHeight + 50} textAnchor="middle" fill="white" fillOpacity="0.1" className="text-[8px] font-mono">
                          '{displayData[i].year.toString().slice(-2)}
                        </text>
                        <text x={p.x} y={p.y - 12} textAnchor="middle" fill="green" fillOpacity="0.6" className="text-[10px] font-black italic">
                          {displayData[i].anuncios}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}

              {displayData.length === 1 && (
                <circle cx="50%" cy={chartHeight / 2} r="6" fill="#22c55e" className="animate-pulse" />
              )}
            </svg>
          </div>
        )}
      </div>

      {/* Meta-Data Footer Status */}
      {!isEditing && displayData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-y border-white/5">
          {[
            { label: 'FREQUÊNCIA MÉDIA', val: Math.floor(totalAnuncios / displayData.length), unit: 'U/M' },
            { label: 'PICO DE IMPULSO', val: Math.max(...displayData.map((d: DataPoint) => d.anuncios)), unit: 'ADS' },
            { label: 'CICLO TEMPORAL', val: displayData.length, unit: 'MESES' },
            { label: 'ESTABILIDADE', val: '98.5%', unit: 'STATUS' }
          ].map((st: { label: string; val: string | number; unit: string; }, i: number) => (
            <div key={i} className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">{st.label}</span>
              <span className="text-xl font-black text-white italic uppercase tracking-tighter">
                {st.val} <span className="text-[10px] not-italic text-green-500/50 ml-1">{st.unit}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
         .scrollbar-thin::-webkit-scrollbar { height: 4px; }
         .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>

    </div>
  );
};
