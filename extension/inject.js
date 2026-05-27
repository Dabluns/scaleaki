(function() {
  // Evita injetar duas vezes se a extensão rodar de novo na mesma aba
  if (window.__scaleaki_injected) return;
  window.__scaleaki_injected = true;

  console.log('[Scaleaki] 🕵️‍♂️ Injector de rede INVISÍVEL inicializado com sucesso (Main World)!');

  // Interceptar FETCH
  const origFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await origFetch.apply(this, args);
    const url = args[0] instanceof Request ? args[0].url : args[0];
    
    if (url && url.includes('/api/graphql/')) {
      const clone = response.clone();
      clone.text().then(text => processFacebookGraphQL(text));
    }
    return response;
  };

  // Interceptar XMLHttpRequest
  const origXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function() {
    const xhr = new origXHR();
    const origOpen = xhr.open;
    const origSend = xhr.send;

    let requestUrl = '';

    xhr.open = function(method, url) {
      requestUrl = url;
      return origOpen.apply(this, arguments);
    };

    xhr.send = function() {
      this.addEventListener('load', function() {
        if (requestUrl && requestUrl.includes('/api/graphql/')) {
          processFacebookGraphQL(this.responseText);
        }
      });
      return origSend.apply(this, arguments);
    };
    return xhr;
  };

  function processFacebookGraphQL(text) {
    if (!text) return;
    try {
      // O Facebook frequentemente usa JSONL (linhas de JSON separadas)
      const lines = text.split('\n');
      for (let line of lines) {
        if (!line.trim()) continue;
        const json = JSON.parse(line);
        
        if (json?.data?.ad_library_main?.search_results?.edges) {
          const edges = json.data.ad_library_main.search_results.edges;
          if (edges.length > 0) {
            console.log(`[Scaleaki] Capturado payload GraphQL com ${edges.length} anúncios!`);
            window.dispatchEvent(new CustomEvent('ScaleakiAdsCaptured', { detail: edges }));
          }
        }
      }
    } catch(e) {}
  }
})();
