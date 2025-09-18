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
  memberDiscount: number; // 会员折扣 (0.1-1.0)
  rechargeBalance: number; // 充值余额
  bonusBalance: number; // 赠金余额
  totalSpent: number; // 总消费金额
  cashSpent: number; // 现金消费金额
  visitCount: number; // 到店次数
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
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceRequest {
  name: string;
  price: number;
  category?: string;
  description?: string;
  duration?: number;
}

export interface UpdateServiceRequest {
  name?: string;
  price?: number;
  category?: string;
  description?: string;
  duration?: number;
  isActive?: boolean;
}

export interface ServiceListResponse {
  services: Service[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ServiceListFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ServiceStats {
  totalServices: number;
  activeServices: number;
  inactiveServices: number;
  totalCategories: number;
  recentServices: Service[];
  categoryStats: Array<{
    category: string;
    _count: number;
  }>;
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
  memberId?: string; // Optional for non-member appointments
  member?: Member;
  staffId: string;
  staff?: Staff;
  customerName: string;
  customerPhone: string;
  customerGender?: 'MALE' | 'FEMALE';
  guestCount: number;
  maleGuests: number;
  femaleGuests: number;
  serviceName: string;
  duration: number; // in minutes
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'ARRIVED' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
  source: 'MANUAL' | 'PHONE' | 'APP';
  notes?: string;
  userNotes?: string;
  merchantNotes?: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  services?: AppointmentService[];
}

export interface Transaction {
  id: string;
  memberId: string;
  member?: Member;
  appointmentId?: string;
  appointment?: Appointment;
  type: 'RECHARGE' | 'CONSUME' | 'POINTS_REDEEM' | 'REFUND';
  amount: number; // 充值金额或消费金额
  giftAmount: number; // 赠金金额，仅在RECHARGE类型时使用
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
  amount: number; // 充值金额（用户实际支付金额）
  giftAmount: number; // 赠金金额（商家赠送金额，可以为0）
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
  memberDiscount: number; // 会员折扣，必选：0.9(9折)、0.88(88折)、0.85(85折)、0.8(8折)、0.75(75折)、0.7(7折)
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
  discountLevel?: string; // 会员折扣等级
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

// Appointment related types
export interface AppointmentService {
  id: string;
  appointmentId: string;
  serviceId: string;
  service: Service;
}

export interface CreateAppointmentRequest {
  memberId?: string;
  staffId: string;
  customerName: string;
  customerPhone: string;
  customerGender?: 'MALE' | 'FEMALE';
  guestCount: number;
  maleGuests: number;
  femaleGuests: number;
  startTime: string; // ISO datetime string
  serviceName: string;
  duration: number; // in minutes
  source?: 'MANUAL' | 'PHONE' | 'APP';
  notes?: string;
  userNotes?: string;
  merchantNotes?: string;
}

export interface UpdateAppointmentRequest {
  status?: 'PENDING' | 'CONFIRMED' | 'ARRIVED' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
  customerName?: string;
  customerPhone?: string;
  customerGender?: 'MALE' | 'FEMALE';
  guestCount?: number;
  maleGuests?: number;
  femaleGuests?: number;
  startTime?: string;
  serviceName?: string;
  duration?: number;
  notes?: string;
  userNotes?: string;
  merchantNotes?: string;
}

export interface AppointmentListResponse {
  appointments: Appointment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface AppointmentListFilters {
  date?: string; // YYYY-MM-DD
  startDate?: string;
  endDate?: string;
  status?: string;
  staffId?: string;
  memberId?: string;
  customerName?: string;
  page?: number;
  limit?: number;
}

export interface AppointmentStats {
  PENDING: number;
  CONFIRMED: number;
  ARRIVED: number;
  IN_SERVICE: number;
  COMPLETED: number;
  CANCELLED: number;
  OVERDUE: number;
}

export interface CalendarDay {
  date: Date;
  dateString: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
  isToday: boolean;
  appointments: Appointment[];
  stats: {
    pending: number;
    confirmed: number;
    arrived: number;
    inService: number;
    completed: number;
    cancelled: number;
    overdue: number;
  };
}

export interface TimeSlot {
  time: string; // HH:mm format
  timestamp: Date;
  isAvailable: boolean;
  appointments: Appointment[];
}

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  specialties: string;
}