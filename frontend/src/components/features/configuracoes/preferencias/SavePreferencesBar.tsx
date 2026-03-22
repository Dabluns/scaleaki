"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useSettings } from '@/context/SettingsContext';
import { Card3D } from '@/components/ui/Card3D';
import { Save, CheckCircle, LoaderCircle, Activity } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium SavePreferencesBar v5.0
// Design Path: Mastery High-Fidelity / Preference Commit Hub
// ─────────────────────────────────────────────────────────────────

export default function SavePreferencesBar() {
  const { settings, refresh } = useSettings();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const { showToast } = useToast();
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  async function save() {
    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch(`${api}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings || {}),
      });

      if (res.ok) {
        await refresh();
        setSuccess(true);
        showToast('CONFIGURAÇÕES SINCRONIZADAS! ✅', 'success', 3000);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        showToast('ERRO NA PERSISTÊNCIA DE PREFERÊNCIAS', 'error', 5000);
      }
    } catch (error) {
      showToast('FALHA OPERACIONAL DE REDE', 'error', 5000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex w-full items-center justify-end">
      <button
        onClick={save}
        disabled={saving}
        className={clsx(
          "w-full sm:w-auto px-16 py-8 rounded-[2rem] font-black text-[14px] uppercase tracking-[0.4em] transition-all duration-700 active:scale-95 shadow-2xl flex items-center justify-center gap-6 overflow-hidden relative group",
          saving ? "bg-white/5 text-white/20 cursor-wait" :
            success ? "bg-green-500 text-black shadow-[0_0_50px_rgba(34,197,94,0.3)]" : "bg-white text-black hover:bg-blue-500 hover:text-white"
        )}
      >
        {/* Background Scan Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

        <div className="relative z-10 flex items-center gap-6">
          {saving ? (
            <>
              <LoaderCircle className="w-6 h-6 animate-spin" />
              <span>SINCRONIZANDO_SUBSISTEMAS</span>
            </>
          ) : success ? (
            <>
              <CheckCircle size={22} fill="currentColor" />
              <span>PREFS_COMMIT_SUCCESS</span>
            </>
          ) : (
            <>
              <Save size={22} fill="currentColor" />
              <span>COMMIT_PREFERENCES</span>
            </>
          )}
        </div>

        {!saving && !success && (
          <Activity size={16} className="absolute right-8 opacity-0 group-hover:opacity-20 transition-opacity" />
        )}
      </button>
    </div>
  );
}
