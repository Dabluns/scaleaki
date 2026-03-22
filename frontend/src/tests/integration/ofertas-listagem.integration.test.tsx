import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { NichoContext } from '@/context/NichoContext';
import { OfertaContext } from '@/context/OfertaContext';
import OfertasPorNichoPage from '@/app/oferta/[nicho]/page';
import React from 'react';

jest.mock('next/navigation', () => ({
  useParams: () => ({ nicho: 'emagrecimento' })
}));

// Removido uso de NichoProvider e OfertaProvider não utilizados

const mockNicho = { id: '1', nome: 'Emagrecimento', slug: 'emagrecimento', icone: 'Heart' };
const mockOferta = {
  id: 'oferta1',
  titulo: 'Segredos do Chá de Boldo',
  imagem: 'https://img.com/boldo.jpg',
  texto: 'Descubra como o chá de boldo pode ajudar no emagrecimento de forma natural e saudável.',
  nichoId: '1',
  linguagem: 'pt-BR',
  links: ['https://facebook.com/ads/boldo'],
  metricas: '23',
  vsl: 'https://vimeo.com/vslboldo',
  data: '2024-07-01'
};

const customWrapper = ({ children }: React.PropsWithChildren) => (
  <NichoContext.Provider value={{ nichos: [mockNicho], loading: false, erro: '', fetchNichos: async () => {}, addNicho: async () => true, editNicho: async () => true, removeNicho: async () => true }}>
    <OfertaContext.Provider value={{ ofertas: [mockOferta], carregarOfertas: async () => {}, criarOferta: async () => {}, editarOferta: async () => {}, removerOferta: async () => {} }}>
      {children}
    </OfertaContext.Provider>
  </NichoContext.Provider>
);

describe('Listagem de Ofertas por Nicho', () => {
  it('exibe mensagem se não houver ofertas', async () => {
    const emptyWrapper = ({ children }: React.PropsWithChildren) => (
      <NichoContext.Provider value={{ nichos: [mockNicho], loading: false, erro: '', fetchNichos: async () => {}, addNicho: async () => true, editNicho: async () => true, removeNicho: async () => true }}>
        <OfertaContext.Provider value={{ ofertas: [], carregarOfertas: async () => {}, criarOferta: async () => {}, editarOferta: async () => {}, removerOferta: async () => {} }}>
          {children}
        </OfertaContext.Provider>
      </NichoContext.Provider>
    );
    render(<OfertasPorNichoPage />, { wrapper: emptyWrapper });
    await waitFor(() => expect(screen.getByText(/Nenhuma oferta cadastrada/)).toBeInTheDocument());
  });

  it('exibe oferta de emagrecimento e permite busca/filtro', async () => {
    render(<OfertasPorNichoPage />, { wrapper: customWrapper });
    expect(screen.getByText('Segredos do Chá de Boldo')).toBeInTheDocument();
    // Deve encontrar tanto no título quanto no texto
    expect(screen.getAllByText(/chá de boldo/i).length).toBeGreaterThan(0);
    expect(screen.getByText('pt-BR')).toBeInTheDocument();
    expect(screen.getByText('Anúncios: 23')).toBeInTheDocument();
    expect(screen.getByText('30/06/2024')).toBeInTheDocument();
    // Busca por palavra-chave
    fireEvent.change(screen.getByPlaceholderText('Buscar por palavra-chave...'), { target: { value: 'boldo' } });
    expect(screen.getByText('Segredos do Chá de Boldo')).toBeInTheDocument();
  });
}); 