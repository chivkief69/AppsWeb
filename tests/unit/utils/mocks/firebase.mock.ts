/**
 * Firebase Mock Utilities
 * 
 * Mock implementations for Firebase services used in unit tests
 */

import { vi } from 'vitest';

export const mockFirebaseAuth = {
  currentUser: null,
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signInWithPopup: vi.fn(),
  onAuthStateChanged: vi.fn((callback) => {
    // Return unsubscribe function
    return () => {};
  }),
};

export const mockFirestore = {
  collection: vi.fn(() => ({
    doc: vi.fn(() => ({
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
    add: vi.fn(),
    where: vi.fn(() => ({
      get: vi.fn(),
    })),
  })),
};

export const mockFirebaseApp = {
  auth: () => mockFirebaseAuth,
  firestore: () => mockFirestore,
};

// Reset mocks helper
export function resetFirebaseMocks() {
  mockFirebaseAuth.currentUser = null;
  mockFirebaseAuth.signInWithEmailAndPassword.mockClear();
  mockFirebaseAuth.createUserWithEmailAndPassword.mockClear();
  mockFirebaseAuth.signOut.mockClear();
  mockFirebaseAuth.sendPasswordResetEmail.mockClear();
  mockFirebaseAuth.signInWithPopup.mockClear();
  mockFirebaseAuth.onAuthStateChanged.mockClear();
  mockFirestore.collection.mockClear();
}

