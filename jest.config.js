// eslint-disable-next-line import/no-commonjs
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  testMatch: ['<rootDir>/src/**/*.test.[jt]s'],
  globalSetup: '<rootDir>/jest.setup.ts',
};
