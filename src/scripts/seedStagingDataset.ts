import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import logger from '../config/logger';

const DEFAULT_PASSWORD = 'SenhaForte!123';

const sampleUsers = [
  {
    name: 'Admin Staging',
    email: 'admin@staging.local',
    role: 'admin' as const,
    plan: 'enterprise' as const,
    status: 'active',
  },
  {
    name: 'Cliente Mensal',
    email: 'mensal@staging.local',
    role: 'user' as const,
    plan: 'basic' as const,
    status: 'active',
  },
  {
    name: 'Cliente Trimestral',
    email: 'trimestral@staging.local',
    role: 'user' as const,
    plan: 'premium' as const,
    status: 'active',
  },
];

async function upsertUser(sample: typeof sampleUsers[number], hashedPassword: string) {
  const user = await prisma.user.upsert({
    where: { email: sample.email },
    update: {
      name: sample.name,
      role: sample.role,
      plan: sample.plan,
      isActive: true,
      emailConfirmed: true,
    },
    create: {
      name: sample.name,
      email: sample.email,
      password: hashedPassword,
      role: sample.role,
      plan: sample.plan,
      isActive: true,
      emailConfirmed: true,
    },
  });

  // Criar assinatura apenas para planos pagos
  if (sample.plan === 'basic' || sample.plan === 'premium' || sample.plan === 'enterprise') {
    await prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        plan: sample.plan,
        status: sample.status === 'active' ? 'active' : 'trial',
        amount: sample.plan === 'enterprise' ? 97400 : sample.plan === 'premium' ? 27100 : 9700,
        currency: 'BRL',
        startDate: new Date(),
        endDate: sample.plan === 'basic' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        isRecurring: true,
        autoRenew: true,
      },
      update: {
        plan: sample.plan,
        status: sample.status === 'active' ? 'active' : 'trial',
      },
    });

    await prisma.payment.create({
      data: {
        userId: user.id,
        amount: sample.plan === 'enterprise' ? 97400 : sample.plan === 'premium' ? 27100 : 9700,
        currency: 'BRL',
        status: 'paid',
        paymentMethod: 'credit_card',
        description: `Seed ${sample.plan}`,
        paidAt: new Date(),
      },
    });
  }
}

async function main() {
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  for (const sample of sampleUsers) {
    await upsertUser(sample, hashedPassword);
  }

  logger.info('Seed de staging concluído', {
    users: sampleUsers.length,
    defaultPassword: DEFAULT_PASSWORD,
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error('Erro ao executar seed de staging', { error });
    process.exit(1);
  });

