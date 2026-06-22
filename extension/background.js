// ── Config ────────────────────────────────────────────────────────────────
const API_BASE = 'https://scaleaki.site/api';
const COOKIE_URL = 'https://scaleaki.site';
const COOKIE_NAME = 'auth_token';

// Lê o token de auth real do cookie do domínio scaleaki (mesmo cookie do site).
function getAuthToken() {
  return new Promise((resolve) => {
    chrome.cookies.get({ url: COOKIE_URL, name: COOKIE_NAME }, (cookie) => {
      resolve(cookie && cookie.value ? cookie.value : null);
    });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'get_auth_status') {
    checkAuthStatus(sendResponse);
    return true;
  }

  if (request.action === 'save_to_scaleaki') {
    (async () => {
      const token = await getAuthToken();
      if (!token) {
        sendResponse({ success: false, error: 'not_authenticated', message: 'Faça login no scaleaki.site para garimpar.' });
        return;
      }
      sendAdToApi(request.payload, token, `${API_BASE}/fb-ads/user-save`, sendResponse);
    })();
    return true; // Keep message channel open
  }

  if (request.action === 'download_media') {
    (async () => {
      const token = await getAuthToken();
      if (!token) {
        sendResponse({ success: false, error: 'not_authenticated', message: 'Faça login no scaleaki.site para baixar criativos.' });
        return;
      }
      // Checa entitlement de download (exclusivo de plano pago) antes de baixar.
      const access = await fetchAccess(token);
      if (!access || !access.features?.extension_download?.allowed) {
        sendResponse({ success: false, error: 'feature_locked', message: 'Download de criativos é exclusivo do plano pago.' });
        return;
      }
      const url = request.url || (request.payload && request.payload.url);
      const filename = request.filename || (request.payload && request.payload.filename) || 'scaleaki_criativo';
      chrome.downloads.download({ url, filename, saveAs: false }, (downloadId) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ success: true, downloadId });
        }
      });
    })();
    return true;
  }
});

// ── Helpers ─────────────────────────────────────────────────────────────────

async function fetchAccess(token) {
  try {
    const res = await fetch(`${API_BASE}/account/access`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function checkAuthStatus(sendResponse) {
  (async () => {
    const token = await getAuthToken();
    if (!token) {
      sendResponse({ loggedIn: false });
      return;
    }
    const access = await fetchAccess(token);
    if (!access) {
      sendResponse({ loggedIn: false });
      return;
    }
    sendResponse({
      loggedIn: true,
      paid: !!access.paid,
      tier: access.tier,
      features: access.features || {},
    });
  })();
}

function sendAdToApi(adData, token, apiUrl, sendResponse) {
  fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ ad: adData }),
  })
    .then((res) => res.json().then((data) => ({ status: res.status, data })))
    .then(({ status, data }) => {
      if (status >= 200 && status < 300) {
        sendResponse({ success: true, data });
      } else if (status === 403 && data.error === 'feature_locked') {
        sendResponse({ success: false, error: 'feature_locked', message: data.message });
      } else if (status === 401) {
        sendResponse({ success: false, error: 'not_authenticated', message: 'Sessão expirada. Faça login no scaleaki.site.' });
      } else {
        sendResponse({ success: false, error: data.error || 'Erro ao salvar anúncio' });
      }
    })
    .catch((err) => sendResponse({ success: false, error: err.message }));
}
