import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OfertaProvider } from '@/context/OfertaContext';
import { NichoProvider } from '@/context/NichoContext';
import AdminPage from '@/app/admin/page';
import DetalheOfertaPage from '@/app/oferta/[nicho]/[id]/page';
import React from 'react';
import { NichoContext } from '@/context/NichoContext';
import { OfertaContext } from '@/context/OfertaContext';

jest.mock('next/navigation', () => ({
  useParams: () => ({ nicho: 'emagrecimento', id: 'oferta1' })
}));

interface MockNicho { id: string; nome: string; slug: string; icone: string; }
interface MockOferta { id: string; titulo: string; imagem: string; texto: string; nichoId: string; linguagem: string; links: string[]; metricas?: string; vsl?: string; data: string; }
let nichos: MockNicho[] = [];
let ofertas: MockOferta[] = [];
let idCounter = 1;

global.fetch = jest.fn((url, options) => {
  // Nichos
  if (url === '/api/nichos' && (!options || options.method === 'GET')) {
    return Promise.resolve({ json: () => Promise.resolve(nichos), ok: true } as unknown as Response);
  }
  if (url === '/api/nichos' && options?.method === 'POST') {
    const body = JSON.parse((options.body as string) ?? '{}');
    const novo = { ...body, id: (idCounter++).toString() };
    nichos.push(novo);
    return Promise.resolve({ json: () => Promise.resolve(novo), ok: true } as unknown as Response);
  }
  if (url === '/api/nichos' && options?.method === 'PUT') {
    const body = JSON.parse((options.body as string) ?? '{}');
    nichos = nichos.map((n: MockNicho) => n.id === body.id ? { ...n, ...body } : n);
    return Promise.resolve({ json: () => Promise.resolve(body), ok: true } as unknown as Response);
  }
  if (url === '/api/nichos' && options?.method === 'DELETE') {
    const { id } = JSON.parse((options.body as string) ?? '{}');
    nichos = nichos.filter((n: MockNicho) => n.id !== id);
    return Promise.resolve({ json: () => Promise.resolve({ ok: true }), ok: true } as unknown as Response);
  }
  // Ofertas
  if (url === '/api/ofertas' && (!options || options.method === 'GET')) {
    return Promise.resolve({ json: () => Promise.resolve(ofertas), ok: true } as unknown as Response);
  }
  if (url === '/api/ofertas' && options?.method === 'POST') {
    const body = JSON.parse((options.body as string) ?? '{}');
    const nova = { ...body, id: (idCounter++).toString(), data: new Date().toISOString() };
    ofertas.push(nova);
    return Promise.resolve({ json: () => Promise.resolve(nova), ok: true } as unknown as Response);
  }
  if (url === '/api/ofertas' && options?.method === 'PUT') {
    const body = JSON.parse((options.body as string) ?? '{}');
    ofertas = ofertas.map((o: MockOferta) => o.id === body.id ? { ...o, ...body } : o);
    return Promise.resolve({ json: () => Promise.resolve(body), ok: true } as unknown as Response);
  }
  if (url === '/api/ofertas' && options?.method === 'DELETE') {
    const { id } = JSON.parse((options.body as string) ?? '{}');
    ofertas = ofertas.filter((o: MockOferta) => o.id !== id);
    return Promise.resolve({ json: () => Promise.resolve({ ok: true }), ok: true } as unknown as Response);
  }
  return Promise.resolve({ json: () => Promise.resolve({}), ok: false } as unknown as Response);
})

// Mock nichos e ofertas iniciais
const wrapper = ({ children }: React.PropsWithChildren) => (
  <NichoProvider>
    <OfertaProvider>{children}</OfertaProvider>
  </NichoProvider>
);

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

beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => 'mock-url');
  global.URL.revokeObjectURL = jest.fn();
});

describe('Integração CRUD de Ofertas', () => {
  beforeEach(() => { nichos = []; ofertas = []; idCounter = 1; });
  it('cria, edita e remove oferta e reflete na listagem', async () => {
    render(<AdminPage />, { wrapper });
    // Criar nicho
    fireEvent.change(screen.getByPlaceholderText('Nome do nicho'), { target: { value: 'Test Nicho' } });
    fireEvent.change(screen.getByPlaceholderText('Slug'), { target: { value: 'test-nicho' } });
    fireEvent.change(screen.getByPlaceholderText('Ícone (ex: Heart)'), { target: { value: 'Heart' } });
    fireEvent.click(screen.getByText('Adicionar'));
    await waitFor(() => expect(screen.getByText('Test Nicho')).toBeInTheDocument());
    // Criar oferta
    fireEvent.click(screen.getByText('Nova Oferta'));
    fireEvent.change(screen.getByPlaceholderText('Título'), { target: { value: 'Oferta Teste' } });
    fireEvent.change(screen.getByPlaceholderText('URL da imagem'), { target: { value: 'http://img.com/img.png' } });
    fireEvent.change(screen.getByPlaceholderText('Texto'), { target: { value: 'Texto da oferta' } });
    fireEvent.change(screen.getByPlaceholderText('Links (separados por vírgula)'), { target: { value: 'http://link.com' } });
    fireEvent.click(screen.getByText('Salvar'));
    // Se houver mais de uma oferta, seguir com a última
    await waitFor(() => expect(screen.getAllByText('Oferta Teste').length).toBeGreaterThan(0));
    // Editar oferta (pegar o último botão de editar)
    const editarBtns = screen.getAllByText('Editar');
    fireEvent.click(editarBtns[editarBtns.length - 1]);
    // Esperar os inputs de edição aparecerem e atuar sobre o último
    await waitFor(() => expect(screen.getAllByPlaceholderText('Título').length).toBeGreaterThan(0));
    const inputsTitulo = screen.getAllByPlaceholderText('Título');
    fireEvent.change(inputsTitulo[inputsTitulo.length - 1], { target: { value: 'Oferta Editada' } });
    const salvarBtns = screen.getAllByText('Salvar');
    fireEvent.click(salvarBtns[salvarBtns.length - 1]);
    await waitFor(() => expect(screen.getAllByText('Oferta Editada').length).toBeGreaterThan(0));
    // Remover oferta (pegar o último botão de remover)
    const removerBtns = screen.getAllByText('Remover');
    fireEvent.click(removerBtns[removerBtns.length - 1]);
    await waitFor(() => expect(screen.queryByText('Oferta Editada')).not.toBeInTheDocument());
  });
});

describe('Detalhe da Oferta - Funcionalidades do Usuário', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
  });
  it('favorita e desfavorita oferta', () => {
    render(<DetalheOfertaPage />, { wrapper: customWrapper });
    const btn = screen.getByText('Favoritar');
    fireEvent.click(btn);
    expect(screen.getByText('Salvo')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Salvo'));
    expect(screen.getByText('Favoritar')).toBeInTheDocument();
  });
  it('copia o texto da oferta', () => {
    Object.assign(navigator, { clipboard: { writeText: jest.fn() } });
    render(<DetalheOfertaPage />, { wrapper: customWrapper });
    fireEvent.click(screen.getByText('Copiar texto'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Descubra como o chá de boldo pode ajudar no emagrecimento de forma natural e saudável.');
  });
  it('faz download JSON e CSV', () => {
    const createElementSpy = jest.spyOn(document, 'createElement');
    render(<DetalheOfertaPage />, { wrapper: customWrapper });
    fireEvent.click(screen.getByText('Download JSON'));
    fireEvent.click(screen.getByText('Download CSV'));
    expect(createElementSpy).toHaveBeenCalledWith('a');
  });
  it('faz download da imagem', () => {
    const createElementSpy = jest.spyOn(document, 'createElement');
    render(<DetalheOfertaPage />, { wrapper: customWrapper });
    fireEvent.click(screen.getByText('Download Imagem'));
    expect(createElementSpy).toHaveBeenCalledWith('a');
  });
}); 