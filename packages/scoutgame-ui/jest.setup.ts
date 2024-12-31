import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

import { configure } from '@testing-library/react';

// @ts-ignore expose global Node.js elements to js-dom environment
global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;

configure({
  // Align data-test attribute with Playwright
  testIdAttribute: 'data-test'
});
