// prisma/seed.ts
import { PrismaClient, Role, StudyStatus, VerifyStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const defaultPassword = 'sut12345';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // -----------------------------
  // 1) USER
  // -----------------------------
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
        password: hashedPassword, // ทุกคนใช้ sut12345
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

  console.log('✅ Seeded users');

  // -----------------------------
  // 2) EDUCATION RECORD
  //    (ทุกคนมี transcript หมด)
  // -----------------------------
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

  console.log('✅ Seeded education records');

  // -----------------------------
  // 3) VERIFICATION
  // -----------------------------
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

  console.log('✅ Seeded verifications');

  // -----------------------------
  // 4) SOUVENIR ITEMS & EVENTS
  // -----------------------------
  console.log('🎁 Seeding souvenir system...');
  
  // สร้างของที่ระลึกหลากหลาย category
  const souvenirItemsData = [
    // กิจกรรม
    { sku: 'BOTTLE-ENGI-2025', name: 'กระบอกน้ำ', description: "รับ 'กระบอกน้ำ' เป็นของที่ระลึกสุดพิเศษ", category: 'กิจกรรม', imageUrl: '/souvenir/EngiBottle.png', unit: 'ชิ้น', initialStock: 200 },
    { sku: 'CAP-SUT-2025', name: 'หมวก SUT', description: 'หมวกสีส้ม โลโก้ SUT Engineering', category: 'กิจกรรม', imageUrl: '/souvenir/EngiCap.png', unit: 'ชิ้น', initialStock: 150 },
    { sku: 'PIN-ENGI-2025', name: 'เข็มกลัด', description: 'เข็มกลัดคณะวิศวกรรมศาสตร์', category: 'กิจกรรม', imageUrl: '/souvenir/EngiBrooch.png', unit: 'ชิ้น', initialStock: 300 },
    // บริจาค
    { sku: 'NOTEBOOK-2025', name: 'สมุดบันทึก', description: 'รับสมุดบันทึกแทนคำขอบคุณ', category: 'บริจาค', imageUrl: '/souvenir/Book_new.png', unit: 'เล่ม', initialStock: 150 },
    { sku: 'BAG-SUT-2025', name: 'กระเป๋าผ้า', description: 'กระเป๋าผ้า Canvas สไตล์ Minimal', category: 'บริจาค', imageUrl: '/souvenir/Bag_new.png', unit: 'ใบ', initialStock: 100 },
    { sku: 'UMBRELLA-2025', name: 'ร่ม SUT', description: 'ร่มสีดำ โลโก้ SUT สีทอง', category: 'บริจาค', imageUrl: '/souvenir/Umbrella_new.png', unit: 'คัน', initialStock: 80 },
  ];

  const souvenirItems = await Promise.all(
    souvenirItemsData.map(item =>
      prisma.souvenirItem.upsert({
        where: { sku: item.sku },
        update: {},
        create: item,
      })
    )
  );

  console.log(`✅ Created ${souvenirItems.length} souvenir items`);

  // สร้าง stock movements เริ่มต้น
  for (const item of souvenirItems) {
    const existing = await prisma.stockMovement.findFirst({
      where: {
        itemId: item.id,
        refType: 'Initial',
        reason: 'initial_stock',
      }
    });

    if (!existing) {
      await prisma.stockMovement.create({
        data: {
          itemId: item.id,
          delta: item.initialStock,
          reason: 'initial_stock',
          refType: 'Initial',
          createdBy: userMap['admin@sut-eng.ac.th'].id,
        },
      });
    }
  }

  console.log('✅ Created initial stock movements');

  // สร้าง events และเชื่อมกับของที่ระลึก
  const eventsData = [
    {
      id: 1,
      name: 'ENGi Day 2025',
      description: 'งานสานสัมพันธ์ศิษย์เก่า SUT ประจำปี 2568',
      startDate: new Date('2025-12-15'),
      endDate: new Date('2025-12-15'),
      location: 'อาคาร 30 ปี SUT',
      maxAttendees: 200,
      souvenirItemId: souvenirItems.find(i => i.sku === 'BOTTLE-ENGI-2025')!.id,
    },
    {
      id: 2,
      name: 'โครงการบริจาคสนับสนุน ENGi',
      description: 'โครงการบริจาคเพื่อสนับสนุนกิจกรรมศิษย์เก่า',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      location: 'ออนไลน์',
      maxAttendees: 1000,
      souvenirItemId: souvenirItems.find(i => i.sku === 'NOTEBOOK-2025')!.id,
    },
    {
      id: 3,
      name: 'งานกีฬาสานสัมพันธ์ศิษย์เก่า',
      description: 'การแข่งขันกีฬาระหว่างรุ่นศิษย์เก่า',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-02'),
      location: 'สนามกีฬา SUT',
      maxAttendees: 300,
      souvenirItemId: souvenirItems.find(i => i.sku === 'CAP-SUT-2025')!.id,
    },
  ];

  const events = await Promise.all(
    eventsData.map(event =>
      prisma.event.upsert({
        where: { id: event.id },
        update: { souvenirItemId: event.souvenirItemId },
        create: { ...event, isActive: true },
      })
    )
  );

  console.log(`✅ Created ${events.length} events`);

  // สร้าง event registrations
  const registrations = await Promise.all([
    // ENGi Day
    prisma.eventRegistration.upsert({
      where: { eventId_userId: { eventId: events[0].id, userId: userMap['b6610364@g.sut.ac.th'].id } },
      update: {},
      create: {
        eventId: events[0].id,
        userId: userMap['b6610364@g.sut.ac.th'].id,
        attendanceStatus: 'attended',
        registeredAt: new Date('2025-11-01'),
      },
    }),
    prisma.eventRegistration.upsert({
      where: { eventId_userId: { eventId: events[0].id, userId: userMap['alumni.2018@sut-eng.ac.th'].id } },
      update: {},
      create: {
        eventId: events[0].id,
        userId: userMap['alumni.2018@sut-eng.ac.th'].id,
        attendanceStatus: 'registered',
        registeredAt: new Date('2025-11-02'),
      },
    }),
    // งานกีฬา
    prisma.eventRegistration.upsert({
      where: { eventId_userId: { eventId: events[2].id, userId: userMap['alumni.2015@sut-eng.ac.th'].id } },
      update: {},
      create: {
        eventId: events[2].id,
        userId: userMap['alumni.2015@sut-eng.ac.th'].id,
        attendanceStatus: 'attended',
        registeredAt: new Date('2025-10-15'),
      },
    }),
  ]);

  console.log(`✅ Created ${registrations.length} event registrations`);

  // สร้าง entitlements (สิทธิ์รับของที่ระลึก)
  const entitlements = await Promise.all([
    // จากการเข้าร่วมกิจกรรม ENGi Day
    prisma.entitlement.create({
      data: {
        userId: userMap['b6610364@g.sut.ac.th'].id,
        itemId: souvenirItems.find(i => i.sku === 'BOTTLE-ENGI-2025')!.id,
        source: 'EVENT',
        eventId: events[0].id,
        eventRegistrationId: registrations[0].id,
        qtyGranted: 1,
        qtyUsed: 0,
      },
    }),
    prisma.entitlement.create({
      data: {
        userId: userMap['alumni.2018@sut-eng.ac.th'].id,
        itemId: souvenirItems.find(i => i.sku === 'BOTTLE-ENGI-2025')!.id,
        source: 'EVENT',
        eventId: events[0].id,
        eventRegistrationId: registrations[1].id,
        qtyGranted: 1,
        qtyUsed: 0,
      },
    }),
    // จากงานกีฬา
    prisma.entitlement.create({
      data: {
        userId: userMap['alumni.2015@sut-eng.ac.th'].id,
        itemId: souvenirItems.find(i => i.sku === 'CAP-SUT-2025')!.id,
        source: 'EVENT',
        eventId: events[2].id,
        eventRegistrationId: registrations[2].id,
        qtyGranted: 1,
        qtyUsed: 1, // แลกไปแล้ว
      },
    }),
  ]);

  console.log(`✅ Created ${entitlements.length} entitlements`);

  // สร้าง redemptions (การแลกรับจริง)
  const redemptions = await Promise.all([
    prisma.redemption.create({
      data: {
        entitlementId: entitlements[2].id,
        itemId: souvenirItems.find(i => i.sku === 'CAP-SUT-2025')!.id,
        userId: userMap['alumni.2015@sut-eng.ac.th'].id,
        method: 'QR_SCAN',
        handledBy: userMap['admin@sut-eng.ac.th'].id,
        redeemedAt: new Date('2025-11-02'),
      },
    }),
  ]);

  console.log(`✅ Created ${redemptions.length} redemptions`);

  // อัปเดต stock movements สำหรับการแลกรับ
  await prisma.stockMovement.create({
    data: {
      itemId: souvenirItems.find(i => i.sku === 'CAP-SUT-2025')!.id,
      delta: -1,
      reason: 'redeem',
      refType: 'Redemption',
      createdBy: userMap['admin@sut-eng.ac.th'].id,
    },
  });

  console.log('✅ Updated stock movements for redemptions');

  console.log('\n🎉 All seed data inserted successfully.');
  console.log('\n📋 Login credentials (password: sut12345):');
  console.log('   • admin@sut-eng.ac.th');
  console.log('   • b6631345@g.sut.ac.th');
  console.log('   • b6610364@g.sut.ac.th');
  console.log('   • alumni.2018@sut-eng.ac.th');
  console.log('   • alumni.2020@sut-eng.ac.th');
  console.log('   • alumni.2015@sut-eng.ac.th');
  console.log('   • student.2ndyear@g.sut.ac.th');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
