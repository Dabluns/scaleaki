import prisma from '../config/database';
import { hasPaidAccess } from '../utils/access';

/**
 * Migra usuários existentes: quem não tem acesso pago real (sub ativa não-expirada)
 * vira plan='free'. Admins e pagantes ativos são mantidos.
 * Rodar uma vez após o deploy do schema com enum 'free'.
 */
async function main() {
  const users = await prisma.user.findMany({ include: { subscription: true } });
  let toFree = 0, kept = 0;
  for (const u of users) {
    if (u.role === 'admin') { kept++; continue; }
    if (hasPaidAccess(u as any)) { kept++; continue; }
    if (u.plan !== 'free') {
      await prisma.user.update({ where: { id: u.id }, data: { plan: 'free' } });
      toFree++;
    } else {
      kept++;
    }
  }
  console.log(`Backfill: ${toFree} → free, ${kept} mantidos (pagos/admin/já-free).`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
