/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',

  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['lcov', 'text'],

  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/common/**',
    '!src/components/**',
    '!src/index.ts',
    '!src/setupTests.ts',
    '!**/*.stories.*',
    '!**/__tests__/**'
  ],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|scss|sass)$': 'identity-obj-proxy',
  },

  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'coverage', outputName: 'junit.xml' }],
  ],
};
