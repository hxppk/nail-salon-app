
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestMembers() {
  console.log('Creating test members with new fields...');
  
  const members = [
    {
      name: '张小美',
      phone: '13800138888',
      email: 'zhang@example.com',
      memberDiscount: 0.9,
      rechargeBalance: 500.00,
      bonusBalance: 50.00,
      totalSpent: 200.00,
      cashSpent: 200.00,
      visitCount: 3
    },
    {
      name: '李雅琳',
      phone: '13900139999',
      email: 'li@example.com', 
      memberDiscount: 0.8,
      rechargeBalance: 300.00,
      bonusBalance: 100.00,
      totalSpent: 500.00,
      cashSpent: 400.00,
      visitCount: 5
    },
    {
      name: '王晓芳',
      phone: '13700137777',
      email: 'wang@example.com',
      memberDiscount: 0.7,
      rechargeBalance: 800.00,
      bonusBalance: 200.00,
      totalSpent: 1200.00,
      cashSpent: 1000.00,
      visitCount: 8
    }
  ];

  for (const member of members) {
    await prisma.member.upsert({
      where: { phone: member.phone },
      update: member,
      create: member
    });
  }

  console.log('Test members created successfully!');
}

createTestMembers()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

