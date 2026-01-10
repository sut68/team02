import { prisma } from "@/app/lib/prisma";
import { promises as fs } from "fs";
import { CONTENT_CONFIG, ERROR_MESSAGES } from "@/lib/models/validation";

// 1) Mock fs
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

// 2) Mock prisma
jest.mock("@/app/lib/prisma", () => ({
  prisma: {
    content: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(), // mock เพิ่ม
    },
    pictureContent: { createMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));

// Import Route
const { POST } = require("@/app/api/content/route");

// Helper
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

describe("Content API - Validation Tests", () => {
  afterEach(() => jest.clearAllMocks());

  // ---------- Title ----------
  it("Should return 400 if title is empty", async () => {
    const req = makeReq({
      form: { title: "", categories: "NEWS", pictures: [makeFakeFile()] },
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe(ERROR_MESSAGES.TITLE_EMPTY);
  });

  it("Should return 400 if title too short", async () => {
    const req = makeReq({
      form: { title: "AB", categories: "NEWS", pictures: [makeFakeFile()] },
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    // เช็คกับ Constant
    expect(json.error).toBe(ERROR_MESSAGES.TITLE_TOO_SHORT);
  });

  it("Should return 400 if title too long", async () => {
    const longTitle = "a".repeat(CONTENT_CONFIG.TITLE_MAX_LENGTH + 1);
    const req = makeReq({
      form: { title: longTitle, categories: "NEWS", pictures: [makeFakeFile()] },
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe(ERROR_MESSAGES.TITLE_TOO_LONG);
  });

  // ---------- Description ----------
  it("Should return 400 if description too long", async () => {
    const longDesc = "a".repeat(CONTENT_CONFIG.DESC_MAX_LENGTH + 1);
    const req = makeReq({
      form: { title: "Hello", description: longDesc, categories: "NEWS", pictures: [makeFakeFile()] },
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe(ERROR_MESSAGES.DESC_TOO_LONG);
  });

  // ---------- Category ----------
  it("Should return 400 if categories missing", async () => {
    const req = makeReq({ form: { title: "Hello", pictures: [makeFakeFile()] } });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe(ERROR_MESSAGES.CATEGORY_REQUIRED);
  });

  // ---------- Picture ----------
  it("Should return 400 if no pictures uploaded", async () => {
    const req = makeReq({ 
      form: { 
        title: "Hello", 
        categories: "NEWS", 
        pictures: [] 
      } 
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe(ERROR_MESSAGES.PICTURE_REQUIRED);
  });
  
  // ---------- Success ----------
  it("Should create content successfully", async () => {
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    (prisma.$transaction as jest.Mock).mockImplementation(async (fn: any) => {
      const tx = {
        content: {
          create: jest.fn().mockResolvedValue({ id: 1, TitleName: "Hello" }),
          findUnique: jest.fn().mockResolvedValue({ id: 1, TitleName: "Hello", pictures: [] }),
        },
        pictureContent: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
      };
      return await fn(tx);
    });

    const req = makeReq({
      form: {
        title: "Hello",
        description: "World",
        categories: "NEWS",
        pictures: [makeFakeFile("a.png")],
      },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.message).toBe(ERROR_MESSAGES.CREATE_SUCCESS);
    expect(json).toHaveProperty("content");
  });
});