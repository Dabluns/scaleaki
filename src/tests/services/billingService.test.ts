import { generatePendingInvoices, suspendDelinquentAccounts } from '../../services/billingService';
import prisma from '../../config/database';

jest.mock('../../config/database', () => require('../__mocks__/prisma').default);
jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const mockPrisma = prisma as any;

describe('billingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BILLING_GRACE_DAYS = '3';
  });

  it('gera cobrança pendente quando assinatura vence', async () => {
    const now = new Date('2024-02-10T00:00:00Z');
    mockPrisma.subscription.findMany.mockResolvedValue([
      {
        id: 'sub-1',
        userId: 'user-1',
        plan: 'basic',
        amount: 9700,
        startDate: new Date('2023-12-01T00:00:00Z'),
        endDate: new Date('2024-01-01T00:00:00Z'),
        autoRenew: true,
        isRecurring: true,
        status: 'active',
      },
    ]);
    mockPrisma.payment.findFirst.mockResolvedValue(null);
    mockPrisma.payment.create.mockResolvedValue({});

    const created = await generatePendingInvoices(now);

    expect(created).toBe(1);
    expect(mockPrisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subscriptionId: 'sub-1',
          status: 'pending',
        }),
      }),
    );
  });

  it('suspende assinaturas após período de tolerância', async () => {
    const now = new Date('2024-03-15T00:00:00Z');
    mockPrisma.subscription.findMany.mockResolvedValue([
      {
        id: 'sub-2',
        userId: 'user-2',
        plan: 'premium',
        status: 'active',
        startDate: new Date('2023-11-01T00:00:00Z'),
        endDate: new Date('2024-01-01T00:00:00Z'),
        autoRenew: true,
        isRecurring: true,
      },
    ]);
    mockPrisma.payment.findFirst.mockResolvedValue(null);
    mockPrisma.subscription.update.mockResolvedValue({});
    mockPrisma.user.update.mockResolvedValue({});

    const suspended = await suspendDelinquentAccounts(now);

    expect(suspended).toBe(1);
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sub-2' },
        data: expect.objectContaining({
          status: 'suspended',
        }),
      }),
    );
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-2' },
        data: expect.objectContaining({ plan: 'free', isActive: false }),
      }),
    );
  });
});

