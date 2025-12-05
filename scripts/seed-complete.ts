// scripts/seed-complete.ts
import {
  PrismaClient,
  Role,
  StudyStatus,
  VerifyStatus,
  EntitlementSource,
  RedeemMethod,
  ShipStatus,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const defaultPassword = 'sut12345';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  console.log('🌱 Starting complete seed...\n');

  // --------------------------------------
  // 1) USER (สมาชิก + ศิษย์เก่า)
  // --------------------------------------
  const userData = [
    {
      email: 'admin@sut-eng.ac.th',
      name: 'เจ้าหน้าที่ระบบ ศิษย์เก่า',
      phone: '0891112233',
      addressLine: '111 อาคารวิศวกรรมศาสตร์ มทส.',
      subdistrict: 'สุรนารี',
      district: 'เมืองนครราชสีมา',
      province: 'นครราชสีมา',
      postalCode: '30000',
      role: Role.ADMIN,
    },
    {
      email: 'b6631345@g.sut.ac.th',
      name: 'นางสาวชุติกาญจน์ ชมกลาง',
      phone: '0892223344',
      addressLine: '99/12 หมู่ 5',
      subdistrict: 'สุรนารี',
      district: 'เมืองนครราชสีมา',
      province: 'นครราชสีมา',
      postalCode: '30000',
      role: Role.STUDENT,
    },
    {
      email: 'b6610364@g.sut.ac.th',
      name: 'นายปัณณธร ขันละ',
      phone: '0893334455',
      addressLine: '88/7 หมู่ 3',
      subdistrict: 'สุรนารี',
      district: 'เมืองนครราชสีมา',
      province: 'นครราชสีมา',
      postalCode: '30000',
      role: Role.STUDENT,
    },
    {
      email: 'alumni.2018@sut-eng.ac.th',
      name: 'นายวีรยุทธ ดอนเมือง',
      phone: '0894445566',
      addressLine: '99/12 ถนนเพิ่มสิน',
      subdistrict: 'สายไหม',
      district: 'สายไหม',
      province: 'กรุงเทพมหานคร',
      postalCode: '10220',
      role: Role.ALUMNI,
    },
    {
      email: 'alumni.2020@sut-eng.ac.th',
      name: 'นางสาวศุภนิดา วิศวกร',
      phone: '0895556677',
      addressLine: '128/45 หมู่บ้านวิศวกร',
      subdistrict: 'ในเมือง',
      district: 'เมืองขอนแก่น',
      province: 'ขอนแก่น',
      postalCode: '40000',
      role: Role.ALUMNI,
    },
    {
      email: 'alumni.2015@sut-eng.ac.th',
      name: 'นายธนกฤต ช่างใหญ่',
      phone: '0896667788',
      addressLine: '45/8 ซอยลาดพร้าว 101',
      subdistrict: 'คลองจั่น',
      district: 'บางกะปิ',
      province: 'กรุงเทพมหานคร',
      postalCode: '10240',
      role: Role.ALUMNI,
    },
    {
      email: 'student.2ndyear@g.sut.ac.th',
      name: 'นายณัฐพงศ์ ทองเถาะ',
      phone: '0897778899',
      addressLine: '12/3 หอพักนักศึกษา',
      subdistrict: 'สุรนารี',
      district: 'เมืองนครราชสีมา',
      province: 'นครราชสีมา',
      postalCode: '30000',
      role: Role.STUDENT,
    },
  ];

  const userMap: Record<string, { id: number }> = {};

  for (const u of userData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        password: hashedPassword,
        fullName: u.name,
        phone: u.phone,
        address: u.addressLine,
        subdistrict: u.subdistrict,
        district: u.district,
        province: u.province,
        postalCode: u.postalCode,
        role: u.role,
      },
    });
    userMap[u.email] = { id: user.id };
  }
  console.log('✅ Seeded users (7)');

  // --------------------------------------
  // 2) EDUCATION RECORD (ทุกคนมี transcript)
  // --------------------------------------
  const eduData = [
    {
      studentCode: 'B6631345',
      major: 'วิศวกรรมคอมพิวเตอร์',
      gradYear: null,
      status: StudyStatus.ACTIVE,
      transcript: 'https://example.com/transcripts/B6631345.pdf',
      userEmail: 'b6631345@g.sut.ac.th',
    },
    {
      studentCode: 'B6610364',
      major: 'วิศวกรรมคอมพิวเตอร์',
      gradYear: null,
      status: StudyStatus.ACTIVE,
      transcript: 'https://example.com/transcripts/B6610364.pdf',
      userEmail: 'b6610364@g.sut.ac.th',
    },
    {
      studentCode: 'B5900123',
      major: 'วิศวกรรมโยธา',
      gradYear: 2018,
      status: StudyStatus.GRADUATED,
      transcript: 'https://example.com/transcripts/B5900123.pdf',
      userEmail: 'alumni.2018@sut-eng.ac.th',
    },
    {
      studentCode: 'B6000456',
      major: 'วิศวกรรมอุตสาหการ',
      gradYear: 2020,
      status: StudyStatus.GRADUATED,
      transcript: 'https://example.com/transcripts/B6000456.pdf',
      userEmail: 'alumni.2020@sut-eng.ac.th',
    },
    {
      studentCode: 'B5600789',
      major: 'วิศวกรรมเครื่องกล',
      gradYear: 2015,
      status: StudyStatus.GRADUATED,
      transcript: 'https://example.com/transcripts/B5600789.pdf',
      userEmail: 'alumni.2015@sut-eng.ac.th',
    },
    {
      studentCode: 'B6730999',
      major: 'วิศวกรรมคอมพิวเตอร์',
      gradYear: null,
      status: StudyStatus.ACTIVE,
      transcript: 'https://example.com/transcripts/B6730999.pdf',
      userEmail: 'student.2ndyear@g.sut.ac.th',
    },
  ];

  for (const e of eduData) {
    const userId = userMap[e.userEmail].id;
    await prisma.educationRecord.upsert({
      where: { studentCode: e.studentCode },
      update: {
        major: e.major,
        gradYear: e.gradYear,
        status: e.status,
        transcript: e.transcript,
        userId,
      },
      create: {
        studentCode: e.studentCode,
        major: e.major,
        gradYear: e.gradYear,
        status: e.status,
        transcript: e.transcript,
        userId,
      },
    });
  }
  console.log('✅ Seeded education records (6)');

  // --------------------------------------
  // 3) VERIFICATION (สถานะหลากหลาย)
  // --------------------------------------
  const verificationData = [
    {
      userEmail: 'b6631345@g.sut.ac.th',
      status: VerifyStatus.PENDING,
      reviewedBy: null,
      reviewedAt: null,
      remark: null,
    },
    {
      userEmail: 'b6610364@g.sut.ac.th',
      status: VerifyStatus.APPROVED,
      reviewedBy: 'admin@sut-eng.ac.th',
      reviewedAt: new Date('2025-11-20T10:30:00Z'),
      remark: 'ยืนยันจาก Transcript แล้ว',
    },
    {
      userEmail: 'alumni.2018@sut-eng.ac.th',
      status: VerifyStatus.APPROVED,
      reviewedBy: 'admin@sut-eng.ac.th',
      reviewedAt: new Date('2025-11-21T14:15:00Z'),
      remark: 'ศิษย์เก่าร่วมงานสานสัมพันธ์ 2568',
    },
    {
      userEmail: 'alumni.2020@sut-eng.ac.th',
      status: VerifyStatus.REJECTED,
      reviewedBy: 'admin@sut-eng.ac.th',
      reviewedAt: new Date('2025-11-22T09:00:00Z'),
      remark: 'เลขรหัสนักศึกษาไม่ตรงกับฐานข้อมูล',
    },
    {
      userEmail: 'alumni.2015@sut-eng.ac.th',
      status: VerifyStatus.APPROVED,
      reviewedBy: 'admin@sut-eng.ac.th',
      reviewedAt: new Date('2025-11-23T16:45:00Z'),
      remark: 'ตรวจสอบแล้วผ่านเกณฑ์',
    },
    {
      userEmail: 'student.2ndyear@g.sut.ac.th',
      status: VerifyStatus.PENDING,
      reviewedBy: null,
      reviewedAt: null,
      remark: null,
    },
  ];

  for (const v of verificationData) {
    const userId = userMap[v.userEmail].id;
    await prisma.verification.upsert({
      where: { userId },
      update: {
        status: v.status,
        reviewedBy: v.reviewedBy ?? undefined,
        reviewedAt: v.reviewedAt ?? undefined,
        remark: v.remark ?? undefined,
      },
      create: {
        userId,
        status: v.status,
        reviewedBy: v.reviewedBy ?? undefined,
        reviewedAt: v.reviewedAt ?? undefined,
        remark: v.remark ?? undefined,
      },
    });
  }
  console.log('✅ Seeded verifications (6)');

  // =====================================================
  // 4) SOUVENIR SUBSYSTEM
  // =====================================================

  // 4.1 SouvenirItem (ตาม UI: เข็มกลัด, หมวก, ขวดน้ำ, ถุงผ้า, สมุด, ร่ม)
  const souvenirData = [
    {
      sku: 'PIN-WEARE-SUT',
      name: 'เข็มกลัด SUT We are SUT',
      description: 'เข็มกลัดลาย We are SUT สำหรับงานศิษย์เก่า',
      category: 'กิจกรรม',
      imageUrl: '/souvenir/EngiButton.png',
      unit: 'ชิ้น',
      initialStock: 100,
      active: true,
    },
    {
      sku: 'CAP-ENGI-2025-BK',
      name: 'SUT Cap',
      description: 'หมวก ENGi Cap แบบหมวกแก๊ปสีดำ',
      category: 'กิจกรรม',
      imageUrl: '/souvenir/EngiCap.png',
      unit: 'ใบ',
      initialStock: 80,
      active: true,
    },
    {
      sku: 'BOTTLE-ENGI-2025',
      name: 'ENGI Bottle',
      description: 'กระบอกน้ำ ENGi สำหรับผู้ร่วมงาน',
      category: 'กิจกรรม',
      imageUrl: '/souvenir/EngiBottle.png',
      unit: 'ใบ',
      initialStock: 60,
      active: true,
    },
    {
      sku: 'TOTE-SUT-DONOR',
      name: 'ถุงผ้า SUT',
      description: 'ของขวัญสำหรับผู้บริจาคสมทบทุน ENGi Development Fund',
      category: 'บริจาค',
      imageUrl: '/souvenir/tote-sut.png',
      unit: 'ใบ',
      initialStock: 200,
      active: true,
    },
    {
      sku: 'NOTEBOOK-SURANAREE',
      name: 'Suranaree Notebook',
      description: 'สมุดจดหนังสำหรับผู้สนับสนุนกิจกรรม Homecoming Day 2024',
      category: 'บริจาค',
      imageUrl: '/souvenir/notebook-suranaree.png',
      unit: 'เล่ม',
      initialStock: 150,
      active: true,
    },
    {
      sku: 'UMBRELLA-SUT',
      name: 'SUT Umbrella',
      description: 'ร่มของที่ระลึกจากเงินสมทบกิจกรรม Engineering Open House',
      category: 'บริจาค',
      imageUrl: '/souvenir/umbrella-sut.png',
      unit: 'คัน',
      initialStock: 120,
      active: true,
    },
  ];

  const itemMap: Record<string, { id: number }> = {};

  for (const s of souvenirData) {
    const item = await prisma.souvenirItem.upsert({
      where: { sku: s.sku },
      update: {},
      create: {
        sku: s.sku,
        name: s.name,
        description: s.description,
        category: s.category,
        imageUrl: s.imageUrl,
        unit: s.unit,
        initialStock: s.initialStock,
        active: s.active,
      },
    });
    itemMap[s.sku] = { id: item.id };
  }
  console.log('✅ Seeded souvenir items (6)');

  // 4.2 StockMovement (จำลองเติมของ + ตัดของไปแจก/ส่ง)
  const adminId = userMap['admin@sut-eng.ac.th'].id;

  const stockMovements = [
    // PIN
    { sku: 'PIN-WEARE-SUT', delta: 50, reason: 'purchase', refType: 'PO-2024-001' },
    { sku: 'PIN-WEARE-SUT', delta: -20, reason: 'redeem', refType: 'EVENT_HOMECOMING_2024' },
    // CAP
    { sku: 'CAP-ENGI-2025-BK', delta: 30, reason: 'purchase', refType: 'PO-2024-002' },
    { sku: 'CAP-ENGI-2025-BK', delta: -15, reason: 'redeem', refType: 'EVENT_ALUMNI_2568' },
    // BOTTLE
    { sku: 'BOTTLE-ENGI-2025', delta: 20, reason: 'purchase', refType: 'PO-2024-003' },
    { sku: 'BOTTLE-ENGI-2025', delta: -10, reason: 'redeem', refType: 'EVENT_OPENHOUSE' },
    // TOTE
    { sku: 'TOTE-SUT-DONOR', delta: 100, reason: 'purchase', refType: 'PO-2024-004' },
    { sku: 'TOTE-SUT-DONOR', delta: -50, reason: 'ship', refType: 'DONATION_BATCH_1' },
    // NOTEBOOK
    { sku: 'NOTEBOOK-SURANAREE', delta: 75, reason: 'purchase', refType: 'PO-2024-005' },
    { sku: 'NOTEBOOK-SURANAREE', delta: -30, reason: 'ship', refType: 'DONATION_BATCH_1' },
    // UMBRELLA
    { sku: 'UMBRELLA-SUT', delta: 60, reason: 'purchase', refType: 'PO-2024-006' },
    { sku: 'UMBRELLA-SUT', delta: -20, reason: 'ship', refType: 'DONATION_BATCH_1' },
  ];

  for (const m of stockMovements) {
    await prisma.stockMovement.create({
      data: {
        itemId: itemMap[m.sku].id,
        delta: m.delta,
        reason: m.reason,
        refType: m.refType,
        createdBy: adminId,
      },
    });
  }
  console.log('✅ Seeded stock movements (12)');

  // 4.3 Entitlement (สิทธิ์รับของจากกิจกรรม/บริจาค)
  const entitlementData = [
    // กิจกรรม
    {
      userEmail: 'alumni.2018@sut-eng.ac.th',
      sku: 'PIN-WEARE-SUT',
      source: EntitlementSource.EVENT,
      qtyGranted: 1,
      qtyUsed: 1,
    },
    {
      userEmail: 'alumni.2018@sut-eng.ac.th',
      sku: 'CAP-ENGI-2025-BK',
      source: EntitlementSource.EVENT,
      qtyGranted: 1,
      qtyUsed: 1,
    },
    {
      userEmail: 'b6610364@g.sut.ac.th',
      sku: 'BOTTLE-ENGI-2025',
      source: EntitlementSource.EVENT,
      qtyGranted: 1,
      qtyUsed: 1,
    },
    {
      userEmail: 'alumni.2020@sut-eng.ac.th',
      sku: 'CAP-ENGI-2025-BK',
      source: EntitlementSource.EVENT,
      qtyGranted: 1,
      qtyUsed: 0, // ยังไม่ได้มารับ
    },
    // บริจาค
    {
      userEmail: 'alumni.2018@sut-eng.ac.th',
      sku: 'TOTE-SUT-DONOR',
      source: EntitlementSource.DONATION,
      qtyGranted: 2,
      qtyUsed: 2,
    },
    {
      userEmail: 'alumni.2015@sut-eng.ac.th',
      sku: 'NOTEBOOK-SURANAREE',
      source: EntitlementSource.DONATION,
      qtyGranted: 1,
      qtyUsed: 1,
    },
    {
      userEmail: 'alumni.2015@sut-eng.ac.th',
      sku: 'UMBRELLA-SUT',
      source: EntitlementSource.DONATION,
      qtyGranted: 1,
      qtyUsed: 0, // รอจัดส่ง
    },
  ];

  const entitlementMap: { id: number; userId: number; itemId: number }[] = [];

  for (const e of entitlementData) {
    const userId = userMap[e.userEmail].id;
    const itemId = itemMap[e.sku].id;

    const ent = await prisma.entitlement.create({
      data: {
        userId,
        itemId,
        source: e.source,
        qtyGranted: e.qtyGranted,
        qtyUsed: e.qtyUsed,
      },
    });

    entitlementMap.push({ id: ent.id, userId, itemId });
  }
  console.log('✅ Seeded entitlements (7)');

  // 4.4 Redemption (การรับของจริงหน้างาน)
  const redemptionData = [
    { entitlementIndex: 0, method: RedeemMethod.QR_SCAN }, // PIN
    { entitlementIndex: 1, method: RedeemMethod.QR_SCAN }, // CAP
    { entitlementIndex: 2, method: RedeemMethod.MANUAL }, // BOTTLE
  ];

  for (const r of redemptionData) {
    const ent = entitlementMap[r.entitlementIndex];
    await prisma.redemption.create({
      data: {
        entitlementId: ent.id,
        itemId: ent.itemId,
        userId: ent.userId,
        method: r.method,
        handledBy: adminId,
      },
    });
  }
  console.log('✅ Seeded redemptions (3)');

  // 4.5 Shipment (จัดส่งของบริจาค)
  // สร้าง Donation record ก่อน
  const donation1 = await prisma.donation.create({
    data: {
      userId: userMap['alumni.2018@sut-eng.ac.th'].id,
      amount: 5000,
      purpose: 'สมทบทุนพัฒนาคณะวิศวกรรมศาสตร์',
      status: 'completed',
    },
  });

  const donation2 = await prisma.donation.create({
    data: {
      userId: userMap['alumni.2015@sut-eng.ac.th'].id,
      amount: 3000,
      purpose: 'สนับสนุนโครงการศิษย์เก่าสัมพันธ์',
      status: 'completed',
    },
  });

  console.log('✅ Seeded donations (2)');

  const shipmentData = [
    {
      userEmail: 'alumni.2018@sut-eng.ac.th',
      sku: 'TOTE-SUT-DONOR',
      donationId: donation1.id,
      qty: 2,
      receiverName: 'นายวีรยุทธ ดอนเมือง',
      addressLine: '99/12 ถนนเพิ่มสิน',
      subdistrict: 'สายไหม',
      district: 'สายไหม',
      province: 'กรุงเทพมหานคร',
      postalCode: '10220',
      phone: '0894445566',
      status: ShipStatus.DELIVERED,
      trackingNo: 'TH1234567890',
    },
    {
      userEmail: 'alumni.2015@sut-eng.ac.th',
      sku: 'NOTEBOOK-SURANAREE',
      donationId: donation2.id,
      qty: 1,
      receiverName: 'นายธนกฤต ช่างใหญ่',
      addressLine: '45/8 ซอยลาดพร้าว 101',
      subdistrict: 'คลองจั่น',
      district: 'บางกะปิ',
      province: 'กรุงเทพมหานคร',
      postalCode: '10240',
      phone: '0896667788',
      status: ShipStatus.PENDING,
      trackingNo: null,
    },
  ];

  for (const s of shipmentData) {
    const userId = userMap[s.userEmail].id;
    const itemId = itemMap[s.sku].id;

    await prisma.shipment.create({
      data: {
        donationId: s.donationId,
        userId,
        itemId,
        qty: s.qty,
        receiverName: s.receiverName,
        addressLine: s.addressLine,
        subdistrict: s.subdistrict,
        district: s.district,
        province: s.province,
        postalCode: s.postalCode,
        phone: s.phone,
        status: s.status,
        trackingNo: s.trackingNo ?? undefined,
      },
    });
  }
  console.log('✅ Seeded shipments (2)');

  // สรุป
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 All seed data inserted successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('📊 Summary:');
  console.log('   • Users: 7 (1 admin, 3 students, 3 alumni)');
  console.log('   • Education Records: 6 (ทุกคนมี transcript)');
  console.log('   • Verifications: 6 (2 pending, 3 approved, 1 rejected)');
  console.log('   • Souvenir Items: 6 (3 กิจกรรม, 3 บริจาค)');
  console.log('   • Stock Movements: 12');
  console.log('   • Entitlements: 7 (4 EVENT, 3 DONATION)');
  console.log('   • Redemptions: 3');
  console.log('   • Donations: 2');
  console.log('   • Shipments: 2 (1 delivered, 1 pending)\n');

  console.log('📋 Login credentials (password: sut12345):');
  console.log('   • admin@sut-eng.ac.th (ADMIN)');
  console.log('   • b6631345@g.sut.ac.th (STUDENT, PENDING)');
  console.log('   • b6610364@g.sut.ac.th (STUDENT, APPROVED)');
  console.log('   • alumni.2018@sut-eng.ac.th (ALUMNI, APPROVED)');
  console.log('   • alumni.2020@sut-eng.ac.th (ALUMNI, REJECTED)');
  console.log('   • alumni.2015@sut-eng.ac.th (ALUMNI, APPROVED)');
  console.log('   • student.2ndyear@g.sut.ac.th (STUDENT, PENDING)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
