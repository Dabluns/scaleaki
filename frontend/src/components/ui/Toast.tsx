'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import clsx from 'clsx';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'celebration';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextProps {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showCelebration: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextProps>({
  showToast: () => { },
  showSuccess: () => { },
  showError: () => { },
  showInfo: () => { },
  showWarning: () => { },
  showCelebration: () => { },
});

export function useToast() {
  return useContext(ToastContext);
}

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success', duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const showSuccess = useCallback((message: string, duration = 3000) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message: string, duration = 4000) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  const showInfo = useCallback((message: string, duration = 3000) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  const showWarning = useCallback((message: string, duration = 4000) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  const showCelebration = useCallback((message: string, duration = 5000) => {
    showToast(message, 'celebration', duration);
  }, [showToast]);

  const contextValue = useMemo(
    () => ({
      showToast,
      showSuccess,
      showError,
      showInfo,
      showWarning,
      showCelebration,
    }),
    [showToast, showSuccess, showError, showInfo, showWarning, showCelebration]
  );

  const getToastStyles = (type: ToastType) => {
    const baseStyles = 'fixed left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-2xl border z-50 flex items-center gap-3 min-w-[300px] max-w-[500px] transition-all duration-300 animate-fadeIn';

    switch (type) {
      case 'success':
        return clsx(
          baseStyles,
          'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-400',
          'shadow-[0_0_20px_rgba(16,185,129,0.5)]'
        );
      case 'error':
        return clsx(
          baseStyles,
          'bg-gradient-to-r from-red-500 to-rose-500 text-white border-red-400',
          'shadow-[0_0_20px_rgba(239,68,68,0.5)]'
        );
      case 'warning':
        return clsx(
          baseStyles,
          'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400',
          'shadow-[0_0_20px_rgba(249,115,22,0.5)]'
        );
      case 'info':
        return clsx(
          baseStyles,
          'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-cyan-400',
          'shadow-[0_0_20px_rgba(6,182,212,0.5)]'
        );
      case 'celebration':
        return clsx(
          baseStyles,
          'bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white border-purple-400',
          'shadow-[0_0_30px_rgba(139,92,246,0.6)] animate-pulse'
        );
      default:
        return baseStyles;
    }
  };

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={24} className="animate-elastic-bounce" />;
      case 'error':
        return <XCircle size={24} />;
      case 'warning':
        return <AlertTriangle size={24} />;
      case 'info':
        return <Info size={24} />;
      case 'celebration':
        return <span className="text-2xl animate-float">🎉</span>;
      default:
        return null;
    }
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className={clsx(
              getToastStyles(toast.type),
              'pointer-events-auto',
              'animate-slide-up'
            )}
            style={{
              bottom: `${index * 80 + 24}px`,
            }}
          >
            {getToastIcon(toast.type)}
            <p className="flex-1 font-medium">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="hover:opacity-80 transition-opacity"
              aria-label="Fechar notificação"
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}; 