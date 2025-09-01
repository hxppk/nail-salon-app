export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  address?: string;
  membershipLevel: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  points: number;
  balance: number;
  totalSpent: number;
  cashSpent: number;
  visitCount: number;
  debtAmount: number;
  joinDate: string;
  lastVisit?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  transactions?: Transaction[];
  appointments?: Appointment[];
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Staff {
  id: string;
  name: string;
  phone: string;
  email?: string;
  specialties: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  memberId: string;
  member?: Member;
  staffId: string;
  staff?: Staff;
  services: string[];
  serviceDetails?: Service[];
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  memberId: string;
  member?: Member;
  appointmentId?: string;
  appointment?: Appointment;
  type: 'RECHARGE' | 'CONSUME' | 'POINTS_REDEEM' | 'REFUND';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  pointsEarned: number;
  pointsUsed: number;
  paymentMethod?: 'CASH' | 'CARD' | 'ALIPAY' | 'WECHAT' | 'BALANCE';
  description: string;
  operatorName?: string;
  createdAt: string;
}

export interface MemberStats {
  memberId: string;
  name: string;
  phone: string;
  membershipLevel: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  balance: number;
  points: number;
  totalSpent: number;
  cashSpent: number;
  visitCount: number;
  debtAmount: number;
  lastVisit?: string;
  joinDate: string;
  recentActivity: number;
  totalAppointments: number;
}

export interface RechargeRequest {
  amount: number;
  paymentMethod: 'CASH' | 'CARD' | 'ALIPAY' | 'WECHAT';
  description?: string;
  operatorName?: string;
}

export interface CreateMemberRequest {
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  address?: string;
  membershipLevel?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  notes?: string;
}

export interface MemberListResponse {
  members: Member[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface MemberListFilters {
  page?: number;
  limit?: number;
  search?: string;
  membershipLevel?: string;
  balanceStatus?: string;
  registrationPeriod?: string;
  activityStatus?: string;
  spendingLevel?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}