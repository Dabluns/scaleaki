document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('auth-status');
  const mainText = document.getElementById('main-text');
  const mainBtn = document.getElementById('main-btn');

  // Verifica se já estamos na aba da biblioteca de anúncios
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab && activeTab.url && activeTab.url.includes('facebook.com/ads/library')) {
      mainText.innerHTML = '✨ <strong>O Toolkit está ativo nesta página!</strong><br><br>Role para baixo e você verá os painéis de ferramentas injetados abaixo de cada anúncio.';
      mainBtn.style.display = 'none';
    }
  });

  // Status real de auth/plano (lê cookie do scaleaki.site via background).
  statusEl.textContent = 'Verificando conexão...';
  chrome.runtime.sendMessage({ action: 'get_auth_status' }, (resp) => {
    if (!resp || !resp.loggedIn) {
      statusEl.innerHTML = '🔒 Não conectado. <a href="https://scaleaki.site/auth" target="_blank" style="color:#22c55e">Fazer login</a>';
      statusEl.className = 'status logged-out';
      return;
    }
    if (resp.paid) {
      statusEl.textContent = '✅ Conectado — Plano ' + (resp.tier || 'pago').toUpperCase();
      statusEl.className = 'status logged-in';
    } else {
      statusEl.innerHTML = '⚠️ Conectado (Free) — garimpo liberado, download é pago. <a href="https://scaleaki.site/checkout" target="_blank" style="color:#22c55e">Assinar</a>';
      statusEl.className = 'status logged-out';
    }
  });
});
