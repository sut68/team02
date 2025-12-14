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
