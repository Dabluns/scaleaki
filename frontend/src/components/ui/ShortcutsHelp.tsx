'use client';

import React from 'react';
import { Modal } from './Modal';
import { ShortcutHelper } from './ShortcutToast';

interface ShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ['⌘', 'K'], description: 'Busca rápida' },
  { keys: ['⌘', 'D'], description: 'Ir para Dashboard' },
  { keys: ['⌘', 'O'], description: 'Ir para Ofertas' },
  { keys: ['⌘', 'N'], description: 'Ir para Nichos' },
  { keys: ['⌘', 'F'], description: 'Ir para Favoritos' },
  { keys: ['/'], description: 'Focar busca na sidebar' },
  { keys: ['?'], description: 'Ver esta ajuda' },
];

export const ShortcutsHelp: React.FC<ShortcutsHelpProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⌨️ Atalhos de Teclado">
      <ShortcutHelper shortcuts={shortcuts} />
    </Modal>
  );
};

