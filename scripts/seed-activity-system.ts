// scripts/seed-activity-system.ts
import { PrismaClient, EntitlementSource } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding activity system...');

  // 1. สร้าง SouvenirItems สำหรับกิจกรรม
  const souvenirItems = await Promise.all([
    prisma.souvenirItem.upsert({
      where: { sku: 'ACT-BTN-2025' },
      update: {},
      create: {
        sku: 'ACT-BTN-2025',
        name: 'เข็มกลัดวิศวกรรมศาสตร์ มทส.',
        description: 'เข็มกลัดของที่ระลึกสำหรับผู้เข้าร่วมกิจกรรม',
        category: 'กิจกรรม',
        imageUrl: '/souvenir/EngiButton.png',
        unit: 'ชิ้น',
        initialStock: 100,
        active: true,
      },
    }),
    prisma.souvenirItem.upsert({
      where: { sku: 'ACT-SHIRT-2025' },
      update: {},
      create: {
        sku: 'ACT-SHIRT-2025',
        name: 'เสื้อยืดวิศวกรรมศาสตร์ มทส.',
        description: 'เสื้อยืดของที่ระลึกสำหรับผู้เข้าร่วมกิจกรรม',
        category: 'กิจกรรม',
        imageUrl: '/souvenir/EngiShirt.png',
        unit: 'ตัว',
        initialStock: 50,
        active: true,
      },
    }),
    prisma.souvenirItem.upsert({
      where: { sku: 'ACT-CAP-2025' },
      update: {},
      create: {
        sku: 'ACT-CAP-2025',
        name: 'หมวกวิศวกรรมศาสตร์ มทส.',
        description: 'หมวกของที่ระลึกสำหรับผู้เข้าร่วมกิจกรรม',
        category: 'กิจกรรม',
        imageUrl: '/souvenir/EngiCap.png',
        unit: 'ชิ้น',
        initialStock: 75,
        active: true,
      },
    }),
  ]);

  console.log(`✅ Created ${souvenirItems.length} souvenir items`);

  // 2. สร้าง Events
  const events = await Promise.all([
    prisma.event.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'งานคืนสู่เหย้าศิษย์เก่าวิศวกรรมศาสตร์ 2025',
        description: 'งานพบปะศิษย์เก่าวิศวกรรมศาสตร์ มหาวิทยาลัยเทคโนโลยีสุรนารี ประจำปี 2568',
        startDate: new Date('2025-03-15T09:00:00'),
        endDate: new Date('2025-03-15T17:00:00'),
        location: 'อาคารวิศวกรรมศาสตร์ 1 มหาวิทยาลัยเทคโนโลยีสุรนารี',
        maxAttendees: 200,
        isActive: true,
      },
    }),
    prisma.event.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'สัมมนาเทคโนโลยีและนวัตกรรม',
        description: 'สัมมนาแลกเปลี่ยนความรู้ด้านเทคโนโลยีและนวัตกรรมใหม่ๆ',
        startDate: new Date('2025-04-20T13:00:00'),
        endDate: new Date('2025-04-20T16:00:00'),
        location: 'ห้องประชุมใหญ่ อาคารเฉลิมพระเกียรติ',
        maxAttendees: 150,
        isActive: true,
      },
    }),
    prisma.event.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: 'กิจกรรมจิตอาสาพัฒนาชุมชน',
        description: 'กิจกรรมจิตอาสาพัฒนาชุมชนร่วมกับศิษย์เก่าและศิษย์ปัจจุบัน',
        startDate: new Date('2025-12-20T08:00:00'),
        endDate: new Date('2025-12-20T16:00:00'),
        location: 'ชุมชนบ้านโคกกระสังข์',
        maxAttendees: 100,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${events.length} events`);

  // 3. ดึงข้อมูล Users ที่มีอยู่
  const users = await prisma.user.findMany({
    where: {
      role: { in: ['STUDENT', 'ALUMNI'] },
    },
    take: 10,
  });

  if (users.length === 0) {
    console.log('⚠️ No users found. Please run the main seed first.');
    return;
  }

  console.log(`📋 Found ${users.length} users for registration`);

  // 4. สร้าง Event Registrations และ Entitlements
  let registrationCount = 0;
  let entitlementCount = 0;

  for (const event of events) {
    // สุ่มจำนวนผู้ลงทะเบียนสำหรับแต่ละ event (3-7 คน)
    const numRegistrants = Math.min(Math.floor(Math.random() * 5) + 3, users.length);
    const selectedUsers = users.slice(0, numRegistrants);

    for (const user of selectedUsers) {
      // สร้าง registration
      const registration = await prisma.eventRegistration.create({
        data: {
          eventId: event.id,
          userId: user.id,
          attendanceStatus: null, // ยังไม่ได้เช็คอิน
        },
      });
      registrationCount++;

      // สร้าง entitlement สำหรับของที่ระลึก (สุ่ม 1 item)
      const randomItem = souvenirItems[Math.floor(Math.random() * souvenirItems.length)];
      
      await prisma.entitlement.create({
        data: {
          userId: user.id,
          itemId: randomItem.id,
          source: EntitlementSource.EVENT,
          eventId: event.id,
          eventRegistrationId: registration.id,
          qtyGranted: 1,
          qtyUsed: 0,
        },
      });
      entitlementCount++;
    }
  }

  console.log(`✅ Created ${registrationCount} event registrations`);
  console.log(`✅ Created ${entitlementCount} entitlements`);

  // 5. สร้าง Stock Movements สำหรับของที่ระลึกเริ่มต้น
  for (const item of souvenirItems) {
    await prisma.stockMovement.create({
      data: {
        itemId: item.id,
        delta: item.initialStock,
        reason: 'initial_stock',
        refType: 'Initial',
      },
    });
  }

  console.log(`✅ Created initial stock movements`);

  // 6. สร้าง Redemptions ตัวอย่าง (บางคนรับของแล้ว)
  const entitlements = await prisma.entitlement.findMany({
    take: 5, // เลือก 5 entitlements แรก
  });

  for (const entitlement of entitlements) {
    await prisma.redemption.create({
      data: {
        entitlementId: entitlement.id,
        itemId: entitlement.itemId,
        userId: entitlement.userId,
        method: 'QR_SCAN',
        redeemedAt: new Date(),
      },
    });

    // อัพเดต qtyUsed
    await prisma.entitlement.update({
      where: { id: entitlement.id },
      data: { qtyUsed: 1 },
    });

    // สร้าง stock movement สำหรับการจ่ายของ
    await prisma.stockMovement.create({
      data: {
        itemId: entitlement.itemId,
        delta: -1,
        reason: 'redeem',
        refType: 'Redemption',
      },
    });
  }

  console.log(`✅ Created ${entitlements.length} redemptions`);

  console.log('🎉 Activity system seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding activity system:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
