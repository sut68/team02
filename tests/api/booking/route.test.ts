// tests/api/booking/route.test.ts

// 1) mock prisma ให้ตรงกับที่ route ใช้จริง
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

// import route หลัง mock เสมอ
const { POST } = require("@/app/api/booking/route");

// -------------------- helpers --------------------
function makeReq(body?: Record<string, any>) {
  return {
    json: async () => body ?? {},
  } as any;
}

function makeIds() {
  return {
    userId: Math.floor(Math.random() * 1000) + 1,
    contentId: Math.floor(Math.random() * 1000) + 1,
  };
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
    bookingForm: bookingFormId
      ? {
          id: bookingFormId,
          TotalSeats: totalSeats,
          Souvenir: "HAVE",
          PriceType: priceType,
          singlePrice: 100,
          batchPrices: null,
        }
      : null,
  };
}

// -------------------- tests --------------------
describe("Booking API - Validation & Positive Tests (aligned with real controller)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("TC-VAL-01: missing userId or contentId -> 400", async () => {
    const req = makeReq({ contentId: 1 });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("ต้องระบุ userId และ contentId");
  });

  it("TC-VAL-02: content not found -> 404", async () => {
    (prisma.content.findUnique as jest.Mock).mockResolvedValue(null);

    const { userId, contentId } = makeIds();
    const req = makeReq({
      userId,
      contentId,
      bookingField: { name: "Tester" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("ไม่พบ content");
  });

  it("TC-VAL-03: booking not open -> 400", async () => {
    (prisma.content.findUnique as jest.Mock).mockResolvedValue(
      mockContent({ booking: "NOT" })
    );

    const { userId, contentId } = makeIds();
    const req = makeReq({
      userId,
      contentId,
      bookingField: { name: "Tester" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("กิจกรรมนี้ไม่ได้เปิดให้จอง");
  });

  it("TC-VAL-04: no bookingForm linked -> 400", async () => {
    (prisma.content.findUnique as jest.Mock).mockResolvedValue(
      mockContent({ bookingFormId: null })
    );

    const { userId, contentId } = makeIds();
    const req = makeReq({
      userId,
      contentId,
      bookingField: { name: "Tester" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("กิจกรรมนี้ยังไม่มี bookingForm ผูกอยู่");
  });

  it("TC-VAL-05: seats full -> 400", async () => {
    (prisma.content.findUnique as jest.Mock).mockResolvedValue(
      mockContent({ totalSeats: 1 })
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
  });

  it("TC-VAL-06: bookingField.name blank -> 400", async () => {
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
      bookingField: { name: "   " },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("กรุณากรอกชื่อ-สกุล");
  });

  it("TC-POS-01: create booking success -> 201", async () => {
    (prisma.content.findUnique as jest.Mock).mockResolvedValue(
      mockContent({ totalSeats: 30 })
    );
    (prisma.bookingField.aggregate as jest.Mock).mockResolvedValue({
      _sum: { BookingSeats: 5 },
    });

    // ✅ mock prisma.$transaction ให้ครบตาม route จริง
    (prisma.$transaction as jest.Mock).mockImplementation(async (fn: any) => {
      const tx = {
        bookingField: {
          create: jest.fn().mockResolvedValue({ id: 999 }),
        },
        paymentRecord: {
          create: jest.fn().mockResolvedValue({ id: 555 }),
        },
        booking: {
          create: jest.fn().mockResolvedValue({
            id: 123,
            Userid: 1,
            ContentID: 2,
            BookingFieldID: 999,
            PaymentID: 555,
            bookingField: {
              id: 999,
              Name: "Tester",
              BookingSeats: 1,
            },
            payment: {
              id: 555,
              amount: 100,
            },
          }),
        },
      };
      return fn(tx);
    });

    const { userId, contentId } = makeIds();
    const req = makeReq({
      userId,
      contentId,
      bookingField: {
        name: "Tester",
        note: "note",
        souvenir: "NOT",
      },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);

    // ✅ แก้ message ให้ตรง route จริง
    expect(json.message).toBe("สร้างการจอง + สร้างรายการชำระเงินสำเร็จ");

    expect(json).toHaveProperty("booking");
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
