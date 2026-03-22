'use client';

import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useToast } from './Toast';

interface ShortcutToastProps {
  keys: string[];
  action: string;
  duration?: number;
}

export const ShortcutToast: React.FC<ShortcutToastProps> = ({
  keys,
  action,
  duration = 2000,
}) => {
  const toast = useToast();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    const keysString = keys.join(' + ');
    toast.showInfo(`${keysString} → ${action}`, duration);

    setIsVisible(false);
  }, [isVisible, keys, action, duration, toast]);

  return null;
};

// Hook para gerenciar shortcuts
export const useKeyboardShortcuts = () => {
  const [toastQueue, setToastQueue] = useState<{ keys: string[]; action: string }[]>([]);

  const registerShortcut = (
    keys: string[],
    action: () => void,
    description: string,
    preventDefault: boolean = true
  ) => {
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase();
        const isModifier = e.ctrlKey || e.metaKey || e.shiftKey || e.altKey;

        // Verificar se a combinação de teclas corresponde
        const keyString = key;
        const modifierString = [
          (e.ctrlKey || e.metaKey) && (e.ctrlKey ? 'Ctrl' : '⌘'),
          e.shiftKey && 'Shift',
          e.altKey && 'Alt',
        ]
          .filter(Boolean)
          .join('+');

        const expectedKeys = keys.map(k => k.toLowerCase());
        const actualModifiers = modifierString ? [modifierString, keyString] : [keyString];

        if (JSON.stringify(expectedKeys.sort()) === JSON.stringify(actualModifiers.sort())) {
          if (preventDefault) e.preventDefault();
          
          // Mostrar toast
          setToastQueue(prev => [...prev, { keys, action: description }]);
          
          // Executar ação
          action();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [keys, action, description, preventDefault]);
  };

  return { registerShortcut, toastQueue };
};

// Componente para exibir shortcuts disponíveis
export const ShortcutHelper: React.FC<{ shortcuts: Array<{ keys: string[]; description: string }> }> = ({
  shortcuts,
}) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-text-primary mb-3">Atalhos de Teclado</h3>
      <div className="space-y-2">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">{shortcut.description}</span>
            <div className="flex items-center gap-1">
              {shortcut.keys.map((key, keyIndex) => (
                <React.Fragment key={keyIndex}>
                  <kbd className="px-2 py-1 bg-surface-secondary border border-border rounded text-xs font-semibold text-text-primary shadow-sm">
                    {key}
                  </kbd>
                  {keyIndex < shortcut.keys.length - 1 && (
                    <span className="text-text-tertiary mx-1">+</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

