let miningInterval = null;
let apiUrl = '';
let token = '';
let sentAds = new Set();

// Iniciar com estado salvo
chrome.storage.local.get(['isMining', 'apiUrl', 'token'], (data) => {
  if (data.isMining && data.apiUrl && data.token) {
    startMining(data.apiUrl, data.token);
  }
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'toggleMining') {
    if (request.isMining) {
      startMining(request.apiUrl, request.token);
    } else {
      stopMining();
    }
  }
});

function startMining(url, jwt) {
  if (miningInterval) clearInterval(miningInterval);
  apiUrl = url;
  token = jwt;
  console.log('[Scaleaki Miner] 🔥 Mineração ATIVADA! Rolando a página para capturar.');
  
  // Roda o scraper a cada 3 segundos
  miningInterval = setInterval(scrapeDOM, 3000);
}

function stopMining() {
  if (miningInterval) clearInterval(miningInterval);
  miningInterval = null;
  console.log('[Scaleaki Miner] 🛑 Mineração PARADA.');
}

function scrapeDOM() {
  // A classe x1y74v8m geralmente envolve um bloco inteiro de card no FB Ad Library
  // Mas vamos buscar todos os links de "Detalhes" ou "ID" para ser mais assertivo
  const adLinks = document.querySelectorAll('a[href*="/ads/library/?id="]');
  const adsToSync = [];

  adLinks.forEach(link => {
    try {
      // Sobe até encontrar o container principal do anúncio
      let container = link;
      for (let i = 0; i < 7; i++) {
        if (container.parentElement) container = container.parentElement;
      }
      
      const hrefParams = new URLSearchParams(link.href.split('?')[1]);
      const fbAdId = hrefParams.get('id');
      
      if (!fbAdId || sentAds.has(fbAdId)) return;

      // Extração de Nome da Página
      let pageName = 'Desconhecido';
      const pageLinks = container.querySelectorAll('a[href*="facebook.com/"]');
      for (const p of pageLinks) {
        if (p.innerText && !p.href.includes('/ads/library') && !p.href.includes('/campaign')) {
          pageName = p.innerText.trim();
          break;
        }
      }

      // Extração de Textos
      let adCopy = '';
      const spans = container.querySelectorAll('span');
      for (const span of spans) {
        const text = span.innerText;
        // Evita pegar botões e cabeçalhos
        if (text.length > 30 && !text.includes('Detalhes do') && !text.includes('Veiculação')) {
          adCopy += text + '\n';
        }
      }

      // Extração de Status e Data
      let isActive = true;
      let deliveryStartTime = null;
      const allText = container.innerText;
      
      if (allText.includes('Inativo')) isActive = false;
      
      const dateMatch = allText.match(/Veiculação iniciada em:? (.+)/);
      if (dateMatch) {
        // Tenta parsear a data do FB (ex: "24 de mai. de 2024")
        deliveryStartTime = new Date(); // Fallback para agora
      }

      // Extração de Duplicatas (ex: "Esse anúncio tem várias versões")
      let duplicatas = 1;
      const dupMatch = allText.match(/(\d+)\s+anúncios? usam esse criativo e esse texto/i);
      if (dupMatch) {
        duplicatas = parseInt(dupMatch[1], 10);
      }

      adsToSync.push({
        fbAdId,
        pageName,
        adCopy: adCopy.trim().substring(0, 5000), // Limita tamanho
        isActive,
        deliveryStartTime,
        duplicatas,
        destinationUrl: null // Difícil pegar do DOM ofuscado, podemos enriquecer depois
      });

      // Marca como já enviado para não mandar duplicado no mesmo scroll
      sentAds.add(fbAdId);

    } catch(err) {
      // Ignora erros individuais de card
    }
  });

  if (adsToSync.length > 0) {
    console.log(`[Scaleaki] 🎯 Enviando ${adsToSync.length} novos anúncios para a base...`);
    syncWithAPI(adsToSync);
  }
}

async function syncWithAPI(ads) {
  try {
    const res = await fetch(`${apiUrl}/fb-ads/sync-extension`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ads })
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log(`[Scaleaki] ✅ Salvos! (Criados: ${data.created}, Atualizados: ${data.updated})`);
    } else {
      const err = await res.text();
      console.error(`[Scaleaki] ❌ Erro ao salvar no banco:`, err);
    }
  } catch(err) {
    console.error(`[Scaleaki] 🔌 Erro de conexão com a API:`, err);
  }
}
