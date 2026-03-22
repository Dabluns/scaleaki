"use client";
import React, { useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { Button } from '@/components/ui/Button';
import { Smartphone, Zap, ShieldCheck, Activity, Terminal, Lock, Unlock, LoaderCircle, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium PushNotifications v5.0
// Design Path: Mastery High-Fidelity / External Push Relay
// ─────────────────────────────────────────────────────────────────

export default function PushNotifications() {
  const { settings, setSettings } = useSettings();
  const s: any = settings || {};
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function requestPermissionAndSubscribe() {
    setLoading(true);
    setStatus('');
    try {
      if (!('Notification' in window)) {
        setStatus('BROWSER_UNSUPPORTED: PUSH_NOT_FOUND');
        setLoading(false);
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setStatus('ACCESS_DENIED: PERMISSION_REJECTED');
        setLoading(false);
        return;
      }
      const fakeSubscription = { endpoint: 'fake', keys: { p256dh: 'fake', auth: 'fake' } };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/notifications/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subscription: fakeSubscription })
      });
      if (!res.ok) throw new Error('RELAY_SYNC_FAILURE');
      setSettings({ pushEnabled: true } as any);
      setStatus('PUSH_RELAY_ESTABLISHED // SUCCESS');
    } catch (e: any) {
      setStatus(e?.message || 'ERROR_OPERATIONAL_RELAY');
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    setLoading(true);
    setStatus('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/notifications/push/subscribe`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('DECOUPLE_FAILURE');
      setSettings({ pushEnabled: false } as any);
      setStatus('PUSH_RELAY_TERMINATED.');
    } catch (e: any) {
      setStatus(e?.message || 'ERROR_DECOUPLING_RELAY');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#0a0a0a]/40 border border-white/5 rounded-3xl p-8 lg:p-10 relative overflow-hidden group">
      {/* Background Graphic */}
      <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:opacity-[0.04] transition-opacity">
        <Smartphone size={200} />
      </div>

      <div className="relative z-10 flex flex-col gap-12">

        <header className="flex items-center justify-between border-b border-white/5 pb-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">EXTERNAL_RELAY</h2>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic font-mono">CHANNEL_ID // PUSH-NET-01</p>
          </div>
          <div className={clsx(
            "hidden sm:flex items-center gap-4 px-6 py-2 border rounded-full transition-all duration-700",
            s.pushEnabled ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-white/5 border-white/10 text-white/20"
          )}>
            <ShieldCheck size={14} className={s.pushEnabled ? "animate-pulse" : ""} />
            <span className="text-[9px] font-black uppercase tracking-widest italic">{s.pushEnabled ? 'CONNECTION_SECURE' : 'RELAY_OFFLINE'}</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#080808] border border-white/5 space-y-4">
              <div className="flex items-center gap-4">
                <div className={clsx(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                  s.pushEnabled ? "bg-green-500 text-black shadow-2xl" : "bg-white/5 text-white/10"
                )}>
                  {s.pushEnabled ? <Lock size={18} fill="currentColor" /> : <Unlock size={18} />}
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest block font-mono">STATUS_PROTOCOL</span>
                  <span className="text-xl font-black text-white italic uppercase tracking-tighter block">{s.pushEnabled ? 'TERMINAL_LINKED' : 'NOT_SYNCED'}</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] font-bold text-white/20 uppercase italic tracking-widest leading-relaxed ml-4">
              As notificações push permitem que o Skaleaki envie alertas críticos diretamente para o seu sistema operacional, mesmo com o navegador minimizado.
            </p>
          </div>

          <div className="flex flex-col justify-center gap-6">
            {!s.pushEnabled ? (
              <button
                onClick={requestPermissionAndSubscribe}
                disabled={loading}
                className="w-full py-6 rounded-2xl bg-white text-black font-black text-[13px] uppercase tracking-[0.3em] transition-all duration-700 hover:bg-green-500 active:scale-95 flex items-center justify-center gap-4 shadow-2xl"
              >
                {loading ? <LoaderCircle className="w-6 h-6 animate-spin" /> : <Zap size={22} fill="currentColor" />}
                {loading ? 'SYNCING...' : 'ESTABLISH_RELAY'}
              </button>
            ) : (
              <button
                onClick={unsubscribe}
                disabled={loading}
                className="w-full py-6 rounded-2xl bg-black border border-red-500/20 text-red-500 font-black text-[13px] uppercase tracking-[0.3em] transition-all duration-700 hover:bg-red-500 hover:text-white active:scale-95 flex items-center justify-center gap-4"
              >
                {loading ? <LoaderCircle className="w-6 h-6 animate-spin" /> : <Activity size={22} />}
                {loading ? 'TERMINATING...' : 'TERMINATE_RELAY'}
              </button>
            )}

            <AnimatePresence>
              {status && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  className={clsx(
                    "p-6 rounded-2xl border flex items-center gap-4 transition-all duration-700",
                    status.includes('SUCCESS') ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-red-500/10 border-red-500/20 text-red-500"
                  )}
                >
                  <AlertCircle size={16} />
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
