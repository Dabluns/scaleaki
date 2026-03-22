import { createAdmin } from '../src/services/adminService';

async function main() {
    try {
        console.log('🔐 Criando novo administrador...\n');

        const admin = await createAdmin({
            name: 'Admin ScaleAki',
            email: 'admin@scaleaki.com',
            password: 'Admin@2026!Secure',
        });

        console.log('✅ Administrador criado com sucesso!');
        console.log('\n📋 Credenciais de acesso:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📧 Email:    ${admin.email}`);
        console.log(`🔑 Senha:    Admin@2026!Secure`);
        console.log(`👤 Nome:     ${admin.name}`);
        console.log(`🆔 ID:       ${admin.id}`);
        console.log(`📊 Plano:    ${admin.plan}`);
        console.log(`⚡ Role:     ${admin.role}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('💡 Use essas credenciais para fazer login no sistema.');
        console.log('🌐 URL: http://localhost:3001/auth\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao criar administrador:', error);
        process.exit(1);
    }
}

main();
