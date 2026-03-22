'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card3D } from '@/components/ui/Card3D';
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Mail, Lock, ArrowRight, Zap, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { Spotlight } from '@/components/ui/Spotlight';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium AuthPage v2.0
// Features: Mastery High-Fidelity, Cinematic Background, 
// Industrial Forms, and Cyberpunk Typography.
// ─────────────────────────────────────────────────────────────────

function AuthPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const [showAuthMessage, setShowAuthMessage] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendError, setResendError] = useState('');
  const { user, loading, login } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [loading, user, router]);

  React.useEffect(() => {
    if (from) setShowAuthMessage(true);
  }, [from]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro('');
    setShowResend(false);
    setResendSuccess('');
    setResendError('');
    setIsSubmitting(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        router.push(from || '/dashboard');
      } else {
        setErro(result.error || 'Erro ao fazer login');
        if (result.error && result.error.toLowerCase().includes('e-mail não confirmado')) {
          setShowResend(true);
        }
      }
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setResendLoading(true);
    try {
      const res = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) setResendSuccess('E-mail de confirmação reenviado!');
      else setResendError('Erro ao reenviar e-mail.');
    } catch {
      setResendError('Erro ao reenviar e-mail.');
    } finally {
      setResendLoading(false);
    }
  }

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 lg:p-12 relative overflow-hidden selection:bg-green-500/30">

      {/* Background Atmosphere - Falling Pattern + Spotlight */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20 opacity-50 pointer-events-none"
          fill="white"
        />
        <div className="absolute inset-0 z-0 pointer-events-none">
          <FallingPattern
            className="h-screen [mask-image:radial-gradient(ellipse_at_center,transparent,rgba(0,0,0,1))]"
            color="#22c55e"
            backgroundColor="#050505"
            duration={50}
            blurIntensity="0.1em"
          />
        </div>

        {/* Subtle overlays to ensure text readability */}
        <div className="absolute inset-0 bg-black/10 z-1 pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* Left Side: Branding & Info */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:flex flex-col gap-10"
        >
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full w-fit">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Portal de Comando Seguro</span>
          </div>

          <h1 className="text-7xl font-black text-white leading-[0.9] tracking-tighter uppercase italic">
            ACESSE A <br />
            <span className="text-green-500">INTELIGÊNCIA</span>
          </h1>

          <div className="space-y-8">
            <div className="flex gap-6 group">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-green-500 border border-white/5 group-hover:border-green-500/30 transition-all">
                <Zap size={24} />
              </div>
              <div>
                <h4 className="text-white font-black uppercase tracking-tighter text-lg italic">Monitoramento Realtime</h4>
                <p className="text-white/30 text-sm font-bold">Varredura constante de ofertas em escala global.</p>
              </div>
            </div>
            <div className="flex gap-6 group">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-cyan-400 border border-white/5 group-hover:border-cyan-500/30 transition-all">
                <Globe size={24} />
              </div>
              <div>
                <h4 className="text-white font-black uppercase tracking-tighter text-lg italic">Hub de Decisão</h4>
                <p className="text-white/30 text-sm font-bold">Interface técnica para decisões de investimento precisas.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Login Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card3D
            variant="glass"
            has3DRotation
            className="relative p-10 md:p-14 bg-[#0d0d0d] border-white/5 rounded-[3rem] overflow-hidden shadow-2xl"
          >
            <div className="mb-10 lg:hidden">
              <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">scaleaki</h1>
            </div>

            <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em] mb-8 italic">LOGIN OPERACIONAL</h2>

            {showAuthMessage && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-8">
                ⚠️ ACESSO RESTRITO. REALIZE AUTENTICAÇÃO.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-4">CREDENCIAL (E-MAIL)</label>
                <div className="relative group/input">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-12 py-4 text-sm font-bold text-white focus:outline-none focus:border-green-500/30 focus:bg-white/[0.05] transition-all"
                    placeholder="seu@comando.hub"
                    required
                  />
                  <Mail size={18} className="absolute left-4 top-4 text-white/20 group-focus-within/input:text-green-500 transition-colors" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-4">SENHA TÁTICA</label>
                <div className="relative group/input">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-12 py-4 text-sm font-bold text-white focus:outline-none focus:border-green-500/30 focus:bg-white/[0.05] transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <Lock size={18} className="absolute left-4 top-4 text-white/20 group-focus-within/input:text-green-500 transition-colors" />
                </div>
              </div>

              {erro && (
                <div className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center py-2">
                  ❌ ERROR: {erro}
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-6 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.3em] hover:bg-green-500 hover:text-white transition-all shadow-xl group/btn"
              >
                {isSubmitting ? 'VALIDANDO...' : 'INICIAR SESSÃO'}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>

            <div className="mt-12 flex flex-col items-center gap-4 border-t border-white/5 pt-8">
              <button className="text-[10px] font-black text-white/30 uppercase tracking-widest hover:text-green-500 transition-colors">Esqueci minha senha</button>
              <button onClick={() => router.push('/auth/register')} className="text-[10px] font-black text-green-500 uppercase tracking-widest hover:text-white transition-colors">Não tem conta? Cadastre-se</button>
            </div>
          </Card3D>
        </motion.div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageContent />
    </Suspense>
  );
}