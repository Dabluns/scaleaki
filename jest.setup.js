// Configuração de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-with-minimum-32-characters-for-security';
process.env.PORT = '3001';
process.env.HOST = 'localhost';
process.env.DATABASE_URL = 'postgresql://test_user:test_pass@localhost:5432/test_db';
process.env.LOG_LEVEL = 'error'; // Reduzir logs durante testes 