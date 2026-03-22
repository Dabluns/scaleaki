'use client'

import React, { useEffect, useState } from 'react'

interface SplineSceneProps {
    scene: string
    className?: string
}

/**
 * SplineScene component optimized for Next.js 15.
 * Uses the standard Spline Viewer via web component for maximum compatibility 
 * and to avoid binary buffer/access denied issues.
 */
export function SplineScene({ scene, className }: SplineSceneProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Importa o web-component do Spline Viewer de forma dinâmica
        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'https://unpkg.com/@splinetool/viewer@1.9.72/build/spline-viewer.js';
        document.head.appendChild(script);

        return () => {
            // Limpeza opcional se necessário
        };
    }, []);

    if (!mounted) return <div className="w-full h-full bg-transparent" />;

    return (
        <div className={`w-full h-full relative overflow-hidden bg-transparent ${className}`}>
            {/* @ts-ignore - spline-viewer é um web component */}
            <spline-viewer
                url={scene}
                loading-reveal="ignore"
                style={{ width: '100%', height: '100%' }}
            ></spline-viewer>
        </div>
    )
}
