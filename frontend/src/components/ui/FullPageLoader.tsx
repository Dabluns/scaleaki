'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface FullPageLoaderProps {
    message?: string;
    submessage?: string;
}

const loadingPhrases = [
    "Iniciando módulos...",
    "Sincronizando ambiente...",
    "Conectando ao servidor...",
    "Validando sessão..."
];

export const FullPageLoader: React.FC<FullPageLoaderProps> = ({
    message = "Autenticando",
    submessage = "Aguarde um momento"
}) => {
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [isBooted, setIsBooted] = useState(false);

    useEffect(() => {
        // Sequência inicial de boot ("tela ligando")
        const bootTimer = setTimeout(() => {
            setIsBooted(true);
        }, 600);

        const interval = setInterval(() => {
            setPhraseIndex((prev) => (prev + 1) % loadingPhrases.length);
        }, 1500);
        
        return () => {
            clearTimeout(bootTimer);
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050505] overflow-hidden font-sans">
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes boot-line {
                    0% { width: 0%; opacity: 0; box-shadow: 0 0 0 rgba(34,197,94,0); }
                    30% { width: 100%; opacity: 1; box-shadow: 0 0 20px rgba(34,197,94,0.8); }
                    50% { width: 100%; opacity: 1; height: 1px; }
                    100% { width: 100%; opacity: 0; height: 100vh; }
                }
                @keyframes fade-in-scale {
                    0% { opacity: 0; filter: blur(12px); transform: scale(0.9); }
                    100% { opacity: 1; filter: blur(0); transform: scale(1); }
                }
                @keyframes minimal-scan {
                    0% { left: 0%; width: 10%; }
                    50% { width: 40%; }
                    100% { left: 90%; width: 10%; }
                }
                .animate-boot {
                    animation: boot-line 0.7s cubic-bezier(0.8, 0, 0.2, 1) forwards;
                }
                .animate-content {
                    animation: fade-in-scale 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-minimal-scan {
                    animation: minimal-scan 2s ease-in-out infinite alternate;
                }
            `}} />

            {/* A linha de luz inicial (efeito tela ligando) */}
            {!isBooted && (
                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-green-500 animate-boot z-50 origin-center" />
            )}

            <div className={`relative flex flex-col items-center transition-all duration-1000 ${isBooted ? 'opacity-100 animate-content' : 'opacity-0'}`}>
                {/* Logo Minimalista */}
                <div className="relative mb-8 flex items-center justify-center w-16 h-16 bg-white/5 rounded-2xl border border-white/10 shadow-[0_0_40px_rgba(34,197,94,0.15)] backdrop-blur-sm">
                    <Image
                        src="/logo-mark.svg"
                        alt="Scaleaki"
                        width={32}
                        height={32}
                        className="object-contain opacity-90 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                    />
                </div>

                {/* Textos Principais */}
                <div className="text-center relative z-10 px-4 flex flex-col items-center">
                    <h2 className="text-lg md:text-xl font-medium text-white/90 tracking-wide mb-3 flex items-center gap-2">
                        {message}
                        <span className="flex gap-[3px] ml-1">
                            <span className="w-[3px] h-[3px] bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-[3px] h-[3px] bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-[3px] h-[3px] bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                    </h2>

                    <div className="h-5 overflow-hidden">
                        <p className="text-green-500/60 font-mono text-[10px] md:text-xs tracking-[0.2em] uppercase transition-all duration-300">
                            {loadingPhrases[phraseIndex]}
                        </p>
                    </div>

                    {/* Barra de Progresso Ultra Minimalista */}
                    <div className="mt-8 w-32 h-[1px] bg-white/10 overflow-hidden relative">
                        <div className="absolute top-0 bottom-0 left-0 bg-green-500 animate-minimal-scan shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                    </div>
                </div>
            </div>
            
            {/* Background super sutil pra não ser 100% preto */}
            <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-900/10 via-[#050505] to-[#050505]" />
        </div>
    );
};
