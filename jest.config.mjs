import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

const config = {
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/.next/",
    "<rootDir>/uat/"
  ],
}

export default createJestConfig(config)