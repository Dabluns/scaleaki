import React, { useState } from 'react';
import { Copy, MessageCircle, ExternalLink, Check, Edit3, Save, X, Trash2 } from 'lucide-react';
import { Oferta } from '@/types/oferta';
import { Nicho } from '@/types/nicho';
import { useAuth } from '@/context/AuthContext';
import { useOfertaContext } from '@/context/OfertaContext';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { formatBadge, formatLabel } from '@/lib/formatters';

interface OfertaDetailModalProps {
  oferta: Oferta;
  nicho?: Nicho;
  onClose: () => void;
}

export function OfertaDetailModal({ oferta, nicho, onClose }: OfertaDetailModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedOferta, setEditedOferta] = useState<Oferta>(oferta);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { isAdmin } = useAuth();
  const { editarOferta, removerOferta } = useOfertaContext();

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return '';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('pt-BR');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await editarOferta(editedOferta);
      if (success) {
        setIsEditing(false);
        // Atualizar a oferta local
        Object.assign(oferta, editedOferta);
      }
    } catch (error) {
      console.error('Erro ao salvar oferta:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedOferta(oferta);
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await removerOferta(oferta.id);
      setShowDeleteModal(false);
      onClose();
    } catch (error) {
      console.error('Erro ao excluir oferta:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const updateField = (field: keyof Oferta, value: any) => {
    setEditedOferta(prev => ({ ...prev, [field]: value }));
  };

  const getFunnelTypeColor = (type?: string) => {
    const colors = {
      'front_vsl': 'bg-amber-600',
      'front_venda': 'bg-green-600',
      'front_captura': 'bg-blue-600',
      'default': 'bg-gray-600'
    };
    return colors[type as keyof typeof colors] || colors.default;
  };

  const getStatusColor = (status?: string) => {
    const colors = {
      'ativa': 'bg-green-600',
      'pausada': 'bg-yellow-600',
      'arquivada': 'bg-gray-600',
      'teste': 'bg-purple-600',
      'default': 'bg-gray-600'
    };
    return colors[status as keyof typeof colors] || colors.default;
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho com título e botões de ação */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              value={editedOferta.titulo}
              onChange={(e) => updateField('titulo', e.target.value)}
              className="text-3xl font-bold text-white bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-400 w-full"
            />
          ) : (
            <h1 className="text-3xl font-bold text-white">{oferta.titulo}</h1>
          )}
        </div>

        {/* Botões de ação para admin */}
        {isAdmin && (
          <div className="flex items-center gap-2 ml-4">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                  title="Salvar alterações"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save size={16} className="text-white" />
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  className="p-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Cancelar edição"
                >
                  <X size={16} className="text-white" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  title="Editar oferta"
                >
                  <Edit3 size={16} className="text-white" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  title="Excluir oferta"
                >
                  <Trash2 size={16} className="text-white" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Banner de Imagem */}
      {oferta.imagem && (
        <div className="relative h-48 overflow-hidden rounded-lg">
          {/* Background escuro com gradiente de iluminação quente */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Iluminação quente simulada */}
            <div className="absolute top-0 left-0 w-full h-full">
              {/* Luz superior esquerda */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl"></div>
              {/* Luz superior direita */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl"></div>
              {/* Luz inferior central */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl"></div>
            </div>

            {/* Imagem da oferta com overlay */}
            <div className="relative w-full h-full">
              <img
                src={oferta.imagem}
                alt={oferta.titulo}
                className="w-full h-full object-cover opacity-80"
              />
              {/* Overlay escuro para manter o contraste */}
              <div className="absolute inset-0 bg-black/30"></div>
            </div>

            {/* Painéis verticais simulados (como na imagem de exemplo) */}
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full flex">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 border-r border-gray-600/30"
                    style={{
                      background: `linear-gradient(to bottom, transparent, rgba(139, 69, 19, 0.1))`
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* Ícone de dinheiro no canto inferior esquerdo */}
          <div className="absolute bottom-3 left-3">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-lg border-2 border-green-400">
              <span className="text-white font-bold text-xl">$</span>
            </div>
          </div>

          {/* Barra superior simulada (como na imagem de exemplo) */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm">
            <div className="flex items-center justify-end h-full px-3 gap-2">
              <div className="w-6 h-6 bg-gray-600/50 rounded flex items-center justify-center">
                <span className="text-xs text-gray-300">Aあ</span>
              </div>
              <div className="w-6 h-6 bg-gray-600/50 rounded flex items-center justify-center">
                <span className="text-xs text-gray-300">×</span>
              </div>
              <div className="text-xs text-gray-300 font-medium">Share</div>
              <div className="w-6 h-6 bg-gray-600/50 rounded flex items-center justify-center">
                <span className="text-xs text-gray-300">★</span>
              </div>
              <div className="w-6 h-6 bg-gray-600/50 rounded flex items-center justify-center">
                <span className="text-xs text-gray-300">⋯</span>
              </div>
            </div>
          </div>

          {/* Microfone simulado (opcional) */}
          <div className="absolute bottom-8 right-8 opacity-30">
            <div className="w-8 h-16 bg-gray-700 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
            </div>
          </div>
        </div>
      )}

      {/* Campos detalhados */}
      <div className="space-y-4">
        {/* Idioma */}
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Idioma:</span>
          {isEditing ? (
            <select
              value={editedOferta.linguagem || 'pt_BR'}
              onChange={(e) => updateField('linguagem', e.target.value)}
              className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-1 focus:outline-none focus:border-blue-500"
            >
              <option value="pt_BR">Português</option>
              <option value="en_US">Inglês</option>
              <option value="es_ES">Espanhol</option>
              <option value="fr_FR">Francês</option>
            </select>
          ) : (
            <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${oferta.linguagem === 'pt_BR' ? 'bg-amber-600' :
              oferta.linguagem === 'en_US' ? 'bg-blue-600' :
                oferta.linguagem === 'es_ES' ? 'bg-green-600' :
                  oferta.linguagem === 'fr_FR' ? 'bg-purple-600' : 'bg-gray-600'}`}>
              {oferta.linguagem === 'pt_BR' ? 'Português' :
                oferta.linguagem === 'en_US' ? 'Inglês' :
                  oferta.linguagem === 'es_ES' ? 'Espanhol' :
                    oferta.linguagem === 'fr_FR' ? 'Francês' : oferta.linguagem}
            </span>
          )}
        </div>

        {/* Nicho */}
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Nicho:</span>
          <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${nicho?.nome ? (nicho.nome === 'Renda extra' ? 'bg-green-600' :
            nicho.nome === 'Saúde' ? 'bg-red-600' :
              nicho.nome === 'Beleza' ? 'bg-pink-600' :
                nicho.nome === 'Educação' ? 'bg-blue-600' :
                  nicho.nome === 'Tecnologia' ? 'bg-purple-600' : 'bg-gray-600') : 'bg-gray-600'}`}>
            {nicho?.nome || 'Nicho não definido'}
          </span>
        </div>

        {/* Texto da oferta */}
        <div className="flex items-start justify-between">
          <span className="text-gray-300">Texto:</span>
          <div className="flex-1 ml-4">
            {isEditing ? (
              <textarea
                value={editedOferta.texto}
                onChange={(e) => updateField('texto', e.target.value)}
                className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg p-2 focus:outline-none focus:border-blue-500 resize-none"
                rows={3}
              />
            ) : (
              <span className="text-white">{oferta.texto}</span>
            )}
          </div>
        </div>

        {/* Data */}
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Data:</span>
          <div className="flex items-center gap-2">
            <span className="text-white">{formatDate(oferta.createdAt)}</span>
            <div className="flex gap-1">
              <button
                onClick={() => handleCopy(oferta.titulo, 'title')}
                className="p-1 hover:bg-gray-700 rounded transition-colors focus-ring"
                title="Copiar título"
              >
                {copiedField === 'title' ? (
                  <Check size={14} className="text-green-400" />
                ) : (
                  <Copy size={14} className="text-gray-400" />
                )}
              </button>
              <button
                onClick={() => handleCopy(oferta.texto, 'description')}
                className="p-1 hover:bg-gray-700 rounded transition-colors focus-ring"
                title="Copiar descrição"
              >
                {copiedField === 'description' ? (
                  <Check size={14} className="text-green-400" />
                ) : (
                  <MessageCircle size={14} className="text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Status:</span>
          {isEditing ? (
            <select
              value={editedOferta.status || 'ativa'}
              onChange={(e) => updateField('status', e.target.value)}
              className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-1 focus:outline-none focus:border-blue-500"
            >
              <option value="ativa">Ativa</option>
              <option value="pausada">Pausada</option>
              <option value="arquivada">Arquivada</option>
              <option value="teste">Teste</option>
            </select>
          ) : (
            <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getStatusColor(oferta.status)}`}>
              {oferta.status ? formatLabel(oferta.status) : 'Ativa'}
            </span>
          )}
        </div>

        {/* Fonte de Tráfego */}
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Fonte de Tráfego:</span>
          {isEditing ? (
            <select
              value={editedOferta.plataforma || 'facebook_ads'}
              onChange={(e) => updateField('plataforma', e.target.value)}
              className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-1 focus:outline-none focus:border-blue-500"
            >
              <option value="facebook_ads">Facebook</option>
              <option value="google_ads">Google</option>
              <option value="instagram_ads">Instagram</option>
              <option value="tiktok_ads">TikTok</option>
              <option value="linkedin_ads">LinkedIn</option>
              <option value="twitter_ads">Twitter</option>
              <option value="pinterest_ads">Pinterest</option>
              <option value="snapchat_ads">Snapchat</option>
            </select>
          ) : (
            <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${oferta.plataforma === 'facebook_ads' ? 'bg-blue-600' :
              oferta.plataforma === 'google_ads' ? 'bg-red-600' :
                oferta.plataforma === 'instagram_ads' ? 'bg-pink-600' :
                  oferta.plataforma === 'tiktok_ads' ? 'bg-black' :
                    oferta.plataforma === 'linkedin_ads' ? 'bg-blue-700' :
                      oferta.plataforma === 'twitter_ads' ? 'bg-blue-400' :
                        oferta.plataforma === 'pinterest_ads' ? 'bg-red-500' :
                          oferta.plataforma === 'snapchat_ads' ? 'bg-yellow-500' : 'bg-gray-600'}`}>
              {oferta.plataforma ? formatBadge(oferta.plataforma.replace('_ads', '')) : 'Facebook'}
            </span>
          )}
        </div>

        {/* Produto */}
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Produto:</span>
          {isEditing ? (
            <select
              value={editedOferta.tipoOferta || 'ecommerce'}
              onChange={(e) => updateField('tipoOferta', e.target.value)}
              className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-1 focus:outline-none focus:border-blue-500"
            >
              <option value="ecommerce">E-commerce</option>
              <option value="lead_generation">Lead Generation</option>
              <option value="app_install">App Install</option>
              <option value="brand_awareness">Brand Awareness</option>
              <option value="video_views">Video Views</option>
              <option value="conversions">Conversions</option>
              <option value="traffic">Traffic</option>
            </select>
          ) : (
            <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${oferta.tipoOferta === 'ecommerce' ? 'bg-orange-600' :
              oferta.tipoOferta === 'lead_generation' ? 'bg-blue-600' :
                oferta.tipoOferta === 'app_install' ? 'bg-green-600' :
                  oferta.tipoOferta === 'brand_awareness' ? 'bg-purple-600' :
                    oferta.tipoOferta === 'video_views' ? 'bg-pink-600' :
                      oferta.tipoOferta === 'conversions' ? 'bg-red-600' :
                        oferta.tipoOferta === 'traffic' ? 'bg-gray-600' : 'bg-gray-600'}`}>
              {oferta.tipoOferta ? formatBadge(oferta.tipoOferta) : 'E-commerce'}
            </span>
          )}
        </div>

        {/* Métricas de Performance */}
        <div className="flex items-center justify-between">
          <span className="text-gray-300">ROI (%):</span>
          {isEditing ? (
            <input
              type="number"
              step="0.01"
              value={editedOferta.roi || 0}
              onChange={(e) => updateField('roi', parseFloat(e.target.value) || 0)}
              className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-1 focus:outline-none focus:border-blue-500 w-24"
            />
          ) : (
            <span className="text-white">{oferta.roi ? `${oferta.roi}%` : '0%'}</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-300">CPC (R$):</span>
          {isEditing ? (
            <input
              type="number"
              step="0.01"
              value={editedOferta.cpc || 0}
              onChange={(e) => updateField('cpc', parseFloat(e.target.value) || 0)}
              className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-1 focus:outline-none focus:border-blue-500 w-24"
            />
          ) : (
            <span className="text-white">{oferta.cpc ? `R$ ${oferta.cpc}` : 'R$ 0'}</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-300">CTR (%):</span>
          {isEditing ? (
            <input
              type="number"
              step="0.01"
              value={editedOferta.ctr || 0}
              onChange={(e) => updateField('ctr', parseFloat(e.target.value) || 0)}
              className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-1 focus:outline-none focus:border-blue-500 w-24"
            />
          ) : (
            <span className="text-white">{oferta.ctr ? `${oferta.ctr}%` : '0%'}</span>
          )}
        </div>

      </div>

      {/* Links e ações */}
      <div className="pt-4 border-t border-gray-700">
        <div className="space-y-3">
          {/* Links da oferta */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Links da Oferta:</h3>
            {isEditing ? (
              <div className="space-y-2">
                {(editedOferta.links || []).map((link, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => {
                        const newLinks = [...(editedOferta.links || [])];
                        newLinks[index] = e.target.value;
                        updateField('links', newLinks);
                      }}
                      className="flex-1 bg-gray-800 text-white border border-gray-600 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                      placeholder="URL do link"
                    />
                    <button
                      onClick={() => {
                        const newLinks = editedOferta.links?.filter((_, i) => i !== index) || [];
                        updateField('links', newLinks);
                      }}
                      className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                      title="Remover link"
                    >
                      <X size={14} className="text-white" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newLinks = [...(editedOferta.links || []), ''];
                    updateField('links', newLinks);
                  }}
                  className="w-full p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-gray-300"
                >
                  + Adicionar Link
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {oferta.links && oferta.links.length > 0 ? (
                  oferta.links.map((link, index) => (
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-blue-400 hover:text-blue-300 focus-ring"
                    >
                      <ExternalLink size={16} />
                      <span>Link {index + 1}</span>
                    </a>
                  ))
                ) : (
                  <span className="text-gray-500">Nenhum link adicionado</span>
                )}
              </div>
            )}
          </div>

          {/* VSL */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">VSL:</h3>
            {isEditing ? (
              <input
                type="url"
                value={editedOferta.vsl || ''}
                onChange={(e) => updateField('vsl', e.target.value)}
                className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                placeholder="URL do VSL"
              />
            ) : (
              oferta.vsl ? (
                <a
                  href={oferta.vsl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-purple-800 hover:bg-purple-700 rounded-lg transition-colors text-white focus-ring"
                >
                  <ExternalLink size={16} />
                  <span>Assistir VSL</span>
                </a>
              ) : (
                <span className="text-gray-500">Nenhum VSL adicionado</span>
              )
            )}
          </div>

          {/* Métricas */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Métricas:</h3>
            {isEditing ? (
              <textarea
                value={editedOferta.metricas || ''}
                onChange={(e) => updateField('metricas', e.target.value)}
                className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg p-2 focus:outline-none focus:border-blue-500 resize-none"
                rows={3}
                placeholder="Informações sobre métricas da oferta"
              />
            ) : (
              oferta.metricas ? (
                <div className="p-3 bg-gray-800 rounded-lg">
                  <span className="text-gray-300">{oferta.metricas}</span>
                </div>
              ) : (
                <span className="text-gray-500">Nenhuma métrica adicionada</span>
              )
            )}
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