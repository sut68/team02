import { z } from "zod";

// 1. กฎสำหรับ BudgetDonation
export const BudgetSchema = z.object({
  email: z.string().email("Invalid email format"),
  fullName: z.string().min(1, "Full Name is required"),
  phone: z.string().length(10, "Phone must be 10 digits").regex(/^\d+$/, "Numbers only"),
  address: z.string().optional(),
  subdistrict: z.string().optional(),
  district: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().length(5, "Postal code must be 5 digits").optional(),
  amount: z.number().positive("Amount must be positive"),
  message: z.string().optional().nullable(),
  userId: z.number().int().positive(),
  projectId: z.number().int()
});

// 2. กฎสำหรับ DonationProject
export const ProjectSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  ownerName: z.string().optional(),
  posterUrl: z.string().url("Invalid URL").optional().nullable(), // อนุญาตให้เป็น null
  description: z.string().min(1, "Description is required"),
  goalAmount: z.number().positive("Goal must be positive"),
  isCentralFund: z.boolean().optional().default(false),
  startDate: z.date(),
  endDate: z.date(),
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

// 3. กฎสำหรับ DonationTransaction
export const TransactionSchema = z.object({
  fullName: z.string().min(1, "Full Name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().length(10, "Phone must be 10 digits"),
  address: z.string().optional(),
  subdistrict: z.string().optional(),
  district: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().length(5, "Postal code must be 5 digits").optional(),
  amount: z.number().positive("Amount must be positive"),
  message: z.string().nullable().optional(),
  projectId: z.number().int().positive(),
});


 //kk system
 // news system

export const SUBMISSION_CONFIG = {
  // Path ที่จะเซฟไฟล์ (Relative to public)
  UPLOAD_DIR: "uploads/submissions", 
  
  // ขนาดไฟล์สูงสุด (เช่น 5MB)
  MAX_FILE_SIZE: 5 * 1024 * 1024, 
  
  // ประเภทไฟล์ที่อนุญาต: PDF, Zip, Word (.doc, .docx)
  ALLOWED_FILE_TYPES: [
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed", // บางเครื่องส่ง header นี้สำหรับ zip
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // .docx
  ], 
};
export const CONTENT_CONFIG = {
  UPLOAD_DIR: "uploads/content",
  TITLE_MIN_LENGTH: 3,
  TITLE_MAX_LENGTH: 200,
  DESC_MAX_LENGTH: 1000,
  // ประเภทไฟล์รูปภาพที่รองรับ
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
};

export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized Access",
  MISSING_FIELDS: "กรุณากรอกข้อมูลให้ครบถ้วน",
  REQUIRED_TITLE: "กรุณากรอกหัวข้อ",
  REQUIRED_FILE: "กรุณาอัปโหลดไฟล์",
  SUCCESS: "ส่งงานสำเร็จ",
  INVALID_FILE_TYPE: "ประเภทไฟล์ไม่ถูกต้อง (อนุญาตเฉพาะไฟล์ PDF, Zip และ Word เท่านั้น)",
  FILE_TOO_LARGE: "ขนาดไฟล์ใหญ่เกินกำหนด (ไม่เกิน 5MB)",
  UPLOAD_FAILED: "เกิดข้อผิดพลาดในการอัปโหลด",
  DB_ERROR: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
  // Content Specific
  ID_INVALID: "id ไม่ถูกต้อง",
  NOT_FOUND: "ไม่พบเนื้อหา",
  TITLE_EMPTY: "ชื่อหัวเรื่องห้ามว่าง",
  TITLE_TOO_SHORT: `ชื่อหัวเรื่องสั้นเกินไป (ต้องมากกว่า ${CONTENT_CONFIG.TITLE_MIN_LENGTH} ตัวอักษร)`,
  TITLE_TOO_LONG: `ชื่อหัวเรื่องยาวเกินไป (ต้องไม่เกิน ${CONTENT_CONFIG.TITLE_MAX_LENGTH} ตัวอักษร)`,
  DESC_TOO_LONG: `รายละเอียดต้องไม่เกิน ${CONTENT_CONFIG.DESC_MAX_LENGTH} ตัวอักษร`,
  CATEGORY_REQUIRED: "ต้องระบุ categories",
  CATEGORY_INVALID: "categories ไม่ถูกต้อง",
  PICTURE_REQUIRED: "ต้องอัปโหลดรูปอย่างน้อย 1 รูป",
  BOOKING_INVALID: "booking option ไม่ถูกต้อง",
  USER_ID_INVALID: "userId ไม่ถูกต้อง",
  FORM_ID_INVALID: "bookingFormId ไม่ถูกต้อง",
  DELETE_ID_REQUIRED: "ต้องระบุ id สำหรับลบ",
  DELETE_SUCCESS: "ลบเนื้อหาสำเร็จ",
  CREATE_SUCCESS: "สร้างเนื้อหาสำเร็จ"
};