import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MemberFilters extends PaginationQuery {
  search?: string;
  membershipLevel?: string;
  gender?: string;
}

export interface AppointmentFilters extends PaginationQuery {
  search?: string;
  status?: string;
  staffId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// SQLite compatible string constants
export const MembershipLevel = {
  BRONZE: 'BRONZE',
  SILVER: 'SILVER', 
  GOLD: 'GOLD',
  PLATINUM: 'PLATINUM'
} as const;

export const AppointmentStatus = {
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;

export const TransactionType = {
  SERVICE: 'SERVICE',
  PRODUCT: 'PRODUCT',
  MEMBERSHIP: 'MEMBERSHIP',
  POINTS_REDEMPTION: 'POINTS_REDEMPTION'
} as const;

export const UserRole = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  CUSTOMER: 'CUSTOMER'
} as const;

export type MembershipLevel = typeof MembershipLevel[keyof typeof MembershipLevel];
export type AppointmentStatus = typeof AppointmentStatus[keyof typeof AppointmentStatus];
export type TransactionType = typeof TransactionType[keyof typeof TransactionType];
export type UserRole = typeof UserRole[keyof typeof UserRole];