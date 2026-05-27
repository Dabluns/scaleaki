// ─── 1. Estado local (Scraping Puro - Sem injeção) ────────────────────────
let isMining = false;
let apiUrl = '';
let token = '';
let sentAds = new Set();
let miningInterval = null;

chrome.storage.local.get(['isMining', 'apiUrl', 'token'], (data) => {
  apiUrl = data.apiUrl || '';
  token = data.token || '';
  if (data.isMining) startMining();
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'toggleMining') {
    apiUrl = request.apiUrl;
    token = request.token;
    if (request.isMining) {
      startMining();
    } else {
      stopMining();
    }
  }
});

function startMining() {
  isMining = true;
  if (miningInterval) clearInterval(miningInterval);
  console.log('[Scaleaki Miner] 🟢 Mineração por Scraping Passivo ATIVADA!');
  miningInterval = setInterval(scrapeDOM, 2500);
}

function stopMining() {
  isMining = false;
  if (miningInterval) clearInterval(miningInterval);
  console.log('[Scaleaki Miner] 🔴 Mineração PARADA.');
}

function scrapeDOM() {
  if (!isMining) return;

  const adsToSync = [];
  
  // Pegamos todos os elementos que possam conter o texto ID
  const allSpans = document.querySelectorAll('span, div');
  
  allSpans.forEach(el => {
    const text = el.innerText;
    if (!text || text.length > 80 || !text.includes('Identificação da biblioteca:')) return;
    if (el.children.length > 1) return; // Garante que pegamos o elemento mais profundo
    
    try {
      const fbAdId = text.replace(/[^\d]/g, '');
      if (!fbAdId || sentAds.has(fbAdId)) return;

      // O truque: subir até encontrar o container que tem o botão "Ver detalhes do anúncio"
      let container = el;
      let foundCard = false;
      for (let i = 0; i < 15; i++) {
        if (!container.parentElement) break;
        container = container.parentElement;
        if (container.innerText.includes('Ver detalhes do anúncio') || container.innerText.includes('Veiculação iniciada')) {
          // Se o container ficou muito grande (pegou a página toda), não é o card
          if (container.innerText.length < 5000) {
            foundCard = true;
            break;
          }
        }
      }

      if (!foundCard) return; // Não achou o container do anúncio

      const allText = container.innerText;

      // 1. Nome da Página
      let pageName = 'Desconhecido';
      // As páginas geralmente têm um link para facebook.com/nome_da_pagina
      const links = container.querySelectorAll('a[href*="facebook.com/"]');
      for (const link of links) {
        if (link.innerText && !link.href.includes('/ads/library') && link.innerText.length > 2) {
          pageName = link.innerText.trim();
          break;
        }
      }
      
      // Fallback pra página: procurar o primeiro texto logo acima de "Patrocinado"
      if (pageName === 'Desconhecido') {
        const textBlocks = allText.split('\n');
        for (let i = 0; i < textBlocks.length; i++) {
          if (textBlocks[i].includes('Patrocinado') && i > 0) {
            pageName = textBlocks[i-1].trim();
            break;
          }
        }
      }

      // 2. Extração de Status e Duplicatas
      const isActive = !allText.includes('Inativo');
      let duplicatas = 1;
      const dupMatch = allText.match(/(\d+)\s+anúncios? usam esse/i);
      if (dupMatch) duplicatas = parseInt(dupMatch[1], 10);

      // 3. Extração da Data
      let deliveryStartTime = new Date();
      const dateMatch = allText.match(/Veiculação iniciada em:? (.+)/);
      if (dateMatch) {
         // O texto é tipo "20 de mai. de 2024"
         // Como é complexo fazer parse exato, enviaremos string pro backend ou new Date
         // O backend atual espera um Date ISO, vamos mandar nulo e deixar o backend lidar ou mandar a data atual.
         // Vamos deixar a data atual para o gráfico não quebrar, já que não temos o epoch.
      }

      // 4. Extração de Copy (Texto do anúncio)
      let adCopy = '';
      // O texto do anúncio geralmente fica numa div separada do cabeçalho
      const paragraphs = container.querySelectorAll('span[dir="auto"], div[dir="auto"]');
      for (const p of paragraphs) {
        const pText = p.innerText.trim();
        // Filtra textos da interface do Facebook
        if (pText.length > 20 && !pText.includes('Identificação da biblioteca') && !pText.includes('Ver detalhes') && !pText.includes('Patrocinado') && p.children.length === 0) {
          adCopy += pText + '\n\n';
        }
      }
      
      // Se a copy não pegou nada pelos divs auto, usa fallback
      if (adCopy.length < 10) {
         const lines = allText.split('\n');
         let inCopy = false;
         for (const line of lines) {
           if (line.includes('Patrocinado')) { inCopy = true; continue; }
           if (line.includes('Identificação da biblioteca')) { inCopy = false; break; }
           if (inCopy && line.length > 5) adCopy += line + '\n';
         }
      }

      adsToSync.push({
        fbAdId,
        pageName: pageName.substring(0, 100),
        adCopy: adCopy.trim().substring(0, 4000) || 'Anúncio de mídia sem texto visível',
        isActive,
        deliveryStartTime: deliveryStartTime.toISOString(),
        duplicatas,
        destinationUrl: null
      });

      sentAds.add(fbAdId);
    } catch(err) {
      console.error('[Scaleaki Miner] Erro no parser de card:', err);
    }
  });

  if (adsToSync.length > 0) {
    console.log(`[Scaleaki] 🎯 ${adsToSync.length} anúncios lidos do DOM! Enviando...`);
    syncWithAPI(adsToSync);
  }
}

async function syncWithAPI(ads) {
  if (!apiUrl || !token) return;
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
      console.error(`[Scaleaki] ❌ Erro na API:`, await res.text());
    }
  } catch(err) {
    console.error(`[Scaleaki] 🔌 Erro de rede:`, err);
  }
}
