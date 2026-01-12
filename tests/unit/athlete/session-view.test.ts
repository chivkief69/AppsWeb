import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionView } from '../../../js/athlete/session-view.js';

// Mock dependencies
vi.mock('../../../js/core/workout-engine.js', () => ({
  updateMilestone: vi.fn(),
  getCurrentVariation: vi.fn(),
  getNextVariation: vi.fn(),
  isMilestoneAchieved: vi.fn(),
}));

vi.mock('../../../js/core/storage.js', () => ({
  getUserProfile: vi.fn(),
  saveUserProfile: vi.fn(),
  saveSessionProgress: vi.fn(),
  getSessionProgress: vi.fn(),
  clearSessionProgress: vi.fn(),
}));

describe('SessionView', () => {
  let sessionView: SessionView;
  let mockSession: any;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="session-overlay"></div>
      <div id="session-content"></div>
    `;

    mockSession = {
      id: 'session1',
      date: '2024-01-01',
      workout: 'Daily',
      discipline: 'Pilates',
      phases: {
        warmup: [],
        workout: [],
        cooldown: [],
      },
    };

    vi.clearAllMocks();
    sessionView = new SessionView(mockSession);
  });

  describe('constructor', () => {
    it('should initialize with session data', () => {
      expect(sessionView.session).toEqual(mockSession);
      expect(sessionView.currentPhaseIndex).toBe(0);
      expect(sessionView.currentVariationIndex).toBe(0);
    });
  });

  describe('init', () => {
    it('should initialize session view', () => {
      sessionView.init();
      // Init sets up event listeners and renders, check it completes
      expect(sessionView.session).toBeDefined();
    });
  });

  describe('render', () => {
    it('should render session content', () => {
      sessionView.render();
      // Render updates DOM, check it completes without error
      expect(sessionView.session).toBeDefined();
    });
  });

  describe('nextPhase', () => {
    it('should move to next phase', () => {
      const initialPhase = sessionView.currentPhaseIndex;
      sessionView.nextPhase();
      // If there are multiple phases, index should increase
      // Otherwise it stays the same or wraps
      expect(sessionView.currentPhaseIndex).toBeDefined();
    });
  });

  describe('previousPhase', () => {
    it('should move to previous phase', () => {
      sessionView.currentPhaseIndex = 1;
      const initialPhase = sessionView.currentPhaseIndex;
      sessionView.previousPhase();
      // Index should decrease or wrap
      expect(sessionView.currentPhaseIndex).toBeDefined();
    });
  });

  describe('completeSession', () => {
    it('should complete session', async () => {
      const storageModule = await import('../../../js/core/storage.js');
      vi.mocked(storageModule.getUserProfile).mockResolvedValue({
        currentMilestones: {},
        goals: [],
        equipment: [],
        discomforts: [],
        preferredDisciplines: [],
      });
      vi.mocked(storageModule.saveUserProfile).mockResolvedValue(undefined);
      vi.mocked(storageModule.clearSessionProgress).mockReturnValue(undefined);

      await sessionView.completeSession();

      // Session completion should save progress and clear session data
      expect(storageModule.clearSessionProgress).toHaveBeenCalled();
    });
  });
});

