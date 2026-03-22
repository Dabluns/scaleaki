import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import * as securityController from '../controllers/securityController';

const router = Router();

// 2FA
router.post('/2fa/enable', authenticateJWT, securityController.enable2FA);
router.post('/2fa/verify', authenticateJWT, securityController.verify2FA);
router.post('/2fa/disable', authenticateJWT, securityController.disable2FA);
router.post('/2fa/backup-codes', authenticateJWT, securityController.generateBackupCodes);

// Sessions
router.get('/sessions', authenticateJWT, securityController.getSessions);
router.delete('/sessions/:id', authenticateJWT, securityController.revokeSession);
router.delete('/sessions', authenticateJWT, securityController.revokeAllOtherSessions);

// Audit log
router.get('/audit-log', authenticateJWT, securityController.getSecurityLog);

export default router;

