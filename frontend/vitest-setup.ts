import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import '@testing-library/jest-dom/vitest';

// Explicitly extend Vitest's expect with jest-dom
expect.extend(matchers);

// Automatically clean up the DOM after every test
afterEach(() => {
  cleanup();
});