'use client';

import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useEffect } from 'react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  itemName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export function ConfirmDeleteModal({
  isOpen,
  title,
  description,
  itemName,
  onConfirm,
  onCancel,
  isDeleting = false
}: ConfirmDeleteModalProps) {
  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Prevenir scroll do body
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isDeleting, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={!isDeleting ? onCancel : undefined}
      />

      {/* Modal */}
      <div
        className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200"
        role="alertdialog"
        aria-labelledby="delete-modal-title"
        aria-describedby="delete-modal-description"
      >
        {/* Botão de fechar (só se não estiver deletando) */}
        {!isDeleting && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Conteúdo */}
        <div className="p-6">
          {/* Ícone de alerta */}
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>

          {/* Título */}
          <h2
            id="delete-modal-title"
            className="text-xl font-semibold text-text-primary text-center mb-2"
          >
            {title}
          </h2>

          {/* Descrição */}
          <p
            id="delete-modal-description"
            className="text-text-secondary text-center mb-6"
          >
            {description}
          </p>

          {/* Nome do item (destaque) */}
          {itemName && (
            <div className="bg-background rounded-lg p-3 mb-6">
              <p className="text-sm text-text-secondary text-center mb-1">
                Você está prestes a deletar:
              </p>
              <p className="text-base font-semibold text-text-primary text-center truncate">
                {itemName}
              </p>
            </div>
          )}

          {/* Aviso */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-6">
            <p className="text-sm text-red-800 dark:text-red-300 text-center">
              ⚠️ Esta ação é <strong>irreversível</strong>. Todos os dados serão permanentemente excluídos.
            </p>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 bg-background hover:bg-background-secondary text-text-primary font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Deletando...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Deletar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

