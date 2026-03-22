"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import {
  User,
  Settings,
  Bell,
  Lock,
  FileText,
  CreditCard,
  Terminal,
  Activity,
  Cpu
} from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium SettingsNav v5.0
// Design Path: Mastery High-Fidelity / Command Sidebar
// ─────────────────────────────────────────────────────────────────

const items = [
  { href: '/configuracoes/perfil', label: 'USER_NODE', icon: User, desc: 'Identidade Operativa' },
  { href: '/configuracoes/preferencias', label: 'UX_CONTROL', icon: Settings, desc: 'Calibração de Interface' },
  { href: '/configuracoes/notificacoes', label: 'ALERT_HUB', icon: Bell, desc: 'Relay de Comunicação' },
  { href: '/configuracoes/privacidade', label: 'SEC_MATRIX', icon: Lock, desc: 'Protocolos de Custódia' },
  { href: '/configuracoes/conteudo', label: 'DATA_FLOW', icon: FileText, desc: 'Asset Discovery Logic' },
  { href: '/configuracoes/plano', label: 'TIER_UP', icon: CreditCard, desc: 'License Management' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-black overflow-x-hidden">

      {/* Tactical Configuration Sidebar */}
      <aside className="w-full lg:w-64 xl:w-72 shrink-0 border-r border-white/5 bg-[#050505] relative z-20">
        <div className="sticky top-0 h-full lg:h-screen flex flex-col p-4 lg:p-6 pt-20">

          {/* Sidebar Header Section */}
          <div className="space-y-3 mb-8 px-2">
            <div className="flex items-center gap-2">
              <Cpu size={12} className="text-green-500/40" />
              <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] italic">SYSTEM_CONFIG</span>
            </div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">CONFIG_HUB</h2>
          </div>

          {/* Navigation Matrix */}
          <nav className="flex flex-col gap-1.5">
            {items.map((item) => {
              const active = pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "group relative flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-700 overflow-hidden",
                    active
                      ? "bg-green-500 text-black shadow-[0_20px_40px_rgba(34,197,94,0.2)]"
                      : "text-white/30 hover:bg-white/[0.03] hover:text-white"
                  )}
                >
                  {/* Subtle Scanline on Active */}
                  {active && (
                    <motion.div
                      layoutId="activeNavBG"
                      className="absolute inset-0 bg-green-500 -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}

                  <div className={clsx(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500 shrink-0",
                    active ? "bg-black text-green-500 scale-110 shadow-lg" : "bg-white/5 text-white/20 group-hover:text-green-500"
                  )}>
                    <Icon size={16} />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className={clsx(
                      "text-[12px] font-black uppercase tracking-tighter italic transition-colors leading-none truncate",
                      active ? "text-black" : "text-white/40 group-hover:text-white"
                    )}>
                      {item.label}
                    </span>
                    <span className={clsx(
                      "text-[8px] font-bold uppercase tracking-wider mt-0.5 opacity-40 transition-opacity truncate",
                      active ? "text-black opacity-60" : "text-white/20"
                    )}>
                      {item.desc}
                    </span>
                  </div>

                  {/* Active Indicator Node */}
                  {active && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-black shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Process Telemetry HUD (Bottom) */}
          <div className="mt-auto pt-6 px-2 space-y-4">
            <div className="h-px w-full bg-white/5" />
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[8px] font-black text-white/20 uppercase tracking-wider italic">
                <span>SYNC_STATUS</span>
                <span className="text-green-500">OPERATIONAL</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: "100%" }}
                    className="h-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                  />
                </div>
                <Activity size={10} className="text-green-500 animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/5">
              <Terminal size={10} />
              <span className="text-[7px] font-bold uppercase tracking-wider font-mono truncate">NODE_ID // SKL-NAV-881</span>
            </div>
          </div>

        </div>
      </aside>

      {/* Main Configuration Context */}
      <main className="flex-1 relative z-10 overflow-y-auto overflow-x-hidden min-w-0">
        {children}
      </main>

    </div>
  );
}
