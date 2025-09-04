import {
  Service,
  CreateServiceRequest,
  UpdateServiceRequest,
  ServiceListResponse,
  ServiceListFilters,
  ServiceStats,
} from '../types';

const API_BASE_URL = 'http://localhost:3002/api';

export const serviceApi = {
  // Get all services with filters
  getServices: async (filters?: ServiceListFilters): Promise<ServiceListResponse> => {
    const searchParams = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/services?${searchParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch services');
    }
    return response.json();
  },

  // Get service by ID
  getServiceById: async (id: string): Promise<Service> => {
    const response = await fetch(`${API_BASE_URL}/services/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch service');
    }
    return response.json();
  },

  // Create new service
  createService: async (serviceData: CreateServiceRequest): Promise<{
    message: string;
    service: Service;
  }> => {
    const response = await fetch(`${API_BASE_URL}/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serviceData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create service');
    }

    return response.json();
  },

  // Update service
  updateService: async (
    id: string,
    updates: UpdateServiceRequest
  ): Promise<{ message: string; service: Service }> => {
    const response = await fetch(`${API_BASE_URL}/services/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update service');
    }
    return response.json();
  },

  // Delete service
  deleteService: async (id: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/services/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete service');
    }
    return response.json();
  },

  // Get service categories
  getServiceCategories: async (): Promise<string[]> => {
    const response = await fetch(`${API_BASE_URL}/services/categories`);
    if (!response.ok) {
      throw new Error('Failed to fetch service categories');
    }
    return response.json();
  },

  // Get service statistics
  getServiceStats: async (): Promise<ServiceStats> => {
    const response = await fetch(`${API_BASE_URL}/services/stats`);
    if (!response.ok) {
      throw new Error('Failed to fetch service statistics');
    }
    return response.json();
  },

  // Helper function to format price
  formatPrice: (price: number): string => {
    return `¥${price.toFixed(2)}`;
  },

  // Helper function to format duration
  formatDuration: (duration: number): string => {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    if (hours > 0) {
      return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
    }
    return `${minutes}分钟`;
  },

  // Get category color
  getCategoryColor: (category?: string): string => {
    const categoryColors: { [key: string]: string } = {
      '基础护理': 'bg-blue-100 text-blue-800',
      '美甲设计': 'bg-pink-100 text-pink-800',
      '艺术美甲': 'bg-purple-100 text-purple-800',
      '修护保养': 'bg-green-100 text-green-800',
      '特色服务': 'bg-yellow-100 text-yellow-800',
    };
    return categoryColors[category || ''] || 'bg-gray-100 text-gray-800';
  },

  // Get status color
  getStatusColor: (isActive: boolean): string => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  },

  // Get status text
  getStatusText: (isActive: boolean): string => {
    return isActive ? '启用' : '停用';
  },
};