const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  testEnvironment: 'jsdom',
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^next-auth/react$': '<rootDir>/__mocks__/next-auth/react.ts',
    '^@nivo/line$': '<rootDir>/features/dashboard/__tests__/mocks/nivo.tsx',
    '^@nivo/bar$': '<rootDir>/features/dashboard/__tests__/mocks/nivo.tsx',
    '^@nivo/core$': '<rootDir>/features/dashboard/__tests__/mocks/nivo.tsx',
    '^@chatscope/chat-ui-kit-react$': '<rootDir>/features/messaging/__tests__/mocks/chatscope.tsx',
    '^@chatscope/chat-ui-kit-styles/.*$': '<rootDir>/features/messaging/__tests__/mocks/chatscope-styles.js',
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/integration/',
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
