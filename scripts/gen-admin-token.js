/**
 * Gera um ADMIN_JWT para o minerador, assinado com o JWT_SECRET atual.
 *
 * Uso (rodar na VM, ou local com o MESMO JWT_SECRET do .env de produção):
 *   JWT_SECRET=<secret> node scripts/gen-admin-token.js
 *   # ou, se o .env já tiver JWT_SECRET:
 *   node scripts/gen-admin-token.js
 *
 * Opcional: passar userId e validade (dias):
 *   node scripts/gen-admin-token.js <userId> <dias>
 */
require('dotenv').config();
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET.length < 32) {
  console.error('❌ JWT_SECRET ausente ou curto (<32). Defina o secret de produção antes.');
  process.exit(1);
}

// userId do admin (default = o atual). Troque se o id mudar.
const userId = process.argv[2] || 'c105e270-4fa9-4209-91c9-26b995ed8e1a';
const days = Number(process.argv[3] || 365);

const token = jwt.sign(
  { userId, role: 'admin' },
  SECRET,
  { expiresIn: `${days}d` }
);

console.log('\nADMIN_JWT gerado (validade ' + days + ' dias):\n');
console.log(token);
console.log('\nCole no .env como:  ADMIN_JWT=' + token + '\n');
