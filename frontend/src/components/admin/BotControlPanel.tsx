'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import {
    Play,
    Square,
    Loader2,
    Cpu,
    Activity,
    ShieldCheck,
    Terminal,
    Zap,
    CloudLightning,
    AlertCircle,
    Clock,
    Database,
    Search,
    Network,
    Cpu as BotIcon,
    Sparkles,
    RefreshCw,
    HardDrive,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Info
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useCounter } from '@/hooks/useCounter';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium BotControlPanel v6.0 (LIVE DATA)
// Design Path: Mastery High-Fidelity / Production-Ready
// Phase 1: Real-time logs from DB, live metrics, config validation
// ─────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface BotLog {
    id: string;
    level: string;
    message: string;
    offerName: string | null;
    cycleId: string | null;
    createdAt: string;
}

interface BotStatusData {
    status: 'running' | 'stopped';
    lastCycleAt: string | null;
    lastSuccessAt: string | null;
    lastErrorAt: string | null;
    lastError: string | null;
    totalCycles: number;
    totalOffers: number;
    totalErrors: number;
    startedAt: string | null;
    uptime: number | null;
    currentCycleId: string | null;
}

export function BotControlPanel() {
    const { user } = useAuth();
    const [statusData, setStatusData] = useState<BotStatusData | null>(null);
    const [status, setStatus] = useState<'running' | 'stopped' | 'loading'>('loading');
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<BotLog[]>([]);
    const [mounted, setMounted] = useState(false);
    const [configErrors, setConfigErrors] = useState<string[]>([]);

    const isAdmin = user?.role === 'admin';

    // Fetch status com dados detalhados do banco
    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/bot/status`, {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                setStatus(data.status);
                setStatusData(data);
            }
        } catch (err) {
            console.error('Failed to fetch bot status', err);
        }
    }, []);

    // Fetch logs reais do banco
    const fetchLogs = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/bot/logs?limit=20`, {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success && data.logs) {
                setLogs(data.logs);
            }
        } catch (err) {
            console.error('Failed to fetch bot logs', err);
        }
    }, []);

    useEffect(() => {
        setMounted(true);
        if (isAdmin) {
            fetchStatus();
            fetchLogs();
            const statusInterval = setInterval(fetchStatus, 10000);
            const logsInterval = setInterval(fetchLogs, 8000);
            return () => {
                clearInterval(statusInterval);
                clearInterval(logsInterval);
            };
        }
    }, [isAdmin, fetchStatus, fetchLogs]);

    const toggleBot = async () => {
        setLoading(true);
        setConfigErrors([]);
        const action = status === 'running' ? 'stop' : 'start';

        try {
            const res = await fetch(`${API_URL}/bot/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                setStatus(data.status);
                if (data.warnings?.length) {
                    setConfigErrors(data.warnings);
                }
                // Recarregar logs e status
                setTimeout(() => { fetchStatus(); fetchLogs(); }, 1500);
            } else if (data.errors) {
                setConfigErrors(data.errors);
            }
        } catch (err) {
            setConfigErrors(['Falha de conexão com o servidor.']);
        } finally {
            setLoading(false);
        }
    };

    // Formatar uptime
    const formatUptime = (ms: number | null) => {
        if (!ms) return '--';
        const seconds = Math.floor(ms / 1000);
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    };

    // Formatar data relativa
    const formatRelativeTime = (dateStr: string | null) => {
        if (!dateStr) return '--';
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'agora';
        if (mins < 60) return `${mins}min atrás`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h atrás`;
        return `${Math.floor(hours / 24)}d atrás`;
    };

    // Ícone para nível de log
    const getLogIcon = (level: string) => {
        switch (level) {
            case 'success': return <CheckCircle2 size={12} className="text-green-500" />;
            case 'error': return <XCircle size={12} className="text-red-500" />;
            case 'warning': return <AlertTriangle size={12} className="text-yellow-500" />;
            default: return <Info size={12} className="text-white/30" />;
        }
    };

    return (
        <div className="space-y-12">

            {/* Config Errors Banner */}
            <AnimatePresence>
                {configErrors.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-red-500/10 border border-red-500/20 rounded-[2rem] p-6 space-y-2"
                    >
                        <div className="flex items-center gap-3">
                            <AlertCircle size={18} className="text-red-500" />
                            <span className="text-[12px] font-black text-red-400 uppercase tracking-widest">
                                Problemas de Configuração
                            </span>
                        </div>
                        {configErrors.map((err, i) => (
                            <div key={i} className="text-[11px] font-bold text-red-300/80 pl-7">
                                • {err}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* BIG HERO COMMAND HUB */}
            <div className="bg-white/[0.01] border border-white/5 rounded-[3rem] lg:rounded-[4rem] p-8 lg:p-20 relative overflow-hidden group">
                <div className={clsx(
                    "absolute -top-1/2 -right-1/4 w-[800px] h-[800px] blur-[150px] transition-all duration-1000 opacity-40",
                    status === 'running' ? "bg-green-500/20" : "bg-red-500/10"
                )} />

                <div className="relative z-10 flex flex-col xl:grid xl:grid-cols-12 gap-12 xl:gap-20 items-center">
                    <div className="xl:col-span-7 space-y-10 w-full text-center xl:text-left">
                        <div className="flex items-center justify-center xl:justify-start gap-6">
                            <div className={clsx(
                                "w-3 h-3 rounded-full",
                                status === 'running' ? "bg-green-500 animate-pulse shadow-[0_0_20px_rgba(34,197,94,0.8)]" : "bg-red-500/40"
                            )} />
                            <span className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] italic">Autonomous_Agent // NEXUS_UPLOAD v2.0</span>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white italic uppercase tracking-tighter leading-[0.85] drop-shadow-2xl">
                                BOT <br />
                                <span className="text-white">AUTOMATOR</span>
                            </h2>
                            <div className={clsx(
                                "text-3xl md:text-4xl lg:text-5xl font-black italic uppercase tracking-tighter transition-colors duration-1000",
                                status === 'running' ? "text-green-500" : "text-white/10"
                            )}>
                                {status === 'running' ? 'PROTOCOL_ACTIVE' : 'SYSTEM_HALTED'}
                            </div>
                        </div>

                        <p className="max-w-2xl mx-auto xl:mx-0 text-[12px] font-bold text-white/30 uppercase tracking-tight italic leading-relaxed border-l-2 border-white/5 xl:pl-8">
                            Monitoramento heurístico de infraestrutura cloud em tempo real. Importação autônoma via processamento neural de metadados do Google Drive.
                        </p>
                    </div>

                    {/* COMMAND ACTIONS */}
                    <div className="xl:col-span-5 flex flex-col gap-6 w-full max-w-[450px]">
                        <button
                            onClick={toggleBot}
                            disabled={loading}
                            className={clsx(
                                "group relative overflow-hidden px-10 py-10 lg:py-14 rounded-[2rem] lg:rounded-[3rem] font-black text-[16px] lg:text-[20px] uppercase tracking-[0.3em] transition-all duration-700 shadow-[0_50px_100px_rgba(0,0,0,0.5)] active:scale-95 w-full",
                                status === 'running'
                                    ? "bg-red-500 text-black hover:bg-red-400"
                                    : "bg-green-500 text-black hover:bg-green-400 shadow-[0_30px_70px_rgba(34,197,94,0.4)]"
                            )}
                        >
                            <div className="flex items-center justify-center gap-6 relative z-10">
                                {loading ? (
                                    <Loader2 className="w-8 h-8 lg:w-12 lg:h-12 animate-spin" />
                                ) : status === 'running' ? (
                                    <>
                                        <Square size={28} className="lg:w-8 lg:h-8" fill="currentColor" />
                                        <span className="whitespace-nowrap">ENCERRAR_RECURSOS</span>
                                    </>
                                ) : (
                                    <>
                                        <Play size={28} className="lg:w-8 lg:h-8" fill="currentColor" />
                                        <span className="whitespace-nowrap">INICIALIZAR_SISTEMA</span>
                                    </>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>

                        {/* Uptime / Last Cycle */}
                        <div className="flex items-center justify-between px-8 py-6 bg-white/[0.03] border border-white/5 rounded-[2rem] backdrop-blur-xl w-full">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                                    {status === 'running' ? 'Uptime' : 'Último Ciclo'}
                                </span>
                                <span className="text-[11px] lg:text-[13px] font-bold text-white/60 tabular-nums font-mono">
                                    {status === 'running'
                                        ? formatUptime(statusData?.uptime || null)
                                        : formatRelativeTime(statusData?.lastCycleAt || null)
                                    }
                                </span>
                            </div>
                            <div className="p-3 rounded-xl bg-white/5 text-green-500">
                                <ShieldCheck size={20} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SYSTEM STATUS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex items-center justify-between group hover:border-green-500/20 transition-all">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
                            <HardDrive size={24} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Google Drive</span>
                            <span className="text-[14px] font-black text-white italic uppercase tracking-tighter">Status: Conectado</span>
                        </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                </div>

                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex items-center justify-between group hover:border-cyan-500/20 transition-all">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                            <Sparkles size={24} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Motor de IA</span>
                            <span className="text-[14px] font-black text-white italic uppercase tracking-tighter">Protocolo: Gemini Pro</span>
                        </div>
                    </div>
                    <span className="text-[10px] font-black text-cyan-500 bg-cyan-500/10 px-3 py-1 rounded-full uppercase tabular-nums">v2.0</span>
                </div>

                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex items-center justify-between group hover:border-yellow-500/20 transition-all md:col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                            <RefreshCw size={24} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Intervalo_Ciclo</span>
                            <span className="text-[14px] font-black text-white italic uppercase tracking-tighter">A cada 10 minutos</span>
                        </div>
                    </div>
                    <Clock size={16} className="text-yellow-500/20" />
                </div>
            </div>

            {/* LIVE METRICS FROM DB */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { icon: Activity, label: 'Ofertas_Importadas', val: `${statusData?.totalOffers ?? 0}`, sub: 'Total', color: 'text-green-500' },
                    { icon: CloudLightning, label: 'Ciclos_Executados', val: `${statusData?.totalCycles ?? 0}`, sub: 'Ciclos', color: 'text-cyan-500' },
                    { icon: AlertCircle, label: 'Erros_Registrados', val: `${statusData?.totalErrors ?? 0}`, sub: 'Erros', color: statusData?.totalErrors ? 'text-red-500' : 'text-white/20' },
                    { icon: Clock, label: 'Último_Sucesso', val: formatRelativeTime(statusData?.lastSuccessAt || null), sub: 'Sync', color: 'text-white/40' }
                ].map((item, i) => (
                    <div key={i} className="p-10 bg-[#0a0a0a] border border-white/5 rounded-[3rem] flex flex-col gap-8 hover:border-white/10 transition-all group h-full">
                        <div className={clsx("w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center transition-transform group-hover:scale-110", item.color)}>
                            <item.icon size={20} />
                        </div>
                        <div className="space-y-2">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic">{item.label}</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-white italic tracking-tighter tabular-nums">{item.val}</span>
                                <span className="text-[11px] font-black text-white/10 uppercase italic">{item.sub}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* LIVE TERMINAL — Real Logs from DB */}
            <div className="bg-[#050505] border border-white/5 rounded-[3.5rem] p-12 space-y-10 relative overflow-hidden">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Terminal size={18} className="text-white/20" />
                        <span className="text-[12px] font-black text-white/40 uppercase tracking-[0.4em]">Live_Terminal // DB_LOG_STREAM</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-white/10 uppercase tracking-widest tabular-nums">
                            {logs.length} logs
                        </span>
                        <button
                            onClick={fetchLogs}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/30 hover:text-white/60"
                        >
                            <RefreshCw size={14} />
                        </button>
                    </div>
                </div>

                <div className="space-y-3 font-mono max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    <AnimatePresence initial={false}>
                        {logs.length === 0 ? (
                            <div className="py-10 text-center text-white/5 italic text-[12px] uppercase tracking-widest font-black">
                                Aguardando Influxo de Dados Operacionais...
                            </div>
                        ) : logs.map((log) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex gap-4 text-[11px] leading-relaxed group items-start"
                            >
                                <div className="flex items-center gap-2 shrink-0 mt-0.5">
                                    {getLogIcon(log.level)}
                                    <span className="text-white/10 font-black tabular-nums text-[10px]">
                                        {new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                </div>
                                <span className={clsx(
                                    "font-bold uppercase tracking-tight leading-snug",
                                    log.level === 'success' ? 'text-green-500' :
                                        log.level === 'error' ? 'text-red-500' :
                                            log.level === 'warning' ? 'text-yellow-500' :
                                                'text-white/40'
                                )}>
                                    {log.offerName && (
                                        <span className="text-white/15 font-normal normal-case mr-2">[{log.offerName}]</span>
                                    )}
                                    {log.message}
                                </span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Last Error Banner */}
            <AnimatePresence>
                {statusData?.lastError && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-red-500/5 border border-red-500/10 rounded-[2rem] p-6 flex items-start gap-4"
                    >
                        <AlertTriangle size={18} className="text-red-500/60 mt-0.5 shrink-0" />
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-red-400/60 uppercase tracking-widest">Último Erro Registrado</span>
                            <p className="text-[11px] font-bold text-red-300/50 font-mono">{statusData.lastError}</p>
                            {statusData.lastErrorAt && (
                                <p className="text-[10px] text-red-400/30">{formatRelativeTime(statusData.lastErrorAt)}</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
