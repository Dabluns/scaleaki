import cron from 'node-cron';
import { storageCleanupService } from '../services/storageCleanupService';
import logger from '../config/logger';

// Agendar limpeza diária às 03:00 AM
// Cron format: Minute Hour Day Month DayOfWeek
export const startCleanupJob = () => {
    // '0 3 * * *' = Todo dia às 03:00
    cron.schedule('0 3 * * *', async () => {
        logger.info('🕒 Executando limpeza agendada de Storage (03:00 AM)...');
        try {
            const result = await storageCleanupService.runCleanup();
            if (result.success) {
                logger.info(`✅ Limpeza agendada concluída. Arquivos removidos: ${result.deleted}`);
            }
        } catch (error) {
            logger.error('❌ Falha na limpeza agendada:', error);
        }
    });

    logger.info('📅 Agendamento de limpeza de Storage iniciado (Diariamente às 03:00 AM).');
};
