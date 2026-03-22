import prisma from '../config/database';
import logger from '../config/logger';
import {
  AdminUserList,
  UserUpdateData,
  SystemQuery,
  UserMetrics,
  QueryMetrics,
  RevenueMetrics,
  SystemMetrics,
  DashboardData,
  ChartData,
  TimeSeriesData,
  PaginationParams,
  PaginatedResponse,
  AdminAlert
} from '../types/admin';

// ===== GESTÃO DE USUÁRIOS =====

export async function getUsersList(params: PaginationParams): Promise<PaginatedResponse<AdminUserList>> {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;
  const sortBy = params.sortBy || 'createdAt';
  const sortOrder = params.sortOrder || 'desc';

  let whereClause: any = {};

  // Busca por nome ou email
  if (params.search) {
    whereClause.OR = [
      { email: { contains: params.search, mode: 'insensitive' } },
      { name: { contains: params.search, mode: 'insensitive' } }
    ];
  }

  // Filtros combinados
  if (params.role) {
    whereClause.role = params.role;
  }
  if (typeof params.isActive === 'boolean') {
    whereClause.isActive = params.isActive;
  }
  if (params.plan) {
    whereClause.plan = params.plan;
  }
  if (params.createdAtFrom || params.createdAtTo) {
    whereClause.createdAt = {};
    if (params.createdAtFrom) whereClause.createdAt.gte = new Date(params.createdAtFrom);
    if (params.createdAtTo) whereClause.createdAt.lte = new Date(params.createdAtTo);
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        subscription: {
          select: {
            plan: true,
            status: true,
            endDate: true
          }
        }
      }
    }),
    prisma.user.count({ where: whereClause })
  ]);

  const usersWithQueryCount: AdminUserList[] = users.map(user => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as 'admin' | 'user',
    plan: user.plan,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: undefined, // TODO: Adicionar após migration
    queryCount: 0, // Removido - não mais relevante
    subscriptionPlan: user.subscription?.plan ?? null,
    subscriptionStatus: user.subscription?.status ?? null,
    subscriptionEndDate: user.subscription?.endDate ?? null
  }));

  return {
    data: usersWithQueryCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
}

export async function logAdminAction({ adminId, adminEmail, action, targetUserId, targetUserEmail, details }: {
  adminId: string;
  adminEmail: string;
  action: string;
  targetUserId: string;
  targetUserEmail: string;
  details?: string;
}) {
  // TODO: Implementar log de auditoria quando o modelo AdminAuditLog estiver disponível
  // await prisma.adminAuditLog.create({
  //   data: {
  //     adminId,
  //     adminEmail,
  //     action,
  //     targetUserId,
  //     targetUserEmail,
  //     details: details || null,
  //   },
  // });
}

export async function updateUser(userId: string, data: UserUpdateData, adminInfo?: { id: string, email: string }): Promise<AdminUserList> {
  try {
    const prevUser = await prisma.user.findUnique({ where: { id: userId } });
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      include: {
        subscription: {
          select: {
            plan: true,
            status: true,
            endDate: true
          }
        }
      }
    });

    logger.info('User updated by admin', { userId, updatedFields: Object.keys(data) });

    // Registrar log de auditoria se adminInfo fornecido
    if (adminInfo && prevUser) {
      if (data.role && data.role !== prevUser.role) {
        await logAdminAction({
          adminId: adminInfo.id,
          adminEmail: adminInfo.email,
          action: data.role === 'admin' ? 'promote' : 'demote',
          targetUserId: user.id,
          targetUserEmail: user.email,
          details: `Alteração de role: ${prevUser.role} -> ${data.role}`,
        });
      }
      if (data.plan && data.plan !== prevUser.plan) {
        await logAdminAction({
          adminId: adminInfo.id,
          adminEmail: adminInfo.email,
          action: 'change_plan',
          targetUserId: user.id,
          targetUserEmail: user.email,
          details: `Alteração de plano: ${prevUser.plan} -> ${data.plan}`,
        });
      }
      if (typeof data.isActive === 'boolean' && data.isActive !== prevUser.isActive) {
        await logAdminAction({
          adminId: adminInfo.id,
          adminEmail: adminInfo.email,
          action: data.isActive ? 'activate' : 'deactivate',
          targetUserId: user.id,
          targetUserEmail: user.email,
          details: `Alteração de status: ${prevUser.isActive} -> ${data.isActive}`,
        });
      }
      // Registrar alteração de IP autorizado
      if (data.firstLoginIp !== undefined && data.firstLoginIp !== prevUser.firstLoginIp) {
        await logAdminAction({
          adminId: adminInfo.id,
          adminEmail: adminInfo.email,
          action: 'reset_login_ip',
          targetUserId: user.id,
          targetUserEmail: user.email,
          details: `IP autorizado redefinido: ${prevUser.firstLoginIp || 'nenhum'} -> ${data.firstLoginIp || 'nenhum (limpo)'}`,
        });
      }
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'admin' | 'user',
      plan: user.plan,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: undefined, // TODO: Adicionar após migration
      queryCount: 0, // Removido - não mais relevante
      subscriptionPlan: user.subscription?.plan ?? null,
      subscriptionStatus: user.subscription?.status ?? null,
      subscriptionEndDate: user.subscription?.endDate ?? null
    };
  } catch (error) {
    logger.error('Error updating user', { userId, error: error instanceof Error ? error.message : String(error) });
    throw new Error('Erro ao atualizar usuário');
  }
}

export async function deleteUser(userId: string, adminInfo?: { id: string, email: string }): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        favoritos: true,
        payments: true,
        subscription: true,
      }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar se é o dono (primeiro admin criado)
    const firstAdmin = await prisma.user.findFirst({
      where: { role: 'admin' },
      orderBy: { createdAt: 'asc' }
    });

    if (firstAdmin && firstAdmin.id === userId) {
      throw new Error('Não é possível excluir o dono do sistema');
    }

    // Deletar relacionamentos primeiro (cascata)
    // Favoritos serão deletados automaticamente pelo onDelete: Cascade
    // Payments e subscriptions também serão deletados automaticamente

    // Deletar o usuário
    await prisma.user.delete({
      where: { id: userId }
    });

    logger.info('User deleted by admin', {
      userId,
      userEmail: user.email,
      adminId: adminInfo?.id
    });

    // Registrar log de auditoria se adminInfo fornecido
    if (adminInfo) {
      await logAdminAction({
        adminId: adminInfo.id,
        adminEmail: adminInfo.email,
        action: 'delete',
        targetUserId: userId,
        targetUserEmail: user.email,
        details: `Usuário excluído permanentemente`,
      });
    }
  } catch (error) {
    logger.error('Error deleting user', {
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

// ===== CONSULTAS DO SISTEMA =====
// REMOVIDO - Sistema de consultas não mais disponível

export async function getSystemQueries(params: PaginationParams): Promise<PaginatedResponse<SystemQuery>> {
  // Função removida - sistema de consultas não mais disponível
  return {
    data: [],
    pagination: {
      page: 1,
      limit: 50,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    }
  };
}

// ===== MÉTRICAS DE USUÁRIOS =====

export async function getUserMetrics(): Promise<UserMetrics> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    newUsersToday,
    newUsersThisWeek,
    newUsersThisMonth,
    usersByPlan
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.user.groupBy({
      by: ['plan'],
      _count: true
    })
  ]);

  const planCounts = usersByPlan.reduce((acc, item) => {
    acc[item.plan as keyof typeof acc] = item._count;
    return acc;
  }, { mensal: 0, trimestral: 0, anual: 0 });

  return {
    totalUsers,
    activeUsers,
    newUsersToday,
    newUsersThisWeek,
    newUsersThisMonth,
    usersByPlan: planCounts
  };
}

// ===== MÉTRICAS DE CONSULTAS =====

export async function getQueryMetrics(): Promise<QueryMetrics> {
  // Função removida - sistema de consultas não mais disponível
  return {
    totalQueries: 0,
    queriesToday: 0,
    queriesThisWeek: 0,
    queriesThisMonth: 0,
    queriesByType: { bin: 0, card: 0, phone: 0 },
    queriesByStatus: { success: 0, error: 0, pending: 0 },
    averageExecutionTime: 0
  };
}

// ===== MÉTRICAS DE RECEITA (STUB) =====

export async function getRevenueMetrics(): Promise<RevenueMetrics> {
  // Implementação stub - será expandida quando implementar pagamentos
  return {
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    revenueByPlan: {
      mensal: 0,
      trimestral: 0,
      anual: 0
    },
    totalSubscriptions: 0,
    activeSubscriptions: 0
  };
}

// ===== MÉTRICAS DO SISTEMA =====

export async function getSystemMetrics(): Promise<SystemMetrics> {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();

  // Stub para CPU usage - em produção usaria bibliotecas como 'os' ou 'systeminformation'
  return {
    uptime,
    memoryUsage: {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
      percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
    },
    cpuUsage: 0, // Stub
    errorRate: 0, // Stub - seria calculado baseado nos logs
    requestsPerMinute: 0 // Stub - seria calculado baseado nos logs
  };
}

// ===== DASHBOARD COMPLETO =====

export async function getDashboardData(): Promise<DashboardData> {
  const [userMetrics, queryMetrics, revenueMetrics, systemMetrics] = await Promise.all([
    getUserMetrics(),
    getQueryMetrics(),
    getRevenueMetrics(),
    getSystemMetrics()
  ]);

  return {
    userMetrics,
    queryMetrics,
    revenueMetrics,
    systemMetrics
  };
}

// ===== DADOS DE GRÁFICOS =====

export async function getChartData(days: number = 30): Promise<ChartData> {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

  // Gerar array de datas
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    dates.push(date.toISOString().split('T')[0]);
  }

  // Buscar dados de usuários por dia
  // Agregar por dia via SQL para performance
  const usersByDayRaw = await prisma.$queryRaw<any[]>`
    SELECT strftime('%Y-%m-%d', createdAt) as day, COUNT(*) as count
    FROM User
    WHERE createdAt >= ${startDate} AND createdAt <= ${endDate}
    GROUP BY day
    ORDER BY day ASC
  `;

  // Buscar dados de consultas por dia - REMOVIDO
  // const queriesByDay = await prisma.query.groupBy({...});

  // Transformar em TimeSeriesData
  const countByDay: Record<string, number> = {};
  (usersByDayRaw || []).forEach((row: any) => {
    countByDay[String(row.day)] = Number(row.count) || 0;
  });
  const usersData: TimeSeriesData[] = dates.map(date => ({
    date,
    value: countByDay[date] || 0,
  }));

  const queriesData: TimeSeriesData[] = dates.map(date => ({
    date,
    value: 0 // Removido - sistema de consultas não mais disponível
  }));

  // Revenue data (stub)
  const revenueData: TimeSeriesData[] = dates.map(date => ({
    date,
    value: 0 // Stub - será implementado com pagamentos
  }));

  return {
    users: usersData,
    queries: queriesData,
    revenue: revenueData
  };
}

// ===== ALERTAS DO SISTEMA =====

export async function getSystemAlerts(): Promise<AdminAlert[]> {
  // Implementação stub - alertas seriam baseados em logs, métricas, etc.
  const alerts: AdminAlert[] = [];

  // Verificar se há muitos erros recentes - REMOVIDO
  const recentErrors = 0; // Sistema de consultas não mais disponível

  if (recentErrors > 10) {
    alerts.push({
      id: 'high-error-rate',
      type: 'warning',
      title: 'Alta taxa de erro',
      message: `${recentErrors} consultas falharam nas últimas 24 horas`,
      createdAt: new Date(),
      isRead: false
    });
  }

  // Verificar uso de memória
  const memUsage = process.memoryUsage();
  const memPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;

  if (memPercentage > 80) {
    alerts.push({
      id: 'high-memory-usage',
      type: 'error',
      title: 'Alto uso de memória',
      message: `Uso de memória em ${memPercentage.toFixed(1)}%`,
      createdAt: new Date(),
      isRead: false
    });
  }

  return alerts;
}

export async function createAdmin(data: { name: string; email: string; password: string }) {
  try {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(data.password, 12);

    const admin = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: 'admin',
        plan: 'anual',
        isActive: true,
        emailConfirmed: true
      },
    });

    const { password, ...adminWithoutPassword } = admin;
    return adminWithoutPassword;
  } catch (error) {
    throw new Error('Erro ao criar administrador');
  }
} 