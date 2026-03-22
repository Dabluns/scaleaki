import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { hashPassword, validatePasswordStrength, register, login, checkPasswordExpiration } from '../../services/authService';
import authConfig from '../../config/auth';

// Mock do bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock do jwt
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

// Mock do módulo de database
jest.mock('../../config/database');

// Importar o mock após a definição
import prisma from '../../config/database';
const mockPrisma = prisma as any;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Configurar JWT_SECRET para testes
    process.env.JWT_SECRET = 'test-secret-key-with-minimum-32-characters-for-security';
  });

  describe('hashPassword', () => {
    it('deve hashar a senha corretamente', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = 'hashed_password_123';
      
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      
      const result = await hashPassword(password);
      
      expect(bcrypt.hash).toHaveBeenCalledWith(password, authConfig.SALT_ROUNDS);
      expect(result).toBe(hashedPassword);
    });

    it('deve lançar erro se bcrypt falhar', async () => {
      const password = 'TestPassword123!';
      
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hash failed'));
      
      await expect(hashPassword(password)).rejects.toThrow('Hash failed');
    });
  });

  describe('validatePasswordStrength', () => {
    it('deve aceitar senha forte válida', () => {
      const strongPasswords = [
        'TestPass123!',
        'MySecureP@ss1',
        'Complex#Pass2',
        'StrongP@ssw0rd!'
      ];

      strongPasswords.forEach(password => {
        expect(validatePasswordStrength(password)).toBe(true);
      });
    });

    it('deve rejeitar senhas fracas', () => {
      const weakPasswords = [
        'weak',                    // Muito curta
        'weakpass',                // Sem maiúsculas, números ou símbolos
        'WEAKPASS',                // Sem minúsculas, números ou símbolos
        'WeakPass',                // Sem números ou símbolos
        'weakpass123',             // Sem maiúsculas ou símbolos
        'WeakPass123',             // Sem símbolos
        'weak@pass',               // Sem maiúsculas ou números
        'WEAK@PASS',               // Sem minúsculas ou números
        'weak@123',                // Sem maiúsculas
        'WEAK@123'                 // Sem minúsculas
      ];

      weakPasswords.forEach(password => {
        expect(validatePasswordStrength(password)).toBe(false);
      });
    });

    it('deve rejeitar senha com menos de 8 caracteres', () => {
      expect(validatePasswordStrength('Test1!')).toBe(false);
    });
  });

  describe('register', () => {
    const validRegisterData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'TestPass123!'
    };

    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashed_password',
      role: 'user' as const,
      plan: 'free' as const,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockAuthPayload = {
      token: 'jwt_token_123',
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user' as const,
        plan: 'free' as const,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    it('deve registrar usuário com dados válidos', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (jwt.sign as jest.Mock).mockReturnValue('jwt_token_123');
      (mockPrisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await register(validRegisterData);

      expect(bcrypt.hash).toHaveBeenCalledWith('TestPass123!', 12);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'hashed_password',
          role: 'user',
          plan: 'free',
          isActive: true
        }
      });
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user-123', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      expect(result).toEqual(mockAuthPayload);
    });

    it('deve registrar usuário premium', async () => {
      const premiumData = { ...validRegisterData, plan: 'premium' as const };
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (jwt.sign as jest.Mock).mockReturnValue('jwt_token_123');
      (mockPrisma.user.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        plan: 'premium'
      });

      const result = await register(premiumData);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'hashed_password',
          role: 'user',
          plan: 'premium',
          isActive: true
        }
      });
      expect(result.user.plan).toBe('premium');
    });

    it('deve lançar erro se email já existir', async () => {
      (mockPrisma.user.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(register(validRegisterData)).rejects.toThrow('Database error');
    });
  });

  describe('login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'TestPass123!'
    };

    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashed_password',
      role: 'user' as const,
      plan: 'free' as const,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockAuthPayload = {
      token: 'jwt_token_123',
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user' as const,
        plan: 'free' as const,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    it('deve fazer login com credenciais válidas', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('jwt_token_123');

      const result = await login(validLoginData);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('TestPass123!', 'hashed_password');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user-123', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      expect(result).toEqual(mockAuthPayload);
    });

    it('deve lançar erro se usuário não existir', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(login(validLoginData)).rejects.toThrow('Credenciais inválidas.');
    });

    it('deve lançar erro se senha estiver incorreta', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(login(validLoginData)).rejects.toThrow('Credenciais inválidas.');
    });

    it('deve lançar erro se usuário estiver inativo', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(inactiveUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true); // Senha correta, mas usuário inativo

      await expect(login(validLoginData)).rejects.toThrow('Conta inativa.');
    });
  });

  describe('checkPasswordExpiration', () => {
    it('deve retornar true para senha expirada', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 91); // 91 dias atrás

      expect(checkPasswordExpiration(oldDate)).toBe(true);
    });

    it('deve retornar false para senha não expirada', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30); // 30 dias atrás

      expect(checkPasswordExpiration(recentDate)).toBe(false);
    });

    it('deve retornar false para senha exatamente no limite', () => {
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - 90); // Exatamente 90 dias atrás

      expect(checkPasswordExpiration(limitDate)).toBe(false);
    });
  });
}); 