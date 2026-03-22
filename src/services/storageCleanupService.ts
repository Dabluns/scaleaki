import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import logger from '../config/logger';

const prisma = new PrismaClient();
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BUCKETS = ['images', 'videos'];

/**
 * Serviço de Coleta de Lixo (Garbage Collection) para Supabase Storage
 * Remove arquivos que existem no Storage mas não estão linkados no banco.
 */
export const storageCleanupService = {
    async runCleanup() {
        logger.info('🧹 Iniciando limpeza de arquivos órfãos (Garbage Collection)...');
        let totalDeleted = 0;

        try {
            // 1. Coletar todas as URLs de imagens e vídeos usadas no banco
            // Usamos distinct para não processar duplicatas
            const ofertas = await prisma.oferta.findMany({
                select: { imagem: true, vsl: true }
            });

            const usedUrls = new Set<string>();
            ofertas.forEach(o => {
                if (o.imagem) usedUrls.add(o.imagem);
                if (o.vsl) usedUrls.add(o.vsl);
            });

            logger.info(`📊 Arquivos referenciados no banco: ${usedUrls.size}`);

            // 2. Iterar sobre cada bucket
            for (const bucketName of BUCKETS) {
                logger.info(`🔍 Analisando bucket: ${bucketName}`);

                // Listar arquivos no bucket (limitado a 1000 por vez pelo supabase, ideal seria paginar)
                // Aqui vamos listar recursively se possível, ou assumir estrutura de pastas
                // O list do supabase não é recursivo por padrão, mas podemos tentar pegar a raiz e subpastas conhecidas
                // Para simplificar, vamos listar a raiz e assumir que o bot cria pastas por ano/mês
                // Se a estrutura for muito profunda, precisaria de uma função recursiva de listagem.

                // Implementação Simplificada: Lista recursiva de pastas conhecidas ou varredura
                // Como o bot cria 'ano/mes/arquivo', vamos listar pastas de anos
                const { data: years } = await supabase.storage.from(bucketName).list();

                if (!years) continue;

                for (const yearFolder of years) {
                    if (!yearFolder.id) continue; // é arquivo na raiz ou algo assim

                    // Entrar no ano
                    const { data: months } = await supabase.storage.from(bucketName).list(yearFolder.name);
                    if (!months) continue;

                    for (const monthFolder of months) {
                        // Entrar no mês
                        const { data: files } = await supabase.storage.from(bucketName).list(`${yearFolder.name}/${monthFolder.name}`);
                        if (!files) continue;

                        for (const file of files) {
                            if (file.id === null) continue; // é pasta

                            // Construir URL pública para comparar
                            // Padrao: SUPABASE_URL/storage/v1/object/public/BUCKET/PATH
                            const path = `${yearFolder.name}/${monthFolder.name}/${file.name}`;
                            const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(path);
                            const publicUrl = publicUrlData.publicUrl;

                            // Checar se está em uso
                            if (!usedUrls.has(publicUrl)) {
                                // É órfão! Deletar.
                                logger.warn(`🗑️ Deletando arquivo órfão: ${path}`);
                                await supabase.storage.from(bucketName).remove([path]);
                                totalDeleted++;
                            }
                        }
                    }
                }
            }

            logger.info(`✅ Limpeza concluída. Total de arquivos removidos: ${totalDeleted}`);
            return { success: true, deleted: totalDeleted };

        } catch (error) {
            logger.error('❌ Erro durante Garbage Collection:', error);
            return { success: false, error };
        }
    }
};
