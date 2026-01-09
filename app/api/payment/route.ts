import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma"; // ตรวจสอบ path ให้ถูกต้อง
import { PaymentStatusType, TransactionStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, status, slipUrl } = body;

    if (!paymentId || !status) {
      return NextResponse.json({ error: "Missing paymentId or status" }, { status: 400 });
    }

    const newPaymentStatus = status as PaymentStatusType;

    // ✅ สร้างตัวแปรเวลาเดียว เพื่อใช้ Stamp ทุกตารางให้ตรงกันเป๊ะๆ (เป็น UTC)
    const actionTimestamp = new Date();

    // เริ่ม Transaction เพื่อความปลอดภัยของข้อมูล (Atomic Operation)
    const result = await prisma.$transaction(async (tx) => {
      
      // 2. ดึงข้อมูล PaymentRecord ปัจจุบัน
      const currentPayment = await tx.paymentRecord.findUnique({
        where: { id: Number(paymentId) },
        include: {
          budgetDonation: true,
          transaction: true, // DonationTransaction (บริจาคทั่วไป)
          // bookings: true, // ถ้ามี booking ก็ include มาด้วย
        },
      });

      if (!currentPayment) {
        throw new Error("Payment record not found");
      }

      // ป้องกันการอัปเดตซ้ำ (Idempotency)
      if (currentPayment.paymentStatus === PaymentStatusType.CONFIRMED) {
        throw new Error("รายการนี้ถูกยืนยันไปแล้ว");
      }

      // 3. อัปเดตสถานะที่ตาราง PaymentRecord
      const updatedPayment = await tx.paymentRecord.update({
        where: { id: Number(paymentId) },
        data: {
          paymentStatus: newPaymentStatus,
          paymentSlipUrl: slipUrl || currentPayment.paymentSlipUrl, // อัปเดตสลิปถ้ามีส่งมาใหม่
          updatedAt: actionTimestamp, // ✅ บันทึกเวลาอัปเดต
        },
      });

      // 4. กรณีสถานะคือ "CONFIRMED" (สำเร็จ)
      if (newPaymentStatus === PaymentStatusType.CONFIRMED) {
        
        // --- 4.1: BudgetDonation (ระดมทุนงบประมาณ) ---
        if (currentPayment.budgetDonation) {
          // A. เปลี่ยนสถานะ BudgetDonation เป็น SUCCESS
          await tx.budgetDonation.update({
            where: { id: currentPayment.budgetDonation.id },
            data: { 
                status: TransactionStatus.SUCCESS,
                updatedAt: actionTimestamp 
            },
          });

          // B. บวกเงินเข้า DonationProject
          await tx.donationProject.update({
            where: { id: currentPayment.budgetDonation.projectId },
            data: {
              currentAmount: {
                increment: Number(currentPayment.amount), // แปลง Decimal เป็น Number
              },
              updatedAt: actionTimestamp,
            },
          });
        }

        // --- 4.2: DonationTransaction (บริจาคทั่วไป) ---
        else if (currentPayment.transaction) {
          // A. เปลี่ยนสถานะ DonationTransaction เป็น SUCCESS
          await tx.donationTransaction.update({
            where: { id: currentPayment.transaction.id },
            data: { 
                status: TransactionStatus.SUCCESS,
                updatedAt: actionTimestamp 
            },
          });

          // B. บวกเงินเข้า DonationProject
          await tx.donationProject.update({
            where: { id: currentPayment.transaction.projectId },
            data: {
              currentAmount: {
                increment: Number(currentPayment.amount),
              },
              updatedAt: actionTimestamp,
            },
          });
        }
        
        // --- 4.3: Booking (ถ้ามีในอนาคต) ---
        
        else if (currentPayment.bookingId) {
           await tx.booking.update({
              where: { id: currentPayment.bookingId },
              data: { transactionStatus: TransactionStatus.SUCCESS, updatedAt: actionTimestamp }
           });
        }
        
      } 
      
      // 5. กรณีสถานะคือ ยกเลิก หรือ ปฏิเสธ (REFUNDED / CANCELLED)
      else if (newPaymentStatus === PaymentStatusType.CANCELLED || newPaymentStatus === PaymentStatusType.REFUNDED) {
         if (currentPayment.budgetDonation) {
            await tx.budgetDonation.update({
                where: { id: currentPayment.budgetDonation.id },
                data: { 
                    status: TransactionStatus.FAILED,
                    updatedAt: actionTimestamp
                }
            });
         } else if (currentPayment.transaction) {
            await tx.donationTransaction.update({
                where: { id: currentPayment.transaction.id },
                data: { 
                    status: TransactionStatus.FAILED,
                    updatedAt: actionTimestamp
                }
            });
         }
      }

      return updatedPayment;
    });

    return NextResponse.json({ success: true, data: result });

  } catch (error: any) {
    console.error("Update payment error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const paymentId = url.searchParams.get("paymentId");

    // ถ้ามี paymentId ให้คืนข้อมูลรายการเดียว (เหมือนเดิม)
    if (paymentId) {
      const payment = await prisma.paymentRecord.findUnique({
        where: { id: Number(paymentId) },
        include: {
          budgetDonation: true,
          transaction: true,
          bookings: true,
        },
      });

      if (!payment) {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }

      const safePayment = {
        ...payment,
        amount: payment.amount ? Number(payment.amount) : payment.amount,
        createdAt: payment.createdAt?.toISOString?.(),
        updatedAt: payment.updatedAt?.toISOString?.(),
        paymentSlipUrl: payment.paymentSlipUrl ?? null,
      };

      return NextResponse.json({ success: true, data: safePayment });
    }

    // ถ้าไม่มี paymentId ให้คืนรายการทั้งหมด
    const payments = await prisma.paymentRecord.findMany({
      include: {
        budgetDonation: true,
        transaction: true,
        bookings: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const safePayments = payments.map((payment) => ({
      ...payment,
      amount: payment.amount ? Number(payment.amount) : payment.amount,
      createdAt: payment.createdAt?.toISOString?.(),
      updatedAt: payment.updatedAt?.toISOString?.(),
      paymentSlipUrl: payment.paymentSlipUrl ?? null,
    }));

    return NextResponse.json({ success: true, data: safePayments });
  } catch (error: any) {
    console.error("Get payment error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}