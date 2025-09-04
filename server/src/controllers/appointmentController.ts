import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const createAppointmentSchema = z.object({
  memberId: z.string().optional(),
  staffId: z.string(),
  customerName: z.string(),
  customerPhone: z.string(),
  customerGender: z.enum(['MALE', 'FEMALE']).optional(),
  guestCount: z.number().min(1).default(1),
  maleGuests: z.number().min(0).default(0),
  femaleGuests: z.number().min(0).default(0),
  startTime: z.string().datetime(),
  serviceName: z.string(),
  duration: z.number().min(30).default(180),
  source: z.enum(['MANUAL', 'PHONE', 'APP']).default('MANUAL'),
  notes: z.string().optional(),
  userNotes: z.string().optional(),
  merchantNotes: z.string().optional(),
});

const updateAppointmentSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'ARRIVED', 'IN_SERVICE', 'COMPLETED', 'CANCELLED', 'OVERDUE']).optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerGender: z.enum(['MALE', 'FEMALE']).optional(),
  guestCount: z.number().min(1).optional(),
  maleGuests: z.number().min(0).optional(),
  femaleGuests: z.number().min(0).optional(),
  startTime: z.string().datetime().optional(),
  serviceName: z.string().optional(),
  duration: z.number().min(30).optional(),
  notes: z.string().optional(),
  userNotes: z.string().optional(),
  merchantNotes: z.string().optional(),
});

const appointmentFiltersSchema = z.object({
  date: z.string().optional(), // YYYY-MM-DD
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
  staffId: z.string().optional(),
  memberId: z.string().optional(),
  customerName: z.string().optional(),
  page: z.string().transform((val) => parseInt(val, 10)).optional(),
  limit: z.string().transform((val) => parseInt(val, 10)).optional(),
});

// Get appointments with filters and pagination
export const getAppointments = async (req: Request, res: Response) => {
  try {
    const filters = appointmentFiltersSchema.parse(req.query);
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.date) {
      const startOfDay = new Date(filters.date);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);
      where.startTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    } else {
      if (filters.startDate) {
        where.startTime = { ...where.startTime, gte: new Date(filters.startDate) };
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.startTime = { ...where.startTime, lte: endDate };
      }
    }

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.staffId) {
      where.staffId = filters.staffId;
    }
    if (filters.memberId) {
      where.memberId = filters.memberId;
    }
    if (filters.customerName) {
      where.customerName = { contains: filters.customerName };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          member: {
            select: {
              id: true,
              name: true,
              phone: true,
              membershipLevel: true,
            },
          },
          staff: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy: { startTime: 'asc' },
        skip,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new appointment
export const createAppointment = async (req: Request, res: Response) => {
  try {
    const data = createAppointmentSchema.parse(req.body);
    
    // Calculate end time based on duration
    const startTime = new Date(data.startTime);
    const endTime = new Date(startTime.getTime() + data.duration * 60000);

    // Validate staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: data.staffId },
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // If memberId is provided, validate member exists
    if (data.memberId) {
      const member = await prisma.member.findUnique({
        where: { id: data.memberId },
      });

      if (!member) {
        return res.status(404).json({ error: 'Member not found' });
      }
    }

    // Check for time conflicts
    const conflictingAppointments = await prisma.appointment.findMany({
      where: {
        staffId: data.staffId,
        status: { notIn: ['CANCELLED', 'COMPLETED'] },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
        ],
      },
    });

    if (conflictingAppointments.length > 0) {
      return res.status(409).json({ 
        error: 'Time slot conflicts with existing appointment',
        conflicts: conflictingAppointments,
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        ...data,
        startTime,
        endTime,
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            phone: true,
            membershipLevel: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get appointment by ID
export const getAppointmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            phone: true,
            membershipLevel: true,
            balance: true,
            points: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            phone: true,
            specialties: true,
          },
        },
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update appointment
export const updateAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateAppointmentSchema.parse(req.body);

    const existingAppointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!existingAppointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    let endTime = existingAppointment.endTime;
    
    // Recalculate end time if start time or duration changes
    if (data.startTime || data.duration) {
      const startTime = data.startTime ? new Date(data.startTime) : existingAppointment.startTime;
      const duration = data.duration || existingAppointment.duration;
      endTime = new Date(startTime.getTime() + duration * 60000);
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...data,
        ...(data.startTime && { startTime: new Date(data.startTime) }),
        ...(endTime !== existingAppointment.endTime && { endTime }),
        updatedAt: new Date(),
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            phone: true,
            membershipLevel: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    res.json({
      message: 'Appointment updated successfully',
      appointment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update appointment status
export const updateAppointmentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['PENDING', 'CONFIRMED', 'ARRIVED', 'IN_SERVICE', 'COMPLETED', 'CANCELLED', 'OVERDUE'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date(),
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            phone: true,
            membershipLevel: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    res.json({
      message: 'Appointment status updated successfully',
      appointment,
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete appointment
export const deleteAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    await prisma.appointment.delete({
      where: { id },
    });

    res.json({
      message: 'Appointment cancelled successfully',
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get appointment statistics for a specific date range
export const getAppointmentStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);

    const stats = await prisma.appointment.groupBy({
      by: ['status'],
      where: {
        startTime: {
          gte: start,
          lte: end,
        },
      },
      _count: {
        id: true,
      },
    });

    const formattedStats = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Ensure all status types are represented
    const allStatuses = ['PENDING', 'CONFIRMED', 'ARRIVED', 'IN_SERVICE', 'COMPLETED', 'CANCELLED', 'OVERDUE'];
    allStatuses.forEach(status => {
      if (!(status in formattedStats)) {
        formattedStats[status] = 0;
      }
    });

    res.json(formattedStats);
  } catch (error) {
    console.error('Error fetching appointment stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get available staff list
export const getAvailableStaff = async (req: Request, res: Response) => {
  try {
    const staff = await prisma.staff.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        phone: true,
        specialties: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};