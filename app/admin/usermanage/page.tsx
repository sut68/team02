import { prisma } from '@/app/lib/prisma';
import UserManagementClient from './UserManagementClient';

// Server Component - ดึงข้อมูลจาก Database ที่แยกตาราง User, EducationRecord, Verification
export default async function AdminUserManagementPage() {
  // ดึงข้อมูล User พร้อมกับ Relations (ไม่รวม ADMIN)
  const users = await prisma.user.findMany({
    where: {
      role: {
        not: 'ADMIN' // กรองไม่ให้แสดงผู้ดูแลระบบ
      }
    },
    include: {
      educationRecords: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 1 // เอาข้อมูลการศึกษาล่าสุด
      },
      verification: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Transform ข้อมูลให้เหมาะกับ Client Component
  const transformedUsers = users.map(user => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    educationRecord: user.educationRecords[0] ? {
      id: user.educationRecords[0].id,
      studentCode: user.educationRecords[0].studentCode,
      major: user.educationRecords[0].major,
      gradYear: user.educationRecords[0].gradYear,
      status: user.educationRecords[0].status
    } : null,
    verification: user.verification ? {
      id: user.verification.id,
      status: user.verification.status,
      reviewedBy: user.verification.reviewedBy,
      reviewedAt: user.verification.reviewedAt?.toISOString() || null,
      remark: user.verification.remark
    } : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  }));

  return <UserManagementClient initialUsers={transformedUsers} />;
}
