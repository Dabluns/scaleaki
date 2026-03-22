import { Request, Response } from 'express';
import * as nichoService from '../services/nichoService';
import { CreateNichoInput, UpdateNichoInput } from '../types/nicho';
import logger from '../config/logger';

export async function getAllNichos(req: Request, res: Response) {
  try {
    const search = req.query.search as string;
    
    if (search) {
      // Se há termo de busca, usar busca específica
      const nichos = await nichoService.getAllNichos({ search });
      res.json({ success: true, data: nichos });
    } else {
      // Busca normal sem filtros
      const nichos = await nichoService.getAllNichos();
      res.json({ success: true, data: nichos });
    }
  } catch (error) {
    logger.error('Error in getAllNichos controller', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getNichoById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const nicho = await nichoService.getNichoById(id);
    
    if (!nicho) {
      return res.status(404).json({ success: false, error: 'Nicho não encontrado' });
    }
    
    res.json({ success: true, data: nicho });
  } catch (error) {
    logger.error('Error in getNichoById controller', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getNichoBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    const nicho = await nichoService.getNichoBySlug(slug);
    
    if (!nicho) {
      return res.status(404).json({ success: false, error: 'Nicho não encontrado' });
    }
    
    res.json({ success: true, data: nicho });
  } catch (error) {
    logger.error('Error in getNichoBySlug controller', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function createNicho(req: Request, res: Response) {
  try {
    const data: CreateNichoInput = req.body;
    
    // Validação básica
    if (!data.nome || !data.slug || !data.icone) {
      return res.status(400).json({ success: false, error: 'Nome, slug e ícone são obrigatórios' });
    }
    
    const nicho = await nichoService.createNicho(data);
    res.status(201).json({ success: true, data: nicho });
  } catch (error) {
    logger.error('Error in createNicho controller', { error: error instanceof Error ? error.message : String(error) });
    
    if (error instanceof Error && error.message === 'Slug já existe') {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function updateNicho(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data: UpdateNichoInput = req.body;
    
    const nicho = await nichoService.updateNicho(id, data);
    res.json({ success: true, data: nicho });
  } catch (error) {
    logger.error('Error in updateNicho controller', { error: error instanceof Error ? error.message : String(error) });
    
    if (error instanceof Error && (error.message === 'Nicho não encontrado' || error.message === 'Slug já existe')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function deleteNicho(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await nichoService.deleteNicho(id);
    res.json({ success: true, message: 'Nicho deletado com sucesso' });
  } catch (error) {
    logger.error('Error in deleteNicho controller', { error: error instanceof Error ? error.message : String(error) });
    
    if (error instanceof Error && (error.message === 'Nicho não encontrado' || error.message.includes('ofertas associadas'))) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function deactivateNicho(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const nicho = await nichoService.deactivateNicho(id);
    res.json({ success: true, data: nicho });
  } catch (error) {
    logger.error('Error in deactivateNicho controller', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getNichosPopulares(req: Request, res: Response) {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 3, 3); // Máximo 3
    const nichos = await nichoService.getNichosPopulares(limit);
    res.json({ success: true, data: nichos });
  } catch (error) {
    logger.error('Error in getNichosPopulares controller', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
} 