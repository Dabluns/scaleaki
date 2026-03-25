import { SubscriptionStatus, UserPlan } from '@prisma/client';

export interface AdminUserList {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'moderator' | 'user';
  plan: UserPlan;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  queryCount: number;
  subscriptionPlan?: UserPlan | null;
  subscriptionStatus?: SubscriptionStatus | null;
  subscriptionEndDate?: Date | null;
}

export interface UserUpdateData {
  name?: string;
  role?: 'admin' | 'moderator' | 'user';
  plan?: 'mensal' | 'trimestral' | 'anual';
  isActive?: boolean;
  firstLoginIp?: string | null; // Permite redefinir o IP autorizado (null para limpar)
}

export interface SystemQuery {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: 'bin' | 'card' | 'phone';
  input: string;
  status: 'success' | 'error' | 'pending';
  createdAt: Date;
  executionTime?: number;
}

export interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  usersByPlan: {
    mensal: number;
    trimestral: number;
    anual: number;
  };
}

export interface QueryMetrics {
  totalQueries: number;
  queriesToday: number;
  queriesThisWeek: number;
  queriesThisMonth: number;
  queriesByType: {
    bin: number;
    card: number;
    phone: number;
  };
  queriesByStatus: {
    success: number;
    error: number;
    pending: number;
  };
  averageExecutionTime: number;
}

export interface RevenueMetrics {
  monthlyRevenue: number;
  yearlyRevenue: number;
  revenueByPlan: {
    mensal: number;
    trimestral: number;
    anual: number;
  };
  totalSubscriptions: number;
  activeSubscriptions: number;
}

export interface SystemMetrics {
  uptime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage: number;
  errorRate: number;
  requestsPerMinute: number;
}

export interface DashboardData {
  userMetrics: UserMetrics;
  queryMetrics: QueryMetrics;
  revenueMetrics: RevenueMetrics;
  systemMetrics: SystemMetrics;
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface ChartData {
  users: TimeSeriesData[];
  queries: TimeSeriesData[];
  revenue: TimeSeriesData[];
}

export interface AdminAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  role?: 'admin' | 'moderator' | 'user';
  isActive?: boolean;
  plan?: UserPlan;
  createdAtFrom?: string;
  createdAtTo?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ExportParams {
  format: 'csv' | 'json' | 'xlsx';
  startDate?: string;
  endDate?: string;
  includeFields?: string[];
} 