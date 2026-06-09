import * as fs from 'fs';
import * as path from 'path';
import prisma from '../config/database';

async function updateNichoIcons() {
  const keywordsPath = path.join(__dirname, '../../../keywords.json');
  const bank = JSON.parse(fs.readFileSync(keywordsPath, 'utf-8'));

  // Monta mapa: nome normalizado → icon
  const iconMap: Record<string, string> = {};
  for (const [nome, entry] of Object.entries(bank)) {
    const icon = (entry as any)?.icon;
    if (icon) iconMap[nome.toLowerCase().trim()] = icon;
  }

  const nichos = await prisma.nicho.findMany({ select: { id: true, nome: true, slug: true, icone: true } });
  console.log(`\n🔍 ${nichos.length} nicho(s) encontrado(s) no banco.\n`);

  let updated = 0;
  let skipped = 0;

  for (const nicho of nichos) {
    // Tenta match por nome exato, depois por slug
    const icon =
      iconMap[nicho.nome.toLowerCase().trim()] ||
      iconMap[nicho.slug.replace(/-/g, ' ')] ||
      null;

    if (!icon) {
      console.log(`⚠️  Sem ícone mapeado para "${nicho.nome}" — mantendo "${nicho.icone}"`);
      skipped++;
      continue;
    }

    if (nicho.icone === icon) {
      console.log(`✅ "${nicho.nome}" já usa "${icon}" — sem alteração`);
      skipped++;
      continue;
    }

    await prisma.nicho.update({
      where: { id: nicho.id },
      data: { icone: icon },
    });

    console.log(`🎨 "${nicho.nome}": "${nicho.icone}" → "${icon}"`);
    updated++;
  }

  console.log(`\n✅ Concluído — ${updated} atualizado(s), ${skipped} sem alteração.`);
  await prisma.$disconnect();
}

updateNichoIcons().catch((err) => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
