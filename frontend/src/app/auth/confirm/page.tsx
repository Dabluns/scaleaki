"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card3D } from "@/components/ui/Card3D";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";

function ConfirmEmailContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token inválido.");
      return;
    }
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    fetch(`${API_URL}/auth/confirm?token=${encodeURIComponent(token)}`, {
      credentials: 'include',
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage("E-mail confirmado com sucesso! Agora você pode fazer login.");
        } else {
          setStatus("error");
          setMessage(data.error || "Token inválido ou expirado.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Erro ao confirmar e-mail.");
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Animado */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-[20%] w-[800px] h-[800px] bg-[radial-gradient(circle,_rgba(34,197,94,0.15),_transparent_70%)] rounded-full blur-[120px] animate-float" style={{ animationDuration: '20s' }} />
        <div className="absolute bottom-0 right-[20%] w-[700px] h-[700px] bg-[radial-gradient(circle,_rgba(6,182,212,0.15),_transparent_70%)] rounded-full blur-[120px] animate-float" style={{ animationDuration: '25s', animationDelay: '-5s' }} />
      </div>

      <Card3D variant="elevated" className="p-8 max-w-md w-full">
        <div className="text-center">
          {status === "loading" && (
            <>
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 blur-xl bg-green-500 rounded-full opacity-30" />
                  <Loader2 className="relative w-16 h-16 text-green-400 animate-spin" />
                </div>
              </div>
              <h2 className="text-3xl font-black mb-4 text-green-400 animate-fade-in">
                Confirmando e-mail...
              </h2>
              <p className="text-gray-400 animate-fade-in">
                Aguarde enquanto verificamos seu token.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 blur-xl bg-green-500 rounded-full opacity-30 animate-pulse" />
                  <CheckCircle2 className="relative w-16 h-16 text-green-400" style={{ filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))' }} />
                </div>
              </div>
              <h2 className="text-3xl font-black mb-4 text-green-400 animate-bounce-in">
                E-mail Confirmado!
              </h2>
              <p className="text-gray-300 mb-6 animate-fade-in">
                {message}
              </p>
              <Button
                onClick={() => router.push('/')}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 hover:scale-105 active:scale-95"
                hasRipple
                hasGlow
              >
                Ir para Login
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 blur-xl bg-red-500 rounded-full opacity-30" />
                  <XCircle className="relative w-16 h-16 text-red-400" />
                </div>
              </div>
              <h2 className="text-3xl font-black mb-4 text-red-400 animate-bounce-in">
                Erro na Confirmação
              </h2>
              <p className="text-gray-300 mb-6 animate-fade-in">
                {message}
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/auth/check-email')}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 hover:scale-105 active:scale-95"
                  hasRipple
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Solicitar Novo E-mail
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Voltar para Login
                </Button>
              </div>
            </>
          )}
        </div>
      </Card3D>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md p-8 md:p-10 rounded-none md:rounded-2xl shadow-none md:shadow-xl bg-white animate-fadeIn flex flex-col justify-center min-h-screen md:min-h-0">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-green-700 text-center">Confirmação de e-mail</h2>
        <p className="text-center mb-8 font-semibold text-gray-600">Carregando...</p>
      </div>
    }>
      <ConfirmEmailContent />
    </Suspense>
  );
} 