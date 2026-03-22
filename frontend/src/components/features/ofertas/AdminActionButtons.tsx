'use client';

import React, { useState } from 'react';
import { Edit3, Eye, Trash2 } from 'lucide-react';
import { Oferta } from '@/types/oferta';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';

interface AdminActionButtonsProps {
  oferta: Oferta;
  onView: (oferta: Oferta) => void;
  onEdit: (oferta: Oferta) => void;
  onDelete: (ofertaId: string) => void;
}

export function AdminActionButtons({ oferta, onView, onEdit, onDelete }: AdminActionButtonsProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(oferta.id!);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Erro ao deletar:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="absolute top-3 left-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(oferta);
          }}
          className="w-8 h-8 bg-white/95 hover:bg-white rounded-full flex items-center justify-center text-blue-600 hover:text-blue-700 transition-all shadow-sm border border-gray-200"
          title="Visualizar detalhes"
        >
          <Eye size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(oferta);
          }}
          className="w-8 h-8 bg-white/95 hover:bg-white rounded-full flex items-center justify-center text-green-600 hover:text-green-700 transition-all shadow-sm border border-gray-200"
          title="Editar oferta"
        >
          <Edit3 size={14} />
        </button>
        <button
          onClick={handleDelete}
          className="w-8 h-8 bg-white/95 hover:bg-white rounded-full flex items-center justify-center text-red-600 hover:text-red-700 transition-all shadow-sm border border-gray-200"
          title="Excluir oferta"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        title="Excluir Oferta"
        description="Tem certeza que deseja excluir esta oferta? Esta ação é irreversível."
        itemName={oferta.titulo}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        isDeleting={isDeleting}
      />
    </>
  );
} 