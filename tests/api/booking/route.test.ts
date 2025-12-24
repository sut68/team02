// tests/api/booking/route.test.ts

// 1) mock prisma
jest.mock("@/app/lib/prisma", () => ({
  prisma: {
    content: {
      findUnique: jest.fn(),
    },
    bookingField: {
      aggregate: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import { prisma } from "@/app/lib/prisma";

// import route หลัง mock
const { POST } = require("@/app/api/booking/route");

// helpers
function makeReq(body?: Record<string, any>) {
  return {
    json: async () => body ?? {},
  } as any;
}

function makeIds() {
  // ไม่ hardcode แบบฝังตาย: สุ่มค่าที่เป็นตัวเลขได้
  const userId = Math.floor(Math.random() * 1000) + 1;
  const contentId = Math.floor(Math.random() * 1000) + 1;
  return { userId, contentId };
}

function mockContent({
  booking = "HAVE",
  bookingFormId = 10,
  totalSeats = 30,
  priceType = "SINGLE",
}: {
  booking?: "HAVE" | "NOT";
  bookingFormId?: number | null;
  totalSeats?: number | null;
  priceType?: "SINGLE" | "BY_BATCH" | "FREE";
} = {}) {
  return {
    Booking: booking,
    BookingFormID: bookingFormId,
    bookingForm: {
      id: bookingFormId ?? null,
      TotalSeats: totalSeats,
      Souvenir: "HAVE",
      PriceType: priceType,
      singlePrice: 100,
      batchPrices: null,
    },
  };
}

describe("Booking API - Validation & Positive Tests (proposal-style)", () => {
  afterEach(() => jest.clearAllMocks());

  it("TC-VAL-01: Should return 400 if missing userId or contentId", async () => {
    const req = makeReq({ contentId: 1 }); // missing userId

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("ต้องระบุ userId และ contentId");
  });

  it("TC-VAL-02: Should return 404 if content not found", async () => {
    (prisma.content.findUnique as jest.Mock).mockResolvedValue(null);

    const { userId, contentId } = makeIds();
    const req = makeReq({ userId, contentId, bookingField: { name: "A" } });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("ไม่พบ content");
  });

  it("TC-VAL-03: Should return 400 if content booking not open", async () => {
    (prisma.content.findUnique as jest.Mock).mockResolvedValue(
      mockContent({ booking: "NOT" })
    );

    const { userId, contentId } = makeIds();
    const req = makeReq({ userId, contentId, bookingField: { name: "A" } });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("กิจกรรมนี้ไม่ได้เปิดให้จอง");
  });

  it("TC-VAL-04: Should return 400 if content has no bookingForm linked", async () => {
    (prisma.content.findUnique as jest.Mock).mockResolvedValue(
      mockContent({ bookingFormId: null })
    );

    const { userId, contentId } = makeIds();
    const req = makeReq({ userId, contentId, bookingField: { name: "A" } });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("กิจกรรมนี้ยังไม่มี bookingForm ผูกอยู่");
  });

  it("TC-VAL-05: Should return 400 if seats are full (remaining < 1)", async () => {
    // TotalSeats = 1 และ sum BookingSeats = 1 => เต็ม
    (prisma.content.findUnique as jest.Mock).mockResolvedValue(
      mockContent({ totalSeats: 1, bookingFormId: 10 })
    );
    (prisma.bookingField.aggregate as jest.Mock).mockResolvedValue({
      _sum: { BookingSeats: 1 },
    });

    const { userId, contentId } = makeIds();
    const req = makeReq({
      userId,
      contentId,
      bookingField: { name: "Tester" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("ที่นั่งเต็มแล้ว");
    expect(prisma.bookingField.aggregate).toHaveBeenCalled();
  });

  it("TC-VAL-06: Should return 400 if bookingField.name is missing/blank", async () => {
    (prisma.content.findUnique as jest.Mock).mockResolvedValue(
      mockContent({ totalSeats: 30 })
    );
    (prisma.bookingField.aggregate as jest.Mock).mockResolvedValue({
      _sum: { BookingSeats: 0 },
    });

    const { userId, contentId } = makeIds();
    const req = makeReq({
      userId,
      contentId,
      bookingField: { name: "   " }, // blank
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("กรุณากรอกชื่อ-สกุล");
  });

  it("TC-POS-01: Should create booking successfully (201)", async () => {
    (prisma.content.findUnique as jest.Mock).mockResolvedValue(
      mockContent({ totalSeats: 30, bookingFormId: 10 })
    );
    (prisma.bookingField.aggregate as jest.Mock).mockResolvedValue({
      _sum: { BookingSeats: 5 },
    });

    // mock transaction
    (prisma.$transaction as jest.Mock).mockImplementation(async (fn: any) => {
      const tx = {
        bookingField: {
          create: jest.fn().mockResolvedValue({ id: 999 }),
        },
        booking: {
          create: jest.fn().mockResolvedValue({
            id: 12345,
            Userid: 1,
            ContentID: 2,
            BookingFieldID: 999,
            bookingField: { id: 999, BookingSeats: 1, Name: "Tester" },
          }),
        },
      };
      return await fn(tx);
    });

    const { userId, contentId } = makeIds();
    const req = makeReq({
      userId,
      contentId,
      bookingField: {
        batchNumber: "1",
        name: "Tester",
        note: "note",
        souvenir: "NOT",
        totalPrice: 100,
      },
      // attendees ถ้ามี ก็ไม่พัง (แต่ controller ignore)
      attendees: ["X", "Y"],
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.message).toBe("สร้างการจองสำเร็จ");
    expect(json).toHaveProperty("booking");
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
