/**
 * @type {import('jest').Config}
 */
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // Handle CSS imports
    '^.+\\.(css|less|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
    // Handle image imports
    '^.+\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    // Use SWC for JS/TS/TSX files
    '^.+\\.(js|jsx|ts|tsx)$': ['@swc/jest'],
  },
  transformIgnorePatterns: ['/node_modules/', '^.+\\.module\\.(css|sass|scss)$'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  moduleDirectories: ['node_modules', '<rootDir>'],
};

module.exports = config;
