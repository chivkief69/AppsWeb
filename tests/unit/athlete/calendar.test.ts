import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AthleteCalendarManager } from '../../../js/athlete/calendar.js';

// Mock dependencies
vi.mock('../../../js/core/storage.js', () => ({
  getCalendarViewPreference: vi.fn(() => 'weekly'),
  saveCalendarViewPreference: vi.fn(),
  getTrainingSystem: vi.fn(),
}));

describe('AthleteCalendarManager', () => {
  let manager: AthleteCalendarManager;
  let storageModule: typeof import('../../../js/core/storage.js');

  beforeEach(async () => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="athlete-calendar-view-toggle"></div>
      <div id="athlete-calendar-grid"></div>
      <div id="athlete-calendar-prev"></div>
      <div id="athlete-calendar-next"></div>
    `;

    vi.clearAllMocks();
    storageModule = await import('../../../js/core/storage.js');
    manager = new AthleteCalendarManager();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(manager.calendarType).toBe('athlete');
      expect(manager.currentView).toBe('weekly');
      expect(manager.currentDate).toBeInstanceOf(Date);
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      const today = new Date();
      expect(manager.isToday(today)).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(manager.isToday(yesterday)).toBe(false);
    });

    it('should return false for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(manager.isToday(tomorrow)).toBe(false);
    });
  });

  describe('toggleView', () => {
    it('should toggle between weekly and monthly view', () => {
      manager.currentView = 'weekly';
      manager.toggleView();
      expect(manager.currentView).toBe('monthly');

      manager.toggleView();
      expect(manager.currentView).toBe('weekly');
    });

    it('should save view preference', async () => {
      manager.toggleView();
      // View preference is saved, check mock was called
      expect(storageModule.saveCalendarViewPreference).toHaveBeenCalled();
    });
  });

  describe('navigateWeek', () => {
    it('should navigate to previous week', () => {
      const originalDate = new Date(manager.currentDate);
      manager.navigateWeek(-1);
      expect(manager.currentDate.getTime()).toBeLessThan(originalDate.getTime());
    });

    it('should navigate to next week', () => {
      const originalDate = new Date(manager.currentDate);
      manager.navigateWeek(1);
      expect(manager.currentDate.getTime()).toBeGreaterThan(originalDate.getTime());
    });
  });

  describe('navigateMonth', () => {
    it('should navigate to previous month', () => {
      const originalDate = new Date(manager.currentDate);
      manager.navigateMonth(-1);
      expect(manager.currentDate.getMonth()).not.toBe(originalDate.getMonth());
    });

    it('should navigate to next month', () => {
      const originalDate = new Date(manager.currentDate);
      manager.navigateMonth(1);
      // Month might wrap to next year, so check it's different or year increased
      const monthChanged = manager.currentDate.getMonth() !== originalDate.getMonth() ||
                          manager.currentDate.getFullYear() !== originalDate.getFullYear();
      expect(monthChanged).toBe(true);
    });
  });
});

