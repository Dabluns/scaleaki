'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  Info,
  Power,
  PowerOff,
  Trash2,
  Search,
  Filter,
  ShieldCheck,
  User,
  Mail,
  Globe,
  Calendar,
  Check,
  X,
  Plus,
  ArrowRight,
  ShieldAlert,
  Activity,
  Award,
  Clock,
  ChevronLeft,
  ChevronRight,
  Settings
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Card3D } from '@/components/ui/Card3D';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium UsersMatrix v4.0
// Design Path: Mastery High-Fidelity / Identity Protocol Hub
// ─────────────────────────────────────────────────────────────────

interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  plan: 'free' | 'basic' | 'premium' | 'enterprise';
  isActive: boolean;
  createdAt: string;
  subscriptionEndDate?: string | null;
  subscriptionStatus?: 'active' | 'cancelled' | 'expired' | 'suspended' | 'trial' | null;
}

const PLAN_DISPLAY: Record<UserData['plan'], { label: string; color: string; bg: string }> = {
  free: { label: 'FREE_ACCESS', color: 'text-gray-400', bg: 'bg-gray-400/10' },
  basic: { label: 'MONTH_SABER', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  premium: { label: 'QUARTZ_ELITE', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  enterprise: { label: 'ZENITH_ANNUAL', color: 'text-purple-400', bg: 'bg-purple-400/10' },
};

export const UsersAdmin: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  const [editPlanId, setEditPlanId] = useState<string | null>(null);
  const [editPlan, setEditPlan] = useState<'free' | 'basic' | 'premium' | 'enterprise'>('free');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'activate' | 'deactivate' | 'delete' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filtros
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [plan, setPlan] = useState('');
  const [isActive, setIsActive] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const toast = useToast();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        ...(role && { role }),
        ...(plan && { plan }),
        ...(isActive && { isActive }),
      });
      const res = await fetch(`${API_URL}/admin/users?${params.toString()}`, {
        credentials: 'include',
      });
      const data = await res.json();
      setUsers(data.data || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      toast.showToast('Erro Crítico: Falha na Sincronização de Identidades', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, limit, search, role, plan, isActive]);

  const handleAction = async (user: UserData, action: any) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/users/${user.id}`, {
        method: action.method || 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: action.body ? JSON.stringify(action.body) : undefined,
      });
      if (res.ok) {
        toast.showToast(`Protocolo ${action.label} validado`);
        setConfirmId(null);
        setEditId(null);
        setEditPlanId(null);
        fetchUsers();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const donoId = useMemo(() => {
    return users
      .filter(u => u.role === 'admin')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0]?.id;
  }, [users]);

  return (
    <div className="space-y-12">

      {/* Search & Tactical Filtering Cluster */}
      <div className="flex flex-col xl:flex-row items-stretch gap-6 bg-white/[0.02] border border-white/5 p-8 rounded-[3rem]">
        <div className="relative group flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-green-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="PESQUISAR IDENTITY_DATABASE..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-2xl pl-16 pr-8 py-5 text-[11px] font-black text-white placeholder:text-white/10 focus:outline-none focus:border-green-500/50 transition-all uppercase tracking-[0.2em] italic"
          />
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-[10px] font-black text-white/60 focus:border-green-500/50 outline-none uppercase tracking-widest"
          >
            <option value="" className="bg-black">ALL_ROLES</option>
            <option value="user" className="bg-black">USER</option>
            <option value="admin" className="bg-black">ADMIN</option>
          </select>
          <select
            value={plan}
            onChange={e => setPlan(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-[10px] font-black text-white/60 focus:border-green-500/50 outline-none uppercase tracking-widest"
          >
            <option value="" className="bg-black">ALL_PLANS</option>
            <option value="free" className="bg-black">FREE</option>
            <option value="basic" className="bg-black">MONTHLY</option>
            <option value="premium" className="bg-black">QUARTERLY</option>
            <option value="enterprise" className="bg-black">ANNUAL</option>
          </select>
          <button
            onClick={() => { setSearch(''); setRole(''); setPlan(''); }}
            className="px-6 py-4 text-[10px] font-black text-white/20 hover:text-white transition-colors uppercase tracking-widest"
          >
            LIMP_SCAN
          </button>
        </div>
      </div>

      {/* Identity Matrix Table */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.01]">
              <th className="px-12 py-8 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Identidade_Node</th>
              <th className="px-12 py-8 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Protocolo_Set</th>
              <th className="px-12 py-8 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Status_Rede</th>
              <th className="px-12 py-8 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Timestamp</th>
              <th className="px-12 py-8 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Ações_Comando</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-32 text-center text-white/10 italic text-xs animate-pulse">Sincronizando Identidades...</td>
              </tr>
            ) : users.map((user, idx) => {
              const planConfig = PLAN_DISPLAY[user.plan] || PLAN_DISPLAY['free'];
              const isOwner = user.id === donoId;

              return (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                >
                  {/* Name & Email Identity */}
                  <td className="px-12 py-8">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-full bg-white/5 border border-white/5 flex items-center justify-center group-hover:border-green-500/30 transition-all">
                        <User size={20} className="text-white/20 group-hover:text-green-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-white italic uppercase tracking-tighter group-hover:text-green-500 transition-colors">{user.name}</span>
                        <span className="text-[10px] font-bold text-white/20 font-mono">{user.email}</span>
                      </div>
                    </div>
                  </td>

                  {/* Plan & Role Protocol */}
                  <td className="px-12 py-8">
                    <div className="flex flex-col gap-2">
                      {editPlanId === user.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editPlan}
                            onChange={e => setEditPlan(e.target.value as any)}
                            className="bg-black border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white outline-none"
                          >
                            <option value="free">FREE</option>
                            <option value="basic">MONTHLY</option>
                            <option value="premium">QUARTERLY</option>
                            <option value="enterprise">ANNUAL</option>
                          </select>
                          <button onClick={() => handleAction(user, { body: { plan: editPlan }, label: 'PLAN_UPDATE' })}><Check size={14} className="text-green-500" /></button>
                          <button onClick={() => setEditPlanId(null)}><X size={14} className="text-red-500" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className={clsx("px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest", planConfig.bg, planConfig.color)}>
                            {planConfig.label}
                          </div>
                          <button
                            onClick={() => { setEditPlanId(user.id); setEditPlan(user.plan); }}
                            className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Settings size={10} className="text-white/20 hover:text-white" />
                          </button>
                        </div>
                      )}
                      <span className={clsx("text-[9px] font-bold uppercase tracking-widest", user.role === 'admin' ? 'text-green-500' : 'text-white/20')}>
                        Protocol: {user.role.toUpperCase()}
                      </span>
                    </div>
                  </td>

                  {/* Network Status */}
                  <td className="px-12 py-8">
                    <div className="flex items-center gap-3">
                      <div className={clsx("w-2 h-2 rounded-full", user.isActive ? 'bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500/40')} />
                      <span className={clsx("text-[10px] font-black uppercase tracking-widest", user.isActive ? 'text-green-500' : 'text-red-500/60')}>
                        {user.isActive ? 'OPERATIONAL' : 'LINK_DOWN'}
                      </span>
                    </div>
                  </td>

                  {/* Timestamp */}
                  <td className="px-12 py-8">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono text-white/40">{new Date(user.createdAt).toLocaleDateString('pt-BR')}</span>
                      <span className="text-[8px] font-black text-white/10 uppercase tracking-widest">Entry_Time</span>
                    </div>
                  </td>

                  {/* Command Actions */}
                  <td className="px-12 py-8">
                    <div className="flex items-center gap-3">
                      {isOwner ? (
                        <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2">
                          <ShieldCheck size={12} className="text-green-500" />
                          <span className="text-[9px] font-black text-green-500 uppercase tracking-widest tracking-[0.2em]">CROWN_ADMIN</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                          <button
                            onClick={() => { setConfirmId(user.id); setConfirmAction(user.isActive ? 'deactivate' : 'activate'); }}
                            className={clsx(
                              "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500",
                              user.isActive ? "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-black" : "bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500 hover:text-black"
                            )}
                          >
                            {user.isActive ? <PowerOff size={14} /> : <Power size={14} />}
                          </button>
                          <button
                            onClick={() => { setConfirmId(user.id); setConfirmAction('delete'); }}
                            className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-black transition-all duration-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <div className="p-12 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-4 text-[10px] font-black text-white/20 uppercase tracking-widest">
            <span>Página <span className="text-white/60">{page}</span> de <span className="text-white/60">{totalPages}</span></span>
            <span className="text-white/5">|</span>
            <span>Total: <span className="text-white/60">{total}</span> NODES</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 disabled:opacity-20 transition-all border border-white/5"
            >
              <ChevronLeft size={16} className="text-white" />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 disabled:opacity-20 transition-all border border-white/5"
            >
              <ChevronRight size={16} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Overlays */}
      <AnimatePresence>
        {confirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-8 backdrop-blur-2xl bg-black/80"
          >
            <Card3D variant="glass" className="w-full max-w-lg p-12 bg-[#0d0d0d] border-red-500/30 rounded-[3rem] text-center space-y-8">
              <div className="flex flex-col items-center gap-4">
                <ShieldAlert size={64} className="text-red-500 animate-pulse" />
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">PROTOCOLO_CRÍTICO</h2>
              </div>
              <p className="text-sm font-bold text-white/40 leading-relaxed uppercase italic">
                CONFIRMAR AÇÃO {confirmAction?.toUpperCase()} NO NÓ DE IDENTIDADE ESPECIFICADO. ESTA OPERAÇÃO AFETARÁ OS PRIVILÉGIOS DE ACESSO AO SISTEMA CENTRAL.
              </p>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    const user = users.find(u => u.id === confirmId);
                    if (!user) return;
                    if (confirmAction === 'delete') {
                      handleAction(user, { method: 'DELETE', label: 'PURGE_SUCCESS' });
                    } else {
                      handleAction(user, { body: { isActive: confirmAction === 'activate' }, label: 'STATUS_SHIFT' });
                    }
                  }}
                  className="flex-1 py-5 rounded-2xl bg-red-500 text-black font-black uppercase text-[12px] tracking-widest shadow-[0_20px_40px_rgba(239,68,68,0.2)] active:scale-95 transition-all"
                >
                  Confirmar Purgação
                </button>
                <button
                  onClick={() => { setConfirmId(null); setConfirmAction(null); }}
                  className="px-8 py-5 rounded-2xl border border-white/10 text-white/20 hover:text-white font-black uppercase text-[12px] tracking-widest"
                >
                  Abortar
                </button>
              </div>
            </Card3D>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};