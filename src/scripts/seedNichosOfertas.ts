import prisma from '../config/database';
import logger from '../config/logger';

async function seedNichosOfertas() {
  try {
    console.log('🌱 Iniciando seed de nichos e ofertas...');

    // Criar nichos
    const nichos = [
      {
        nome: 'Emagrecimento',
        slug: 'emagrecimento',
        icone: 'Heart',
        descricao: 'Produtos e soluções para emagrecimento saudável'
      },
      {
        nome: 'Renda Extra',
        slug: 'renda-extra',
        icone: 'DollarSign',
        descricao: 'Oportunidades para ganhar dinheiro extra'
      },
      {
        nome: 'Calvície',
        slug: 'calvicie',
        icone: 'UserMinus',
        descricao: 'Tratamentos e soluções para calvície'
      },
      {
        nome: 'Religioso',
        slug: 'religioso',
        icone: 'BookOpen',
        descricao: 'Produtos e conteúdos religiosos'
      },
      {
        nome: 'Tecnologia',
        slug: 'tecnologia',
        icone: 'Smartphone',
        descricao: 'Produtos e serviços de tecnologia'
      }
    ];

    console.log('📝 Criando nichos...');
    const nichosCriados = [];
    
    for (const nichoData of nichos) {
      const nicho = await prisma.nicho.create({
        data: nichoData
      });
      nichosCriados.push(nicho);
      console.log(`✅ Nicho criado: ${nicho.nome} (${nicho.id})`);
    }

    // Criar ofertas de exemplo
    const ofertas = [
      {
        titulo: 'Segredos do Chá de Boldo',
        imagem: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400',
        texto: 'Descubra como o chá de boldo pode ajudar no emagrecimento de forma natural e saudável. Método comprovado por milhares de pessoas.',
        nichoId: nichosCriados[0].id, // Emagrecimento
        linguagem: 'pt_BR' as const,
        links: ['https://facebook.com/ads/boldo', 'https://instagram.com/ads/boldo'],
        metricas: '23.5%',
        vsl: 'https://vimeo.com/vslboldo'
      },
      {
        titulo: 'Curso de Marketing Digital',
        imagem: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
        texto: 'Aprenda marketing digital do zero e comece a ganhar dinheiro online. Curso completo com certificado.',
        nichoId: nichosCriados[1].id, // Renda Extra
        linguagem: 'pt_BR' as const,
        links: ['https://facebook.com/ads/marketing', 'https://youtube.com/ads/marketing'],
        metricas: '18.2%',
        vsl: 'https://vimeo.com/vslmarketing'
      },
      {
        titulo: 'Tratamento Natural para Calvície',
        imagem: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        texto: 'Descubra o tratamento natural que está fazendo homens recuperarem seus cabelos. Resultados em 30 dias.',
        nichoId: nichosCriados[2].id, // Calvície
        linguagem: 'pt_BR' as const,
        links: ['https://facebook.com/ads/calvicie'],
        metricas: '31.7%',
        vsl: 'https://vimeo.com/vslcalvicie'
      },
      {
        titulo: 'Oração Poderosa para Milagres',
        imagem: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        texto: 'Oração que já realizou milhares de milagres. Aprenda a rezar corretamente e veja suas orações serem atendidas.',
        nichoId: nichosCriados[3].id, // Religioso
        linguagem: 'pt_BR' as const,
        links: ['https://facebook.com/ads/oracao'],
        metricas: '42.1%',
        vsl: 'https://vimeo.com/vsloracao'
      },
      {
        titulo: 'App Revolucionário de Produtividade',
        imagem: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400',
        texto: 'App que vai revolucionar sua produtividade. Organize sua vida e aumente sua eficiência em 300%.',
        nichoId: nichosCriados[4].id, // Tecnologia
        linguagem: 'pt_BR' as const,
        links: ['https://facebook.com/ads/app', 'https://instagram.com/ads/app'],
        metricas: '15.8%',
        vsl: 'https://vimeo.com/vslapp'
      }
    ];

    console.log('📝 Criando ofertas...');
    
    for (const ofertaData of ofertas) {
      const oferta = await prisma.oferta.create({
        data: {
          ...ofertaData,
          links: JSON.stringify(ofertaData.links)
        }
      });
      console.log(`✅ Oferta criada: ${oferta.titulo} (${oferta.id})`);
    }

    console.log('🎉 Seed concluído com sucesso!');
    console.log(`📊 Nichos criados: ${nichosCriados.length}`);
    console.log(`📊 Ofertas criadas: ${ofertas.length}`);
    
    logger.info('Seed de nichos e ofertas concluído', {
      nichosCount: nichosCriados.length,
      ofertasCount: ofertas.length
    });

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    logger.error('Error during seed', { error: error instanceof Error ? error.message : String(error) });
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
seedNichosOfertas(); 