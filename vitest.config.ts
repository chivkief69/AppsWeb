import { defineConfig } from 'vitest/config';
import path from 'path';

// Vitest Configuration
// 
// Scope: Unit and Integration tests only
// - tests/unit/**/*.test.ts
// - tests/integration/**/*.test.ts
// 
// This configuration will NOT execute E2E tests (those are handled by Playwright)
export default defineConfig({
  test: {
    // Test file patterns - only .test.ts files in unit/integration directories
    include: [
      'tests/unit/**/*.test.ts',
      'tests/integration/**/*.test.ts'
    ],
    
    // Exclude patterns to ensure no overlap with E2E tests
    exclude: [
      '**/tests/e2e/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**'
    ],
    
    // Test environment
    environment: 'jsdom',
    
    // Global test setup
    globals: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.*',
        '**/dist/**',
        '**/*.d.ts'
      ]
    },
    
    // Test timeout
    testTimeout: 10000,
    
    // Setup files
    setupFiles: ['./tests/unit/utils/test-setup.ts'],
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './js'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
});

