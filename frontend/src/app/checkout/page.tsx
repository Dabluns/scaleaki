"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card3D } from '@/components/ui/Card3D';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import {
  Lock,
  Check,
  ArrowLeft,
  Loader2,
  Shield,
  Sparkles,
  Calendar,
  User,
  Eye,
  EyeOff
} from 'lucide-react';

// Mapeamento de planos
const PLAN_MAP: Record<string, { name: string; price: number; period: string; planId: 'mensal' | 'trimestral' | 'anual'; benefits: string[] }> = {
  mensal: {
    name: 'Plano Mensal',
    price: 97.00,
    period: '1 mês',
    planId: 'mensal',
    benefits: [
      'Acesso completo a todas as ofertas',
      'Filtros avançados e busca inteligente',
      'Suporte por email prioritário',
      'Atualizações em tempo real',
      'Exportação de dados',
      'API access',
    ],
  },
  trimestral: {
    name: 'Plano Trimestral',
    price: 271.00,
    period: '3 meses',
    planId: 'trimestral',
    benefits: [
      'Tudo do plano Mensal',
      'Desconto especial de 8%',
      'Prioridade no suporte',
      'Relatórios detalhados',
      'API access completo',
    ],
  },
  anual: {
    name: 'Plano Anual',
    price: 974.00,
    period: '12 meses',
    planId: 'anual',
    benefits: [
      'Tudo do plano Trimestral',
      'Desconto especial de 9%',
      'Suporte prioritário 24/7',
      'Relatórios avançados',
      'API completa',
      'Acesso beta a novas features',
    ],
  },
};

function isStrongPassword(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password);
}

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { user, checkAuth, login } = useAuth();

  const planoParam = searchParams.get('plano') || 'mensal';
  const planDetails = PLAN_MAP[planoParam] || PLAN_MAP.mensal;

  // Estados de registro
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Estados de pagamento
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Se usuário já está logado, pode continuar no checkout normalmente
  // A página funciona tanto para usuários logados quanto não logados

  const handleSubmit = async () => {
    // Validações de registro
    if (!user) {
      if (!name || !email || !password || !confirmPassword) {
        showToast('Preencha todos os campos', 'error');
        return;
      }
      if (!isStrongPassword(password)) {
        showToast('A senha deve ter pelo menos 8 caracteres, incluindo maiúsculas, minúsculas, números e símbolos.', 'error');
        return;
      }
      if (password !== confirmPassword) {
        showToast('As senhas não coincidem', 'error');
        return;
      }
    }

    setProcessing(true);
    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      // Se não está logado, criar conta primeiro (SEM confirmação automática por segurança)
      if (!user) {
        // 1. Criar conta (email precisará ser confirmado)
        const registerResponse = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            name,
            email,
            password,
            // NÃO enviar fromCheckout - email deve ser confirmado por segurança
          }),
        });

        const registerData = await registerResponse.json();

        if (!registerResponse.ok) {
          throw new Error(registerData.error || 'Erro ao criar conta');
        }

        // Se a conta foi criada mas email não está confirmado, mostrar mensagem
        if (registerData.message && registerData.message.includes('Verifique seu email')) {
          showToast(
            'Conta criada! Verifique seu email para confirmar antes de continuar com o pagamento.',
            'info'
          );
          // Redirecionar para página de confirmação de email
          router.push(`/auth/check-email?email=${encodeURIComponent(email)}`);
          return;
        }

        // Se tiver token, atualizar contexto de auth
        if (registerData.data?.token) {
          await checkAuth();
        }
      }

      // 3. Criar assinatura e obter URL do checkout da Cakto
      // Se tivermos links estáticos no .env, usamos eles preferencialmente para redirecionamento direto
      const envCheckoutUrls: Record<string, string | undefined> = {
        mensal: process.env.NEXT_PUBLIC_CHECKOUT_MENSAL_URL,
        trimestral: process.env.NEXT_PUBLIC_CHECKOUT_TRIMESTRAL_URL,
        anual: process.env.NEXT_PUBLIC_CHECKOUT_ANUAL_URL,
      };

      const staticCheckoutUrl = envCheckoutUrls[planDetails.planId];

      // Se tiver link estático e usuário logado/criado, podemos redirecionar direto?
      // Precisamos ainda criar o registro de "Subscription" no banco para controle interno?
      // Sim, é ideal chamar a API para criar a subscription "pending".

      const requestBody = {
        plan: planDetails.planId,
      };

      const paymentResponse = await fetch(`${API_URL}/payments/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      const paymentData = await paymentResponse.json();

      if (!paymentResponse.ok) {
        throw new Error(paymentData.error || 'Erro ao processar pagamento');
      }

      // Prioridade: Link estático do .env > Link retornado pela API
      const finalRedirectUrl = staticCheckoutUrl || paymentData.data?.checkoutUrl;

      if (finalRedirectUrl) {
        showToast(
          'Redirecionando para o checkout seguro...',
          'success'
        );

        // Adicionar email/nome na URL se for Cakto (prefil) se possível, mas os links são curtos.
        // Links curtos geralmente não aceitam parametros de query simples sem processamento.
        // Vamos usar o link como está.
        window.location.href = finalRedirectUrl;
        return;
      }

      // Fallback caso não tenha checkoutUrl (não deveria acontecer)
      showToast(
        paymentData.message || 'Assinatura criada! Aguardando confirmação do pagamento...',
        'success'
      );

      // Atualizar dados do usuário
      await checkAuth();

      // Redirecionar para dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao processar:', error);
      showToast(error.message || 'Erro ao processar. Tente novamente.', 'error');
    } finally {
      setLoading(false);
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Animado */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-[20%] w-[800px] h-[800px] bg-[radial-gradient(circle,_rgba(34,197,94,0.15),_transparent_70%)] rounded-full blur-[120px] animate-float" style={{ animationDuration: '20s' }} />
        <div className="absolute bottom-0 right-[20%] w-[700px] h-[700px] bg-[radial-gradient(circle,_rgba(6,182,212,0.15),_transparent_70%)] rounded-full blur-[120px] animate-float" style={{ animationDuration: '25s', animationDelay: '-5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,_rgba(139,92,246,0.1),_transparent_70%)] rounded-full blur-[100px] animate-float" style={{ animationDuration: '30s', animationDelay: '-10s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/planos')}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para planos</span>
          </button>

          <div className="flex items-center gap-4 mb-2">
            <div className="relative">
              <div className="absolute inset-0 blur-xl bg-gradient-to-r from-green-500 via-cyan-500 to-purple-500 rounded-full opacity-30" />
              <Lock className="relative w-10 h-10 text-green-400" style={{ filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))' }} />
            </div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-green-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Checkout Seguro
            </h1>
          </div>
          <p className="text-text-secondary text-lg">
            {user ? 'Finalize sua assinatura' : 'Crie sua conta e finalize sua assinatura'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário e Métodos - Coluna Esquerda */}
          <div className="lg:col-span-2 space-y-6">
            {/* Formulário de Registro - Apenas se não estiver logado */}
            {!user && (
              <Card3D variant="elevated" className="p-6">
                <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-green-400" />
                  Criar sua Conta
                </h2>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
                      Nome completo
                    </label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Seu nome"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                      E-mail
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="seu@email.com"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
                      Senha
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => setPasswordTouched(true)}
                        required
                        placeholder="••••••••"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordTouched && !isStrongPassword(password) && (
                      <p className="text-xs text-yellow-400 mt-1">
                        A senha deve ter pelo menos 8 caracteres, incluindo maiúsculas, minúsculas, números e símbolos.
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
                      Confirmar senha
                    </label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      disabled={loading}
                    />
                  </div>
                </div>
              </Card3D>
            )}

            {/* Resumo do Plano */}
            <Card3D variant="elevated" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-1">
                    {planDetails.name}
                  </h2>
                  <p className="text-text-secondary">Período: {planDetails.period}</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black bg-gradient-to-r from-green-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    R$ {planDetails.price.toFixed(2).replace('.', ',')}
                  </div>
                  <p className="text-sm text-text-secondary">por {planDetails.period}</p>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-green-400" />
                  Benefícios incluídos
                </h3>
                <ul className="space-y-3">
                  {planDetails.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 bg-gradient-to-r from-green-500/20 to-cyan-500/20 border border-green-500/30">
                        <Check className="w-3 h-3 text-green-400" />
                      </div>
                      <span className="text-sm text-text-secondary">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card3D>
          </div>

          {/* Resumo do Pedido - Coluna Direita */}
          <div className="lg:col-span-1">
            <Card3D variant="neon" className="p-6 sticky top-8 border-2 border-green-500/50">
              <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-400" />
                Resumo do Pedido
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Plano</span>
                  <span className="font-semibold text-text-primary">{planDetails.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Período</span>
                  <span className="font-semibold text-text-primary">{planDetails.period}</span>
                </div>
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-text-primary">Total</span>
                    <span className="text-2xl font-black bg-gradient-to-r from-green-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                      R$ {planDetails.price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                variant="gradient"
                className="w-full bg-gradient-to-r from-green-500 via-cyan-500 to-purple-500 hover:from-green-600 hover:via-cyan-600 hover:to-purple-600"
                onClick={handleSubmit}
                disabled={loading || (!user && (!name || !email || !password || !confirmPassword))}
                hasRipple
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    {user ? 'Finalizar Assinatura' : 'Criar Conta e Assinar'}
                  </>
                )}
              </Button>

              <div className="mt-4 flex items-center gap-2 text-xs text-text-secondary">
                <Shield className="w-4 h-4 text-green-400" />
                <span>Pagamento 100% seguro e criptografado</span>
              </div>
            </Card3D>
          </div>
        </div>
      </div>
    </div>
  );
}

import { FullPageLoader } from '@/components/ui/FullPageLoader';

export default function CheckoutPage() {
  return (
    <Suspense fallback={<FullPageLoader message="Preparando Checkout" submessage="Iniciando ambiente seguro" />}>
      <CheckoutPageContent />
    </Suspense>
  );
}

