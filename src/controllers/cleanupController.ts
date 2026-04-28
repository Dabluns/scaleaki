import { Request, Response } from 'express';
import { runStorageCleanup } from '../services/storageCleanupService';

export const runCleanup = async (req: Request, res: Response) => {
    const result = await runStorageCleanup();
    res.json(result);
};
