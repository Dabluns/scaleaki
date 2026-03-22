import React, { useState } from 'react';
import { X, Save, Trash2, Edit3 } from 'lucide-react';
import { Oferta } from '@/types/oferta';
import { Nicho } from '@/types/nicho';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';

interface OfertaEditModalProps {
  oferta: Oferta;
  nicho?: Nicho;
  onClose: () => void;
  onSave: (oferta: Oferta) => Promise<void>;
  onDelete: (ofertaId: string) => Promise<void>;
}

export function OfertaEditModal({ oferta, nicho, onClose, onSave, onDelete }: OfertaEditModalProps) {
  const [formData, setFormData] = useState({
    titulo: oferta.titulo,
    texto: oferta.texto,
    linguagem: oferta.linguagem,
    metricas: oferta.metricas || '',
    vsl: oferta.vsl || '',
    links: oferta.links ? oferta.links.join('\n') : '',
    isActive: oferta.isActive !== false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    
    try {
      const updatedOferta: Oferta = {
        ...oferta,
        titulo: formData.titulo,
        texto: formData.texto,
        linguagem: formData.linguagem,
        metricas: formData.metricas,
        vsl: formData.vsl,
        links: formData.links.split('\n').filter(link => link.trim()),
        isActive: formData.isActive
      };

      await onSave(updatedOferta);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar oferta');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setError('');
    
    try {
      await onDelete(oferta.id!);
      setShowDeleteModal(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir oferta');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-4xl mx-auto max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Edit3 className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Editar Oferta
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-8rem)] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coluna Esquerda */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => handleInputChange('titulo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Título da oferta"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição *
                </label>
                <textarea
                  value={formData.texto}
                  onChange={(e) => handleInputChange('texto', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descrição da oferta"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Linguagem
                </label>
                <select
                  value={formData.linguagem}
                  onChange={(e) => handleInputChange('linguagem', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pt-BR">Português</option>
                  <option value="en-US">Inglês</option>
                  <option value="es-ES">Espanhol</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Métricas
                </label>
                <input
                  type="text"
                  value={formData.metricas}
                  onChange={(e) => handleInputChange('metricas', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 500k/dia"
                />
              </div>
            </div>

            {/* Coluna Direita */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  VSL (Video Sales Letter)
                </label>
                <input
                  type="url"
                  value={formData.vsl}
                  onChange={(e) => handleInputChange('vsl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://exemplo.com/vsl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Links da Oferta (um por linha)
                </label>
                <textarea
                  value={formData.links}
                  onChange={(e) => handleInputChange('links', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://exemplo.com/link1&#10;https://exemplo.com/link2"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Oferta Ativa
                  </span>
                </label>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Informações do Nicho</h3>
                <p className="text-sm text-gray-600">
                  <strong>Nicho:</strong> {nicho?.nome || 'Não definido'}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>ID da Oferta:</strong> {oferta.id}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
            >
              <Trash2 size={16} />
              Excluir
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
              >
                <Save size={16} />
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
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
    </div>
  );
} 