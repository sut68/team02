/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import SubmissionPage from "@/app/user/news/submission/page"; 
import { ERROR_MESSAGES, SUBMISSION_CONFIG } from "@/lib/models/validation"; // ✅ Import Config

// Mock global fetch
global.fetch = jest.fn();

describe("Submission Page Frontend Logic", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // CASE 1: ลืมใส่ข้อมูล
  it("TC-FRONT-01: กดส่งโดยไม่กรอกอะไรเลย ต้องขึ้นเตือน", async () => {
    render(createElement(SubmissionPage));

    const submitBtn = screen.getByRole("button", { name: /ส่งงาน/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // เช็คข้อความจาก Constants โดยตรง
      expect(screen.getByText(ERROR_MESSAGES.REQUIRED_TITLE)).toBeInTheDocument();
      expect(screen.getByText(ERROR_MESSAGES.REQUIRED_FILE)).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  // CASE 2: ไฟล์ผิดประเภท (ลองส่ง PNG ซึ่งไม่อยู่ใน Allowed List)
  it("TC-FRONT-02: อัปโหลดไฟล์ผิดประเภท (เช่น .png) ต้องขึ้นเตือน", async () => {
    const user = userEvent.setup();
    render(createElement(SubmissionPage));

    const fileInput = screen.getByLabelText(/แนบไฟล์/i); 
    // สร้างไฟล์ปลอมเป็น PNG
    const badFile = new File(["dummy"], "test.png", { type: "image/png" });

    await user.upload(fileInput, badFile);

    const submitBtn = screen.getByRole("button", { name: /ส่งงาน/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // ข้อความต้องตรงกับที่แก้ใหม่ (PDF, Zip, Word)
      expect(screen.getByText(ERROR_MESSAGES.INVALID_FILE_TYPE)).toBeInTheDocument();
    });
    
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // CASE 3: ไฟล์ใหญ่เกิน
  it("TC-FRONT-03: อัปโหลดไฟล์ใหญ่เกินกำหนด ต้องขึ้นเตือน", async () => {
    const user = userEvent.setup();
    render(createElement(SubmissionPage));

    // สร้างไฟล์ที่ใหญ่กว่า MAX_FILE_SIZE นิดหน่อย
    const largeSize = SUBMISSION_CONFIG.MAX_FILE_SIZE + 1024;
    const largeFile = new File(["a".repeat(largeSize)], "big.pdf", { type: "application/pdf" });

    const fileInput = screen.getByLabelText(/แนบไฟล์/i);
    await user.upload(fileInput, largeFile);

    fireEvent.click(screen.getByRole("button", { name: /ส่งงาน/i }));

    await waitFor(() => {
      expect(screen.getByText(ERROR_MESSAGES.FILE_TOO_LARGE)).toBeInTheDocument();
    });
  });

  // CASE 4: Happy Path (ส่ง PDF ปกติ)
  it("TC-FRONT-04: กรอกครบ + ไฟล์ถูก -> ยิง API สำเร็จ", async () => {
    const user = userEvent.setup();
    render(createElement(SubmissionPage));

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Success" }),
    });

    const titleInput = screen.getByRole("textbox", { name: /หัวข้อ/i });
    await user.type(titleInput, "งานโปรเจกต์จบ");

    const fileInput = screen.getByLabelText(/แนบไฟล์/i);
    // ใช้ไฟล์ PDF ซึ่งอยู่ใน Allowed List
    const goodFile = new File(["content"], "project.pdf", { type: "application/pdf" });
    await user.upload(fileInput, goodFile);

    const submitBtn = screen.getByRole("button", { name: /ส่งงาน/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});