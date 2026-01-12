import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Firebase before imports
vi.mock('../../../config/firebase.config.js', () => ({
  db: {
    collection: vi.fn(),
  },
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  addDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  Timestamp: {
    fromDate: vi.fn((date) => ({ toDate: () => date })),
  },
  serverTimestamp: vi.fn(() => ({ seconds: Date.now() / 1000 })),
}));

describe('DB Service', () => {
  let dbService: typeof import('../../../js/services/dbService.js');
  let localStorageMock: Storage;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock localStorage for cache testing
    const store: Record<string, string> = {};
    localStorageMock = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
      get length() {
        return Object.keys(store).length;
      },
      key: vi.fn((index: number) => Object.keys(store)[index] || null),
    };
    
    // Override localStorage
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  describe('saveUserProfile', () => {
    beforeEach(async () => {
      dbService = await import('../../../js/services/dbService.js');
    });

    it('should save user profile to cache and Firestore', async () => {
      const userId = 'user123';
      const profileData = {
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'athlete',
      };
      
      const firestore = await import('firebase/firestore');
      const mockSetDoc = vi.mocked(firestore.setDoc);
      mockSetDoc.mockResolvedValue(undefined);

      await dbService.saveUserProfile(userId, profileData);

      // Check cache was updated
      const cacheKey = `firestore_cache_profile_${userId}`;
      const cached = localStorage.getItem(cacheKey);
      expect(cached).toBeTruthy();
      
      // Check Firestore was called
      expect(mockSetDoc).toHaveBeenCalled();
    });
  });

  describe('getUserProfile', () => {
    beforeEach(async () => {
      dbService = await import('../../../js/services/dbService.js');
    });

    it('should return cached profile if available and fresh', async () => {
      const userId = 'user123';
      const profile = {
        id: userId,
        email: 'test@example.com',
        displayName: 'Test User',
      };
      
      const cacheKey = `firestore_cache_profile_${userId}`;
      const cachedData = {
        ...profile,
        _cachedAt: Date.now(), // Fresh cache
      };
      localStorage.setItem(cacheKey, JSON.stringify(cachedData));

      const result = await dbService.getUserProfile(userId);

      expect(result).toEqual(profile);
    });

    it('should return stale cache if returnStale is true', async () => {
      const userId = 'user123';
      const profile = {
        id: userId,
        email: 'test@example.com',
      };
      
      const cacheKey = `firestore_cache_profile_${userId}`;
      const cachedData = {
        ...profile,
        _cachedAt: Date.now() - 10 * 60 * 1000, // Stale cache (10 minutes old)
      };
      localStorage.setItem(cacheKey, JSON.stringify(cachedData));

      const result = await dbService.getUserProfile(userId, { returnStale: true });

      expect(result).toEqual(profile);
    });

    it('should fetch from Firestore if skipCache is true', async () => {
      const userId = 'user123';
      const firestore = await import('firebase/firestore');
      const mockGetDoc = vi.mocked(firestore.getDoc);
      
      const mockDocSnap = {
        exists: () => true,
        id: userId,
        data: () => ({ email: 'test@example.com' }),
      };
      mockGetDoc.mockResolvedValue(mockDocSnap as any);

      const result = await dbService.getUserProfile(userId, { skipCache: true });

      expect(mockGetDoc).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('saveTrainingSystem', () => {
    beforeEach(async () => {
      dbService = await import('../../../js/services/dbService.js');
    });

    it('should create new training system', async () => {
      const userId = 'user123';
      const trainingSystem = {
        name: 'Weekly Plan',
        sessions: [],
      };
      
      const firestore = await import('firebase/firestore');
      const mockAddDoc = vi.mocked(firestore.addDoc);
      mockAddDoc.mockResolvedValue({ id: 'system123' } as any);

      const systemId = await dbService.saveTrainingSystem(userId, trainingSystem);

      expect(mockAddDoc).toHaveBeenCalled();
      expect(systemId).toBe('system123');
    });

    it('should update existing training system', async () => {
      const userId = 'user123';
      const trainingSystem = {
        id: 'system123',
        name: 'Updated Plan',
        sessions: [],
      };
      
      const firestore = await import('firebase/firestore');
      const mockUpdateDoc = vi.mocked(firestore.updateDoc);
      mockUpdateDoc.mockResolvedValue(undefined);

      const systemId = await dbService.saveTrainingSystem(userId, trainingSystem);

      expect(mockUpdateDoc).toHaveBeenCalled();
      expect(systemId).toBe('system123');
    });
  });

  describe('getTrainingSystem', () => {
    beforeEach(async () => {
      dbService = await import('../../../js/services/dbService.js');
    });

    it('should return cached training system if available', async () => {
      const userId = 'user123';
      const systemId = 'system123';
      const system = {
        id: systemId,
        name: 'Weekly Plan',
      };
      
      const cacheKey = `firestore_cache_training_system_${userId}_${systemId}`;
      const cachedData = {
        ...system,
        _cachedAt: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(cachedData));

      const result = await dbService.getTrainingSystem(userId, systemId);

      expect(result).toEqual(system);
    });
  });

  describe('getAllTrainingSystems', () => {
    beforeEach(async () => {
      dbService = await import('../../../js/services/dbService.js');
    });

    it('should return cached training systems if available', async () => {
      const userId = 'user123';
      const systems = [
        { id: 'sys1', name: 'Plan 1' },
        { id: 'sys2', name: 'Plan 2' },
      ];
      
      const cacheKey = `firestore_cache_training_systems_${userId}`;
      const cachedData = {
        systems,
        _cachedAt: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(cachedData));

      const result = await dbService.getAllTrainingSystems(userId);

      expect(result).toEqual(systems);
    });

    it('should return empty array on network error if no cache', async () => {
      const userId = 'user123';
      const firestore = await import('firebase/firestore');
      const mockGetDocs = vi.mocked(firestore.getDocs);
      mockGetDocs.mockRejectedValue(new Error('Network request timeout'));

      const result = await dbService.getAllTrainingSystems(userId);

      expect(result).toEqual([]);
    });
  });

  describe('deleteTrainingSystem', () => {
    beforeEach(async () => {
      dbService = await import('../../../js/services/dbService.js');
    });

    it('should delete training system', async () => {
      const userId = 'user123';
      const systemId = 'system123';
      
      const firestore = await import('firebase/firestore');
      const mockDeleteDoc = vi.mocked(firestore.deleteDoc);
      mockDeleteDoc.mockResolvedValue(undefined);

      await dbService.deleteTrainingSystem(userId, systemId);

      expect(mockDeleteDoc).toHaveBeenCalled();
    });
  });

  describe('saveSession', () => {
    beforeEach(async () => {
      dbService = await import('../../../js/services/dbService.js');
    });

    it('should save session to training system', async () => {
      const userId = 'user123';
      const systemId = 'system123';
      const session = {
        id: 'session1',
        date: '2024-01-01',
        exercises: [],
      };
      
      const firestore = await import('firebase/firestore');
      const mockGetDoc = vi.mocked(firestore.getDoc);
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: systemId,
        data: () => ({
          id: systemId,
          sessions: [],
        }),
      } as any);

      // Mock saveTrainingSystem
      vi.spyOn(dbService, 'saveTrainingSystem').mockResolvedValue(systemId);

      const sessionId = await dbService.saveSession(userId, systemId, session);

      expect(sessionId).toBeDefined();
    });
  });

  describe('getSession', () => {
    beforeEach(async () => {
      dbService = await import('../../../js/services/dbService.js');
    });

    it('should get session from training system', async () => {
      const userId = 'user123';
      const systemId = 'system123';
      const sessionId = 'session1';
      const session = {
        id: sessionId,
        date: '2024-01-01',
      };
      
      vi.spyOn(dbService, 'getTrainingSystem').mockResolvedValue({
        id: systemId,
        sessions: [session],
      } as any);

      const result = await dbService.getSession(userId, systemId, sessionId);

      expect(result).toEqual(session);
    });

    it('should return null if session not found', async () => {
      const userId = 'user123';
      const systemId = 'system123';
      const sessionId = 'session1';
      
      vi.spyOn(dbService, 'getTrainingSystem').mockResolvedValue({
        id: systemId,
        sessions: [],
      } as any);

      const result = await dbService.getSession(userId, systemId, sessionId);

      expect(result).toBeNull();
    });
  });
});

