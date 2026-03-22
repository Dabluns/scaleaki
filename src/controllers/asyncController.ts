import { Request, Response } from 'express';
import asyncProcessor from '../services/asyncProcessor';
import logger from '../config/logger';

// Adicionar tarefa à fila
export async function addAsyncTask(req: Request, res: Response) {
  try {
    const { type, data, priority = 'medium' } = req.body;

    if (!type || !data) {
      return res.status(400).json({
        success: false,
        error: 'Tipo e dados são obrigatórios'
      });
    }

    const taskId = await asyncProcessor.addTask(type, data, priority);

    logger.info('Async task added via API', { taskId, type, priority });

    res.status(201).json({
      success: true,
      data: {
        taskId,
        status: 'pending',
        message: 'Tarefa adicionada à fila com sucesso'
      }
    });
  } catch (error) {
    logger.error('Error adding async task', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// Obter status de uma tarefa
export async function getTaskStatus(req: Request, res: Response) {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: 'ID da tarefa é obrigatório'
      });
    }

    const task = asyncProcessor.getTaskStatus(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada'
      });
    }

    res.json({
      success: true,
      data: {
        id: task.id,
        type: task.type,
        status: task.status,
        priority: task.priority,
        createdAt: task.createdAt,
        result: task.result,
        error: task.error
      }
    });
  } catch (error) {
    logger.error('Error getting task status', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// Obter estatísticas do processador
export async function getProcessorStats(req: Request, res: Response) {
  try {
    const stats = asyncProcessor.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting processor stats', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// Exemplo: Gerar relatório assíncrono
export async function generateReport(req: Request, res: Response) {
  try {
    const { filters, format = 'pdf', priority = 'medium' } = req.body;

    const taskId = await asyncProcessor.addTask('report', {
      filters,
      format,
      userId: (req as any).user?.userId
    }, priority);

    logger.info('Report generation task added', { taskId, format, priority });

    res.status(201).json({
      success: true,
      data: {
        taskId,
        status: 'pending',
        message: 'Relatório sendo gerado em background',
        estimatedTime: '2-5 minutos'
      }
    });
  } catch (error) {
    logger.error('Error generating report', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// Exemplo: Exportar dados assíncrono
export async function exportData(req: Request, res: Response) {
  try {
    const { filters, format = 'csv', fields } = req.body;

    const taskId = await asyncProcessor.addTask('export', {
      filters,
      format,
      fields,
      userId: (req as any).user?.userId
    }, 'medium');

    logger.info('Data export task added', { taskId, format });

    res.status(201).json({
      success: true,
      data: {
        taskId,
        status: 'pending',
        message: 'Exportação sendo processada em background',
        estimatedTime: '1-3 minutos'
      }
    });
  } catch (error) {
    logger.error('Error exporting data', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
} 