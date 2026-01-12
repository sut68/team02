import { prisma } from "@/app/lib/prisma";
import { ERROR_MESSAGES, BOOKING_API_CONFIG } from "@/lib/models/validation";

// 1. Mock Prisma ให้ครบทุกตัวที่ใช้
jest.mock("@/app/lib/prisma", () => ({
  prisma: {
    content: { findUnique: jest.fn() },
    attendee: { count: jest.fn() },
    booking: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  },
}));

// Import Route
const { POST, GET, PATCH } = require("@/app/api/booking/route");

// Helper สร้าง Request
function makeReq(body: any = {}, method = "POST", queryParams: string = "") {
  let url = "http://localhost:3000/api/booking";
  if (queryParams) url += `?${queryParams}`;

  return {
    url,
    method,
    json: async () => body,
  } as any;
}

describe("Booking API Full Tests", () => {
  afterEach(() => jest.clearAllMocks());

  // ==========================================
  // 1. POST: สร้างการจอง
  // ==========================================
  describe("POST /api/booking (Create)", () => {
    it("TC-POST-01: Content Not Found -> 404", async () => {
      (prisma.content.findUnique as jest.Mock).mockResolvedValue(null);
      const req = makeReq({ contentId: 999 });
      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(404);
      expect(json.error).toBe(ERROR_MESSAGES.CONTENT_NOT_FOUND);
    });

    it("TC-POST-02: Seats Full -> 400", async () => {
      (prisma.content.findUnique as jest.Mock).mockResolvedValue({
        bookingForm: { TotalSeats: 10 }
      });
      (prisma.attendee.count as jest.Mock).mockResolvedValue(10); // เต็มแล้ว

      const req = makeReq({ contentId: 1 });
      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe(ERROR_MESSAGES.SEATS_FULL);
    });

    it("TC-POST-03: Create Success (Happy Path) -> 200", async () => {
      // Mock ข้อมูลกิจกรรม
      (prisma.content.findUnique as jest.Mock).mockResolvedValue({
        TitleName: "Big Event",
        bookingForm: { TotalSeats: 100, Souvenir: "HAVE", PriceType: "SINGLE", singlePrice: 100 },
        souvenirItem: { id: 5 }
      });
      (prisma.attendee.count as jest.Mock).mockResolvedValue(0);

      // Mock Transaction (สำคัญมากต้องครบ)
      (prisma.$transaction as jest.Mock).mockImplementation(async (fn: any) => {
        const tx = {
          bookingField: { create: jest.fn().mockResolvedValue({ id: 1 }) },
          paymentRecord: { create: jest.fn().mockResolvedValue({ id: 2 }) },
          booking: { create: jest.fn().mockResolvedValue({ id: 3, bookingNumber: "BK001", qrToken: "xyz" }) },
          attendee: { create: jest.fn() },
          entitlement: { create: jest.fn() }
        };
        return await fn(tx);
      });

      const req = makeReq({ userId: 1, contentId: 1, bookingField: { name: "User A" } });
      const res = await POST(req);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.booking.bookingNumber).toBe("BK001");
      expect(json.booking.eventName).toBe("Big Event");
    });
  });

  // ==========================================
  // 2. GET: สแกน QR / ดึงข้อมูล
  // ==========================================
  describe("GET /api/booking (Scan)", () => {
    it("TC-GET-01: Missing Token & ID -> 400", async () => {
      const req = makeReq({}, "GET", ""); // ไม่มี query
      const res = await GET(req);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe(ERROR_MESSAGES.TOKEN_REQUIRED);
    });

    it("TC-GET-02: Booking Not Found -> 404", async () => {
      (prisma.booking.findFirst as jest.Mock).mockResolvedValue(null);
      const req = makeReq({}, "GET", "token=invalid_token");
      const res = await GET(req);
      expect(res.status).toBe(404);
    });

    it("TC-GET-03: Scan Success -> 200", async () => {
      (prisma.booking.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        qrToken: "abc",
        bookingNumber: "BK123",
        attendees: [{ checkins: [] }], // ยังไม่เช็คอิน
        content: { TitleName: "Event A", bookingForm: { TotalSeats: 50 } },
        entitlement: []
      });

      const req = makeReq({}, "GET", "token=abc");
      const res = await GET(req);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.booking.isCheckedIn).toBe(false);
      expect(json.booking.bookingNumber).toBe("BK123");
    });
  });

  // ==========================================
  // 3. PATCH: เช็คอิน & รับของ
  // ==========================================
  describe("PATCH /api/booking (Check-in / Souvenir)", () => {
    it("TC-PATCH-01: Check-in Success", async () => {
      (prisma.booking.findFirst as jest.Mock).mockResolvedValue({
        attendees: [{ id: 1, Name: "Test", checkins: [] }], // ยังไม่เช็คอิน
        entitlement: []
      });

      (prisma.$transaction as jest.Mock).mockImplementation(async (fn: any) => {
        return await fn({ checkinLog: { create: jest.fn() } });
      });

      const req = makeReq({ qrToken: "abc", action: BOOKING_API_CONFIG.ACTIONS.CHECKIN }, "PATCH");
      const res = await PATCH(req);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.message).toBe(ERROR_MESSAGES.CHECKIN_SUCCESS);
    });

    it("TC-PATCH-02: Claim Souvenir Success", async () => {
      (prisma.booking.findFirst as jest.Mock).mockResolvedValue({
        attendees: [],
        entitlement: [{ qtyUsed: 0, qtyGranted: 1 }] // ยังมีสิทธิ์รับของ
      });

      (prisma.$transaction as jest.Mock).mockImplementation(async (fn: any) => {
        return await fn({ entitlement: { updateMany: jest.fn() } });
      });

      const req = makeReq({ qrToken: "abc", action: BOOKING_API_CONFIG.ACTIONS.SOUVENIR }, "PATCH");
      const res = await PATCH(req);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.message).toBe(ERROR_MESSAGES.SOUVENIR_SUCCESS);
    });

    it("TC-PATCH-03: Souvenir Already Claimed -> 400", async () => {
      (prisma.booking.findFirst as jest.Mock).mockResolvedValue({
        attendees: [],
        entitlement: [{ qtyUsed: 1, qtyGranted: 1 }] // ใช้สิทธิ์ไปหมดแล้ว
      });

      const req = makeReq({ qrToken: "abc", action: BOOKING_API_CONFIG.ACTIONS.SOUVENIR }, "PATCH");
      const res = await PATCH(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe(ERROR_MESSAGES.SOUVENIR_CLAIMED);
    });
  });
});