import React, { useState } from 'react';
import { X, Save, Trash2, Edit3, Hash, FileText, Eye } from 'lucide-react';
import { Nicho } from '@/types/nicho';

interface NichoEditModalProps {
  nicho: Nicho;
  onClose: () => void;
  onSave: (nicho: Nicho) => Promise<void>;
  onDelete: (nichoId: string) => Promise<void>;
}

export function NichoEditModal({ nicho, onClose, onSave, onDelete }: NichoEditModalProps) {
  const [formData, setFormData] = useState({
    nome: nicho.nome,
    slug: nicho.slug,
    icone: nicho.icone,
    descricao: nicho.descricao || '',
    isActive: nicho.isActive !== false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateSlug = (nome: string) => {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNomeChange = (nome: string) => {
    handleInputChange('nome', nome);
    // Gerar slug automaticamente baseado no nome
    handleInputChange('slug', generateSlug(nome));
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (!formData.slug.trim()) {
      setError('Slug é obrigatório');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const updatedNicho: Nicho = {
        ...nicho,
        nome: formData.nome.trim(),
        slug: formData.slug.trim(),
        icone: formData.icone.trim(),
        descricao: formData.descricao.trim(),
        isActive: formData.isActive
      };

      await onSave(updatedNicho);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar nicho');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este nicho? Todas as ofertas associadas também serão removidas.')) {
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await onDelete(nicho.id!);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir nicho');
    } finally {
      setLoading(false);
    }
  };

  const iconOptions = [
    { value: 'dollar-sign', label: '💰 Renda Extra' },
    { value: 'heart', label: '❤️ Saúde' },
    { value: 'sparkles', label: '✨ Beleza' },
    { value: 'book-open', label: '📚 Educação' },
    { value: 'cpu', label: '💻 Tecnologia' },
    { value: 'home', label: '🏠 Casa' },
    { value: 'car', label: '🚗 Automóveis' },
    { value: 'gamepad-2', label: '🎮 Games' },
    { value: 'music', label: '🎵 Música' },
    { value: 'camera', label: '📷 Fotografia' },
    { value: 'utensils', label: '🍽️ Gastronomia' },
    { value: 'dumbbell', label: '🏋️ Fitness' }
  ];

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
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Edit3 className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Editar Nicho
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

          <div className="space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => handleNomeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Renda Extra"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug *
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="renda-extra"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                URL amigável (gerado automaticamente)
              </p>
            </div>

            {/* Ícone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ícone
              </label>
              <select
                value={formData.icone}
                onChange={(e) => handleInputChange('icone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {iconOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descrição do nicho..."
              />
            </div>

            {/* Status */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Nicho Ativo
                </span>
              </label>
            </div>

            {/* Informações */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Informações do Nicho</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>ID:</strong> {nicho.id}</p>
                <p><strong>Criado em:</strong> {nicho.createdAt ? new Date(nicho.createdAt).toLocaleDateString('pt-BR') : 'N/A'}</p>
                <p><strong>Atualizado em:</strong> {nicho.updatedAt ? new Date(nicho.updatedAt).toLocaleDateString('pt-BR') : 'N/A'}</p>
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
    </div>
  );
} 