'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Oferta {
  id: string;
  titulo: string;
  receita?: number;
  createdAt: Date;
  plataforma: string;
  tipoOferta: string;
  nichoId: string;
}

interface PerformanceChartProps {
  ofertas: Oferta[];
  metric: 'receita';
  periodo: '7d' | '30d' | '90d';
  className?: string;
}

const METRIC_CONFIG = {
  receita: {
    label: 'Receita (R$)',
    color: 'bg-emerald-500',
    format: (value: number) => `R$ ${value.toLocaleString('pt-BR')}`,
    icon: '💵'
  }
};

const PERIODO_CONFIG = {
  '7d': { label: '7 dias', days: 7 },
  '30d': { label: '30 dias', days: 30 },
  '90d': { label: '90 dias', days: 90 }
};

export function PerformanceChart({ ofertas, metric, periodo, className = '' }: PerformanceChartProps) {
  const [selectedPlataforma, setSelectedPlataforma] = useState<string>('todas');
  const [selectedTipo, setSelectedTipo] = useState<string>('todos');

  const config = METRIC_CONFIG[metric];
  const periodoConfig = PERIODO_CONFIG[periodo];

  // Filtrar ofertas por período
  const ofertasFiltradas = useMemo(() => {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - periodoConfig.days);

    return ofertas.filter(oferta => {
      const dataOferta = new Date(oferta.createdAt);
      const passaFiltroData = dataOferta >= dataLimite;
      const passaFiltroPlataforma = selectedPlataforma === 'todas' || oferta.plataforma === selectedPlataforma;
      const passaFiltroTipo = selectedTipo === 'todos' || oferta.tipoOferta === selectedTipo;

      return passaFiltroData && passaFiltroPlataforma && passaFiltroTipo;
    });
  }, [ofertas, periodoConfig.days, selectedPlataforma, selectedTipo]);

  // Calcular estatísticas
  const estatisticas = useMemo(() => {
    if (ofertasFiltradas.length === 0) {
      return {
        media: 0,
        maximo: 0,
        minimo: 0,
        total: 0,
        count: 0
      };
    }

    const valores = ofertasFiltradas
      .map(o => o[metric])
      .filter(val => val !== undefined && val !== null) as number[];

    if (valores.length === 0) {
      return {
        media: 0,
        maximo: 0,
        minimo: 0,
        total: 0,
        count: 0
      };
    }

    const total = valores.reduce((sum, val) => sum + val, 0);
    const media = total / valores.length;
    const maximo = Math.max(...valores);
    const minimo = Math.min(...valores);

    return {
      media,
      maximo,
      minimo,
      total,
      count: valores.length
    };
  }, [ofertasFiltradas, metric]);

  // Gerar dados para o gráfico de barras
  const dadosGrafico = useMemo(() => {
    const grupos = new Map<string, number[]>();

    ofertasFiltradas.forEach(oferta => {
      const data = new Date(oferta.createdAt).toLocaleDateString('pt-BR', {
        month: 'short',
        day: 'numeric'
      });

      if (!grupos.has(data)) {
        grupos.set(data, []);
      }

      const valor = oferta[metric];
      if (valor !== undefined && valor !== null) {
        grupos.get(data)!.push(valor);
      }
    });

    return Array.from(grupos.entries())
      .map(([data, valores]) => ({
        data,
        media: valores.reduce((sum, val) => sum + val, 0) / valores.length,
        count: valores.length
      }))
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
      .slice(-10); // Últimos 10 pontos
  }, [ofertasFiltradas, metric]);

  // Calcular altura máxima para o gráfico
  const maxValor = Math.max(...dadosGrafico.map(d => d.media), 1);

  // Obter plataformas e tipos únicos
  const plataformas = useMemo(() => {
    const unicas = [...new Set(ofertas.map(o => o.plataforma))];
    return ['todas', ...unicas];
  }, [ofertas]);

  const tipos = useMemo(() => {
    const unicos = [...new Set(ofertas.map(o => o.tipoOferta))];
    return ['todos', ...unicos];
  }, [ofertas]);

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {config.icon} {config.label}
          </h3>
          <p className="text-sm text-gray-600">
            Últimos {periodoConfig.label} • {ofertasFiltradas.length} ofertas
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedPlataforma}
            onChange={(e) => setSelectedPlataforma(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {plataformas.map(plataforma => (
              <option key={plataforma} value={plataforma}>
                {plataforma === 'todas' ? 'Todas as plataformas' : plataforma.replace('_', ' ')}
              </option>
            ))}
          </select>
          <select
            value={selectedTipo}
            onChange={(e) => setSelectedTipo(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {tipos.map(tipo => (
              <option key={tipo} value={tipo}>
                {tipo === 'todos' ? 'Todos os tipos' : tipo.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {config.format(estatisticas.media)}
          </div>
          <div className="text-xs text-gray-600">Média</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {config.format(estatisticas.maximo)}
          </div>
          <div className="text-xs text-gray-600">Máximo</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {config.format(estatisticas.minimo)}
          </div>
          <div className="text-xs text-gray-600">Mínimo</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {config.format(estatisticas.total)}
          </div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
      </div>

      {/* Gráfico */}
      {dadosGrafico.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-end justify-between h-32 gap-2">
            {dadosGrafico.map((dado, index) => (
              <div key={dado.data} className="flex-1 flex flex-col items-center">
                <div className="relative w-full">
                  <div
                    className={`${config.color} rounded-t transition-all duration-300 hover:opacity-80`}
                    style={{
                      height: `${(dado.media / maxValor) * 100}%`,
                      minHeight: '4px'
                    }}
                    title={`${dado.data}: ${config.format(dado.media)} (${dado.count} ofertas)`}
                  />
                </div>
                <div className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-left">
                  {dado.data}
                </div>
              </div>
            ))}
          </div>
          
          {/* Legenda */}
          <div className="text-center text-xs text-gray-500">
            Eixo Y: {config.label} • Eixo X: Data
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <p>Nenhum dado disponível para o período selecionado</p>
        </div>
      )}

      {/* Resumo */}
      <div className="mt-6 pt-4 border-t">
        <div className="text-sm text-gray-600">
          <strong>Resumo:</strong> {estatisticas.count} ofertas analisadas com {config.label.toLowerCase()} 
          variando de {config.format(estatisticas.minimo)} a {config.format(estatisticas.maximo)}.
          {estatisticas.media > 0 && (
            <span className="ml-2">
              Média de {config.format(estatisticas.media)} por oferta.
            </span>
          )}
        </div>
      </div>
    </Card>
  );
} 