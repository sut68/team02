const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  testEnvironment: 'jest-environment-node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1', // แก้เป็นแบบนี้เพื่อให้หา alias @ เจอ
  }
}

module.exports = createJestConfig(customJestConfig)