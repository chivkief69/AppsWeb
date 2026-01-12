import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as storageModule from '../../../js/core/storage.js';

describe('Storage', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Mock getAuthUser
    vi.mock('../../../js/core/auth-manager.js', () => ({
      getAuthUser: vi.fn(() => null),
    }));
    
    // Mock dbService
    vi.mock('../../../js/services/dbService.js', () => ({
      getUserProfile: vi.fn(),
      saveUserProfile: vi.fn(),
      getTrainingSystem: vi.fn(),
      saveTrainingSystem: vi.fn(),
      getAllTrainingSystems: vi.fn(),
    }));
  });

  describe('getUserRole', () => {
    it('should return role from localStorage immediately', async () => {
      localStorage.setItem('userRole', 'athlete');
      const role = await storageModule.getUserRole();
      expect(role).toBe('athlete');
    });

    it('should return null if no role in localStorage', async () => {
      const role = await storageModule.getUserRole();
      expect(role).toBeNull();
    });
  });

  describe('setUserRole', () => {
    it('should save role to localStorage immediately', async () => {
      await storageModule.setUserRole('coach');
      expect(localStorage.getItem('userRole')).toBe('coach');
    });
  });

  describe('getOnboardingData', () => {
    it('should return onboarding data from localStorage', () => {
      const data = { discomforts: ['Back'], primaryDiscipline: ['Pilates'] };
      localStorage.setItem('onboardingData', JSON.stringify(data));
      
      const result = storageModule.getOnboardingData();
      expect(result).toEqual(data);
    });

    it('should return null if no onboarding data', () => {
      const result = storageModule.getOnboardingData();
      expect(result).toBeNull();
    });
  });

  describe('saveOnboardingData', () => {
    it('should save onboarding data to localStorage', () => {
      const data = { discomforts: ['Back'], primaryDiscipline: ['Pilates'] };
      storageModule.saveOnboardingData(data);
      
      const stored = localStorage.getItem('onboardingData');
      expect(JSON.parse(stored!)).toEqual(data);
    });
  });

  describe('getCalendarViewPreference', () => {
    it('should return stored preference', () => {
      localStorage.setItem('calendarView-athlete', 'monthly');
      const view = storageModule.getCalendarViewPreference('athlete');
      expect(view).toBe('monthly');
    });

    it('should return default "weekly" if no preference', () => {
      const view = storageModule.getCalendarViewPreference('athlete');
      expect(view).toBe('weekly');
    });
  });

  describe('saveCalendarViewPreference', () => {
    it('should save calendar view preference', () => {
      storageModule.saveCalendarViewPreference('coach', 'monthly');
      expect(localStorage.getItem('calendarView-coach')).toBe('monthly');
    });
  });

  describe('clearUserData', () => {
    it('should clear all user data from localStorage', () => {
      localStorage.setItem('userRole', 'athlete');
      localStorage.setItem('onboardingData', '{}');
      localStorage.setItem('userProfile', '{}');
      localStorage.setItem('trainingSystem', '{}');
      
      storageModule.clearUserData();
      
      expect(localStorage.getItem('userRole')).toBeNull();
      expect(localStorage.getItem('onboardingData')).toBeNull();
      expect(localStorage.getItem('userProfile')).toBeNull();
      expect(localStorage.getItem('trainingSystem')).toBeNull();
    });
  });

  describe('getUserProfile', () => {
    it('should return base profile if no data in localStorage', async () => {
      const profile = await storageModule.getUserProfile();
      
      expect(profile).toEqual({
        currentMilestones: {},
        goals: [],
        equipment: [],
        discomforts: [],
        preferredDisciplines: [],
      });
    });

    it('should merge onboarding data with profile', async () => {
      const onboardingData = {
        discomforts: ['Back'],
        primaryDiscipline: ['Pilates'],
      };
      localStorage.setItem('onboardingData', JSON.stringify(onboardingData));
      
      const profile = await storageModule.getUserProfile();
      
      expect(profile.discomforts).toEqual(['Back']);
      expect(profile.preferredDisciplines).toEqual(['Pilates']);
    });

    it('should merge stored profile data', async () => {
      const storedProfile = {
        currentMilestones: { ex1: { var1: 2 } },
        goals: ['Strength'],
      };
      localStorage.setItem('userProfile', JSON.stringify(storedProfile));
      
      const profile = await storageModule.getUserProfile();
      
      expect(profile.currentMilestones).toEqual({ ex1: { var1: 2 } });
      expect(profile.goals).toEqual(['Strength']);
    });
  });

  describe('saveUserProfile', () => {
    it('should save profile to localStorage', async () => {
      const profile = {
        currentMilestones: {},
        goals: ['Strength'],
        equipment: [],
        discomforts: [],
        preferredDisciplines: [],
      };
      
      await storageModule.saveUserProfile(profile);
      
      const stored = localStorage.getItem('userProfile');
      expect(JSON.parse(stored!)).toEqual(profile);
    });
  });

  describe('getTrainingSystem', () => {
    it('should return training system from localStorage', async () => {
      const system = { id: 'sys1', sessions: [] };
      localStorage.setItem('trainingSystem', JSON.stringify(system));
      
      const result = await storageModule.getTrainingSystem();
      expect(result).toEqual(system);
    });

    it('should return null if no training system', async () => {
      const result = await storageModule.getTrainingSystem();
      expect(result).toBeNull();
    });
  });

  describe('saveTrainingSystem', () => {
    it('should save training system to localStorage', async () => {
      const system = { id: 'sys1', sessions: [] };
      await storageModule.saveTrainingSystem(system);
      
      const stored = localStorage.getItem('trainingSystem');
      expect(JSON.parse(stored!)).toEqual(system);
    });
  });

  describe('saveSessionProgress', () => {
    it('should save session progress to localStorage', () => {
      const progress = { sessionId: 'sess1', completed: true };
      storageModule.saveSessionProgress(progress);
      
      const stored = localStorage.getItem('sessionProgress');
      expect(JSON.parse(stored!)).toEqual(progress);
    });
  });

  describe('getSessionProgress', () => {
    it('should return session progress from localStorage', () => {
      const progress = { sessionId: 'sess1', completed: true };
      localStorage.setItem('sessionProgress', JSON.stringify(progress));
      
      const result = storageModule.getSessionProgress();
      expect(result).toEqual(progress);
    });

    it('should return null if no session progress', () => {
      const result = storageModule.getSessionProgress();
      expect(result).toBeNull();
    });
  });

  describe('clearSessionProgress', () => {
    it('should clear session progress from localStorage', () => {
      localStorage.setItem('sessionProgress', '{}');
      storageModule.clearSessionProgress();
      
      expect(localStorage.getItem('sessionProgress')).toBeNull();
    });
  });
});

