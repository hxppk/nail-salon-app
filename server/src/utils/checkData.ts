import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  console.log('🔍 检查现有数据...');

  try {
    const members = await prisma.member.findMany({
      include: {
        transactions: true,
      },
    });

    console.log(`\n📊 找到 ${members.length} 个会员：`);
    
    for (const member of members) {
      console.log(`\n👤 会员: ${member.name}`);
      console.log(`   ID: ${member.id}`);
      console.log(`   手机: ${member.phone}`);
      console.log(`   等级: ${member.membershipLevel}`);
      console.log(`   余额: ¥${member.balance.toFixed(2)}`);
      console.log(`   积分: ${member.points}`);
      console.log(`   交易记录: ${member.transactions.length} 条`);
      console.log(`   测试链接: http://localhost:3000/member/${member.id}`);
    }

    console.log('\n🔗 可用的测试链接：');
    for (const member of members) {
      console.log(`- ${member.name}: http://localhost:3000/member/${member.id}`);
    }

  } catch (error) {
    console.error('❌ 查询数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();