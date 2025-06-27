export default {
  // Teardown function after all tests run
  // globalTeardown: '<rootDir>/jest.teardown-init.mjs',

  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest'
  },
  testEnvironmentOptions: {
    customExportConditions: ['node']
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  modulePathIgnorePatterns: ['__e2e__']
};
