"use client";
import React, { useEffect } from 'react';
import { Sidebar, SidebarSearch, SidebarUserProfile } from './Sidebar';
import { Header } from './Header';
import { LucideChevronDown } from 'lucide-react';
import { useGlobalKeyboardShortcuts } from '@/lib/keyboardShortcuts';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · DashboardLayout Premium v3.0
// Features: Global Atmospheric Background, Refined Mobile Sidebar, 
// and seamless children injection.
// ─────────────────────────────────────────────────────────────────

interface DashboardLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, breadcrumbs }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  // Ativar shortcuts globais
  useGlobalKeyboardShortcuts();

  return (
    <div className="flex h-screen bg-[#050505] selection:bg-green-500/30 overflow-hidden">

      {/* GLOBAL ATMOSPHERE - Persistent across all dashboard pages */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-green-500/[0.03] blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-cyan-500/[0.03] blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '3s' }} />

        {/* Subtle Technical Grid */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '48px 48px' }}
        />
      </div>

      <div className="relative z-10 flex h-full w-full">
        <Sidebar />

        {/* Sidebar Mobile */}
        {mobileSidebarOpen && <MobileSidebar open={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />}

        <div className="flex-1 flex flex-col min-w-0">
          <Header breadcrumbs={breadcrumbs} onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto px-4 md:px-8 pb-20 relative z-10 scrollbar-premium">
            {children}

            {/* TECHNICAL FOOTER */}
            <footer className="mt-20 py-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 opacity-40 hover:opacity-100 transition-opacity duration-500">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white uppercase tracking-[.3em]">Protocolo Scaleaki</span>
                  <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-1">v4.0.2 // Master Build</span>
                </div>
                <div className="w-px h-6 bg-white/10 hidden md:block" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white uppercase tracking-[.3em]">Criptografia Hub</span>
                  <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-1">AES-256 Validated</span>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[.4em] hover:text-green-500 transition-colors cursor-help">Security Architecture</span>
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[.4em] hover:text-cyan-500 transition-colors cursor-help">Privacy Node</span>
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[.4em]">© 2026</span>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
};

const MobileSidebar: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const sidebarRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex md:hidden">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className="relative w-72 h-full bg-[#0d0d0d] border-r border-white/5 shadow-2xl p-6 flex flex-col gap-8 animate-slideInLeft"
      >
        <div className="flex items-center justify-between">
          <span className="font-black text-white text-xl tracking-tighter uppercase italic">scaleaki</span>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-white transition-colors"
          >
            <LucideChevronDown className="rotate-90" size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-6">
          <SidebarSearch search="" setSearch={() => { }} />
          <SidebarUserProfile collapsed={false} />
        </div>
      </aside>
    </div>
  );
};