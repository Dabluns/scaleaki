document.addEventListener('DOMContentLoaded', () => {
  const apiUrlInput = document.getElementById('apiUrl');
  const tokenInput = document.getElementById('token');
  const toggleBtn = document.getElementById('toggleBtn');
  const statusDiv = document.getElementById('status');

  // Load saved settings
  chrome.storage.local.get(['apiUrl', 'token', 'isMining'], (data) => {
    if (data.apiUrl) apiUrlInput.value = data.apiUrl;
    if (data.token) tokenInput.value = data.token;
    
    if (data.isMining) {
      setMiningState(true);
    }
  });

  function setMiningState(active) {
    if (active) {
      toggleBtn.textContent = 'Parar Mineração';
      toggleBtn.className = 'mining';
      statusDiv.textContent = '● Sugando anúncios da tela...';
      statusDiv.className = 'status active';
    } else {
      toggleBtn.textContent = 'Iniciar Mineração';
      toggleBtn.className = '';
      statusDiv.textContent = 'Aguardando início...';
      statusDiv.className = 'status';
    }
  }

  toggleBtn.addEventListener('click', () => {
    chrome.storage.local.get(['isMining'], (data) => {
      const isMining = !data.isMining;
      const apiUrl = apiUrlInput.value.trim();
      const token = tokenInput.value.trim();

      if (isMining && (!apiUrl || !token)) {
        alert('Por favor, preencha a URL da API e o Token do Scaleaki.');
        return;
      }

      chrome.storage.local.set({ isMining, apiUrl, token }, () => {
        setMiningState(isMining);
        
        // Notify content script
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs[0] && tabs[0].url.includes("facebook.com/ads/library")) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "toggleMining", isMining, apiUrl, token });
          } else if (isMining) {
            statusDiv.textContent = 'Abra a Biblioteca de Anúncios!';
            statusDiv.className = 'status';
          }
        });
      });
    });
  });
});
