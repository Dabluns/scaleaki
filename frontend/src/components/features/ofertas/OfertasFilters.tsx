"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Search, Filter, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface OfertasFiltersProps {
  onFiltersChange: (filters: any) => void;
  loading?: boolean;
  nichos?: any[];
}

export function OfertasFilters({ onFiltersChange, loading = false }: OfertasFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlataforma, setSelectedPlataforma] = useState<string>('');
  const [selectedTipo, setSelectedTipo] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const plataformas = [
    { value: 'meta_ads', label: 'Meta Ads', icon: '🅼' },
    { value: 'google_ads', label: 'Google Ads', icon: '🔍' },
    { value: 'tiktok_ads', label: 'TikTok Ads', icon: '🎵' },
    { value: 'linkedin_ads', label: 'LinkedIn Ads', icon: '💼' },
    { value: 'twitter_ads', label: 'Twitter Ads', icon: '🐦' },
    { value: 'pinterest_ads', label: 'Pinterest Ads', icon: '📌' },
    { value: 'snapchat_ads', label: 'Snapchat Ads', icon: '👻' }
  ];

  const tipos = [
  { value: 'ecommerce', label: 'E-commerce', icon: '🛒' },
    { value: 'lead_generation', label: 'Lead Generation', icon: '📞' },
    { value: 'app_install', label: 'App Install', icon: '📱' },
  { value: 'brand_awareness', label: 'Brand Awareness', icon: '🎯' },
    { value: 'video_views', label: 'Video Views', icon: '🎬' },
    { value: 'conversions', label: 'Conversions', icon: '💰' },
    { value: 'traffic', label: 'Traffic', icon: '🚗' }
];

  const status = [
    { value: 'ativa', label: 'Ativa', icon: '✅' },
  { value: 'pausada', label: 'Pausada', icon: '⏸️' },
  { value: 'arquivada', label: 'Arquivada', icon: '📁' },
    { value: 'teste', label: 'Teste', icon: '🧪' }
  ];

  // Memoize filters object
  const filters = useMemo(() => ({
    search: debouncedSearchTerm,
    plataforma: selectedPlataforma,
    tipoOferta: selectedTipo,
    status: selectedStatus
  }), [debouncedSearchTerm, selectedPlataforma, selectedTipo, selectedStatus]);

  // Update active filters
  useEffect(() => {
    const active: string[] = [];
    if (debouncedSearchTerm) active.push(`Busca: "${debouncedSearchTerm}"`);
    if (selectedPlataforma) {
      const plataforma = plataformas.find(p => p.value === selectedPlataforma);
      active.push(`Plataforma: ${plataforma?.label}`);
    }
    if (selectedTipo) {
      const tipo = tipos.find(t => t.value === selectedTipo);
      active.push(`Tipo: ${tipo?.label}`);
    }
    if (selectedStatus) {
      const statusItem = status.find(s => s.value === selectedStatus);
      active.push(`Status: ${statusItem?.label}`);
    }
    setActiveFilters(active);
  }, [debouncedSearchTerm, selectedPlataforma, selectedTipo, selectedStatus, plataformas, tipos, status]);

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedPlataforma('');
    setSelectedTipo('');
    setSelectedStatus('');
  }, []);

  const removeFilter = useCallback((filterIndex: number) => {
    const filter = activeFilters[filterIndex];
    if (filter.includes('Busca:')) setSearchTerm('');
    if (filter.includes('Plataforma:')) setSelectedPlataforma('');
    if (filter.includes('Tipo:')) setSelectedTipo('');
    if (filter.includes('Status:')) setSelectedStatus('');
  }, [activeFilters]);

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filtros
        </h3>
        {activeFilters.length > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Limpar todos
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Buscar ofertas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            disabled={loading}
          />
                     {loading && (
             <LoadingSpinner size={16} />
           )}
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter, index) => (
              <Badge
                key={index}
                className="bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer"
                onClick={() => removeFilter(index)}
              >
                {filter}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Filter Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Plataforma */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Plataforma
          </label>
          <select
            value={selectedPlataforma}
            onChange={(e) => setSelectedPlataforma(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">Todas as plataformas</option>
            {plataformas.map((plataforma) => (
              <option key={plataforma.value} value={plataforma.value}>
                {plataforma.icon} {plataforma.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Oferta
          </label>
          <select
            value={selectedTipo}
            onChange={(e) => setSelectedTipo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">Todos os tipos</option>
            {tipos.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.icon} {tipo.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">Todos os status</option>
            {status.map((statusItem) => (
              <option key={statusItem.value} value={statusItem.value}>
                {statusItem.icon} {statusItem.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Card>
  );
} 