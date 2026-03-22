'use client';

import { useState, useEffect, useRef, RefObject } from 'react';

/**
 * Hook premium para detectar visibilidade e disparar animações
 * Ideal para otimizar performance e criar efeitos de reveal on scroll
 */
interface IntersectionOptions extends IntersectionObserverInit {
    freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
    elementRef: RefObject<Element | null>,
    {
        threshold = 0.1,
        root = null,
        rootMargin = '0%',
        freezeOnceVisible = true,
    }: IntersectionOptions = {}
): IntersectionObserverEntry | undefined {
    const [entry, setEntry] = useState<IntersectionObserverEntry>();

    const frozen = entry?.isIntersecting && freezeOnceVisible;

    const updateEntry = ([entry]: IntersectionObserverEntry[]): void => {
        setEntry(entry);
    };

    useEffect(() => {
        const node = elementRef?.current;
        const hasIOSupport = !!window.IntersectionObserver;

        if (!hasIOSupport || frozen || !node) return;

        const observerParams = { threshold, root, rootMargin };
        const observer = new IntersectionObserver(updateEntry, observerParams);

        observer.observe(node);

        return () => observer.disconnect();
    }, [elementRef, threshold, root, rootMargin, frozen]);

    return entry;
}
