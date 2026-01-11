/**
 * Vitest Global Test Setup
 * 
 * This file runs before all unit and integration tests.
 * Use this to configure mocks, global utilities, or test environment.
 */

// Mock Firebase if needed (can be extended)
global.console = {
  ...console,
  // Uncomment to silence console logs during tests
  // log: vi.fn(),
  // debug: vi.fn(),
  // info: vi.fn(),
  // warn: vi.fn(),
  // error: vi.fn(),
};

// Add any global test utilities or mocks here
export {};

