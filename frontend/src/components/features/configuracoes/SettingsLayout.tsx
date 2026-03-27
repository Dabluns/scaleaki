"use client";
import React from 'react';

// ─────────────────────────────────────────────────────────────────
// SettingsLayout v6.0 — Sidebar removida (navegação agora no menu
// expansível de Preferências na sidebar principal)
// ─────────────────────────────────────────────────────────────────

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      <main className="relative z-10 overflow-y-auto overflow-x-hidden min-w-0 w-full">
        {children}
      </main>
    </div>
  );
}
