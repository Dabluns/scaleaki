document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('auth-status');
  
  // Modo de Teste: Sempre conectado
  statusEl.textContent = '✅ Modo de Teste: Conectado';
  statusEl.className = 'status logged-in';
});
