document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('auth-status');
  
  // Verifica se o usuário está logado
  chrome.cookies.get({ url: 'https://scaleaki.site', name: 'auth_token' }, (cookie) => {
    if (cookie) {
      statusEl.textContent = '✅ Conectado ao Scaleaki';
      statusEl.className = 'status logged-in';
    } else {
      // Fallback para localhost em dev
      chrome.cookies.get({ url: 'http://localhost:3000', name: 'auth_token' }, (localCookie) => {
        if (localCookie) {
          statusEl.textContent = '✅ Conectado ao Localhost';
          statusEl.className = 'status logged-in';
        } else {
          statusEl.innerHTML = '❌ Não conectado.<br><a href="https://scaleaki.site" target="_blank" style="color:#ef4444;text-decoration:underline;margin-top:4px;display:block;">Faça login na plataforma</a>';
          statusEl.className = 'status logged-out';
        }
      });
    }
  });
});
