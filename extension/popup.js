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

  // Modo de Teste: Sempre conectado
  statusEl.textContent = '✅ Modo de Teste: Conectado';
  statusEl.className = 'status logged-in';
});
