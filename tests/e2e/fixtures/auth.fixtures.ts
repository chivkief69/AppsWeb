import { test as base, expect, Page } from '@playwright/test';
import { AuthPage } from '../page-objects/auth.page';
import { clearTestState } from '../utils/test-helpers';

/**
 * Authentication Fixtures
 * 
 * Provides reusable authentication helpers for E2E tests.
 * Use these fixtures to quickly set up authenticated test states.
 * 
 * IMPORTANT: All tests using these fixtures will automatically have
 * their browser state cleared before each test to ensure clean state.
 * This includes:
 * - localStorage
 * - sessionStorage
 * - Firebase IndexedDB persistence
 * - Firebase Auth sign out
 */

type AuthFixtures = {
  authPage: AuthPage;
  loginAsAthlete: () => Promise<void>;
  loginAsCoach: () => Promise<void>;
  signupNewUser: (email: string, password: string, displayName: string) => Promise<void>;
};

export const test = base.extend<AuthFixtures>({
  // Override the page fixture to clear state before each test
  // This ensures Firebase Auth persistence doesn't interfere with tests
  page: async ({ page, context }, use) => {
    // Add initialization script to set E2E flag and clear storage before page scripts run
    // This runs before any page JavaScript executes
    await context.addInitScript(() => {
      // Set E2E test environment flag
      // This allows the app to detect E2E mode and use inMemoryPersistence for Firebase Auth
      (window as any).__E2E_TEST__ = true;
      
      // Clear localStorage and sessionStorage
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // Storage might not be available in all contexts
      }
      
      // Clear Firebase IndexedDB databases
      // This runs before Firebase initializes, preventing auth persistence
      (async () => {
        try {
          // Clear common Firebase Auth IndexedDB names
          const dbNames = [
            'firebaseLocalStorageDb',
            'firebaseLocalStorageDb:default',
            'firebase:authUser'
          ];
          
          for (const dbName of dbNames) {
            try {
              const deleteReq = indexedDB.deleteDatabase(dbName);
              await new Promise((resolve) => {
                deleteReq.onsuccess = () => resolve();
                deleteReq.onerror = () => resolve();
                deleteReq.onblocked = () => resolve();
                // Timeout after 500ms
                setTimeout(() => resolve(), 500);
              });
            } catch (e) {
              // Ignore individual database deletion errors
            }
          }
          
          // Also try to get all databases and clear Firebase-related ones
          try {
            const databases = await Promise.race([
              indexedDB.databases(),
              new Promise((resolve) => setTimeout(() => resolve([]), 1000))
            ]);
            
            for (const dbInfo of databases as IDBDatabaseInfo[]) {
              if (dbInfo.name && (
                dbInfo.name.includes('firebase') ||
                dbInfo.name.includes('firestore')
              )) {
                try {
                  const deleteReq = indexedDB.deleteDatabase(dbInfo.name);
                  await Promise.race([
                    new Promise((resolve) => {
                      deleteReq.onsuccess = () => resolve();
                      deleteReq.onerror = () => resolve();
                      deleteReq.onblocked = () => resolve();
                    }),
                    new Promise((resolve) => setTimeout(() => resolve(), 500))
                  ]);
                } catch (e) {
                  // Ignore errors
                }
              }
            }
          } catch (e) {
            // indexedDB.databases() might not be available
          }
        } catch (e) {
          // Silently fail - this is cleanup
        }
      })();
    });
    
    // Also clear cookies at context level
    try {
      await context.clearCookies();
    } catch (e) {
      // Ignore errors
    }
    
    await use(page);
  },

  // Auth page object
  authPage: async ({ page }, use) => {
    const authPage = new AuthPage(page);
    await use(authPage);
  },

  // Login as athlete helper
  loginAsAthlete: async ({ page, authPage }, use) => {
    await use(async () => {
      // Navigate to app
      await page.goto('/');
      
      // Wait for auth overlay
      await authPage.waitForAuthOverlay();
      
      // Login with test athlete credentials
      await authPage.login(
        process.env.TEST_ATHLETE_EMAIL || 'athlete@test.com',
        process.env.TEST_ATHLETE_PASSWORD || 'testpass123'
      );
      
      // Wait for role selection or dashboard (if role already set)
      await page.waitForTimeout(1000);
      
      // If role selection appears, select athlete
      const roleSelection = page.locator('#onboarding-role-selection');
      if (await roleSelection.isVisible()) {
        await page.click('[data-role="athlete"]');
        // Complete onboarding if needed
        await page.waitForTimeout(500);
      }
      
      // Wait for dashboard to load
      await page.waitForSelector('#page-home, #page-coach-home', { timeout: 10000 });
    });
  },

  // Login as coach helper
  loginAsCoach: async ({ page, authPage }, use) => {
    await use(async () => {
      // Navigate to app
      await page.goto('/');
      
      // Wait for auth overlay
      await authPage.waitForAuthOverlay();
      
      // Login with test coach credentials
      await authPage.login(
        process.env.TEST_COACH_EMAIL || 'coach@test.com',
        process.env.TEST_COACH_PASSWORD || 'testpass123'
      );
      
      // Wait for role selection or dashboard
      await page.waitForTimeout(1000);
      
      // If role selection appears, select coach
      const roleSelection = page.locator('#onboarding-role-selection');
      if (await roleSelection.isVisible()) {
        await page.click('[data-role="coach"]');
        await page.waitForTimeout(500);
      }
      
      // Wait for coach dashboard to load
      await page.waitForSelector('#page-coach-home', { timeout: 10000 });
    });
  },

  // Signup new user helper
  signupNewUser: async ({ page, authPage }, use) => {
    await use(async (email: string, password: string, displayName: string) => {
      await page.goto('/');
      await authPage.waitForAuthOverlay();
      await authPage.switchToSignup();
      await authPage.signup(email, password, displayName);
      await page.waitForTimeout(2000); // Wait for signup to complete
    });
  },
});

export { expect };

