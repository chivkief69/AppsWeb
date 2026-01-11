/**
 * Database Service
 * 
 * Service layer abstraction for Firestore operations.
 * This service wraps Firestore methods to provide a clean API for the UI layer.
 * 
 * Benefits:
 * - UI components never directly import Firestore
 * - Centralized data access patterns
 * - Consistent error handling
 * - Easy to add caching, offline support, etc.
 * 
 * Architecture:
 * - Uses sub-collections for user-specific data (users/{uid}/workouts, etc.)
 * - Provides CRUD operations for all data models
 * - Handles data transformation between app format and Firestore format
 */

import { db } from '../../config/firebase.config.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';

// ============================================================================
// CACHE-FIRST PATTERN IMPLEMENTATION
// ============================================================================

/**
 * Cache storage keys
 */
const CACHE_KEYS = {
  PROFILE: (userId) => `firestore_cache_profile_${userId}`,
  TRAINING_SYSTEM: (userId) => `firestore_cache_training_system_${userId}`,
  TRAINING_SYSTEMS: (userId) => `firestore_cache_training_systems_${userId}`
};

/**
 * Cache TTL (Time To Live) in milliseconds
 * Data is considered stale after this time
 */
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Network request timeout in milliseconds
 * Increased to 6 seconds to accommodate slower connections (e.g., gym WiFi)
 */
const NETWORK_TIMEOUT = 6000; // 6 seconds

/**
 * Check if data is stale based on timestamp
 * @param {Object} cachedData - Cached data object with _cachedAt timestamp
 * @returns {boolean} True if data is stale
 */
function isCacheStale(cachedData) {
  if (!cachedData || !cachedData._cachedAt) return true;
  return Date.now() - cachedData._cachedAt > CACHE_TTL;
}

/**
 * Save data to cache
 * @param {string} key - Cache key
 * @param {*} data - Data to cache
 */
function saveToCache(key, data) {
  try {
    const cachedData = {
      ...data,
      _cachedAt: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(cachedData));
  } catch (error) {
    console.warn('Failed to save to cache:', error);
    // Ignore quota exceeded errors silently
  }
}

/**
 * Get data from cache
 * @param {string} key - Cache key
 * @returns {Object|null} Cached data or null
 */
function getFromCache(key) {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const parsed = JSON.parse(cached);
    // Remove internal cache metadata before returning
    const { _cachedAt, ...data } = parsed;
    return data;
  } catch (error) {
    console.warn('Failed to read from cache:', error);
    return null;
  }
}

/**
 * Check if cache exists and is valid
 * @param {string} key - Cache key
 * @returns {boolean} True if cache exists and is valid
 */
function hasValidCache(key) {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return false;
    
    const parsed = JSON.parse(cached);
    return !isCacheStale(parsed);
  } catch {
    return false;
  }
}

/**
 * Promise with timeout
 * @param {Promise} promise - Promise to wrap
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise} Promise that rejects on timeout
 */
function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Network request timeout')), timeoutMs)
    )
  ]);
}

/**
 * Check if error indicates offline status
 * @param {Error} error - Error object
 * @returns {boolean} True if error indicates offline
 */
function isOfflineError(error) {
  return error.message && (
    error.message.includes('offline') ||
    error.message.includes('Failed to get document') ||
    error.message.includes('Network request timeout')
  );
}

// ============================================================================
// COLLECTION PATHS
// ============================================================================

/**
 * Get user document reference
 * @param {string} userId - User ID (Firebase Auth UID)
 * @returns {import('firebase/firestore').DocumentReference}
 */
function getUserDocRef(userId) {
  return doc(db, 'users', userId);
}

/**
 * Get user profile sub-collection reference
 * @param {string} userId - User ID
 * @returns {import('firebase/firestore').CollectionReference}
 */
function getUserProfileRef(userId) {
  return collection(db, 'users', userId, 'profile');
}

/**
 * Get user workouts sub-collection reference
 * @param {string} userId - User ID
 * @returns {import('firebase/firestore').CollectionReference}
 */
function getUserWorkoutsRef(userId) {
  return collection(db, 'users', userId, 'workouts');
}

/**
 * Get user training systems sub-collection reference
 * @param {string} userId - User ID
 * @returns {import('firebase/firestore').CollectionReference}
 */
function getUserTrainingSystemsRef(userId) {
  return collection(db, 'users', userId, 'trainingSystems');
}

/**
 * Get user sessions sub-collection reference (within a workout)
 * @param {string} userId - User ID
 * @param {string} workoutId - Workout ID
 * @returns {import('firebase/firestore').CollectionReference}
 */
function getUserSessionsRef(userId, workoutId) {
  return collection(db, 'users', userId, 'workouts', workoutId, 'sessions');
}

// ============================================================================
// USER PROFILE OPERATIONS
// ============================================================================

/**
 * Create or update user profile
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data
 * @returns {Promise<void>}
 */
export async function saveUserProfile(userId, profileData) {
  const cacheKey = CACHE_KEYS.PROFILE(userId);
  
  try {
    // Optimistically update cache
    const updatedProfile = { id: userId, ...profileData };
    saveToCache(cacheKey, updatedProfile);
    
    // Save to Firestore
    const userRef = getUserDocRef(userId);
    await withTimeout(setDoc(userRef, {
      ...profileData,
      updatedAt: serverTimestamp()
    }, { merge: true }), NETWORK_TIMEOUT);
    
    // Update cache timestamp after successful save
    saveToCache(cacheKey, updatedProfile);
  } catch (error) {
    // If save fails, try to keep cached data
    if (isOfflineError(error)) {
      console.warn('Offline detected while saving profile, data cached locally');
      // Cache is already updated optimistically, so data is available locally
      // This will sync when network is available (Firestore persistence handles this)
      return;
    }
    
    console.error('Error saving user profile:', error);
    throw new Error(`Failed to save profile: ${error.message}`);
  }
}

/**
 * Get user profile
 * Implements Cache-First pattern: Returns cached data immediately, updates from Firestore in background
 * @param {string} userId - User ID
 * @param {Object} options - Options { skipCache: boolean, returnStale: boolean }
 * @returns {Promise<Object|null>} User profile or null
 */
export async function getUserProfile(userId, options = {}) {
  const cacheKey = CACHE_KEYS.PROFILE(userId);
  const { skipCache = false, returnStale = true } = options;
  
  // STEP 1: Return cached data immediately if available (Cache-First)
  if (!skipCache) {
    const cached = getFromCache(cacheKey);
    if (cached) {
      // If cache is valid, return immediately and update in background
      if (!isCacheStale({ _cachedAt: JSON.parse(localStorage.getItem(cacheKey))._cachedAt })) {
        // Update from network in background (fire and forget)
        fetchUserProfileFromFirestore(userId, cacheKey).catch(() => {
          // Silently fail - we already have cached data
        });
        return cached;
      } else if (returnStale) {
        // Cache is stale but return it anyway, update in background
        fetchUserProfileFromFirestore(userId, cacheKey).catch(() => {
          // Silently fail - we'll return stale data
        });
        return cached;
      }
    }
  }
  
  // STEP 2: Fetch from Firestore (cache miss or skipCache=true)
  return await fetchUserProfileFromFirestore(userId, cacheKey);
}

/**
 * Fetch user profile from Firestore and update cache
 * @param {string} userId - User ID
 * @param {string} cacheKey - Cache key
 * @returns {Promise<Object|null>} User profile or null
 */
async function fetchUserProfileFromFirestore(userId, cacheKey) {
  try {
    const userRef = getUserDocRef(userId);
    const userSnap = await withTimeout(getDoc(userRef), NETWORK_TIMEOUT);
    
    if (userSnap.exists()) {
      const profile = { id: userSnap.id, ...userSnap.data() };
      // Update cache for next time
      saveToCache(cacheKey, profile);
      return profile;
    }
    
    // Document doesn't exist - clear cache
    localStorage.removeItem(cacheKey);
    return null;
  } catch (error) {
    // If offline/timeout, return cached data if available
    if (isOfflineError(error)) {
      const cached = getFromCache(cacheKey);
      if (cached) {
        console.warn('Offline detected, returning cached profile');
        return cached;
      }
    }
    
    console.error('Error getting user profile:', error);
    throw new Error(`Failed to get profile: ${error.message}`);
  }
}

// ============================================================================
// TRAINING SYSTEM OPERATIONS
// ============================================================================

/**
 * Save training system
 * @param {string} userId - User ID
 * @param {Object} trainingSystem - Training system object
 * @returns {Promise<string>} Training system ID
 */
export async function saveTrainingSystem(userId, trainingSystem) {
  try {
    const systemsRef = getUserTrainingSystemsRef(userId);
    
    // Convert dates to Firestore Timestamps
    const systemData = {
      ...trainingSystem,
      startDate: trainingSystem.startDate ? Timestamp.fromDate(new Date(trainingSystem.startDate)) : null,
      createdAt: trainingSystem.createdAt ? Timestamp.fromDate(new Date(trainingSystem.createdAt)) : serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    let systemId;
    if (trainingSystem.id) {
      // Update existing
      const systemRef = doc(systemsRef, trainingSystem.id);
      await withTimeout(updateDoc(systemRef, systemData), NETWORK_TIMEOUT);
      systemId = trainingSystem.id;
    } else {
      // Create new
      const docRef = await withTimeout(addDoc(systemsRef, systemData), NETWORK_TIMEOUT);
      systemId = docRef.id;
    }
    
    // Update cache optimistically
    const cacheKey = `${CACHE_KEYS.TRAINING_SYSTEM(userId)}_${systemId}`;
    const cachedSystem = {
      ...trainingSystem,
      id: systemId,
      startDate: trainingSystem.startDate,
      createdAt: trainingSystem.createdAt || new Date().toISOString()
    };
    saveToCache(cacheKey, cachedSystem);
    
    // Also invalidate the list cache
    localStorage.removeItem(CACHE_KEYS.TRAINING_SYSTEMS(userId));
    
    return systemId;
  } catch (error) {
    if (isOfflineError(error)) {
      console.warn('Offline detected while saving training system, data cached locally');
      // Cache will be updated when network is available
      return trainingSystem.id || `temp-${Date.now()}`;
    }
    
    console.error('Error saving training system:', error);
    throw new Error(`Failed to save training system: ${error.message}`);
  }
}

/**
 * Get training system by ID
 * Implements Cache-First pattern
 * @param {string} userId - User ID
 * @param {string} systemId - Training system ID
 * @param {Object} options - Options { skipCache: boolean, returnStale: boolean }
 * @returns {Promise<Object|null>} Training system or null
 */
export async function getTrainingSystem(userId, systemId, options = {}) {
  const cacheKey = `${CACHE_KEYS.TRAINING_SYSTEM(userId)}_${systemId}`;
  const { skipCache = false, returnStale = true } = options;
  
  // STEP 1: Return cached data immediately if available
  if (!skipCache) {
    const cached = getFromCache(cacheKey);
    if (cached) {
      if (!isCacheStale({ _cachedAt: JSON.parse(localStorage.getItem(cacheKey))._cachedAt })) {
        // Update in background
        fetchTrainingSystemFromFirestore(userId, systemId, cacheKey).catch(() => {});
        return cached;
      } else if (returnStale) {
        // Return stale, update in background
        fetchTrainingSystemFromFirestore(userId, systemId, cacheKey).catch(() => {});
        return cached;
      }
    }
  }
  
  // STEP 2: Fetch from Firestore
  return await fetchTrainingSystemFromFirestore(userId, systemId, cacheKey);
}

/**
 * Fetch training system from Firestore and update cache
 */
async function fetchTrainingSystemFromFirestore(userId, systemId, cacheKey) {
  try {
    const systemsRef = getUserTrainingSystemsRef(userId);
    const systemRef = doc(systemsRef, systemId);
    const systemSnap = await withTimeout(getDoc(systemRef), NETWORK_TIMEOUT);
    
    if (systemSnap.exists()) {
      const data = systemSnap.data();
      // Convert Firestore Timestamps to ISO strings
      const system = {
        id: systemSnap.id,
        ...data,
        startDate: data.startDate?.toDate?.()?.toISOString() || data.startDate,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
      };
      
      saveToCache(cacheKey, system);
      return system;
    }
    
    localStorage.removeItem(cacheKey);
    return null;
  } catch (error) {
    if (isOfflineError(error)) {
      const cached = getFromCache(cacheKey);
      if (cached) {
        console.warn('Offline detected, returning cached training system');
        return cached;
      }
    }
    
    console.error('Error getting training system:', error);
    throw new Error(`Failed to get training system: ${error.message}`);
  }
}

/**
 * Get all training systems for a user
 * Implements Cache-First pattern (Stale-While-Revalidate)
 * Always returns immediately with cache if available, updates in background
 * @param {string} userId - User ID
 * @param {Object} options - Options { skipCache: boolean, returnStale: boolean }
 * @returns {Promise<Array>} Array of training systems
 */
export async function getAllTrainingSystems(userId, options = {}) {
  const cacheKey = CACHE_KEYS.TRAINING_SYSTEMS(userId);
  const { skipCache = false, returnStale = true } = options;
  
  // STEP 1: Return cached data immediately if available (CACHE-FIRST)
  if (!skipCache) {
    const cached = getFromCache(cacheKey);
    if (cached && Array.isArray(cached)) {
      // Check if cache is valid
      const cacheItem = localStorage.getItem(cacheKey);
      if (cacheItem) {
        try {
          const parsed = JSON.parse(cacheItem);
          const isStale = isCacheStale(parsed);
          
          if (!isStale) {
            // Cache is fresh - return immediately, update in background
            fetchAllTrainingSystemsFromFirestore(userId, cacheKey).catch(() => {});
            return cached;
          } else if (returnStale) {
            // Cache is stale but return it anyway (STALE-WHILE-REVALIDATE)
            // Update in background
            fetchAllTrainingSystemsFromFirestore(userId, cacheKey).catch(() => {});
            return cached;
          }
        } catch (e) {
          // Invalid cache format, continue to fetch
        }
      }
    }
  }
  
  // STEP 2: No cache available - fetch from Firestore
  // fetchAllTrainingSystemsFromFirestore will return cached data if network fails
  return await fetchAllTrainingSystemsFromFirestore(userId, cacheKey);
}

/**
 * Fetch all training systems from Firestore and update cache
 * Returns cached data if network fails (even if stale)
 * Optimized query with limit to improve performance
 */
async function fetchAllTrainingSystemsFromFirestore(userId, cacheKey) {
  try {
    const systemsRef = getUserTrainingSystemsRef(userId);
    // Optimize query: limit to 50 most recent systems, order by creation date
    // This reduces data transfer and improves response time
    const q = query(
      systemsRef, 
      orderBy('createdAt', 'desc'),
      limit(50) // Limit to prevent fetching excessive data
    );
    const querySnapshot = await withTimeout(getDocs(q), NETWORK_TIMEOUT);
    
    const systems = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate?.()?.toISOString() || data.startDate,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
      };
    });
    
    saveToCache(cacheKey, systems);
    return systems;
  } catch (error) {
    // CRITICAL: Always check for cached data on ANY network error
    // This ensures users can see their training systems even if network fails
    const cached = getFromCache(cacheKey);
    if (cached && Array.isArray(cached)) {
      if (isOfflineError(error)) {
        console.warn('⚠️ Offline detected, returning cached training systems');
      } else {
        console.warn('⚠️ Network error, returning cached training systems:', error.message);
      }
      return cached;
    }
    
    // No cache available: This is expected for first-time users or when cache was cleared
    // Use warning instead of error - this is not a critical failure
    if (isOfflineError(error)) {
      console.warn('⚠️ Network timeout - no cached training systems available. This is normal for new users.');
    } else {
      console.warn('⚠️ Could not load training systems (network issue). This is normal for new users or when offline.');
    }
    
    // Return empty array - better UX than error for first-time users
    // The UI should handle empty arrays gracefully
    return [];
  }
}

/**
 * Delete training system
 * @param {string} userId - User ID
 * @param {string} systemId - Training system ID
 * @returns {Promise<void>}
 */
export async function deleteTrainingSystem(userId, systemId) {
  try {
    const systemsRef = getUserTrainingSystemsRef(userId);
    const systemRef = doc(systemsRef, systemId);
    await deleteDoc(systemRef);
  } catch (error) {
    console.error('Error deleting training system:', error);
    throw new Error(`Failed to delete training system: ${error.message}`);
  }
}

// ============================================================================
// SESSION OPERATIONS
// ============================================================================

/**
 * Save session (within a training system)
 * @param {string} userId - User ID
 * @param {string} systemId - Training system ID
 * @param {Object} session - Session object
 * @returns {Promise<string>} Session ID
 */
export async function saveSession(userId, systemId, session) {
  try {
    // Sessions are stored as part of the training system's sessions array
    // For now, we'll update the entire training system
    // Future: Could store sessions as sub-collection if needed for scalability
    const system = await getTrainingSystem(userId, systemId);
    if (!system) {
      throw new Error('Training system not found');
    }
    
    // Update or add session in sessions array
    const sessions = system.sessions || [];
    const sessionIndex = sessions.findIndex(s => s.id === session.id || s.date === session.date);
    
    if (sessionIndex >= 0) {
      sessions[sessionIndex] = session;
    } else {
      sessions.push(session);
    }
    
    system.sessions = sessions;
    await saveTrainingSystem(userId, system);
    
    return session.id || `session-${Date.now()}`;
  } catch (error) {
    console.error('Error saving session:', error);
    throw new Error(`Failed to save session: ${error.message}`);
  }
}

/**
 * Get session by ID
 * @param {string} userId - User ID
 * @param {string} systemId - Training system ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object|null>} Session or null
 */
export async function getSession(userId, systemId, sessionId) {
  try {
    const system = await getTrainingSystem(userId, systemId);
    if (!system || !system.sessions) {
      return null;
    }
    
    return system.sessions.find(s => s.id === sessionId || s.date === sessionId) || null;
  } catch (error) {
    console.error('Error getting session:', error);
    throw new Error(`Failed to get session: ${error.message}`);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert Firestore document to plain object
 * @param {import('firebase/firestore').DocumentSnapshot} docSnap - Firestore document
 * @returns {Object} Plain object
 */
function docToObject(docSnap) {
  if (!docSnap.exists()) {
    return null;
  }
  
  const data = docSnap.data();
  // Convert Timestamps to ISO strings
  const converted = { ...data };
  Object.keys(converted).forEach(key => {
    if (converted[key]?.toDate) {
      converted[key] = converted[key].toDate().toISOString();
    }
  });
  
  return {
    id: docSnap.id,
    ...converted
  };
}

