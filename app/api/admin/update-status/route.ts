import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { transporter, mailOptions } from '@/app/lib/nodemailer';
import jwt from 'jsonwebtoken';

export async function PATCH(request: NextRequest) {
  try {
    // Get admin info from token
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    let adminInfo;
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as {
        userId: number;
        email: string;
        role: string;
      };

      // Check if user is admin
      if (decoded.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'คุณไม่มีสิทธิ์ในการดำเนินการนี้' },
          { status: 403 }
        );
      }

      // Get admin data
      const admin = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, fullName: true, email: true, role: true }
      });

      if (!admin) {
        return NextResponse.json(
          { error: 'ไม่พบข้อมูลผู้ดูแลระบบ' },
          { status: 404 }
        );
      }

      adminInfo = admin;
    } catch (error) {
      return NextResponse.json(
        { error: 'การยืนยันตัวตนไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, status, remark } = body;

    if (!userId || !status) {
      return NextResponse.json(
        { error: 'กรุณาระบุ userId และ status' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
    const upperStatus = status.toUpperCase();
    if (!validStatuses.includes(upperStatus)) {
      return NextResponse.json(
        { error: 'สถานะไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { verification: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ไม่พบผู้ใช้' },
        { status: 404 }
      );
    }

    // Update or create verification record with real admin info
    const verification = await prisma.verification.upsert({
      where: { userId: parseInt(userId) },
      update: {
        status: upperStatus as 'PENDING' | 'APPROVED' | 'REJECTED',
        reviewedAt: new Date(),
        remark: remark || null,
        reviewedBy: `${adminInfo.fullName} (${adminInfo.email})`
      },
      create: {
        userId: parseInt(userId),
        status: upperStatus as 'PENDING' | 'APPROVED' | 'REJECTED',
        reviewedAt: new Date(),
        remark: remark || null,
        reviewedBy: `${adminInfo.fullName} (${adminInfo.email})`
      }
    });

    // Send email notification
    if (upperStatus === 'APPROVED' || upperStatus === 'REJECTED') {
      await sendStatusEmail(user.email, user.fullName, upperStatus, remark);
    }

    return NextResponse.json(
      {
        message: 'อัปเดตสถานะสำเร็จ',
        verification
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' },
      { status: 500 }
    );
  }
}

async function sendStatusEmail(email: string, fullName: string, status: string, remark?: string) {
  const isApproved = status === 'APPROVED';
  const statusText = isApproved ? 'อนุมัติ (Approved)' : 'ไม่อนุมัติ (Rejected)';
  const statusColor = isApproved ? '#2563EB' : '#DC2626'; // สีน้ำเงิน หรือ สีแดง
  
  const subject = isApproved 
    ? '🎉 บัญชีของคุณได้รับการอนุมัติแล้ว - ระบบศิษย์เก่าวิศวกรรมศาสตร์'
    : 'แจ้งผลการตรวจสอบบัญชี - ระบบศิษย์เก่าวิศวกรรมศาสตร์';

  const htmlContent = `
    <div style="font-family: 'Sarabun', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
      <h2 style="color: ${statusColor};">ผลการพิจารณาบัญชีสมาชิก</h2>
      <p>เรียนคุณ <strong>${fullName}</strong>,</p>
      
      <p>เจ้าหน้าที่ได้ทำการตรวจสอบข้อมูลการลงทะเบียนของคุณแล้ว</p>
      
      <div style="background-color: ${isApproved ? '#EFF6FF' : '#FEF2F2'}; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 5px solid ${statusColor};">
        <strong>สถานะ:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span>
        ${remark ? `<br/><br/><strong>หมายเหตุ:</strong> ${remark}` : ''}
      </div>

      ${isApproved ? `
        <p>คุณสามารถเข้าสู่ระบบเพื่อใช้งานฟังก์ชันต่างๆ ของศิษย์เก่าได้ทันที</p>
        <a href="${process.env.NEXTAUTH_URL || 'https://www.sut-alumniconnect.me'}/auth/login" 
           style="display: inline-block; background-color: #F26522; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
           เข้าสู่ระบบ
        </a>
      ` : `
        <p>หากคุณคิดว่ามีข้อผิดพลาด หรือต้องการแก้ไขข้อมูล กรุณาติดต่อเจ้าหน้าที่</p>
      `}

      <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;" />
      <p style="font-size: 12px; color: #666;">
        อีเมลฉบับนี้เป็นการแจ้งเตือนอัตโนมัติ กรุณาอย่าตอบกลับ<br/>
        สมาคมศิษย์เก่าวิศวกรรมศาสตร์ มหาวิทยาลัยเทคโนโลยีสุรนารี
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      ...mailOptions,
      to: email,
      subject: subject,
      html: htmlContent,
    });
    console.log(`Email sent to ${email} (Status: ${status})`);
  } catch (error) {
    console.error('Failed to send status email:', error);
  }
}