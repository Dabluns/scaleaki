import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as adminController from '../controllers/adminController';
import { validateUpdateUser } from '../middlewares/adminValidationMiddleware';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/roleMiddleware';
import { validateAdminAccess, logAdminAction } from '../middlewares/adminSecurityMiddleware';
import { securityLogger } from '../middlewares/securityLoggingMiddleware';
import { sanitizeInput, validateUUID } from '../middlewares/inputSanitizationMiddleware';
import rateLimit from 'express-rate-limit';
import prisma from '../config/database';

const router = express.Router();

// Rate limiting rigoroso para rotas admin
const ADMIN_RATE_LIMIT_WINDOW_MINUTES = Number(process.env.ADMIN_RATE_LIMIT_WINDOW_MINUTES || 15);
const ADMIN_RATE_LIMIT_MAX = Number(process.env.ADMIN_RATE_LIMIT_MAX || 20);

const adminRateLimiter = rateLimit({
  windowMs: ADMIN_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: ADMIN_RATE_LIMIT_MAX,
  message: { error: `Muitas requisições administrativas. Tente novamente em ${ADMIN_RATE_LIMIT_WINDOW_MINUTES} minutos.` },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Não aplicar rate limit em health checks
    return req.path === '/health';
  }
});

// Middleware de autenticação e autorização para todas as rotas admin
// admin + moderator podem acessar o painel admin
router.use(authenticateJWT);
router.use(validateAdminAccess);
router.use(authorizeRoles(['admin', 'moderator']));
router.use(adminRateLimiter);
router.use(sanitizeInput);
router.use(securityLogger('admin_action'));

// ===== ROTAS EXCLUSIVAS DO ADMIN SUPREMO (gerenciamento de usuários) =====
// Moderadores NÃO têm acesso a estas rotas
router.get('/users', authorizeRoles(['admin']), logAdminAction('list_users'), adminController.getUsers);
router.put('/users/:id', authorizeRoles(['admin']), validateUUID('id'), validateUpdateUser, logAdminAction('update_user'), adminController.updateUser);
router.delete('/users/:id', authorizeRoles(['admin']), validateUUID('id'), logAdminAction('delete_user'), adminController.deleteUser);
router.post('/admins', authorizeRoles(['admin']), logAdminAction('create_admin'), adminController.createAdmin);

// ===== ROTAS COMPARTILHADAS (admin + moderator) =====
// Storage Cleanup
import * as cleanupController from '../controllers/cleanupController';
router.post('/cleanup', logAdminAction('cleanup_storage'), cleanupController.runCleanup);

// ===== TEMPORÁRIO: atualizar ícones de nichos existentes =====
router.post('/run/update-nicho-icons', authorizeRoles(['admin']), async (_req, res) => {
  try {
    const bank = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../keywords.json'), 'utf-8'));
    const iconMap: Record<string, string> = {};
    for (const [nome, entry] of Object.entries(bank)) {
      const icon = (entry as any)?.icon;
      if (icon) iconMap[nome.toLowerCase().trim()] = icon;
    }
    const nichos = await prisma.nicho.findMany({ select: { id: true, nome: true, slug: true, icone: true } });
    const results: string[] = [];
    for (const nicho of nichos) {
      const icon = iconMap[nicho.nome.toLowerCase().trim()] || iconMap[nicho.slug.replace(/-/g, ' ')] || null;
      if (!icon || nicho.icone === icon) { results.push(`skip: ${nicho.nome}`); continue; }
      await prisma.nicho.update({ where: { id: nicho.id }, data: { icone: icon } });
      results.push(`updated: ${nicho.nome} → ${icon}`);
    }
    res.json({ ok: true, results });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router; 