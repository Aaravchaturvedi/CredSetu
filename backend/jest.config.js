/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',

  // Tests live outside src/, so production builds never include them.
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],

  // ts-jest compiles TypeScript on the fly using the test-specific tsconfig.
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
  },

  clearMocks: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
};
