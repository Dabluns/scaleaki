"use client";

import { useAuth } from '@/context/AuthContext';
import { BotControlPanel } from '@/components/admin/BotControlPanel';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShieldAlert, Activity, ChevronRight, Terminal, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium AdminBotPage v5.0
// Design Path: Mastery High-Fidelity / Autonomous Command Hub
// ─────────────────────────────────────────────────────────────────

export default function AdminBotPage() {
    const { isAdmin, loading } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!loading && !isAdmin) {
            router.push('/');
        }
    }, [loading, isAdmin, router]);

    if (loading || !mounted) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Activity className="text-green-500 animate-spin w-12 h-12" />
        </div>
    );

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-black text-center p-8">
                <ShieldAlert className="h-20 w-20 text-red-500 mb-6 drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]" />
                <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">Acesso Restrito</h1>
                <p className="text-white/40 uppercase text-[10px] font-bold tracking-[0.3em]">Protocolo de Segurança Ativo // Admin_Only</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white pb-32">

            {/* Massive Header Section */}
            <div className="relative pt-24 pb-16 px-8 lg:px-20 max-w-[1700px] mx-auto overflow-hidden">
                <div className="absolute top-0 right-0 p-20 opacity-[0.03] pointer-events-none">
                    <Terminal size={500} className="rotate-12" />
                </div>

                <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.6)]" />
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] italic">Operational_Node // AUTOMATION_HUB</span>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-7xl lg:text-9xl font-black italic uppercase tracking-tighter leading-[0.8] drop-shadow-2xl">
                            AUTOMAÇÃO <br />
                            <span className="text-green-500">DE UPLOAD</span>
                        </h1>
                        <p className="max-w-xl text-[12px] font-bold text-white/40 uppercase tracking-tight italic leading-relaxed pt-4">
                            Orquestrador autônomo de ativos digitais. Gerenciamento de sincronização heurística e processamento neural de fluxos do Google Drive.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Command Viewport */}
            <div className="max-w-[1700px] mx-auto px-6 lg:px-20">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="grid grid-cols-1 gap-12"
                >
                    {/* The new BotControlPanel v5.0 takes full stage here */}
                    <div className="bg-[#050505] border border-white/5 rounded-[4rem] p-1 lg:p-2 overflow-hidden">
                        <div className="bg-[#0a0a0a] rounded-[3.8rem] p-8 lg:p-16">
                            <BotControlPanel />
                        </div>
                    </div>

                    {/* Operational Intelligence Cluster (Former instructions) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] space-y-8 group hover:border-green-500/20 transition-all duration-700">
                            <div className="flex items-center gap-4">
                                <Activity size={20} className="text-green-500" />
                                <h3 className="text-[12px] font-black text-white uppercase tracking-[0.3em] italic underline underline-offset-8 decoration-white/10">Lógica_Operacional</h3>
                            </div>
                            <ul className="space-y-6">
                                {[
                                    { t: "Varredura Heurística", d: "Monitoramento de diretórios Cloud a cada 10 min." },
                                    { t: "Neural Processing", d: "IA Gemini Pro realiza a taxonomia de mercado autônoma." },
                                    { t: "Node Synchronization", d: "Download e indexação automática via Supabase CDN." },
                                    { t: "Critical Cleanup", d: "Protocolo de purgação executado às 03:00 AM." }
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-6 group/item">
                                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-white/10 group-hover/item:bg-green-500 transition-colors" />
                                        <div className="space-y-1">
                                            <span className="text-[11px] font-black text-white uppercase tracking-wider">{item.t}</span>
                                            <p className="text-[10px] font-bold text-white/30 uppercase italic">{item.d}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] flex flex-col justify-center items-center text-center space-y-6 relative overflow-hidden">
                            <div className="absolute inset-0 bg-green-500/[0.02] animate-pulse" />
                            <ShieldCheck size={64} className="text-green-500/20 group-hover:scale-110 transition-transform duration-1000" />
                            <div className="space-y-2 relative z-10">
                                <h4 className="text-[14px] font-black text-white uppercase tracking-[0.4em] italic leading-tight">Sistema_Sincronizado</h4>
                                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic leading-relaxed max-w-xs">
                                    Todos os protocolos de segurança e integridade de dados estão operando em estado nominal.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

        </div>
    );
}
