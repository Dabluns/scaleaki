"use client";

import React, { useEffect, useState } from 'react';
import {
  LucideSearch, LucideIcon, Heart, DollarSign, UserMinus,
  BookOpen, Shield, Lock, TrendingUp, Settings, Wrench,
  BarChart3, ShieldCheck, LockKeyhole, Home, Package,
  ChevronDown, Image as ImageIcon, Clock, Sparkles, Trophy, Video,
  Menu, ChevronLeft, ChevronRight, LogOut,
  User, Bell, FileText, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import clsx from 'clsx';
import { usePathname, useRouter } from 'next/navigation';
import { useNichos } from '@/context/NichoContext';
import { useAuth } from '@/context/AuthContext';
import { useSearchContext } from '@/context/SearchContext';
import { useReelsStats } from '@/hooks/useReelsStats';
import { getLucideIconByName } from '@/lib/icons';

// Sub-items de Configurações (espelhando o SettingsLayout)
const configSubItems = [
  { href: '/configuracoes/perfil', label: 'Perfil', icon: User },
  { href: '/configuracoes/preferencias', label: 'Interface', icon: Settings },
  { href: '/configuracoes/notificacoes', label: 'Notificações', icon: Bell },
  { href: '/configuracoes/privacidade', label: 'Privacidade', icon: Lock },
  { href: '/configuracoes/conteudo', label: 'Conteúdo', icon: FileText },
  { href: '/configuracoes/plano', label: 'Plano', icon: CreditCard },
];

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Sidebar Premium v3.0
// Pegada: Cyberpunk refined, fluidity focus, macOS-like precision.
// ─────────────────────────────────────────────────────────────────

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
  isActive: boolean;
  badge?: string | number;
  hasNew?: boolean;
  isNicho?: boolean;
  iconColor?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

const NavItem: React.FC<NavItemProps> = ({
  href, icon: Icon, label, collapsed, isActive, badge, hasNew, isNicho, iconColor, onClick, children
}) => {
  return (
    <motion.li layout className="relative list-none">
      <a
        href={href}
        onClick={onClick}
        className={clsx(
          "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ease-out",
          isActive
            ? "text-white"
            : "text-white/40 hover:text-white/80"
        )}
      >
        {/* Active Background - Layout Animation */}
        {isActive && (
          <motion.div
            layoutId="sidebar-active-pill"
            className="absolute inset-0 bg-green-500/20 border border-green-500/30 rounded-xl"
            initial={false}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <div className="absolute inset-0 bg-green-500/10 blur-md rounded-xl" />
          </motion.div>
        )}

        <div className="relative z-10 flex items-center justify-center w-6 h-6">
          <Icon
            className={clsx(
              "w-5 h-5 transition-all duration-500",
              isActive
                ? "text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                : "group-hover:text-green-400/80 group-hover:scale-110"
            )}
            strokeWidth={isActive ? 2.5 : 2}
          />
          {hasNew && (
            <motion.div
              className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-background"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          )}
        </div>

        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={clsx(
              "relative z-10 flex-1 text-sm font-medium tracking-wide transition-colors",
              isActive ? "text-white font-bold" : ""
            )}
          >
            {label}
            {badge && (
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10 group-hover:bg-green-500/20 group-hover:text-green-400 group-hover:border-green-500/20 transition-all">
                {badge}
              </span>
            )}
          </motion.span>
        )}

        {/* Indicator Line (Vertical) */}
        {isActive && (
          <motion.div
            layoutId="sidebar-active-line"
            className="absolute left-0 w-1 h-4 bg-green-500 rounded-full"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}

        {!collapsed && children}
      </a>
    </motion.li>
  );
};

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Exported Components for Layout Consistency
// Estes componentes são exportados para uso no DashboardLayout (Mobile, etc)
// ─────────────────────────────────────────────────────────────────

export const SidebarSearch: React.FC<{
  search: string,
  setSearch: (v: string) => void,
  collapsed?: boolean
}> = ({ search, setSearch, collapsed }) => (
  <div className={clsx('p-3 transition-all duration-500', collapsed && 'hidden opacity-0')}>
    <div className="relative group">
      <div className="absolute -inset-1 bg-green-500/0 group-focus-within:bg-green-500/20 rounded-xl blur-lg transition-all duration-500 opacity-0 group-focus-within:opacity-100" />
      <input
        id="sidebar-search"
        type="text"
        placeholder="Buscar nichos... ( / )"
        className="relative z-10 w-full rounded-xl bg-white/5 backdrop-blur-md text-white placeholder:text-white/20 px-3 py-2.5 pl-9 pr-8 text-sm focus:outline-none border border-white/5 focus:border-green-500/50 transition-all duration-300"
        tabIndex={collapsed ? -1 : 0}
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <LucideSearch className="absolute left-2.5 top-3 text-green-400/60 drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]" size={16} />
      {search && (
        <button
          onClick={() => setSearch('')}
          className="absolute right-2.5 top-3 w-5 h-5 rounded-full text-white/20 hover:text-red-400 hover:scale-110 transition-all duration-300 flex items-center justify-center font-bold"
        >
          ×
        </button>
      )}
    </div>
  </div>
);

export const SidebarUserProfile: React.FC<{ collapsed?: boolean }> = ({ collapsed }) => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className={clsx(
      'p-4 flex items-center gap-3 transition-all duration-500',
      collapsed && 'justify-center'
    )}>
      <div className="relative flex-shrink-0">
        <div className="absolute inset-0 bg-green-500/20 blur-md rounded-full" />
        <div className="w-9 h-9 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center font-black text-green-400 relative z-10">
          {user.email?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>

      {!collapsed && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col min-w-0"
        >
          <span className="text-sm font-bold text-white truncate">
            {user.name || 'Membro Elite'}
          </span>
          <span className="text-[10px] text-white/30 uppercase tracking-widest truncate">
            {user.role === 'admin' ? 'Administrator' : user.role === 'moderator' ? 'Moderator' : 'Premium Plan'}
          </span>
        </motion.div>
      )}
    </div>
  );
};

const SectionLabel: React.FC<{ label: string, collapsed: boolean }> = ({ label, collapsed }) => (
  <div className={clsx(
    "px-4 mb-2 mt-6 transition-all duration-500",
    collapsed ? "flex justify-center" : "text-left"
  )}>
    {!collapsed ? (
      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/20 select-none">
        {label}
      </span>
    ) : (
      <div className="w-4 h-[1px] bg-white/10" />
    )}
  </div>
);

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [ofertasMenuOpen, setOfertasMenuOpen] = useState(false);
  const [configMenuOpen, setConfigMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { nichos } = useNichos();
  const { isAdmin, user, logout } = useAuth();
  const { nichosSearchTerm, setNichosSearchTerm, filteredNichos } = useSearchContext();
  const { stats: reelsStats } = useReelsStats();

  const nichosExibidos = nichosSearchTerm.trim() ? filteredNichos : nichos;
  const isAnyNichoActive = nichosExibidos.some(nicho => pathname === `/oferta/${nicho.slug}`);
  const isAnyConfigActive = pathname?.startsWith('/configuracoes');

  useEffect(() => {
    if (isAnyNichoActive) setOfertasMenuOpen(true);
  }, [isAnyNichoActive]);

  useEffect(() => {
    if (isAnyConfigActive) setConfigMenuOpen(true);
  }, [isAnyConfigActive]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebar_collapsed');
      if (saved != null) setCollapsed(saved === '1');
    } catch { }
  }, []);

  useEffect(() => {
    try { localStorage.setItem('sidebar_collapsed', collapsed ? '1' : '0'); } catch { }
  }, [collapsed]);

  return (
    <LayoutGroup>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 256 }}
        transition={{ type: 'spring', stiffness: 300, damping: 35 }}
        className="relative h-full flex flex-col glass-sidebar border-r border-white/5 z-40"
      >
        {/* Subtle Background Texture/Glow */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
          <div className="absolute top-0 -left-20 w-64 h-64 bg-green-500 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 -right-20 w-64 h-64 bg-cyan-500 rounded-full blur-[100px]" />
        </div>

        {/* LOGO SECTION */}
        <div className={clsx(
          "flex items-center h-20 px-4 mb-4",
          collapsed ? "justify-center" : "justify-between"
        )}>
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => router.push('/')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
              <svg viewBox="0 0 120 120" className="w-10 h-10 relative z-10">
                <defs>
                  <linearGradient id="sidebarLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4ade80" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>
                </defs>
                <rect x="10" y="10" width="100" height="100" rx="26" fill="url(#sidebarLogoGrad)" />
                <path d="M20 20 Q 60 5 100 20 L 100 60 Q 60 45 20 60 Z" fill="white" fillOpacity="0.2" />
                <g transform="translate(62, 58)">
                  <circle cx="0" cy="0" r="24" stroke="white" strokeWidth="7" fill="none" />
                  <text x="0" y="13" fontFamily="Arial" fontWeight="900" fontSize="38" fill="white" textAnchor="middle">$</text>
                </g>
              </svg>
            </div>

            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-xl font-black text-white tracking-tighter"
                >
                  scale<span className="text-green-500">aki</span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-2 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/5 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="absolute -right-3 top-24 p-1.5 rounded-full bg-green-500 text-white shadow-lg shadow-green-500/40 hover:scale-110 transition-transform z-50"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto px-4 overflow-x-hidden scrollbar-none">

          <SectionLabel label="Início" collapsed={collapsed} />
          <ul className="space-y-1">
            <NavItem
              href="/"
              icon={Home}
              label="Dashboard"
              collapsed={collapsed}
              isActive={pathname === '/'}
            />
            <NavItem
              href="/ofertas-recentes"
              icon={Clock}
              label="Explorar"
              collapsed={collapsed}
              isActive={pathname === '/ofertas-recentes'}
              hasNew={true}
            />
            <NavItem
              href="/descubraki"
              icon={Video}
              label="Descubraki"
              collapsed={collapsed}
              isActive={pathname === '/descubraki'}
              badge={reelsStats.total || undefined}
            />
          </ul>

          <SectionLabel label="Inteligência" collapsed={collapsed} />
          <ul className="space-y-1">
            <NavItem
              href="#"
              icon={Package}
              label="Ofertas"
              collapsed={collapsed}
              isActive={isAnyNichoActive}
              onClick={() => !collapsed && setOfertasMenuOpen(!ofertasMenuOpen)}
            >
              {!collapsed && (
                <ChevronDown className={clsx("w-4 h-4 ml-auto transition-transform", ofertasMenuOpen && "rotate-180")} />
              )}
            </NavItem>

            {/* Submenu Nichos */}
            <AnimatePresence>
              {ofertasMenuOpen && !collapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden ml-4 mt-2 space-y-1 border-l border-white/5 pl-2"
                >
                  <div className="relative mb-2 px-1">
                    <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={12} />
                    <input
                      type="text"
                      placeholder="Buscar nichos..."
                      className="w-full bg-white/5 rounded-lg py-1.5 pl-7 pr-3 text-[11px] text-white placeholder:text-white/20 border border-white/5 focus:outline-none focus:border-green-500/50 transition-all"
                      value={nichosSearchTerm}
                      onChange={e => setNichosSearchTerm(e.target.value)}
                    />
                  </div>

                  {nichosExibidos.map(nicho => {
                    const ativo = pathname === `/oferta/${nicho.slug}`;
                    const Icon = getLucideIconByName(nicho.icone) as LucideIcon;
                    return (
                      <NavItem
                        key={nicho.slug}
                        href={`/oferta/${nicho.slug}`}
                        icon={Icon}
                        label={nicho.nome}
                        collapsed={collapsed}
                        isActive={ativo}
                        isNicho
                      />
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            <NavItem
              href="/criativos"
              icon={ImageIcon}
              label="Criativos"
              collapsed={collapsed}
              isActive={pathname === '/criativos'}
            />
            <NavItem
              href="/conquistas"
              icon={Trophy}
              label="Badges"
              collapsed={collapsed}
              isActive={pathname === '/conquistas'}
            />
          </ul>

          {(isAdmin || user) && (
            <>
              <SectionLabel label="Sistema" collapsed={collapsed} />
              <ul className="space-y-1">
                {isAdmin && (
                  <>
                    <NavItem
                      href="/admin"
                      icon={ShieldCheck}
                      label="Admin Center"
                      collapsed={collapsed}
                      isActive={pathname.startsWith('/admin') && !pathname.includes('/bot')}
                    />
                    <NavItem
                      href="/admin/bot"
                      icon={Sparkles}
                      label="Bot Automator"
                      collapsed={collapsed}
                      isActive={pathname === '/admin/bot'}
                    />
                  </>
                )}
                <NavItem
                  href="/ferramentas"
                  icon={Wrench}
                  label="Toolbox"
                  collapsed={collapsed}
                  isActive={pathname.startsWith('/ferramentas')}
                />
              </ul>
            </>
          )}
        </nav>

        {/* BOTTOM SECTION */}
        <div className="p-4 border-t border-white/5 bg-white/[0.02]">
          {/* Menu Expansível de Preferências */}
          <NavItem
            href="#"
            icon={Settings}
            label="Preferências"
            collapsed={collapsed}
            isActive={!!isAnyConfigActive}
            onClick={() => {
              if (!collapsed) {
                setConfigMenuOpen(!configMenuOpen);
              } else {
                router.push('/configuracoes/perfil');
              }
            }}
          >
            {!collapsed && (
              <ChevronDown className={clsx("w-4 h-4 ml-auto transition-transform", configMenuOpen && "rotate-180")} />
            )}
          </NavItem>

          {/* Submenu Configurações */}
          <AnimatePresence>
            {configMenuOpen && !collapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden ml-4 mt-1 mb-1 space-y-0.5 border-l border-white/5 pl-2"
              >
                {configSubItems.map((item) => {
                  const active = pathname?.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <NavItem
                      key={item.href}
                      href={item.href}
                      icon={Icon}
                      label={item.label}
                      collapsed={collapsed}
                      isActive={!!active}
                    />
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={logout}
            className={clsx(
              "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ease-out w-full mt-2 text-white/30 hover:text-red-400 hover:bg-red-500/10",
              collapsed && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            {!collapsed && <span className="text-sm font-medium">Sair da Conta</span>}
          </button>
        </div>
      </motion.aside>
    </LayoutGroup>
  );
};