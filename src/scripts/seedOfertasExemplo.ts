import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedOfertasExemplo() {
  try {
    console.log('🌱 Iniciando seed de ofertas de exemplo...');

    // Primeiro, vamos criar alguns nichos se não existirem
    const nichos = [
      {
        nome: 'Renda extra',
        slug: 'renda-extra',
        icone: 'dollar-sign',
        descricao: 'Ofertas para gerar renda extra'
      },
      {
        nome: 'Saúde',
        slug: 'saude',
        icone: 'heart',
        descricao: 'Produtos e serviços de saúde'
      },
      {
        nome: 'Beleza',
        slug: 'beleza',
        icone: 'sparkles',
        descricao: 'Produtos de beleza e estética'
      },
      {
        nome: 'Educação',
        slug: 'educacao',
        icone: 'book-open',
        descricao: 'Cursos e materiais educacionais'
      },
      {
        nome: 'Tecnologia',
        slug: 'tecnologia',
        icone: 'cpu',
        descricao: 'Produtos e serviços de tecnologia'
      }
    ];

    for (const nicho of nichos) {
      await prisma.nicho.upsert({
        where: { slug: nicho.slug },
        update: {},
        create: nicho
      });
    }

    console.log('✅ Nichos criados/atualizados');

    // Agora vamos criar ofertas de exemplo
    const ofertasExemplo = [
      {
        titulo: 'HomeCash - Sistema de Renda Extra',
        texto: 'Descubra como ganhar dinheiro extra trabalhando de casa. Método comprovado que já ajudou milhares de pessoas a gerar renda extra de R$ 2.000 a R$ 5.000 por mês.',
        nichoSlug: 'renda-extra',
        linguagem: 'pt_BR',
        links: JSON.stringify([
          'https://example.com/ads-library-1',
          'https://example.com/ads-library-2',
          'https://example.com/ads-library-3'
        ]),
        metricas: JSON.stringify({ info: '500k/dia' }),
        vsl: 'https://example.com/vsl-homecash',
        data: '2024-06-16'
      },
      {
        titulo: 'Detox Natural - Limpeza Completa',
        texto: 'Programa de detox natural que elimina toxinas do corpo em 7 dias. Resultados comprovados: mais energia, melhor sono e pele mais bonita.',
        nichoSlug: 'saude',
        linguagem: 'pt_BR',
        links: JSON.stringify([
          'https://example.com/ads-detox-1',
          'https://example.com/ads-detox-2'
        ]),
        metricas: JSON.stringify({ info: '300k/dia' }),
        vsl: 'https://example.com/vsl-detox',
        data: '2024-06-15'
      },
      {
        titulo: 'Beauty Secrets - Rotina de Beleza',
        texto: 'Descubra os segredos das celebridades para uma pele perfeita. Rotina simples de 3 passos que transforma sua pele em 30 dias.',
        nichoSlug: 'beleza',
        linguagem: 'pt_BR',
        links: JSON.stringify([
          'https://example.com/ads-beauty-1',
          'https://example.com/ads-beauty-2',
          'https://example.com/ads-beauty-3',
          'https://example.com/ads-beauty-4'
        ]),
        metricas: JSON.stringify({ info: '400k/dia' }),
        vsl: 'https://example.com/vsl-beauty',
        data: '2024-06-14'
      },
      {
        titulo: 'English Master - Fluência em 90 Dias',
        texto: 'Método revolucionário para aprender inglês em 90 dias. Baseado em neurociência, sem decorar gramática. Resultados garantidos.',
        nichoSlug: 'educacao',
        linguagem: 'pt_BR',
        links: JSON.stringify([
          'https://example.com/ads-english-1',
          'https://example.com/ads-english-2'
        ]),
        metricas: JSON.stringify({ info: '250k/dia' }),
        vsl: 'https://example.com/vsl-english',
        data: '2024-06-13'
      },
      {
        titulo: 'App Builder Pro - Crie Apps Sem Código',
        texto: 'Crie aplicativos profissionais sem saber programar. Plataforma drag-and-drop que permite criar apps para iOS e Android em horas.',
        nichoSlug: 'tecnologia',
        linguagem: 'pt_BR',
        links: JSON.stringify([
          'https://example.com/ads-app-1',
          'https://example.com/ads-app-2',
          'https://example.com/ads-app-3'
        ]),
        metricas: JSON.stringify({ info: '600k/dia' }),
        vsl: 'https://example.com/vsl-app',
        data: '2024-06-12'
      },
      {
        titulo: 'Crypto Profit - Investimento Digital',
        texto: 'Aprenda a investir em criptomoedas de forma segura e lucrativa. Estratégias que geraram retornos de 300% em 6 meses.',
        nichoSlug: 'renda-extra',
        linguagem: 'pt_BR',
        links: JSON.stringify([
          'https://example.com/ads-crypto-1',
          'https://example.com/ads-crypto-2'
        ]),
        metricas: JSON.stringify({ info: '350k/dia' }),
        vsl: 'https://example.com/vsl-crypto',
        data: '2024-06-11'
      },
      {
        titulo: 'Fitness Home - Treino em Casa',
        texto: 'Programa completo de treinos para fazer em casa. Perda de peso e ganho de massa muscular sem equipamentos caros.',
        nichoSlug: 'saude',
        linguagem: 'pt_BR',
        links: JSON.stringify([
          'https://example.com/ads-fitness-1',
          'https://example.com/ads-fitness-2',
          'https://example.com/ads-fitness-3'
        ]),
        metricas: JSON.stringify({ info: '450k/dia' }),
        vsl: 'https://example.com/vsl-fitness',
        data: '2024-06-10'
      },
      {
        titulo: 'Makeup Artist - Curso Profissional',
        texto: 'Torne-se uma maquiadora profissional em 30 dias. Curso completo com técnicas das melhores maquiadoras do Brasil.',
        nichoSlug: 'beleza',
        linguagem: 'pt_BR',
        links: JSON.stringify([
          'https://example.com/ads-makeup-1',
          'https://example.com/ads-makeup-2'
        ]),
        metricas: JSON.stringify({ info: '200k/dia' }),
        vsl: 'https://example.com/vsl-makeup',
        data: '2024-06-09'
      }
    ];

    for (const oferta of ofertasExemplo) {
      const nicho = await prisma.nicho.findUnique({
        where: { slug: oferta.nichoSlug }
      });

      if (nicho) {
        // Verificar se a oferta já existe
        const ofertaExistente = await prisma.oferta.findFirst({
          where: {
            titulo: oferta.titulo,
            nichoId: nicho.id
          }
        });

        if (ofertaExistente) {
          // Atualizar oferta existente
          await prisma.oferta.update({
            where: { id: ofertaExistente.id },
            data: {
              texto: oferta.texto,
              linguagem: oferta.linguagem as any,
              links: oferta.links,
              metricas: oferta.metricas,
              vsl: oferta.vsl,
              isActive: true
            }
          });
        } else {
          // Criar nova oferta
          await prisma.oferta.create({
            data: {
              titulo: oferta.titulo,
              texto: oferta.texto,
              nichoId: nicho.id,
              linguagem: oferta.linguagem as any,
              links: oferta.links,
              metricas: oferta.metricas,
              vsl: oferta.vsl,
              isActive: true
            }
          });
        }
      }
    }

    console.log('✅ Ofertas de exemplo criadas/atualizadas');
    console.log('🎉 Seed concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedOfertasExemplo(); 