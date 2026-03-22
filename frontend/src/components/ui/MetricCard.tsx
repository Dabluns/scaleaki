'use client';

import React, { useRef } from 'react';
import { useCounter } from '@/hooks/useCounter';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { clsx, type ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}

interface MetricCardProps {
    label: string;
    value: number;
    suffix?: string;
    prefix?: string;
    icon?: React.ReactNode;
    color?: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'cyan';
    className?: string;
    duration?: number;
}

const colorMap = {
    green: 'text-green-500 border-green-500/30',
    blue: 'text-blue-500 border-blue-500/30',
    red: 'text-red-500 border-red-500/30',
    yellow: 'text-yellow-500 border-yellow-500/30',
    purple: 'text-purple-500 border-purple-500/30',
    cyan: 'text-cyan-500 border-cyan-500/30',
};

export const MetricCard: React.FC<MetricCardProps> = ({
    label,
    value,
    suffix = '',
    prefix = '',
    icon,
    color = 'green',
    className,
    duration = 2000,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const entry = useIntersectionObserver(containerRef, { threshold: 0.1, freezeOnceVisible: true });
    const isVisible = !!entry?.isIntersecting;

    const { count } = useCounter(value, {
        duration,
        startOnMount: false, // We'll trigger it manually when visible
    });

    // Trigger animation when visible
    React.useEffect(() => {
        if (isVisible) {
            // Trigger handled by useCounter's internal effect if startOnMount was true, 
            // but since we want it only when visible:
        }
    }, [isVisible]);

    // Modifying useCounter slightly to support manual trigger or just using a different approach.
    // Actually, let's just use useCounter with startOnMount={isVisible}

    const { count: animatedValue } = useCounter(isVisible ? value : 0, { duration });

    return (
        <div
            ref={containerRef}
            className={cn(
                'glass-card p-4 transition-all duration-700 ease-out transform',
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
                colorMap[color],
                className
            )}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-tertiary uppercase tracking-wider font-bold">
                    {label}
                </span>
                {icon && <div className={cn('opacity-80', colorMap[color].split(' ')[0])}>{icon}</div>}
            </div>
            <div className={cn('text-3xl font-black font-display tracking-tight', colorMap[color].split(' ')[0])}>
                {prefix}
                {animatedValue.toLocaleString('pt-BR')}
                {suffix}
            </div>
        </div>
    );
};
