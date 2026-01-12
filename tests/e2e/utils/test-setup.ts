/**
 * Global Test Setup Utilities
 * 
 * Provides setup and teardown utilities for E2E tests.
 * Use this for tests that don't use the auth fixtures but still need clean state.
 */

import { test as baseTest } from '@playwright/test';
import { clearTestState } from './test-helpers';

/**
 * Enhanced test with automatic state cleanup
 * 
 * Use this instead of the base test if you need clean state but aren't using auth fixtures.
 * 
 * Example:
 * ```typescript
 * import { test } from '../utils/test-setup';
 * 
 * test('my test', async ({ page }) => {
 *   // State is automatically cleared before this test runs
 *   await page.goto('/');
 * });
 * ```
 */
export const test = baseTest.extend({
  // Override page to clear state before each test
  page: async ({ page }, use) => {
    await clearTestState(page);
    await use(page);
  },
});

