// Scaleaki Content Script
// Injeta a toolkit nos cards da biblioteca de anúncios do Facebook

const STATE = {
  processedAds: new Set()
};

function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = 'scaleaki-toast';
  toast.style.borderColor = isError ? '#ef4444' : '#22c55e';
  toast.innerHTML = \`<span style="color: \${isError ? '#ef4444' : '#22c55e'}">\${isError ? '❌' : '✅'}</span> \${message}\`;
  
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 100);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Utilitário para extrair a URL de destino real do l.facebook.com
function cleanFacebookUrl(fbUrl) {
  if (!fbUrl) return '';
  if (fbUrl.includes('l.facebook.com/l.php')) {
    try {
      const urlObj = new URL(fbUrl);
      const uParam = urlObj.searchParams.get('u');
      if (uParam) return decodeURIComponent(uParam);
    } catch(e) {}
  }
  return fbUrl;
}

// Extrai todos os dados possíveis de um card de anúncio
function extractAdData(cardNode) {
  const data = {
    id: '',
    pageName: 'Desconhecido',
    adCopy: '',
    destinationUrl: '',
    mediaUrls: [],
    libraryUrl: ''
  };

  // Extrair ID da biblioteca
  const textContent = cardNode.innerText || '';
  const idMatch = textContent.match(/ID\s+da\s+biblioteca\s*(?:de\s*anúncios)?:\s*(\d+)/i);
  if (idMatch && idMatch[1]) {
    data.id = idMatch[1];
    data.libraryUrl = \`https://www.facebook.com/ads/library/?id=\${data.id}\`;
  }

  // Extrair Nome da Página
  // Geralmente é o primeiro texto forte ou span com classe de texto primário
  const pageLinks = Array.from(cardNode.querySelectorAll('a[href*="facebook.com/"], a[href*="instagram.com/"]'));
  for (const link of pageLinks) {
    if (link.innerText && link.innerText.trim().length > 1 && !link.querySelector('img')) {
      data.pageName = link.innerText.trim();
      break;
    }
  }

  // Extrair Copy
  // Pega os blocos de texto no meio do card
  const divs = Array.from(cardNode.querySelectorAll('div'));
  const copyDiv = divs.find(d => {
    return d.dir === 'auto' && d.innerText && d.innerText.length > 20 && !d.innerText.includes('ID da biblioteca');
  });
  if (copyDiv) {
    data.adCopy = copyDiv.innerText;
  }

  // Extrair URL de destino
  const links = Array.from(cardNode.querySelectorAll('a'));
  const ctaLinks = links.filter(l => l.innerText && (
    l.innerText.includes('Saiba mais') || 
    l.innerText.includes('Comprar') || 
    l.innerText.includes('Baixar') ||
    l.innerText.includes('Cadastre') ||
    l.innerText.includes('Assinar')
  ));
  
  if (ctaLinks.length > 0) {
    data.destinationUrl = cleanFacebookUrl(ctaLinks[0].href);
  } else {
    // Fallback: tentar pegar qualquer link externo
    const externalLinks = links.filter(l => l.href && l.href.includes('l.facebook.com'));
    if (externalLinks.length > 0) {
      data.destinationUrl = cleanFacebookUrl(externalLinks[externalLinks.length - 1].href);
    }
  }

  // Extrair Mídias (Vídeos e Imagens)
  const videos = Array.from(cardNode.querySelectorAll('video'));
  videos.forEach(v => {
    if (v.src) data.mediaUrls.push({ type: 'video', url: v.src });
  });

  const images = Array.from(cardNode.querySelectorAll('img'));
  images.forEach(img => {
    // Ignorar imagens de perfil ou ícones pequenos
    if (img.width > 100 && img.height > 100 && img.src) {
      data.mediaUrls.push({ type: 'image', url: img.src });
    }
  });

  return data;
}

function injectToolkit(cardNode) {
  if (cardNode.querySelector('.scaleaki-toolkit') || cardNode.dataset.scaleakiInjected) return;
  cardNode.dataset.scaleakiInjected = "true";

  const adData = extractAdData(cardNode);
  
  const toolkit = document.createElement('div');
  toolkit.className = 'scaleaki-toolkit';

  // Extrair o hostname para pesquisa rápida
  let siteDomain = 'Desconhecido';
  if (adData.destinationUrl) {
    try {
      siteDomain = new URL(adData.destinationUrl).hostname.replace('www.', '');
    } catch(e) {}
  }

  toolkit.innerHTML = \`
    <div class="scaleaki-header">
      <div class="scaleaki-logo"><span>⚡</span> Scaleaki Toolkit</div>
    </div>
    
    <div class="scaleaki-actions">
      <button class="scaleaki-btn primary" id="btn-download-\${adData.id}">
        Baixar Criativo Principal
      </button>
      <button class="scaleaki-btn" id="btn-details-\${adData.id}">
        Ver Detalhes do Anúncio
      </button>
      <button class="scaleaki-btn save-btn" id="btn-save-\${adData.id}">
        Salvar Oferta no Scaleaki Dashboard
      </button>
    </div>

    <div class="scaleaki-info-panel" id="panel-\${adData.id}">
      <div class="scaleaki-info-row">
        <span class="scaleaki-info-label">Anunciante:</span>
        <span class="scaleaki-info-value" title="\${adData.pageName}">\${adData.pageName}</span>
      </div>
      <div class="scaleaki-info-row">
        <span class="scaleaki-info-label">Site:</span>
        <span class="scaleaki-info-value" title="\${adData.destinationUrl}">
          <a href="\${adData.destinationUrl}" target="_blank">\${siteDomain}</a>
        </span>
      </div>
      <div class="scaleaki-info-row">
        <span class="scaleaki-info-label">Links:</span>
        <div style="display:flex;gap:4px;">
          <a href="\${adData.libraryUrl}" target="_blank" class="scaleaki-info-value">🔗 Ver Biblioteca</a>
        </div>
      </div>
      <div class="scaleaki-info-row" style="margin-top:4px;">
        <span class="scaleaki-info-label">Pesquisa Rápida:</span>
        <div style="display:flex;gap:4px;flex-direction:column;align-items:flex-end;">
          <a href="https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=BR&q=\${encodeURIComponent(adData.pageName)}&search_type=page" target="_blank" class="scaleaki-info-value">🔍 Buscar por Página</a>
          <a href="https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=BR&q=\${encodeURIComponent(siteDomain)}&search_type=keyword_exact_phrase" target="_blank" class="scaleaki-info-value">🔍 Buscar por Site</a>
        </div>
      </div>
    </div>
  \`;

  cardNode.appendChild(toolkit);

  // Lógica dos Botões
  
  // Download Button
  toolkit.querySelector(\`#btn-download-\${adData.id}\`).addEventListener('click', () => {
    // Recaptura mídias no momento do clique, caso o vídeo tenha carregado depois
    const freshData = extractAdData(cardNode);
    if (freshData.mediaUrls.length === 0) {
      showToast('Nenhum criativo (vídeo/imagem) encontrado neste anúncio.', true);
      return;
    }

    const mainMedia = freshData.mediaUrls[0];
    const extension = mainMedia.type === 'video' ? 'mp4' : 'jpg';
    const filename = \`scaleaki_\${freshData.id}_\${new Date().getTime()}.\${extension}\`;

    showToast('Iniciando download do criativo...');
    
    chrome.runtime.sendMessage({
      action: 'download_media',
      payload: { url: mainMedia.url, filename }
    }, (response) => {
      if (!response.success) showToast('Erro no download.', true);
    });
  });

  // Details Button Toggle
  toolkit.querySelector(\`#btn-details-\${adData.id}\`).addEventListener('click', () => {
    const panel = toolkit.querySelector(\`#panel-\${adData.id}\`);
    panel.classList.toggle('active');
  });

  // Save to Dashboard Button
  toolkit.querySelector(\`#btn-save-\${adData.id}\`).addEventListener('click', (e) => {
    const btn = e.target;
    const originalText = btn.innerText;
    btn.innerText = 'Salvando...';
    btn.disabled = true;

    // Recalcula dados frescos
    const payload = extractAdData(cardNode);
    
    // Formata pro backend esperar
    const backendData = {
      fbAdId: payload.id || \`ext_\${Date.now()}\`,
      pageName: payload.pageName,
      adCopy: payload.adCopy,
      adHeadline: payload.pageName, // Fallback
      adSnapshotUrl: payload.mediaUrls[0]?.url || null,
      destinationUrl: payload.destinationUrl,
      duplicatas: 1,
      isActive: true,
      deliveryStartTime: new Date().toISOString()
    };

    chrome.runtime.sendMessage({
      action: 'save_to_scaleaki',
      payload: backendData
    }, (response) => {
      btn.innerText = originalText;
      btn.disabled = false;
      
      if (response && response.success) {
        showToast('Oferta salva no seu Dashboard!');
        btn.style.background = '#064e3b';
        btn.innerText = '✅ SALVO';
      } else {
        showToast(response?.error || 'Erro ao salvar. Verifique se você está logado no Scaleaki.', true);
      }
    });
  });
}

// Observer para detectar novos cards
const observer = new MutationObserver((mutations) => {
  // Heurística: procurar divs que possuam "ID da biblioteca" dentro
  const cards = document.querySelectorAll('div.x1yztbdb > div.x1n2onr6');
  // Seletionador genérico focado na estrutura de colunas do Ad Library
  
  // Vamos buscar por texto
  const allDivs = document.querySelectorAll('div');
  allDivs.forEach(div => {
    if (div.innerText && div.innerText.includes('ID da biblioteca') && div.innerText.includes('Detalhes do anúncio')) {
      // É um card pai! Pega o elemento container
      const card = div.closest('.xh8yej3') || div.parentElement;
      if (card && !card.dataset.scaleakiInjected) {
        injectToolkit(card);
      }
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });

// Primeira checagem
setTimeout(() => {
  const allDivs = document.querySelectorAll('div');
  allDivs.forEach(div => {
    if (div.innerText && div.innerText.includes('ID da biblioteca') && div.innerText.includes('Detalhes do anúncio')) {
      const card = div.closest('.xh8yej3') || div.parentElement;
      if (card && !card.dataset.scaleakiInjected) {
        injectToolkit(card);
      }
    }
  });
}, 2000);
