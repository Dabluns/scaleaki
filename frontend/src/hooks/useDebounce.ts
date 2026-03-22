import { useState, useEffect } from 'react';

/**
 * Hook personalizado para debounce
 * @param value - Valor a ser debounced
 * @param delay - Delay em milissegundos
 * @returns Valor debounced
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para debounce de função
 * @param callback - Função a ser debounced
 * @param delay - Delay em milissegundos
 * @returns Função debounced
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  return ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  }) as T;
}

/**
 * Hook para debounce de pesquisa com estado de loading
 * @param searchFunction - Função de pesquisa
 * @param delay - Delay em milissegundos
 * @returns [função debounced, estado de loading]
 */
export function useDebouncedSearch<T>(
  searchFunction: (query: string) => Promise<T>,
  delay: number = 500
): [(query: string) => void, boolean, T | null] {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<T | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const debouncedSearch = (query: string) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(async () => {
      if (query.trim()) {
        setLoading(true);
        try {
          const searchResult = await searchFunction(query);
          setResult(searchResult);
        } catch (error) {
          console.error('Search error:', error);
          setResult(null);
        } finally {
          setLoading(false);
        }
      } else {
        setResult(null);
        setLoading(false);
      }
    }, delay);

    setTimeoutId(newTimeoutId);
  };

  return [debouncedSearch, loading, result];
} 