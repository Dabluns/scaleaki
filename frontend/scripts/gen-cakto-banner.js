const sharp = require('sharp');
const path = require('path');

const BRAND = path.join(__dirname, '..', 'public', 'branding');
const W = 1200, H = 500;

(async () => {
  const bg = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0a0e1a"/>
          <stop offset="100%" stop-color="#070a12"/>
        </linearGradient>
        <radialGradient id="glow" cx="88%" cy="42%" r="60%">
          <stop offset="0%" stop-color="#22c55e" stop-opacity="0.32"/>
          <stop offset="55%" stop-color="#22c55e" stop-opacity="0.06"/>
          <stop offset="100%" stop-color="#22c55e" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="glow2" cx="12%" cy="90%" r="45%">
          <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.14"/>
          <stop offset="100%" stop-color="#06b6d4" stop-opacity="0"/>
        </radialGradient>
        <pattern id="grid" width="38" height="38" patternUnits="userSpaceOnUse">
          <path d="M38 0H0V38" fill="none" stroke="#22c55e" stroke-opacity="0.06" stroke-width="1"/>
        </pattern>
        <linearGradient id="cta" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#22c55e"/>
          <stop offset="100%" stop-color="#16a34a"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#bgg)"/>
      <rect width="${W}" height="${H}" fill="url(#grid)"/>
      <rect width="${W}" height="${H}" fill="url(#glow)"/>
      <rect width="${W}" height="${H}" fill="url(#glow2)"/>
      <rect x="3" y="3" width="${W - 6}" height="${H - 6}" rx="28" fill="none" stroke="#22c55e" stroke-opacity="0.32" stroke-width="2"/>

      <!-- Brand wordmark (logo composited to the left of this) -->
      <text x="172" y="92" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="900" letter-spacing="-1" fill="#ffffff">Scale<tspan fill="#22c55e">aki</tspan></text>

      <!-- Badge -->
      <rect x="84" y="128" width="272" height="34" rx="17" fill="#22c55e" fill-opacity="0.10" stroke="#22c55e" stroke-opacity="0.30"/>
      <circle cx="107" cy="145" r="5" fill="#22c55e"/>
      <text x="124" y="150" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="800" letter-spacing="2.5" fill="#4ade80">ACESSO LIBERADO NA HORA</text>

      <!-- Headline -->
      <text x="82" y="232" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="900" letter-spacing="-1.5" fill="#ffffff">Minere as ofertas que</text>
      <text x="82" y="294" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="900" letter-spacing="-1.5" fill="#22c55e">mais escalam <tspan fill="#ffffff">no Facebook Ads</tspan></text>

      <!-- Sub -->
      <text x="84" y="338" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="#9ca3af">Swipe file atualizado em tempo real. Copie, baixe e escale o que já está validado.</text>

      <!-- Feature bullets -->
      <g font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="800" fill="#d1d5db">
        <circle cx="92" cy="382" r="9" fill="#22c55e" fill-opacity="0.15" stroke="#22c55e" stroke-opacity="0.4"/>
        <path d="M88 382 l3 3 l5 -6" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="110" y="387">Ofertas em tempo real</text>
        <circle cx="372" cy="382" r="9" fill="#22c55e" fill-opacity="0.15" stroke="#22c55e" stroke-opacity="0.4"/>
        <path d="M368 382 l3 3 l5 -6" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="390" y="387">Filtros avançados</text>
        <circle cx="612" cy="382" r="9" fill="#22c55e" fill-opacity="0.15" stroke="#22c55e" stroke-opacity="0.4"/>
        <path d="M608 382 l3 3 l5 -6" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="630" y="387">Curadoria humana</text>
      </g>

      <!-- CTA pill -->
      <rect x="84" y="416" width="360" height="56" rx="28" fill="url(#cta)"/>
      <text x="264" y="451" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="900" letter-spacing="1.5" fill="#06210f">FINALIZAR ASSINATURA  →</text>

      <!-- Reassurance -->
      <text x="470" y="450" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="700" fill="#6b7280">Cancele quando quiser · Pagamento 100% seguro</text>
    </svg>`
  );

  const logo = await sharp(path.join(BRAND, 's-transparente.png'))
    .resize({ height: 78, fit: 'inside' })
    .toBuffer();

  await sharp(bg)
    .composite([{ input: logo, top: 40, left: 80 }])
    .png()
    .toFile(path.join(BRAND, 'checkout-banner-cakto.png'));

  const m = await sharp(path.join(BRAND, 'checkout-banner-cakto.png')).metadata();
  console.log('OK', m.width + 'x' + m.height, path.join(BRAND, 'checkout-banner-cakto.png'));
})().catch(e => { console.error(e.message); process.exit(1); });
