import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const createServiceSchema = z.object({
  name: z.string().min(1, '服务项目名称不能为空'),
  price: z.number().positive('价格必须大于0'),
  category: z.string().optional(),
  description: z.string().optional(),
  duration: z.number().positive().optional().default(180),
});

const updateServiceSchema = z.object({
  name: z.string().min(1, '服务项目名称不能为空').optional(),
  price: z.number().positive('价格必须大于0').optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  duration: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

const serviceListQuerySchema = z.object({
  page: z.string().transform((val) => parseInt(val, 10)).optional().default('1'),
  limit: z.string().transform((val) => parseInt(val, 10)).optional().default('20'),
  search: z.string().optional(),
  category: z.string().optional(),
  isActive: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Get all services with filters and pagination
export const getServices = async (req: Request, res: Response) => {
  try {
    const {
      page,
      limit,
      search,
      category,
      isActive,
      sortBy,
      sortOrder
    } = serviceListQuerySchema.parse(req.query);

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Search by name or description
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ];
    }

    // Filter by category
    if (category) {
      where.category = category;
    }

    // Filter by active status
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.service.count({ where })
    ]);

    res.json({
      services,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get service by ID
export const getServiceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        appointmentServices: {
          include: {
            appointment: {
              select: {
                id: true,
                customerName: true,
                startTime: true,
                status: true,
              }
            }
          }
        }
      }
    });

    if (!service) {
      return res.status(404).json({ error: '服务项目不存在' });
    }

    res.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new service
export const createService = async (req: Request, res: Response) => {
  try {
    const data = createServiceSchema.parse(req.body);

    // Check if service with same name already exists
    const existingService = await prisma.service.findUnique({
      where: { name: data.name }
    });

    if (existingService) {
      return res.status(400).json({ error: '该服务项目名称已存在' });
    }

    const service = await prisma.service.create({
      data
    });

    res.status(201).json({
      message: '服务项目创建成功',
      service
    });
  } catch (error) {
    console.error('Error creating service:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update service
export const updateService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateServiceSchema.parse(req.body);

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id }
    });

    if (!existingService) {
      return res.status(404).json({ error: '服务项目不存在' });
    }

    // Check if name is being changed and if it conflicts with existing service
    if (data.name && data.name !== existingService.name) {
      const nameConflict = await prisma.service.findUnique({
        where: { name: data.name }
      });

      if (nameConflict) {
        return res.status(400).json({ error: '该服务项目名称已存在' });
      }
    }

    const service = await prisma.service.update({
      where: { id },
      data
    });

    res.json({
      message: '服务项目更新成功',
      service
    });
  } catch (error) {
    console.error('Error updating service:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete service
export const deleteService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id },
      include: {
        appointmentServices: true
      }
    });

    if (!existingService) {
      return res.status(404).json({ error: '服务项目不存在' });
    }

    // Check if service is used in any appointments
    if (existingService.appointmentServices.length > 0) {
      return res.status(400).json({ 
        error: '该服务项目已被使用，无法删除。您可以选择停用该服务。' 
      });
    }

    await prisma.service.delete({
      where: { id }
    });

    res.json({
      message: '服务项目删除成功'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get service categories (distinct categories from existing services)
export const getServiceCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.service.findMany({
      where: {
        category: { not: null },
        isActive: true
      },
      select: {
        category: true
      },
      distinct: ['category']
    });

    const categoryList = categories
      .map(c => c.category)
      .filter(Boolean)
      .sort();

    res.json(categoryList);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get service statistics
export const getServiceStats = async (req: Request, res: Response) => {
  try {
    const [
      totalServices,
      activeServices,
      totalCategories,
      recentServices
    ] = await Promise.all([
      prisma.service.count(),
      prisma.service.count({ where: { isActive: true } }),
      prisma.service.groupBy({
        by: ['category'],
        where: { category: { not: null } },
        _count: true
      }),
      prisma.service.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          price: true,
          category: true,
          createdAt: true
        }
      })
    ]);

    res.json({
      totalServices,
      activeServices,
      inactiveServices: totalServices - activeServices,
      totalCategories: totalCategories.length,
      recentServices,
      categoryStats: totalCategories
    });
  } catch (error) {
    console.error('Error fetching service stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};