'use client';

import { OfertasFilters } from '@/components/features/ofertas/OfertasFilters';
import { useState } from 'react';

export default function TesteFiltrosPage() {
  const [filters, setFilters] = useState({});

  const handleFilterChange = (newFilters: any) => {
    console.log('Filtros alterados:', newFilters);
    setFilters(newFilters);
  };

  const nichosMock = [
    { id: '1', nome: 'E-commerce' },
    { id: '2', nome: 'Saúde' },
    { id: '3', nome: 'Educação' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Teste de Filtros Avançados</h1>
      
      <OfertasFilters 
        onFilterChange={handleFilterChange}
        nichos={nichosMock}
      />
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Filtros Ativos:</h2>
        <pre className="text-sm">{JSON.stringify(filters, null, 2)}</pre>
      </div>
    </div>
  );
} 