module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  moduleNameMapper: {
    '^@campus-nav/shared/(.*)$': '<rootDir>/../shared/src/$1',
  },
  testMatch: ['**/tests/**/*.test.ts'],
}; 