import { createAdmin } from '../services/adminService';
import prisma from '../config/database';
import logger from '../config/logger';

async function createFirstAdmin() {
  try {
    // Verificar se já existe algum administrador
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' }
    });

    if (existingAdmin) {
      console.log('❌ Já existe um administrador no sistema');
      console.log(`Email: ${existingAdmin.email}`);
      return;
    }

    // Dados do primeiro administrador
    const adminData = {
      name: 'Administrador Principal',
      email: 'admin@scaleaki.com',
      password: 'AdminScaleaki!2024'
    };

    console.log('🚀 Criando primeiro administrador...');
    console.log(`Nome: ${adminData.name}`);
    console.log(`Email: ${adminData.email}`);
    console.log(`Senha: ${adminData.password}`);

    const admin = await createAdmin(adminData);

    console.log('✅ Administrador criado com sucesso!');
    console.log(`ID: ${admin.id}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log(`Status: ${admin.isActive ? 'Ativo' : 'Inativo'}`);

    logger.info('First admin created successfully', { 
      adminId: admin.id, 
      adminEmail: admin.email 
    });

  } catch (error) {
    console.error('❌ Erro ao criar administrador:', error);
    logger.error('Error creating first admin', { 
      error: error instanceof Error ? error.message : String(error) 
    });
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
createFirstAdmin(); 