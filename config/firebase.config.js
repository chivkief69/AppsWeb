/**
 * Firebase Configuration and Initialization
 * 
 * This file initializes Firebase services (Auth, Firestore) using environment variables.
 * Environment variables are loaded from .env file (via Vite's import.meta.env)
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence, 
  inMemoryPersistence, 
  browserLocalPersistence 
} from 'firebase/auth';
import { 
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate configuration
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(
  varName => !import.meta.env[varName]
);

if (missingVars.length > 0) {
  console.warn(
    '⚠️ Missing Firebase environment variables:',
    missingVars.join(', ')
  );
  console.warn(
    'Please create a .env file based on .env.example and fill in your Firebase credentials.'
  );
}

// Detect E2E test environment
// Playwright sets window.__E2E_TEST__ = true via context.addInitScript
// This runs before any page scripts execute, allowing us to configure persistence correctly
const isE2ETest = typeof window !== 'undefined' && window.__E2E_TEST__ === true;

// #region agent log
fetch('http://127.0.0.1:7244/ingest/915a47a4-1527-472d-b5cb-4d7f3b093620',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase.config.js:59',message:'E2E flag detection',data:{isE2ETest:isE2ETest,windowDefined:typeof window !== 'undefined',flagValue:typeof window !== 'undefined' ? window.__E2E_TEST__ : 'N/A'},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
// #endregion

// Log E2E detection for debugging (will show in test output)
console.log('[DEBUG] E2E test detection:', {
  isE2ETest,
  windowDefined: typeof window !== 'undefined',
  flagValue: typeof window !== 'undefined' ? window.__E2E_TEST__ : 'N/A'
});

// Initialize Firebase
let app;
let auth;
let db;
let persistenceEnabled = false;
let persistenceReadyPromise = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  // Set Firebase Auth persistence based on environment
  // CRITICAL: This must be called BEFORE any auth operations (onAuthStateChanged, signIn, etc.)
  // For E2E tests: Use inMemoryPersistence (no state persisted, clean state each test)
  // For production/dev: Use browserLocalPersistence (normal browser persistence)
  // 
  // FIX: setPersistence is async and MUST complete before any auth operations.
  // We create a promise that resolves when persistence is ready, and export a function
  // to wait for it. This ensures onAuthStateChanged doesn't fire with stale state.
  const persistence = isE2ETest ? inMemoryPersistence : browserLocalPersistence;
  
  // #region agent log
  const persistenceStartTime = Date.now();
  fetch('http://127.0.0.1:7244/ingest/915a47a4-1527-472d-b5cb-4d7f3b093620',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase.config.js:80',message:'setPersistence called',data:{isE2ETest:isE2ETest,persistenceType:isE2ETest ? 'inMemoryPersistence' : 'browserLocalPersistence',currentUser:auth.currentUser ? auth.currentUser.uid : null},timestamp:persistenceStartTime,sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  // Create promise that resolves when persistence is ready
  console.log('[DEBUG] Setting persistence:', isE2ETest ? 'inMemoryPersistence' : 'browserLocalPersistence');
  persistenceReadyPromise = setPersistence(auth, persistence).then(() => {
    // #region agent log
    const persistenceEndTime = Date.now();
    fetch('http://127.0.0.1:7244/ingest/915a47a4-1527-472d-b5cb-4d7f3b093620',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase.config.js:91',message:'setPersistence completed',data:{isE2ETest:isE2ETest,persistenceType:isE2ETest ? 'inMemoryPersistence' : 'browserLocalPersistence',duration:persistenceEndTime - persistenceStartTime,currentUser:auth.currentUser ? auth.currentUser.uid : null},timestamp:persistenceEndTime,sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    if (isE2ETest) {
      console.log('✅ Firebase Auth using inMemoryPersistence (E2E test mode)');
      console.log('[DEBUG] Persistence configured in', persistenceEndTime - persistenceStartTime, 'ms');
    } else {
      console.log('✅ Firebase Auth using browserLocalPersistence (normal mode)');
    }
  }).catch((persistenceError) => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/915a47a4-1527-472d-b5cb-4d7f3b093620',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'firebase.config.js:102',message:'setPersistence failed',data:{error:persistenceError.message,isE2ETest:isE2ETest},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // If setPersistence fails, log but don't throw - allow auth to proceed
    // This can happen if persistence is already set or if there's a conflict
    console.warn('⚠️ Failed to set Firebase Auth persistence:', persistenceError);
    console.warn('[DEBUG] Error details:', {
      message: persistenceError.message,
      code: persistenceError.code,
      isE2ETest
    });
    console.warn('[DEBUG] Continuing with default persistence behavior');
    // Don't throw - the promise will reject but waitForPersistenceReady handles it
  });
  
  // Initialize Firestore with persistent cache (new API)
  // This replaces enableIndexedDbPersistence() which is deprecated
  // Uses persistentLocalCache for offline support and better performance
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
    persistenceEnabled = true;
    console.log('✅ Firestore persistence enabled (using new API)');
  } catch (persistenceError) {
    // Fallback: If persistence initialization fails, use standard Firestore
    // This can happen if multiple tabs are open or browser doesn't support it
    console.warn('⚠️ Firestore persistence initialization failed, using standard Firestore:', persistenceError);
    db = getFirestore(app);
    persistenceEnabled = false;
  }
  
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  throw new Error('Failed to initialize Firebase. Check your configuration.');
}

// Export function to check persistence status
export function isPersistenceEnabled() {
  return persistenceEnabled;
}

/**
 * Wait for Firebase Auth persistence to be configured
 * CRITICAL: Call this before setting up onAuthStateChanged listeners
 * @returns {Promise<void>}
 */
export async function waitForPersistenceReady() {
  if (persistenceReadyPromise) {
    try {
      await persistenceReadyPromise;
      console.log('[DEBUG] Persistence ready - auth operations can proceed');
    } catch (error) {
      console.error('[DEBUG] Persistence setup failed:', error);
      // Don't throw - allow auth to proceed with default behavior
      // This handles cases where setPersistence fails (e.g., already set)
    }
  } else {
    console.warn('[DEBUG] persistenceReadyPromise is null - persistence may not be configured');
    // If promise is null, wait a bit for it to be created (shouldn't happen, but defensive)
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Export Firebase services
export { app, auth, db };
