import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedData() {
  console.log('🌱 开始种子数据...');

  try {
    // 创建测试会员
    const testMember = await prisma.member.create({
      data: {
        name: '张小美',
        phone: '13800138001',
        email: 'zhang.xiaomei@example.com',
        birthday: new Date('1995-06-15'),
        gender: 'FEMALE',
        address: '上海市浦东新区陆家嘴金融中心',
        membershipLevel: 'GOLD',
        points: 1250,
        balance: 500.00,
        totalSpent: 1800.50,
        cashSpent: 1300.50,
        visitCount: 12,
        debtAmount: 0,
        lastVisit: new Date('2024-01-15'),
        notes: '喜欢法式美甲，对颜色要求较高',
      },
    });

    console.log(`✅ 创建测试会员: ${testMember.name} (ID: ${testMember.id})`);

    // 创建员工
    const staff = await prisma.staff.create({
      data: {
        name: '李师傅',
        phone: '13900139001',
        email: 'li.shifu@example.com',
        specialties: '法式美甲,水晶美甲,手部护理',
        isActive: true,
      },
    });

    console.log(`✅ 创建员工: ${staff.name} (ID: ${staff.id})`);

    // 创建服务项目
    const serviceData = [
      {
        name: '基础美甲',
        description: '基础修甲、涂色',
        price: 88.00,
        duration: 60,
        category: '美甲服务',
      },
      {
        name: '法式美甲',
        description: '经典法式美甲造型',
        price: 128.00,
        duration: 90,
        category: '美甲服务',
      },
      {
        name: '水晶美甲',
        description: '水晶延长美甲',
        price: 188.00,
        duration: 120,
        category: '美甲服务',
      },
      {
        name: '手部护理',
        description: '手部深度护理+按摩',
        price: 68.00,
        duration: 45,
        category: '护理服务',
      },
    ];

    const createdServices = [];
    for (const service of serviceData) {
      const createdService = await prisma.service.create({ data: service });
      createdServices.push(createdService);
    }

    console.log(`✅ 创建 ${createdServices.length} 个服务项目`);

    // 获取服务列表
    const serviceList = await prisma.service.findMany();

    // 创建预约记录
    const appointment = await prisma.appointment.create({
      data: {
        memberId: testMember.id,
        staffId: staff.id,
        startTime: new Date('2024-01-15T14:00:00'),
        endTime: new Date('2024-01-15T15:30:00'),
        status: 'COMPLETED',
        notes: '客户非常满意，下次继续预约',
        totalAmount: 188.00,
      },
    });

    // 关联服务
    await prisma.appointmentService.create({
      data: {
        appointmentId: appointment.id,
        serviceId: createdServices[2].id, // 水晶美甲
      },
    });

    console.log(`✅ 创建预约记录 (ID: ${appointment.id})`);

    // 创建充值记录
    const rechargeTransactions = [
      {
        memberId: testMember.id,
        type: 'RECHARGE',
        amount: 1000.00,
        balanceBefore: 0.00,
        balanceAfter: 1000.00,
        pointsEarned: 100,
        paymentMethod: 'ALIPAY',
        description: '新会员充值优惠活动',
        operatorName: '前台小王',
        createdAt: new Date('2023-12-01T10:00:00'),
      },
      {
        memberId: testMember.id,
        type: 'CONSUME',
        amount: -188.00,
        balanceBefore: 1000.00,
        balanceAfter: 812.00,
        pointsEarned: 18,
        paymentMethod: 'BALANCE',
        description: '水晶美甲服务消费',
        appointmentId: appointment.id,
        operatorName: '李师傅',
        createdAt: new Date('2024-01-15T14:00:00'),
      },
      {
        memberId: testMember.id,
        type: 'CONSUME',
        amount: -128.00,
        balanceBefore: 812.00,
        balanceAfter: 684.00,
        pointsEarned: 12,
        paymentMethod: 'BALANCE',
        description: '法式美甲服务消费',
        operatorName: '李师傅',
        createdAt: new Date('2024-01-10T15:30:00'),
      },
      {
        memberId: testMember.id,
        type: 'CONSUME',
        amount: -88.00,
        balanceBefore: 684.00,
        balanceAfter: 596.00,
        pointsEarned: 8,
        paymentMethod: 'BALANCE',
        description: '基础美甲服务消费',
        operatorName: '李师傅',
        createdAt: new Date('2024-01-05T16:00:00'),
      },
      {
        memberId: testMember.id,
        type: 'CONSUME',
        amount: -96.00,
        balanceBefore: 596.00,
        balanceAfter: 500.00,
        pointsEarned: 9,
        paymentMethod: 'BALANCE',
        description: '手部护理+基础美甲套餐',
        operatorName: '李师傅',
        createdAt: new Date('2023-12-28T14:30:00'),
      },
    ];

    for (const transaction of rechargeTransactions) {
      await prisma.transaction.create({ data: transaction });
    }

    console.log(`✅ 创建 ${rechargeTransactions.length} 条交易记录`);

    // 创建第二个测试会员
    const member2 = await prisma.member.create({
      data: {
        name: '王丽华',
        phone: '13800138002',
        email: 'wang.lihua@example.com',
        birthday: new Date('1988-03-22'),
        gender: 'FEMALE',
        address: '北京市朝阳区国贸CBD',
        membershipLevel: 'PLATINUM',
        points: 2800,
        balance: 1200.00,
        totalSpent: 3500.00,
        cashSpent: 2300.00,
        visitCount: 28,
        debtAmount: 0,
        lastVisit: new Date('2024-01-20'),
        notes: '长期客户，偏爱简约风格',
      },
    });

    console.log(`✅ 创建第二个测试会员: ${member2.name} (ID: ${member2.id})`);

    // 为第二个会员创建一些交易记录
    const member2Transactions = [
      {
        memberId: member2.id,
        type: 'RECHARGE',
        amount: 2000.00,
        balanceBefore: 0.00,
        balanceAfter: 2000.00,
        pointsEarned: 200,
        paymentMethod: 'WECHAT',
        description: '白金会员大额充值',
        operatorName: '经理小张',
        createdAt: new Date('2023-11-01T11:00:00'),
      },
      {
        memberId: member2.id,
        type: 'CONSUME',
        amount: -800.00,
        balanceBefore: 2000.00,
        balanceAfter: 1200.00,
        pointsEarned: 80,
        paymentMethod: 'BALANCE',
        description: '套餐消费（多次服务）',
        operatorName: '李师傅',
        createdAt: new Date('2024-01-20T10:00:00'),
      },
    ];

    for (const transaction of member2Transactions) {
      await prisma.transaction.create({ data: transaction });
    }

    console.log(`✅ 为第二个会员创建 ${member2Transactions.length} 条交易记录`);

    console.log('\n🎉 种子数据创建完成！');
    console.log('\n📋 测试会员信息：');
    console.log(`1. ${testMember.name} - ID: ${testMember.id}`);
    console.log(`2. ${member2.name} - ID: ${member2.id}`);
    console.log('\n🔗 可以访问以下URL测试：');
    console.log(`- http://localhost:3000/member/${testMember.id}`);
    console.log(`- http://localhost:3000/member/${member2.id}`);

  } catch (error) {
    console.error('❌ 种子数据创建失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seedData;