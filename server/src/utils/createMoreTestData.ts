import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createMoreTestData() {
  console.log('🌱 创建更多测试数据...');

  try {
    // 创建更多测试会员
    const testMembers = [
      {
        name: '李雅琳',
        phone: '13900139002',
        email: 'li.yalin@example.com',
        birthday: new Date('1992-08-22'),
        gender: 'FEMALE',
        address: '深圳市南山区科技园',
        membershipLevel: 'SILVER',
        points: 850,
        balance: 200.00,
        totalSpent: 980.00,
        cashSpent: 780.00,
        visitCount: 8,
        debtAmount: 0,
        lastVisit: new Date('2024-01-12'),
        notes: '喜欢简约风格，对服务质量要求高',
      },
      {
        name: '赵敏',
        phone: '13800138003',
        email: 'zhao.min@example.com',
        birthday: new Date('1987-12-05'),
        gender: 'FEMALE',
        address: '广州市天河区珠江新城',
        membershipLevel: 'PLATINUM',
        points: 3200,
        balance: 1800.00,
        totalSpent: 6500.00,
        cashSpent: 4700.00,
        visitCount: 35,
        debtAmount: 0,
        lastVisit: new Date('2024-01-18'),
        notes: 'VIP客户，经常带朋友来消费',
      },
      {
        name: '陈思雨',
        phone: '13700137004',
        email: 'chen.siyu@example.com',
        birthday: new Date('1998-05-15'),
        gender: 'FEMALE',
        address: '杭州市西湖区文三路',
        membershipLevel: 'BRONZE',
        points: 120,
        balance: 50.00,
        totalSpent: 280.00,
        cashSpent: 230.00,
        visitCount: 3,
        debtAmount: 0,
        lastVisit: new Date('2023-12-20'),
        notes: '学生客户，价格敏感',
      },
      {
        name: '王晓芳',
        phone: '13600136005',
        email: 'wang.xiaofang@example.com',
        birthday: new Date('1985-03-10'),
        gender: 'FEMALE',
        address: '成都市锦江区春熙路',
        membershipLevel: 'GOLD',
        points: 1850,
        balance: 0.00,
        totalSpent: 2800.00,
        cashSpent: 2800.00,
        visitCount: 18,
        debtAmount: 50.00,
        lastVisit: new Date('2024-01-08'),
        notes: '经常预约，但最近余额不足',
      },
      {
        name: '刘美琪',
        phone: '13500135006',
        email: null,
        birthday: new Date('1990-11-28'),
        gender: 'FEMALE',
        address: '武汉市江汉区中山大道',
        membershipLevel: 'SILVER',
        points: 650,
        balance: 380.00,
        totalSpent: 1200.00,
        cashSpent: 820.00,
        visitCount: 12,
        debtAmount: 0,
        lastVisit: new Date('2024-01-05'),
        notes: '中等消费客户，偏爱彩绘',
      }
    ];

    const createdMembers = [];
    for (const memberData of testMembers) {
      const member = await prisma.member.create({ data: memberData });
      createdMembers.push(member);
      console.log(`✅ 创建会员: ${member.name} (ID: ${member.id})`);
    }

    // 为新会员创建一些交易记录
    const sampleTransactions = [
      // 李雅琳的交易记录
      {
        memberId: createdMembers[0].id,
        type: 'RECHARGE',
        amount: 500.00,
        balanceBefore: 0.00,
        balanceAfter: 500.00,
        pointsEarned: 50,
        paymentMethod: 'WECHAT',
        description: '新会员充值',
        operatorName: '前台小王',
        createdAt: new Date('2023-11-15T14:00:00'),
      },
      {
        memberId: createdMembers[0].id,
        type: 'CONSUME',
        amount: -300.00,
        balanceBefore: 500.00,
        balanceAfter: 200.00,
        pointsEarned: 30,
        paymentMethod: 'BALANCE',
        description: '套餐消费',
        operatorName: '李师傅',
        createdAt: new Date('2024-01-12T15:30:00'),
      },
      // 赵敏的交易记录
      {
        memberId: createdMembers[1].id,
        type: 'RECHARGE',
        amount: 2000.00,
        balanceBefore: 0.00,
        balanceAfter: 2000.00,
        pointsEarned: 200,
        paymentMethod: 'CARD',
        description: '白金会员大额充值',
        operatorName: '经理小张',
        createdAt: new Date('2023-10-01T10:00:00'),
      },
      {
        memberId: createdMembers[1].id,
        type: 'CONSUME',
        amount: -200.00,
        balanceBefore: 2000.00,
        balanceAfter: 1800.00,
        pointsEarned: 20,
        paymentMethod: 'BALANCE',
        description: '高端美甲服务',
        operatorName: '李师傅',
        createdAt: new Date('2024-01-18T16:00:00'),
      },
      // 陈思雨的交易记录
      {
        memberId: createdMembers[2].id,
        type: 'RECHARGE',
        amount: 100.00,
        balanceBefore: 0.00,
        balanceAfter: 100.00,
        pointsEarned: 10,
        paymentMethod: 'ALIPAY',
        description: '学生优惠充值',
        operatorName: '前台小王',
        createdAt: new Date('2023-12-01T13:00:00'),
      },
      {
        memberId: createdMembers[2].id,
        type: 'CONSUME',
        amount: -50.00,
        balanceBefore: 100.00,
        balanceAfter: 50.00,
        pointsEarned: 5,
        paymentMethod: 'BALANCE',
        description: '基础美甲',
        operatorName: '李师傅',
        createdAt: new Date('2023-12-20T14:00:00'),
      },
    ];

    for (const transactionData of sampleTransactions) {
      await prisma.transaction.create({ data: transactionData });
    }

    console.log(`✅ 创建 ${sampleTransactions.length} 条交易记录`);

    console.log('\n🎉 额外测试数据创建完成！');
    console.log('\n📋 所有会员信息：');
    
    const allMembers = await prisma.member.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    for (const member of allMembers) {
      console.log(`- ${member.name} (${member.membershipLevel}) - ID: ${member.id}`);
    }
    
    console.log('\n🔗 测试链接：');
    console.log('- 会员列表: http://localhost:3000/members');
    console.log('- 会员注册: http://localhost:3000/members/register');
    for (const member of allMembers.slice(0, 3)) {
      console.log(`- ${member.name}: http://localhost:3000/member/${member.id}`);
    }

  } catch (error) {
    console.error('❌ 创建测试数据失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createMoreTestData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default createMoreTestData;