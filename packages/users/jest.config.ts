import { resolve } from 'path';

export default {
  globalTeardown: resolve(__dirname, '../../jest.teardown-init.js'),

  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest'
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx']
};
