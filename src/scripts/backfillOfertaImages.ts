import prisma from '../config/database';

/**
 * Corrige Oferta.imagem quebrada (lh3.googleusercontent.com/d ou /drive-storage que
 * expira) reescrevendo pro endpoint estável drive.google.com/thumbnail.
 * Recupera o fileId do próprio imagem OU de links.criativos[]/transcricao.
 * Rodar após o fix de getPublicImageUrl.
 */
function extractFileId(url?: string | null): string | null {
  if (!url) return null;
  let m = url.match(/\/file\/d\/([^/?]+)/);          // .../file/d/FILE_ID/preview
  if (m) return m[1];
  m = url.match(/googleusercontent\.com\/d\/([^/?]+)/); // lh3.../d/FILE_ID
  if (m) return m[1];
  m = url.match(/[?&]id=([^&]+)/);                    // ...?id=FILE_ID
  if (m) return m[1];
  m = url.match(/\/d\/([^/?]+)/);                     // .../d/FILE_ID
  if (m) return m[1];
  return null;
}

function thumb(fileId: string): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
}

async function main() {
  const ofertas = await prisma.oferta.findMany({ select: { id: true, imagem: true, links: true } });
  let fixed = 0, skipped = 0, already = 0;
  for (const o of ofertas) {
    if (o.imagem && o.imagem.includes('drive.google.com/thumbnail')) { already++; continue; }

    // 1) tenta fileId do próprio imagem (casos /d/FILE_ID)
    let fileId = extractFileId(o.imagem);

    // 2) fallback: links.criativos[0] / transcricao
    if (!fileId && o.links) {
      try {
        const links = JSON.parse(o.links);
        const cand = (Array.isArray(links.criativos) ? links.criativos[0] : null) || links.transcricao || links.imagem;
        fileId = extractFileId(cand);
      } catch { /* links não-JSON */ }
    }

    if (!fileId) { skipped++; continue; }

    const novo = thumb(fileId);
    if (novo === o.imagem) { already++; continue; }
    await prisma.oferta.update({ where: { id: o.id }, data: { imagem: novo } });
    fixed++;
  }
  console.log(`Backfill imagens: ${fixed} corrigidas, ${already} já-ok, ${skipped} sem fileId recuperável (total ${ofertas.length}).`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
