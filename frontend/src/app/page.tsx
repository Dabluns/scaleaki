'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { FullPageLoader } from '@/components/ui/FullPageLoader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card3D } from '@/components/ui/Card3D';
import {
  Lock,
  User,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  Shield,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { Spotlight } from '@/components/ui/Spotlight';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium Master Unified Auth v3.1
// Features: Interactive 3D Robot Background, Cinematic Lighting,
// Industrial Forms, and Cyberpunk Typography.
// ─────────────────────────────────────────────────────────────────

function isStrongPassword(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password);
}

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, login, checkAuth } = useAuth();

  const [isLogin, setIsLogin] = useState(false); // Começa com cadastro por padrão

  // Se a URL tiver ?mode=login, abrir direto no formulário de login
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'login') {
      setIsLogin(true);
    }
  }, [searchParams]);

  // Estados de login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Estados de registro
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [loading, user, router]);

  if (!loading && user) {
    return <FullPageLoader message="Redirecionando para o Dashboard" submessage="Prepare-se para escalar" />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const result = await login(loginEmail, loginPassword);
      if (result.success) {
        await checkAuth();
        router.push('/dashboard');
      } else {
        if (result.error && result.error.includes('não confirmado')) {
          router.push(`/auth/check-email?email=${encodeURIComponent(loginEmail)}`);
        } else {
          setLoginError(result.error || 'Erro ao fazer login');
        }
      }
    } catch (err: any) {
      setLoginError(err.message || 'Erro ao fazer login');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    if (!isStrongPassword(registerPassword)) {
      setRegisterError('A senha não atende aos requisitos táticos.');
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setRegisterError('As senhas não coincidem');
      return;
    }

    setRegisterLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: registerName, email: registerEmail, password: registerPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar');

      if (data.message && data.message.includes('Verifique seu email')) {
        router.push(`/auth/check-email?email=${encodeURIComponent(registerEmail)}`);
      } else {
        router.push('/planos');
      }
    } catch (err: any) {
      setRegisterError(err.message || 'Erro ao cadastrar.');
    } finally {
      setRegisterLoading(false);
    }
  };

  if (loading) {
    return <FullPageLoader message="Verificando Identidade" submessage="Acessando rede segura" />;
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 lg:p-12 relative overflow-hidden selection:bg-green-500/30">

      {/* GLOBAL ATMOSPHERE - Falling Pattern Background */}
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
        {/* Subtle dark overlay for contrast and secondary glow */}
        <div className="absolute inset-0 bg-black/10 z-1 pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* LEFT SIDE: Identity & Hype */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:flex flex-col gap-10"
        >
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full w-fit">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Terminal de Acesso v4.0</span>
          </div>

          <h1 className="text-8xl font-black text-white leading-[0.85] tracking-tighter uppercase italic">
            {isLogin ? 'BEM-VINDO' : 'CRIE SUA'} <br />
            <span className="text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]">{isLogin ? 'DE VOLTA' : 'IDENTIDADE'}</span>
          </h1>

          <div className="space-y-8 max-w-md">
            <div className="flex gap-6 group">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-green-500 border border-white/5 group-hover:border-green-500/30 transition-all">
                <Zap size={24} />
              </div>
              <div>
                <h4 className="text-white font-black uppercase tracking-tighter text-lg italic">Escala Dopaminérgica</h4>
                <p className="text-white/30 text-sm font-bold">Acesse as ofertas que estão movendo o mercado global agora.</p>
              </div>
            </div>
            <div className="flex gap-6 group">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-cyan-400 border border-white/5 group-hover:border-cyan-500/30 transition-all">
                <Globe size={24} />
              </div>
              <div>
                <h4 className="text-white font-black uppercase tracking-tighter text-lg italic">Inteligência Pura</h4>
                <p className="text-white/30 text-sm font-bold">Dados brutos transformados em lucro real e imediato.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT SIDE: Auth Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card3D
            variant="glass"
            has3DRotation
            className="relative p-10 md:p-14 bg-[#0d0d0d] border-white/5 rounded-[3rem] overflow-hidden shadow-2xl"
          >
            {/* Logo Mobile */}
            <div className="mb-10 lg:hidden text-center">
              <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter">scaleaki</h1>
            </div>

            <div className="mb-10">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">
                {isLogin ? 'LOGIN OPERACIONAL' : 'REGISTRO DE AGENTE'}
              </h2>
              <p className="text-white/20 text-xs font-bold uppercase tracking-widest mt-2">
                {isLogin ? 'Valide suas credenciais para prosseguir' : 'Inicie sua jornada no ecossistema'}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleLogin}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-4">CREDENCIAL (E-MAIL)</label>
                    <div className="relative group/input">
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
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
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-12 py-12 pb-4 pt-4 text-sm font-bold text-white focus:outline-none focus:border-green-500/30 focus:bg-white/[0.05] transition-all"
                        placeholder="••••••••"
                        required
                      />
                      <Lock size={18} className="absolute left-4 top-4 text-white/20 group-focus-within/input:text-green-500 transition-colors" />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-4 top-4 text-white/20 hover:text-white transition-colors"
                      >
                        {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <div className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center py-2 bg-red-500/5 rounded-xl border border-red-500/10">
                      ❌ ERROR: {loginError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-8 rounded-2xl bg-green-500 hover:bg-green-400 text-black font-black text-[11px] uppercase tracking-[0.4em] transition-all shadow-[0_0_30px_rgba(34,197,94,0.3)] group/btn relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      {loginLoading ? 'VALIDANDO...' : 'INICIAR SESSÃO'}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </motion.form>
              ) : (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleRegister}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-4">DESIGNAÇÃO (NOME)</label>
                    <div className="relative group/input">
                      <input
                        type="text"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-12 py-4 text-sm font-bold text-white focus:outline-none focus:border-green-500/30 focus:bg-white/[0.05] transition-all"
                        placeholder="Seu código de agente"
                        required
                      />
                      <User size={18} className="absolute left-4 top-4 text-white/20 group-focus-within/input:text-green-500 transition-colors" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-4">E-MAIL OPERACIONAL</label>
                    <div className="relative group/input">
                      <input
                        type="email"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
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
                        type={showRegisterPassword ? 'text' : 'password'}
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-12 py-4 text-sm font-bold text-white focus:outline-none focus:border-green-500/30 focus:bg-white/[0.05] transition-all"
                        placeholder="••••••••"
                        required
                      />
                      <Lock size={18} className="absolute left-4 top-4 text-white/20 group-focus-within/input:text-green-500 transition-colors" />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-4 top-4 text-white/20 hover:text-white transition-colors"
                      >
                        {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {/* Password rules indicator */}
                    <div className="ml-4 mt-2 flex flex-wrap gap-2 opacity-50">
                      <CheckRule rule={registerPassword.length >= 8} label="8+" />
                      <CheckRule rule={/[A-Z]/.test(registerPassword)} label="A-Z" />
                      <CheckRule rule={/[0-9]/.test(registerPassword)} label="0-9" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-4">CONFIRMAÇÃO</label>
                    <div className="relative group/input">
                      <input
                        type="password"
                        value={registerConfirmPassword}
                        onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-12 py-4 text-sm font-bold text-white focus:outline-none focus:border-green-500/30 focus:bg-white/[0.05] transition-all"
                        placeholder="Re-digite sua senha"
                        required
                      />
                      <ShieldCheck size={18} className="absolute left-4 top-4 text-white/20 group-focus-within/input:text-green-500 transition-colors" />
                    </div>
                  </div>

                  {registerError && (
                    <div className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center py-2 bg-red-500/5 rounded-xl border border-red-500/10">
                      ❌ ERROR: {registerError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={registerLoading}
                    className="w-full py-8 rounded-2xl bg-green-500 hover:bg-green-400 text-black font-black text-[11px] uppercase tracking-[0.4em] transition-all shadow-[0_0_30px_rgba(34,197,94,0.3)] group/btn relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      {registerLoading ? 'PROCESSANDO...' : 'REGISTRAR AGENTE'}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="mt-12 flex flex-col items-center gap-4 border-t border-white/5 pt-8">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-[10px] font-black text-green-500 uppercase tracking-widest hover:text-white transition-colors"
              >
                {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Iniciar Sessão'}
              </button>
            </div>
          </Card3D>
        </motion.div>
      </div>

      {/* SECURITY FOOTER */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-2 bg-white/5 border border-white/10 rounded-full opacity-30">
        <Shield size={14} className="text-white" />
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Cryptographic Layer: SHA-256 Validated</span>
      </div>
    </div>
  );
}

function CheckRule({ rule, label }: { rule: boolean, label: string }) {
  return (
    <div className={`flex items-center gap-1 transition-colors ${rule ? 'text-green-500' : 'text-white/20'}`}>
      <CheckCircle2 size={10} />
      <span className="text-[8px] font-black">{label}</span>
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
