// Scaleaki Content Script - Layout "Minerador"

let adsFoundCount = 0;
let isFilterActive = true; // Filtrar por padrão

function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = 'scaleaki-toast';
  toast.style.borderColor = isError ? '#ef4444' : '#22c55e';
  toast.innerHTML = `<span style="color: ${isError ? '#ef4444' : '#22c55e'}">${isError ? '❌' : '✅'}</span> ${message}`;
  
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Injetar a Barra Inferior Global
function injectBottomBar() {
  if (document.getElementById('scaleaki-bottom-bar')) return;

  const bar = document.createElement('div');
  bar.id = 'scaleaki-bottom-bar';
  bar.className = 'scaleaki-bottom-bar';
  
  bar.innerHTML = `
    <div class="scaleaki-bar-logo">scale<span>aki</span> Toolkit</div>
    <div class="scaleaki-bar-actions">
      <div class="scaleaki-toggle-wrapper">
        <label class="scaleaki-toggle">
          <input type="checkbox" id="scaleaki-toggle-filter" checked>
          <span class="scaleaki-slider"></span>
        </label>
        <span>Apenas Ofertas Escaladas</span>
      </div>
      <button class="scaleaki-bar-btn" id="scaleaki-btn-mine">
        <span>⚡</span> Salvar Visíveis
      </button>
      <button class="scaleaki-bar-btn" id="scaleaki-btn-top">
        <span>↑</span> Voltar ao topo
      </button>
      <div class="scaleaki-bar-counter">
        <strong id="scaleaki-counter">0</strong>
        <span>Ofertas Escaladas</span>
      </div>
    </div>
  `;

  document.body.appendChild(bar);

  document.getElementById('scaleaki-btn-top').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.getElementById('scaleaki-btn-mine').addEventListener('click', () => {
    showToast('Função de salvamento em lote em breve!');
  });

  document.getElementById('scaleaki-toggle-filter').addEventListener('change', (e) => {
    isFilterActive = e.target.checked;
    applyFiltersToAllCards();
  });
}

function updateCounter() {
  const counterEl = document.getElementById('scaleaki-counter');
  if (counterEl) {
    counterEl.innerText = adsFoundCount;
  }
}

function applyFiltersToAllCards() {
  const cards = document.querySelectorAll('.xh8yej3');
  cards.forEach(card => {
    if (card.dataset.scaleakiScaled === "false") {
      if (isFilterActive) {
        card.classList.add('scaleaki-hidden-ad');
      } else {
        card.classList.remove('scaleaki-hidden-ad');
      }
    }
  });
}

// Modal de Adicionar Biblioteca
function openSaveModal(adData) {
  const overlay = document.createElement('div');
  overlay.className = 'scaleaki-modal-overlay';
  overlay.id = 'scaleaki-modal';

  // Usamos o nome da página como sugestão pro Nome do Produto
  const defaultName = adData.pageName || '';

  // Renderizar Criativos
  let mediaHtml = '';
  if (adData.mediaUrls && adData.mediaUrls.length > 0) {
    const itemsHtml = adData.mediaUrls.map((m, i) => `
      <div class="scaleaki-media-item">
        <div class="scaleaki-media-type-badge">${m.type === 'video' ? '🎬' : '🖼️'}</div>
        ${m.type === 'video' ? `<video src="${m.url}" muted></video>` : `<img src="${m.url}">`}
        <div class="scaleaki-media-download" data-url="${m.url}" data-type="${m.type}" data-idx="${i}">⬇️ Baixar</div>
      </div>
    `).join('');

    mediaHtml = `
      <div class="scaleaki-media-section">
        <div class="scaleaki-media-header">
          <h4>Criativos Encontrados (${adData.mediaUrls.length})</h4>
          <div>
            <button id="scaleaki-btn-dl-main">Baixar Principal</button>
            <button id="scaleaki-btn-dl-all">Baixar Todos</button>
          </div>
        </div>
        <div class="scaleaki-media-grid">
          ${itemsHtml}
        </div>
      </div>
    `;
  }

  overlay.innerHTML = `
    <div class="scaleaki-modal">
      <div class="scaleaki-modal-header">
        <h3>Adicionando anúncio ao Scaleaki</h3>
        <button class="scaleaki-modal-close" id="scaleaki-modal-close">&times;</button>
      </div>
      <div class="scaleaki-modal-body">
        <div class="scaleaki-input-group">
          <label>Nome do Produto/Oferta *</label>
          <input type="text" id="scaleaki-input-name" value="${defaultName}" placeholder="Ex: Protocolo Zero Dor">
        </div>
        <div class="scaleaki-input-group">
          <label>Tecnologia/Checkout (Opcional)</label>
          <input type="text" id="scaleaki-input-tags" placeholder="Ex: Shopify, Kiwify...">
        </div>
        <div class="scaleaki-input-group">
          <label>Nicho *</label>
          <select id="scaleaki-input-category">
            <option value="">Selecione um nicho</option>
            <option value="Saúde">Saúde e Bem-estar</option>
            <option value="Dinheiro">Renda Extra / Finanças</option>
            <option value="Beleza">Beleza e Estética</option>
            <option value="Relacionamento">Relacionamento</option>
            <option value="Outros">Outros</option>
          </select>
        </div>
        ${mediaHtml}
      </div>
      <div class="scaleaki-modal-footer">
        <button id="scaleaki-btn-confirm-save">Adicionar Oferta</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeBtn = document.getElementById('scaleaki-modal-close');
  const confirmBtn = document.getElementById('scaleaki-btn-confirm-save');

  const closeModal = () => overlay.remove();
  
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Lógica de Download
  const triggerDownload = (url, type, index) => {
    const ext = type === 'video' ? 'mp4' : 'jpg';
    const filename = `scaleaki_${adData.id}_${index}.${ext}`;
    showToast('Iniciando download...');
    chrome.runtime.sendMessage({ action: 'download_media', url, filename });
  };

  if (adData.mediaUrls && adData.mediaUrls.length > 0) {
    document.querySelectorAll('.scaleaki-media-download').forEach(btn => {
      btn.addEventListener('click', (e) => {
        triggerDownload(e.target.dataset.url, e.target.dataset.type, e.target.dataset.idx);
      });
    });

    document.getElementById('scaleaki-btn-dl-main').addEventListener('click', () => {
      triggerDownload(adData.mediaUrls[0].url, adData.mediaUrls[0].type, 0);
    });

    document.getElementById('scaleaki-btn-dl-all').addEventListener('click', () => {
      adData.mediaUrls.forEach((m, i) => {
        setTimeout(() => triggerDownload(m.url, m.type, i), i * 500); // delay para não travar
      });
    });
  }

  confirmBtn.addEventListener('click', () => {
    const nameVal = document.getElementById('scaleaki-input-name').value;
    const catVal = document.getElementById('scaleaki-input-category').value;

    if (!nameVal || !catVal) {
      alert("Preencha o Nome e o Nicho para salvar!");
      return;
    }

    confirmBtn.innerText = 'Salvando...';
    confirmBtn.disabled = true;

    // Enviar para o background
    const payload = {
      fbAdId: adData.id || `ext_${Date.now()}`,
      pageName: nameVal, // Sobrescreve com o nome escolhido
      adCopy: adData.adCopy,
      adHeadline: adData.pageName, 
      adSnapshotUrl: adData.mediaUrls[0]?.url || null,
      destinationUrl: adData.destinationUrl,
      tecnologia: document.getElementById('scaleaki-input-tags').value, // Tags/Checkout
      nicho: catVal, // Campo fictício que pode ser add na DB depois
      duplicatas: adData.duplicatas,
      isActive: true,
      deliveryStartTime: new Date().toISOString() // No caso, salva a data de agora como inicio do track
    };

    chrome.runtime.sendMessage({
      action: 'save_to_scaleaki',
      payload: payload
    }, (response) => {
      closeModal();
      if (response && response.success) {
        showToast('Oferta salva com sucesso!');
        // Atualiza o botão no card original
        if (adData.btnElement) {
          adData.btnElement.style.background = '#064e3b';
          adData.btnElement.style.color = 'white';
          adData.btnElement.innerText = '✅ Analisado e Salvo';
        }
      } else {
        showToast(response?.error || 'Erro ao salvar.', true);
      }
    });
  });
}

// Funções de Extração (Reaproveitadas do código anterior)
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

function extractAdData(cardNode) {
  const data = { id: '', pageName: 'Desconhecido', adCopy: '', destinationUrl: '', mediaUrls: [], libraryUrl: '', duplicatas: 1, diasRodando: 0, isEscalado: false };

  const textContent = cardNode.innerText || '';
  
  // Extrair ID
  const idMatch = textContent.match(/(?:ID|Identificação)\s+da\s+biblioteca\s*(?:de\s*anúncios)?:\s*(\d+)/i);
  if (idMatch && idMatch[1]) {
    data.id = idMatch[1];
    data.libraryUrl = `https://www.facebook.com/ads/library/?id=${data.id}`;
  }

  // Extrair Duplicatas
  const dupMatch = textContent.match(/(\d+)\s+anúncios\s+usam/i);
  if (dupMatch && dupMatch[1]) {
    data.duplicatas = parseInt(dupMatch[1], 10);
  }

  // Extrair Dias Rodando (aproximado)
  const dateMatch = textContent.match(/(?:Veiculação iniciada em|Started running on)\s+(.+)/i);
  if (dateMatch && dateMatch[1]) {
    const rawDate = dateMatch[1].split('\n')[0]; // Pega a primeira linha
    data.diasRodando = calcDiasDesdeString(rawDate);
  }

  // Lógica de Escala (Mesma da API do Scaleaki)
  if (data.duplicatas >= 2 || data.diasRodando >= 4) {
    data.isEscalado = true;
  }

  const pageLinks = Array.from(cardNode.querySelectorAll('a[href*="facebook.com/"], a[href*="instagram.com/"]'));
  for (const link of pageLinks) {
    if (link.innerText && link.innerText.trim().length > 1 && !link.querySelector('img')) {
      data.pageName = link.innerText.trim();
      break;
    }
  }

  const divs = Array.from(cardNode.querySelectorAll('div'));
  const copyDiv = divs.find(d => d.dir === 'auto' && d.innerText && d.innerText.length > 20 && !d.innerText.includes('da biblioteca'));
  if (copyDiv) data.adCopy = copyDiv.innerText;

  const links = Array.from(cardNode.querySelectorAll('a'));
  const ctaLinks = links.filter(l => l.innerText && ['Saiba mais', 'Comprar', 'Baixar', 'Cadastre', 'Assinar', 'Learn more'].some(t => l.innerText.includes(t)));
  if (ctaLinks.length > 0) data.destinationUrl = cleanFacebookUrl(ctaLinks[0].href);
  else {
    const extLinks = links.filter(l => l.href && l.href.includes('l.facebook.com'));
    if (extLinks.length > 0) data.destinationUrl = cleanFacebookUrl(extLinks[extLinks.length - 1].href);
  }

  const videos = Array.from(cardNode.querySelectorAll('video'));
  videos.forEach(v => { if (v.src) data.mediaUrls.push({ type: 'video', url: v.src }); });

  const images = Array.from(cardNode.querySelectorAll('img'));
  images.forEach(img => { if (img.width > 100 && img.height > 100 && img.src) data.mediaUrls.push({ type: 'image', url: img.src }); });

  return data;
}

// Helper para dias rodando
function calcDiasDesdeString(dateString) {
  // Traduz meses pt pra en para o parse do JS funcionar ou usa lógica básica
  const months = {'jan':0,'fev':1,'mar':2,'abr':3,'mai':4,'jun':5,'jul':6,'ago':7,'set':8,'out':9,'nov':10,'dez':11};
  let d = new Date();
  try {
    const parts = dateString.toLowerCase().replace(' de ', ' ').split(' ');
    if (parts.length >= 3) {
      const day = parseInt(parts[0]);
      let monthStr = parts[1].substring(0,3);
      if (parts[1] === 'de') monthStr = parts[2].substring(0,3); // lida com "4 de mai"
      
      const month = months[monthStr] !== undefined ? months[monthStr] : new Date(Date.parse(monthStr +" 1, 2012")).getMonth();
      const year = parseInt(parts[parts.length - 1]);
      
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        d = new Date(year, month, day);
      }
    }
  } catch(e){}
  
  const diffTime = Math.abs(new Date() - d);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Injetar Botão Inline e Filtrar
function injectInlineButton(cardNode) {
  if (cardNode.dataset.scaleakiInjected) return;
  cardNode.dataset.scaleakiInjected = "true";

  const adData = extractAdData(cardNode);

  // Lógica de Ocultar Não-Escalados
  if (!adData.isEscalado) {
    cardNode.dataset.scaleakiScaled = "false";
    if (isFilterActive) {
      cardNode.classList.add('scaleaki-hidden-ad');
    }
    // Se não for escalado, nem insere botão e não conta no dashboard
    return;
  } else {
    cardNode.dataset.scaleakiScaled = "true";
  }

  adsFoundCount++;
  updateCounter();

  // Procurar o local ideal: logo abaixo de "Ver detalhes do anúncio" ou "Ver resumo"
  // O Facebook usa spans ou divs para o botão "Ver resumo". Vamos buscar ele.
  const allDivs = Array.from(cardNode.querySelectorAll('div, span'));
  const summaryBtn = allDivs.find(d => 
    (d.innerText === 'Ver resumo' || d.innerText === 'See summary details' || d.innerText === 'Detalhes do anúncio') && 
    d.offsetHeight > 10
  );

  const container = summaryBtn ? summaryBtn.closest('div[role="button"]') || summaryBtn.parentElement : cardNode;

  const btn = document.createElement('button');
  btn.className = 'scaleaki-inline-btn';
  btn.innerText = 'Analisar e Salvar';
  
  // Impede o clique de abrir o link do facebook por acidente
  btn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    adData.btnElement = btn; // pass reference
    openSaveModal(adData);
  };

  // Insere logo apos o botão de resumo
  if (container && container.parentElement) {
    // Insere o botão em uma div wrapper
    const wrapper = document.createElement('div');
    wrapper.style.padding = '0 12px 12px 12px'; // Match card padding
    wrapper.appendChild(btn);
    
    // Tenta inserir depois do container do "Ver resumo"
    container.parentElement.insertBefore(wrapper, container.nextSibling);
  } else {
    cardNode.appendChild(btn);
  }
}

// Observer Principal
const observer = new MutationObserver((mutations) => {
  // Procura pelo nó de texto exato (folha) que contém o ID da biblioteca
  const allLeafs = Array.from(document.querySelectorAll('span, div')).filter(el => {
    return el.childElementCount === 0 && 
           el.innerText && 
           el.innerText.match(/(?:ID|Identificação)\s+da\s+biblioteca\s*(?:de\s*anúncios)?:\s*\d+/i);
  });

  allLeafs.forEach(leaf => {
    if (leaf.dataset.scaleakiMarked) return;
    leaf.dataset.scaleakiMarked = "true";
    
    // Procura o card root (container pai de todo o anúncio)
    let card = leaf.closest('.xh8yej3'); 
    if (!card) {
      let parent = leaf.parentElement;
      // Sobe na árvore até achar o container grande que engloba o anúncio
      while(parent && parent.tagName === 'DIV' && parent.clientHeight < 400) {
        parent = parent.parentElement;
      }
      card = parent || leaf.parentElement;
    }
    
    if (card) {
      injectInlineButton(card);
    }
  });
});

// Boot
setTimeout(() => {
  injectBottomBar();
  observer.observe(document.body, { childList: true, subtree: true });
}, 1500);
