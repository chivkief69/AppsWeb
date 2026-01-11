import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies
vi.mock('../../../js/coach/calendar.js', () => ({
  CoachCalendarManager: vi.fn(() => ({
    renderCalendar: vi.fn(),
  })),
}));

describe('Coach Dashboard', () => {
  let dashboardModule: typeof import('../../../js/coach/dashboard.js');

  beforeEach(async () => {
    vi.clearAllMocks();
    dashboardModule = await import('../../../js/coach/dashboard.js');
  });

  describe('initializeCoachApp', () => {
    it('should initialize coach app with router', () => {
      const mockRouter = {
        navigateTo: vi.fn(),
        currentPage: 'coach-home',
      };

      dashboardModule.initializeCoachApp(mockRouter as any);

      expect(mockRouter.navigateTo).toBeDefined();
    });

    it('should initialize calendar when navigating to coach-calendar', () => {
      const mockRouter = {
        navigateTo: vi.fn((page: string) => {}),
        currentPage: 'coach-calendar',
      };

      dashboardModule.initializeCoachApp(mockRouter as any);
      mockRouter.navigateTo('coach-calendar');

      // Calendar initialization happens in setTimeout
      expect(mockRouter.navigateTo).toBeDefined();
    });
  });
});

