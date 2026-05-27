chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // O Facebook tem bloqueios severos contra injeção no Main World e Monkey-patching
  // de XMLHttpRequest/fetch, o que estava causando o React Error #185 (Loop de renderização).
  // Portanto, a injeção de rede foi desativada.
});
