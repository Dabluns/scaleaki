import { Request, Response } from 'express';
import { botService } from '../services/botService';
import logger from '../config/logger';

export const startBot = async (req: Request, res: Response) => {
    try {
        const result = await botService.start();
        const statusCode = result.status === 'error' ? 400 : 200;
        res.status(statusCode).json({ success: result.status !== 'error', ...result });
    } catch (error) {
        logger.error('Error starting bot:', error);
        res.status(500).json({ success: false, error: 'Failed to start bot' });
    }
};

export const stopBot = async (req: Request, res: Response) => {
    try {
        const result = await botService.stop();
        res.json({ success: true, ...result });
    } catch (error) {
        logger.error('Error stopping bot:', error);
        res.status(500).json({ success: false, error: 'Failed to stop bot' });
    }
};

export const getBotStatus = async (req: Request, res: Response) => {
    try {
        const result = await botService.getStatus();
        res.json({ success: true, ...result });
    } catch (error) {
        logger.error('Error getting bot status:', error);
        res.status(500).json({ success: false, error: 'Failed to get bot status' });
    }
};

export const getBotLogs = async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 50;
        const level = req.query.level as string | undefined;
        const result = await botService.getLogs(limit, level);
        res.json({ success: true, ...result });
    } catch (error) {
        logger.error('Error getting bot logs:', error);
        res.status(500).json({ success: false, error: 'Failed to get bot logs' });
    }
};
