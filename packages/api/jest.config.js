module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@campus-nav/shared/(.*)$': '<rootDir>/../shared/src/$1',
  },
  testMatch: ['**/tests/**/*.test.ts'],
}; 