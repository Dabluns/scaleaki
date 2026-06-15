require('dotenv').config();
const puppeteer = require('puppeteer');
const axios = require('axios');

// Configure aqui a URL do seu backend e o Token Admin JWT que geramos antes
const API_URL = process.env.API_URL || 'http://localhost:4000';
const JWT_TOKEN = process.env.ADMIN_JWT;
if (!JWT_TOKEN) {
  console.error('❌ ADMIN_JWT ausente. Defina no .env antes de rodar o minerador.');
  process.exit(1);
}

async function startMiner() {
  console.log('🤖 Iniciando Minerador Local Stealth do Scaleaki...');
  console.log(`🔗 Destino dos dados: ${API_URL}`);

  console.log('🚀 Abrindo o Google Chrome...');
  const browser = await puppeteer.launch({
    headless: false, // Abre o navegador de verdade para a Meta não achar que é robô
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = (await browser.pages())[0];
  await page.goto('https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=BR&media_type=all', { waitUntil: 'networkidle2' });

  console.log('\n====================================================');
  console.log('🟢 NAVEGADOR ABERTO (Scraping Passivo Ativo)!');
  console.log('👉 1. Pesquise sua palavra-chave no navegador aberto.');
  console.log('👉 2. Comece a rolar a tela para baixo devagar.');
  console.log('👉 3. Tudo será enviado magicamente para o seu backend no Render!');
  console.log('====================================================\n');

  const sentAds = new Set();

  setInterval(async () => {
    try {
      const adsFound = await page.evaluate(() => {
        const ads = [];
        const allElements = document.querySelectorAll('span, div');
        
        allElements.forEach(el => {
          const text = el.innerText;
          if (!text || text.length > 80 || !text.includes('Identificação da biblioteca:')) return;
          if (el.children.length > 1) return; // Garante o elemento mais profundo

          const fbAdId = text.replace(/[^\d]/g, '');
          if (!fbAdId) return;

          let container = el;
          let foundCard = false;
          for (let i = 0; i < 15; i++) {
            if (!container.parentElement) break;
            container = container.parentElement;
            if (container.innerText.includes('Ver detalhes do anúncio') || container.innerText.includes('Veiculação iniciada')) {
              if (container.innerText.length < 5000) {
                foundCard = true;
                break;
              }
            }
          }

          if (!foundCard) return;

          const allText = container.innerText;

          // Nome da Página
          let pageName = 'Desconhecido';
          const links = container.querySelectorAll('a[href*="facebook.com/"]');
          for (const link of links) {
            if (link.innerText && !link.href.includes('/ads/library') && link.innerText.length > 2) {
              pageName = link.innerText.trim();
              break;
            }
          }
          
          if (pageName === 'Desconhecido') {
             const lines = allText.split('\n');
             for(let i=0; i<lines.length; i++) {
                if (lines[i].includes('Patrocinado') && i > 0) {
                   pageName = lines[i-1].trim();
                   break;
                }
             }
          }

          const isActive = !allText.includes('Inativo');
          let duplicatas = 1;
          const dupMatch = allText.match(/(\d+)\s+anúncios? usam esse/i);
          if (dupMatch) duplicatas = parseInt(dupMatch[1], 10);

          let adCopy = '';
          const paragraphs = container.querySelectorAll('span[dir="auto"], div[dir="auto"]');
          for (const p of paragraphs) {
            const pText = p.innerText.trim();
            if (pText.length > 20 && !pText.includes('Identificação da biblioteca') && !pText.includes('Ver detalhes') && !pText.includes('Patrocinado') && p.children.length === 0) {
              adCopy += pText + '\n\n';
            }
          }

          let adSnapshotUrl = null;
          const images = Array.from(container.querySelectorAll('img'));
          // A imagem do criativo geralmente é a última renderizada no card, depois do perfil
          for (let i = images.length - 1; i >= 0; i--) {
            const img = images[i];
            if (img.src && img.src.includes('scontent')) {
              adSnapshotUrl = img.src;
              break;
            }
          }
          if (!adSnapshotUrl) {
            const video = container.querySelector('video');
            if (video && video.poster) adSnapshotUrl = video.poster;
          }

          ads.push({
            fbAdId,
            pageName: pageName.substring(0, 100),
            adCopy: adCopy.trim().substring(0, 4000),
            adSnapshotUrl,
            isActive,
            duplicatas,
            deliveryStartTime: new Date().toISOString()
          });
        });

        return ads;
      });

      // Filtra apenas os anúncios que ainda não enviamos nesta sessão
      const newAds = adsFound.filter(ad => !sentAds.has(ad.fbAdId));
      
      if (newAds.length > 0) {
        newAds.forEach(ad => sentAds.add(ad.fbAdId));
        console.log(`[🎯] Encontrados ${newAds.length} novos anúncios.`);
        
        // Envia em lotes de 10 para evitar Payload Too Large (Erro 413) na API do Render
        const chunkSize = 10;
        for (let i = 0; i < newAds.length; i += chunkSize) {
          const chunk = newAds.slice(i, i + chunkSize);
          console.log(`[⏳] Enviando lote ${Math.floor(i/chunkSize) + 1} de ${Math.ceil(newAds.length/chunkSize)}...`);
          try {
            const response = await axios.post(`${API_URL}/fb-ads/sync-extension`, {
              ads: chunk
            }, {
              headers: {
                'Authorization': `Bearer ${JWT_TOKEN}`
              }
            });
            console.log(`✅ [Sucesso Lote] ${response.data.created} criados, ${response.data.updated} atualizados.`);
          } catch (apiError) {
            if (apiError.response) {
              console.error(`❌ [Erro da API ${apiError.response.status}]`, JSON.stringify(apiError.response.data).substring(0, 500));
            } else {
              console.error(`❌ [Erro da API]`, apiError.message);
            }
          }
        }
      }
    } catch (err) {
      // Evita poluir o console com erros bobos de leitura da página
    }
  }, 4000); // Roda a cada 4 segundos
}

startMiner().catch(err => {
  console.error('❌ Erro fatal:', err);
});
