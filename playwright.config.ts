import { defineConfig, devices } from '@playwright/test';

// Playwright Configuration
// 
// Scope: E2E tests only (tests/e2e/**/*.spec.ts)
// This configuration is strictly scoped to end-to-end tests and will NOT
// execute unit or integration tests.
export default defineConfig({
  // Test directory - ONLY e2e tests
  testDir: './tests/e2e',
  
  // Test file pattern - only .spec.ts files in e2e directory
  testMatch: /.*\.spec\.ts$/,
  
  // Exclude patterns to ensure no overlap with unit/integration tests
  testIgnore: [
    '**/tests/unit/**',
    '**/tests/integration/**',
    '**/node_modules/**',
    '**/dist/**'
  ],
  
  // Fully parallelize tests across files
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html'],
    ['list'],
    process.env.CI ? ['github'] : ['list']
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for the application
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

