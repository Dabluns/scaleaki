import React from 'react';
import { X, Hash, Calendar, FileText, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { Nicho } from '@/types/nicho';

interface NichoDetailModalProps {
  nicho: Nicho;
  onClose: () => void;
  onEdit: (nicho: Nicho) => void;
  onViewOfertas: (nicho: Nicho) => void;
}

export function NichoDetailModal({ nicho, onClose, onEdit, onViewOfertas }: NichoDetailModalProps) {
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIconEmoji = (iconName: string) => {
    const iconMap: { [key: string]: string } = {
      'dollar-sign': '💰',
      'heart': '❤️',
      'sparkles': '✨',
      'book-open': '📚',
      'cpu': '💻',
      'home': '🏠',
      'car': '🚗',
      'gamepad-2': '🎮',
      'music': '🎵',
      'camera': '📷',
      'utensils': '🍽️',
      'dumbbell': '🏋️'
    };
    return iconMap[iconName] || '📁';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">
                {getIconEmoji(nicho.icone)}
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {nicho.nome}
                </h2>
                <p className="text-blue-100 text-sm">
                  Nicho de mercado
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-8rem)] overflow-y-auto">
          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              {nicho.isActive !== false ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  <CheckCircle size={16} />
                  Ativo
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                  <XCircle size={16} />
                  Inativo
                </div>
              )}
            </div>

            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Slug</span>
                </div>
                <p className="text-gray-900 font-mono text-sm">
                  {nicho.slug}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Ícone</span>
                </div>
                <p className="text-gray-900 text-sm">
                  {nicho.icone}
                </p>
              </div>
            </div>

            {/* Descrição */}
            {nicho.descricao && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Descrição</span>
                </div>
                <p className="text-gray-900 text-sm leading-relaxed">
                  {nicho.descricao}
                </p>
              </div>
            )}

            {/* Informações do Sistema */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-3">Informações do Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-700">Criado em:</span>
                  <span className="text-blue-900">{formatDate(nicho.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-700">Atualizado em:</span>
                  <span className="text-blue-900">{formatDate(nicho.updatedAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-700">ID:</span>
                  <span className="text-blue-900 font-mono">{nicho.id}</span>
                </div>
              </div>
            </div>

            {/* Links Rápidos */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="text-sm font-medium text-purple-900 mb-3">Ações Rápidas</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onViewOfertas(nicho)}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
                >
                  <TrendingUp size={16} />
                  Ver Ofertas
                </button>
                <button
                  onClick={() => onEdit(nicho)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                  <FileText size={16} />
                  Editar Nicho
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={() => onViewOfertas(nicho)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <TrendingUp size={16} />
              Ver Ofertas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 