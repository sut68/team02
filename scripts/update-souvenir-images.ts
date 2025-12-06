import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateSouvenirImages() {
  try {
    console.log('🔄 Starting to update souvenir data...');

    // ข้อมูลของที่ระลึกสำหรับกิจกรรม (ตามรูปใน public/souvenir)
    const activitySouvenirs = [
      {
        sku: 'ACT-001',
        name: 'เข็มกลัดคณะวิศวกรรมศาสตร์',
        description: 'เข็มกลัดสัญลักษณ์คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเทคโนโลยีสุรนารี',
        category: 'กิจกรรม',
        unit: 'ชิ้น',
        initialStock: 100,
        imageUrl: '/souvenir/EngiBrooch.png'
      },
      {
        sku: 'ACT-002',
        name: 'กระบอกน้ำ SUT',
        description: 'กระบอกน้ำสแตนเลส พร้อมสัญลักษณ์มหาวิทยาลัยเทคโนโลยีสุรนารี',
        category: 'กิจกรรม',
        unit: 'ชิ้น',
        initialStock: 150,
        imageUrl: '/souvenir/EngiButton.png'
      },
      {
        sku: 'ACT-003',
        name: 'หมวก SUT Engineering',
        description: 'หมวกแก๊ปคณะวิศวกรรมศาสตร์ สีส้ม',
        category: 'กิจกรรม',
        unit: 'ชิ้น',
        initialStock: 80,
        imageUrl: '/souvenir/EngiCap.png'
      }
    ];

    // ข้อมูลของที่ระลึกสำหรับบริจาค
    const donationSouvenirs = [
      {
        sku: 'DON-001',
        name: 'ถุงผ้า SUT',
        description: 'ถุงผ้าสะพายข้าง ลายมหาวิทยาลัยเทคโนโลยีสุรนารี',
        category: 'บริจาค',
        unit: 'ชิ้น',
        initialStock: 200,
        imageUrl: '/souvenir/Bag.png'
      },
      {
        sku: 'DON-002',
        name: 'สมุดบันทึก Suranaree',
        description: 'สมุดบันทึกปกแข็ง พร้อมสัญลักษณ์ท้าวสุรนารี',
        category: 'บริจาค',
        unit: 'เล่ม',
        initialStock: 150,
        imageUrl: '/souvenir/Book.png'
      },
      {
        sku: 'DON-003',
        name: 'ร่ม SUT',
        description: 'ร่มพับ 3 ตอน ลายมหาวิทยาลัยเทคโนโลยีสุรนารี',
        category: 'บริจาค',
        unit: 'คัน',
        initialStock: 100,
        imageUrl: '/souvenir/Umbrella.png'
      }
    ];

    // ลบข้อมูลเก่าทั้งหมดตามลำดับ (foreign key constraints)
    console.log('🗑️  Deleting old data...');
    await prisma.redemption.deleteMany({});
    await prisma.entitlement.deleteMany({});
    await prisma.stockMovement.deleteMany({});
    await prisma.shipment.deleteMany({});
    await prisma.souvenirItem.deleteMany({});
    console.log('✅ Deleted old souvenir data');

    // สร้างข้อมูลใหม่สำหรับกิจกรรม
    for (const item of activitySouvenirs) {
      await prisma.souvenirItem.create({
        data: item
      });
      console.log(`✅ Created ${item.name}`);
    }

    // สร้างข้อมูลใหม่สำหรับบริจาค
    for (const item of donationSouvenirs) {
      await prisma.souvenirItem.create({
        data: item
      });
      console.log(`✅ Created ${item.name}`);
    }

    console.log('🎉 Souvenir data updated successfully!');
  } catch (error) {
    console.error('❌ Error updating souvenir data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSouvenirImages();
