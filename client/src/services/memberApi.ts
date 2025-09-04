import { Member, MemberStats, Transaction, RechargeRequest, CreateMemberRequest, MemberListResponse, MemberListFilters } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export const memberApi = {
  // Get all members with filters
  getMembers: async (filters?: MemberListFilters): Promise<MemberListResponse> => {
    const searchParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/members?${searchParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch members');
    }
    return response.json();
  },

  // Create new member
  createMember: async (memberData: CreateMemberRequest): Promise<{ message: string; member: Member }> => {
    const response = await fetch(`${API_BASE_URL}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(memberData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create member');
    }
    
    return response.json();
  },

  // Get member by ID
  getMemberById: async (id: string): Promise<Member> => {
    const response = await fetch(`${API_BASE_URL}/members/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch member');
    }
    return response.json();
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
    return response.json();
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
    return response.json();
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
