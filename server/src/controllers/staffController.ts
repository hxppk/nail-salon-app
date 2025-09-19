import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 获取员工列表
export const getStaff = async (req: Request, res: Response) => {
  try {
    const staff = await prisma.staff.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    res.json(staff);
  } catch (error) {
    console.error('获取员工列表失败:', error);
    res.status(500).json({ error: '获取员工列表失败' });
  }
};

// 获取员工详情
export const getStaffMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const staff = await prisma.staff.findUnique({
      where: { id }
    });

    if (!staff) {
      return res.status(404).json({ error: '员工不存在' });
    }

    res.json(staff);
  } catch (error) {
    console.error('获取员工详情失败:', error);
    res.status(500).json({ error: '获取员工详情失败' });
  }
};