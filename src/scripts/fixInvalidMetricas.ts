import prisma from '../config/database';
import logger from '../config/logger';

async function fixInvalidMetricas() {
  try {
    logger.info('Starting fixInvalidMetricas');

    // Buscar ofertas com metricas não nulas que não parecem JSON
    const ofertas = await prisma.oferta.findMany({
      where: {
        metricas: { not: null },
        NOT: [
          { metricas: { startsWith: '{' } as any },
          { metricas: { startsWith: '[' } as any }
        ]
      },
      select: { id: true, metricas: true, titulo: true }
    });

    logger.info('Found ofertas with invalid metricas', { count: ofertas.length });

    for (const oferta of ofertas) {
      try {
        const original = oferta.metricas as unknown as string;
        const fixed = JSON.stringify({ info: original });

        await prisma.oferta.update({
          where: { id: oferta.id },
          data: { metricas: fixed }
        });

        logger.info('Fixed metricas for oferta', { ofertaId: oferta.id, titulo: oferta.titulo });
      } catch (err) {
        logger.error('Failed to fix oferta metricas', {
          ofertaId: oferta.id,
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }

    logger.info('Completed fixInvalidMetricas');
  } catch (error) {
    logger.error('fixInvalidMetricas failed', { error: error instanceof Error ? error.message : String(error) });
  } finally {
    await prisma.$disconnect();
  }
}

fixInvalidMetricas();


