"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, Suspense } from 'react';
import { Card3D } from "@/components/ui/Card3D";
import { Button } from "@/components/ui/Button";
import { Mail, ArrowLeft, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium CheckEmailPage v2.0
// Features: Mastery High-Fidelity, Cinematic Background, 
// Industrial Forms, and Cyberpunk Typography.
// ─────────────────────────────────────────────────────────────────

function CheckEmailContent() {
  const params = useSearchParams();
  const router = useRouter();
  const email = params.get('email');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${API_URL}/auth/resend-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('VARREDURA CONCLUÍDA: E-MAIL REENVIADO.');
      } else {
        setError(data.error || 'FALHA NA TRANSMISSÃO.');
      }
    } catch {
      setError('ERRO DE PROTOCOLO.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden flex items-center justify-center p-6 selection:bg-green-500/30">

      {/* GLOBAL ATMOSPHERE */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-green-500/5 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-cyan-500/5 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '3s' }} />
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '48px 48px' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[550px]"
      >
        <Card3D
          variant="glass"
          has3DRotation
          className="relative p-12 md:p-16 bg-[#0d0d0d] border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl text-center"
        >
          <div className="flex justify-center mb-10">
            <div className="relative">
              <div className="absolute inset-0 blur-2xl bg-green-500 rounded-full opacity-20 animate-pulse" />
              <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center relative z-10 transition-transform group-hover:scale-110">
                <Mail className="w-10 h-10 text-green-500" />
              </div>
            </div>
          </div>

          <h2 className="text-4xl md:text-5xl font-black mb-6 text-white uppercase italic tracking-tighter leading-none">
            VERIFIQUE <br />
            <span className="text-green-500">SEU E-MAIL</span>
          </h2>

          <div className="space-y-4 mb-12">
            <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em]">
              TRANSMISSÃO ENVIADA PARA:
            </p>
            <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black italic tracking-tight text-lg shadow-inner">
              {email || 'AGENTE@DESCONHECIDO.HUB'}
            </div>
            <p className="text-white/20 text-xs font-bold leading-relaxed max-w-sm mx-auto">
              Acesse sua caixa de entrada e valide o link tático para ativar sua identidade na rede.
              <span className="block mt-4 text-yellow-500/60 font-black uppercase text-[9px] tracking-widest">⚠️ EXPIRAÇÃO DO PROTOCOLO EM 60 MINUTOS.</span>
            </p>
          </div>

          <div className="space-y-6">
            <Button
              onClick={handleResend}
              disabled={loading}
              className="w-full py-6 rounded-2xl bg-green-500 text-black font-black text-xs uppercase tracking-[0.3em] hover:bg-white transition-all shadow-xl shadow-green-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  REENVIANDO...
                </>
              ) : (
                <>
                  REENVIAR LINK TÁTICO
                </>
              )}
            </Button>

            {message && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-green-500 text-[10px] font-black uppercase tracking-widest bg-green-500/5 border border-green-500/10 rounded-xl py-3"
              >
                {message}
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-500/5 border border-red-500/10 rounded-xl py-3"
              >
                {error}
              </motion.div>
            )}

            <button
              onClick={() => router.push('/')}
              className="flex items-center justify-center gap-2 mx-auto text-[10px] font-black text-white/30 uppercase tracking-widest hover:text-white transition-colors pt-4"
            >
              <ArrowLeft size={14} />
              VOLTAR PARA O TERMINAL
            </button>
          </div>

          {/* Security Indicator */}
          <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-center gap-2 opacity-20">
            <ShieldCheck size={14} className="text-white" />
            <span className="text-[9px] font-black uppercase tracking-widest">Encrypted Broadcast Validated</span>
          </div>
        </Card3D>
      </motion.div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={null}>
      <CheckEmailContent />
    </Suspense>
  );
}