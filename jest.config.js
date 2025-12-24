const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // บอก path ของโปรเจกต์
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // ถ้ายังไม่มีไฟล์นี้ สร้างไฟล์เปล่าๆ ไว้ก่อนก็ได้ครับ
  
  // ✅ แนะนำให้ใช้ jsdom ตาม package.json ที่คุณเลือกไว้ เพื่อกัน Error เรื่อง window/document
  testEnvironment: 'jest-environment-jsdom', 
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/app/$1', // ⚠️ เช็คว่าโค้ดคุณอยู่ใน app/ หรือ src/ ถ้าอยู่ใน root ก็ใช้ <rootDir>/$1
  },

  // 👇 จุดสำคัญ: สั่งให้ Jest ข้ามโฟลเดอร์ e2e และ node_modules
  testPathIgnorePatterns: [
    '/node_modules/', 
    '/.next/', 
    '/tests/e2e/' // ข้าม folder selenium
  ],

  // เพิ่มบรรทัดนี้เพื่อความชัวร์ ให้หาเฉพาะไฟล์ที่ลงท้ายด้วย test.ts ในโฟลเดอร์ tests/api
  testMatch: [
    "**/tests/api/**/*.test.ts",
    "**/app/api/**/*.test.ts" // เผื่อคุณวางไฟล์ test ไว้คู่กับ code จริงใน app
  ],
  
  verbose: true,
}

module.exports = createJestConfig(customJestConfig)