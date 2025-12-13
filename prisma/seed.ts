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

  // -----------------------------
  // 5) EVENTS (เชื่อมกับของที่ระลึก)
  // -----------------------------
  // ดึง souvenir items ที่สร้างไว้แล้ว
  const broochItem = await prisma.souvenirItem.findUnique({ where: { sku: 'ENGI-BROOCH-001' } });
  const capItem = await prisma.souvenirItem.findUnique({ where: { sku: 'ENGI-CAP-001' } });
  const bottleItem = await prisma.souvenirItem.findUnique({ where: { sku: 'ENGI-BOTTLE-001' } });
  const bagItem = await prisma.souvenirItem.findUnique({ where: { sku: 'ENGI-BAG-001' } });
  const bookItem = await prisma.souvenirItem.findUnique({ where: { sku: 'ENGI-BOOK-001' } });

  const eventData = [
    {
      name: 'งานสานสัมพันธ์ศิษย์เก่าวิศวกรรมศาสตร์ 2568',
      description: 'งานรวมพลศิษย์เก่าคณะวิศวกรรมศาสตร์ มทส. ประจำปี 2568 พบปะสังสรรค์ แลกเปลี่ยนประสบการณ์ และสานสายสัมพันธ์',
      startDate: new Date('2025-03-15T09:00:00Z'),
      endDate: new Date('2025-03-15T17:00:00Z'),
      location: 'หอประชุมใหญ่ คณะวิศวกรรมศาสตร์ มทส.',
      maxAttendees: 500,
      isActive: true,
      souvenirItemId: broochItem?.id, // เข็มกลัด ENGi
    },
    {
      name: 'Engineering Open House 2025',
      description: 'งานเปิดบ้านคณะวิศวกรรมศาสตร์ แนะนำหลักสูตร กิจกรรม และโอกาสในการศึกษาสำหรับน้องๆ ที่สนใจ',
      startDate: new Date('2025-04-20T08:00:00Z'),
      endDate: new Date('2025-04-21T16:00:00Z'),
      location: 'อาคารคณะวิศวกรรมศาสตร์ มทส.',
      maxAttendees: 1000,
      isActive: true,
      souvenirItemId: capItem?.id, // หมวก ENGi
    },
    {
      name: 'วิศวกรรมสัมมนา: นวัตกรรมและเทคโนโลยีสมัยใหม่',
      description: 'การสัมมนาแลกเปลี่ยนความรู้เกี่ยวกับนวัตกรรมและเทคโนโลยีทางวิศวกรรมล่าสุด โดยวิทยากรผู้เชี่ยวชาญ',
      startDate: new Date('2025-05-10T13:00:00Z'),
      endDate: new Date('2025-05-10T17:00:00Z'),
      location: 'ห้องประชุมใหญ่ ชั้น 5 อาคาร 40 ปี',
      maxAttendees: 200,
      isActive: true,
      souvenirItemId: bottleItem?.id, // กระติกน้ำ ENGi
    },
    {
      name: 'Engineering Job Fair 2025',
      description: 'งานแนะนำอาชีพและหางานสำหรับนักศึกษาและศิษย์เก่า พบกับบริษัทชั้นนำกว่า 50 บริษัท',
      startDate: new Date('2025-06-01T09:00:00Z'),
      endDate: new Date('2025-06-02T17:00:00Z'),
      location: 'ศูนย์กีฬาและกิจกรรมนักศึกษา มทส.',
      maxAttendees: 2000,
      isActive: true,
      souvenirItemId: bagItem?.id, // กระเป๋า ENGi
    },
    {
      name: 'กิจกรรมบริจาคโลหิต ครั้งที่ 1/2568',
      description: 'กิจกรรมบริจาคโลหิตเพื่อช่วยเหลือสังคม ร่วมกับสภากาชาดไทย',
      startDate: new Date('2025-02-14T08:00:00Z'),
      endDate: new Date('2025-02-14T15:00:00Z'),
      location: 'ลานหน้าคณะวิศวกรรมศาสตร์',
      maxAttendees: 300,
      isActive: true,
      souvenirItemId: bookItem?.id, // หนังสือ ENGi
    },
  ];
  
  for (const event of eventData) {
    // ตรวจสอบว่ามีกิจกรรมนี้อยู่แล้วหรือไม่
    const existing = await prisma.event.findFirst({
      where: {
        name: event.name,
        startDate: event.startDate,
      },
    });

    if (existing) {
      // อัพเดทถ้ามีอยู่แล้ว
      await prisma.event.update({
        where: { id: existing.id },
        data: {
          description: event.description,
          endDate: event.endDate,
          location: event.location,
          maxAttendees: event.maxAttendees,
          isActive: event.isActive,
        },
      });
    } else {
      // สร้างใหม่ถ้ายังไม่มี
      await prisma.event.create({
        data: event,
      });
    }
  }
  
  console.log('✅ Seeded events');

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
