import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RechargeRequest {
  amount: number;
  paymentMethod: string;
  description?: string;
  operatorName?: string;
}

interface CreateMemberRequest {
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
  gender?: string;
  address?: string;
  membershipLevel?: string;
  notes?: string;
}

interface MemberListQuery {
  page?: string;
  limit?: string;
  search?: string;
  membershipLevel?: string;
  balanceStatus?: string;
  registrationPeriod?: string;
  activityStatus?: string;
  spendingLevel?: string;
  sortBy?: string;
  sortOrder?: string;
}

// Create new member
export const createMember = async (req: Request, res: Response) => {
  try {
    const memberData: CreateMemberRequest = req.body;

    // Validate required fields
    if (!memberData.name || !memberData.phone) {
      return res.status(400).json({ error: '姓名和手机号是必填项' });
    }

    // Validate phone number format
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(memberData.phone)) {
      return res.status(400).json({ error: '手机号格式不正确' });
    }

    // Validate email format if provided
    if (memberData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(memberData.email)) {
        return res.status(400).json({ error: '邮箱格式不正确' });
      }
    }

    // Check if phone number already exists
    const existingMember = await prisma.member.findUnique({
      where: { phone: memberData.phone }
    });

    if (existingMember) {
      return res.status(400).json({ error: '该手机号已被注册' });
    }

    const member = await prisma.member.create({
      data: {
        name: memberData.name,
        phone: memberData.phone,
        email: memberData.email || null,
        birthday: memberData.birthday ? new Date(memberData.birthday) : null,
        gender: memberData.gender || null,
        address: memberData.address || null,
        membershipLevel: memberData.membershipLevel || 'BRONZE',
        notes: memberData.notes || null,
        balance: 0,
        totalSpent: 0,
        cashSpent: 0,
        visitCount: 0,
        debtAmount: 0,
        points: 0
      }
    });

    res.status(201).json({
      message: '会员创建成功',
      member
    });
  } catch (error) {
    console.error('Error creating member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all members with filters and pagination
export const getMembers = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      search = '',
      membershipLevel = '',
      balanceStatus = '',
      registrationPeriod = '',
      activityStatus = '',
      spendingLevel = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    }: MemberListQuery = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    // Search by name or phone
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } }
      ];
    }

    // Filter by membership level
    if (membershipLevel) {
      where.membershipLevel = membershipLevel;
    }

    // Filter by balance status
    if (balanceStatus) {
      switch (balanceStatus) {
        case 'has_balance':
          where.balance = { gt: 0 };
          break;
        case 'no_balance':
          where.balance = { lte: 0 };
          where.debtAmount = { lte: 0 };
          break;
        case 'has_debt':
          where.debtAmount = { gt: 0 };
          break;
      }
    }

    // Filter by registration period
    if (registrationPeriod) {
      const now = new Date();
      let startDate: Date;
      
      switch (registrationPeriod) {
        case 'this_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'last_3_months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          break;
        case 'this_year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }
      
      where.createdAt = { gte: startDate };
    }

    // Filter by spending level
    if (spendingLevel) {
      switch (spendingLevel) {
        case 'high':
          where.totalSpent = { gt: 5000 };
          break;
        case 'medium':
          where.totalSpent = { gte: 1000, lte: 5000 };
          break;
        case 'low':
          where.totalSpent = { lt: 1000 };
          break;
      }
    }

    // Get members with transactions for activity filtering
    let members = await prisma.member.findMany({
      where,
      include: {
        transactions: {
          select: {
            createdAt: true,
            type: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limitNum
    });

    // Filter by activity status (post-process since we need transaction data)
    if (activityStatus) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      members = members.filter(member => {
        const lastTransaction = member.transactions[0];
        const lastActivity = lastTransaction ? new Date(lastTransaction.createdAt) : member.lastVisit ? new Date(member.lastVisit) : new Date(member.createdAt);

        switch (activityStatus) {
          case 'active':
            return lastActivity > thirtyDaysAgo;
          case 'dormant':
            return lastActivity < ninetyDaysAgo;
          default:
            return true;
        }
      });
    }

    // Get total count for pagination
    const total = await prisma.member.count({ where });

    // Remove transaction data from response
    const membersWithoutTransactions = members.map(({ transactions, ...member }) => member);

    res.json({
      members: membersWithoutTransactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMemberById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        appointments: {
          where: {
            status: 'COMPLETED'
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            services: {
              include: {
                service: true
              }
            }
          }
        }
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json(member);
  } catch (error) {
    console.error('Error fetching member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const rechargeBalance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, description, operatorName }: RechargeRequest = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!paymentMethod) {
      return res.status(400).json({ error: 'Payment method is required' });
    }

    const member = await prisma.member.findUnique({
      where: { id }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const balanceBefore = member.balance;
    const balanceAfter = balanceBefore + amount;

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update member balance
      const updatedMember = await tx.member.update({
        where: { id },
        data: {
          balance: balanceAfter,
          updatedAt: new Date()
        }
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          memberId: id,
          type: 'RECHARGE',
          amount,
          balanceBefore,
          balanceAfter,
          paymentMethod,
          description: description || `充值 ¥${amount}`,
          operatorName
        }
      });

      return { member: updatedMember, transaction };
    });

    res.json({
      message: 'Recharge successful',
      member: result.member,
      transaction: result.transaction
    });
  } catch (error) {
    console.error('Error processing recharge:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMemberTransactions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '20', type } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { memberId: id };
    if (type) {
      where.type = type;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          appointment: {
            include: {
              services: {
                include: {
                  service: true
                }
              }
            }
          }
        }
      }),
      prisma.transaction.count({ where })
    ]);

    res.json({
      transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.balance;
    delete updates.totalSpent;
    delete updates.cashSpent;
    delete updates.visitCount;
    delete updates.createdAt;

    const member = await prisma.member.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });

    res.json(member);
  } catch (error: any) {
    console.error('Error updating member:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const consumeBalance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, description, appointmentId, operatorName } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const member = await prisma.member.findUnique({
      where: { id }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (member.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const balanceBefore = member.balance;
    const balanceAfter = balanceBefore - amount;

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update member balance and stats
      const updatedMember = await tx.member.update({
        where: { id },
        data: {
          balance: balanceAfter,
          totalSpent: member.totalSpent + amount,
          visitCount: member.visitCount + 1,
          lastVisit: new Date(),
          updatedAt: new Date()
        }
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          memberId: id,
          appointmentId,
          type: 'CONSUME',
          amount: -amount,
          balanceBefore,
          balanceAfter,
          paymentMethod: 'BALANCE',
          description: description || `消费 ¥${amount}`,
          operatorName
        }
      });

      return { member: updatedMember, transaction };
    });

    res.json({
      message: 'Consumption successful',
      member: result.member,
      transaction: result.transaction
    });
  } catch (error) {
    console.error('Error processing consumption:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMemberStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        transactions: true,
        appointments: {
          where: { status: 'COMPLETED' }
        }
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Calculate cash spent (non-balance transactions)
    const cashTransactions = member.transactions.filter(t => 
      t.type === 'CONSUME' && t.paymentMethod !== 'BALANCE'
    );
    const cashSpent = cashTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Calculate recent activity
    const recentTransactions = member.transactions
      .filter(t => new Date(t.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .length;

    const stats = {
      memberId: member.id,
      name: member.name,
      phone: member.phone,
      membershipLevel: member.membershipLevel,
      balance: member.balance,
      points: member.points,
      totalSpent: member.totalSpent,
      cashSpent,
      visitCount: member.visitCount,
      debtAmount: member.debtAmount,
      lastVisit: member.lastVisit,
      joinDate: member.joinDate,
      recentActivity: recentTransactions,
      totalAppointments: member.appointments.length
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching member stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};