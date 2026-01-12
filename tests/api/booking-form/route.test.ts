import { prisma } from "@/app/lib/prisma";
import { BOOKINGFORM_CONFIG, ERROR_MESSAGES } from "@/lib/models/validation";;

// 1. Mock Prisma
jest.mock("@/app/lib/prisma", () => ({
  prisma: {
    bookingForm: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    content: { create: jest.fn() },
    $transaction: jest.fn(),
  },
}));

// Import Route
const { GET, POST, PUT } = require("@/app/api/booking-form/route");

// Helper
function makeReq(body: any = {}, method = "POST") {
  return {
    method,
    json: async () => body,
  } as any;
}

describe("Booking Form API Tests", () => {
  afterEach(() => jest.clearAllMocks());

  // --- POST Validation ---
  it("Should return 400 if priceType is missing", async () => {
    const req = makeReq({});
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe(ERROR_MESSAGES.BOOKING_PRICE_TYPE_REQUIRED);
  });

  it("Should return 400 if SINGLE price missing", async () => {
    const req = makeReq({ priceType: "SINGLE" });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe(ERROR_MESSAGES.BOOKING_SINGLE_PRICE_REQUIRED);
  });

  // --- POST Success ---
  it("Should create booking form successfully", async () => {
    // Mock Transaction
    (prisma.$transaction as jest.Mock).mockImplementation(async (fn: any) => {
      const tx = {
        bookingForm: { create: jest.fn().mockResolvedValue({ id: 100 }) },
        content: { create: jest.fn().mockResolvedValue({ id: 200 }) }
      };
      return await fn(tx);
    });

    const req = makeReq({
      priceType: "SINGLE",
      singlePrice: 500,
      content: { description: "Test Content" }
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.bookingForm.id).toBe(100);
    expect(json.content.id).toBe(200);
  });
});