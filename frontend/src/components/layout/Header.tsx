"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { LucideBell, LucideSearch, LucideUser, LogOut, X, ExternalLink, ShieldCheck, Zap, Activity, ArrowRight } from 'lucide-react';
import { getMe, logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { useSearchContext } from '@/context/SearchContext';
import { Oferta } from '@/types/oferta';
import { useNichos } from '@/context/NichoContext';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium Header v3.1
// Focus: High-Fidelity Glass, Industrial status widgets, 
// Cyberpunk Search Engine Dropdown, and refined typography.
// ─────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const SearchResultsDropdown: React.FC = () => {
  const { ofertasSearchTerm, setOfertasSearchTerm, filteredOfertas, isSearchingOfertas } = useSearchContext();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setIsOpen(ofertasSearchTerm.length > 0);
  }, [ofertasSearchTerm]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative group" ref={containerRef}>
      <div className="absolute inset-0 bg-green-500/5 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity rounded-full" />
      <div className="relative">
        <input
          type="text"
          value={ofertasSearchTerm}
          onFocus={() => setIsOpen(ofertasSearchTerm.length > 0)}
          onChange={(e) => {
            const val = e.target.value;
            setOfertasSearchTerm(val);
          }}
          placeholder="VARREDURA DE OFERTAS..."
          className="w-64 px-10 py-2.5 bg-white/[0.03] border border-white/5 rounded-2xl text-[10px] font-black text-white placeholder:text-white/20 focus:outline-none focus:border-green-500/30 focus:ring-4 focus:ring-green-500/5 transition-all uppercase tracking-widest"
        />
        <LucideSearch className="absolute left-3.5 top-3 text-white/20 group-focus-within:text-green-500 transition-colors" size={14} />

        {isSearchingOfertas && (
          <div className="absolute right-3.5 top-3.5 w-3 h-3 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-[400px] bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden z-[50]"
          >
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <Activity size={12} className="text-green-500" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Resultados da Varredura</span>
              </div>
              <span className="text-[9px] font-mono text-white/20 uppercase">{filteredOfertas.length} NODES_FOUND</span>
            </div>

            <div className="max-h-[450px] overflow-y-auto scrollbar-hide py-2">
              {filteredOfertas.length > 0 ? (
                filteredOfertas.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => {
                      setIsOpen(false);
                      setOfertasSearchTerm('');
                      // Precisamos do slug do nicho. Se não tiver, tentamos inferir ou usamos o ID
                      const nichoSlug = (o.nicho as any)?.slug || o.nichoId;
                      router.push(`/oferta/${nichoSlug}/${o.id}`);
                    }}
                    className="w-full text-left px-5 py-4 hover:bg-white/[0.04] transition-all border-b border-white/5 last:border-0 group/item"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-[11px] font-black text-white uppercase tracking-tight group-hover/item:text-green-500 transition-colors">{o.titulo}</div>
                        <div className="text-[9px] text-white/30 uppercase tracking-widest flex items-center gap-2">
                          <span className="w-1 h-1 bg-white/20 rounded-full" />
                          {o.nichoId} // {o.linguagem}
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-white/10 group-hover/item:translate-x-1 group-hover/item:text-green-500 transition-all mt-1" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center py-20 grayscale opacity-40">
                  <LucideSearch size={32} className="text-white/10 mb-4" />
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">Nenhum Dado Localizado</p>
                </div>
              )}
            </div>

            {filteredOfertas.length > 0 && (
              <div className="p-4 bg-green-500/[0.03] border-t border-white/5 text-center">
                <span className="text-[8px] font-black text-green-500/40 uppercase tracking-[0.4em]">Fim do Fluxo de Resultados</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NotificationDropdown: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [visualizadas, setVisualizadas] = useState(false);
  const [recs, setRecs] = useState<Oferta[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    async function fetchRecs() {
      try {
        const res = await fetch(`${API_URL}/ofertas/recommendations?limit=8`, { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          setRecs(Array.isArray(json?.data) ? json.data : []);
          setVisualizadas(true);
        }
      } catch (e) { }
    }
    if (open) fetchRecs();
  }, [open]);

  const notificacoesNaoLidas = visualizadas ? 0 : (recs?.length || 0);

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.08] hover:border-green-500/30 transition-all group"
      >
        <LucideBell size={18} className={clsx("transition-transform group-hover:rotate-12", notificacoesNaoLidas > 0 ? "text-green-500" : "text-white/40")} />
        {notificacoesNaoLidas > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-ping" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Recomendações</h4>
              <Zap size={14} className="text-green-500" />
            </div>
            <div className="max-h-80 overflow-y-auto">
              {recs.length > 0 ? (
                recs.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => { setOpen(false); router.push(`/oferta/${o.nichoId}/${o.id}`); }}
                    className="w-full text-left p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                  >
                    <div className="text-xs font-black text-white mb-1 truncate uppercase">{o.titulo}</div>
                    <div className="text-[10px] text-white/30 truncate">{o.texto}</div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-[10px] font-bold text-white/20 uppercase tracking-widest">Silêncio no Radar</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export interface HeaderProps {
  breadcrumbs?: { label: string; href?: string }[];
  onOpenMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ breadcrumbs, onOpenMobileSidebar }) => {
  const [user, setUser] = useState<any>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    getMe().then(setUser);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/?mode=login');
  };

  return (
    <header className="sticky top-0 z-[100] px-6 py-4 flex items-center justify-between backdrop-blur-md bg-transparent">
      <div className="flex items-center gap-8">
        {/* Mobile Toggle */}
        <button onClick={onOpenMobileSidebar} className="lg:hidden p-2 text-white/40 hover:text-white transition-colors">
          <Activity size={20} />
        </button>

        {/* Tactical Breadcrumbs */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40">
            <ShieldCheck size={20} />
          </div>
          {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        </div>

        {/* Status System */}
        <div className="hidden xl:flex items-center gap-6 px-5 py-2 bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Sinal</span>
              <span className="text-[10px] font-black text-white/80 uppercase">Premium Ativo</span>
            </div>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Região</span>
            <span className="text-[10px] font-black text-white/80 uppercase">Global Hub</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Global Search Engine Module */}
        <div className="hidden md:block">
          <SearchResultsDropdown />
        </div>

        <NotificationDropdown />

        {/* User Module */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-3 p-1.5 pr-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.08] transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 group-hover:text-green-500 transition-colors">
              <LucideUser size={18} />
            </div>
            <div className="hidden md:flex flex-col items-start min-w-[80px]">
              <span className="text-[10px] font-black text-white/80 uppercase truncate w-full">{user?.name?.split(' ')[0] || 'Agente'}</span>
              <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{user?.role || 'User'}</span>
            </div>
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-48 bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl z-[110]"
              >
                <button
                  onClick={handleLogout}
                  className="w-full text-left p-4 hover:bg-red-500/10 text-white/60 hover:text-red-500 transition-all flex items-center gap-3"
                >
                  <LogOut size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Encerrar Sessão</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
