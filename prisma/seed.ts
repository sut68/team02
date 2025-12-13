// prisma/seed.ts
import { Prisma,PrismaClient, Role, StudyStatus, VerifyStatus } from '@prisma/client';
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
      fullName: 'เจ้าหน้าที่ระบบ ศิษย์เก่า',
      phone: '0891112233',
      address: '111 อาคารวิศวกรรมศาสตร์ มทส.',
      subdistrict: 'สุรนารี',
      district: 'เมืองนครราชสีมา',
      province: 'นครราชสีมา',
      postalCode: '30000',
      role: Role.ADMIN,
      password: hashedPassword,
    },
    {
      email: 'b6631345@g.sut.ac.th',
      fullName: 'สมชาย วิศวกร',
      phone: '0892223344',
      address: '123 หมู่บ้านวิศวกร',
      subdistrict: 'สุรนารี',
      district: 'เมืองนครราชสีมา',
      province: 'นครราชสีมา',
      postalCode: '30000',
      role: Role.STUDENT,
      password: hashedPassword,
    },
    {
      email: 'b6610364@g.sut.ac.th',
      fullName: 'สมหญิง วิศวกร',
      phone: '0893334455',
      address: '456 หมู่บ้านวิศวกร',
      subdistrict: 'สุรนารี',
      district: 'เมืองนครราชสีมา',
      province: 'นครราชสีมา',
      postalCode: '30000',
      role: Role.STUDENT,
      password: hashedPassword,
    },
    {
      email: 'alumni.2018@sut-eng.ac.th',
      fullName: 'อดีตศิษย์ วิศวกร',
      phone: '0894445566',
      address: '789 หมู่บ้านศิษย์เก่า',
      subdistrict: 'สุรนารี',
      district: 'เมืองนครราชสีมา',
      province: 'นครราชสีมา',
      postalCode: '30000',
      role: Role.ALUMNI,
      password: hashedPassword,
    },
    {
      email: 'alumni.2020@sut-eng.ac.th',
      fullName: 'อดีตศิษย์ วิศวกร 2020',
      phone: '0895556677',
      address: '101 หมู่บ้านศิษย์เก่า',
      subdistrict: 'สุรนารี',
      district: 'เมืองนครราชสีมา',
      province: 'นครราชสีมา',
      postalCode: '30000',
      role: Role.ALUMNI,
      password: hashedPassword,
    },
    {
      email: 'alumni.2015@sut-eng.ac.th',
      fullName: 'อดีตศิษย์ วิศวกร 2015',
      phone: '0896667788',
      address: '202 หมู่บ้านศิษย์เก่า',
      subdistrict: 'สุรนารี',
      district: 'เมืองนครราชสีมา',
      province: 'นครราชสีมา',
      postalCode: '30000',
      role: Role.ALUMNI,
      password: hashedPassword,
    },
    {
      email: 'student.2ndyear@g.sut.ac.th',
      fullName: 'นิสิต ปี2',
      phone: '0897778899',
      address: '303 หมู่บ้านนิสิต',
      subdistrict: 'สุรนารี',
      district: 'เมืองนครราชสีมา',
      province: 'นครราชสีมา',
      postalCode: '30000',
      role: Role.STUDENT,
      password: hashedPassword,
    },
  ];

  // สร้าง userMap เพื่อ map email -> id
  const userMap: Record<string, { id: number }> = {};
  for (const u of userData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: u,
      create: u,
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

  // -----------------------------
  // 4) SOUVENIR ITEMS
  // -----------------------------
  const souvenirData = [
    {
      sku: 'CAP-ENGI-2025',
      name: 'หมวกวิศวกรรมศาสตร์',
      description: 'หมวกแก๊ปปักโลโก้คณะวิศวกรรมศาสตร์ มทส.',
      category: 'กิจกรรม',
      imageUrl: '/souvenir/EngiCap.png',
      unit: 'ชิ้น',
      initialStock: 100,
      active: true,
    },
    {
      sku: 'BROOCH-ENGI-2025',
      name: 'เข็มกลัดวิศวกรรมศาสตร์',
      description: 'เข็มกลัดโลหะปักโลโก้วิศวกรรมศาสตร์ มทส.',
      category: 'กิจกรรม',
      imageUrl: '/souvenir/EngiBrooch.png',
      unit: 'อัน',
      initialStock: 200,
      active: true,
    },
    {
      sku: 'BOTTLE-ENGI-2025',
      name: 'กระบอกน้ำวิศวกรรมศาสตร์',
      description: 'กระบอกน้ำสแตนเลส พร้อมโลโก้วิศวกรรมศาสตร์ มทส.',
      category: 'บริจาค',
      imageUrl: '/souvenir/EngiBottle.png',
      unit: 'ใบ',
      initialStock: 150,
      active: true,
    },
    {
      sku: 'BAG-NEW-2025',
      name: 'กระเป๋าผ้า มทส.',
      description: 'กระเป๋าผ้าแคนวาส สกรีนลาย มทส.',
      category: 'กิจกรรม',
      imageUrl: '/souvenir/Bag_new.png',
      unit: 'ใบ',
      initialStock: 80,
      active: true,
    },
    {
      sku: 'BOOK-NEW-2025',
      name: 'สมุดบันทึก มทส.',
      description: 'สมุดบันทึกปกแข็ง พร้อมโลโก้ มทส.',
      category: 'บริจาค',
      imageUrl: '/souvenir/Book_new.png',
      unit: 'เล่ม',
      initialStock: 300,
      active: true,
    },
    {
      sku: 'UMBRELLA-NEW-2025',
      name: 'ร่ม มทส.',
      description: 'ร่มพับ 3 ตอน พร้อมโลโก้ มทส.',
      category: 'บริจาค',
      imageUrl: '/souvenir/Umbrella_new.png',
      unit: 'คัน',
      initialStock: 120,
      active: true,
    },
  ];

  for (const item of souvenirData) {
    await prisma.souvenirItem.upsert({
      where: { sku: item.sku },
      update: {
        name: item.name,
        description: item.description,
        category: item.category,
        imageUrl: item.imageUrl,
        unit: item.unit,
        initialStock: item.initialStock,
        active: item.active,
      },
      create: item,
    });
  }

  console.log('✅ Seeded souvenir items');
  const bookingFormsData = [
  {
    Type: "REUNION",
    BatchNumber: 1,
    TotalSeats: 500,
    StartDate: new Date("2025-03-15T09:00:00Z"),
    EndDate: new Date("2025-03-15T17:00:00Z"),
    PriceType: "FREE",
    singlePrice: null,
    batchPrices: undefined,
    Souvenir: "HAVE",
  },
  {
    Type: "SEMINAR",
    BatchNumber: 1,
    TotalSeats: 200,
    StartDate: new Date("2025-05-10T13:00:00Z"),
    EndDate: new Date("2025-05-10T17:00:00Z"),
    PriceType: "SINGLE",
    singlePrice: 199,
    batchPrices: undefined,
    Souvenir: "NOT",
  },
  {
    Type: "WORKSHOP",
    BatchNumber: 2,
    TotalSeats: 2000,
    StartDate: new Date("2025-06-01T09:00:00Z"),
    EndDate: new Date("2025-06-02T17:00:00Z"),
    PriceType: "BY_BATCH",
    singlePrice: null,
    batchPrices: [
      { startBatch: 1, endBatch: 50, price: 0 },
      { startBatch: 51, endBatch: 200, price: 49 },
      { startBatch: 201, endBatch: 500, price: 99 },
    ],
    Souvenir: "HAVE",
  },
];

// เก็บ id ที่สร้างได้
const bookingFormIds: number[] = [];

for (const form of bookingFormsData) {
  const existing = await prisma.bookingForm.findFirst({
    where: { Type: form.Type as any, StartDate: form.StartDate },
  });

  const data: Prisma.BookingFormUncheckedUpdateInput = {
    BatchNumber: form.BatchNumber,
    TotalSeats: form.TotalSeats,
    EndDate: form.EndDate,
    PriceType: form.PriceType as any,
    singlePrice: form.singlePrice ?? null,
    batchPrices: form.batchPrices ?? Prisma.DbNull,
    Souvenir: form.Souvenir as any,
  };

  const saved = existing
    ? await prisma.bookingForm.update({
        where: { id: existing.id },
        data,
      })
    : await prisma.bookingForm.create({
        data: {
          ...data,
          Type: form.Type as any,
          StartDate: form.StartDate,
        } as any,
      });

  bookingFormIds.push(saved.id);
}
  const contentData = [
    {
    TitleName: "DSA MASCOT CONTENT",
    Description:
      "ขอเชิญชวนนักศึกษา ผู้เรียน และศิษย์เก่า มทส. ทุกท่านร่วมโหวตผลงานผู้เข้าประกวด พร้อมอ่านแนวคิดการออกแบบ ในกิจกรรม“DSA Mascot Contest”  ",
    categories: "ACTIVITY",
    Booking: "NOT",
    Userid: 1,
    bookingFormIndex: null,
  },
  {
    TitleName: "การแต่งตั้งให้ดำรงตำแหน่งรักษาการแทนอธิการบดี มทส.",
    Description:
      "มหาวิทยาลัยเทคโนโลยีสุรนารี ประกาศแต่งตั้งคณะผู้บริหารรักษาการชุดใหม่ *มีผลตั้งแต่วันที่ 15 พฤศจิกายน 2568 เป็นต้นไป",
    categories: "EVENT",
    Booking: "NOT",
    Userid: 1,
    bookingFormIndex: null,
  },
  {
    TitleName: "IESUT FAMILY 2025",
    Description:
      "จากวันนั้นถึงวันนี้...ความผูกพัน IE มทส ไม่เคยจางหาย #IESUTFamily2025 #ย้อนวัยIEมทส #คืนสู่เหย้าIEสุรนารี #รวมพลชาวเลือดสีน้ำตาล",
    categories: "ACTIVITY",
    Booking: "HAVE",
    Userid: 1,
    bookingFormIndex: 2,
  },
  {
    TitleName: "ENGi Research to Marget",
    Description:
      "โครงการ เส้นทางสู่นวัตวณิชย์ วิศวกรรม มทส. หรือ ENGi R2M (Research to Market) ครั้งที่ 1",
    categories: "EVENT",
    Booking: "HAVE",
    Userid: 1,
    bookingFormIndex: 0,
  },
  {
    TitleName: "SUT GLOBAL ENTREPRENEURSHIP CAMP 2026",
    Description:
      "Be brave to try. Be proud to grow. Be part of GEC2026 !Got the spirit to try, learn, and make new international friends? This camp is for YOU!",
    categories: "EVENT",
    Booking: "NOT",
    Userid: 1,
    bookingFormIndex: null,
  },
];

for (const c of contentData) {
  const BookingFormID =
    c.bookingFormIndex !== null ? bookingFormIds[c.bookingFormIndex] : null;

  const existing = await prisma.content.findFirst({
    where: {
      TitleName: c.TitleName,
      categories: c.categories as any,
    },
  });

  const payload = {
    TitleName: c.TitleName,
    Description: c.Description,
    categories: c.categories as any,
    Booking: c.Booking as any,
    Userid: c.Userid,
    BookingFormID,
  };

  if (existing) {
    await prisma.content.update({
      where: { id: existing.id },
      data: payload,
    });
  } else {
    await prisma.content.create({ data: payload });
  }
}
  const picturePlans = [
  { title: "SUT GLOBAL ENTREPRENEURSHIP CAMP 2026", paths: ["/Content/Event6.jpg"] },
  { title: "ENGi Research to Marget", paths: ["/Content/Event5.jpg"] },
  { title: "DSA MASCOT CONTENT", paths: ["/Content/Event3.png"] },
  {
    title: "การแต่งตั้งให้ดำรงตำแหน่งรักษาการแทนอธิการบดี มทส.",
    paths: ["/Content/Event10.jpg"],
  },
  { title: "IESUT FAMILY 2025", paths: ["/Content/Event11.jpg"] },
];

for (const plan of picturePlans) {
  const content = await prisma.content.findFirst({
    where: { TitleName: plan.title },
  });

  if (!content) continue;

  for (const path of plan.paths) {
    const existing = await prisma.pictureContent.findFirst({
      where: { Path: path, ContentID: content.id },
    });

    if (!existing) {
      await prisma.pictureContent.create({
        data: {
          Path: path,
          ContentID: content.id,
        },
      });
    }
  }
}

console.log("✅ Seeded BookingForm + Content + PictureContent");

  // Skipping event seeding, only seed Booking/Content/Donation related data

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
