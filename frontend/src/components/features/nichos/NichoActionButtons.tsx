import React from 'react';
import { Edit3, Eye, Trash2, ExternalLink } from 'lucide-react';
import { Nicho } from '@/types/nicho';

interface NichoActionButtonsProps {
  nicho: Nicho;
  onView: (nicho: Nicho) => void;
  onEdit: (nicho: Nicho) => void;
  onDelete: (nichoId: string) => void;
  onViewOfertas: (nicho: Nicho) => void;
}

export function NichoActionButtons({ nicho, onView, onEdit, onDelete, onViewOfertas }: NichoActionButtonsProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este nicho? Todas as ofertas associadas também serão removidas.')) {
      onDelete(nicho.id!);
    }
  };

  return (
    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onView(nicho);
        }}
        className="w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
        title="Visualizar detalhes"
      >
        <Eye size={14} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onViewOfertas(nicho);
        }}
        className="w-8 h-8 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
        title="Ver ofertas"
      >
        <ExternalLink size={14} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit(nicho);
        }}
        className="w-8 h-8 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
        title="Editar nicho"
      >
        <Edit3 size={14} />
      </button>
      <button
        onClick={handleDelete}
        className="w-8 h-8 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
        title="Excluir nicho"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
} 