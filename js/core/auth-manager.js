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
    console.log('[DEBUG] initAuthManager: Waiting for persistence to be ready...');
    
    // CRITICAL: Wait for persistence to be configured before setting up listeners
    // This ensures onAuthStateChanged fires with the correct persistence mode
    await waitForPersistenceReady();
    
    // REFACTORED: Respect Firebase's authentication state - DO NOT force sign out
    // Firebase's browserLocalPersistence handles session persistence correctly
    // We trust Firebase's state management instead of clearing it manually
    
    // Get the actual current user from Firebase (respects persistence)
    currentUser = getCurrentUser();
    
    console.log('[DEBUG] initAuthManager: Persistence ready, setting up onAuthStateChanged');
    console.log('[DEBUG] Initial currentUser state:', currentUser ? currentUser.uid : 'null');
    
    // Listen for auth state changes
    onAuthStateChange(async (user) => {
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
    
    // Note: currentUser is set to the actual Firebase auth state (getCurrentUser())
    // This respects Firebase's persistence and allows the session to persist across page reloads
    // onAuthStateChanged subscribers will receive the correct initial state from Firebase
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
    return currentUser != null; // Returns false for both null and undefined
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
 * Sign in with Google using popup
 * Opens a popup window for Google sign-in and returns the result immediately
 * @returns {Promise<import('firebase/auth').UserCredential>} User credential with authenticated user
 */
export async function loginWithGoogle() {
    try {
        // signInWithGoogle now uses popup, which returns credentials immediately
        const userCredential = await signInWithGoogle();
        // Profile creation will be handled in handleUserSignIn() via onAuthStateChanged
        return userCredential;
    } catch (error) {
        console.error('Google login error:', error);
        throw error;
    }
}

