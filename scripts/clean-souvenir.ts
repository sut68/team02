// scripts/clean-souvenir.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // SKU ที่ควรเก็บไว้ (ตรงกับรูปที่มีจริง)
  const validSKUs = [
    'CAP-ENGI-2025',
    'BROOCH-ENGI-2025',
    'BOTTLE-ENGI-2025',
    'BAG-NEW-2025',
    'BOOK-NEW-2025',
    'UMBRELLA-NEW-2025',
  ];

  // ลบของที่ระลึกที่ไม่ใช่ SKU ที่ถูกต้อง
  const result = await prisma.souvenirItem.deleteMany({
    where: {
      sku: {
        notIn: validSKUs,
      },
    },
  });

  console.log(`✅ ลบของที่ระลึกที่ไม่ตรงกับรูปแล้ว ${result.count} รายการ`);

  // แสดงของที่ระลึกที่เหลืออยู่
  const remaining = await prisma.souvenirItem.findMany({
    orderBy: { sku: 'asc' },
  });

  console.log('\n📦 ของที่ระลึกที่เหลืออยู่:');
  remaining.forEach((item, index) => {
    console.log(`   ${index + 1}. ${item.name} (${item.sku}) - ${item.imageUrl}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
