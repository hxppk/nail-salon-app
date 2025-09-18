// Lightweight controller smoke tests without running Express server
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; console.log('HTTP', this.statusCode, JSON.stringify(payload).slice(0, 300) + (JSON.stringify(payload).length > 300 ? '…' : '')); }
  };
}

async function ensureSeed() {
  // Seed minimal staff and services if empty
  const staffCount = await prisma.staff.count();
  if (staffCount === 0) {
    await prisma.staff.createMany({ data: [
      { name: '青山', phone: '13800000001', email: 'qingshan@nailsalon.com', specialties: '美甲设计,手部护理,指甲彩绘', isActive: true },
      { name: '软软', phone: '13800000002', email: 'ruanruan@nailsalon.com', specialties: '日式美甲,法式美甲,手部SPA', isActive: true },
    ] });
    console.log('Seeded staff');
  }

  const serviceCount = await prisma.service.count();
  if (serviceCount === 0) {
    await prisma.service.createMany({ data: [
      { name: '基础美甲', price: 88, description: '基础修甲、涂色', duration: 60, category: '基础护理', isActive: true },
      { name: '法式美甲', price: 128, description: '经典法式美甲造型', duration: 90, category: '美甲设计', isActive: true },
    ] });
    console.log('Seeded services');
  }
}

async function run() {
  await ensureSeed();

  // Import built controllers
  const memberCtrl = require('./dist/controllers/memberController.js');
  const serviceCtrl = require('./dist/controllers/serviceController.js');
  const appointmentCtrl = require('./dist/controllers/appointmentController.js');

  // 1) List members (after create-test-members seed)
  console.log('\n== GET /api/members ==');
  await memberCtrl.getMembers({ query: { page: '1', limit: '5' } }, mockRes());

  // 2) Create a member (valid)
  console.log('\n== POST /api/members (create) ==');
  const newPhone = '1391234' + Math.floor(10000 + Math.random()*89999); // not a valid CN 11-digit; use valid
  const validPhone = '15' + Math.floor(300000000 + Math.random()*699999999); // starts with 15x to match regex
  const createRes = mockRes();
  await memberCtrl.createMember({ body: { name: '测试会员', phone: String(validPhone), memberDiscount: 0.9 } }, createRes);
  const createdMemberId = createRes.body?.member?.id;

  // 2.1) Recharge balance
  if (createdMemberId) {
    console.log('\n== POST /api/members/:id/recharge ==');
    await memberCtrl.rechargeBalance({ params: { id: createdMemberId }, body: { amount: 200, giftAmount: 20, paymentMethod: 'ALIPAY', description: '测试充值', operatorName: '测试员' } }, mockRes());

    // 2.2) Consume balance
    console.log('\n== POST /api/members/:id/consume ==');
    await memberCtrl.consumeBalance({ params: { id: createdMemberId }, body: { amount: 80, description: '测试消费', operatorName: '测试员' } }, mockRes());
  }

  // 3) List services
  console.log('\n== GET /api/services ==');
  await serviceCtrl.getServices({ query: { page: '1', limit: '10' } }, mockRes());

  // 4) Create appointment
  console.log('\n== POST /api/appointments (create) ==');
  const [staff] = await prisma.staff.findMany({ take: 1 });
  const start = new Date(Date.now() + 3600*1000).toISOString();
  await appointmentCtrl.createAppointment({ body: {
    staffId: staff.id,
    customerName: '测试客户',
    customerPhone: '13800001111',
    startTime: start,
    serviceName: '基础美甲',
    duration: 60,
    source: 'MANUAL'
  } }, mockRes());

  // 5) Get appointment stats for today
  console.log('\n== GET /api/appointments/stats ==');
  const today = new Date();
  const ymd = (d) => d.toISOString().slice(0,10);
  await appointmentCtrl.getAppointmentStats({ query: { startDate: ymd(today), endDate: ymd(today) } }, mockRes());
}

run()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
