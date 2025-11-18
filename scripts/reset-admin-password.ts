import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdminPassword() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.updateMany({
    where: { role: 'ADMIN' },
    data: { password: hashedPassword }
  });
  
  console.log('✅ อัพเดทรหัสผ่าน Admin ทั้งหมดเป็น: admin123');
  console.log('\n📧 บัญชี Admin ที่สามารถใช้งานได้:');
  console.log('   • admin@sut.ac.th');
  console.log('   • finance@sut.ac.th');
  console.log('   • activity@sut.ac.th');
  console.log('\n🔑 Password: admin123');
  
  await prisma.$disconnect();
}

resetAdminPassword().catch(console.error);
