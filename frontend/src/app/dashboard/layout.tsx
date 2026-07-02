'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo, LogoIcon } from '@/components/Logo';
import { clearToken, me, type AuthUser } from '@/lib/api';
import {
  Home, Layers, ShoppingBag, Eye, Workflow, Film, MonitorPlay,
  Settings, LogOut, Loader2,
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    me()
      .then(setUser)
      .catch(() => {
        clearToken();
        router.push('/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  function logout() {
    clearToken();
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    );
  }

  return (
    <div className="relative z-10 flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-surface/40 backdrop-blur-xl">
        <div className="p-5 border-b border-border">
          <Link href="/dashboard">
            <Logo />
          </Link>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          <SidebarSection label="Principal">
            <SidebarLink href="/dashboard" icon={<Home className="w-4 h-4" />}>Home</SidebarLink>
            <SidebarLink href="/ofertas" icon={<Layers className="w-4 h-4" />}>Ofertas</SidebarLink>
          </SidebarSection>

          <SidebarSection label="Scaleaki+">
            <SidebarLink href="/adspy" icon={<Eye className="w-4 h-4" />} badge>AdSpy</SidebarLink>
            <SidebarLink href="/marketplace" icon={<ShoppingBag className="w-4 h-4" />} badge>Marketplace</SidebarLink>
            <SidebarLink href="/funil" icon={<Workflow className="w-4 h-4" />} badge>Funil</SidebarLink>
            <SidebarLink href="/pre-aprovador" icon={<MonitorPlay className="w-4 h-4" />} badge>Pré-Aprovador</SidebarLink>
            <SidebarLink href="/scaleflix" icon={<Film className="w-4 h-4" />} badge>Scaleflix</SidebarLink>
          </SidebarSection>
        </nav>

        <div className="p-3 border-t border-border space-y-1">
          <SidebarLink href="/configuracoes" icon={<Settings className="w-4 h-4" />}>Configurações</SidebarLink>
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted hover:text-text hover:bg-white/5 transition-colors">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-surface/30 backdrop-blur-xl flex items-center justify-between px-6">
          <div className="md:hidden">
            <Link href="/dashboard"><LogoIcon /></Link>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            {user && (
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium">{user.name}</div>
                <div className="text-xs text-muted">
                  {user.tier === 'plus' ? <span className="badge-plus">Plus</span> : user.tier === 'basico' ? <span className="text-primary-400">Básico</span> : <span className="text-muted">Free</span>}
                  {' · '}
                  <span>{user.email}</span>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 px-6 py-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted/70">
        {label}
      </div>
      {children}
    </div>
  );
}

function SidebarLink({ href, icon, children, badge }: { href: string; icon: React.ReactNode; children: React.ReactNode; badge?: boolean }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted hover:text-text hover:bg-white/5 transition-colors group"
    >
      {icon}
      <span className="flex-1">{children}</span>
      {badge && <span className="badge-plus !text-[9px] !py-0">+</span>}
    </Link>
  );
}