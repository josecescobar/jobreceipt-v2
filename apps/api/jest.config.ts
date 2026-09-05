import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@jobreceipt/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '^@shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
    '^@api/(.*)$': '<rootDir>/src/$1',
  },
};

export default config;
