chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'download_media') {
    const { url, filename } = request.payload;
    chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error("Erro no download:", chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, downloadId });
      }
    });
    return true; // Keep message channel open for async response
  }

  if (request.action === 'save_to_scaleaki') {
    const adData = request.payload;
    
    // Modo de Teste: ignora cookies e manda direto para a API em live sem token
    sendAdToApi(adData, 'test-token', 'http://scaleaki.site:4000/api/fb-ads/user-save', sendResponse);
    
    return true; // Keep message channel open
  }

  if (request.action === 'download_media') {
    const url = request.url;
    const filename = request.filename || 'scaleaki_criativo';
    
    chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, downloadId });
      }
    });

    return true;
  }
});

function sendAdToApi(adData, token, apiUrl, sendResponse) {
  fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ ad: adData })
  })
  .then(res => res.json().then(data => ({ status: res.status, data })))
  .then(({ status, data }) => {
    if (status >= 200 && status < 300) {
      sendResponse({ success: true, data });
    } else {
      sendResponse({ success: false, error: data.error || 'Erro ao salvar anúncio' });
    }
  })
  .catch(err => {
    sendResponse({ success: false, error: err.message });
  });
}
