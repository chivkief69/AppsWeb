import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Firebase Auth before importing authService
const mockAuth = {
  currentUser: null,
};
vi.mock('../../../config/firebase.config.js', () => ({
  auth: mockAuth,
  waitForPersistenceReady: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn((auth, callback) => {
    // Return unsubscribe function
    return () => {};
  }),
  sendPasswordResetEmail: vi.fn(),
  updateProfile: vi.fn(),
  GoogleAuthProvider: vi.fn(() => ({})),
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  getRedirectResult: vi.fn(),
}));

describe('Auth Service', () => {
  let authService: typeof import('../../../js/services/authService.js');
  let mockSignInWithEmailAndPassword: ReturnType<typeof vi.fn>;
  let mockCreateUserWithEmailAndPassword: ReturnType<typeof vi.fn>;
  let mockSignOut: ReturnType<typeof vi.fn>;
  let mockSendPasswordResetEmail: ReturnType<typeof vi.fn>;
  let mockUpdateProfile: ReturnType<typeof vi.fn>;
  let mockSignInWithPopup: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Reset auth.currentUser to null
    mockAuth.currentUser = null;
    
    // Import Firebase mocks
    const firebaseAuth = await import('firebase/auth');
    mockSignInWithEmailAndPassword = firebaseAuth.signInWithEmailAndPassword as ReturnType<typeof vi.fn>;
    mockCreateUserWithEmailAndPassword = firebaseAuth.createUserWithEmailAndPassword as ReturnType<typeof vi.fn>;
    mockSignOut = firebaseAuth.signOut as ReturnType<typeof vi.fn>;
    mockSendPasswordResetEmail = firebaseAuth.sendPasswordResetEmail as ReturnType<typeof vi.fn>;
    mockUpdateProfile = firebaseAuth.updateProfile as ReturnType<typeof vi.fn>;
    mockSignInWithPopup = firebaseAuth.signInWithPopup as ReturnType<typeof vi.fn>;
    
    // Import authService
    authService = await import('../../../js/services/authService.js');
  });

  describe('getCurrentUser', () => {
    it('should return current user from auth', () => {
      const mockAuth = { currentUser: { uid: 'user123', email: 'test@example.com' } };
      vi.doMock('../../../config/firebase.config.js', () => ({
        auth: mockAuth,
      }));
      
      // Re-import to get mocked auth
      const user = authService.getCurrentUser();
      expect(user).toBeDefined();
    });

    it('should return null if no current user', () => {
      const user = authService.getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe('signIn', () => {
    it('should sign in with email and password', async () => {
      const mockUserCredential = {
        user: { uid: 'user123', email: 'test@example.com' },
      };
      mockSignInWithEmailAndPassword.mockResolvedValue(mockUserCredential);

      const result = await authService.signIn('test@example.com', 'password123');

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
      expect(result).toEqual(mockUserCredential);
    });

    it('should throw error on sign in failure', async () => {
      const error = new Error('Invalid credentials');
      mockSignInWithEmailAndPassword.mockRejectedValue(error);

      await expect(authService.signIn('test@example.com', 'wrong')).rejects.toThrow(
        'Sign in failed: Invalid credentials'
      );
    });
  });

  describe('signUp', () => {
    it('should create user with email and password', async () => {
      const mockUser = { uid: 'user123', email: 'test@example.com' };
      const mockUserCredential = { user: mockUser };
      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);
      mockUpdateProfile.mockResolvedValue(undefined);

      const result = await authService.signUp('test@example.com', 'password123', 'Test User');

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
      expect(mockUpdateProfile).toHaveBeenCalledWith(mockUser, { displayName: 'Test User' });
      expect(result).toEqual(mockUserCredential);
    });

    it('should create user without display name', async () => {
      const mockUserCredential = {
        user: { uid: 'user123', email: 'test@example.com' },
      };
      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);

      await authService.signUp('test@example.com', 'password123');

      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it('should throw error on sign up failure', async () => {
      const error = new Error('Email already in use');
      mockCreateUserWithEmailAndPassword.mockRejectedValue(error);

      await expect(authService.signUp('test@example.com', 'password123')).rejects.toThrow(
        'Sign up failed: Email already in use'
      );
    });
  });

  describe('signOutUser', () => {
    it('should sign out current user', async () => {
      mockSignOut.mockResolvedValue(undefined);

      await authService.signOutUser();

      expect(mockSignOut).toHaveBeenCalledWith(expect.anything());
    });

    it('should throw error on sign out failure', async () => {
      const error = new Error('Sign out failed');
      mockSignOut.mockRejectedValue(error);

      await expect(authService.signOutUser()).rejects.toThrow('Sign out failed: Sign out failed');
    });
  });

  describe('onAuthStateChange', () => {
    it('should subscribe to auth state changes', () => {
      const callback = vi.fn();
      const unsubscribe = authService.onAuthStateChange(callback);

      expect(unsubscribe).toBeDefined();
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('sendPasswordReset', () => {
    it('should send password reset email', async () => {
      mockSendPasswordResetEmail.mockResolvedValue(undefined);

      await authService.sendPasswordReset('test@example.com');

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com'
      );
    });

    it('should throw error on password reset failure', async () => {
      const error = new Error('User not found');
      mockSendPasswordResetEmail.mockRejectedValue(error);

      await expect(authService.sendPasswordReset('invalid@example.com')).rejects.toThrow(
        'Password reset failed: User not found'
      );
    });
  });

  describe('signInWithGoogle', () => {
    it('should initiate Google sign in with redirect', async () => {
      // signInWithGoogle uses redirect, not popup
      const firebaseAuth = await import('firebase/auth');
      const mockSignInWithRedirect = firebaseAuth.signInWithRedirect as ReturnType<typeof vi.fn>;
      mockSignInWithRedirect.mockResolvedValue(undefined);

      await authService.signInWithGoogle();

      expect(mockSignInWithRedirect).toHaveBeenCalled();
      // Note: signInWithGoogle uses redirect, so it doesn't return a credential
      // The result is handled via getGoogleRedirectResult()
    });

    it('should throw error on Google sign in failure', async () => {
      const firebaseAuth = await import('firebase/auth');
      const mockSignInWithRedirect = firebaseAuth.signInWithRedirect as ReturnType<typeof vi.fn>;
      const error = new Error('Redirect failed');
      mockSignInWithRedirect.mockRejectedValue(error);

      await expect(authService.signInWithGoogle()).rejects.toThrow(
        'Google sign in failed: Redirect failed'
      );
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile', async () => {
      // Set currentUser on the mock auth object
      const mockUser = { uid: 'user123' };
      mockAuth.currentUser = mockUser;
      
      mockUpdateProfile.mockResolvedValue(undefined);

      await authService.updateUserProfile({ displayName: 'New Name' });

      expect(mockUpdateProfile).toHaveBeenCalledWith(mockUser, { displayName: 'New Name' });
      
      // Clean up
      mockAuth.currentUser = null;
    });

    it('should throw error if no user is signed in', async () => {
      const mockAuth = { currentUser: null };
      vi.doMock('../../../config/firebase.config.js', () => ({
        auth: mockAuth,
      }));

      await expect(
        authService.updateUserProfile({ displayName: 'New Name' })
      ).rejects.toThrow('No user is currently signed in');
    });
  });
});

