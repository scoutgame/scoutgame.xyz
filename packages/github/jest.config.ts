export default {
  // Teardown function after all tests run
  // globalTeardown: '<rootDir>/jest.teardown-init.mjs',
  transform: {
    '^.+.(t|j)sx?$': '@swc/jest'
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  testMatch: ['**/__tests__/**/*.spec.ts']
};
