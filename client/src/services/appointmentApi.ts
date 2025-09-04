import {
  Appointment,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  AppointmentListResponse,
  AppointmentListFilters,
  AppointmentStats,
  StaffMember,
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export const appointmentApi = {
  // Get all appointments with filters
  getAppointments: async (filters?: AppointmentListFilters): Promise<AppointmentListResponse> => {
    const searchParams = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/appointments?${searchParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch appointments');
    }
    return response.json();
  },

  // Create new appointment
  createAppointment: async (appointmentData: CreateAppointmentRequest): Promise<{
    message: string;
    appointment: Appointment;
  }> => {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create appointment');
    }

    return response.json();
  },

  // Get appointment by ID
  getAppointmentById: async (id: string): Promise<Appointment> => {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch appointment');
    }
    return response.json();
  },

  // Update appointment
  updateAppointment: async (
    id: string,
    updates: UpdateAppointmentRequest
  ): Promise<{ message: string; appointment: Appointment }> => {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update appointment');
    }
    return response.json();
  },

  // Update appointment status
  updateAppointmentStatus: async (
    id: string,
    status: 'PENDING' | 'CONFIRMED' | 'ARRIVED' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE'
  ): Promise<{ message: string; appointment: Appointment }> => {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update appointment status');
    }
    return response.json();
  },

  // Cancel/delete appointment
  cancelAppointment: async (id: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel appointment');
    }
    return response.json();
  },

  // Get appointment statistics
  getAppointmentStats: async (startDate: string, endDate: string): Promise<AppointmentStats> => {
    const searchParams = new URLSearchParams({
      startDate,
      endDate,
    });

    const response = await fetch(`${API_BASE_URL}/appointments/stats?${searchParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch appointment statistics');
    }
    return response.json();
  },

  // Get available staff
  getAvailableStaff: async (): Promise<StaffMember[]> => {
    const response = await fetch(`${API_BASE_URL}/appointments/staff`);
    if (!response.ok) {
      throw new Error('Failed to fetch staff');
    }
    return response.json();
  },

  // Get appointments for a specific date
  getAppointmentsByDate: async (date: string): Promise<Appointment[]> => {
    const response = await appointmentApi.getAppointments({ date });
    return response.appointments;
  },

  // Get appointments for date range
  getAppointmentsByDateRange: async (
    startDate: string,
    endDate: string
  ): Promise<Appointment[]> => {
    const response = await appointmentApi.getAppointments({ startDate, endDate });
    return response.appointments;
  },

  // Mark appointment as arrived
  markAsArrived: async (id: string) => {
    return appointmentApi.updateAppointmentStatus(id, 'ARRIVED');
  },

  // Start service
  startService: async (id: string) => {
    return appointmentApi.updateAppointmentStatus(id, 'IN_SERVICE');
  },

  // Complete appointment
  completeAppointment: async (id: string) => {
    return appointmentApi.updateAppointmentStatus(id, 'COMPLETED');
  },

  // Mark as overdue
  markAsOverdue: async (id: string) => {
    return appointmentApi.updateAppointmentStatus(id, 'OVERDUE');
  },

  // Helper functions for status management
  getStatusColor: (status: string): string => {
    const statusColors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800', 
      ARRIVED: 'bg-green-100 text-green-800',
      IN_SERVICE: 'bg-purple-100 text-purple-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
      OVERDUE: 'bg-orange-100 text-orange-800',
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  },

  getStatusText: (status: string): string => {
    const statusText = {
      PENDING: '待确认',
      CONFIRMED: '已预约',
      ARRIVED: '已到店',
      IN_SERVICE: '服务中',
      COMPLETED: '已完成',
      CANCELLED: '已取消',
      OVERDUE: '已超时',
    };
    return statusText[status as keyof typeof statusText] || status;
  },

  // Format time helpers
  formatTime: (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  },

  formatDate: (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  },

  formatDateTime: (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  },
};
