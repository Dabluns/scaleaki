import { UserRole, UserPlan } from '@prisma/client';

export { UserRole, UserPlan };

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  plan: UserPlan;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  plan?: UserPlan;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthPayload {
  token: string;
  refreshToken?: string;
  user: Omit<User, 'password'>;
} 