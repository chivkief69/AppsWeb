import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CoachCalendarManager } from '../../../js/coach/calendar.js';

// Mock dependencies
vi.mock('../../../js/core/storage.js', () => ({
  getCalendarViewPreference: vi.fn(() => 'weekly'),
  saveCalendarViewPreference: vi.fn(),
}));

describe('CoachCalendarManager', () => {
  let manager: CoachCalendarManager;
  let storageModule: typeof import('../../../js/core/storage.js');

  beforeEach(async () => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="coach-calendar-view-toggle"></div>
      <div id="coach-calendar-grid"></div>
      <div id="coach-calendar-prev"></div>
      <div id="coach-calendar-next"></div>
    `;

    vi.clearAllMocks();
    storageModule = await import('../../../js/core/storage.js');
    manager = new CoachCalendarManager();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(manager.calendarType).toBe('coach');
      expect(manager.currentView).toBe('weekly');
      expect(manager.currentDate).toBeInstanceOf(Date);
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      const today = new Date();
      expect(manager.isToday(today)).toBe(true);
    });

    it('should return false for other dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(manager.isToday(yesterday)).toBe(false);
    });
  });

  describe('toggleView', () => {
    it('should toggle between weekly and monthly view', () => {
      manager.currentView = 'weekly';
      manager.toggleView();
      expect(manager.currentView).toBe('monthly');
    });
  });
});

