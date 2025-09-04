import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedStaff() {
  try {
    // Check if staff already exist
    const existingStaff = await prisma.staff.count();
    if (existingStaff > 0) {
      console.log('Staff already exist, skipping seed...');
      return;
    }

    // Create staff members
    const staffData = [
      {
        name: '青山',
        phone: '13800000001',
        email: 'qingshan@nailsalon.com',
        specialties: '美甲设计,手部护理,指甲彩绘',
        isActive: true,
      },
      {
        name: '软软',
        phone: '13800000002', 
        email: 'ruanruan@nailsalon.com',
        specialties: '日式美甲,法式美甲,手部SPA',
        isActive: true,
      },
      {
        name: '小美',
        phone: '13800000003',
        email: 'xiaomei@nailsalon.com', 
        specialties: '韩式美甲,渐变美甲,指甲修护',
        isActive: true,
      },
    ];

    for (const staff of staffData) {
      await prisma.staff.create({
        data: staff,
      });
      console.log(`Created staff: ${staff.name}`);
    }

    console.log('Staff seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding staff:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedStaff()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seedStaff;