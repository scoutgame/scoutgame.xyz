import { resolve } from 'path';

import { compilerOptions } from './tsconfig.json';

export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  globalTeardown: resolve(__dirname, '../../jest.teardown-init.mjs'),

  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: { baseUrl: '.', paths: compilerOptions.paths }
      }
    ]
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  modulePathIgnorePatterns: ['__e2e__']
};
