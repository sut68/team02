// app/api/submissions/route.test.ts
import { GET, POST } from "@/app/api/user/news/submission/route";
import { prisma } from "@/app/lib/prisma";
import jwt from "jsonwebtoken";

// 1) Mock Prisma + jwt + fs
jest.mock("@/app/lib/prisma", () => ({
  prisma: {
    submission: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    submissionFile: {
      create: jest.fn(),
    },
  },
}));

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

jest.mock("fs", () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
  },
}));

import { promises as fs } from "fs";

type MockReqOptions = {
  token?: string | null;
  form?: Record<string, any>;
};

function makeReq(opts: MockReqOptions = {}) {
  const token = opts.token ?? null;
  const form = opts.form ?? {};

  // NextRequest-like object (พอให้ route ใช้ได้)
  return {
    cookies: {
      get: (name: string) => {
        if (name !== "token") return undefined;
        return token ? { value: token } : undefined;
      },
    },
    formData: async () => ({
      get: (key: string) => (key in form ? form[key] : null),
    }),
  } as any;
}

function makeFakeFile(name = "test.pdf", content = "hello") {
  // ใน node env ไม่มี File จริงเสมอไป → เราทำ object ที่ route ใช้ได้
  return {
    name,
    arrayBuffer: async () => Buffer.from(content).buffer,
  } as any;
}

describe("Submission API - Validation Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------
  // NEGATIVE 1: ไม่มี token -> 401
  // -------------------------
  it("TC-SUB-NEG-01: Should return 401 if no token (GET)", async () => {
    const req = makeReq({ token: null });

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    // ไม่ล็อคข้อความแบบ hardcode เกินไป: ขอมี field error เป็น string
    expect(typeof json.error).toBe("string");
  });

  // -------------------------
  // NEGATIVE 2: token ไม่ถูกต้อง -> 401
  // -------------------------
  it("TC-SUB-NEG-02: Should return 401 if token invalid (POST)", async () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("invalid token");
    });

    const req = makeReq({
      token: "bad-token",
      form: { title: "Hello", file: makeFakeFile() },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(typeof json.error).toBe("string");

    // ต้องไม่ไปแตะ filesystem/db
    expect(fs.mkdir).not.toHaveBeenCalled();
    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(prisma.submissionFile.create).not.toHaveBeenCalled();
    expect(prisma.submission.create).not.toHaveBeenCalled();
  });

  // -------------------------
  // NEGATIVE 3: ข้อมูลไม่ครบ -> 400
  // -------------------------
  it("TC-SUB-NEG-03: Should return 400 if missing title or file (POST)", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({
      userId: 1,
      email: "user@test.com",
      userType: "USER",
    });

    // ส่งแค่ title แต่ไม่มี file
    const req = makeReq({
      token: "good-token",
      form: { title: "My Submission" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(typeof json.error).toBe("string");

    expect(fs.mkdir).not.toHaveBeenCalled();
    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(prisma.submissionFile.create).not.toHaveBeenCalled();
    expect(prisma.submission.create).not.toHaveBeenCalled();
  });

  // -------------------------
  // POSITIVE 1: POST สำเร็จ -> 200
  // -------------------------
  it("TC-SUB-POS-01: Should create submission successfully (POST)", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({
      userId: 99,
      email: "u99@test.com",
      userType: "USER",
    });

    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    (prisma.submissionFile.create as jest.Mock).mockResolvedValue({
      id: 555,
      Path: "/uploads/submissions/abc_test.pdf",
    });

    (prisma.submission.create as jest.Mock).mockResolvedValue({
      id: 777,
      Name: "Hello",
      status: "PENDING",
      userId: 99,
      fileId: 555,
      file: { id: 555, Path: "/uploads/submissions/abc_test.pdf" },
    });

    const req = makeReq({
      token: "good-token",
      form: {
        title: "Hello",
        file: makeFakeFile("test.pdf", "file-content"),
      },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.submission).toBeDefined();
    expect(json.submission.id).toBe(777);

    // เช็คว่าเรียก db ถูกลำดับ
    expect(prisma.submissionFile.create).toHaveBeenCalled();
    expect(prisma.submission.create).toHaveBeenCalled();

    // เช็คว่าเขียนไฟล์จริง (ผ่าน mock)
    expect(fs.mkdir).toHaveBeenCalled();
    expect(fs.writeFile).toHaveBeenCalled();
  });
});
