// prisma/seed.ts
import { PrismaClient, Role, StudyStatus, VerifyStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const defaultPassword = 'sut12345';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // -----------------------------
  // 1) USER
  // -----------------------------
  const userData = [
    {
      email: 'admin@sut-eng.ac.th',
      name: 'เจ้าหน้าที่ระบบ ศิษย์เก่า',
      phone: '0891112233',
      addressLine: '111 อาคารวิศวกรรมศาสตร์ มทส.',
      subdistrict: 'สุรนารี',
      district: 'เมืองนครราชสีมา',
      province: 'นครราชสีมา',
      postalCode: '30000',
      role: Role.ADMIN,
    },
    {
      email: 'b6631345@g.sut.ac.th',
      name: 'นางสาวชุติกาญจน์ ชมกลาง',
      phone: '0892223344',
      addressLine: '99/12 หมู่ 5',
      subdistrict: 'สุรนารี',
      district: 'เมืองนครราชสีมา',
      province: 'นครราชสีมา',
      postalCode: '30000',
      role: Role.STUDENT,
    },
    {
      email: 'b6610364@g.sut.ac.th',
      name: 'นายปัณณธร ขันละ',
      phone: '0893334455',
      addressLine: '88/7 หมู่ 3',
      subdistrict: 'สุรนารี',
      district: 'เมืองนครราชสีมา',
      province: 'นครราชสีมา',
      postalCode: '30000',
      role: Role.STUDENT,
    },
    {
      email: 'alumni.2018@sut-eng.ac.th',
      name: 'นายวีรยุทธ ดอนเมือง',
      phone: '0894445566',
      addressLine: '99/12 ถนนเพิ่มสิน',
      subdistrict: 'สายไหม',
      district: 'สายไหม',
      province: 'กรุงเทพมหานคร',
      postalCode: '10220',
      role: Role.ALUMNI,
    },
    {
      email: 'alumni.2020@sut-eng.ac.th',
      name: 'นางสาวศุภนิดา วิศวกร',
      phone: '0895556677',
      addressLine: '128/45 หมู่บ้านวิศวกร',
      subdistrict: 'ในเมือง',
      district: 'เมืองขอนแก่น',
      province: 'ขอนแก่น',
      postalCode: '40000',
      role: Role.ALUMNI,
    },
    {
      email: 'alumni.2015@sut-eng.ac.th',
      name: 'นายธนกฤต ช่างใหญ่',
      phone: '0896667788',
      addressLine: '45/8 ซอยลาดพร้าว 101',
      subdistrict: 'คลองจั่น',
      district: 'บางกะปิ',
      province: 'กรุงเทพมหานคร',
      postalCode: '10240',
      role: Role.ALUMNI,
    },
    {
      email: 'student.2ndyear@g.sut.ac.th',
      name: 'นายณัฐพงศ์ ทองเถาะ',
      phone: '0897778899',
      addressLine: '12/3 หอพักนักศึกษา',
      subdistrict: 'สุรนารี',
      district: 'เมืองนครราชสีมา',
      province: 'นครราชสีมา',
      postalCode: '30000',
      role: Role.STUDENT,
    },
  ];

  const userMap: Record<string, { id: number }> = {};

  for (const u of userData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        password: hashedPassword, // ทุกคนใช้ sut12345
        fullName: u.name,
        phone: u.phone,
        address: u.addressLine,
        subdistrict: u.subdistrict,
        district: u.district,
        province: u.province,
        postalCode: u.postalCode,
        role: u.role,
      },
    });

    userMap[u.email] = { id: user.id };
  }

  console.log('✅ Seeded users');

  // -----------------------------
  // 2) EDUCATION RECORD
  //    (ทุกคนมี transcript หมด)
  // -----------------------------
  const eduData = [
    {
      studentCode: 'B6631345',
      major: 'วิศวกรรมคอมพิวเตอร์',
      gradYear: null,
      status: StudyStatus.ACTIVE,
      transcript: 'https://example.com/transcripts/B6631345.pdf',
      userEmail: 'b6631345@g.sut.ac.th',
    },
    {
      studentCode: 'B6610364',
      major: 'วิศวกรรมคอมพิวเตอร์',
      gradYear: null,
      status: StudyStatus.ACTIVE,
      transcript: 'https://example.com/transcripts/B6610364.pdf',
      userEmail: 'b6610364@g.sut.ac.th',
    },
    {
      studentCode: 'B5900123',
      major: 'วิศวกรรมโยธา',
      gradYear: 2018,
      status: StudyStatus.GRADUATED,
      transcript: 'https://example.com/transcripts/B5900123.pdf',
      userEmail: 'alumni.2018@sut-eng.ac.th',
    },
    {
      studentCode: 'B6000456',
      major: 'วิศวกรรมอุตสาหการ',
      gradYear: 2020,
      status: StudyStatus.GRADUATED,
      transcript: 'https://example.com/transcripts/B6000456.pdf',
      userEmail: 'alumni.2020@sut-eng.ac.th',
    },
    {
      studentCode: 'B5600789',
      major: 'วิศวกรรมเครื่องกล',
      gradYear: 2015,
      status: StudyStatus.GRADUATED,
      transcript: 'https://example.com/transcripts/B5600789.pdf',
      userEmail: 'alumni.2015@sut-eng.ac.th',
    },
    {
      studentCode: 'B6730999',
      major: 'วิศวกรรมคอมพิวเตอร์',
      gradYear: null,
      status: StudyStatus.ACTIVE,
      transcript: 'https://example.com/transcripts/B6730999.pdf',
      userEmail: 'student.2ndyear@g.sut.ac.th',
    },
  ];

  for (const e of eduData) {
    const userId = userMap[e.userEmail].id;

    await prisma.educationRecord.upsert({
      where: { studentCode: e.studentCode },
      update: {
        major: e.major,
        gradYear: e.gradYear,
        status: e.status,
        transcript: e.transcript,
        userId,
      },
      create: {
        studentCode: e.studentCode,
        major: e.major,
        gradYear: e.gradYear,
        status: e.status,
        transcript: e.transcript,
        userId,
      },
    });
  }

  console.log('✅ Seeded education records');

  // -----------------------------
  // 3) VERIFICATION
  // -----------------------------
  const verificationData = [
    {
      userEmail: 'b6631345@g.sut.ac.th',
      status: VerifyStatus.PENDING,
      reviewedBy: null,
      reviewedAt: null,
      remark: null,
    },
    {
      userEmail: 'b6610364@g.sut.ac.th',
      status: VerifyStatus.APPROVED,
      reviewedBy: 'admin@sut-eng.ac.th',
      reviewedAt: new Date('2025-11-20T10:30:00Z'),
      remark: 'ยืนยันจาก Transcript แล้ว',
    },
    {
      userEmail: 'alumni.2018@sut-eng.ac.th',
      status: VerifyStatus.APPROVED,
      reviewedBy: 'admin@sut-eng.ac.th',
      reviewedAt: new Date('2025-11-21T14:15:00Z'),
      remark: 'ศิษย์เก่าร่วมงานสานสัมพันธ์ 2568',
    },
    {
      userEmail: 'alumni.2020@sut-eng.ac.th',
      status: VerifyStatus.REJECTED,
      reviewedBy: 'admin@sut-eng.ac.th',
      reviewedAt: new Date('2025-11-22T09:00:00Z'),
      remark: 'เลขรหัสนักศึกษาไม่ตรงกับฐานข้อมูล',
    },
    {
      userEmail: 'alumni.2015@sut-eng.ac.th',
      status: VerifyStatus.APPROVED,
      reviewedBy: 'admin@sut-eng.ac.th',
      reviewedAt: new Date('2025-11-23T16:45:00Z'),
      remark: 'ตรวจสอบแล้วผ่านเกณฑ์',
    },
    {
      userEmail: 'student.2ndyear@g.sut.ac.th',
      status: VerifyStatus.PENDING,
      reviewedBy: null,
      reviewedAt: null,
      remark: null,
    },
  ];

  for (const v of verificationData) {
    const userId = userMap[v.userEmail].id;

    await prisma.verification.upsert({
      where: { userId },
      update: {
        status: v.status,
        reviewedBy: v.reviewedBy ?? undefined,
        reviewedAt: v.reviewedAt ?? undefined,
        remark: v.remark ?? undefined,
      },
      create: {
        userId,
        status: v.status,
        reviewedBy: v.reviewedBy ?? undefined,
        reviewedAt: v.reviewedAt ?? undefined,
        remark: v.remark ?? undefined,
      },
    });
  }

  console.log('✅ Seeded verifications');

  console.log('\n🎉 All seed data inserted successfully.');
  console.log('\n📋 Login credentials (password: sut12345):');
  console.log('   • admin@sut-eng.ac.th');
  console.log('   • b6631345@g.sut.ac.th');
  console.log('   • b6610364@g.sut.ac.th');
  console.log('   • alumni.2018@sut-eng.ac.th');
  console.log('   • alumni.2020@sut-eng.ac.th');
  console.log('   • alumni.2015@sut-eng.ac.th');
  console.log('   • student.2ndyear@g.sut.ac.th');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
