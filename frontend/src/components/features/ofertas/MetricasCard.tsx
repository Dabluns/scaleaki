'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatLabel } from '@/lib/formatters';

interface MetricasOferta {
  receita?: number;
  alcance?: number;
  impressoes?: number;
  cliques?: number;
  gasto?: number;
}

interface Oferta {
  id: string;
  titulo: string;
  imagem?: string;
  texto: string;
  nichoId: string;
  nicho?: { nome: string };
  plataforma: string;
  tipoOferta: string;
  status: string;
  tags?: string[];
  linguagem: string;
  links: string[];
  metricas?: MetricasOferta;
  vsl?: string;
  receita?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MetricasCardProps {
  oferta: Oferta;
  showDetails?: boolean;
  className?: string;
}

const PLATAFORMA_ICONS: Record<string, string> = {
  facebook_ads: '📘',
  google_ads: '🔍',
  tiktok_ads: '🎵',
  instagram_ads: '📷',
  linkedin_ads: '💼',
  twitter_ads: '🐦',
  pinterest_ads: '📌',
  snapchat_ads: '👻',
};

const TIPO_ICONS: Record<string, string> = {
  ecommerce: '🛒',
  lead_generation: '📋',
  app_install: '📱',
  brand_awareness: '🎯',
  video_views: '🎬',
  conversions: '💰',
  traffic: '🚗',
};

const STATUS_COLORS: Record<string, string> = {
  ativa: 'green',
  pausada: 'yellow',
  arquivada: 'gray',
  teste: 'blue',
};

export function MetricasCard({ oferta, showDetails = false, className = '' }: MetricasCardProps) {
  const getMetricValue = (metric: keyof MetricasOferta) => {
    return oferta.metricas?.[metric] || (oferta as any)[metric] || 0;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString('pt-BR');
  };


  return (
    <Card className={`p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-text-primary text-sm line-clamp-2 mb-1">
            {oferta.titulo}
          </h4>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span>{PLATAFORMA_ICONS[oferta.plataforma] || '📱'} {formatLabel(oferta.plataforma)}</span>
            <span>•</span>
            <span>{TIPO_ICONS[oferta.tipoOferta] || '🎯'} {formatLabel(oferta.tipoOferta)}</span>
            {oferta.nicho && (
              <>
                <span>•</span>
                <span>📂 {oferta.nicho.nome}</span>
              </>
            )}
          </div>
        </div>
        <Badge color={STATUS_COLORS[oferta.status] as any} className="text-xs">
          {formatLabel(oferta.status)}
        </Badge>
      </div>

      {/* Métricas Principais - Removidas (apenas receita será exibida em outros componentes) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
      </div>

      {/* Métricas Detalhadas (quando showDetails = true) */}
      {showDetails && (
        <div className="border-t border-border pt-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {/* Receita */}
            <div>
              <div className="text-text-secondary">Receita</div>
              <div className="font-semibold text-success">
                {formatCurrency(getMetricValue('receita'))}
              </div>
            </div>

            {/* Alcance */}
            <div>
              <div className="text-text-secondary">Alcance</div>
              <div className="font-semibold text-text-primary">
                {formatNumber(getMetricValue('alcance'))}
              </div>
            </div>

            {/* Impressões */}
            <div>
              <div className="text-text-secondary">Impressões</div>
              <div className="font-semibold text-text-primary">
                {formatNumber(getMetricValue('impressoes'))}
              </div>
            </div>

            {/* Cliques */}
            <div>
              <div className="text-text-secondary">Cliques</div>
              <div className="font-semibold text-text-primary">
                {formatNumber(getMetricValue('cliques'))}
              </div>
            </div>

            {/* Gasto */}
            <div>
              <div className="text-text-secondary">Gasto</div>
              <div className="font-semibold text-error">
                {formatCurrency(getMetricValue('gasto'))}
              </div>
            </div>
          </div>

          {/* Tags */}
          {oferta.tags && oferta.tags.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-xs text-text-secondary mb-1">Tags</div>
              <div className="flex flex-wrap gap-1">
                {oferta.tags.map(tag => (
                  <Badge key={tag} color="gray" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-text-tertiary mt-3 pt-3 border-t border-border">
        <span>🌍 {oferta.linguagem}</span>
        <span>📅 {new Date(oferta.createdAt).toLocaleDateString('pt-BR')}</span>
      </div>
    </Card>
  );
} 