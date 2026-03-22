import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import * as notificationsController from '../controllers/notificationsController';

const router = Router();

router.post('/push/subscribe', authenticateJWT, notificationsController.subscribePush);
router.delete('/push/subscribe', authenticateJWT, notificationsController.unsubscribePush);
router.post('/test', authenticateJWT, notificationsController.sendTestNotification);

export default router;
