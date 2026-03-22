"use client";

import React, { useState, useEffect } from 'react';
import { useOfertaContext } from '@/context/OfertaContext';
import { useNichos } from '@/context/NichoContext';
import { Oferta } from '@/types/oferta';
import { Nicho } from '@/types/nicho';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Save, 
  Eye,
  Link,
  Image,
  FileText,
  Globe,
  BarChart3,
  Video,
  Search,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';

interface OfertaFormData {
  titulo: string;
  imagem: string;
  texto: string;
  nichoId: string;
  linguagem: string;
  links: string[];
  metricas: string;
  vsl: string;
}

interface FormErrors {
  titulo?: string;
  imagem?: string;
  texto?: string;
  nichoId?: string;
  linguagem?: string;
  links?: string;
  metricas?: string;
  vsl?: string;
}

const LINGUAGENS = [
  { value: 'pt-BR', label: 'Português (BR)' },
  { value: 'en-US', label: 'Inglês (US)' },
  { value: 'es-ES', label: 'Espanhol (ES)' },
  { value: 'fr-FR', label: 'Francês (FR)' },
  { value: 'de-DE', label: 'Alemão (DE)' },
];

export default function OfertasAdmin() {
  const { ofertas, criarOferta, editarOferta, removerOferta } = useOfertaContext();
  const { nichos } = useNichos();
  const [showModal, setShowModal] = useState(false);
  const [editingOferta, setEditingOferta] = useState<Oferta | null>(null);
  const [formData, setFormData] = useState<OfertaFormData>({
    titulo: '',
    imagem: '',
    texto: '',
    nichoId: '',
    linguagem: 'pt-BR',
    links: [''],
    metricas: '',
    vsl: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  
  // Filtros e busca
  const [search, setSearch] = useState('');
  const [selectedNicho, setSelectedNicho] = useState('');
  const [selectedLinguagem, setSelectedLinguagem] = useState('');
  const [sortBy, setSortBy] = useState<'titulo' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modal de confirmação de exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ofertaToDelete, setOfertaToDelete] = useState<Oferta | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const toast = useToast();

  // Carregar dados na inicialização
  useEffect(() => {
    if (nichos.length > 0 && !formData.nichoId) {
      setFormData(prev => ({ ...prev, nichoId: nichos[0].id || '' }));
    }
  }, [nichos]);

  // Validar formulário
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'Título é obrigatório';
    }

    if (!formData.texto.trim()) {
      newErrors.texto = 'Texto é obrigatório';
    }

    if (!formData.nichoId) {
      newErrors.nichoId = 'Nicho é obrigatório';
    }

    if (!formData.links.length || !formData.links[0]?.trim()) {
      newErrors.links = 'Pelo menos um link é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Abrir modal para criar/editar
  const openModal = (oferta?: Oferta) => {
    if (oferta) {
      setEditingOferta(oferta);
      setFormData({
        titulo: oferta.titulo,
        imagem: oferta.imagem || '',
        texto: oferta.texto,
        nichoId: oferta.nichoId,
        linguagem: oferta.linguagem,
                 links: Array.isArray(oferta.links) && oferta.links.length > 0 ? oferta.links : [''],
        metricas: oferta.metricas || '',
        vsl: oferta.vsl || ''
      });
    } else {
      setEditingOferta(null);
      setFormData({
        titulo: '',
        imagem: '',
        texto: '',
        nichoId: nichos[0]?.id || '',
        linguagem: 'pt-BR',
        links: [''],
        metricas: '',
        vsl: ''
      });
    }
    setErrors({});
    setShowModal(true);
  };

  // Salvar oferta
  const saveOferta = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const ofertaData = {
        ...formData,
        links: formData.links.filter(link => link.trim() !== '')
      };

      if (editingOferta) {
        await editarOferta({ ...editingOferta, ...ofertaData });
        toast.showToast('Oferta atualizada com sucesso!');
      } else {
        await criarOferta(ofertaData);
        toast.showToast('Oferta criada com sucesso!');
      }
      
      setShowModal(false);
    } catch (error) {
      toast.showToast('Erro ao salvar oferta', 'error', 3500);
    } finally {
      setLoading(false);
    }
  };

  // Deletar oferta
  const deleteOferta = (oferta: Oferta) => {
    setOfertaToDelete(oferta);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!ofertaToDelete) return;
    
    setIsDeleting(true);
    try {
      await removerOferta(ofertaToDelete.id!);
      toast.showToast('Oferta deletada com sucesso!');
      setShowDeleteModal(false);
      setOfertaToDelete(null);
    } catch (error) {
      toast.showToast('Erro ao deletar oferta', 'error', 3500);
    } finally {
      setIsDeleting(false);
    }
  };

  // Adicionar link
  const addLink = () => {
    setFormData(prev => ({
      ...prev,
      links: [...prev.links, '']
    }));
  };

  // Remover link
  const removeLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  // Atualizar link
  const updateLink = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.map((link, i) => i === index ? value : link)
    }));
  };

  // Filtrar e ordenar ofertas
  const filteredOfertas = ofertas
    .filter(oferta => {
      const matchesSearch = !search || 
        oferta.titulo.toLowerCase().includes(search.toLowerCase()) ||
        oferta.texto.toLowerCase().includes(search.toLowerCase());
      
      const matchesNicho = !selectedNicho || oferta.nichoId === selectedNicho;
      const matchesLinguagem = !selectedLinguagem || oferta.linguagem === selectedLinguagem;
      
      return matchesSearch && matchesNicho && matchesLinguagem;
    })
    .sort((a, b) => {
      let comparison = 0;
      
             if (sortBy === 'titulo') {
         comparison = a.titulo.localeCompare(b.titulo);
       } else {
         const dateA = new Date(a.data || a.createdAt || '').getTime();
         const dateB = new Date(b.data || b.createdAt || '').getTime();
         comparison = dateA - dateB;
       }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Obter nome do nicho
  const getNichoName = (nichoId: string) => {
    return nichos.find(n => n.id === nichoId)?.nome || 'Nicho não encontrado';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Ofertas</h1>
          <p className="text-gray-600 mt-1">Crie e gerencie ofertas de marketing</p>
        </div>
        <Button 
          onClick={() => openModal()}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Oferta
        </Button>
      </div>

      {/* Filtros e Busca */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar ofertas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={selectedNicho}
            onChange={(e) => setSelectedNicho(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todos os nichos</option>
            {nichos.map(nicho => (
              <option key={nicho.id} value={nicho.id}>{nicho.nome}</option>
            ))}
          </select>
          
          <select
            value={selectedLinguagem}
            onChange={(e) => setSelectedLinguagem(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todas as linguagens</option>
            {LINGUAGENS.map(lang => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>
          
          <div className="flex space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'titulo' | 'createdAt')}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="createdAt">Data</option>
              <option value="titulo">Título</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3"
            >
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de Ofertas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOfertas.map((oferta) => (
          <Card key={oferta.id} className="p-6 hover:shadow-lg transition-all duration-200 border border-gray-200">
            {/* Imagem */}
            {oferta.imagem && (
              <div className="mb-4">
                <img 
                  src={oferta.imagem} 
                  alt={oferta.titulo}
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            )}
            
            {/* Título e Ações */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 flex-1 mr-3">
                {oferta.titulo}
              </h3>
              <div className="flex items-center space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openModal(oferta)}
                  className="text-gray-500 hover:text-blue-600"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteOferta(oferta)}
                  className="text-gray-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Texto */}
            <p className="text-sm text-gray-600 mb-4 line-clamp-3">
              {oferta.texto}
            </p>
            
            {/* Metadados */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-xs text-gray-500">
                <Globe className="w-3 h-3 mr-1" />
                <span>{getNichoName(oferta.nichoId)}</span>
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <FileText className="w-3 h-3 mr-1" />
                <span>{oferta.linguagem}</span>
              </div>
              {oferta.metricas && (
                <div className="flex items-center text-xs text-gray-500">
                  <BarChart3 className="w-3 h-3 mr-1" />
                  <span>{oferta.metricas}</span>
                </div>
              )}
            </div>
            
            {/* Links */}
            <div className="space-y-1">
              {oferta.links.slice(0, 2).map((link, index) => (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-xs text-blue-600 hover:text-blue-800 truncate"
                >
                  <Link className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">Link {index + 1}</span>
                </a>
              ))}
              {oferta.links.length > 2 && (
                <span className="text-xs text-gray-500">
                  +{oferta.links.length - 2} links adicionais
                </span>
              )}
            </div>
            
            {/* VSL */}
            {oferta.vsl && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <a
                  href={oferta.vsl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-xs text-purple-600 hover:text-purple-800"
                >
                  <Video className="w-3 h-3 mr-1" />
                  <span>VSL</span>
                </a>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingOferta ? 'Editar Oferta' : 'Nova Oferta'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              {/* Título */}
    <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título da Oferta *
                </label>
                <Input
                  value={formData.titulo}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Título atrativo da oferta"
                  className={errors.titulo ? 'border-red-500' : ''}
                />
                {errors.titulo && (
                  <p className="text-red-500 text-sm mt-1">{errors.titulo}</p>
                )}
              </div>

              {/* Imagem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL da Imagem
                </label>
                <Input
                  value={formData.imagem}
                  onChange={(e) => setFormData(prev => ({ ...prev, imagem: e.target.value }))}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>

              {/* Texto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texto da Oferta *
                </label>
                <textarea
                  value={formData.texto}
                  onChange={(e) => setFormData(prev => ({ ...prev, texto: e.target.value }))}
                  placeholder="Descrição detalhada da oferta..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={4}
                />
                {errors.texto && (
                  <p className="text-red-500 text-sm mt-1">{errors.texto}</p>
                )}
              </div>

              {/* Nicho e Linguagem */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nicho *
                  </label>
                  <select
                    value={formData.nichoId}
                    onChange={(e) => setFormData(prev => ({ ...prev, nichoId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Selecione um nicho</option>
                    {nichos.map(nicho => (
                      <option key={nicho.id} value={nicho.id}>{nicho.nome}</option>
                    ))}
                  </select>
                  {errors.nichoId && (
                    <p className="text-red-500 text-sm mt-1">{errors.nichoId}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Linguagem
                  </label>
                  <select
                    value={formData.linguagem}
                    onChange={(e) => setFormData(prev => ({ ...prev, linguagem: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {LINGUAGENS.map(lang => (
                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Links */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Links de Afiliado *
                </label>
                <div className="space-y-2">
                  {formData.links.map((link, index) => (
                    <div key={index} className="flex space-x-2">
                      <Input
                        value={link}
                        onChange={(e) => updateLink(index, e.target.value)}
                        placeholder={`Link ${index + 1}`}
                        className="flex-1"
                      />
                      {formData.links.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeLink(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addLink}
                    className="text-green-600 hover:text-green-800"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar Link
                  </Button>
                </div>
                {errors.links && (
                  <p className="text-red-500 text-sm mt-1">{errors.links}</p>
                )}
              </div>

              {/* Métricas e VSL */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Métricas
                  </label>
                  <Input
                    value={formData.metricas}
                    onChange={(e) => setFormData(prev => ({ ...prev, metricas: e.target.value }))}
                    placeholder="Ex: 1000+ vendas"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    VSL (Video Sales Letter)
                  </label>
                  <Input
                    value={formData.vsl}
                    onChange={(e) => setFormData(prev => ({ ...prev, vsl: e.target.value }))}
                    placeholder="https://exemplo.com/vsl"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                onClick={saveOferta}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingOferta ? 'Atualizar' : 'Criar'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        title="Excluir Oferta"
        description="Tem certeza que deseja excluir esta oferta? Esta ação é irreversível."
        itemName={ofertaToDelete?.titulo || ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setOfertaToDelete(null);
        }}
        isDeleting={isDeleting}
      />
    </div>
  );
} 