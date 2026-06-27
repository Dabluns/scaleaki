import 'dotenv/config';
import prisma from '../config/database';
import logger from '../config/logger';
import { scanFunnel } from '../services/urlscan.service';

/**
 * Backfill de checkout via URLscan (conserto DEFINITIVO do filtro de plataforma).
 *
 * Problema: `detectCheckoutFromUrl` só olha a destinationUrl (que é a LANDING —
 * instagram/whatsapp/advertorial), então só ~22 de 11.684 anúncios ativos têm
 * `checkout` preenchido. `scanFunnel` segue o funil no URLscan e detecta o
 * checkout real que carrega DEPOIS da landing.
 *
 * Este script roda `scanFunnel` em massa sobre anúncios ativos com destino e
 * checkout=null, priorizando maior escala. Concorrência controlada + backoff
 * em 429. Idempotente: pula quem já tem urlscanLastRun (a menos de --force).
 *
 * Uso:
 *   ts-node src/scripts/backfillCheckout.ts [--limit=N] [--concurrency=N] [--dry] [--force]
 *
 * Exemplos:
 *   ts-node src/scripts/backfillCheckout.ts --dry --limit=20      # só lista o que faria
 *   ts-node src/scripts/backfillCheckout.ts --limit=300 --concurrency=6
 */

// ── Args ──────────────────────────────────────────────────────────────────────
function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : undefined;
}
const hasFlag = (name: string) => process.argv.includes(`--${name}`);

const LIMIT = arg('limit') ? Number(arg('limit')) : Infinity;
const CONCURRENCY = Math.max(1, Math.min(Number(arg('concurrency') || 5), 10));
const MIN_ESCALA = arg('min-escala') ? Number(arg('min-escala')) : 0;
const DRY = hasFlag('dry');
const FORCE = hasFlag('force');

// Destinos que NUNCA têm checkout próprio na própria URL — scan desperdiçaria
// cota do URLscan (o anúncio leva a app/rede social, não a um funil de venda).
const SKIP_HOST_FRAGMENTS = [
  'instagram.com',
  'play.google.com',
  'apps.apple.com',
  'wa.me',
  'whatsapp.com',
  'api.whatsapp.com',
  't.me',
  'youtube.com',
  'youtu.be',
  'facebook.com',
  'fb.com',
  'linktr.ee',
];

function shouldSkipDestino(url: string | null): boolean {
  if (!url) return true;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return SKIP_HOST_FRAGMENTS.some((frag) => host === frag || host.endsWith(`.${frag}`) || host.includes(frag));
  } catch {
    return true; // URL inválida → não dá pra escanear
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Worker com backoff em 429 ───────────────────────────────────────────────────
async function processOne(ad: { fbAdId: string; destinationUrl: string | null }, attempt = 1): Promise<'ok' | 'fail'> {
  try {
    await scanFunnel(ad.fbAdId, ad.destinationUrl as string);
    return 'ok';
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 429 && attempt <= 4) {
      const wait = 5000 * attempt; // 5s, 10s, 15s, 20s
      logger.warn(`[backfillCheckout] 429 rate limit — aguardando ${wait / 1000}s (tentativa ${attempt})`);
      await sleep(wait);
      return processOne(ad, attempt + 1);
    }
    logger.error(`[backfillCheckout] Falha em ${ad.fbAdId}: ${err?.message || err}`);
    return 'fail';
  }
}

async function main() {
  if (!process.env.URLSCAN_API_KEY) {
    console.error('❌ URLSCAN_API_KEY não configurada no .env — abortando.');
    process.exit(1);
  }

  const where: any = {
    isActive: true,
    destinationUrl: { not: null },
    checkout: null,
  };
  if (!FORCE) where.urlscanLastRun = null; // idempotente: não re-escaneia o já tentado
  if (MIN_ESCALA > 0) where.escala = { gte: MIN_ESCALA }; // só anúncios relevantes (opção B)

  const candidatos = await prisma.anuncioFacebook.findMany({
    where,
    orderBy: [{ escala: 'desc' }, { duplicatas: 'desc' }],
    select: { fbAdId: true, destinationUrl: true, escala: true },
  });

  // Filtra destinos que não vale a pena escanear (poupa cota URLscan)
  const elegiveis = candidatos.filter((a) => !shouldSkipDestino(a.destinationUrl));
  const puladosPorDestino = candidatos.length - elegiveis.length;
  const fila = elegiveis.slice(0, LIMIT === Infinity ? elegiveis.length : LIMIT);

  console.log('─── Backfill de checkout (URLscan) ───');
  console.log(`Candidatos (ativos, com destino, checkout=null${MIN_ESCALA > 0 ? `, escala>=${MIN_ESCALA}` : ''}): ${candidatos.length}`);
  console.log(`Pulados por destino (rede social/app/whatsapp): ${puladosPorDestino}`);
  console.log(`Elegíveis para scan: ${elegiveis.length}`);
  console.log(`Nesta execução (limit=${LIMIT === Infinity ? 'all' : LIMIT}): ${fila.length}`);
  console.log(`Concorrência: ${CONCURRENCY} | dry-run: ${DRY} | force: ${FORCE}`);
  console.log('──────────────────────────────────────');

  if (DRY) {
    fila.slice(0, 20).forEach((a) => console.log(`  [escala ${a.escala}] ${a.fbAdId} → ${a.destinationUrl}`));
    if (fila.length > 20) console.log(`  ... +${fila.length - 20}`);
    console.log('(dry-run — nenhum scan executado)');
    return;
  }

  let ok = 0;
  let fail = 0;
  let done = 0;
  const total = fila.length;

  // Pool de workers: cada worker puxa da fila compartilhada via cursor atômico.
  let cursor = 0;
  async function worker(id: number) {
    while (cursor < fila.length) {
      const idx = cursor++;
      const ad = fila[idx];
      const res = await processOne(ad);
      res === 'ok' ? ok++ : fail++;
      done++;
      if (done % 25 === 0 || done === total) {
        console.log(`[progresso] ${done}/${total} (ok=${ok} fail=${fail})`);
      }
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, fila.length) }, (_, i) => worker(i));
  await Promise.all(workers);

  console.log('─── Concluído ───');
  console.log(`Processados: ${done} | ok: ${ok} | falhas: ${fail}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
