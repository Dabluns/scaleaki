// Mock manual do Prisma Client para Jest
// Este arquivo será usado automaticamente pelo Jest ao mockar '../../config/database'

const prisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    findMany: jest.fn(),
  },
  subscription: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
  },
  payment: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  nicho: {
    findUnique: jest.fn(),
  },
  oferta: {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  query: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
    count: jest.fn(),
  },
};

export default prisma; 