import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始种子数据（SQLite 开发环境）');

  // Staff
  const staffCount = await prisma.staff.count();
  if (staffCount === 0) {
    await prisma.staff.createMany({
      data: [
        { name: '青山', phone: '13800000001', email: 'qingshan@nailsalon.com', specialties: '美甲设计,手部护理,指甲彩绘', isActive: true },
        { name: '软软', phone: '13800000002', email: 'ruanruan@nailsalon.com', specialties: '日式美甲,法式美甲,手部SPA', isActive: true },
        { name: '小美', phone: '13800000003', email: 'xiaomei@nailsalon.com', specialties: '韩式美甲,渐变美甲,指甲修护', isActive: true },
      ],
    });
    console.log('✅ 员工数据完成');
  }

  // Services
  const serviceCount = await prisma.service.count();
  if (serviceCount === 0) {
    await prisma.service.createMany({
      data: [
        { name: '基础美甲', description: '基础修甲、涂色', price: 88, duration: 60, category: '基础护理', isActive: true },
        { name: '法式美甲', description: '经典法式美甲造型', price: 128, duration: 90, category: '美甲设计', isActive: true },
        { name: '水晶美甲', description: '水晶延长美甲', price: 188, duration: 120, category: '艺术美甲', isActive: true },
      ],
    });
    console.log('✅ 服务项目完成');
  }

  // Members (with new schema fields)
  const memberCount = await prisma.member.count();
  if (memberCount === 0) {
    const member = await prisma.member.create({
      data: {
        name: '张小美',
        phone: '13800138001',
        email: 'zhang@example.com',
        gender: 'FEMALE',
        memberDiscount: 0.9,
        rechargeBalance: 500,
        bonusBalance: 50,
        totalSpent: 200,
        cashSpent: 200,
        visitCount: 3,
        notes: '喜欢法式美甲',
      },
    });
    console.log(`✅ 会员创建: ${member.name}`);
  }

  console.log('🎉 种子数据完成');
}

main()
  .catch((e) => { console.error('❌ 种子数据失败', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

