/**
 * Authentication Manager
 * 
 * Manages authentication state and flow throughout the application.
 * Handles login, signup, logout, and authentication state changes.
 */

import { 
    signIn, 
    signUp, 
    signOutUser, 
    getCurrentUser, 
    onAuthStateChange,
    sendPasswordReset,
    signInWithGoogle
} from '../services/authService.js';
import { saveUserProfile, getUserProfile } from '../services/dbService.js';
import { migrateLocalStorageToFirestore } from './data-migration.js';
import { waitForPersistenceReady } from '../../config/firebase.config.js';

// Auth state
// Initialize to undefined so onAuthStateChanged doesn't fire immediately
// until we've properly initialized the auth state
let currentUser = undefined;
let authStateListeners = [];

/**
 * Initialize authentication manager
 * Sets up auth state listener and checks for existing session
 * FIX: Waits for persistence to be configured before setting up listeners
 */
export async function initAuthManager() {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/915a47a4-1527-472d-b5cb-4d7f3b093620',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-manager.js:28',message:'initAuthManager called - waiting for persistence',data:{initialUser:getCurrentUser() ? getCurrentUser().uid : null,isE2E:typeof window !== 'undefined' && window.__E2E_TEST__ === true},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    console.log('[DEBUG] initAuthManager: Waiting for persistence to be ready...');
    
    // CRITICAL: Wait for persistence to be configured before setting up listeners
    // This ensures onAuthStateChanged fires with the correct persistence mode
    await waitForPersistenceReady();
    
    // FIX: In E2E mode, explicitly sign out any existing user to ensure clean state
    // This prevents onAuthStateChanged from firing with cached user state
    // CRITICAL: We must sign out BEFORE setting up onAuthStateChange listener
    const isE2ETest = typeof window !== 'undefined' && window.__E2E_TEST__ === true;
    if (isE2ETest) {
        console.log('[DEBUG] E2E mode detected - ensuring clean auth state');
        const existingUser = getCurrentUser();
        console.log('[DEBUG] E2E mode: Existing user before sign out:', existingUser ? existingUser.uid : 'null');
        
        if (existingUser) {
            console.log('[DEBUG] E2E mode: Signing out existing user to ensure clean state');
            try {
                await signOutUser();
                // Wait for sign out to fully propagate
                await new Promise(resolve => setTimeout(resolve, 200));
                
                // Verify sign out worked
                const userAfterSignOut = getCurrentUser();
                if (userAfterSignOut) {
                    console.error('[DEBUG] E2E mode: ERROR - User still exists after sign out!', userAfterSignOut.uid);
                    // Force set to null as fallback
                    currentUser = null;
                } else {
                    console.log('[DEBUG] E2E mode: User signed out successfully - verified null');
                    currentUser = null; // Explicitly set to null
                }
            } catch (error) {
                console.warn('[DEBUG] E2E mode: Failed to sign out:', error);
                // Force set to null as fallback
                currentUser = null;
            }
        } else {
            console.log('[DEBUG] E2E mode: No existing user to sign out - setting currentUser to null');
            currentUser = null; // Explicitly set to null in E2E mode
        }
    } else {
        // Not E2E mode - get actual current user
        currentUser = getCurrentUser();
    }
    
    console.log('[DEBUG] initAuthManager: Persistence ready, setting up onAuthStateChanged');
    console.log('[DEBUG] Final currentUser state before setting up listener:', currentUser ? currentUser.uid : 'null');
    console.log('[DEBUG] isE2ETest:', isE2ETest);
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/915a47a4-1527-472d-b5cb-4d7f3b093620',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-manager.js:32',message:'Persistence ready - setting up onAuthStateChange',data:{isE2E:isE2ETest,userAfterSignOut:getCurrentUser() ? getCurrentUser().uid : null,currentUserSet:currentUser ? currentUser.uid : null},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Listen for auth state changes
    onAuthStateChange(async (user) => {
        // #region agent log
        const authStateChangeTime = Date.now();
        fetch('http://127.0.0.1:7244/ingest/915a47a4-1527-472d-b5cb-4d7f3b093620',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-manager.js:35',message:'onAuthStateChange fired',data:{userId:user ? user.uid : null,previousUserId:currentUser ? currentUser.uid : null,hasUser:!!user},timestamp:authStateChangeTime,sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        const previousUser = currentUser;
        currentUser = user;
        
        console.log('Auth state changed:', user ? `User: ${user.uid}` : 'No user');
        
        // If user just signed in and we have localStorage data, migrate it
        if (user && !previousUser) {
            await handleUserSignIn(user);
        }
        
        // If user signed out, clear local state
        if (!user && previousUser) {
            handleUserSignOut();
        }
        
        // Notify all listeners
        notifyAuthStateListeners(user);
    });
    
    // Note: currentUser is already set above (before setting up listener)
    // In E2E mode, it's explicitly set to null
    // In normal mode, it's set to getCurrentUser()
    // This ensures onAuthStateChanged subscribers get the correct initial state
    if (currentUser) {
        console.log('User already signed in:', currentUser.uid);
    } else {
        console.log('[DEBUG] No user signed in - ready for auth overlay');
    }
}

/**
 * Handle user sign in - migrate data if needed
 * Non-blocking: Doesn't wait for Firestore, processes in background
 * @param {import('firebase/auth').User} user - Firebase user object
 */
async function handleUserSignIn(user) {
    // Process in background - don't block UI
    Promise.resolve().then(async () => {
        try {
            // Use cache-first pattern - returns immediately if cache exists
            const profile = await getUserProfile(user.uid, { returnStale: true });
            
            if (!profile) {
                // New user - check for localStorage data to migrate
                console.log('New user detected, checking for localStorage data to migrate...');
                // Migration can also be non-blocking
                migrateLocalStorageToFirestore(user.uid).catch(err => {
                    console.warn('Migration failed, will retry later:', err);
                });
            } else {
                console.log('User profile loaded (from cache or Firestore)');
            }
        } catch (error) {
            // Log but don't block - user is already signed in
            console.warn('Background profile check failed (non-critical):', error.message);
        }
    });
}

/**
 * Handle user sign out
 */
function handleUserSignOut() {
    console.log('User signed out');
    // Clear any local state if needed
    // Note: We don't clear localStorage here as it might be used for offline fallback
}

/**
 * Subscribe to authentication state changes
 * @param {Function} callback - Callback function (user) => void
 * @returns {Function} Unsubscribe function
 */
export function onAuthStateChanged(callback) {
    authStateListeners.push(callback);
    
    // Immediately call with current state
    if (currentUser !== undefined) {
        callback(currentUser);
    }
    
    // Return unsubscribe function
    return () => {
        const index = authStateListeners.indexOf(callback);
        if (index > -1) {
            authStateListeners.splice(index, 1);
        }
    };
}

/**
 * Notify all auth state listeners
 * @param {import('firebase/auth').User|null} user - Current user or null
 */
function notifyAuthStateListeners(user) {
    authStateListeners.forEach(callback => {
        try {
            callback(user);
        } catch (error) {
            console.error('Error in auth state listener:', error);
        }
    });
}

/**
 * Get current authenticated user
 * @returns {import('firebase/auth').User|null} Current user or null
 */
export function getAuthUser() {
    return currentUser;
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is authenticated
 */
export function isAuthenticated() {
    return currentUser !== null;
}

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function login(email, password) {
    try {
        const userCredential = await signIn(email, password);
        return userCredential;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

/**
 * Sign up with email and password
 * Non-blocking profile creation - doesn't wait for Firestore
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} displayName - User display name
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function signup(email, password, displayName) {
    try {
        const userCredential = await signUp(email, password, displayName);
        
        // Create initial user profile (non-blocking)
        if (userCredential.user) {
            // Save profile in background - don't block signup
            saveUserProfile(userCredential.user.uid, {
                email: email,
                displayName: displayName,
                role: null, // Will be set during onboarding
                preferredDisciplines: [],
                discomforts: [],
                equipment: [],
                goals: []
            }).catch(err => {
                console.warn('Profile creation failed (will retry):', err);
                // Don't throw - user is already signed up
            });
        }
        
        return userCredential;
    } catch (error) {
        console.error('Signup error:', error);
        throw error;
    }
}

/**
 * Sign out current user
 * @returns {Promise<void>}
 */
export async function logout() {
    try {
        await signOutUser();
    } catch (error) {
        console.error('Logout error:', error);
        throw error;
    }
}

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
export async function resetPassword(email) {
    try {
        await sendPasswordReset(email);
    } catch (error) {
        console.error('Password reset error:', error);
        throw error;
    }
}

/**
 * Sign in with Google
 * Non-blocking profile creation - doesn't wait for Firestore
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function loginWithGoogle() {
    try {
        const userCredential = await signInWithGoogle();
        
        // Create profile if new user (non-blocking)
        if (userCredential.user) {
            // Check profile in background - don't block login
            getUserProfile(userCredential.user.uid, { returnStale: true })
                .then(profile => {
                    if (!profile) {
                        // Create profile in background
                        saveUserProfile(userCredential.user.uid, {
                            email: userCredential.user.email,
                            displayName: userCredential.user.displayName,
                            role: null,
                            preferredDisciplines: [],
                            discomforts: [],
                            equipment: [],
                            goals: []
                        }).catch(err => {
                            console.warn('Profile creation failed (will retry):', err);
                        });
                    }
                })
                .catch(() => {
                    // Silently handle - profile check will happen in handleUserSignIn
                });
        }
        
        return userCredential;
    } catch (error) {
        console.error('Google login error:', error);
        throw error;
    }
}

