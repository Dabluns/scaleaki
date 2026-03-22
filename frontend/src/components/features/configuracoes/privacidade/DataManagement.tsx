"use client";
import React, { useState } from 'react';
import { Database, Download, Terminal, Activity, LoaderCircle, CheckCircle, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium DataManagement v5.0
// Design Path: Mastery High-Fidelity / Data Custody Terminal
// ─────────────────────────────────────────────────────────────────

export default function DataManagement() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  async function requestExport() {
    setLoading(true);
    setStatus('REQUEST_BATCH_INIT');
    try {
      const res = await fetch(`${api}/export/data`, { method: 'POST', credentials: 'include' });
      const json = await res.json();
      if (res.ok) {
        setStatus('EXPORT_ASYNC_QUEUED // ENVIADO');
      } else {
        setStatus(json.error || 'EXPORT_FAILURE // ERR-500');
      }
    } catch (error) {
      setStatus('NETWORK_SYNC_ERROR');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#0a0a0a]/40 border border-white/5 rounded-3xl p-8 lg:p-10 relative overflow-hidden group">
      {/* Background Graphic */}
      <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:opacity-[0.04] transition-opacity">
        <Database size={200} />
      </div>

      <div className="relative z-10 flex flex-col gap-12">

        <header className="flex items-center justify-between border-b border-white/5 pb-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">DATA_CUSTODY</h2>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic font-mono">CHANNEL_ID // ARCHIVE-01</p>
          </div>
          <div className="hidden sm:flex items-center gap-4 px-6 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
            <Database size={14} className="text-indigo-500" />
            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest italic">OWN_YOUR_DATA</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <p className="text-[12px] font-bold text-white/40 uppercase italic tracking-widest leading-relaxed">
              Inicie o protocolo de exportação de dados civis e operacionais. O sistema gerará um arquivo compactado (ZIP) contendo todo o seu histórico e o enviará para o endereço de email autenticado.
            </p>
            <div className="flex items-center gap-4 text-white/10">
              <Terminal size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest font-mono italic">PROCESS_MODE: ASYNC_BATCH</span>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-6">
            <button
              onClick={requestExport}
              disabled={loading}
              className={clsx(
                "w-full py-6 rounded-2xl font-black text-[13px] uppercase tracking-[0.3em] transition-all duration-700 active:scale-95 shadow-2xl flex items-center justify-center gap-4 relative overflow-hidden group/btn",
                loading ? "bg-white/5 text-white/20 cursor-wait" : "bg-indigo-600 text-white hover:bg-indigo-500"
              )}
            >
              {/* Background Shine */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />

              {loading ? <LoaderCircle size={22} className="animate-spin" /> : <Download size={22} />}
              {loading ? 'REQUESTING_BATCH...' : 'INIT_EXPORT_PROTOCOL'}
            </button>

            <AnimatePresence>
              {status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className={clsx(
                    "p-6 rounded-2xl border flex items-center gap-4 transition-all duration-700",
                    status.includes('SUCCESS') || status.includes('QUEUED') ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-red-500/10 border-red-500/20 text-red-500"
                  )}
                >
                  {status.includes('SUCCESS') || status.includes('QUEUED') ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span className="text-[10px] font-black uppercase tracking-widest italic font-mono">{status}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
