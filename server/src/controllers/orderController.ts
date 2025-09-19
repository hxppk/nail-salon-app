import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 创建订单
export const createOrder = async (req: Request, res: Response) => {
  try {
    const {
      orderNumber,
      memberId,
      appointmentId,
      customerName,
      customerPhone,
      maleCount,
      femaleCount,
      source,
      orderItems,
      giftDiscountEnabled,
      deductionOrder,
      notes,
      operatorName
    } = req.body;

    // 验证手工单号唯一性
    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber }
    });
    if (existingOrder) {
      return res.status(400).json({ error: '手工单号已存在' });
    }

    // 检查预约是否已有订单
    if (appointmentId) {
      const existingAppointmentOrder = await prisma.order.findFirst({
        where: { appointmentId }
      });
      if (existingAppointmentOrder) {
        return res.status(400).json({
          error: '该预约已有关联订单',
          orderId: existingAppointmentOrder.id,
          orderStatus: existingAppointmentOrder.status
        });
      }
    }

    // 计算订单总金额
    let totalAmount = 0;
    const processedItems = orderItems.map((item: any) => {
      const subtotal = item.unitPrice * (item.quantity || 1);
      totalAmount += subtotal;
      return {
        ...item,
        quantity: item.quantity || 1,
        subtotal
      };
    });

    // 获取会员信息（如果是会员）
    let member = null;
    let memberDiscount = 1.0;
    if (memberId) {
      member = await prisma.member.findUnique({
        where: { id: memberId }
      });
      if (member) {
        memberDiscount = member.memberDiscount;
      }
    }

    // 计算折扣和实际金额
    const discountAmount = totalAmount * (1 - memberDiscount);
    const actualAmount = totalAmount - discountAmount;

    // 创建订单
    const order = await prisma.order.create({
      data: {
        orderNumber,
        memberId,
        appointmentId,
        customerName,
        customerPhone,
        maleCount: maleCount || 0,
        femaleCount: femaleCount || 0,
        source: source || 'MANUAL',
        totalAmount,
        discountAmount,
        actualAmount,
        memberDiscount,
        giftDiscountEnabled: giftDiscountEnabled ?? true,
        deductionOrder: deductionOrder || 'GIFT_FIRST',
        notes,
        operatorName,
        orderItems: {
          create: processedItems
        }
      },
      include: {
        orderItems: true,
        member: true,
        appointment: true
      }
    });

    res.json(order);
  } catch (error) {
    console.error('创建订单失败:', error);
    res.status(500).json({ error: '创建订单失败' });
  }
};

// 支付订单（会员余额扣减）
export const payOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { operatorName } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        member: true,
        appointment: true,
        orderItems: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.status === 'PAID') {
      return res.status(400).json({ error: '订单已支付' });
    }

    if (!order.member) {
      return res.status(400).json({ error: '非会员无法使用余额支付' });
    }

    const member = order.member;
    const totalBalance = member.rechargeBalance + member.bonusBalance;

    // 根据赠金折扣设置预计算所需余额
    let requiredBalance = order.actualAmount;
    if (!order.giftDiscountEnabled) {
      // 赠金不参与折扣时，需要更复杂的计算来验证余额是否充足
      // 这里我们先做一个简化的计算，如果不够后面会详细计算
      const maxPossibleDiscount = order.totalAmount * (1 - order.memberDiscount);
      const minRequiredBalance = order.totalAmount - maxPossibleDiscount;
      requiredBalance = Math.max(order.actualAmount, minRequiredBalance);
    }

    // 基本余额检查
    if (totalBalance < requiredBalance) {
      return res.status(400).json({
        error: '余额不足',
        required: requiredBalance,
        available: totalBalance
      });
    }

    // 计算扣减金额
    let rechargePaid = 0;
    let giftPaid = 0;
    let remainingAmount = order.actualAmount;

    // 根据赠金折扣设置计算实际扣减金额
    if (order.giftDiscountEnabled) {
      // 赠金参与折扣，整个金额按会员折扣计算
      if (order.deductionOrder === 'GIFT_FIRST') {
        // 赠金优先
        giftPaid = Math.min(member.bonusBalance, remainingAmount);
        remainingAmount -= giftPaid;
        rechargePaid = Math.min(member.rechargeBalance, remainingAmount);
      } else {
        // 充值余额优先
        rechargePaid = Math.min(member.rechargeBalance, remainingAmount);
        remainingAmount -= rechargePaid;
        giftPaid = Math.min(member.bonusBalance, remainingAmount);
      }
    } else {
      // 赠金不参与折扣，需要分别计算
      const totalOriginalAmount = order.totalAmount;
      const giftRatio = member.bonusBalance / totalBalance;
      const rechargeRatio = member.rechargeBalance / totalBalance;

      if (order.deductionOrder === 'GIFT_FIRST') {
        // 赠金优先，赠金按原价扣减，充值余额按折扣价扣减
        giftPaid = Math.min(member.bonusBalance, totalOriginalAmount);
        const remainingOriginal = totalOriginalAmount - giftPaid;
        const remainingDiscounted = remainingOriginal * order.memberDiscount;
        rechargePaid = Math.min(member.rechargeBalance, remainingDiscounted);
      } else {
        // 充值余额优先，充值余额按折扣价扣减，剩余部分赠金按原价扣减
        rechargePaid = Math.min(member.rechargeBalance, order.actualAmount);
        const remainingDiscounted = order.actualAmount - rechargePaid;
        const remainingOriginal = remainingDiscounted / order.memberDiscount;
        giftPaid = Math.min(member.bonusBalance, remainingOriginal);
      }
    }

    // 最终验证：确保扣减金额足够支付订单
    let totalValuePaid = 0;
    if (order.giftDiscountEnabled) {
      // 赠金享受折扣，都按折扣价计算
      totalValuePaid = rechargePaid + giftPaid;
    } else {
      // 赠金不享受折扣，按原价计算赠金，按折扣价计算充值余额
      totalValuePaid = rechargePaid + (giftPaid * order.memberDiscount);
    }

    if (totalValuePaid < order.actualAmount) {
      return res.status(400).json({
        error: '余额不足以支付订单',
        required: order.actualAmount,
        available: totalValuePaid,
        details: {
          rechargePaid,
          giftPaid,
          giftDiscountEnabled: order.giftDiscountEnabled,
          memberDiscount: order.memberDiscount
        }
      });
    }

    // 开始事务
    const result = await prisma.$transaction(async (tx) => {
      // 更新会员余额
      const updatedMember = await tx.member.update({
        where: { id: member.id },
        data: {
          rechargeBalance: member.rechargeBalance - rechargePaid,
          bonusBalance: member.bonusBalance - giftPaid,
          totalSpent: member.totalSpent + order.actualAmount,
          visitCount: member.visitCount + 1,
          lastVisit: new Date(),
          updatedAt: new Date()
        }
      });

      // 更新订单状态
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: 'PAID',
          paidAmount: order.actualAmount,
          rechargePaid,
          giftPaid
        },
        include: {
          orderItems: true,
          member: true,
          appointment: true
        }
      });

      // 准备服务项目信息
      const serviceItemsJson = JSON.stringify(processedItems.map(item => ({
        serviceName: item.serviceName,
        serviceStaff: item.serviceStaff,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.subtotal
      })));

      // 创建消费交易记录
      const transaction = await tx.transaction.create({
        data: {
          memberId: member.id,
          orderId: order.id,
          appointmentId: order.appointmentId,
          type: 'CONSUME',
          amount: order.actualAmount,
          balanceBefore: totalBalance,
          balanceAfter: totalBalance - order.actualAmount,
          paymentMethod: 'BALANCE',
          description: `消费订单 ${order.orderNumber}`,
          operatorName,
          // 增加详细支付信息
          originalAmount: totalAmount,
          memberDiscount: memberDiscount,
          discountAmount,
          giftDiscountEnabled: order.giftDiscountEnabled,
          deductionOrder: order.deductionOrder,
          rechargePaid,
          giftPaid,
          serviceItems: serviceItemsJson,
          appointmentTime: order.appointment?.startTime?.toISOString()
        }
      });

      // 如果有关联预约，更新预约状态
      if (order.appointmentId) {
        await tx.appointment.update({
          where: { id: order.appointmentId },
          data: { status: 'COMPLETED' }
        });
      }

      return { updatedOrder, updatedMember, transaction };
    });

    res.json(result.updatedOrder);
  } catch (error) {
    console.error('支付订单失败:', error);
    res.status(500).json({ error: '支付订单失败' });
  }
};

// 获取订单详情
export const getOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: true,
        member: true,
        appointment: true,
        transactions: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    res.json(order);
  } catch (error) {
    console.error('获取订单失败:', error);
    res.status(500).json({ error: '获取订单失败' });
  }
};

// 获取订单列表
export const getOrders = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      memberPhone,
      orderNumber,
      startDate,
      endDate
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (memberPhone) {
      where.customerPhone = {
        contains: memberPhone as string
      };
    }

    if (orderNumber) {
      where.orderNumber = {
        contains: orderNumber as string
      };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          orderItems: true,
          member: true,
          appointment: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
        hasNext: skip + Number(limit) < total,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    res.status(500).json({ error: '获取订单列表失败' });
  }
};

// 计算订单预览（不创建订单，仅计算金额）
export const calculateOrderPreview = async (req: Request, res: Response) => {
  try {
    const {
      memberId,
      orderItems,
      giftDiscountEnabled = true
    } = req.body;

    // 计算订单总金额
    let totalAmount = 0;
    orderItems.forEach((item: any) => {
      totalAmount += item.unitPrice * (item.quantity || 1);
    });

    let memberDiscount = 1.0;
    let member = null;
    let balanceInfo = null;

    if (memberId) {
      member = await prisma.member.findUnique({
        where: { id: memberId }
      });

      if (member) {
        memberDiscount = member.memberDiscount;
        const discountAmount = totalAmount * (1 - memberDiscount);
        const actualAmount = totalAmount - discountAmount;

        balanceInfo = {
          rechargeBalance: member.rechargeBalance,
          bonusBalance: member.bonusBalance,
          totalBalance: member.rechargeBalance + member.bonusBalance,
          sufficient: (member.rechargeBalance + member.bonusBalance) >= actualAmount
        };
      }
    }

    const discountAmount = totalAmount * (1 - memberDiscount);
    const actualAmount = totalAmount - discountAmount;

    res.json({
      totalAmount,
      memberDiscount,
      discountAmount,
      actualAmount,
      member: member ? {
        id: member.id,
        name: member.name,
        phone: member.phone,
        memberDiscount: member.memberDiscount
      } : null,
      balanceInfo
    });
  } catch (error) {
    console.error('计算订单预览失败:', error);
    res.status(500).json({ error: '计算订单预览失败' });
  }
};