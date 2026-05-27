chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Quando o usuário navega ou recarrega o Facebook Ad Library...
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('facebook.com/ads/library')) {
    
    // O pulo do gato do Manifest V3: world "MAIN"
    // Roda nosso script DIRETAMENTE na memória da página, como se fosse código do Facebook.
    // Isso burla o CSP bloqueante e não altera o HTML (O React não percebe).
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      world: "MAIN", 
      files: ["inject.js"]
    }).then(() => {
      console.log('[Scaleaki Background] Injector ninja inserido no Main World com sucesso.');
    }).catch(err => {
      console.error('[Scaleaki Background] Erro na injeção ninja:', err);
    });
  }
});
