import seedStaff from './seedStaff'
import seedData from './seedData'

async function main() {
  try {
    console.log('🌱 Running database seed...')
    await seedStaff()
    try {
      await seedData()
    } catch (e) {
      console.warn('⚠️ seedData 运行失败，可能与当前 Prisma schema 不一致。先完成员工种子。')
      console.warn(e)
    }
    console.log('✅ Seed completed (staff done)')
  } catch (err) {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  }
}

if (require.main === module) {
  main().then(() => process.exit(0))
}

export default main
