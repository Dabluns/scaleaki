import { createOferta } from '../../services/ofertaService';
import prisma from '../../config/database';

jest.mock('../../config/database');
jest.mock('../../services/cacheService', () => ({
  del: jest.fn(),
  delPattern: jest.fn(),
  set: jest.fn(),
  get: jest.fn(),
}));
jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const mockPrisma = prisma as any;

describe('ofertaService.createOferta', () => {
  const validInput = {
    titulo: 'Oferta Teste',
    texto: 'Descrição da oferta',
    imagem: 'https://cdn.example.com/img.jpg',
    nichoId: 'nicho-1',
    plataforma: 'facebook_ads' as const,
    tipoOferta: 'ecommerce' as const,
    links: ['https://exemplo.com'],
    vsl: 'https://cdn.example.com/vsl.mp4',
    vslDescricao: 'Transcrição',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lança erro quando nicho não existe', async () => {
    mockPrisma.nicho.findUnique.mockResolvedValue(null);

    await expect(createOferta(validInput)).rejects.toThrow('Nicho não encontrado');
    expect(mockPrisma.oferta.create).not.toHaveBeenCalled();
  });

  it('cria oferta quando os dados são válidos', async () => {
    const now = new Date();
    mockPrisma.nicho.findUnique.mockResolvedValue({ id: 'nicho-1', nome: 'Beleza' });
    mockPrisma.oferta.create.mockResolvedValue({
      id: 'oferta-1',
      ...validInput,
      links: JSON.stringify(validInput.links),
      metricas: null,
      tags: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      nicho: {
        id: 'nicho-1',
        nome: 'Beleza',
        icone: '💄',
        descricao: 'Produtos de beleza',
      },
    });

    const oferta = await createOferta(validInput);

    expect(mockPrisma.nicho.findUnique).toHaveBeenCalledWith({ where: { id: validInput.nichoId } });
    expect(mockPrisma.oferta.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          titulo: validInput.titulo,
          links: JSON.stringify(validInput.links),
          vsl: validInput.vsl,
        }),
        include: { nicho: true },
      }),
    );
    expect(oferta.id).toBe('oferta-1');
    expect(oferta.links).toEqual(validInput.links);
  });
});

