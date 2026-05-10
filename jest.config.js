const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^next-auth/react$': '<rootDir>/__mocks__/next-auth/react.ts',
    '^@nivo/line$': '<rootDir>/features/dashboard/__tests__/mocks/nivo.tsx',
    '^@nivo/bar$': '<rootDir>/features/dashboard/__tests__/mocks/nivo.tsx',
    '^@nivo/core$': '<rootDir>/features/dashboard/__tests__/mocks/nivo.tsx',
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'features/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
      },
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@nivo|d3-.*|internmap|delaunay|robust-predicates|next-auth|@auth)/)',
  ],
}

module.exports = createJestConfig(customJestConfig)
