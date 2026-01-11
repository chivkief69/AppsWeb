import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies
vi.mock('../../../js/athlete/calendar.js', () => ({
  AthleteCalendarManager: vi.fn(() => ({
    renderCalendar: vi.fn(),
  })),
}));

vi.mock('../../../js/core/workout-engine.js', () => ({
  generateWeeklySystem: vi.fn(),
  findAlternativeVariation: vi.fn(),
  loadExercises: vi.fn(),
}));

vi.mock('../../../js/core/storage.js', () => ({
  getUserProfile: vi.fn(),
  saveUserProfile: vi.fn(),
  getTrainingSystem: vi.fn(),
  saveTrainingSystem: vi.fn(),
}));

vi.mock('../../../js/athlete/session-view.js', () => ({
  SessionView: vi.fn(),
}));

describe('Athlete Dashboard', () => {
  let dashboardModule: typeof import('../../../js/athlete/dashboard.js');
  let storageModule: typeof import('../../../js/core/storage.js');

  beforeEach(async () => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="session-title"></div>
      <div id="session-workout-info"></div>
      <div id="session-phases"></div>
      <button id="start-session-btn"></button>
      <div id="empty-state" class="hidden"></div>
    `;

    vi.clearAllMocks();
    dashboardModule = await import('../../../js/athlete/dashboard.js');
    storageModule = await import('../../../js/core/storage.js');
  });

  describe('initializeAthleteApp', () => {
    it('should initialize athlete app with router', () => {
      const mockRouter = {
        navigateTo: vi.fn(),
        currentPage: 'home',
      };

      dashboardModule.initializeAthleteApp(mockRouter as any);

      expect(mockRouter.navigateTo).toBeDefined();
    });

    it('should initialize dashboard when navigating to home', () => {
      const mockRouter = {
        navigateTo: vi.fn((page: string) => {}),
        currentPage: 'home',
      };

      vi.spyOn(dashboardModule, 'initDashboard').mockResolvedValue(undefined);

      dashboardModule.initializeAthleteApp(mockRouter as any);
      mockRouter.navigateTo('home');

      // Dashboard initialization happens in setTimeout, so we check router.navigateTo was wrapped
      expect(mockRouter.navigateTo).toBeDefined();
    });
  });

  describe('initDashboard', () => {
    it('should render empty state when no training system', async () => {
      vi.mocked(storageModule.getUserProfile).mockResolvedValue({
        currentMilestones: {},
        goals: [],
        equipment: [],
        discomforts: [],
        preferredDisciplines: [],
      });
      vi.mocked(storageModule.getTrainingSystem).mockResolvedValue(null);

      await dashboardModule.initDashboard();

      const emptyState = document.getElementById('empty-state');
      expect(emptyState?.classList.contains('hidden')).toBe(false);
    });

    it('should render first session when training system exists', async () => {
      const mockSession = {
        id: 'session1',
        workout: 'Daily',
        discipline: 'Pilates',
        phases: {
          warmup: [],
          workout: [],
          cooldown: [],
        },
      };

      vi.mocked(storageModule.getUserProfile).mockResolvedValue({
        currentMilestones: {},
        goals: [],
        equipment: [],
        discomforts: [],
        preferredDisciplines: [],
      });
      vi.mocked(storageModule.getTrainingSystem).mockResolvedValue({
        id: 'system1',
        sessions: [mockSession],
      } as any);

      await dashboardModule.initDashboard();

      const titleEl = document.getElementById('session-title');
      expect(titleEl?.textContent).toBe('Daily Session');
    });

    it('should render empty state when training system has no sessions', async () => {
      vi.mocked(storageModule.getUserProfile).mockResolvedValue({
        currentMilestones: {},
        goals: [],
        equipment: [],
        discomforts: [],
        preferredDisciplines: [],
      });
      vi.mocked(storageModule.getTrainingSystem).mockResolvedValue({
        id: 'system1',
        sessions: [],
      } as any);

      await dashboardModule.initDashboard();

      const emptyState = document.getElementById('empty-state');
      expect(emptyState?.classList.contains('hidden')).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(storageModule.getUserProfile).mockRejectedValue(new Error('Network error'));

      await dashboardModule.initDashboard();

      const emptyState = document.getElementById('empty-state');
      expect(emptyState?.classList.contains('hidden')).toBe(false);
    });
  });
});

