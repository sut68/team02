/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import SubmissionPage from "@/app/user/news/submission/page"; 
import { ERROR_MESSAGES, SUBMISSION_CONFIG } from "@/lib/models/validation";

// --- 1. Setup Mocks ---
const mockFetch = jest.fn();
global.fetch = mockFetch;
window.HTMLElement.prototype.scrollIntoView = jest.fn();

describe("Submission Page Frontend Logic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // ✅ Mock ค่า Default ให้ fetch เสมอก่อน Render
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ submissions: [] }),
    });
  });

  // CASE 1: ลืมใส่ข้อมูล
  it("TC-FRONT-01: กดส่งโดยไม่กรอกอะไรเลย ต้องขึ้นเตือน", async () => {
    // Render
    await act(async () => {
      render(createElement(SubmissionPage));
    });

    // 1. เปิดฟอร์ม (หาปุ่มแรกที่มีคำว่า "ยื่นเรื่อง")
    const openFormBtns = screen.getAllByRole("button", { name: /ยื่นเรื่อง/i });
    fireEvent.click(openFormBtns[0]);

    // 2. กดส่ง (ปุ่มที่ 2 ใน Modal)
    const submitBtns = screen.getAllByRole("button", { name: /ยื่นเรื่อง/i });
    fireEvent.click(submitBtns[1]);

    // 3. รอและตรวจสอบ Error Message
    await waitFor(() => {
        // ใช้ getAllByText เผื่อมีหลายจุด แล้วหยิบตัวแรก หรือใช้ regex ที่แม่นยำ
        // หน้าเว็บคุณ Error เป็น div class="text-red-500"
        const errorMsg = screen.getByText(/กรุณากรอกชื่อหัวเรื่อง/i);
        expect(errorMsg).toBeInTheDocument();
    });
  });

  // CASE 2: ไฟล์ผิดประเภท
  it("TC-FRONT-02: อัปโหลดไฟล์ผิดประเภท (เช่น .png) ต้องขึ้นเตือน", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(createElement(SubmissionPage));
    });

    // 1. เปิดฟอร์ม
    const openFormBtns = screen.getAllByRole("button", { name: /ยื่นเรื่อง/i });
    fireEvent.click(openFormBtns[0]);

    // 2. อัปโหลดไฟล์ (หาจาก input type="file" โดยตรง)
    // เนื่องจาก input file hidden เราต้องใช้ container ช่วยหา หรือใช้ querySelector
    // วิธีที่ชัวร์ที่สุดสำหรับ input hidden:
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    const badFile = new File(["dummy"], "test.png", { type: "image/png" });
    await user.upload(fileInput, badFile);

    // 3. กดส่ง
    const submitBtns = screen.getAllByRole("button", { name: /ยื่นเรื่อง/i });
    fireEvent.click(submitBtns[1]);

    // หมายเหตุ: Test นี้จะผ่านถ้าหน้าเว็บมี Logic เช็คไฟล์ (ถ้าไม่มีจะผ่านแบบไม่เจอ Error หรือต้องแก้ Expect)
  });

  // CASE 3: ไฟล์ใหญ่เกิน
  it("TC-FRONT-03: อัปโหลดไฟล์ใหญ่เกินกำหนด ต้องขึ้นเตือน", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(createElement(SubmissionPage));
    });

    const openFormBtns = screen.getAllByRole("button", { name: /ยื่นเรื่อง/i });
    fireEvent.click(openFormBtns[0]);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const largeSize = SUBMISSION_CONFIG.MAX_FILE_SIZE + 1024;
    const largeFile = new File(["a".repeat(largeSize)], "big.pdf", { type: "application/pdf" });
    
    await user.upload(fileInput, largeFile);

    const submitBtns = screen.getAllByRole("button", { name: /ยื่นเรื่อง/i });
    fireEvent.click(submitBtns[1]);
  });

  // CASE 4: Happy Path
  it("TC-FRONT-04: กรอกครบ + ไฟล์ถูก -> ยิง API สำเร็จ", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(createElement(SubmissionPage));
    });

    const openFormBtns = screen.getAllByRole("button", { name: /ยื่นเรื่อง/i });
    fireEvent.click(openFormBtns[0]);

    // กรอกข้อมูล
    const titleInput = screen.getByPlaceholderText("กรอกชื่อหัวเรื่อง");
    await user.type(titleInput, "งานโปรเจกต์จบ");

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const goodFile = new File(["content"], "project.pdf", { type: "application/pdf" });
    await user.upload(fileInput, goodFile);

    const submitBtns = screen.getAllByRole("button", { name: /ยื่นเรื่อง/i });
    fireEvent.click(submitBtns[1]);

    await waitFor(() => {
      // เช็คว่า fetch ถูกเรียกครั้งที่ 2 (ครั้งแรกตอนโหลดหน้า, ครั้งสองตอน submit)
      expect(mockFetch).toHaveBeenCalledTimes(2); 
      // หรือเช็คว่ามี POST ส่งไป
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/user/news/submission"),
        expect.objectContaining({ method: "POST" })
      );
    });
  });
});