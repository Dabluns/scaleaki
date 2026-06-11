#!/usr/bin/env node
/**
 * Monitor de uptime self-hosted — roda via cron na VM Oracle (*/5 * * * *).
 * Pinga api + app scaleaki. Alerta por email (Resend) só na MUDANÇA de estado
 * (down→alerta, up→recovery) p/ não spammar. Estado em ~/.scaleaki-monitor-state.json.
 *
 * Env (de ~/scaleaki/.env): SMTP_PASS = Resend API key (re_...), MONITOR_ALERT_TO.
 * Rodar: cd ~/scaleaki && node scripts/uptime-monitor.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

// Carrega .env do diretório do projeto
try { require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); } catch (_) {}

const TARGETS = [
  { name: 'api.scaleaki.site', url: 'https://api.scaleaki.site/health', expect: 200 },
  { name: 'app.scaleaki.site', url: 'https://app.scaleaki.site', expect: 200 },
];
const RESEND_KEY = process.env.SMTP_PASS || '';
const ALERT_TO = process.env.MONITOR_ALERT_TO || 'andreyfreitadsd@gmail.com';
const ALERT_FROM = process.env.SMTP_FROM || 'Scaleaki <acesso@noreply.geekacademy.site>';
const STATE_FILE = path.join(os.homedir(), '.scaleaki-monitor-state.json');
const TIMEOUT_MS = 15000;
const RETRIES = 2; // confirma down antes de alertar (evita falso positivo)

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch (_) { return {}; }
}
function saveState(s) {
  try { fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2)); } catch (e) { console.error('state write fail', e.message); }
}

async function probe(url) {
  for (let i = 0; i <= RETRIES; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
      const r = await fetch(url, { signal: ctrl.signal, redirect: 'follow' });
      clearTimeout(t);
      if (r.status >= 200 && r.status < 400) return { ok: true, status: r.status };
      if (i === RETRIES) return { ok: false, status: r.status };
    } catch (e) {
      if (i === RETRIES) return { ok: false, status: 0, err: e.message };
    }
    await new Promise(r => setTimeout(r, 3000));
  }
  return { ok: false, status: 0 };
}

async function sendAlert(subject, html) {
  if (!RESEND_KEY) { console.error('SEM RESEND_KEY (SMTP_PASS) — alerta nao enviado'); return; }
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: ALERT_FROM, to: ALERT_TO, subject, html }),
    });
    const j = await r.json().catch(() => ({}));
    console.log('alert sent:', r.status, j.id || JSON.stringify(j).slice(0, 100));
  } catch (e) { console.error('alert fail', e.message); }
}

(async () => {
  const state = loadState();
  const now = new Date().toISOString();
  for (const t of TARGETS) {
    const res = await probe(t.url);
    const prev = state[t.name]?.up;
    const up = res.ok;
    console.log(`${now} ${t.name} ${up ? 'UP' : 'DOWN'} (${res.status}${res.err ? ' ' + res.err : ''})`);

    if (prev === undefined) { state[t.name] = { up, since: now }; continue; }
    if (up !== prev) {
      // mudança de estado → alerta
      if (!up) {
        await sendAlert(
          `🔴 DOWN: ${t.name}`,
          `<h2>🔴 ${t.name} caiu</h2><p>URL: ${t.url}<br>Status: ${res.status} ${res.err || ''}<br>Quando: ${now}</p>`
        );
      } else {
        const downSince = state[t.name].since;
        await sendAlert(
          `🟢 RECUPEROU: ${t.name}`,
          `<h2>🟢 ${t.name} voltou</h2><p>URL: ${t.url}<br>Status: ${res.status}<br>Estava down desde: ${downSince}<br>Voltou: ${now}</p>`
        );
      }
      state[t.name] = { up, since: now };
    }
  }
  saveState(state);
})();
