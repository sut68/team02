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