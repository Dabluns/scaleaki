'use client';

import React, { useRef } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { clsx } from 'clsx';

interface RevealProps {
    children: React.ReactNode;
    className?: string;
    delay?: 0 | 100 | 200 | 300 | 400 | 500;
    threshold?: number;
}

export const Reveal: React.FC<RevealProps> = ({
    children,
    className = '',
    delay = 0,
    threshold = 0.1
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const entry = useIntersectionObserver(ref, { threshold, freezeOnceVisible: true });
    const isVisible = !!entry?.isIntersecting;

    return (
        <div
            ref={ref}
            className={clsx(
                'reveal-on-scroll',
                isVisible && 'is-visible',
                delay > 0 && `reveal-delay-${delay}`,
                className
            )}
        >
            {children}
        </div>
    );
};
