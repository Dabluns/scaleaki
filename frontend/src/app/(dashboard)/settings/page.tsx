"use client";
import React, { useEffect, useState } from "react";
import { storage, STORAGE_KEYS, ThemeMode } from "@/lib/storage";

export default function SettingsPage() {
  const [dark, setDark] = useState(false);

  // Detecta preferência inicial
  useEffect(() => {
    const saved = storage.getThemeMode();
    if (saved) {
      setDark(saved === "dark");
      document.documentElement.classList.toggle("dark", saved === "dark");
    } else {
      // Usa preferência do SO
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDark(prefersDark);
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }, []);

  // Atualiza tema
  const toggleTheme = () => {
    setDark((prev) => {
      const next = !prev;
      const mode: ThemeMode = next ? "dark" : "light";
      storage.setThemeMode(mode);
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>
      <section className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Preferências de Interface</h2>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 dark:text-gray-200">Modo escuro</span>
            <button
              onClick={toggleTheme}
              className={`relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none ${dark ? "bg-green-700" : "bg-gray-300"}`}
              aria-pressed={dark}
              aria-label="Alternar modo escuro"
            >
              <span
                className={`absolute left-1 top-1 w-6 h-6 rounded-full bg-white shadow transition-transform duration-300 flex items-center justify-center ${dark ? "translate-x-6" : "translate-x-0"}`}
              >
                {dark ? (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ) : (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" stroke="#15803d" strokeWidth="2"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#15803d" strokeWidth="2" strokeLinecap="round"/></svg>
                )}
              </span>
            </button>
            <span className="text-gray-500 text-sm">{dark ? "Ativado" : "Desativado"}</span>
          </div>
        </div>
      </section>
    </div>
  );
} 