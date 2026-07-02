import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function HomePage() {
  return (
    <main className="relative z-10">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between max-w-6xl">
          <Link href="/" aria-label="ScaleAki">
            <Logo />
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted hover:text-text transition-colors">
              Entrar
            </Link>
            <Link href="/register" className="btn-primary !py-2.5 !px-5 !text-sm">
              Começar grátis
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 max-w-5xl pt-24 pb-20 text-center animate-fade-up">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-1.5 text-sm text-primary-300 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
          Inteligência artificial + dados reais do Meta
        </div>
        <h1 className="font-display font-black text-5xl md:text-7xl leading-[0.95] tracking-tight">
          Descubra as<br />
          <span className="gradient-text">ofertas que mais escalam</span>
          <br />
          no digital
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
          O swipe file com VSL, copy, tempo de veiculação e análise completa dos anúncios
          que estão gerando milhões. Chega de adivinhar, copie a estratégia.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/register" className="btn-primary">
            Quero Acesso Agora
          </Link>
          <Link href="/login" className="btn-secondary">
            Já tenho conta
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 max-w-6xl py-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: 'Ofertas validadas', desc: 'Só anúncios com tempo de veiculação real e métricas de escala comprovadas.', icon: '📊' },
            { title: 'IA + copy pronta', desc: 'Análise de copy, headline, VSL e ângulo por IA. Copie e cole no seu negócio.', icon: '🤖' },
            { title: '100% white-label', desc: 'Use as ofertas como base. Troque headline, imagem, copy. Seu lance, sua marca.', icon: '🛡️' },
          ].map((f) => (
            <div key={f.title} className="glass rounded-lg p-6 hover:border-primary-500/40 transition-all animate-fade-up">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-display text-xl font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section className="container mx-auto px-6 max-w-5xl py-20">
        <h2 className="font-display font-black text-4xl md:text-5xl text-center mb-4">
          Planos que <span className="gradient-text">cabem no seu bolso</span>
        </h2>
        <p className="text-muted text-center mb-12">Cancele quando quiser. Sem fidelidade.</p>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: 'Mensal', price: '97', period: '/mês', popular: false, badge: null as string | null, saving: null as string | null },
            { name: 'Trimestral', price: '271', period: '/3 meses', popular: true, badge: 'Mais escolhido', saving: 'Economize R$20' },
            { name: 'Anual', price: '974', period: '/ano', popular: false, badge: null, saving: 'Economize R$190' },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`glass rounded-lg p-7 relative ${plan.popular ? 'border-primary-500/50 shadow-btn-emerald animate-border-glow' : ''}`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary-500 text-bg text-xs font-bold">
                  {plan.badge}
                </span>
              )}
              <div className="font-display font-bold text-lg mb-1">{plan.name}</div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-sm text-muted">R$</span>
                <span className="font-display font-black text-5xl">{plan.price}</span>
                <span className="text-sm text-muted">{plan.period}</span>
              </div>
              {plan.saving && <div className="text-xs text-primary-400 mb-4">{plan.saving}</div>}
              <ul className="text-sm text-muted space-y-2 mb-6">
                <li>✓ Acesso completo à plataforma</li>
                <li>✓ Nichos e ofertas ilimitadas</li>
                <li>✓ Análise IA + copy pronta</li>
                <li>✓ Suporte via WhatsApp</li>
              </ul>
              <Link
                href={"/register?plan=" + plan.name.toLowerCase()}
                className={plan.popular ? 'btn-primary w-full' : 'btn-secondary w-full'}
              >
                Assinar agora
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-20">
        <div className="container mx-auto px-6 max-w-6xl text-center text-sm text-muted">
          © 2026 ScaleAki · API: {process.env.NEXT_PUBLIC_API_URL}
        </div>
      </footer>
    </main>
  );
}