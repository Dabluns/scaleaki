/**
 * Script de Reset — Deletar TODAS as ofertas do banco
 * 
 * Depois de executar, o bot vai reimportar tudo do Google Drive
 * com as novas URLs do Drive (sem Supabase Storage).
 * 
 * Uso: npx tsx scripts/reset_ofertas.ts
 */

import prisma from '../src/config/database';

async function main() {
  console.log('🔍 Testando conexão com o banco de dados...\n');

  try {
    // Testar conexão
    await prisma.$connect();
    console.log('✅ Conexão com o banco OK!\n');
  } catch (err: any) {
    console.error('❌ Falha ao conectar no banco de dados.');
    console.error('   O Supabase pode estar bloqueando conexões diretas também.');
    console.error(`   Erro: ${err.message}\n`);
    console.error('💡 Alternativas:');
    console.error('   1. Esperar o ciclo resetar (06/Mai/2026)');
    console.error('   2. Migrar o banco para outro provider (Neon, Railway)');
    console.error('   3. Fazer upgrade temporário do Supabase ($25/mês)');
    process.exit(1);
  }

  // Contar ofertas atuais
  const totalOfertas = await prisma.oferta.count();
  console.log(`📊 Total de ofertas no banco: ${totalOfertas}`);

  if (totalOfertas === 0) {
    console.log('✅ Banco já está limpo. Nada para deletar.');
    await prisma.$disconnect();
    return;
  }

  console.log(`\n⚠️  ATENÇÃO: Vou deletar TODAS as ${totalOfertas} ofertas!`);
  console.log('   Os favoritos dos usuários também serão removidos.');
  console.log('   O bot vai reimportar tudo do Drive com as novas URLs.\n');

  // Pequeno delay para o usuário poder cancelar com Ctrl+C
  console.log('   Iniciando em 5 segundos... (Ctrl+C para cancelar)\n');
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('🗑️  Deletando dados relacionados...\n');

  // 1. Deletar favoritos (FK para ofertas)
  const favoritosDeleted = await prisma.favorito.deleteMany({});
  console.log(`   ✅ ${favoritosDeleted.count} favoritos deletados`);

  // 2. Deletar logs do bot (opcional, mas limpa)
  const logsDeleted = await prisma.botLog.deleteMany({});
  console.log(`   ✅ ${logsDeleted.count} logs do bot deletados`);

  // 3. Resetar estado do bot
  await prisma.botState.updateMany({
    data: {
      totalOffers: 0,
      totalCycles: 0,
      totalErrors: 0,
      isRunning: false,
      currentCycleId: null,
      lastError: null,
    }
  });
  console.log('   ✅ Estado do bot resetado');

  // 4. Deletar TODAS as ofertas
  const ofertasDeleted = await prisma.oferta.deleteMany({});
  console.log(`   ✅ ${ofertasDeleted.count} ofertas deletadas`);

  console.log('\n🎉 Reset concluído com sucesso!');
  console.log('   Agora faça o deploy do novo código e inicie o bot.');
  console.log('   O bot vai reimportar tudo do Google Drive com URLs do Drive.\n');

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Erro fatal:', err);
  await prisma.$disconnect();
  process.exit(1);
});
