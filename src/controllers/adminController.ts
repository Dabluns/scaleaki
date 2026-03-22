import { Request, Response } from 'express';
import * as adminService from '../services/adminService';
import logger from '../config/logger';
import { AuthRequest } from '../middlewares/authMiddleware';
import { PaginationParams, UserUpdateData } from '../types/admin';
import prisma from '../config/database';

// ===== GESTÃO DE USUÁRIOS =====

export async function getUsers(req: AuthRequest, res: Response) {
  try {
    // Converter isActive de string para boolean se presente
    let isActive: boolean | undefined = undefined;
    if (req.query.isActive !== undefined && req.query.isActive !== '') {
      const isActiveValue = req.query.isActive as string;
      if (isActiveValue === 'true') {
        isActive = true;
      } else if (isActiveValue === 'false') {
        isActive = false;
      }
    }

    const params: PaginationParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      sortBy: req.query.sortBy as string || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      search: req.query.search as string,
      isActive: isActive
    };

    const result = await adminService.getUsersList(params);
    
    logger.info('Admin accessed users list', { 
      adminId: req.user?.userId, 
      page: params.page,
      limit: params.limit,
      search: params.search 
    });

    return res.json(result);
  } catch (error) {
    logger.error('Error fetching users list', { 
      error: error instanceof Error ? error.message : String(error), 
      adminId: req.user?.userId 
    });
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function updateUser(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const updateData: UserUpdateData = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }

    let adminInfo = undefined;
    if (req.user) {
      const admin = await prisma.user.findUnique({ where: { id: req.user.userId } });
      if (admin) {
        adminInfo = { id: admin.id, email: admin.email };
      }
    }
    const updatedUser = await adminService.updateUser(id, updateData, adminInfo);
    
    logger.info('Admin updated user', { 
      adminId: req.user?.userId, 
      targetUserId: id,
      updatedFields: Object.keys(updateData)
    });

    return res.json(updatedUser);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error updating user', { 
      error: errorMessage, 
      adminId: req.user?.userId,
      targetUserId: req.params.id
    });
    
    if (errorMessage.includes('Erro ao atualizar usuário')) {
      return res.status(400).json({ error: errorMessage });
    }
    
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function deleteUser(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }

    // Verificar se o admin está tentando deletar a si mesmo
    if (req.user?.userId === id) {
      return res.status(400).json({ error: 'Você não pode excluir sua própria conta' });
    }

    let adminInfo = undefined;
    if (req.user) {
      const admin = await prisma.user.findUnique({ where: { id: req.user.userId } });
      if (admin) {
        adminInfo = { id: admin.id, email: admin.email };
      }
    }

    await adminService.deleteUser(id, adminInfo);
    
    logger.info('Admin deleted user', { 
      adminId: req.user?.userId, 
      targetUserId: id
    });

    return res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error deleting user', { 
      error: errorMessage, 
      adminId: req.user?.userId,
      targetUserId: req.params.id
    });
    
    if (errorMessage.includes('não encontrado') || errorMessage.includes('Não é possível excluir')) {
      return res.status(400).json({ error: errorMessage });
    }
    
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// ===== CONSULTAS DO SISTEMA =====

export async function getSystemQueries(req: AuthRequest, res: Response) {
  try {
    const params: PaginationParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
      sortBy: req.query.sortBy as string || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      search: req.query.search as string
    };

    const result = await adminService.getSystemQueries(params);
    
    logger.info('Admin accessed system queries', { 
      adminId: req.user?.userId, 
      page: params.page,
      limit: params.limit,
      search: params.search 
    });

    return res.json(result);
  } catch (error) {
    logger.error('Error fetching system queries', { 
      error: error instanceof Error ? error.message : String(error), 
      adminId: req.user?.userId 
    });
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// ===== MÉTRICAS E DASHBOARD =====

export async function getDashboard(req: AuthRequest, res: Response) {
  try {
    const dashboardData = await adminService.getDashboardData();
    
    logger.info('Admin accessed dashboard', { adminId: req.user?.userId });

    return res.json(dashboardData);
  } catch (error) {
    logger.error('Error fetching dashboard data', { 
      error: error instanceof Error ? error.message : String(error), 
      adminId: req.user?.userId 
    });
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function getUserMetrics(req: AuthRequest, res: Response) {
  try {
    const metrics = await adminService.getUserMetrics();
    
    logger.info('Admin accessed user metrics', { adminId: req.user?.userId });

    return res.json(metrics);
  } catch (error) {
    logger.error('Error fetching user metrics', { 
      error: error instanceof Error ? error.message : String(error), 
      adminId: req.user?.userId 
    });
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function getQueryMetrics(req: AuthRequest, res: Response) {
  try {
    const metrics = await adminService.getQueryMetrics();
    
    logger.info('Admin accessed query metrics', { adminId: req.user?.userId });

    return res.json(metrics);
  } catch (error) {
    logger.error('Error fetching query metrics', { 
      error: error instanceof Error ? error.message : String(error), 
      adminId: req.user?.userId 
    });
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function getRevenueMetrics(req: AuthRequest, res: Response) {
  try {
    const metrics = await adminService.getRevenueMetrics();
    
    logger.info('Admin accessed revenue metrics', { adminId: req.user?.userId });

    return res.json(metrics);
  } catch (error) {
    logger.error('Error fetching revenue metrics', { 
      error: error instanceof Error ? error.message : String(error), 
      adminId: req.user?.userId 
    });
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function getSystemMetrics(req: AuthRequest, res: Response) {
  try {
    const metrics = await adminService.getSystemMetrics();
    
    logger.info('Admin accessed system metrics', { adminId: req.user?.userId });

    return res.json(metrics);
  } catch (error) {
    logger.error('Error fetching system metrics', { 
      error: error instanceof Error ? error.message : String(error), 
      adminId: req.user?.userId 
    });
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// ===== GRÁFICOS E DADOS DE TEMPO =====

export async function getChartData(req: AuthRequest, res: Response) {
  try {
    const days = parseInt(req.query.days as string) || 30;
    
    if (days < 1 || days > 365) {
      return res.status(400).json({ error: 'Período deve estar entre 1 e 365 dias' });
    }

    const chartData = await adminService.getChartData(days);
    
    logger.info('Admin accessed chart data', { 
      adminId: req.user?.userId, 
      days 
    });

    return res.json(chartData);
  } catch (error) {
    logger.error('Error fetching chart data', { 
      error: error instanceof Error ? error.message : String(error), 
      adminId: req.user?.userId 
    });
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// ===== ALERTAS DO SISTEMA =====

export async function getSystemAlerts(req: AuthRequest, res: Response) {
  try {
    const alerts = await adminService.getSystemAlerts();
    
    logger.info('Admin accessed system alerts', { adminId: req.user?.userId });

    return res.json(alerts);
  } catch (error) {
    logger.error('Error fetching system alerts', { 
      error: error instanceof Error ? error.message : String(error), 
      adminId: req.user?.userId 
    });
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// ===== EXPORTAÇÃO DE DADOS =====

export async function exportUsers(req: AuthRequest, res: Response) {
  try {
    const format = req.query.format as string || 'csv';
    
    if (!['csv', 'json'].includes(format)) {
      return res.status(400).json({ error: 'Formato deve ser csv ou json' });
    }

    // Buscar todos os usuários para exportação
    const allUsers = await adminService.getUsersList({ 
      page: 1, 
      limit: 10000 // Limite alto para exportar todos
    });

    logger.info('Admin exported users data', { 
      adminId: req.user?.userId, 
      format,
      userCount: allUsers.data.length
    });

    if (format === 'csv') {
      // Streaming de CSV
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
      res.write('ID,Email,Nome,Role,Plano,Ativo,Criado em,Consultas\n');
      for (const user of allUsers.data) {
        const line = `${user.id},${user.email},${user.name},${user.role},${user.plan},${user.isActive},${user.createdAt.toISOString()},${user.queryCount}\n`;
        if (!res.write(line)) {
          await new Promise(resolve => res.once('drain', resolve));
        }
      }
      return res.end();
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=users.json');
      return res.json(allUsers.data);
    }
  } catch (error) {
    logger.error('Error exporting users data', { 
      error: error instanceof Error ? error.message : String(error), 
      adminId: req.user?.userId 
    });
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function exportQueries(req: AuthRequest, res: Response) {
  try {
    const format = req.query.format as string || 'csv';
    
    if (!['csv', 'json'].includes(format)) {
      return res.status(400).json({ error: 'Formato deve ser csv ou json' });
    }

    // Buscar todas as consultas para exportação
    const allQueries = await adminService.getSystemQueries({ 
      page: 1, 
      limit: 10000 // Limite alto para exportar todas
    });

    logger.info('Admin exported queries data', { 
      adminId: req.user?.userId, 
      format,
      queryCount: allQueries.data.length
    });

    if (format === 'csv') {
      // Streaming de CSV
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=queries.csv');
      res.write('ID,Usuario ID,Email,Nome,Tipo,Input,Status,Criado em,Tempo Execução\n');
      for (const query of allQueries.data) {
        const line = `${query.id},${query.userId},${query.userEmail},${query.userName},${query.type},${query.input},${query.status},${query.createdAt.toISOString()},${query.executionTime || ''}\n`;
        if (!res.write(line)) {
          await new Promise(resolve => res.once('drain', resolve));
        }
      }
      return res.end();
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=queries.json');
      return res.json(allQueries.data);
    }
  } catch (error) {
    logger.error('Error exporting queries data', { 
      error: error instanceof Error ? error.message : String(error), 
      adminId: req.user?.userId 
    });
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
} 

export async function createAdmin(req: AuthRequest, res: Response) {
  try {
    const { name, email, password } = req.body;

    // Validações básicas
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios' });
    }

    // Validar formato do e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Formato de e-mail inválido' });
    }

    // Validar força da senha
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres, incluindo maiúsculas, minúsculas, números e símbolos' });
    }

    // Verificar se o e-mail já existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'E-mail já cadastrado' });
    }

    // Criar o administrador
    const admin = await adminService.createAdmin({ name, email, password });
    
    logger.info('Admin created new admin user', { 
      adminId: req.user?.userId, 
      newAdminId: admin.id,
      newAdminEmail: admin.email 
    });

    return res.status(201).json({
      message: 'Administrador criado com sucesso',
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        emailConfirmed: admin.emailConfirmed
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error creating admin', { 
      error: errorMessage, 
      adminId: req.user?.userId 
    });
    
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
} 