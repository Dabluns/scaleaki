"use client";

import React, { useState, useEffect } from 'react';
import ProfileForm from '@/components/features/configuracoes/perfil/ProfileForm';
import { Card3D } from '@/components/ui/Card3D';
import {
  User,
  ShieldCheck,
  Activity,
  Fingerprint,
  Globe,
  Zap,
  Terminal,
  Cpu,
  Lock,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium Perfil Page v5.0
// Design Path: Mastery High-Fidelity / Identity Management
// ─────────────────────────────────────────────────────────────────

export default function PerfilSettingsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black text-white pb-32 overflow-x-hidden">

      {/* Editorial Identity Header */}
      <div className="relative pt-16 pb-12 px-6 lg:px-12 max-w-7xl mx-auto overflow-hidden">
        {/* Decorative Background HUD */}
        <div className="absolute top-0 right-0 p-20 opacity-[0.03] pointer-events-none">
          <Fingerprint size={600} className="rotate-12" />
        </div>

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-end justify-between gap-16 border-b border-white/5 pb-16">
          <div className="space-y-10 flex-1">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-4 px-6 py-2.5 rounded-full bg-white/5 border border-white/5 text-white/40 font-black text-[10px] uppercase tracking-[0.4em] italic">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                IDENTITY_SYNC // SECURE_HUB
              </div>
              <div className="flex items-center gap-3 border-l border-white/5 pl-6">
                <Globe size={14} className="text-white/20" />
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest font-mono">NODE_LOCATION: BR_SAO_PAULO</span>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black italic uppercase tracking-tighter leading-[0.8] drop-shadow-2xl">
                PROFILE<br />
                <span className="text-green-500">MATRIX</span>
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-10 pt-6">
                <p className="text-[12px] font-bold text-white/30 uppercase tracking-[0.3em] italic max-w-md">
                  Gerenciamento de credenciais biográficas e integridade de acesso ao ecossistema Skaleaki.
                </p>
                <div className="hidden sm:block w-px h-10 bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-green-500/40 uppercase tracking-widest font-mono">ACCOUNT_ID</span>
                  <span className="text-[14px] font-black text-white uppercase tracking-tighter italic font-mono">SKL-882-QX-24</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tactical Status Clusters (HUD) */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[
              { label: 'Integridade', value: 'NOMINAL', icon: ShieldCheck, color: 'text-green-500' },
              { label: 'Security_Level', value: 'TIER_MAX', icon: Lock, color: 'text-cyan-500' },
              { label: 'System_Sync', value: 'LIVE', icon: Activity, color: 'text-purple-500' }
            ].map((item, i) => (
              <div key={i} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3 group hover:border-white/10 transition-all">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${item.color}`}>
                    <item.icon size={18} />
                  </div>
                  <div className="h-1 w-12 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-current w-2/3" />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-none block">{item.label}</span>
                  <span className="text-xl font-black text-white italic uppercase tracking-tighter block">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Form Content Area */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* Left: Settings Form */}
        <div className="lg:col-span-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0a0a0a]/40 border border-white/5 rounded-3xl p-8 lg:p-12 relative overflow-hidden group"
          >
            {/* Background Technical Grid */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="relative z-10">
              <div className="mb-16 flex items-center justify-between">
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">DATA_BASE // CORE</h2>
                  <p className="text-[11px] font-bold text-white/20 uppercase tracking-widest italic">Sincronizador de informações cadastrais e administrativas.</p>
                </div>
                <Terminal className="text-white/10 hidden sm:block" size={32} />
              </div>
              <ProfileForm />
            </div>
          </motion.div>
        </div>

        {/* Right: Security Insight & Tips */}
        <div className="lg:col-span-4 space-y-10">

          <div className="p-8 bg-white/[0.01] border border-white/5 rounded-3xl space-y-8 group">
            <div className="flex items-center gap-4 text-green-500/40">
              <Cpu size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">SYSLOG // SECURITY</span>
            </div>

            <div className="space-y-12">
              <div className="space-y-4">
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Proteção_de_Identidade</h3>
                <p className="text-[12px] font-bold text-white/20 uppercase tracking-tight italic leading-relaxed">
                  Seu perfil está vinculado a uma conta Skaleaki Alpha. Certifique-se de manter seus dados atualizados para garantir a recepção de alertas de bot e logs do sistema.
                </p>
              </div>

              <div className="space-y-6">
                {[
                  { l: 'Verificação em Duas Etapas', s: 'Ativado' },
                  { l: 'IP Único de Acesso', s: 'Permitido' },
                  { l: 'Logs de Atividade', s: 'Visível' }
                ].map((t, i) => (
                  <div key={i} className="flex items-center justify-between group/tip">
                    <span className="text-[11px] font-black text-white/40 uppercase tracking-widest group-hover/tip:text-white transition-colors">{t.l}</span>
                    <ArrowRight size={14} className="text-green-500/20 group-hover/tip:text-green-500 transition-all opacity-0 group-hover/tip:opacity-100" />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-10 border-t border-white/5">
              <button className="w-full py-6 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/10 hover:text-white transition-all">
                ALTERAR_CREDENCIAL_DE_ACESSO
              </button>
            </div>
          </div>

          {/* Account Usage Metric */}
          <div className="p-8 bg-green-500/5 border border-green-500/20 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.05] text-green-500">
              <Zap size={100} />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-green-500/40 uppercase tracking-widest italic">Membership_Status</span>
                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">ULTIMATE_ELITE</h3>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[85%] shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
              </div>
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest block text-right">85% // QUOTA_UTILIZATION</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
