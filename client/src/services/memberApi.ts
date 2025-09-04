import { Member, MemberStats, Transaction, RechargeRequest, CreateMemberRequest, MemberListResponse, MemberListFilters } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

const validDiscounts = [1, 0.9, 0.88, 0.85, 0.8, 0.75, 0.7];

function normalizeMember(m: any): Member {
  const rechargeBalance = Number(m.rechargeBalance || 0);
  const bonusBalance = Number(m.bonusBalance || 0);
  const balance = rechargeBalance + bonusBalance;
  return {
    id: m.id,
    name: m.name,
    phone: m.phone,
    email: m.email ?? undefined,
    birthday: m.birthday ? new Date(m.birthday).toISOString() : undefined,
    gender: m.gender ?? undefined,
    address: m.address ?? undefined,
    memberDiscount: Number(m.memberDiscount ?? 0.9),
    rechargeBalance,
    bonusBalance,
    balance,
    totalSpent: Number(m.totalSpent ?? 0),
    cashSpent: Number(m.cashSpent ?? 0),
    visitCount: Number(m.visitCount ?? 0),
    lastVisit: m.lastVisit ? new Date(m.lastVisit).toISOString() : undefined,
    notes: m.notes ?? undefined,
    createdAt: new Date(m.createdAt).toISOString(),
    updatedAt: new Date(m.updatedAt).toISOString(),
    transactions: m.transactions,
    appointments: m.appointments,
  };
}

export const memberApi = {
  // Get all members with filters
  getMembers: async (filters?: MemberListFilters): Promise<MemberListResponse> => {
    const searchParams = new URLSearchParams();

    if (filters) {
      const entries = Object.entries(filters);
      for (const [key, value] of entries) {
        if (value === undefined || value === '') continue;
        // Forward discountLevel to backend
        if (key === 'sortBy' && String(value) === 'balance') {
          searchParams.append('sortBy', 'rechargeBalance');
          continue;
        }
        searchParams.append(key, value.toString());
      }
    }

    const response = await fetch(`${API_BASE_URL}/members?${searchParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch members');
    }
    const data = await response.json();
    const normalized = {
      members: Array.isArray(data.members) ? data.members.map(normalizeMember) : [],
      pagination: data.pagination,
    } as MemberListResponse;
    return normalized;
  },

  // Create new member
  createMember: async (memberData: CreateMemberRequest): Promise<{ message: string; member: Member }> => {
    const payload: any = { ...memberData };
    if (!validDiscounts.includes(payload.memberDiscount)) {
      payload.memberDiscount = 0.9;
    }
    const response = await fetch(`${API_BASE_URL}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create member');
    }
    const data = await response.json();
    return {
      message: data.message,
      member: normalizeMember(data.member),
    };
  },

  // Get member by ID
  getMemberById: async (id: string): Promise<Member> => {
    const response = await fetch(`${API_BASE_URL}/members/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch member');
    }
    const data = await response.json();
    return normalizeMember(data);
  },

  // Get member statistics
  getMemberStats: async (id: string): Promise<MemberStats> => {
    const response = await fetch(`${API_BASE_URL}/members/${id}/stats`);
    if (!response.ok) {
      throw new Error('Failed to fetch member stats');
    }
    return response.json();
  },

  // Get member transactions
  getMemberTransactions: async (
    id: string, 
    params?: { page?: number; limit?: number; type?: string }
  ): Promise<{ transactions: Transaction[]; pagination: any }> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.type) searchParams.append('type', params.type);

    const response = await fetch(`${API_BASE_URL}/members/${id}/transactions?${searchParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }
    return response.json();
  },

  // Update member information
  updateMember: async (id: string, updates: Partial<Member>): Promise<Member> => {
    const response = await fetch(`${API_BASE_URL}/members/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error('Failed to update member');
    }
    const data = await response.json();
    return normalizeMember(data);
  },

  // Recharge member balance
  rechargeBalance: async (id: string, request: RechargeRequest): Promise<{
    message: string;
    member: Member;
    transaction: Transaction;
  }> => {
    const response = await fetch(`${API_BASE_URL}/members/${id}/recharge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to recharge balance');
    }
    const data = await response.json();
    return {
      message: data.message,
      member: normalizeMember(data.member),
      transaction: data.transaction,
    };
  },

  // Consume member balance
  consumeBalance: async (id: string, request: {
    amount: number;
    description?: string;
    appointmentId?: string;
    operatorName?: string;
  }): Promise<{
    message: string;
    member: Member;
    transaction: Transaction;
  }> => {
    const response = await fetch(`${API_BASE_URL}/members/${id}/consume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to consume balance');
    }
    return response.json();
  },
};
