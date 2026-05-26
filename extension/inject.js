(function() {
  const origFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await origFetch.apply(this, args);
    const url = args[0] instanceof Request ? args[0].url : args[0];
    
    // O FB Ad Library usa GraphQL para buscar os anúncios
    if (url && url.includes('/api/graphql/')) {
      const clone = response.clone();
      clone.text().then(text => {
        try {
          // As respostas do FB frequentemente vêm queadas por linha (JSONL)
          const lines = text.split('\n');
          for (let line of lines) {
            if (!line.trim()) continue;
            const json = JSON.parse(line);
            
            // Busca o array de anúncios no JSON
            if (json?.data?.ad_library_main?.search_results?.edges) {
              const edges = json.data.ad_library_main.search_results.edges;
              if (edges.length > 0) {
                // Envia para o content.js
                window.dispatchEvent(new CustomEvent('ScaleakiAdsCaptured', { detail: edges }));
              }
            }
          }
        } catch(e) {}
      });
    }
    return response;
  };
})();
