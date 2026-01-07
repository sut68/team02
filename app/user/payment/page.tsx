import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import PaymentClient from './PaymentClient'; 
import { create } from 'domain';

const prisma = new PrismaClient();

type Props = {
  searchParams: Promise<{ paymentId?: string }>;
};

export default async function PaymentPage({ searchParams }: Props) {
  // 1. รอรับค่า searchParams (Next.js 15 ต้อง await)
  const SearchParams = await searchParams;
  const paymentId = SearchParams.paymentId;

  console.log("Payment ID is:", paymentId);

  // 2. Validation: ถ้าไม่มี ID ให้ดีดกลับ
  if (!paymentId ) {
    redirect('/user/donation');
  }

  // แปลงเป็นตัวเลข (ถ้า ID ใน DB เป็น Int)
  const idAsNumber = parseInt(paymentId);
  if (isNaN(idAsNumber)) {
    redirect('/user/donation'); // ID ไม่ใช่ตัวเลข
  }

  // 3. ✅ ดึงข้อมูลจาก DB โดยตรง (แทนการใช้ fetch)
  const paymentData = await prisma.paymentRecord.findUnique({
  where: { 
    id: Number(paymentId) 
  },
  include: {
    // 1. ลองดึงข้อมูลจาก BudgetDonation (พร้อมชื่อโครงการ)
    budgetDonation: {
      include: { project: { select: { title: true } } }
    },
    // 2. ลองดึงข้อมูลจาก DonationTransaction (พร้อมชื่อโครงการ)
    transaction: {
      include: { project: { select: { title: true } } }
    },
    // 3. ลองดึงข้อมูลจาก Booking (พร้อมชื่อกิจกรรม)
    bookings: {
      include: {
        content: { select: { TitleName: true } },
      }
    },
    // ดึงข้อมูลวิธีการชำระเงินด้วย
    paymentMethod: true 
  }
});

  // 4. Validation: ถ้าหาไม่เจอใน DB
  if (!paymentData) {
    return (
      <div className="flex min-h-screen items-center justify-center p-10 text-center text-red-500 text-xl font-bold">
        ไม่พบข้อมูลธุรกรรม (Transaction Not Found)
      </div>
    );
  }

  // 5. ดึง Payment Methods ที่เปิดใช้งาน
  const paymentMethods = await prisma.paymentMethodRecord.findMany({
    where: { isActive: true },
    orderBy: { id: 'asc' },
  });

  // 6. ส่งข้อมูลไปให้ Client Component
  return (
    <PaymentClient 
      transaction={{
        paymentId: paymentData.id,
        amount: Number(paymentData.amount), // แปลง Decimal เป็น Number (ถ้าใช้ Prisma Decimal)
        projectTitle: paymentData.budgetDonation?.project?.title || paymentData.transaction?.project?.title || paymentData.bookings?.content?.TitleName || 'โครงการบริจาคทั่วไป',
        refNo: `PM-${paymentData.id}`,
        status: paymentData.paymentStatus,
        createdAt: paymentData.createdAt,
      }}
      paymentMethods={paymentMethods} 
    />
  );
}