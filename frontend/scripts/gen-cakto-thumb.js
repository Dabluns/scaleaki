const sharp = require('sharp');
const path = require('path');

const BRAND = path.join(__dirname, '..', 'public', 'branding');
const W = 300, H = 250;

(async () => {
  // Obsidian background with subtle green radial glow
  const bg = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g" cx="50%" cy="42%" r="65%">
          <stop offset="0%" stop-color="#0f2a1e"/>
          <stop offset="55%" stop-color="#0a0e1a"/>
          <stop offset="100%" stop-color="#070a12"/>
        </radialGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g)"/>
      <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" fill="none" stroke="#22c55e" stroke-opacity="0.35" stroke-width="2"/>
    </svg>`
  );

  const logo = await sharp(path.join(BRAND, 's-transparente.png'))
    .resize({ height: 168, fit: 'inside' })
    .toBuffer();

  await sharp(bg)
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(path.join(BRAND, 'produto-cakto-thumb.png'));

  const meta = await sharp(path.join(BRAND, 'produto-cakto-thumb.png')).metadata();
  console.log('OK', meta.width + 'x' + meta.height, path.join(BRAND, 'produto-cakto-thumb.png'));
})().catch(e => { console.error(e.message); process.exit(1); });
