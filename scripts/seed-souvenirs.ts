import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSouvenirs() {
  console.log('🎁 Seeding souvenir data...');

  // สร้างของที่ระลึก 3 ชิ้น
  const items = await Promise.all([
    prisma.souvenirItem.upsert({
      where: { sku: 'BAG-SUT-2025' },
      update: {},
      create: {
        sku: 'BAG-SUT-2025',
        name: 'ถุงผ้า SUT',
        description: 'ถุงผ้า Canvas สีน้ำตาล โลโก้ SUT',
        category: 'บริจาค',
        imageUrl: '/souvenir/Bag.png',
        unit: 'ใบ',
        initialStock: 100,
      },
    }),
    prisma.souvenirItem.upsert({
      where: { sku: 'BOOK-SUT-2025' },
      update: {},
      create: {
        sku: 'BOOK-SUT-2025',
        name: 'Suranaree Notebook',
        description: 'สมุดโน้ตปกแข็ง สีน้ำตาล',
        category: 'กิจกรรม',
        imageUrl: '/souvenir/Book.png',
        unit: 'เล่ม',
        initialStock: 150,
      },
    }),
    prisma.souvenirItem.upsert({
      where: { sku: 'UMB-SUT-2025' },
      update: {},
      create: {
        sku: 'UMB-SUT-2025',
        name: 'SUT Umbrella',
        description: 'ร่มสีดำ โลโก้ SUT',
        category: 'กิจกรรม',
        imageUrl: '/souvenir/Umbrella.png',
        unit: 'คัน',
        initialStock: 80,
      },
    }),
  ]);

  console.log(`✅ Created ${items.length} souvenir items`);

  // สร้าง stock movements เริ่มต้น
  for (const item of items) {
    await prisma.stockMovement.create({
      data: {
        itemId: item.id,
        delta: item.initialStock,
        reason: 'initial_stock',
        refType: 'Initial',
      },
    });
  }

  console.log('✅ Created initial stock movements');

  // สร้าง events ตัวอย่าง
  const events = await Promise.all([
    prisma.event.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'งานสานสัมพันธ์ศิษย์เก่า 2568',
        description: 'งานรวมพลศิษย์เก่า SUT ประจำปี 2568',
        startDate: new Date('2025-12-15'),
        endDate: new Date('2025-12-15'),
        location: 'อาคาร 30 ปี SUT',
        maxAttendees: 200,
        isActive: true,
      },
    }),
    prisma.event.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Homecoming Day 2024',
        description: 'งาน Homecoming Day สำหรับศิษย์เก่า',
        startDate: new Date('2025-01-20'),
        endDate: new Date('2025-01-20'),
        location: 'SUT Convention Hall',
        maxAttendees: 300,
        isActive: true,
      },
    }),
    prisma.event.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: 'Engineering Open House',
        description: 'งานเปิดบ้านคณะวิศวกรรมศาสตร์',
        startDate: new Date('2025-02-10'),
        endDate: new Date('2025-02-12'),
        location: 'สำนักวิชาวิศวกรรมศาสตร์',
        maxAttendees: 500,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${events.length} events`);

  console.log('✨ Souvenir seed completed!');
}

seedSouvenirs()
  .catch((e) => {
    console.error('Error seeding souvenirs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
