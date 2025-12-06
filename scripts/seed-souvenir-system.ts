import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSouvenirSystem() {
  console.log('🎁 Starting comprehensive souvenir system seeding...\n');

  try {
    // Password: "password123" (hashed with bcrypt)
    const hashedPassword = '$2b$10$fAQhIziYaomfTKQ.iM3mVu/ca1jWoo6DJEqP.cAsx.MGv0zLlx4kC';
    
    // 1. สร้าง Users ตัวอย่าง
    console.log('👤 Creating sample users...');
    const users = await Promise.all([
      prisma.user.upsert({
        where: { email: 'admin@sut.ac.th' },
        update: {},
        create: {
          email: 'admin@sut.ac.th',
          password: hashedPassword,
          fullName: 'ผู้ดูแลระบบ',
          phone: '0812345678',
          address: '111 ถนนมหาวิทยาลัย',
          subdistrict: 'สุรนารี',
          district: 'เมือง',
          province: 'นครราชสีมา',
          postalCode: '30000',
          role: 'ADMIN',
        },
      }),
      prisma.user.upsert({
        where: { email: 'student1@sut.ac.th' },
        update: {},
        create: {
          email: 'student1@sut.ac.th',
          password: hashedPassword,
          fullName: 'สมชาย ใจดี',
          phone: '0823456789',
          address: '222 ถนนมิตรภาพ',
          subdistrict: 'ในเมือง',
          district: 'เมือง',
          province: 'นครราชสีมา',
          postalCode: '30000',
          role: 'STUDENT',
        },
      }),
      prisma.user.upsert({
        where: { email: 'student2@sut.ac.th' },
        update: {},
        create: {
          email: 'student2@sut.ac.th',
          password: hashedPassword,
          fullName: 'สมหญิง รักดี',
          phone: '0834567890',
          address: '333 ถนนจอหอ',
          subdistrict: 'โพธิ์กลาง',
          district: 'เมือง',
          province: 'นครราชสีมา',
          postalCode: '30000',
          role: 'STUDENT',
        },
      }),
      prisma.user.upsert({
        where: { email: 'alumni1@sut.ac.th' },
        update: {},
        create: {
          email: 'alumni1@sut.ac.th',
          password: hashedPassword,
          fullName: 'ประยุทธ์ มั่นคง',
          phone: '0845678901',
          address: '444 ถนนราชดำเนิน',
          subdistrict: 'หนองระเวียง',
          district: 'เมือง',
          province: 'นครราชสีมา',
          postalCode: '30000',
          role: 'ALUMNI',
        },
      }),
      prisma.user.upsert({
        where: { email: 'alumni2@sut.ac.th' },
        update: {},
        create: {
          email: 'alumni2@sut.ac.th',
          password: hashedPassword,
          fullName: 'วิภา สุขใจ',
          phone: '0856789012',
          address: '555 ถนนสีหนาท',
          subdistrict: 'สุรนารี',
          district: 'เมือง',
          province: 'นครราชสีมา',
          postalCode: '30000',
          role: 'ALUMNI',
        },
      }),
    ]);
    console.log(`✅ Created ${users.length} users\n`);

    // 2. สร้างของที่ระลึก
    console.log('🎁 Creating souvenir items...');
    const items = await Promise.all([
      prisma.souvenirItem.upsert({
        where: { sku: 'BAG-SUT-2025' },
        update: {},
        create: {
          sku: 'BAG-SUT-2025',
          name: 'ถุงผ้า SUT',
          description: 'ถุงผ้า Canvas สีน้ำตาล โลโก้ SUT คุณภาพดี',
          category: 'บริจาค',
          imageUrl: '/souvenir/Bag.png',
          unit: 'ใบ',
          initialStock: 100,
          active: true,
        },
      }),
      prisma.souvenirItem.upsert({
        where: { sku: 'BOOK-SUT-2025' },
        update: {},
        create: {
          sku: 'BOOK-SUT-2025',
          name: 'Suranaree Notebook',
          description: 'สมุดโน้ตปกแข็ง สีน้ำตาล พร้อมโลโก้ SUT',
          category: 'กิจกรรม',
          imageUrl: '/souvenir/Book.png',
          unit: 'เล่ม',
          initialStock: 150,
          active: true,
        },
      }),
      prisma.souvenirItem.upsert({
        where: { sku: 'UMB-SUT-2025' },
        update: {},
        create: {
          sku: 'UMB-SUT-2025',
          name: 'SUT Umbrella',
          description: 'ร่มสีดำ โลโก้ SUT กันแดด กันฝน',
          category: 'กิจกรรม',
          imageUrl: '/souvenir/Umbrella.png',
          unit: 'คัน',
          initialStock: 80,
          active: true,
        },
      }),
      prisma.souvenirItem.upsert({
        where: { sku: 'CAP-ENGI-2025' },
        update: {},
        create: {
          sku: 'CAP-ENGI-2025',
          name: 'หมวก Engineering SUT',
          description: 'หมวกแก๊ป สีกรมท่า โลโก้คณะวิศวกรรมศาสตร์',
          category: 'กิจกรรม',
          imageUrl: '/souvenir/EngiCap.png',
          unit: 'ใบ',
          initialStock: 120,
          active: true,
        },
      }),
      prisma.souvenirItem.upsert({
        where: { sku: 'BTL-SUT-2025' },
        update: {},
        create: {
          sku: 'BTL-SUT-2025',
          name: 'SUT Bottle',
          description: 'กระบอกน้ำสแตนเลส 750ml โลโก้ SUT',
          category: 'บริจาค',
          imageUrl: '/souvenir/EngiBottle.png',
          unit: 'ชิ้น',
          initialStock: 90,
          active: true,
        },
      }),
    ]);
    console.log(`✅ Created ${items.length} souvenir items\n`);

    // 3. สร้าง Stock Movement (ประวัติการเพิ่มสต็อก)
    console.log('📦 Creating stock movements...');
    const movements = await Promise.all([
      prisma.stockMovement.create({
        data: {
          itemId: items[0].id,
          delta: 50,
          reason: 'เติมสต็อกจากการสั่งซื้อใหม่',
          refType: 'PURCHASE',
          createdBy: users[0].id,
        },
      }),
      prisma.stockMovement.create({
        data: {
          itemId: items[1].id,
          delta: 30,
          reason: 'เติมสต็อกสำหรับกิจกรรม',
          refType: 'PURCHASE',
          createdBy: users[0].id,
        },
      }),
      prisma.stockMovement.create({
        data: {
          itemId: items[2].id,
          delta: -5,
          reason: 'สินค้าชำรุด นำออกจากระบบ',
          refType: 'MANUAL_ADJUST',
          createdBy: users[0].id,
        },
      }),
    ]);
    console.log(`✅ Created ${movements.length} stock movements\n`);

    // 4. สร้าง Events
    console.log('📅 Creating events...');
    const events = await Promise.all([
      prisma.event.upsert({
        where: { id: 1 },
        update: {},
        create: {
          name: 'งานสานสัมพันธ์วิศวกรรมศาสตร์ 2568',
          description: 'งานรวมพลศิษย์เก่าและศิษย์ปัจจุบันคณะวิศวกรรมศาสตร์',
          startDate: new Date('2025-03-15'),
          endDate: new Date('2025-03-16'),
          location: 'อาคาร 40 ปี คณะวิศวกรรมศาสตร์ มทส.',
          maxAttendees: 500,
          isActive: true,
        },
      }),
      prisma.event.upsert({
        where: { id: 2 },
        update: {},
        create: {
          name: 'Engineering Open House 2025',
          description: 'งานเปิดบ้านคณะวิศวกรรมศาสตร์ ต้อนรับน้องใหม่',
          startDate: new Date('2025-06-20'),
          endDate: new Date('2025-06-21'),
          location: 'ลานกิจกรรมหน้าคณะวิศวกรรมศาสตร์',
          maxAttendees: 800,
          isActive: true,
        },
      }),
      prisma.event.upsert({
        where: { id: 3 },
        update: {},
        create: {
          name: 'SUT Engineering Day 2025',
          description: 'วันวิศวกรรมศาสตร์ มทส. ประจำปี 2568',
          startDate: new Date('2025-11-10'),
          endDate: new Date('2025-11-10'),
          location: 'ศูนย์ประชุมนานาชาติ มทส.',
          maxAttendees: 1000,
          isActive: true,
        },
      }),
    ]);
    console.log(`✅ Created ${events.length} events\n`);

    // 5. สร้าง Event Registrations
    console.log('📝 Creating event registrations...');
    const registrations = await Promise.all([
      // Event 1
      prisma.eventRegistration.create({
        data: {
          eventId: events[0].id,
          userId: users[1].id,
          attendanceStatus: 'ATTENDED',
        },
      }),
      prisma.eventRegistration.create({
        data: {
          eventId: events[0].id,
          userId: users[2].id,
          attendanceStatus: 'ATTENDED',
        },
      }),
      prisma.eventRegistration.create({
        data: {
          eventId: events[0].id,
          userId: users[3].id,
          attendanceStatus: 'PENDING',
        },
      }),
      // Event 2
      prisma.eventRegistration.create({
        data: {
          eventId: events[1].id,
          userId: users[1].id,
          attendanceStatus: 'PENDING',
        },
      }),
      prisma.eventRegistration.create({
        data: {
          eventId: events[1].id,
          userId: users[4].id,
          attendanceStatus: 'ATTENDED',
        },
      }),
      // Event 3
      prisma.eventRegistration.create({
        data: {
          eventId: events[2].id,
          userId: users[2].id,
          attendanceStatus: 'PENDING',
        },
      }),
      prisma.eventRegistration.create({
        data: {
          eventId: events[2].id,
          userId: users[3].id,
          attendanceStatus: 'PENDING',
        },
      }),
    ]);
    console.log(`✅ Created ${registrations.length} event registrations\n`);

    // 6. สร้าง Donations
    console.log('💰 Creating donations...');
    const donations = await Promise.all([
      prisma.donation.create({
        data: {
          userId: users[3].id,
          amount: 5000,
          purpose: 'บริจาคสนับสนุนทุนการศึกษา',
          status: 'COMPLETED',
        },
      }),
      prisma.donation.create({
        data: {
          userId: users[4].id,
          amount: 10000,
          purpose: 'บริจาคสนับสนุนกิจกรรมคณะ',
          status: 'COMPLETED',
        },
      }),
      prisma.donation.create({
        data: {
          userId: users[1].id,
          amount: 3000,
          purpose: 'บริจาคทั่วไป',
          status: 'COMPLETED',
        },
      }),
    ]);
    console.log(`✅ Created ${donations.length} donations\n`);

    // 7. สร้าง Entitlements (สิทธิ์รับของ)
    console.log('🎫 Creating entitlements...');
    const entitlements = await Promise.all([
      // สิทธิ์จากกิจกรรม
      prisma.entitlement.create({
        data: {
          userId: users[1].id,
          itemId: items[1].id, // Notebook
          source: 'EVENT',
          eventId: events[0].id,
          eventRegistrationId: registrations[0].id,
          qtyGranted: 1,
          qtyUsed: 1,
        },
      }),
      prisma.entitlement.create({
        data: {
          userId: users[2].id,
          itemId: items[1].id, // Notebook
          source: 'EVENT',
          eventId: events[0].id,
          eventRegistrationId: registrations[1].id,
          qtyGranted: 1,
          qtyUsed: 0,
        },
      }),
      prisma.entitlement.create({
        data: {
          userId: users[4].id,
          itemId: items[3].id, // Cap
          source: 'EVENT',
          eventId: events[1].id,
          eventRegistrationId: registrations[4].id,
          qtyGranted: 1,
          qtyUsed: 1,
        },
      }),
      // สิทธิ์จากการบริจาค
      prisma.entitlement.create({
        data: {
          userId: users[3].id,
          itemId: items[0].id, // Bag
          source: 'DONATION',
          donationId: donations[0].id,
          qtyGranted: 2,
          qtyUsed: 1,
        },
      }),
      prisma.entitlement.create({
        data: {
          userId: users[4].id,
          itemId: items[4].id, // Bottle
          source: 'DONATION',
          donationId: donations[1].id,
          qtyGranted: 3,
          qtyUsed: 0,
        },
      }),
    ]);
    console.log(`✅ Created ${entitlements.length} entitlements\n`);

    // 8. สร้าง Redemptions (การรับของ)
    console.log('✋ Creating redemptions...');
    const redemptions = await Promise.all([
      prisma.redemption.create({
        data: {
          entitlementId: entitlements[0].id,
          itemId: items[1].id,
          userId: users[1].id,
          method: 'QR_SCAN',
          handledBy: users[0].id,
        },
      }),
      prisma.redemption.create({
        data: {
          entitlementId: entitlements[2].id,
          itemId: items[3].id,
          userId: users[4].id,
          method: 'MANUAL',
          handledBy: users[0].id,
        },
      }),
      prisma.redemption.create({
        data: {
          entitlementId: entitlements[3].id,
          itemId: items[0].id,
          userId: users[3].id,
          method: 'QR_SCAN',
          handledBy: users[0].id,
        },
      }),
    ]);
    console.log(`✅ Created ${redemptions.length} redemptions\n`);

    // 9. สร้าง Stock Movements จากการรับของ (ตัดสต็อก)
    console.log('📦 Creating stock movements for redemptions...');
    const redemptionMovements = await Promise.all([
      prisma.stockMovement.create({
        data: {
          itemId: items[1].id,
          delta: -1,
          reason: 'รับของที่งาน',
          refType: 'REDEMPTION',
          createdBy: users[0].id,
        },
      }),
      prisma.stockMovement.create({
        data: {
          itemId: items[3].id,
          delta: -1,
          reason: 'รับของที่งาน',
          refType: 'REDEMPTION',
          createdBy: users[0].id,
        },
      }),
      prisma.stockMovement.create({
        data: {
          itemId: items[0].id,
          delta: -1,
          reason: 'รับของจากการบริจาค',
          refType: 'REDEMPTION',
          createdBy: users[0].id,
        },
      }),
    ]);
    console.log(`✅ Created ${redemptionMovements.length} redemption movements\n`);

    // 10. สร้าง Shipments (การจัดส่ง)
    console.log('🚚 Creating shipments...');
    const shipments = await Promise.all([
      prisma.shipment.create({
        data: {
          donationId: donations[1].id,
          userId: users[4].id,
          itemId: items[4].id, // Bottle
          qty: 2,
          receiverName: 'วิภา สุขใจ',
          phone: '0856789012',
          addressLine: '555 ถนนสีหนาท แขวงสุรนารี',
          subdistrict: 'สุรนารี',
          district: 'เมือง',
          province: 'นครราชสีมา',
          postalCode: '30000',
          status: 'DELIVERED',
          trackingNo: 'TH1234567890',
        },
      }),
      prisma.shipment.create({
        data: {
          donationId: donations[0].id,
          userId: users[3].id,
          itemId: items[0].id, // Bag
          qty: 1,
          receiverName: 'ประยุทธ์ มั่นคง',
          phone: '0845678901',
          addressLine: '444 ถนนราชดำเนิน',
          subdistrict: 'หนองระเวียง',
          district: 'เมือง',
          province: 'นครราชสีมา',
          postalCode: '30000',
          status: 'PENDING',
          trackingNo: 'TH0987654321',
        },
      }),
      prisma.shipment.create({
        data: {
          donationId: donations[2].id,
          userId: users[1].id,
          itemId: items[0].id, // Bag
          qty: 1,
          receiverName: 'สมชาย ใจดี',
          phone: '0823456789',
          addressLine: '222 ถนนมิตรภาพ ตึก B ชั้น 3',
          subdistrict: 'ในเมือง',
          district: 'เมือง',
          province: 'นครราชสีมา',
          postalCode: '30000',
          status: 'PENDING',
          trackingNo: null,
        },
      }),
    ]);
    console.log(`✅ Created ${shipments.length} shipments\n`);

    // 11. สร้าง Stock Movements จากการจัดส่ง (ตัดสต็อก)
    console.log('📦 Creating stock movements for shipments...');
    const shipmentMovements = await Promise.all([
      prisma.stockMovement.create({
        data: {
          itemId: items[4].id,
          delta: -2,
          reason: 'จัดส่งให้ผู้บริจาค',
          refType: 'SHIPMENT',
          createdBy: users[0].id,
        },
      }),
      prisma.stockMovement.create({
        data: {
          itemId: items[0].id,
          delta: -2,
          reason: 'จัดส่งให้ผู้บริจาค',
          refType: 'SHIPMENT',
          createdBy: users[0].id,
        },
      }),
    ]);
    console.log(`✅ Created ${shipmentMovements.length} shipment movements\n`);

    // แสดงสรุปข้อมูล
    console.log('📊 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 Users: ${users.length}`);
    console.log(`🎁 Souvenir Items: ${items.length}`);
    console.log(`📦 Stock Movements: ${movements.length + redemptionMovements.length + shipmentMovements.length}`);
    console.log(`📅 Events: ${events.length}`);
    console.log(`📝 Event Registrations: ${registrations.length}`);
    console.log(`💰 Donations: ${donations.length}`);
    console.log(`🎫 Entitlements: ${entitlements.length}`);
    console.log(`✋ Redemptions: ${redemptions.length}`);
    console.log(`🚚 Shipments: ${shipments.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // แสดงสต็อกปัจจุบันของแต่ละไอเทม
    console.log('\n📊 Current Stock Status:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    for (const item of items) {
      const allMovements = await prisma.stockMovement.findMany({
        where: { itemId: item.id },
      });
      const totalDelta = allMovements.reduce((sum, m) => sum + m.delta, 0);
      const currentStock = item.initialStock + totalDelta;
      console.log(`${item.name.padEnd(25)} | Initial: ${item.initialStock.toString().padStart(3)} | Movement: ${totalDelta.toString().padStart(4)} | Current: ${currentStock.toString().padStart(3)} ${item.unit}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✨ Souvenir system seeding completed successfully!\n');
    
    console.log('🔐 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('All users have the same password: password123\n');
    console.log('Admin Account:');
    console.log('  Email: admin@sut.ac.th');
    console.log('  Password: password123');
    console.log('  Role: ADMIN\n');
    console.log('Student Accounts:');
    console.log('  1. student1@sut.ac.th (สมชาย ใจดี)');
    console.log('  2. student2@sut.ac.th (สมหญิง รักดี)');
    console.log('  Password: password123\n');
    console.log('Alumni Accounts:');
    console.log('  1. alumni1@sut.ac.th (ประยุทธ์ มั่นคง)');
    console.log('  2. alumni2@sut.ac.th (วิภา สุขใจ)');
    console.log('  Password: password123\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ Error seeding souvenir system:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedSouvenirSystem();
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
