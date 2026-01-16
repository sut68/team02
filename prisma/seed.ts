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
  DonationProjectType,
  ShipStatus,
  RedeemMethod,
  RoundStatus,
  ProjectProposalStatus,
  SummarySubmissionStatus,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed (Final Version: Bag=Activity, Umbrella=Donation)...");

  const defaultPassword = "SUT@Seed2025!"; // Stronger password for production
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
  //  JOB TYPE
  // -----------------------------
  const jobTypes: Array<'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP'> =
    ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'];
  for (const typename of jobTypes) {
    await prisma.jobType.upsert({
      where: { typename },
      update: {},
      create: { typename },
    });
  }
  console.log('✅ Seeded job types');

  // -----------------------------
  //  CATEGORY (Forum Categories)
  // -----------------------------
  const categoryData = [
    { categoryname: 'ทั่วไป' },
    { categoryname: 'การศึกษา' },
    { categoryname: 'เทคโนโลยี' },
    { categoryname: 'ข่าวสาร' },
    { categoryname: 'กีฬา' },
  ];

  for (const cat of categoryData) {
    const existing = await prisma.category.findFirst({
      where: { categoryname: cat.categoryname },
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          categoryname: cat.categoryname,
        },
      });
    }
  }
  console.log('✅ Seeded forum categories');
  // -----------------------------
  // 4) SOUVENIR ITEMS (จัดหมวดใหม่)
  // -----------------------------
  const souvenirData = [
    // === หมวด ACTIVITY (กิจกรรม): หมวก, เข็มกลัด, กระเป๋าผ้า ===
    {
      sku: "CAP-ENGI-2025",
      name: "หมวกวิศวกรรมศาสตร์",
      description: "หมวกแก๊ปปักโลโก้คณะวิศวกรรมศาสตร์ มทส.",
      category: "ACTIVITY",
      imageUrl: "/souvenir/EngiCap.png",
      unit: "ชิ้น",
      initialStock: 100,
      active: true,
    },
    {
      sku: "BROOCH-ENGI-2025",
      name: "เข็มกลัดวิศวกรรมศาสตร์",
      description: "เข็มกลัดโลหะปักโลโก้วิศวกรรมศาสตร์ มทส.",
      category: "ACTIVITY",
      imageUrl: "/souvenir/EngiBrooch.png",
      unit: "อัน",
      initialStock: 200,
      active: true,
    },
    {
      sku: "BAG-NEW-2025",
      name: "กระเป๋าผ้า มทส.",
      description: "กระเป๋าผ้าแคนวาส สกรีนลาย มทส.",
      category: "ACTIVITY", // ย้ายมาอยู่ ACTIVITY
      imageUrl: "/souvenir/Bag_new.png",
      unit: "ใบ",
      initialStock: 80,
      active: true,
    },

    // === หมวด DONATION (บริจาค): กระบอกน้ำ, สมุด, ร่ม ===
    {
      sku: "BOTTLE-ENGI-2025",
      name: "กระบอกน้ำวิศวกรรมศาสตร์",
      description: "กระบอกน้ำสแตนเลส พร้อมโลโก้วิศวกรรมศาสตร์ มทส.",
      category: "DONATION",
      imageUrl: "/souvenir/EngiBottle.png",
      unit: "ใบ",
      initialStock: 150,
      active: true,
    },
    {
      sku: "BOOK-NEW-2025",
      name: "สมุดบันทึก มทส.",
      description: "สมุดบันทึกปกแข็ง พร้อมโลโก้ มทส.",
      category: "DONATION",
      imageUrl: "/souvenir/Book_new.png",
      unit: "เล่ม",
      initialStock: 300,
      active: true,
    },
    {
      sku: "UMBRELLA-NEW-2025",
      name: "ร่ม มทส.",
      description: "ร่มพับ 3 ตอน พร้อมโลโก้ มทส.",
      category: "DONATION", // ร่ม อยู่ DONATION
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
  console.log("✅ Seeded souvenir items (Re-categorized: Bag->Activity)");

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
      batchPrices: Prisma.DbNull,
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
      batchPrices: Prisma.DbNull,
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

  type BookingFormKey = `${EventType}|${string}`;
  const bookingFormMap = new Map<BookingFormKey, number>();
  
  for (const form of bookingFormsData) {
    const saved = await prisma.bookingForm.upsert({
      where: { Type_StartDate: { Type: form.Type!, StartDate: form.StartDate! } },
      update: {
        BatchNumber: form.BatchNumber,
        TotalSeats: form.TotalSeats,
        EndDate: form.EndDate,
        PriceType: form.PriceType,
        singlePrice: form.singlePrice ?? null,
        batchPrices: form.batchPrices ?? Prisma.DbNull,
        Souvenir: form.Souvenir,
      },
      create: {
        Type: form.Type,
        StartDate: form.StartDate,
        BatchNumber: form.BatchNumber,
        TotalSeats: form.TotalSeats,
        EndDate: form.EndDate,
        PriceType: form.PriceType,
        singlePrice: form.singlePrice ?? null,
        batchPrices: form.batchPrices ?? Prisma.DbNull,
        Souvenir: form.Souvenir,
      } as any,
    });
    bookingFormMap.set(`${form.Type}|${form.StartDate!.toISOString()}`, saved.id);
  }

  // -----------------------------
  // 4.2) Content + PictureContent (ลิงก์ SKU)
  // -----------------------------
  const contentData: Array<{
    TitleName: string;
    Description: string;
    categories: ContentCategoryType;
    Booking: Option;
    Userid: number;
    bookingFormKey: BookingFormKey | null;
    souvenirSku: string | null;
  }> = [
    {
      TitleName: "SUT CHEERLEADERS CLUB",
      Description:
        "ขอแสดงความยินดีกับ ชมรมเชียร์ลีดเดอร์ มทส. SUT CHEERLEADERS CLUB ได้รับราวัลจากการแข่งขันเชียร์ลีดเดอร์ชิงถ้วยพระราชทานฯ ครั้งที่ 21 ประจำปี 2568",
      categories: ContentCategoryType.NEWS,
      Booking: Option.NOT,
      Userid: adminId,
      bookingFormKey: null,
      souvenirSku: null,
    },
    {
      TitleName: "พิธิมอบหมวกนักศึกษาพยาบาล มทส.",
      Description:
        "มทส. จัดพิธีมอบหมวก เข็มสัญลักษณ์ และตะเกียงไนติงเกล ให้กับนักศึกษาพยาบาล รุ่นที่ 16 ประจำปีการศึกษา 2568",
      categories: ContentCategoryType.NEWS,
      Booking: Option.NOT,
      Userid: adminId,
      bookingFormKey: null,
      souvenirSku: null,
    },
    {
      TitleName: "DSA MASCOT CONTENT",
      Description:
        "ขอเชิญชวนนักศึกษา ผู้เรียน และศิษย์เก่า มทส. ทุกท่านร่วมโหวตผลงานผู้เข้าประกวด พร้อมอ่านแนวคิดการออกแบบ ในกิจกรรม“DSA Mascot Contest”",
      categories: ContentCategoryType.NEWS,
      Booking: Option.NOT,
      Userid: adminId,
      bookingFormKey: null,
      souvenirSku: null,
    },
    {
      TitleName: "การแต่งตั้งให้ดำรงตำแหน่งรักษาการแทนอธิการบดี มทส.",
      Description:
        "มหาวิทยาลัยเทคโนโลยีสุรนารี ประกาศแต่งตั้งคณะผู้บริหารรักษาการชุดใหม่ *มีผลตั้งแต่วันที่ 15 พฤศจิกายน 2568 เป็นต้นไป",
      categories: ContentCategoryType.NEWS,
      Booking: Option.NOT,
      Userid: adminId,
      bookingFormKey: null,
      souvenirSku: null,
    },
    {
      TitleName: "IESUT FAMILY 2025",
      Description:
        "จากวันนั้นถึงวันนี้...ความผูกพัน IE มทส ไม่เคยจางหาย #IESUTFamily2025 #ย้อนวัยIEมทส #คืนสู่เหย้าIEสุรนารี #รวมพลชาวเลือดสีน้ำตาล",
      categories: ContentCategoryType.ACTIVITY,
      Booking: Option.HAVE,
      Userid: adminId,
      bookingFormKey: `${EventType.WORKSHOP}|2025-06-01T09:00:00.000Z` as BookingFormKey,
      souvenirSku: "CAP-ENGI-2025", // ผูกกับหมวก
    },
    {
      TitleName: "ENGi Research to Marget",
      Description:
        "โครงการ เส้นทางสู่นวัตวณิชย์ วิศวกรรม มทส. หรือ ENGi R2M (Research to Market) ครั้งที่ 1",
      categories: ContentCategoryType.ACTIVITY,
      Booking: Option.HAVE,
      Userid: adminId,
      bookingFormKey: `${EventType.REUNION}|2025-03-15T09:00:00.000Z` as BookingFormKey,
      souvenirSku: "BROOCH-ENGI-2025", // ผูกกับเข็มกลัด
    },
    {
      TitleName: "SUT GLOBAL ENTREPRENEURSHIP CAMP 2026",
      Description:
        "Be brave to try. Be proud to grow. Be part of GEC2026 !Got the spirit to try, learn, and make new international friends? This camp is for YOU!",
      categories: ContentCategoryType.NEWS,
      Booking: Option.NOT,
      Userid: adminId,
      bookingFormKey: null,
      souvenirSku: null,
    },
  ];

  for (const c of contentData) {
    const BookingFormID = c.bookingFormKey
      ? bookingFormMap.get(c.bookingFormKey as BookingFormKey) ?? null
      : null;

    let souvenirId = null;
    if (c.souvenirSku) {
        const item = await prisma.souvenirItem.findUnique({ where: { sku: c.souvenirSku }});
        if (item) souvenirId = item.id;
    }

    await prisma.content.upsert({
      where: { TitleName_categories: { TitleName: c.TitleName, categories: c.categories } },
      update: {
        Description: c.Description,
        Booking: c.Booking,
        Userid: c.Userid,
        BookingFormID,
        souvenirItemId: souvenirId,
      },
      create: {
        TitleName: c.TitleName,
        Description: c.Description,
        categories: c.categories,
        Booking: c.Booking,
        Userid: c.Userid,
        BookingFormID,
        souvenirItemId: souvenirId,
      },
    });
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
      await prisma.pictureContent.upsert({
        where: { Path_ContentID: { Path: path, ContentID: content.id } },
        update: {},
        create: { Path: path, ContentID: content.id },
      });
    }
  }

  console.log("✅ Seeded BookingForm + Content + PictureContent");

  // =========================================================
  // 5) Donation flow
  // =========================================================

  // 5.0 Create Payment Methods
  const paymentMethodsList = [
    {
      methodName: PaymentMethodType.PROMPTPAY,
      accountNumber: "0957013361",
      provider: "PromptPay",
      isActive: true,
    },
    {
      methodName: PaymentMethodType.CASH,
      accountNumber: null,
      provider: "จุดรับบริจาค / ห้องสโมสรนักศึกษา",
      isActive: true,
    },
    {
      methodName: PaymentMethodType.BANKTRANSFER, 
      accountNumber: "0943976007",
      provider: "SUT K-Bank",
      isActive: true,
    }
  ];

  let payMethodForTest: any = null;

  for (const pm of paymentMethodsList) {
    const existing = await prisma.paymentMethodRecord.findFirst({
      where: { methodName: pm.methodName }
    });

    let record;

    if (existing) {
      record = await prisma.paymentMethodRecord.update({
        where: { id: existing.id },
        data: {
          accountNumber: pm.accountNumber,
          provider: pm.provider,
          isActive: pm.isActive,
        },
      });
    } else {
      record = await prisma.paymentMethodRecord.create({
        data: {
          methodName: pm.methodName,
          accountNumber: pm.accountNumber,
          provider: pm.provider,
          isActive: pm.isActive,
        },
      });
    }
    
    // เก็บตัวแปรไว้ใช้เทส Transaction
    if (pm.methodName === PaymentMethodType.BANKTRANSFER) {
      payMethodForTest = record;
    }
  }

  if (!payMethodForTest) throw new Error("Seed Error: BANK_TRANSFER method missing");
  const payMethod = payMethodForTest; 

  console.log("✅ Seeded all payment methods");

  // 5.2 Find/create donation projects (แก้ Link: Bag -> Umbrella)
  const donationProjectsData = [
    {
      title: "กองทุนกลางสมาคมศิษย์เก่าวิศวกรรมศาสตร์",
      description: "กองทุนหลักเพื่อบริหารจัดการและสนับสนุนกิจกรรมต่างๆ ของคณะ",
      goalAmount: 1000000, 
      startDate: new Date("2025-01-01T00:00:00Z"),
      endDate: new Date("2026-12-31T23:59:59Z"),
      projectType: DonationProjectType.CENTRAL,
      ownerName: "สมาคมศิษย์เก่า",
      contact: "044-223-344",
      posterUrl: "/uploads/posters/1766588375462-3ac8382dfe3a.png",
      skuToLink: "BOTTLE-ENGI-2025" 
    },
    {
      title: "โครงการทุนการศึกษา ENGI 2026",
      description: "ทุนการศึกษาสำหรับนิสิตวิศวกรรมศาสตร์ที่ขาดแคลนทุนทรัพย์",
      goalAmount: 500000,
      startDate: new Date("2026-01-01T00:00:00Z"),
      endDate: new Date("2026-12-31T23:59:59Z"),
      projectType: DonationProjectType.SCHOLARSHIP,
      ownerName: "ฝ่ายกิจการนักศึกษา",
      contact: "044-223-355",
      posterUrl: "/uploads/posters/1767388329049-43cc8d9dee24.png",
      skuToLink: "BOOK-NEW-2025"
    },
    {
      title: "CPE Flood Relief 2026",
      description: "ระดมทุนช่วยเหลือพี่น้องชาว CPE ที่ประสบภัยน้ำท่วมเร่งด่วน",
      goalAmount: 200000,
      startDate: new Date("2026-01-01T00:00:00Z"),
      endDate: new Date("2026-09-30T23:59:59Z"),
      projectType: DonationProjectType.EMERGENCY,
      ownerName: "สโมสรนักศึกษา",
      contact: "089-999-9999",
      posterUrl: "/uploads/posters/1768239338817-07fd64bd724d.jpg",
      skuToLink: "UMBRELLA-NEW-2025" // ✅ เปลี่ยนจาก BAG เป็น UMBRELLA (Donation Item)
    },
    {
      title: "ทุนวิจัย AI เพื่อการเกษตร Smart Farm",
      description: "สนับสนุนอุปกรณ์ IoT และ Server สำหรับงานวิจัย Smart Farm",
      goalAmount: 800000,
      startDate: new Date("2026-01-01T00:00:00Z"),
      endDate: new Date("2027-02-28T23:59:59Z"),
      projectType: DonationProjectType.RESEARCH,
      ownerName: "ศูนย์วิจัย AI Center",
      contact: "044-223-366",
      posterUrl: "/uploads/posters/aismartframseed.jpg",
      skuToLink: "BOOK-NEW-2025"
    },
    {
      title: "โครงการบริจาคโลหิต ต่อชีวิตเพื่อนมนุษย์", // จากรูป World Blood Donor Day (14 June)
      description: "ร่วมบริจาคโลหิตเพื่อสำรองคลังเลือดให้กับโรงพยาบาลในเครือข่าย และช่วยเหลือผู้ป่วยวิกฤต",
      goalAmount: 500000, 
      startDate: new Date("2025-06-01T00:00:00Z"),
      endDate: new Date("2026-06-30T23:59:59Z"),
      projectType: DonationProjectType.CENTRAL,
      ownerName: "สภากาชาดไทย ร่วมกับ สมาคมศิษย์เก่า",
      contact: "044-223-344",
      posterUrl: "/uploads/posters/blood.png", // รูปหลอดเก็บเลือดและหัวใจ
      skuToLink: "BOTTLE-ENGI-2025" 
    },
    {
      title: "โครงการวันการกุศลสากล (International Day of Charity)", // จากรูป 5th September
      description: "ร่วมแบ่งปันความสุขผ่านการบริจาคทุนการศึกษาและทุนสนับสนุนกิจกรรมสาธารณประโยชน์",
      goalAmount: 300000,
      startDate: new Date("2025-08-20T00:00:00Z"),
      endDate: new Date("2026-09-15T23:59:59Z"),
      projectType: DonationProjectType.SCHOLARSHIP,
      ownerName: "สมาคมศิษย์เก่าวิศวกรรมศาสตร์",
      contact: "044-223-355",
      posterUrl: "/uploads/posters/Brown Illustration International Day Of Charity Poster.png", // รูปคนถือกล่อง Donation สองคน
      skuToLink: "BOOK-NEW-2025"
    },
    {
      title: "บรรเทาทุกข์จากอุทกภัย (CPE & SUT Flood Relief)", // จากรูปกล่องบรรเทาทุกข์สีส้ม
      description: "เปิดรับบริจาคเงินและสิ่งของเครื่องใช้ต่างๆ เพื่อช่วยเหลือผู้ประสบภัยน้ำท่วมในพื้นที่จังหวัดนครราชสีมาและใกล้เคียง",
      goalAmount: 250000,
      startDate: new Date("2025-10-01T00:00:00Z"),
      endDate: new Date("2026-11-30T23:59:59Z"),
      projectType: DonationProjectType.EMERGENCY,
      ownerName: "มูลนิธิสุวรรณนคร ร่วมกับสมาคมศิษย์เก่า",
      contact: "012-345-6789",
      posterUrl: "/uploads/posters/banthotuck.png", // รูปกล่องบรรจุขวดน้ำและอาหารกระป๋อง
      skuToLink: "UMBRELLA-NEW-2025" 
    },
    {
      title: "ร่วมปั่นน้ำใจช่วยเหลือผู้ยากไร้และขาดแคลน", // จากรูปโลโก้ Alumni SUT ที่มีรูปมือจับกัน
      description: "โครงการระดมทุนเพื่อจัดซื้ออุปกรณ์การแพทย์และสิ่งของจำเป็นให้กับผู้ยากไร้ในชุมชนรอบมหาวิทยาลัย",
      goalAmount: 400000,
      startDate: new Date("2025-01-01T00:00:00Z"),
      endDate: new Date("2026-12-31T23:59:59Z"),
      projectType: DonationProjectType.RESEARCH, // หรือเปลี่ยนเป็นประเภทอื่นที่เหมาะสม
      ownerName: "Alumni SUT",
      contact: "094-397-6007",
      posterUrl: "/uploads/posters/alumni-sut.png",
      skuToLink: "BOOK-NEW-2025"
    }
  ];

  for (const p of donationProjectsData) {
    let souvenirId = null;
    if (p.projectType !== DonationProjectType.CENTRAL && p.skuToLink) {
      const s = await prisma.souvenirItem.findUnique({ where: { sku: p.skuToLink } });
      if (s) souvenirId = s.id;
    }

    const existing = await prisma.donationProject.findFirst({
      where: { title: p.title }
    });

    if (existing) {
      console.log(`   ↻ Updating: ${p.title}`);
      await prisma.donationProject.update({
        where: { id: existing.id },
        data: {
          description: p.description,
          goalAmount: p.goalAmount,
          startDate: p.startDate,
          endDate: p.endDate,
          projectType: p.projectType,
          ownerName: p.ownerName,
          contact: p.contact,
          posterUrl: p.posterUrl,
          souvenirItemId: p.projectType === DonationProjectType.CENTRAL ? null : souvenirId,
          status: ProjectStatus.OPEN
        }
      });
    } else {
      console.log(`   + Creating: ${p.title}`);
      await prisma.donationProject.create({
        data: {
          title: p.title,
          description: p.description,
          goalAmount: p.goalAmount,
          currentAmount: 0,
          startDate: p.startDate,
          endDate: p.endDate,
          projectType: p.projectType,
          ownerName: p.ownerName,
          contact: p.contact,
          posterUrl: p.posterUrl,
          souvenirItemId: p.projectType === DonationProjectType.CENTRAL ? null : souvenirId,
          status: ProjectStatus.OPEN
        }
      });
    }
  }

  // ---------------------------------------------------------
  // 5.3 Prepare Test User & Project for Transaction
  // ---------------------------------------------------------
  
  const testUser = await prisma.user.findFirst({
    where: { email: "b6631345@g.sut.ac.th" },
  });
  if (!testUser) throw new Error("Test user not found");

  const targetProject = await prisma.donationProject.findFirst({
    where: { projectType: DonationProjectType.CENTRAL } 
  });
  
  if (!targetProject) {
    console.log("⚠️ Skipping transaction seed: Central Project not found.");
  } else {
    // 5.4 Check duplicate transaction
    const existedTx = await prisma.donationTransaction.findFirst({
      where: {
        projectId: targetProject.id,
        userId: testUser.id,
        amount: 500,
        status: TransactionStatus.SUCCESS,
      },
    });

    if (!existedTx) {
      // 5.5 Create Transaction
      const donationTransaction = await prisma.donationTransaction.create({
        data: {
          projectId: targetProject.id,
          amount: 500,
          status: TransactionStatus.SUCCESS,
          isPublic: true,
          userId: testUser.id,
          fullName: testUser.fullName,
          email: testUser.email,
          phone: testUser.phone || "",
          address: testUser.address || "",
          subdistrict: testUser.subdistrict || "",
          district: testUser.district || "",
          province: testUser.province || "",
          postalCode: testUser.postalCode || "",
        },
      });

      // 5.6 Create Payment Record
      await prisma.paymentRecord.create({
        data: {
          amount: 500,
          paymentStatus: PaymentStatusType.CONFIRMED,
          paymentSlipUrl: "/uploads/slip-test.jpg",
          paymentMethodId: payMethod.id,
          donationTransactionId: donationTransaction.id,
        },
      });

      // 5.7 Increment Project Amount
      await prisma.donationProject.update({
        where: { id: targetProject.id }, 
        data: { currentAmount: { increment: 500 } },
      });

      // 5.8 create Donation (Legacy Subsystem)
      const donation = await prisma.donation.create({
        data: {
          userId: testUser.id,
          amount: 500,
          purpose: "seed test",
          status: "completed",
          souvenirItemId: targetProject.souvenirItemId, 
        },
      });

      // 5.9 create Entitlement
      if (targetProject.souvenirItemId) {
        const existedEnt = await prisma.entitlement.findFirst({
          where: {
            userId: testUser.id,
            itemId: targetProject.souvenirItemId,
            donationId: donation.id,
            source: EntitlementSource.DONATION,
          },
        });
        
        if (!existedEnt) {
          await prisma.entitlement.create({
            data: {
              userId: testUser.id,
              itemId: targetProject.souvenirItemId,
              source: EntitlementSource.DONATION,
              donationId: donation.id,
              qtyGranted: 1,
              qtyUsed: 0,
              redeemToken: randomUUID(),
            },
          });
        }
      }

      console.log("✅ Seeded transaction for Central Fund");
    }
  }

  // =========================================================
  // 6) SEED PARTICIPANTS & DONORS (TEST DATA)
  // =========================================================
  console.log("🚀 Seeding Participants & Donors for Dashboard...");

  const pm = await prisma.paymentMethodRecord.findFirst();

  // 6.1 Get all activities and seed participants for each (with varying numbers)
  const allActivities = await prisma.content.findMany({
    where: { categories: ContentCategoryType.ACTIVITY }
  });

  const allParticipantEmails = [
    "b6631345@g.sut.ac.th",
    "b6610364@g.sut.ac.th", 
    "student.2ndyear@g.sut.ac.th",
    "alumni.2018@sut-eng.ac.th",
    "alumni.2020@sut-eng.ac.th"
  ];

  // Vary participant count per activity: 2, 4, 3, 5
  const participantCounts = [2, 4, 3, 5];

  for (const [actIndex, activity] of allActivities.entries()) {
    if (!activity.souvenirItemId) continue;

    console.log(`\n📌 Seeding participants for: ${activity.TitleName}`);

    // Get count for this activity (cycle through the counts)
    const count = participantCounts[actIndex % participantCounts.length];
    const selectedEmails = allParticipantEmails.slice(0, count);

    for (const [index, email] of selectedEmails.entries()) {
      const uid = userMap[email]?.id;
      if (!uid) continue;

      // Check if already booked to avoid duplicates
      const existingBooking = await prisma.booking.findFirst({
        where: { Userid: uid, ContentID: activity.id }
      });

      if (!existingBooking) {
        // Create Booking
        const booking = await prisma.booking.create({
          data: {
            Userid: uid,
            ContentID: activity.id,
            transactionStatus: TransactionStatus.SUCCESS,
            payment: {
              create: {
                amount: 500,
                paymentStatus: PaymentStatusType.CONFIRMED,
                paymentSlipUrl: "/uploads/slip-test.jpg",
                paymentMethodId: pm?.id
              }
            }
          }
        });

        // Create BookingField
        const bookingField = await prisma.bookingField.create({
          data: {
            BookingSeats: 1,
            Name: `Participant ${index + 1}`,
            TotalPrice: 500,
            Souvenir: "HAVE"
          }
        });

        // Link BookingField to Booking
        await prisma.booking.update({
          where: { id: booking.id },
          data: { BookingFieldID: bookingField.id }
        });

        // Create Entitlement
        const ent = await prisma.entitlement.create({
          data: {
            userId: uid,
            itemId: activity.souvenirItemId,
            source: EntitlementSource.BOOKING,
            qtyGranted: 1,
            qtyUsed: index === 0 ? 1 : 0, // First participant redeems
            redeemToken: randomUUID()
          }
        });

        // Create Redemption for first participant only
        if (index === 0) {
          await prisma.redemption.create({
            data: {
              entitlementId: ent.id,
              itemId: activity.souvenirItemId,
              userId: uid,
              method: RedeemMethod.QR_SCAN,
              handledBy: adminId,
              redeemedAt: new Date()
            }
          });
        }
      }
    }
  }

  console.log(`✅ Seeded ${allActivities.length} activities with participants`);

  // 6.2 Get all donation projects and seed donors for each (with varying numbers)
  const allProjects = await prisma.donationProject.findMany();

  const allDonorEmails = [
    "alumni.2018@sut-eng.ac.th",
    "alumni.2020@sut-eng.ac.th",
    "alumni.2015@sut-eng.ac.th",
    "b6631345@g.sut.ac.th",
    "b6610364@g.sut.ac.th"
  ];

  // Vary donor count per project: 3, 2, 5, 4
  const donorCounts = [3, 2, 5, 4];

  for (const [projIndex, project] of allProjects.entries()) {
    if (!project.souvenirItemId) continue;

    console.log(`\n💝 Seeding donors for: ${project.title}`);

    // Get count for this project (cycle through the counts)
    const count = donorCounts[projIndex % donorCounts.length];
    const selectedEmails = allDonorEmails.slice(0, count);

    for (const email of selectedEmails) {
      const userObj = userMap[email];
      if (!userObj) continue;
      const uid = userObj.id;
      const amt = 1000;

      // Fetch user from DB
      const user = await prisma.user.findUnique({ where: { id: uid } });
      if (!user) continue;

      // Avoid duplicates in seed re-runs
      const existingDonation = await prisma.donationTransaction.findFirst({
        where: { projectId: project.id, userId: uid }
      });

      if (!existingDonation) {
        // 1. Create Transaction
        const tx = await prisma.donationTransaction.create({
          data: {
            projectId: project.id,
            userId: uid,
            amount: amt,
            status: TransactionStatus.SUCCESS,
            isPublic: true,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone || "",
            address: user.address || "",
            subdistrict: user.subdistrict || "",
            district: user.district || "",
            province: user.province || "",
            postalCode: user.postalCode || ""
          }
        });

        // 2. Create Payment
        await prisma.paymentRecord.create({
          data: {
            amount: amt,
            paymentStatus: PaymentStatusType.CONFIRMED,
            paymentSlipUrl: "/uploads/slip-test.jpg",
            paymentMethodId: pm?.id,
            donationTransactionId: tx.id
          }
        });

        // 3. Update Project Amount
        await prisma.donationProject.update({
          where: { id: project.id },
          data: { currentAmount: { increment: amt } }
        });

        // 4. Create Donation (legacy)
        const donation = await prisma.donation.create({
          data: {
            userId: uid,
            amount: amt,
            status: "completed",
            souvenirItemId: project.souvenirItemId
          }
        });

        // 5. Create Entitlement & Shipment
        await prisma.entitlement.create({
          data: {
            userId: uid,
            itemId: project.souvenirItemId,
            source: EntitlementSource.DONATION,
            donationId: donation.id,
            qtyGranted: 1,
            qtyUsed: 0,
            redeemToken: randomUUID()
          }
        });

        await prisma.shipment.create({
          data: {
            donationId: donation.id,
            userId: uid,
            itemId: project.souvenirItemId,
            receiverName: user.fullName,
            addressLine: user.address || "",
            subdistrict: user.subdistrict || "",
            district: user.district || "",
            province: user.province || "",
            postalCode: user.postalCode || "",
            phone: user.phone || "",
            status: ShipStatus.PENDING,
            trackingNo: null,
            deliveredAt: null
          }
        });
      }
    }
  }

  console.log(`✅ Seeded ${allProjects.length} donation projects with donors`);

  // 6.3 Mark some shipments as delivered (test data for delivered status)
  console.log("\n📦 Marking some shipments as DELIVERED...");
  
  const allShipments = await prisma.shipment.findMany({
    where: { status: ShipStatus.PENDING },
    take: 3 // Mark only 3 as delivered, leave rest as PENDING for testing
  });

  for (const [index, shipment] of allShipments.entries()) {
    const trackingNum = `TRK${Date.now()}-${index}`;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() - (3 - index)); // Stagger delivery dates

    await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        status: ShipStatus.DELIVERED,
        trackingNo: trackingNum,
        deliveredAt: deliveryDate
      }
    });
  }

  console.log(`✅ Marked ${allShipments.length} shipments as DELIVERED (others remain PENDING for testing)`);

  // =========================================================
  // 7) BUDGET SYSTEM (Year 2569) - FORMAL FISCAL YEAR SEEDING
  // =========================================================
  console.log("\n💰 Seeding Budget System (2569) - Using Existing Data...");

// -----------------------------
  // 7) BUDGET SYSTEM (Year 2569) - FORMAL FISCAL YEAR SEEDING
  // -----------------------------
  console.log("\n💰 Seeding Budget System (2569) - Using Existing Data...");

  // 7.1 Reuse Existing Data (Users & Central Project)
  // MOVED UP: ดึงข้อมูล User พร้อม Profile เตรียมไว้ตรงนี้เลย (ก่อนเข้า Loop)
  const allEligibleUsers = await prisma.user.findMany({
    where: { 
      role: { not: Role.ADMIN }, 
    },
    select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        address: true,
        subdistrict: true,
        district: true,
        province: true,
        postalCode: true
    }
  });

  // ประกาศตัวแปรนี้ตรงนี้ เพื่อให้ถูกเรียกใช้ได้ทั่วทั้ง Section 7
  const totalVoters = allEligibleUsers.length;
  console.log(`      > 👥 Found Existing Voters: ${totalVoters} users.`);

  if (totalVoters === 0) {
    console.warn("      ⚠️ Warning: No eligible voters found from previous sections.");
  }

  // 2. ดึงกองทุนกลางที่มีอยู่แล้ว (Reuse จาก Section 5)
  const centralProject = await prisma.donationProject.findFirst({
    where: { projectType: DonationProjectType.CENTRAL }
  });
  // ... (โค้ดส่วน ProjectManager และ budgetConfig ด้านล่างปล่อยไว้เหมือนเดิม)
  // 3. Project Manager (ส่วนนี้ของใหม่ จำเป็นต้องสร้างสำหรับ Budget System)
  const projectManager = await prisma.projectManager.upsert({
    where: { id: 1 }, 
    update: {},
    create: { 
      firstName: "Somchai", 
      lastName: "Manager", 
      position: "Head of Strategic Planning",
      email: "planning@sut.ac.th", 
      department: "Division of Planning and Budget" 
    }
  });

  // Mock Images สำหรับ Budget
  const mockImages = ["/budget/upload/04.jpg", "/budget/upload/05.jpg", "/budget/upload/03.jpg"];

  // 7.2 Budget Rounds & Proposals Configuration
  const budgetConfig = [
    { 
      year: "2569", 
      rounds: [
        "รอบการพิจารณาที่ 1 ประจำปีงบประมาณ 2569", // รอบต้นปี
        "รอบการพิจารณาที่ 2 ประจำปีงบประมาณ 2569"  // รอบระหว่างปี
      ] 
    }
  ];

  for (const config of budgetConfig) {
    const { year, rounds } = config;
    const christianYear = parseInt(year) - 543; // 2026

    for (const [roundIdx, roundName] of rounds.entries()) {
      
      // --- A. BUDGET CALCULATION ---
      const donationPerHead = 2000; 
      const totalFundReal = donationPerHead * (totalVoters || 1); // ป้องกันคูณ 0 กรณีไม่มี User
      
      // กำหนดช่วงเวลา (Fiscal Year Logic)
      let startYear, startMonth;
      if (roundIdx === 0) {
        startMonth = 10; // Oct Previous Year
        startYear = christianYear - 1; 
      } else {
        startMonth = 1; // Jan Current Year
        startYear = christianYear; 
      }

      const startDate = new Date(`${startYear}-${String(startMonth).padStart(2, '0')}-01`);
      const endDate = new Date(new Date(startDate).setDate(startDate.getDate() + 45));
      
      // สถานะ: รอบ 1 = CLOSED, รอบ 2 = OPEN
      const status = (roundIdx === 1) ? RoundStatus.OPEN : RoundStatus.CLOSED; 

      // --- B. CREATE/UPDATE BUDGET ROUND ---
      let budgetRound = await prisma.budgetRound.findFirst({ 
        where: { fiscalYear: year, roundName: roundName } 
      });

      const roundData = { 
        roundName, 
        fiscalYear: year, 
        totalBudget: totalFundReal, 
        startDate, 
        endDate, 
        status: status,
        isPublished: true, 
        creatorId: adminId // Reuse adminId จาก Section 1
      };
      
      if (!budgetRound) {
        budgetRound = await prisma.budgetRound.create({ data: roundData });
      } else {
        await prisma.budgetRound.update({ where: { id: budgetRound.id }, data: roundData });
      }
      console.log(`      > 📅 Processed Round ${roundIdx+1}: ${status}`);

      // --- C. SYNC VOTING RIGHTS (BudgetDonation) ---
      // แจกสิทธิ์โหวตให้ User ที่มีอยู่แล้ว (ใช้ตัวแปร allEligibleUsers จากด้านบน 7.1)
      if (totalVoters > 0) {
        
        // 1. ดึง Payment Method (Bank Transfer) มาเตรียมไว้เชื่อมโยง
        const bankMethod = await prisma.paymentMethodRecord.findFirst({ 
            where: { methodName: PaymentMethodType.BANKTRANSFER } 
        });

        // 2. วนลูปสร้างข้อมูลโดยใช้ allEligibleUsers ตัวเดิม
        await Promise.all(allEligibleUsers.map(async (voter) => {
          
          const budgetDonationCreateInput = {
            userId: voter.id, 
            budgetRoundId: budgetRound.id, 
            projectId: centralProject!.id, // ใส่ ! หรือเช็ค null ให้แน่ใจ
            amount: donationPerHead, 
            status: TransactionStatus.SUCCESS,
            
            // Map ข้อมูล Profile จริงลงไป
            fullName: voter.fullName, 
            email: voter.email, 
            phone: voter.phone || "", 
            address: voter.address || "", 
            subdistrict: voter.subdistrict || "", 
            district: voter.district || "", 
            province: voter.province || "", 
            postalCode: voter.postalCode || "", 
            
            isPublic: false,
            
            // สร้าง PaymentRecord คู่กันเสมอ
            paymentRecord: {
              create: {
                amount: donationPerHead,
                paymentStatus: PaymentStatusType.CONFIRMED,
                paymentMethodId: bankMethod?.id,
                paymentSlipUrl: "/uploads/budget/auto-seed-slip.jpg"
              }
            }
          };

          // ตรวจสอบว่ามีอยู่แล้วหรือไม่
          const existing = await prisma.budgetDonation.findFirst({ 
            where: { userId: voter.id, budgetRoundId: budgetRound.id } 
          });

          if (!existing) {
            return prisma.budgetDonation.create({ data: budgetDonationCreateInput });
          } else {
            return prisma.budgetDonation.update({ 
              where: { id: existing.id }, 
              data: { amount: donationPerHead } 
            });
          }
        }));
      }

      // --- D. PROJECTS & VOTES (Mock Data: Budget-Based Approval Logic) ---
      if (roundIdx === 0) {
        // [ROUND 1 - CLOSED] รอบนี้เราจะจำลองว่ามี 3 โครงการ และอนุมัติตามงบที่เหลือ
        const projectsData = [
          { 
            name: "โครงการปรับปรุงห้องปฏิบัติการคอมพิวเตอร์ (Smart Lab)", 
            desc: "จัดซื้อเครื่องคอมพิวเตอร์สมรรถนะสูง สำหรับ AI และ Data Science", 
            unit: "สาขาวิชาวิศวกรรมคอมพิวเตอร์", 
            budget: Math.floor(totalFundReal * 0.40), // 40% ของงบ (แพง)
            targetPercent: 0.50 // คนโหวต 50% (ที่ 1)
          },
          {
            name: "โครงการติดตั้งไฟโซลาร์เซลล์รอบหอพัก",
            desc: "ติดตั้งโคมไฟพลังงานแสงอาทิตย์เพื่อความปลอดภัยในจุดเสี่ยง",
            unit: "ส่วนอาคารสถานที่",
            budget: Math.floor(totalFundReal * 0.30), // 30% ของงบ
            targetPercent: 0.30 // คนโหวต 30% (ที่ 2)
          },
          {
            name: "โครงการจัดสวนหย่อมหน้าอาคารเรียนรวม",
            desc: "ปรับภูมิทัศน์เพิ่มพื้นที่สีเขียวและจุดพักผ่อนสำหรับนักศึกษา",
            unit: "ส่วนภูมิทัศน์",
            budget: Math.floor(totalFundReal * 0.40), // 40% ของงบ
            targetPercent: 0.20 // คนโหวต 20% (ที่ 3)
          }
        ];

        // 1. เรียงลำดับตามคะแนนโหวต (มาก -> น้อย) เพื่อพิจารณาอนุมัติ
        // ในที่นี้ targetPercent คือตัวแทนคะแนนโหวต
        const rankedProjects = [...projectsData].sort((a, b) => b.targetPercent - a.targetPercent);

        // 2. คำนวณตัดเกรด (Approve ตามงบประมาณที่มี)
        let currentUsedBudget = 0;
        const projectsWithStatus = rankedProjects.map(p => {
            // เช็คว่าถ้ารวมโครงการนี้เข้าไป งบจะเกินไหม?
            if (currentUsedBudget + p.budget <= totalFundReal) {
                currentUsedBudget += p.budget;
                return { ...p, finalStatus: ProjectProposalStatus.APPROVED };
            } else {
                return { ...p, finalStatus: ProjectProposalStatus.CLOSE }; // งบหมด อดไป
            }
        });

        // Shuffle voters เพื่อกระจายคนโหวตไม่ให้ซ้ำกัน
        const shuffledAllVoters = [...allEligibleUsers].sort(() => 0.5 - Math.random());
        let currentIndex = 0;

        // 3. เริ่มสร้างข้อมูลลง Database
        for (const [idx, p] of projectsWithStatus.entries()) {
          
          // Upsert Proposal
          const proposalData = {
            projectName: p.name, 
            description: p.desc, 
            requestedAmount: p.budget, 
            responsibilityUnit: p.unit, 
            status: p.finalStatus, 
            budgetRoundId: budgetRound.id, 
            managerId: projectManager.id, 
            staffId: adminId, 
            projectStartDate: new Date(endDate.getTime() + 86400000 * 15),
            projectEndDate: new Date(endDate.getTime() + 86400000 * 180),
            coverFilePath: mockImages[idx % mockImages.length], 
            scoreTotal: 0 
          };

          const proposal = await prisma.projectProposal.upsert({
             where: { id: -1 }, 
             create: proposalData,
             update: proposalData
          }).catch(async () => {
             const found = await prisma.projectProposal.findFirst({
                 where: { projectName: p.name, budgetRoundId: budgetRound.id }
             });
             if(found) return prisma.projectProposal.update({ where: { id: found.id }, data: proposalData });
             return prisma.projectProposal.create({ data: proposalData });
          });

          // *** SIMULATE VOTES ***
          const voteCount = Math.floor(totalVoters * p.targetPercent);
          const votersForThisProject = shuffledAllVoters.slice(currentIndex, currentIndex + voteCount);
          currentIndex += voteCount;
          
          let actualScore = 0;
          for (const voter of votersForThisProject) {
             await prisma.projectVote.upsert({ 
               where: { alumniId_proposalId: { alumniId: voter.id, proposalId: proposal.id } }, 
               update: {}, 
               create: { alumniId: voter.id, proposalId: proposal.id, voteWeight: 1 } 
             });
             actualScore++;
          }
          
          // Update คะแนนรวม
          await prisma.projectProposal.update({ where: { id: proposal.id }, data: { scoreTotal: actualScore } });

          // สร้าง Report เฉพาะโครงการที่ "งบพอ" และ "อนุมัติ"
          if (p.finalStatus === ProjectProposalStatus.APPROVED) {
            const summaryData = { 
              proposalId: proposal.id, 
              status: SummarySubmissionStatus.APPROVED, 
              submitterId: adminId, 
              totalActualExpense: p.budget * 0.98, // ใช้จริง 98% ของที่ขอ
              submissionDate: new Date(proposalData.projectEndDate.getTime() + 86400000), 
              summaryFilePath: "/uploads/mock-report.pdf"
            };

            const summary = await prisma.summarySubmission.upsert({
              where: { proposalId: proposal.id },
              update: summaryData,
              create: summaryData
            });

            await prisma.submissionImage.createMany({
              data: [
                  { submissionId: summary.id, imagePath: mockImages[0] },
                  { submissionId: summary.id, imagePath: mockImages[1] }
              ],
              skipDuplicates: true
            });
            
            console.log(`      > 🏆 Project "${p.name}" APPROVED (Votes: ${actualScore}, Budget Used: ${p.budget})`);
          } else {
            console.log(`      > ❌ Project "${p.name}" REJECTED/CLOSED (Votes: ${actualScore}, Not enough budget)`);
          }
        }
      } else {
        // [ROUND 2 - OPEN] สร้างโครงการปัจจุบันที่เปิดให้โหวตอยู่
        const round2Projects = [
          { 
            name: "โครงการปรับปรุงภูมิทัศน์ลานกิจกรรม (Co-working Space)", 
            desc: "สร้างพื้นที่เรียนรู้ภายนอกอาคาร พร้อมจุดชาร์จและ Wi-Fi สำหรับนักศึกษา", 
            unit: "สำนักงานบริหารทรัพย์สิน", 
            budget: Math.floor(totalFundReal * 0.50), 
            img: mockImages[2] 
          },
          { 
            name: "โครงการรถไฟฟ้าสวัสดิการ (EV Shuttle Bus)", 
            desc: "จัดซื้อรถโดยสารพลังงานไฟฟ้า 2 คัน เพื่อรับ-ส่งภายในมหาวิทยาลัย ลดมลพิษ", 
            unit: "ส่วนกิจการนักศึกษา", 
            budget: Math.floor(totalFundReal * 0.45), 
            img: mockImages[0] 
          }
        ];

        for (const p of round2Projects) {
          const proposalData = {
            projectName: p.name, 
            description: p.desc, 
            requestedAmount: p.budget, 
            responsibilityUnit: p.unit, 
            status: ProjectProposalStatus.OPEN, 
            budgetRoundId: budgetRound.id, 
            managerId: projectManager.id, 
            staffId: adminId, 
            projectStartDate: new Date(endDate.getTime() + 86400000 * 30), 
            projectEndDate: new Date(endDate.getTime() + 86400000 * 200),
            coverFilePath: p.img, 
            scoreTotal: 0 
          };

          // Logic เดิม: findFirst -> create/update
          const found = await prisma.projectProposal.findFirst({
             where: { projectName: p.name, budgetRoundId: budgetRound.id }
          });
          
          if(found) {
             await prisma.projectProposal.update({ where: { id: found.id }, data: proposalData });
          } else {
             await prisma.projectProposal.create({ data: proposalData });
          }
          
          console.log(`      > 🗳️ Created OPEN Project: "${p.name}"`);
        }
      }
    }
  }
  console.log("\n🎉 All seed data inserted successfully.");
  console.log("\n📋 Login credentials (password: SUT@Seed2025!):");
  console.log("   • admin@sut-eng.ac.th");
  console.log("   • b6631345@g.sut.ac.th");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });