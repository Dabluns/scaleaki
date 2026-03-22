"use client";

import { useState, useEffect } from 'react';
import { useOfertaContext } from '@/context/OfertaContext';
import { useNichos } from '@/context/NichoContext';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { FavoritoButton } from '@/components/features/ofertas/FavoritoButton';
import { OfertaDetailModal } from '@/components/features/ofertas/OfertaDetailModal';
import { OfertaEditModal } from '@/components/features/ofertas/OfertaEditModal';
import { 
  Clock, 
  Eye, 
  Heart, 
  TrendingUp, 
  Calendar, 
  Filter, 
  Search,
  Activity,
  Star,
  Target,
  DollarSign
} from 'lucide-react';
import { Oferta } from '@/types/oferta';

interface HistoricoItem {
  id: string;
  tipo: 'visualizacao' | 'favorito' | 'interacao' | 'busca';
  oferta?: Oferta;
  timestamp: Date;
  descricao: string;
  dados?: any;
}

export default function HistoricoPage() {
  const { ofertas, loading, editarOferta, removerOferta } = useOfertaContext();
  const { nichos } = useNichos();
  const { user } = useAuth();
  
  // Estados
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [selectedOferta, setSelectedOferta] = useState<Oferta | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'visualizacao' | 'favorito' | 'interacao' | 'busca'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [periodo, setPeriodo] = useState<'7dias' | '30dias' | '90dias' | 'todos'>('30dias');

  // Carregar histórico do localStorage
  useEffect(() => {
    if (user?.id) {
      const storedHistorico = localStorage.getItem(`historico_${user.id}`);
      if (storedHistorico) {
        try {
          const historicoData = JSON.parse(storedHistorico);
          const historicoItems: HistoricoItem[] = historicoData.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          }));
          setHistorico(historicoItems);
        } catch (error) {
          console.error('Erro ao carregar histórico:', error);
          setHistorico([]);
        }
      } else {
        // Criar histórico inicial com dados simulados
        const historicoInicial = gerarHistoricoInicial();
        setHistorico(historicoInicial);
        localStorage.setItem(`historico_${user.id}`, JSON.stringify(historicoInicial));
      }
    }
  }, [user?.id, ofertas]);

  const gerarHistoricoInicial = (): HistoricoItem[] => {
    if (!ofertas.length) return [];
    
    const tipos = ['visualizacao', 'favorito', 'interacao', 'busca'] as const;
    const historico: HistoricoItem[] = [];
    
    // Gerar histórico dos últimos 30 dias
    for (let i = 0; i < 20; i++) {
      const oferta = ofertas[Math.floor(Math.random() * ofertas.length)];
      const tipo = tipos[Math.floor(Math.random() * tipos.length)];
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 30));
      
      const descricoes = {
        visualizacao: `Visualizou a oferta "${oferta.titulo}"`,
        favorito: `Adicionou "${oferta.titulo}" aos favoritos`,
        interacao: `Interagiu com a oferta "${oferta.titulo}"`,
        busca: `Buscou por "${oferta.titulo.split(' ').slice(0, 2).join(' ')}"`
      };
      
      historico.push({
        id: `hist_${i}`,
        tipo,
        oferta,
        timestamp,
        descricao: descricoes[tipo],
        dados: {
          tempoVisualizacao: tipo === 'visualizacao' ? Math.floor(Math.random() * 300) + 30 : undefined,
          termosBusca: tipo === 'busca' ? oferta.titulo.split(' ').slice(0, 2) : undefined
        }
      });
    }
    
    return historico.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  // Filtrar histórico
  const historicoFiltrado = historico
    .filter(item => {
      // Filtro por tipo
      if (filtroTipo !== 'todos' && item.tipo !== filtroTipo) return false;
      
      // Filtro por período
      const agora = new Date();
      const diasAtras = {
        '7dias': 7,
        '30dias': 30,
        '90dias': 90,
        'todos': Infinity
      };
      
      const limiteDias = diasAtras[periodo];
      if (limiteDias !== Infinity) {
        const limiteData = new Date();
        limiteData.setDate(limiteData.getDate() - limiteDias);
        if (item.timestamp < limiteData) return false;
      }
      
      // Filtro por busca
      if (searchTerm) {
        const termo = searchTerm.toLowerCase();
        return (
          item.descricao.toLowerCase().includes(termo) ||
          item.oferta?.titulo.toLowerCase().includes(termo) ||
          item.oferta?.texto.toLowerCase().includes(termo)
        );
      }
      
      return true;
    })
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const handleViewOferta = (oferta: Oferta) => {
    setSelectedOferta(oferta);
    setIsModalOpen(true);
  };

  const handleEditOferta = (oferta: Oferta) => {
    setSelectedOferta(oferta);
    setIsEditModalOpen(true);
  };

  const handleDeleteOferta = async (ofertaId: string) => {
    await removerOferta(ofertaId);
  };

  const handleSaveOferta = async (oferta: Oferta) => {
    await editarOferta(oferta);
    setIsEditModalOpen(false);
    setSelectedOferta(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedOferta(null);
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'visualizacao': return <Eye className="w-4 h-4" />;
      case 'favorito': return <Heart className="w-4 h-4" />;
      case 'interacao': return <Activity className="w-4 h-4" />;
      case 'busca': return <Search className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'visualizacao': return 'bg-blue-100 text-blue-700';
      case 'favorito': return 'bg-red-100 text-red-700';
      case 'interacao': return 'bg-green-100 text-green-700';
      case 'busca': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const agora = new Date();
    const diffMs = agora.getTime() - timestamp.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutos = Math.floor(diffMs / (1000 * 60));

    if (diffDias > 0) {
      return `${diffDias} dia${diffDias > 1 ? 's' : ''} atrás`;
    } else if (diffHoras > 0) {
      return `${diffHoras} hora${diffHoras > 1 ? 's' : ''} atrás`;
    } else if (diffMinutos > 0) {
      return `${diffMinutos} minuto${diffMinutos > 1 ? 's' : ''} atrás`;
    } else {
      return 'Agora mesmo';
    }
  };

  const getNichoName = (nichoId: string) => {
    const nicho = nichos.find(n => n.id === nichoId);
    return nicho?.nome || 'Nicho não encontrado';
  };

  const getBadgeColor = (type: string, value: string) => {
    const colors: Record<string, Record<string, string>> = {
      linguagem: {
        'pt-BR': 'bg-amber-600',
        'en-US': 'bg-blue-600',
        'es-ES': 'bg-green-600',
        'fr-FR': 'bg-purple-600',
        'de-DE': 'bg-gray-600'
      },
      plataforma: {
        'facebook_ads': 'bg-blue-600',
        'google_ads': 'bg-red-600',
        'instagram_ads': 'bg-pink-600',
        'tiktok_ads': 'bg-black',
        'linkedin_ads': 'bg-blue-700',
        'twitter_ads': 'bg-blue-400',
        'pinterest_ads': 'bg-red-500',
        'snapchat_ads': 'bg-yellow-500'
      },
      status: {
        'ativa': 'bg-green-600',
        'pausada': 'bg-yellow-600',
        'arquivada': 'bg-gray-600',
        'teste': 'bg-purple-600'
      }
    };

    return colors[type]?.[value] || 'bg-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-8 h-8 text-blue-500" />
                  Histórico de Atividades
                </h1>
                <p className="text-gray-600 mt-1">
                  {historicoFiltrado.length} atividade{historicoFiltrado.length !== 1 ? 's' : ''} encontrada{historicoFiltrado.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              {/* Filtros */}
              <div className="flex items-center gap-2">
                <select
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="7dias">Últimos 7 dias</option>
                  <option value="30dias">Últimos 30 dias</option>
                  <option value="90dias">Últimos 90 dias</option>
                  <option value="todos">Todo o período</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros e Busca */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar no histórico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Filtro por tipo */}
          <div className="flex gap-2">
            <Button
              variant={filtroTipo === 'todos' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFiltroTipo('todos')}
            >
              Todos
            </Button>
            <Button
              variant={filtroTipo === 'visualizacao' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFiltroTipo('visualizacao')}
            >
              <Eye className="w-4 h-4 mr-1" />
              Visualizações
            </Button>
            <Button
              variant={filtroTipo === 'favorito' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFiltroTipo('favorito')}
            >
              <Heart className="w-4 h-4 mr-1" />
              Favoritos
            </Button>
            <Button
              variant={filtroTipo === 'interacao' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFiltroTipo('interacao')}
            >
              <Activity className="w-4 h-4 mr-1" />
              Interações
            </Button>
          </div>
        </div>

        {/* Lista de Histórico */}
        {historicoFiltrado.length > 0 ? (
          <div className="space-y-4">
            {historicoFiltrado.map((item) => (
              <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Ícone do tipo */}
                  <div className={`p-2 rounded-full ${getTipoColor(item.tipo)}`}>
                    {getTipoIcon(item.tipo)}
                  </div>
                  
                  {/* Conteúdo */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900">
                        {item.descricao}
                      </p>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(item.timestamp)}
                      </span>
                    </div>
                    
                    {/* Dados adicionais */}
                    {item.dados && (
                      <div className="text-xs text-gray-600 mb-2">
                        {item.dados.tempoVisualizacao && (
                          <span className="mr-3">
                            ⏱️ {item.dados.tempoVisualizacao}s de visualização
                          </span>
                        )}
                        {item.dados.termosBusca && (
                          <span>
                            🔍 Termos: {item.dados.termosBusca.join(', ')}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Card da oferta se disponível */}
                    {item.oferta && (
                      <div className="bg-gray-50 rounded-lg p-3 mt-3">
                        <div className="flex items-center gap-3">
                          {/* Imagem */}
                          <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            {item.oferta.imagem ? (
                              <img 
                                src={item.oferta.imagem} 
                                alt={item.oferta.titulo}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                💰
                              </div>
                            )}
                          </div>
                          
                          {/* Informações */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm truncate">
                              {item.oferta.titulo}
                            </h4>
                            <p className="text-xs text-gray-600 truncate">
                              {item.oferta.texto}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getBadgeColor('linguagem', item.oferta.linguagem)}>
                                {item.oferta.linguagem === 'pt_BR' ? 'PT' : item.oferta.linguagem}
                              </Badge>
                              {item.oferta.plataforma && (
                                <Badge className={getBadgeColor('plataforma', item.oferta.plataforma)}>
                                  {item.oferta.plataforma.replace('_ads', '').toUpperCase()}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {/* Botões de ação */}
                          <div className="flex items-center gap-1">
                            <FavoritoButton 
                              oferta={item.oferta}
                              size="sm"
                              variant="secondary"
                              className="bg-white/90 hover:bg-white"
                            />
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleViewOferta(item.oferta!)}
                              className="bg-white/90 hover:bg-white"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || filtroTipo !== 'todos' ? 'Nenhuma atividade encontrada' : 'Nenhuma atividade ainda'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filtroTipo !== 'todos' 
                ? 'Tente ajustar os filtros ou termos de busca'
                : 'Suas atividades aparecerão aqui conforme você usar o sistema'
              }
            </p>
            {!searchTerm && filtroTipo === 'todos' && (
              <Button
                onClick={() => window.location.href = '/ofertas'}
                variant="primary"
              >
                Explorar Ofertas
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* Modais */}
      {selectedOferta && isModalOpen && (
        <OfertaDetailModal
          oferta={selectedOferta}
          nicho={nichos.find(n => n.id === selectedOferta.nichoId)}
          onClose={closeModal}
        />
      )}
      
      {selectedOferta && isEditModalOpen && user?.role === 'admin' && (
        <OfertaEditModal
          oferta={selectedOferta}
          nicho={nichos.find(n => n.id === selectedOferta.nichoId)}
          onClose={closeModal}
          onSave={handleSaveOferta}
          onDelete={handleDeleteOferta}
        />
      )}
    </div>
  );
} 