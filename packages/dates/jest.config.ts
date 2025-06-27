import { resolve } from 'path';

export default {
  // Teardown function after all tests run
  globalTeardown: resolve(__dirname, '../../jest.teardown-init.mjs'),

  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest'
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx']
};
