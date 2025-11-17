import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  console.log('🧪 สร้าง Test User...\n');

  const email = await question('Email: ');
  const password = await question('Password: ');
  const fullName = await question('Full Name: ');
  const phone = await question('Phone (optional, press Enter to skip): ') || '-';
  
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fullName,
      phone,
      address: '-',
      subdistrict: '-',
      district: '-',
      province: '-',
      postalCode: '-',
      role: 'STUDENT',
    },
  });

  console.log('\n✅ สร้าง User สำเร็จ!');
  console.log('📧 Email:', user.email);
  console.log('👤 Full Name:', user.fullName);
  console.log('🔑 Password:', password);
  console.log('\n👉 ไปที่ User Management เพื่ออนุมัติ user นี้');
  
  rl.close();
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
