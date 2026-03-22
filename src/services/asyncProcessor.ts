import { EventEmitter } from 'events';
import logger from '../config/logger';

interface AsyncTask {
  id: string;
  type: 'email' | 'report' | 'export' | 'notification' | 'cleanup';
  data: any;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

class AsyncProcessor extends EventEmitter {
  private tasks: Map<string, AsyncTask> = new Map();
  private processing: boolean = false;
  private maxConcurrent: number = 3;
  private activeTasks: number = 0;

  constructor() {
    super();
    this.startProcessing();
  }

  // Adicionar tarefa à fila
  async addTask(type: AsyncTask['type'], data: any, priority: 'low' | 'medium' | 'high' = 'medium'): Promise<string> {
    const taskId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const task: AsyncTask = {
      id: taskId,
      type,
      data,
      priority,
      createdAt: new Date(),
      status: 'pending'
    };

    this.tasks.set(taskId, task);
    logger.info('Async task added', { taskId, type, priority });
    
    this.emit('taskAdded', task);
    return taskId;
  }

  // Obter status de uma tarefa
  getTaskStatus(taskId: string): AsyncTask | null {
    return this.tasks.get(taskId) || null;
  }

  // Processar tarefas em background
  private async startProcessing() {
    setInterval(() => {
      if (!this.processing && this.activeTasks < this.maxConcurrent) {
        this.processNextTask();
      }
    }, 1000);
  }

  private async processNextTask() {
    const pendingTasks = Array.from(this.tasks.values())
      .filter(task => task.status === 'pending')
      .sort((a, b) => {
        // Ordenar por prioridade
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

    if (pendingTasks.length === 0) return;

    const task = pendingTasks[0];
    this.activeTasks++;
    this.processing = true;

    try {
      task.status = 'processing';
      logger.info('Processing async task', { taskId: task.id, type: task.type });

      const result = await this.executeTask(task);
      
      task.status = 'completed';
      task.result = result;
      
      logger.info('Async task completed', { taskId: task.id, type: task.type });
      this.emit('taskCompleted', task);

    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : String(error);
      
      logger.error('Async task failed', { 
        taskId: task.id, 
        type: task.type, 
        error: task.error 
      });
      this.emit('taskFailed', task);
    } finally {
      this.activeTasks--;
      this.processing = false;
    }
  }

  // Executar tarefa específica
  private async executeTask(task: AsyncTask): Promise<any> {
    switch (task.type) {
      case 'email':
        return await this.processEmailTask(task.data);
      case 'report':
        return await this.processReportTask(task.data);
      case 'export':
        return await this.processExportTask(task.data);
      case 'notification':
        return await this.processNotificationTask(task.data);
      case 'cleanup':
        return await this.processCleanupTask(task.data);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  // Processadores específicos
  private async processEmailTask(data: any): Promise<any> {
    // Simular processamento de email
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { sent: true, recipient: data.recipient };
  }

  private async processReportTask(data: any): Promise<any> {
    // Simular geração de relatório
    await new Promise(resolve => setTimeout(resolve, 5000));
    return { 
      reportId: `report_${Date.now()}`,
      generatedAt: new Date(),
      data: data
    };
  }

  private async processExportTask(data: any): Promise<any> {
    // Simular exportação de dados
    await new Promise(resolve => setTimeout(resolve, 3000));
    return { 
      exportId: `export_${Date.now()}`,
      format: data.format,
      records: data.records?.length || 0
    };
  }

  private async processNotificationTask(data: any): Promise<any> {
    // Simular envio de notificação
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { 
      notificationId: `notif_${Date.now()}`,
      sent: true,
      type: data.type
    };
  }

  private async processCleanupTask(data: any): Promise<any> {
    // Simular limpeza de dados
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { 
      cleanedRecords: Math.floor(Math.random() * 100),
      freedSpace: Math.floor(Math.random() * 1000)
    };
  }

  // Limpar tarefas antigas
  cleanupOldTasks(maxAgeHours: number = 24) {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    let cleaned = 0;

    for (const [taskId, task] of this.tasks.entries()) {
      if (task.createdAt < cutoff && (task.status === 'completed' || task.status === 'failed')) {
        this.tasks.delete(taskId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info('Cleaned old async tasks', { cleaned });
    }
  }

  // Estatísticas do processador
  getStats() {
    const tasks = Array.from(this.tasks.values());
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      processing: tasks.filter(t => t.status === 'processing').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      activeTasks: this.activeTasks,
      maxConcurrent: this.maxConcurrent
    };
  }
}

// Singleton instance
export const asyncProcessor = new AsyncProcessor();

// Limpar tarefas antigas a cada hora
setInterval(() => {
  asyncProcessor.cleanupOldTasks();
}, 60 * 60 * 1000);

export default asyncProcessor; 