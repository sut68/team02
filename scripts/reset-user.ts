import { prisma } from '../app/lib/prisma';

async function resetUserStatus() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'cchutikhan2@gmail.com' }, // เปลี่ยนเป็นอีเมลที่สมัคร Resend
    });

    if (!user) {
      console.log('❌ ไม่พบผู้ใช้');
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { status: 'pending' },
    });

    console.log('✅ เปลี่ยนสถานะกลับเป็น pending แล้ว');
    console.log('💡 ตอนนี้รัน: npx tsx scripts/test-email.ts');
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetUserStatus();
