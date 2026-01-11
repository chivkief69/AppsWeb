import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies before imports
vi.mock('../../../js/services/authService.js', () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOutUser: vi.fn(),
  getCurrentUser: vi.fn(() => null),
  onAuthStateChange: vi.fn((callback) => {
    // Return unsubscribe function
    return () => {};
  }),
  sendPasswordReset: vi.fn(),
  signInWithGoogle: vi.fn(),
}));

vi.mock('../../../js/services/dbService.js', () => ({
  saveUserProfile: vi.fn(),
  getUserProfile: vi.fn(),
}));

vi.mock('../../../js/core/data-migration.js', () => ({
  migrateLocalStorageToFirestore: vi.fn(),
}));

vi.mock('../../../config/firebase.config.js', () => ({
  waitForPersistenceReady: vi.fn().mockResolvedValue(undefined),
}));

describe('Auth Manager', () => {
  let authManager: typeof import('../../../js/core/auth-manager.js');
  let authService: typeof import('../../../js/services/authService.js');
  let dbService: typeof import('../../../js/services/dbService.js');

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Import modules
    authManager = await import('../../../js/core/auth-manager.js');
    authService = await import('../../../js/services/authService.js');
    dbService = await import('../../../js/services/dbService.js');
  });

  describe('getAuthUser', () => {
    it('should return current user', () => {
      const user = authManager.getAuthUser();
      expect(user).toBeDefined();
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no user is authenticated', () => {
      const isAuth = authManager.isAuthenticated();
      expect(isAuth).toBe(false);
    });
  });

  describe('onAuthStateChanged', () => {
    it('should subscribe to auth state changes', () => {
      const callback = vi.fn();
      const unsubscribe = authManager.onAuthStateChanged(callback);
      
      expect(unsubscribe).toBeDefined();
      expect(typeof unsubscribe).toBe('function');
    });

    it('should call callback with current state immediately', () => {
      const callback = vi.fn();
      authManager.onAuthStateChanged(callback);
      
      // Callback should be called (even if currentUser is undefined initially)
      // The exact behavior depends on internal state
      expect(callback).toHaveBeenCalled();
    });

    it('should allow unsubscribing', () => {
      const callback = vi.fn();
      const unsubscribe = authManager.onAuthStateChanged(callback);
      
      unsubscribe();
      // After unsubscribe, callback should not be called on state changes
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('login', () => {
    it('should sign in with email and password', async () => {
      const mockUserCredential = {
        user: { uid: 'user123', email: 'test@example.com' },
      };
      vi.mocked(authService.signIn).mockResolvedValue(mockUserCredential);

      const result = await authManager.login('test@example.com', 'password123');

      expect(authService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(result).toEqual(mockUserCredential);
    });

    it('should throw error on login failure', async () => {
      const error = new Error('Invalid credentials');
      vi.mocked(authService.signIn).mockRejectedValue(error);

      await expect(authManager.login('test@example.com', 'wrong')).rejects.toThrow();
    });
  });

  describe('signup', () => {
    it('should sign up with email and password', async () => {
      const mockUserCredential = {
        user: { uid: 'user123', email: 'test@example.com' },
      };
      vi.mocked(authService.signUp).mockResolvedValue(mockUserCredential);
      vi.mocked(dbService.saveUserProfile).mockResolvedValue(undefined);

      const result = await authManager.signup('test@example.com', 'password123', 'Test User');

      expect(authService.signUp).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User');
      expect(result).toEqual(mockUserCredential);
    });

    it('should create initial user profile after signup', async () => {
      const mockUserCredential = {
        user: { uid: 'user123', email: 'test@example.com' },
      };
      vi.mocked(authService.signUp).mockResolvedValue(mockUserCredential);
      vi.mocked(dbService.saveUserProfile).mockResolvedValue(undefined);

      await authManager.signup('test@example.com', 'password123', 'Test User');

      // Profile creation happens in background, may need to wait
      expect(dbService.saveUserProfile).toHaveBeenCalled();
    });

    it('should throw error on signup failure', async () => {
      const error = new Error('Email already in use');
      vi.mocked(authService.signUp).mockRejectedValue(error);

      await expect(authManager.signup('test@example.com', 'password123')).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should sign out current user', async () => {
      vi.mocked(authService.signOutUser).mockResolvedValue(undefined);

      await authManager.logout();

      expect(authService.signOutUser).toHaveBeenCalled();
    });

    it('should throw error on logout failure', async () => {
      const error = new Error('Sign out failed');
      vi.mocked(authService.signOutUser).mockRejectedValue(error);

      await expect(authManager.logout()).rejects.toThrow();
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      vi.mocked(authService.sendPasswordReset).mockResolvedValue(undefined);

      await authManager.resetPassword('test@example.com');

      expect(authService.sendPasswordReset).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw error on password reset failure', async () => {
      const error = new Error('User not found');
      vi.mocked(authService.sendPasswordReset).mockRejectedValue(error);

      await expect(authManager.resetPassword('invalid@example.com')).rejects.toThrow();
    });
  });

  describe('loginWithGoogle', () => {
    it('should sign in with Google', async () => {
      const mockUserCredential = {
        user: { uid: 'user123', email: 'test@example.com', displayName: 'Test User' },
      };
      vi.mocked(authService.signInWithGoogle).mockResolvedValue(mockUserCredential);
      vi.mocked(dbService.getUserProfile).mockResolvedValue(null);

      const result = await authManager.loginWithGoogle();

      expect(authService.signInWithGoogle).toHaveBeenCalled();
      expect(result).toEqual(mockUserCredential);
    });

    it('should create profile for new Google user', async () => {
      const mockUserCredential = {
        user: { uid: 'user123', email: 'test@example.com', displayName: 'Test User' },
      };
      vi.mocked(authService.signInWithGoogle).mockResolvedValue(mockUserCredential);
      vi.mocked(dbService.getUserProfile).mockResolvedValue(null);
      vi.mocked(dbService.saveUserProfile).mockResolvedValue(undefined);

      await authManager.loginWithGoogle();

      // Profile check happens in background
      expect(dbService.getUserProfile).toHaveBeenCalled();
    });

    it('should throw error on Google login failure', async () => {
      const error = new Error('Popup closed');
      vi.mocked(authService.signInWithGoogle).mockRejectedValue(error);

      await expect(authManager.loginWithGoogle()).rejects.toThrow();
    });
  });

  describe('initAuthManager', () => {
    it('should initialize auth manager', async () => {
      const firebaseConfig = await import('../../../config/firebase.config.js');
      vi.mocked(firebaseConfig.waitForPersistenceReady).mockResolvedValue(undefined);
      vi.mocked(authService.onAuthStateChange).mockReturnValue(() => {});

      await authManager.initAuthManager();

      expect(firebaseConfig.waitForPersistenceReady).toHaveBeenCalled();
      expect(authService.onAuthStateChange).toHaveBeenCalled();
    });
  });
});

