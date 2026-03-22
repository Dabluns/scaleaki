'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface FullPageLoaderProps {
    message?: string;
    submessage?: string;
}

const loadingPhrases = [
    "Iniciando motores de busca...",
    "Sincronizando banco de ofertas...",
    "Otimizando pixels para escala...",
    "Verificando credenciais neurais...",
    "Preparando ambiente de alta conversão...",
    "Analisando métricas do Facebook Ads...",
    "Conectando ao núcleo Skaleaki...",
    "Carregando criativos de alta performance..."
];

export const FullPageLoader: React.FC<FullPageLoaderProps> = ({
    message = "Processando informações",
    submessage = "Aguarde um momento"
}) => {
    const [phraseIndex, setPhraseIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setPhraseIndex((prev) => (prev + 1) % loadingPhrases.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-950 overflow-hidden">
            {/* Background Cyberpunk Dinâmico */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

                {/* Grid animado de fundo */}
                <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(rgba(34,197,94,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.1)_1px,transparent_1px)] bg-[size:40px_40px] animate-grid-pulse" />
            </div>

            <div className="relative flex flex-col items-center">
                {/* Logo Central com Efeitos */}
                <div className="relative mb-12 animate-float">
                    {/* Anéis de energia */}
                    <div className="absolute inset-0 -m-4 border-2 border-green-500/20 rounded-full animate-spin-slow" />
                    <div className="absolute inset-0 -m-8 border border-cyan-500/10 rounded-full animate-reverse-spin-slow" style={{ animationDuration: '10s' }} />

                    {/* Glow principal */}
                    <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse" />

                    <div className="relative w-24 h-24 md:w-32 md:h-32 bg-gray-900 rounded-3xl p-4 border border-green-500/40 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                        <Image
                            src="/logo-mark.svg"
                            alt="Skaleaki"
                            width={128}
                            height={128}
                            className="w-full h-full object-contain animate-pulse-enhanced"
                        />
                    </div>
                </div>

                {/* Textos de Status */}
                <div className="text-center relative z-10 px-4">
                    <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
                        {message}
                        <span className="inline-flex w-8 text-left animate-pulse">...</span>
                    </h2>

                    <div className="h-6 overflow-hidden">
                        <p className="text-green-400 font-mono text-sm md:text-base animate-slide-up key={phraseIndex}">
                            {loadingPhrases[phraseIndex]}
                        </p>
                    </div>

                    {/* Barra de Progresso Estilizada */}
                    <div className="mt-8 w-48 md:w-64 h-1 bg-white/5 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-cyan-400 to-green-500 bg-[size:200%_100%] animate-gradient-wave" />

                        {/* Brilho da barra */}
                        <div className="absolute inset-0 bg-green-400 blur-sm opacity-50 animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Decorações Laterais Técnicas */}
            <div className="absolute bottom-8 left-8 hidden md:block opacity-30 font-mono text-[10px] text-green-500 space-y-1">
                <div>CORE_VERSION: 2.0.5_BUILD</div>
                <div>SYS_STATUS: NEURAL_LINK_OK</div>
            </div>
            <div className="absolute bottom-8 right-8 hidden md:block opacity-30 font-mono text-[10px] text-cyan-500 text-right space-y-1">
                <div>UI_ENGINE: SKALE_GLASS_V3</div>
                <div>RENDER: TURBOPACK_ENABLED</div>
            </div>
        </div>
    );
};

// Adicionar keyframes extras necessários caso não existam
const extraStyles = `
  @keyframes reverse-spin-slow {
    from { transform: rotate(360deg); }
    to { transform: rotate(0deg); }
  }
`;
