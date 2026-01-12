import { Page } from '@playwright/test';

/**
 * E2E Test Helpers
 * 
 * Utility functions for E2E tests
 */

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Wait for element to be visible with timeout
 */
export async function waitForVisible(
  page: Page,
  selector: string,
  timeout: number = 5000
) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Wait for element to be hidden
 */
export async function waitForHidden(
  page: Page,
  selector: string,
  timeout: number = 5000
) {
  await page.waitForSelector(selector, { state: 'hidden', timeout });
}

/**
 * Generate unique test email
 */
export function generateTestEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}@test.com`;
}

/**
 * Wait for navigation to complete
 */
export async function waitForNavigation(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500); // Additional wait for SPA routing
}

/**
 * Clear all browser storage (localStorage, sessionStorage)
 * This ensures a clean state before each test
 * 
 * Uses Playwright's context storage API which is more reliable than page.evaluate
 */
export async function clearBrowserStorage(page: Page): Promise<void> {
  try {
    // Use Playwright's context storage API to clear storage
    const context = page.context();
    await context.clearCookies();
    
    // Clear storage after navigating to a page (if page is already loaded)
    // Otherwise, we'll clear it via IndexedDB cleanup
    try {
      // Try to clear via evaluate if page has a URL
      const url = page.url();
      if (url && url !== 'about:blank') {
        await page.evaluate(() => {
          try {
            localStorage.clear();
            sessionStorage.clear();
          } catch (e) {
            // Storage might not be accessible
          }
        });
      }
    } catch (e) {
      // Page might not be ready yet - that's okay
    }
  } catch (error) {
    // If clearing fails, continue anyway
    console.warn('Browser storage cleanup encountered an error (continuing anyway):', error);
  }
}

/**
 * Clear Firebase IndexedDB persistence
 * Firebase Auth stores authentication state in IndexedDB
 * This function clears all Firebase-related IndexedDB databases
 */
export async function clearFirebasePersistence(page: Page): Promise<void> {
  await page.evaluate(async () => {
    try {
      // Get all IndexedDB database names with a timeout
      let databases: IDBDatabaseInfo[] = [];
      try {
        // Use Promise.race to add a timeout
        databases = await Promise.race([
          indexedDB.databases(),
          new Promise<IDBDatabaseInfo[]>((resolve) => {
            setTimeout(() => resolve([]), 2000); // 2 second timeout
          })
        ]);
      } catch (e) {
        // indexedDB.databases() might not be available in all browsers
        databases = [];
      }
      
      // Clear Firebase-related databases
      // Firebase Auth typically uses databases with names like:
      // - firebaseLocalStorageDb
      // - firebase:authUser:[PROJECT_ID]:[default]
      // - firebaseLocalStorageDb:[PROJECT_ID]
      // - firestore/[PROJECT_ID]
      
      for (const dbInfo of databases) {
        if (dbInfo.name) {
          // Check if it's a Firebase-related database
          const isFirebaseDb = 
            dbInfo.name.includes('firebase') ||
            dbInfo.name.includes('firestore') ||
            dbInfo.name.startsWith('firebaseLocalStorageDb');
          
          if (isFirebaseDb) {
            // Close and delete the database with timeout
            try {
              const deleteReq = indexedDB.deleteDatabase(dbInfo.name);
              await Promise.race([
                new Promise<void>((resolve) => {
                  deleteReq.onsuccess = () => resolve();
                  deleteReq.onerror = () => resolve(); // Don't fail if deletion fails
                  deleteReq.onblocked = () => resolve();
                }),
                new Promise<void>((resolve) => {
                  setTimeout(() => resolve(), 1000); // 1 second timeout per database
                })
              ]);
            } catch (e) {
              // Ignore errors for individual database deletions
            }
          }
        }
      }
    } catch (error) {
      // IndexedDB might not be available in all contexts
      // Silently fail - this is cleanup, not critical
    }
  });
}

/**
 * Clear Firebase Auth persistence
 * This clears Firebase Auth state from IndexedDB without requiring the app to be loaded
 * 
 * Note: We don't try to call Firebase signOut() because that requires the app to be loaded.
 * Instead, we clear the IndexedDB persistence which effectively removes the auth token.
 */
export async function clearFirebaseAuthPersistence(page: Page): Promise<void> {
  try {
    await page.evaluate(async () => {
      try {
        // Clear Firebase Auth IndexedDB databases with timeout
        const dbName = 'firebaseLocalStorageDb';
        try {
          const deleteReq = indexedDB.deleteDatabase(dbName);
          await Promise.race([
            new Promise<void>((resolve) => {
              deleteReq.onsuccess = () => resolve();
              deleteReq.onerror = () => resolve(); // Don't fail if it doesn't exist
              deleteReq.onblocked = () => resolve();
            }),
            new Promise<void>((resolve) => {
              setTimeout(() => resolve(), 1000); // 1 second timeout
            })
          ]);
        } catch (e) {
          // IndexedDB might not be available
        }
        
        // Also try project-specific database names with timeout
        // Firebase Auth stores data in IndexedDB with project-specific names
        try {
          const databases = await Promise.race([
            indexedDB.databases(),
            new Promise<IDBDatabaseInfo[]>((resolve) => {
              setTimeout(() => resolve([]), 2000); // 2 second timeout
            })
          ]);
          
          for (const dbInfo of databases) {
            if (dbInfo.name && (
              dbInfo.name.includes('firebaseLocalStorageDb') ||
              dbInfo.name.includes('firebase:authUser')
            )) {
              try {
                const deleteReq = indexedDB.deleteDatabase(dbInfo.name);
                await Promise.race([
                  new Promise<void>((resolve) => {
                    deleteReq.onsuccess = () => resolve();
                    deleteReq.onerror = () => resolve();
                    deleteReq.onblocked = () => resolve();
                  }),
                  new Promise<void>((resolve) => {
                    setTimeout(() => resolve(), 1000); // 1 second timeout per database
                  })
                ]);
              } catch (e) {
                // Ignore errors
              }
            }
          }
        } catch (e) {
          // indexedDB.databases() might not be available in all browsers
        }
      } catch (error) {
        // Silently fail - this is cleanup, not critical
      }
    });
  } catch (error) {
    // If page.evaluate fails, the page might not be ready yet
    // This is acceptable - we'll still clear storage
  }
}

/**
 * Comprehensive state cleanup for tests
 * Clears all browser storage and Firebase persistence
 * 
 * This should be called in beforeEach hooks to ensure clean state
 * 
 * Note: We don't call Firebase signOut() because it requires the app to be loaded.
 * Clearing IndexedDB and localStorage is sufficient to remove auth state.
 */
export async function clearTestState(page: Page): Promise<void> {
  try {
    // Clear browser storage (localStorage, sessionStorage)
    await clearBrowserStorage(page);
    
    // Clear Firebase IndexedDB persistence (includes auth tokens)
    await clearFirebasePersistence(page);
    
    // Clear Firebase Auth specific persistence
    await clearFirebaseAuthPersistence(page);
  } catch (error) {
    // If cleanup fails, log but don't throw - tests should still run
    console.warn('State cleanup encountered an error (continuing anyway):', error);
  }
}

