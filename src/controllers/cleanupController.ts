import { Request, Response } from 'express';
import { storageCleanupService } from '../services/storageCleanupService';

export const runCleanup = async (req: Request, res: Response) => {
    const result = await storageCleanupService.runCleanup();
    res.json(result);
};
