// ─── 1. Injeta o interceptador na página ──────────────────────────────────────
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = function() { this.remove(); };
(document.head || document.documentElement).appendChild(script);

// ─── 2. Estado local ────────────────────────────────────────────────────────
let isMining = false;
let apiUrl = '';
let token = '';
let sentAds = new Set();

chrome.storage.local.get(['isMining', 'apiUrl', 'token'], (data) => {
  isMining = data.isMining || false;
  apiUrl = data.apiUrl || '';
  token = data.token || '';
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'toggleMining') {
    isMining = request.isMining;
    apiUrl = request.apiUrl;
    token = request.token;
    console.log('[Scaleaki Miner] Modo mineração:', isMining ? 'ATIVADO' : 'PARADO');
  }
});

// ─── 3. Recebe os dados puros do interceptador (JSON GraphQL) ───────────────
window.addEventListener('ScaleakiAdsCaptured', (e) => {
  if (!isMining) return;
  
  const edges = e.detail;
  const adsToSync = [];
  
  edges.forEach(edge => {
    try {
      const node = edge.node;
      const fbAdId = node.archive_id || node.id;
      
      if (!fbAdId || sentAds.has(fbAdId)) return;
      
      // Parseia o payload limpo e estruturado da própria API do Facebook!
      const ad = {
        fbAdId: fbAdId.toString(),
        pageName: node.page_name || 'Desconhecido',
        pageProfilePic: node.page_profile_picture_url || null,
        adHeadline: '',
        adCopy: '',
        isActive: node.is_active !== false,
        deliveryStartTime: node.start_date ? new Date(node.start_date * 1000).toISOString() : new Date().toISOString(),
        duplicatas: node.publisher_platforms?.length || 1,
        destinationUrl: null
      };

      // Tenta pegar os textos do snapshot do anúncio
      if (node.snapshot) {
         if (node.snapshot.body && node.snapshot.body.text) {
           ad.adCopy = node.snapshot.body.text;
         } else if (typeof node.snapshot.body === 'string') {
           ad.adCopy = node.snapshot.body;
         }
         
         if (node.snapshot.title) {
           ad.adHeadline = node.snapshot.title;
         }

         // Pega o link de destino dos botões CTA
         if (node.snapshot.cards && node.snapshot.cards.length > 0) {
           ad.destinationUrl = node.snapshot.cards[0].link_url;
         } else if (node.snapshot.link_url) {
           ad.destinationUrl = node.snapshot.link_url;
         }
      }
      
      adsToSync.push(ad);
      sentAds.add(fbAdId);
    } catch(err) {
      console.error('[Scaleaki Miner] Erro ao parsear nó GraphQL:', err);
    }
  });

  if (adsToSync.length > 0) {
    console.log(`[Scaleaki] 🎯 ${adsToSync.length} novos anúncios capturados via Rede. Enviando...`);
    syncWithAPI(adsToSync);
  }
});

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
    console.error(`[Scaleaki] 🔌 Erro de conexão:`, err);
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
