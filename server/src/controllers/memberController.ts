import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RechargeRequest {
  amount: number; // 充值金额（用户实际支付金额）
  giftAmount: number; // 赠金金额（商家赠送金额，可以为0）
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
  memberDiscount: number; // 会员折扣，必选：0.9(9折)、0.88(88折)、0.85(85折)、0.8(8折)、0.75(75折)、0.7(7折)
  notes?: string;
}

interface MemberListQuery {
  page?: string;
  limit?: string;
  search?: string;
  discountLevel?: string;
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

    // Validate member discount (required field)
    const validDiscounts = [1, 0.9, 0.88, 0.85, 0.8, 0.75, 0.7];
    if (!memberData.memberDiscount || !validDiscounts.includes(memberData.memberDiscount)) {
      return res.status(400).json({ error: '请选择有效的会员折扣' });
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
        memberDiscount: memberData.memberDiscount,
        notes: memberData.notes || null,
        rechargeBalance: 0,
        bonusBalance: 0,
        totalSpent: 0,
        cashSpent: 0,
        visitCount: 0
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
      discountLevel = '',
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
    if (discountLevel) {
      where.memberDiscount = parseFloat(discountLevel);
    }

    // Filter by balance status
    if (balanceStatus) {
      switch (balanceStatus) {
        case 'has_balance':
          where.OR = [
            { rechargeBalance: { gt: 0 } },
            { bonusBalance: { gt: 0 } }
          ];
          break;
        case 'no_balance':
          where.rechargeBalance = { lte: 0 };
          where.bonusBalance = { lte: 0 };
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
    const { amount, giftAmount, paymentMethod, description, operatorName }: RechargeRequest = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (giftAmount < 0) {
      return res.status(400).json({ error: 'Gift amount cannot be negative' });
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

    const rechargeBalanceBefore = member.rechargeBalance;
    const bonusBalanceBefore = member.bonusBalance;
    const totalBalanceBefore = rechargeBalanceBefore + bonusBalanceBefore;
    
    // 充值金额进入充值余额，赠金金额进入赠金余额
    const rechargeBalanceAfter = rechargeBalanceBefore + amount;
    const bonusBalanceAfter = bonusBalanceBefore + giftAmount;
    const totalBalanceAfter = rechargeBalanceAfter + bonusBalanceAfter;

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update member balance
      const updatedMember = await tx.member.update({
        where: { id },
        data: {
          rechargeBalance: rechargeBalanceAfter,
          bonusBalance: bonusBalanceAfter,
          updatedAt: new Date()
        }
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          memberId: id,
          type: 'RECHARGE',
          amount, // 充值金额
          giftAmount, // 赠金金额
          balanceBefore: totalBalanceBefore,
          balanceAfter: totalBalanceAfter,
          paymentMethod,
          description: description || `充值 ¥${amount}${giftAmount > 0 ? ` + 赠¥${giftAmount}` : ''} = 到账¥${amount + giftAmount}`,
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
    delete updates.rechargeBalance;
    delete updates.bonusBalance;
    delete updates.totalSpent;
    delete updates.cashSpent;
    delete updates.visitCount;
    delete updates.createdAt;

    // Normalize types for Prisma
    if (typeof updates.birthday === 'string' && updates.birthday) {
      const d = new Date(updates.birthday);
      if (!isNaN(d.getTime())) {
        updates.birthday = d;
      } else {
        delete updates.birthday; // avoid invalid Date errors
      }
    }
    if (updates.email === '') delete updates.email;
    if (updates.address === '') delete updates.address;
    if (updates.notes === '') delete updates.notes;

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

    const totalBalance = member.rechargeBalance + member.bonusBalance;
    if (totalBalance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const rechargeBalanceBefore = member.rechargeBalance;
    const bonusBalanceBefore = member.bonusBalance;
    
    // Consume bonus balance first, then recharge balance
    let remainingAmount = amount;
    let newBonusBalance = bonusBalanceBefore;
    let newRechargeBalance = rechargeBalanceBefore;
    
    if (remainingAmount > 0 && newBonusBalance > 0) {
      const bonusUsed = Math.min(remainingAmount, newBonusBalance);
      newBonusBalance -= bonusUsed;
      remainingAmount -= bonusUsed;
    }
    
    if (remainingAmount > 0) {
      newRechargeBalance -= remainingAmount;
    }
    
    const totalBalanceBefore = rechargeBalanceBefore + bonusBalanceBefore;
    const totalBalanceAfter = newRechargeBalance + newBonusBalance;

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update member balance and stats
      const updatedMember = await tx.member.update({
        where: { id },
        data: {
          rechargeBalance: newRechargeBalance,
          bonusBalance: newBonusBalance,
          totalSpent: member.totalSpent + amount,
          cashSpent: member.cashSpent + amount,
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
          balanceBefore: totalBalanceBefore,
          balanceAfter: totalBalanceAfter,
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
      membershipLevel: 'BRONZE', // Default membership level for compatibility
      balance: member.rechargeBalance + member.bonusBalance,
      points: 0, // Removed field, default to 0 for compatibility
      totalSpent: member.totalSpent,
      cashSpent,
      visitCount: member.visitCount,
      debtAmount: 0, // Removed field, default to 0 for compatibility
      lastVisit: member.lastVisit,
      joinDate: member.createdAt, // Use createdAt as joinDate
      recentActivity: recentTransactions,
      totalAppointments: member.appointments.length
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching member stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
