// prisma/seed.ts
import {
  Prisma,
  PrismaClient,
  Role,
  StudyStatus,
  VerifyStatus,
  EventType,
  PriceMode,
  Option,
  ContentCategoryType,
  ProjectStatus,
  TransactionStatus,
  PaymentMethodType,
  PaymentStatusType,
  EntitlementSource,
} from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const defaultPassword = "sut12345";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // -----------------------------
  // 1) USER
  // -----------------------------
  const userData = [
    {
      email: "admin@sut-eng.ac.th",
      fullName: "เจ้าหน้าที่ระบบ ศิษย์เก่า",
      phone: "0891112233",
      address: "111 อาคารวิศวกรรมศาสตร์ มทส.",
      subdistrict: "สุรนารี",
      district: "เมืองนครราชสีมา",
      province: "นครราชสีมา",
      postalCode: "30000",
      role: Role.ADMIN,
      password: hashedPassword,
    },
    {
      email: "b6631345@g.sut.ac.th",
      fullName: "สมชาย วิศวกร",
      phone: "0892223344",
      address: "123 หมู่บ้านวิศวกร",
      subdistrict: "สุรนารี",
      district: "เมืองนครราชสีมา",
      province: "นครราชสีมา",
      postalCode: "30000",
      role: Role.STUDENT,
      password: hashedPassword,
    },
    {
      email: "b6610364@g.sut.ac.th",
      fullName: "สมหญิง วิศวกร",
      phone: "0893334455",
      address: "456 หมู่บ้านวิศวกร",
      subdistrict: "สุรนารี",
      district: "เมืองนครราชสีมา",
      province: "นครราชสีมา",
      postalCode: "30000",
      role: Role.STUDENT,
      password: hashedPassword,
    },
    {
      email: "alumni.2018@sut-eng.ac.th",
      fullName: "อดีตศิษย์ วิศวกร",
      phone: "0894445566",
      address: "789 หมู่บ้านศิษย์เก่า",
      subdistrict: "สุรนารี",
      district: "เมืองนครราชสีมา",
      province: "นครราชสีมา",
      postalCode: "30000",
      role: Role.ALUMNI,
      password: hashedPassword,
    },
    {
      email: "alumni.2020@sut-eng.ac.th",
      fullName: "อดีตศิษย์ วิศวกร 2020",
      phone: "0895556677",
      address: "101 หมู่บ้านศิษย์เก่า",
      subdistrict: "สุรนารี",
      district: "เมืองนครราชสีมา",
      province: "นครราชสีมา",
      postalCode: "30000",
      role: Role.ALUMNI,
      password: hashedPassword,
    },
    {
      email: "alumni.2015@sut-eng.ac.th",
      fullName: "อดีตศิษย์ วิศวกร 2015",
      phone: "0896667788",
      address: "202 หมู่บ้านศิษย์เก่า",
      subdistrict: "สุรนารี",
      district: "เมืองนครราชสีมา",
      province: "นครราชสีมา",
      postalCode: "30000",
      role: Role.ALUMNI,
      password: hashedPassword,
    },
    {
      email: "student.2ndyear@g.sut.ac.th",
      fullName: "นิสิต ปี2",
      phone: "0897778899",
      address: "303 หมู่บ้านนิสิต",
      subdistrict: "สุรนารี",
      district: "เมืองนครราชสีมา",
      province: "นครราชสีมา",
      postalCode: "30000",
      role: Role.STUDENT,
      password: hashedPassword,
    },
  ];

  // map email -> user.id
  const userMap: Record<string, { id: number }> = {};
  for (const u of userData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: u,
      create: u,
    });
    userMap[u.email] = { id: user.id };
  }
  console.log("✅ Seeded users");

  // ใช้ adminId จาก userMap (แก้จุด Userid: 1)
  const adminId = userMap["admin@sut-eng.ac.th"]?.id;
  if (!adminId) throw new Error("admin user not found after seeding");

  // -----------------------------
  // 2) EDUCATION RECORD
  // -----------------------------
  const eduData = [
    {
      studentCode: "B6631345",
      major: "วิศวกรรมคอมพิวเตอร์",
      gradYear: null,
      status: StudyStatus.ACTIVE,
      transcript: "https://example.com/transcripts/B6631345.pdf",
      userEmail: "b6631345@g.sut.ac.th",
    },
    {
      studentCode: "B6610364",
      major: "วิศวกรรมคอมพิวเตอร์",
      gradYear: null,
      status: StudyStatus.ACTIVE,
      transcript: "https://example.com/transcripts/B6610364.pdf",
      userEmail: "b6610364@g.sut.ac.th",
    },
    {
      studentCode: "B5900123",
      major: "วิศวกรรมโยธา",
      gradYear: 2018,
      status: StudyStatus.GRADUATED,
      transcript: "https://example.com/transcripts/B5900123.pdf",
      userEmail: "alumni.2018@sut-eng.ac.th",
    },
    {
      studentCode: "B6000456",
      major: "วิศวกรรมอุตสาหการ",
      gradYear: 2020,
      status: StudyStatus.GRADUATED,
      transcript: "https://example.com/transcripts/B6000456.pdf",
      userEmail: "alumni.2020@sut-eng.ac.th",
    },
    {
      studentCode: "B5600789",
      major: "วิศวกรรมเครื่องกล",
      gradYear: 2015,
      status: StudyStatus.GRADUATED,
      transcript: "https://example.com/transcripts/B5600789.pdf",
      userEmail: "alumni.2015@sut-eng.ac.th",
    },
    {
      studentCode: "B6730999",
      major: "วิศวกรรมคอมพิวเตอร์",
      gradYear: null,
      status: StudyStatus.ACTIVE,
      transcript: "https://example.com/transcripts/B6730999.pdf",
      userEmail: "student.2ndyear@g.sut.ac.th",
    },
  ];

  for (const e of eduData) {
    const userId = userMap[e.userEmail]?.id;
    if (!userId) continue;

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
  console.log("✅ Seeded education records");

  // -----------------------------
  // 3) VERIFICATION
  // -----------------------------
  const verificationData = [
    {
      userEmail: "b6631345@g.sut.ac.th",
      status: VerifyStatus.PENDING,
      reviewedBy: null,
      reviewedAt: null,
      remark: null,
    },
    {
      userEmail: "b6610364@g.sut.ac.th",
      status: VerifyStatus.APPROVED,
      reviewedBy: "admin@sut-eng.ac.th",
      reviewedAt: new Date("2025-11-20T10:30:00Z"),
      remark: "ยืนยันจาก Transcript แล้ว",
    },
    {
      userEmail: "alumni.2018@sut-eng.ac.th",
      status: VerifyStatus.APPROVED,
      reviewedBy: "admin@sut-eng.ac.th",
      reviewedAt: new Date("2025-11-21T14:15:00Z"),
      remark: "ศิษย์เก่าร่วมงานสานสัมพันธ์ 2568",
    },
    {
      userEmail: "alumni.2020@sut-eng.ac.th",
      status: VerifyStatus.REJECTED,
      reviewedBy: "admin@sut-eng.ac.th",
      reviewedAt: new Date("2025-11-22T09:00:00Z"),
      remark: "เลขรหัสนักศึกษาไม่ตรงกับฐานข้อมูล",
    },
    {
      userEmail: "alumni.2015@sut-eng.ac.th",
      status: VerifyStatus.APPROVED,
      reviewedBy: "admin@sut-eng.ac.th",
      reviewedAt: new Date("2025-11-23T16:45:00Z"),
      remark: "ตรวจสอบแล้วผ่านเกณฑ์",
    },
    {
      userEmail: "student.2ndyear@g.sut.ac.th",
      status: VerifyStatus.PENDING,
      reviewedBy: null,
      reviewedAt: null,
      remark: null,
    },
  ];

  for (const v of verificationData) {
    const userId = userMap[v.userEmail]?.id;
    if (!userId) continue;

    await prisma.verification.upsert({
      where: { userId },
      update: {
        status: v.status,
        reviewedBy: v.reviewedBy,
        reviewedAt: v.reviewedAt,
        remark: v.remark,
      },
      create: {
        userId,
        status: v.status,
        reviewedBy: v.reviewedBy,
        reviewedAt: v.reviewedAt,
        remark: v.remark,
      },
    });
  }
  console.log("✅ Seeded verifications");

  // -----------------------------
  // 4) SOUVENIR ITEMS
  // -----------------------------
  const souvenirData = [
    {
      sku: "CAP-ENGI-2025",
      name: "หมวกวิศวกรรมศาสตร์",
      description: "หมวกแก๊ปปักโลโก้คณะวิศวกรรมศาสตร์ มทส.",
      category: "กิจกรรม",
      imageUrl: "/souvenir/EngiCap.png",
      unit: "ชิ้น",
      initialStock: 100,
      active: true,
    },
    {
      sku: "BROOCH-ENGI-2025",
      name: "เข็มกลัดวิศวกรรมศาสตร์",
      description: "เข็มกลัดโลหะปักโลโก้วิศวกรรมศาสตร์ มทส.",
      category: "กิจกรรม",
      imageUrl: "/souvenir/EngiBrooch.png",
      unit: "อัน",
      initialStock: 200,
      active: true,
    },
    {
      sku: "BOTTLE-ENGI-2025",
      name: "กระบอกน้ำวิศวกรรมศาสตร์",
      description: "กระบอกน้ำสแตนเลส พร้อมโลโก้วิศวกรรมศาสตร์ มทส.",
      category: "บริจาค",
      imageUrl: "/souvenir/EngiBottle.png",
      unit: "ใบ",
      initialStock: 150,
      active: true,
    },
    {
      sku: "BAG-NEW-2025",
      name: "กระเป๋าผ้า มทส.",
      description: "กระเป๋าผ้าแคนวาส สกรีนลาย มทส.",
      category: "กิจกรรม",
      imageUrl: "/souvenir/Bag_new.png",
      unit: "ใบ",
      initialStock: 80,
      active: true,
    },
    {
      sku: "BOOK-NEW-2025",
      name: "สมุดบันทึก มทส.",
      description: "สมุดบันทึกปกแข็ง พร้อมโลโก้ มทส.",
      category: "บริจาค",
      imageUrl: "/souvenir/Book_new.png",
      unit: "เล่ม",
      initialStock: 300,
      active: true,
    },
    {
      sku: "UMBRELLA-NEW-2025",
      name: "ร่ม มทส.",
      description: "ร่มพับ 3 ตอน พร้อมโลโก้ มทส.",
      category: "บริจาค",
      imageUrl: "/souvenir/Umbrella_new.png",
      unit: "คัน",
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
  console.log("✅ Seeded souvenir items");

  // -----------------------------
  // 4.1) BookingForm
  // -----------------------------
  const bookingFormsData = [
    {
      Type: EventType.REUNION,
      BatchNumber: 1,
      TotalSeats: 500,
      StartDate: new Date("2025-03-15T09:00:00Z"),
      EndDate: new Date("2025-03-15T17:00:00Z"),
      PriceType: PriceMode.FREE,
      singlePrice: null as number | null,
      batchPrices: undefined as any,
      Souvenir: Option.HAVE,
    },
    {
      Type: EventType.SEMINAR,
      BatchNumber: 1,
      TotalSeats: 200,
      StartDate: new Date("2025-05-10T13:00:00Z"),
      EndDate: new Date("2025-05-10T17:00:00Z"),
      PriceType: PriceMode.SINGLE,
      singlePrice: 199,
      batchPrices: undefined as any,
      Souvenir: Option.NOT,
    },
    {
      Type: EventType.WORKSHOP,
      BatchNumber: 2,
      TotalSeats: 2000,
      StartDate: new Date("2025-06-01T09:00:00Z"),
      EndDate: new Date("2025-06-02T17:00:00Z"),
      PriceType: PriceMode.BY_BATCH,
      singlePrice: null as number | null,
      batchPrices: [
        { startBatch: 1, endBatch: 50, price: 0 },
        { startBatch: 51, endBatch: 200, price: 49 },
        { startBatch: 201, endBatch: 500, price: 99 },
      ],
      Souvenir: Option.HAVE,
    },
  ];

  const bookingFormIds: number[] = [];
  for (const form of bookingFormsData) {
    const existing = await prisma.bookingForm.findFirst({
      where: { Type: form.Type, StartDate: form.StartDate },
    });

    const data: Prisma.BookingFormUncheckedUpdateInput = {
      BatchNumber: form.BatchNumber,
      TotalSeats: form.TotalSeats,
      EndDate: form.EndDate,
      PriceType: form.PriceType,
      singlePrice: form.singlePrice ?? null,
      batchPrices: form.batchPrices ?? Prisma.DbNull,
      Souvenir: form.Souvenir,
    };

    const saved = existing
      ? await prisma.bookingForm.update({
          where: { id: existing.id },
          data,
        })
      : await prisma.bookingForm.create({
          data: {
            ...data,
            Type: form.Type,
            StartDate: form.StartDate,
          } as any,
        });

    bookingFormIds.push(saved.id);
  }

  // -----------------------------
  // 4.2) Content + PictureContent
  // ✅ แก้ Userid: adminId
  // -----------------------------
  const contentData = [
    {
      TitleName: "SUT CHEERLEADERS CLUB",
      Description:
        "ขอแสดงความยินดีกับ ชมรมเชียร์ลีดเดอร์ มทส. SUT CHEERLEADERS CLUB ได้รับราวัลจากการแข่งขันเชียร์ลีดเดอร์ชิงถ้วยพระราชทานฯ ครั้งที่ 21 ประจำปี 2568",
      categories: ContentCategoryType.NEWS,
      Booking: Option.NOT,
      Userid: adminId,
      bookingFormIndex: null as number | null,
    },
    {
      TitleName: "พิธิมอบหมวกนักศึกษาพยาบาล มทส.",
      Description:
        "มทส. จัดพิธีมอบหมวก เข็มสัญลักษณ์ และตะเกียงไนติงเกล ให้กับนักศึกษาพยาบาล รุ่นที่ 16 ประจำปีการศึกษา 2568",
      categories: ContentCategoryType.NEWS,
      Booking: Option.NOT,
      Userid: adminId,
      bookingFormIndex: null as number | null,
    },
    {
      TitleName: "DSA MASCOT CONTENT",
      Description:
        "ขอเชิญชวนนักศึกษา ผู้เรียน และศิษย์เก่า มทส. ทุกท่านร่วมโหวตผลงานผู้เข้าประกวด พร้อมอ่านแนวคิดการออกแบบ ในกิจกรรม“DSA Mascot Contest”",
      categories: ContentCategoryType.NEWS,
      Booking: Option.NOT,
      Userid: adminId,
      bookingFormIndex: null as number | null,
    },
    {
      TitleName: "การแต่งตั้งให้ดำรงตำแหน่งรักษาการแทนอธิการบดี มทส.",
      Description:
        "มหาวิทยาลัยเทคโนโลยีสุรนารี ประกาศแต่งตั้งคณะผู้บริหารรักษาการชุดใหม่ *มีผลตั้งแต่วันที่ 15 พฤศจิกายน 2568 เป็นต้นไป",
      categories: ContentCategoryType.NEWS,
      Booking: Option.NOT,
      Userid: adminId,
      bookingFormIndex: null as number | null,
    },
    {
      TitleName: "IESUT FAMILY 2025",
      Description:
        "จากวันนั้นถึงวันนี้...ความผูกพัน IE มทส ไม่เคยจางหาย #IESUTFamily2025 #ย้อนวัยIEมทส #คืนสู่เหย้าIEสุรนารี #รวมพลชาวเลือดสีน้ำตาล",
      categories: ContentCategoryType.ACTIVITY,
      Booking: Option.HAVE,
      Userid: adminId,
      bookingFormIndex: 2,
    },
    {
      TitleName: "ENGi Research to Marget",
      Description:
        "โครงการ เส้นทางสู่นวัตวณิชย์ วิศวกรรม มทส. หรือ ENGi R2M (Research to Market) ครั้งที่ 1",
      categories: ContentCategoryType.ACTIVITY,
      Booking: Option.HAVE,
      Userid: adminId,
      bookingFormIndex: 0,
    },
    {
      TitleName: "SUT GLOBAL ENTREPRENEURSHIP CAMP 2026",
      Description:
        "Be brave to try. Be proud to grow. Be part of GEC2026 !Got the spirit to try, learn, and make new international friends? This camp is for YOU!",
      categories: ContentCategoryType.NEWS,
      Booking: Option.NOT,
      Userid: adminId,
      bookingFormIndex: null as number | null,
    },
  ];

  for (const c of contentData) {
    const BookingFormID =
      c.bookingFormIndex !== null ? bookingFormIds[c.bookingFormIndex] : null;

    const existing = await prisma.content.findFirst({
      where: {
        TitleName: c.TitleName,
        categories: c.categories,
      },
    });

    const payload = {
      TitleName: c.TitleName,
      Description: c.Description,
      categories: c.categories,
      Booking: c.Booking,
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
    { title: "SUT CHEERLEADERS CLUB", paths: ["/Content/Event13.jpg"] },
    { title: "พิธิมอบหมวกนักศึกษาพยาบาล มทส.", paths: ["/Content/Event14.jpg"] },
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

  // =========================================================
  // ✅ 5) Donation flow
  //    - ใช้ enum ทั้งหมด: OPEN / CONFIRMED / DONATION / SUCCESS
  //    - ไม่ hardcode paymentMethod id
  // =========================================================

  // 5.0 Ensure payment method exists (BANK_TRANSFER)
  let payMethod = await prisma.paymentMethodRecord.findFirst({
    where: { methodName: PaymentMethodType.BANK_TRANSFER },
  });

  if (!payMethod) {
    payMethod = await prisma.paymentMethodRecord.create({
      data: {
        methodName: PaymentMethodType.BANK_TRANSFER,
        isActive: true,
        accountNumber: "123-456-7890",
        provider: "SUT Bank",
      },
    });
  }

  // 5.1 Find souvenir (must exist after seeding souvenirs)
  const souvenir = await prisma.souvenirItem.findFirst({
    where: { sku: "BOTTLE-ENGI-2025" },
  });
  if (!souvenir) throw new Error("SouvenirItem not found (BOTTLE-ENGI-2025)");

  // 5.2 Find/create donation project (title not unique -> findFirst)
  const existingDonationProject = await prisma.donationProject.findFirst({
    where: { title: "โครงการทุนการศึกษา ENGI" },
  });

  const donationProject = existingDonationProject
    ? await prisma.donationProject.update({
        where: { id: existingDonationProject.id },
        data: {
          description: "ทุนการศึกษาสำหรับนิสิตวิศวกรรมศาสตร์",
          goalAmount: 10000,
          currentAmount: 0,
          startDate: new Date("2025-12-01T00:00:00Z"),
          endDate: new Date("2026-01-31T23:59:59Z"),
          ownerName: "คณะวิศวกรรมศาสตร์",
          contact: "044223344",
          status: ProjectStatus.OPEN,
          souvenirItemId: souvenir.id,
        },
      })
    : await prisma.donationProject.create({
        data: {
          title: "โครงการทุนการศึกษา ENGI",
          description: "ทุนการศึกษาสำหรับนิสิตวิศวกรรมศาสตร์",
          goalAmount: 10000,
          currentAmount: 0,
          startDate: new Date("2025-12-01T00:00:00Z"),
          endDate: new Date("2026-01-31T23:59:59Z"),
          ownerName: "คณะวิศวกรรมศาสตร์",
          contact: "044223344",
          status: ProjectStatus.OPEN,
          posterUrl: null,
          souvenirItemId: souvenir.id,
        },
      });

  // 5.3 test user
  const testUser = await prisma.user.findFirst({
    where: { email: "b6631345@g.sut.ac.th" },
  });
  if (!testUser) throw new Error("Test user not found (b6631345@g.sut.ac.th)");

  // ป้องกัน seed ซ้ำแล้วเพิ่มยอดซ้ำ: เราจะสร้าง flow แค่ถ้ายังไม่มี transaction ที่ผูก project+user+amount นี้
  const existedTx = await prisma.donationTransaction.findFirst({
    where: {
      projectId: donationProject.id,
      userId: testUser.id,
      amount: 500,
      status: TransactionStatus.SUCCESS,
    },
  });

  if (!existedTx) {
    // 5.4 create donationTransaction
    const donationTransaction = await prisma.donationTransaction.create({
      data: {
        projectId: donationProject.id,
        amount: 500,
        status: TransactionStatus.SUCCESS,
        isPublic: true,
        userId: testUser.id,
      },
    });

    // 5.5 create paymentRecord and link to donationTransaction
    await prisma.paymentRecord.create({
      data: {
        amount: 500,
        paymentStatus: PaymentStatusType.CONFIRMED,
        paymentSlipUrl: "/uploads/slip-test.jpg",
        paymentMethodId: payMethod.id,
        donationTransactionId: donationTransaction.id,
      },
    });

    // 5.6 increment project currentAmount
    await prisma.donationProject.update({
      where: { id: donationProject.id },
      data: { currentAmount: { increment: 500 } },
    });

    // 5.7 create Donation (subsystem reference)
    const donation = await prisma.donation.create({
      data: {
        userId: testUser.id,
        amount: 500,
        purpose: "seed test",
        status: "completed",
        souvenirItemId: souvenir.id,
      },
    });

    // 5.8 create Entitlement (add redeemToken)
    const { randomUUID } = await import('crypto');
    await prisma.entitlement.create({
      data: {
        userId: testUser.id,
        itemId: souvenir.id,
        source: EntitlementSource.DONATION,
        donationId: donation.id,
        qtyGranted: 1,
        qtyUsed: 0,
        redeemToken: randomUUID(),
      },
    });

    console.log("✅ Seeded donation project + tx + payment + donation + entitlement (ครบ flow)");
  } else {
    console.log("ℹ️ Donation flow already exists, skipping to avoid duplicate increments");
  }

  console.log("\n🎉 All seed data inserted successfully.");
  console.log("\n📋 Login credentials (password: sut12345):");
  console.log("   • admin@sut-eng.ac.th");
  console.log("   • b6631345@g.sut.ac.th");
  console.log("   • b6610364@g.sut.ac.th");
  console.log("   • alumni.2018@sut-eng.ac.th");
  console.log("   • alumni.2020@sut-eng.ac.th");
  console.log("   • alumni.2015@sut-eng.ac.th");
  console.log("   • student.2ndyear@g.sut.ac.th");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
