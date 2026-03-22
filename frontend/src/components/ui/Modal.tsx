import React, { useEffect } from 'react';
import { X, Copy, MessageCircle } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function Modal({ isOpen, onClose, children, title }: ModalProps) {
  // Prevenir scroll do body quando modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Fechar modal com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 dark:bg-black/70 modal-backdrop transition-colors"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-surface rounded-lg shadow-2xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-hidden hover-lift border border-border">
        {/* Header */}
        <div className="relative h-48 bg-gradient-to-r from-surface-secondary to-surface-hover dark:from-gray-800 dark:to-gray-700 overflow-hidden">
          {/* Background Image/Video Frame */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-info/20">
            <div className="absolute bottom-4 left-4">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">$</span>
              </div>
            </div>
          </div>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors focus-ring"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-text-primary modal-content max-h-[calc(90vh-12rem)] overflow-y-auto">
          {title && (
            <h2 className="text-2xl font-bold mb-6">{title}</h2>
          )}
          {children}
        </div>
      </div>
    </div>
  );
} 