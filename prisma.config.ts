import { defineConfig } from "prisma/config";
import { config as loadEnv } from "dotenv";

// โหลด .env ก่อนให้ Prisma ใช้
loadEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    // ดึงจาก process.env ที่ dotenv โหลดให้
    url: process.env.DATABASE_URL || "",
  },
});
