const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // 👇 จุดสำคัญ: สั่งให้ Jest ข้ามโฟลเดอร์ e2e และ node_modules
  testPathIgnorePatterns: [
    '/node_modules/', 
    '/.next/', 
    '/tests/e2e/' 
  ],
  // เพิ่มบรรทัดนี้เพื่อความชัวร์ ให้หาเฉพาะไฟล์ที่ลงท้ายด้วย test.ts
  testMatch: [
    "**/tests/api/**/*.test.ts" 
  ],
  verbose: true,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)