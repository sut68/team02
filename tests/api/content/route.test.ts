// tests/api/content/route.test.ts

// 1) mock fs preserve actual (กัน prisma พัง)
jest.mock("fs", () => {
  const actual = jest.requireActual("fs");
  return {
    ...actual,
    promises: {
      ...actual.promises,
      mkdir: jest.fn(),
      writeFile: jest.fn(),
    },
  };
});

// 2) mock prisma
jest.mock("@/app/lib/prisma", () => ({
  prisma: {
    content: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import { prisma } from "@/app/lib/prisma";
import { promises as fs } from "fs";

// import route หลัง mock
const { GET, POST, DELETE } = require("@/app/api/content/route");

// helpers
function makeReq(opts?: { url?: string; form?: Record<string, any> }) {
  const url = opts?.url ?? "http://localhost:3000/api/content";
  const form = opts?.form ?? {};
  return {
    url,
    formData: async () => ({
      get: (key: string) => (key in form ? form[key] : null),
      getAll: (key: string) => (key in form ? form[key] : []),
    }),
  } as any;
}

function makeFakeFile(name = "pic.png", content = "img") {
  return { name, arrayBuffer: async () => Buffer.from(content).buffer } as any;
}

describe("Content API - Validation Tests (like project-proposal style)", () => {
  afterEach(() => jest.clearAllMocks());

  // ---------- Title validation ----------
  it("TC-VAL-01: Should return 400 if title is empty", async () => {
    const req = makeReq({
      form: { title: "", categories: "NEWS", pictures: [makeFakeFile()] },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("ชื่อหัวเรื่องห้ามว่าง");
  });

  it("TC-VAL-02: Should return 400 if title too short (<3)", async () => {
    const req = makeReq({
      form: { title: "AB", categories: "NEWS", pictures: [makeFakeFile()] },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/สั้นเกินไป/);
  });

  it("TC-VAL-03: Should return 400 if title too long (>200)", async () => {
    const longTitle = "a".repeat(201);
    const req = makeReq({
      form: { title: longTitle, categories: "NEWS", pictures: [makeFakeFile()] },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/ยาวเกินไป/);
  });

  // ---------- Description validation ----------
  it("TC-VAL-04: Should return 400 if description too long (>1000)", async () => {
    const longDesc = "a".repeat(1001);
    const req = makeReq({
      form: { title: "Hello", description: longDesc, categories: "NEWS", pictures: [] },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/ไม่เกิน 1000/);
  });

  // ---------- Enum validation ----------
  it("TC-VAL-05: Should return 400 if categories missing", async () => {
    const req = makeReq({ form: { title: "Hello", pictures: [] } });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("ต้องระบุ categories");
  });
  // ---------- POS: create success ----------
  it("TC-POS-01: Should create content successfully", async () => {
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    (prisma.$transaction as jest.Mock).mockImplementation(async (fn: any) => {
      const tx = {
        content: {
          create: jest.fn().mockResolvedValue({ id: 1 }),
          findUnique: jest.fn().mockResolvedValue({ id: 1, TitleName: "Hello", pictures: [] }),
        },
        pictureContent: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      };
      return await fn(tx);
    });

    const req = makeReq({
      form: {
        title: "Hello",
        description: "World",
        categories: "NEWS",
        pictures: [makeFakeFile("a.png"), makeFakeFile("b.png")],
      },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json).toHaveProperty("content");
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
