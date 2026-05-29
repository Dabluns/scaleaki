// ═══════════════════════════════════════════════════════════
//  Scaleaki Toolkit — Content Script v3.0
//  Inspirado no layout "Swipe Offers Spy"
// ═══════════════════════════════════════════════════════════

'use strict';

// ── Estado Global ────────────────────────────────────────────
let state = {
  isActive: false,       // Spy ativo?
  autoScroll: false,     // Auto-scroll ativo?
  minDuplicatas: 2,      // Mínimo de duplicatas
  minDias: 0,            // Mínimo de dias ativo
  apenasAtivos: true,
  apenasVideos: false,
  totalProcessed: 0,
  totalVisible: 0,
  totalHidden: 0,
  selectedAds: new Set(), // IDs selecionados para download
  autoScrollTimer: null,
};

// ── Utilitários ───────────────────────────────────────────────
function calcDias(startText) {
  const months = {jan:0,fev:1,mar:2,abr:3,mai:4,jun:5,jul:6,ago:7,set:8,out:9,nov:10,dez:11,
                  jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
  try {
    const clean = startText.toLowerCase().replace(/de\s/g, '').trim();
    const parts = clean.split(/\s+/);
    const day = parseInt(parts[0]);
    const month = months[parts[1]?.substring(0,3)] ?? 0;
    const year = parseInt(parts[parts.length - 1]);
    if (isNaN(day) || isNaN(year)) return 0;
    const date = new Date(year, month, day);
    return Math.floor((Date.now() - date.getTime()) / 86400000);
  } catch { return 0; }
}

function extractCard(cardNode) {
  const text = cardNode.innerText || '';
  const idMatch = text.match(/(?:Identificação|ID)\s+da\s+biblioteca\s*(?:de\s*anúncios)?:\s*(\d+)/i);
  const dupMatch = text.match(/(\d+)\s+anúncios?\s+usam/i);
  const dateMatch = text.match(/(?:Veiculação iniciada em|Started running on)\s+(.+)/i);
  const hasVideo = !!cardNode.querySelector('video');

  const id = idMatch?.[1] || `ext_${Date.now()}`;
  const duplicatas = dupMatch ? parseInt(dupMatch[1]) : 1;
  const dias = dateMatch ? calcDias(dateMatch[1].split('\n')[0]) : 0;
  const isActive = !text.toLowerCase().includes('encerrado') && !text.toLowerCase().includes('inactive');

  let pageName = 'Desconhecido';
  const pageLinks = cardNode.querySelectorAll('a[href*="facebook.com/"], a[href*="instagram.com/"]');
  for (const link of pageLinks) {
    if (link.innerText?.trim().length > 1 && !link.querySelector('img')) {
      pageName = link.innerText.trim();
      break;
    }
  }

  return { id, duplicatas, dias, isActive, hasVideo, pageName };
}

function passesFilter(data) {
  if (state.apenasAtivos && !data.isActive) return false;
  if (state.apenasVideos && !data.hasVideo) return false;
  if (data.duplicatas < state.minDuplicatas) return false;
  if (state.minDias > 0 && data.dias < state.minDias) return false;
  return true;
}

function showToast(msg, isError = false) {
  let t = document.getElementById('sk-toast');
  if (!t) { t = document.createElement('div'); t.id = 'sk-toast'; document.body.appendChild(t); }
  t.className = `sk-toast ${isError ? 'sk-toast-error' : ''}`;
  t.textContent = msg;
  t.classList.add('sk-toast-show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('sk-toast-show'), 3000);
}

// ── Injetar Barra no Card ─────────────────────────────────────
function injectCardBar(cardNode, data) {
  if (cardNode.querySelector('.sk-card-bar')) return;

  const bar = document.createElement('div');
  bar.className = 'sk-card-bar';
  bar.dataset.adId = data.id;

  const isSelected = state.selectedAds.has(data.id);

  bar.innerHTML = `
    <div class="sk-card-bar-left">
      <div class="sk-checkbox ${isSelected ? 'sk-checkbox-active' : ''}" data-id="${data.id}" title="Selecionar"></div>
      <span class="sk-lib-id">ID: ${data.id}</span>
    </div>
    <div class="sk-card-bar-right">
      <span class="sk-dias-badge">${data.dias > 0 ? `${data.dias} dias ativos` : 'Novo'}</span>
      <span class="sk-dup-badge" title="Duplicatas">${data.duplicatas}x</span>
      <button class="sk-icon-btn sk-btn-dl" data-id="${data.id}" title="Baixar criativo">⬇</button>
      <button class="sk-icon-btn sk-btn-save" data-id="${data.id}" title="Salvar no Scaleaki">★</button>
    </div>
  `;

  // Inserir no topo do card
  cardNode.style.position = 'relative';
  cardNode.insertBefore(bar, cardNode.firstChild);

  // Checkbox toggle
  bar.querySelector('.sk-checkbox').addEventListener('click', (e) => {
    e.stopPropagation();
    const id = e.currentTarget.dataset.id;
    if (state.selectedAds.has(id)) {
      state.selectedAds.delete(id);
      e.currentTarget.classList.remove('sk-checkbox-active');
    } else {
      state.selectedAds.add(id);
      e.currentTarget.classList.add('sk-checkbox-active');
    }
    updateBottomBar();
  });

  // Download individual
  bar.querySelector('.sk-btn-dl').addEventListener('click', (e) => {
    e.stopPropagation();
    const adData = extractCard(cardNode);
    openDownloadModal([{ cardNode, data: adData }]);
  });

  // Salvar no Scaleaki
  bar.querySelector('.sk-btn-save').addEventListener('click', (e) => {
    e.stopPropagation();
    const adData = extractCard(cardNode);
    openSaveModal(adData, cardNode);
  });
}

// ── Aplicar filtro visual no card ─────────────────────────────
function applyCardFilter(cardNode, data) {
  const passes = passesFilter(data);

  if (state.isActive) {
    if (passes) {
      cardNode.style.removeProperty('display');
      cardNode.classList.add('sk-card-highlight');
      state.totalVisible++;
    } else {
      cardNode.style.display = 'none';
      cardNode.classList.remove('sk-card-highlight');
      state.totalHidden++;
    }
  } else {
    cardNode.style.removeProperty('display');
    cardNode.classList.remove('sk-card-highlight');
  }
}

// ── Processar todos os cards ──────────────────────────────────
function processAllCards() {
  if (state.isActive) {
    state.totalProcessed = 0;
    state.totalVisible = 0;
    state.totalHidden = 0;
  }

  const leaves = Array.from(document.querySelectorAll('span, div')).filter(el => {
    return el.childElementCount === 0 &&
      el.innerText &&
      el.innerText.match(/(?:ID|Identificação)\s+da\s+biblioteca\s*(?:de\s*anúncios)?:\s*\d+/i);
  });

  leaves.forEach(leaf => {
    if (leaf.dataset.skMarked) return;
    leaf.dataset.skMarked = 'true';

    let card = leaf.parentElement;
    while (card && card.tagName !== 'BODY') {
      const text = card.innerText || '';
      if (text.includes('Patrocinado') && (text.includes('Ver resumo') || text.includes('Ver detalhes') || text.includes('See summary'))) break;
      card = card.parentElement;
    }
    if (!card || card.tagName === 'BODY') return;
    if (card.dataset.skProcessed) return;
    card.dataset.skProcessed = 'true';

    const data = extractCard(card);
    state.totalProcessed++;

    injectCardBar(card, data);
    applyCardFilter(card, data);
  });

  updateStatsPanel();
  updateBottomBar();
}

// ── Painel Lateral Direito ────────────────────────────────────
function injectSidePanel() {
  if (document.getElementById('sk-panel')) return;

  const panel = document.createElement('div');
  panel.id = 'sk-panel';
  panel.className = 'sk-panel';

  panel.innerHTML = `
    <div class="sk-panel-header">
      <div class="sk-panel-logo">scale<span>aki</span></div>
      <div class="sk-panel-subtitle">Ad Spy Toolkit</div>
    </div>

    <div class="sk-panel-body">
      <!-- Filtros numéricos -->
      <div class="sk-filter-group">
        <label class="sk-filter-label">Número de Anúncios (mín.)</label>
        <div class="sk-counter">
          <button class="sk-counter-btn" id="sk-dup-minus">−</button>
          <span class="sk-counter-val" id="sk-dup-val">${state.minDuplicatas}</span>
          <button class="sk-counter-btn" id="sk-dup-plus">+</button>
        </div>
      </div>

      <div class="sk-filter-group">
        <label class="sk-filter-label">Tempo de Ativo (dias)</label>
        <div class="sk-counter">
          <button class="sk-counter-btn" id="sk-days-minus">−</button>
          <span class="sk-counter-val" id="sk-days-val">${state.minDias}</span>
          <button class="sk-counter-btn" id="sk-days-plus">+</button>
        </div>
      </div>

      <!-- Toggles -->
      <div class="sk-toggle-row">
        <span class="sk-toggle-label">Apenas Ativos</span>
        <label class="sk-toggle"><input type="checkbox" id="sk-tog-active" ${state.apenasAtivos ? 'checked' : ''}><span class="sk-toggle-slider"></span></label>
      </div>
      <div class="sk-toggle-row">
        <span class="sk-toggle-label">Apenas Vídeos</span>
        <label class="sk-toggle"><input type="checkbox" id="sk-tog-videos" ${state.apenasVideos ? 'checked' : ''}><span class="sk-toggle-slider"></span></label>
      </div>
      <div class="sk-toggle-row">
        <span class="sk-toggle-label">Auto-Scroll</span>
        <label class="sk-toggle"><input type="checkbox" id="sk-tog-scroll"><span class="sk-toggle-slider"></span></label>
      </div>

      <!-- Botão principal -->
      <button class="sk-btn-spy" id="sk-btn-spy">▶ Iniciar Spy</button>

      <!-- Stats -->
      <div class="sk-stats" id="sk-stats" style="display:none">
        <div class="sk-stat sk-stat-green"><span id="sk-stat-processed">0</span><small>Processados</small></div>
        <div class="sk-stat sk-stat-emerald"><span id="sk-stat-visible">0</span><small>Visíveis</small></div>
        <div class="sk-stat sk-stat-red"><span id="sk-stat-hidden">0</span><small>Ocultos</small></div>
      </div>

      <!-- Atalhos -->
      <button class="sk-btn-shortcuts" id="sk-btn-shortcuts">🔍 Mostrar Atalhos</button>
    </div>
  `;

  document.body.appendChild(panel);
  bindPanelEvents();
}

function bindPanelEvents() {
  // Contadores
  document.getElementById('sk-dup-minus').onclick = () => {
    state.minDuplicatas = Math.max(1, state.minDuplicatas - 1);
    document.getElementById('sk-dup-val').textContent = state.minDuplicatas;
  };
  document.getElementById('sk-dup-plus').onclick = () => {
    state.minDuplicatas++;
    document.getElementById('sk-dup-val').textContent = state.minDuplicatas;
  };
  document.getElementById('sk-days-minus').onclick = () => {
    state.minDias = Math.max(0, state.minDias - 1);
    document.getElementById('sk-days-val').textContent = state.minDias;
  };
  document.getElementById('sk-days-plus').onclick = () => {
    state.minDias++;
    document.getElementById('sk-days-val').textContent = state.minDias;
  };

  // Toggles
  document.getElementById('sk-tog-active').onchange = (e) => { state.apenasAtivos = e.target.checked; };
  document.getElementById('sk-tog-videos').onchange = (e) => { state.apenasVideos = e.target.checked; };
  document.getElementById('sk-tog-scroll').onchange = (e) => { toggleAutoScroll(e.target.checked); };

  // Spy Button
  document.getElementById('sk-btn-spy').onclick = toggleSpy;

  // Atalhos
  document.getElementById('sk-btn-shortcuts').onclick = openShortcutsModal;
}

function updateStatsPanel() {
  const statsEl = document.getElementById('sk-stats');
  if (!statsEl) return;
  if (state.isActive) {
    statsEl.style.display = 'flex';
    document.getElementById('sk-stat-processed').textContent = state.totalProcessed;
    document.getElementById('sk-stat-visible').textContent = state.totalVisible;
    document.getElementById('sk-stat-hidden').textContent = state.totalHidden;
  } else {
    statsEl.style.display = 'none';
  }
}

function toggleSpy() {
  state.isActive = !state.isActive;
  const btn = document.getElementById('sk-btn-spy');
  if (!btn) return;

  if (state.isActive) {
    btn.textContent = '⏹ Parar Spy';
    btn.classList.add('sk-btn-spy-active');
    // Re-processar todos os cards com novos filtros
    document.querySelectorAll('[data-sk-processed]').forEach(c => {
      delete c.dataset.skProcessed;
      const bar = c.querySelector('.sk-card-bar');
      if (bar) bar.remove();
    });
    document.querySelectorAll('[data-sk-marked]').forEach(l => delete l.dataset.skMarked);
    processAllCards();
  } else {
    btn.textContent = '▶ Iniciar Spy';
    btn.classList.remove('sk-btn-spy-active');
    // Mostrar todos os cards novamente
    document.querySelectorAll('[data-sk-processed]').forEach(c => {
      c.style.removeProperty('display');
      c.classList.remove('sk-card-highlight');
    });
    updateStatsPanel();
  }
}

// ── Auto Scroll ───────────────────────────────────────────────
function toggleAutoScroll(active) {
  state.autoScroll = active;
  if (active) {
    state.autoScrollTimer = setInterval(() => {
      window.scrollBy({ top: 600, behavior: 'smooth' });
    }, 1800);
    showToast('Auto-scroll ativado!');
  } else {
    clearInterval(state.autoScrollTimer);
    showToast('Auto-scroll pausado.');
  }
}

// ── Bottom Bar de Seleção ─────────────────────────────────────
function injectBottomBar() {
  if (document.getElementById('sk-bottom-bar')) return;
  const bar = document.createElement('div');
  bar.id = 'sk-bottom-bar';
  bar.className = 'sk-bottom-bar';
  bar.innerHTML = `
    <div class="sk-bottom-left">
      <span class="sk-bottom-logo">scale<span>aki</span></span>
      <button class="sk-bottom-btn-outline" id="sk-btn-top">↑ Topo</button>
    </div>
    <div class="sk-bottom-right" id="sk-selection-area" style="display:none">
      <span id="sk-selected-count">0 anúncios selecionados</span>
      <button class="sk-btn-download-all" id="sk-btn-download-all">⬇ Baixar Todos</button>
    </div>
  `;
  document.body.appendChild(bar);

  document.getElementById('sk-btn-top').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  document.getElementById('sk-btn-download-all').onclick = () => {
    const selected = Array.from(state.selectedAds);
    if (!selected.length) return;
    const items = selected.map(id => {
      const bar = document.querySelector(`.sk-card-bar[data-ad-id="${id}"]`);
      const card = bar?.parentElement;
      return card ? { cardNode: card, data: extractCard(card) } : null;
    }).filter(Boolean);
    openDownloadModal(items);
  };
}

function updateBottomBar() {
  const area = document.getElementById('sk-selection-area');
  const count = document.getElementById('sk-selected-count');
  if (!area || !count) return;
  if (state.selectedAds.size > 0) {
    area.style.display = 'flex';
    count.textContent = `${state.selectedAds.size} anúncio(s) selecionado(s)`;
  } else {
    area.style.display = 'none';
  }
}

// ── Modal de Download ─────────────────────────────────────────
function openDownloadModal(items) {
  const existing = document.getElementById('sk-dl-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'sk-dl-modal';
  overlay.className = 'sk-modal-overlay';

  overlay.innerHTML = `
    <div class="sk-modal">
      <div class="sk-modal-header">
        <h3>Download em Lote</h3>
        <button class="sk-modal-close" id="sk-dl-close">&times;</button>
      </div>
      <div class="sk-modal-body">
        <p class="sk-modal-sub">${items.length} anúncio(s) selecionado(s)</p>
        <label class="sk-check-option">
          <input type="checkbox" id="sk-dl-media" checked>
          <span>Mídia do anúncio (vídeo/imagem)</span>
        </label>
        <label class="sk-check-option">
          <input type="checkbox" id="sk-dl-zip">
          <span>Compactar em ZIP</span>
        </label>
      </div>
      <div class="sk-modal-footer">
        <button class="sk-btn-confirm" id="sk-dl-confirm">⬇ Iniciar Download</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector('#sk-dl-close').onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  overlay.querySelector('#sk-dl-confirm').onclick = () => {
    overlay.remove();
    items.forEach((item, i) => {
      const imgs = Array.from(item.cardNode.querySelectorAll('img')).filter(img => img.width > 100);
      const vids = Array.from(item.cardNode.querySelectorAll('video'));
      const medias = [...vids.map(v => ({ url: v.src, type: 'video' })), ...imgs.map(img => ({ url: img.src, type: 'image' }))];
      medias.forEach((m, j) => {
        const ext = m.type === 'video' ? 'mp4' : 'jpg';
        const filename = `scaleaki_${item.data.id}_${j}.${ext}`;
        setTimeout(() => {
          if (m.url) chrome.runtime.sendMessage({ action: 'download_media', url: m.url, filename });
        }, (i * medias.length + j) * 600);
      });
    });
    showToast(`Download iniciado para ${items.length} anúncio(s)!`);
  };
}

// ── Modal de Salvar ───────────────────────────────────────────
function openSaveModal(adData, cardNode) {
  const existing = document.getElementById('sk-save-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'sk-save-modal';
  overlay.className = 'sk-modal-overlay';

  overlay.innerHTML = `
    <div class="sk-modal">
      <div class="sk-modal-header">
        <h3>Salvar no Scaleaki</h3>
        <button class="sk-modal-close" id="sk-save-close">&times;</button>
      </div>
      <div class="sk-modal-body">
        <div class="sk-input-group">
          <label>Nome da Oferta *</label>
          <input type="text" id="sk-save-name" value="${adData.pageName}" placeholder="Ex: Protocolo Zero Dor">
        </div>
        <div class="sk-input-group">
          <label>Nicho *</label>
          <select id="sk-save-niche">
            <option value="">Selecione</option>
            <option>Saúde e Bem-estar</option>
            <option>Renda Extra / Finanças</option>
            <option>Beleza e Estética</option>
            <option>Relacionamento</option>
            <option>Outros</option>
          </select>
        </div>
        <div class="sk-input-group">
          <label>Tecnologia/Checkout</label>
          <input type="text" id="sk-save-tech" placeholder="Ex: Kiwify, Shopify...">
        </div>
      </div>
      <div class="sk-modal-footer">
        <button class="sk-btn-confirm" id="sk-save-confirm">Adicionar Oferta</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector('#sk-save-close').onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  overlay.querySelector('#sk-save-confirm').onclick = () => {
    const name = document.getElementById('sk-save-name').value;
    const niche = document.getElementById('sk-save-niche').value;
    if (!name || !niche) { showToast('Preencha nome e nicho!', true); return; }

    const btn = overlay.querySelector('#sk-save-confirm');
    btn.textContent = 'Salvando...';
    btn.disabled = true;

    chrome.runtime.sendMessage({
      action: 'save_to_scaleaki',
      payload: {
        fbAdId: adData.id,
        pageName: name,
        adCopy: adData.adCopy || '',
        destinationUrl: adData.destinationUrl || '',
        duplicatas: adData.duplicatas,
        isActive: adData.isActive,
        tecnologia: document.getElementById('sk-save-tech').value,
        deliveryStartTime: new Date().toISOString(),
      }
    }, (response) => {
      overlay.remove();
      if (response?.success) {
        showToast('✅ Oferta salva com sucesso!');
        const bar = cardNode?.querySelector('.sk-card-bar');
        if (bar) bar.classList.add('sk-card-bar-saved');
      } else {
        showToast('❌ ' + (response?.error || 'Erro ao salvar.'), true);
      }
    });
  };
}

// ── Modal de Atalhos ──────────────────────────────────────────
const SHORTCUTS = {
  'Saúde': ['emagrecer', 'diabetes', 'dor nas costas', 'pressão alta', 'colesterol', 'memória', 'visão', 'sono'],
  'Dinheiro': ['renda extra', 'trabalhar em casa', 'investir', 'bitcoin', 'dropshipping', 'freelancer'],
  'Beleza': ['pele', 'cabelo', 'rugas', 'estrias', 'celulite', 'manchas', 'unhas'],
  'Relacionamento': ['reconquistar', 'ciúmes', 'ex', 'casamento', 'sedução', 'timidez'],
  'Drop': ['produto viral', 'tendência', 'frete grátis', 'kit', 'brinde'],
};

function openShortcutsModal() {
  const existing = document.getElementById('sk-shortcuts-modal');
  if (existing) { existing.remove(); return; }

  const overlay = document.createElement('div');
  overlay.id = 'sk-shortcuts-modal';
  overlay.className = 'sk-modal-overlay';

  const tabsHtml = Object.keys(SHORTCUTS).map(cat =>
    `<button class="sk-tab" data-cat="${cat}">${cat}</button>`
  ).join('');

  const allKeywords = Object.entries(SHORTCUTS).map(([cat, kws]) => `
    <div class="sk-shortcut-group" data-group="${cat}">
      ${kws.map(kw => `<button class="sk-shortcut-kw" data-kw="${kw}">${kw}</button>`).join('')}
    </div>
  `).join('');

  overlay.innerHTML = `
    <div class="sk-modal sk-modal-wide">
      <div class="sk-modal-header">
        <h3>🔍 Atalhos de Pesquisa</h3>
        <button class="sk-modal-close" id="sk-sh-close">&times;</button>
      </div>
      <div class="sk-modal-body">
        <div class="sk-tabs">${tabsHtml}</div>
        <div class="sk-shortcut-groups">${allKeywords}</div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector('#sk-sh-close').onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  // Tabs
  const tabs = overlay.querySelectorAll('.sk-tab');
  const groups = overlay.querySelectorAll('.sk-shortcut-group');
  tabs[0]?.classList.add('sk-tab-active');

  const showGroup = (cat) => {
    tabs.forEach(t => t.classList.toggle('sk-tab-active', t.dataset.cat === cat));
    groups.forEach(g => g.style.display = g.dataset.group === cat ? 'flex' : 'none');
  };
  showGroup(Object.keys(SHORTCUTS)[0]);

  tabs.forEach(t => t.onclick = () => showGroup(t.dataset.cat));

  // Keywords — cola no search input do Facebook
  overlay.querySelectorAll('.sk-shortcut-kw').forEach(btn => {
    btn.onclick = () => {
      const kw = btn.dataset.kw;
      const fbInput = document.querySelector('input[placeholder*="Pesquisar"], input[type="search"]');
      if (fbInput) {
        fbInput.focus();
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(fbInput, kw);
        fbInput.dispatchEvent(new Event('input', { bubbles: true }));
        overlay.remove();
        showToast(`Pesquisando: "${kw}"`);
      } else {
        navigator.clipboard.writeText(kw).then(() => showToast(`"${kw}" copiado!`));
      }
    };
  });
}

// ── Observer Principal ────────────────────────────────────────
const observer = new MutationObserver(() => processAllCards());

// ── Boot ──────────────────────────────────────────────────────
setTimeout(() => {
  injectSidePanel();
  injectBottomBar();
  observer.observe(document.body, { childList: true, subtree: true });
  processAllCards();
}, 1500);
