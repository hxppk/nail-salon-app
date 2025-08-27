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
  totalSpent: number;
  joinDate: string;
  lastVisit?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
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
  type: 'SERVICE' | 'PRODUCT' | 'MEMBERSHIP' | 'POINTS_REDEMPTION';
  amount: number;
  pointsEarned: number;
  pointsUsed: number;
  description: string;
  createdAt: string;
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