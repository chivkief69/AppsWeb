import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OnboardingManager } from '../../../js/onboarding/onboarding-manager.js';

// Mock dependencies
vi.mock('../../../js/core/storage.js', () => ({
  saveOnboardingData: vi.fn(),
  setUserRole: vi.fn(),
  saveUserProfile: vi.fn(),
}));

vi.mock('../../../js/core/auth-manager.js', () => ({
  getAuthUser: vi.fn(() => null),
}));

vi.mock('../../../js/onboarding/voice-input.js', () => ({
  VoiceInputManager: vi.fn(() => ({
    isListening: false,
    startListening: vi.fn(),
    stopListening: vi.fn(),
  })),
}));

describe('OnboardingManager', () => {
  let manager: OnboardingManager;
  let onRoleSelect: ReturnType<typeof vi.fn>;
  let onComplete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="onboarding-role-selection" class="hidden"></div>
      <div id="onboarding-question-1" class="hidden">
        <button data-answer="sedentary" data-value="yes"></button>
        <button data-answer="sedentary" data-value="no"></button>
      </div>
      <div id="onboarding-question-2" class="hidden">
        <button data-answer="discomfort" data-value="Back"></button>
        <button data-answer="discomfort" data-value="Neck"></button>
        <button data-answer="discomfort" data-value="None"></button>
        <button id="discomfort-next"></button>
      </div>
      <div id="onboarding-question-3" class="hidden">
        <button data-answer="discipline" data-value="Pilates"></button>
        <button data-answer="discipline" data-value="Weights"></button>
        <button id="discipline-complete" disabled></button>
      </div>
      <div id="onboarding-overlay"></div>
      <button class="voice-mic-button"></button>
    `;

    onRoleSelect = vi.fn();
    onComplete = vi.fn();
    manager = new OnboardingManager(onRoleSelect, onComplete);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default state', () => {
      expect(manager.currentStep).toBe('role-selection');
      expect(manager.answers.sedentaryImpact).toBeNull();
      expect(manager.answers.discomforts).toEqual([]);
      expect(manager.answers.primaryDiscipline).toEqual([]);
      expect(manager.onRoleSelect).toBe(onRoleSelect);
      expect(manager.onComplete).toBe(onComplete);
    });
  });

  describe('init', () => {
    it('should setup event listeners', () => {
      manager.init();
      // Event listeners are set up, test by triggering events
      expect(manager.currentStep).toBe('role-selection');
    });
  });

  describe('showRoleSelection', () => {
    it('should show role selection', () => {
      manager.showRoleSelection();
      
      const roleSelection = document.getElementById('onboarding-role-selection');
      expect(roleSelection?.classList.contains('hidden')).toBe(false);
      expect(manager.currentStep).toBe('role-selection');
    });
  });

  describe('startAthleteFlow', () => {
    it('should start athlete flow by showing question 1', () => {
      manager.startAthleteFlow();
      
      const question1 = document.getElementById('onboarding-question-1');
      expect(question1?.classList.contains('hidden')).toBe(false);
      expect(manager.currentStep).toBe('question-1');
    });
  });

  describe('showQuestion', () => {
    it('should show specified question', () => {
      manager.showQuestion(2);
      
      const question2 = document.getElementById('onboarding-question-2');
      expect(question2?.classList.contains('hidden')).toBe(false);
      expect(manager.currentStep).toBe('question-2');
    });

    it('should hide all other questions', () => {
      document.getElementById('onboarding-question-1')?.classList.remove('hidden');
      
      manager.showQuestion(3);
      
      const question1 = document.getElementById('onboarding-question-1');
      const question3 = document.getElementById('onboarding-question-3');
      expect(question1?.classList.contains('hidden')).toBe(true);
      expect(question3?.classList.contains('hidden')).toBe(false);
    });
  });

  describe('handleAnswer', () => {
    it('should handle sedentary answer and advance to next question', () => {
      manager.showQuestion(1);
      
      manager.handleAnswer('sedentary', 'yes');
      vi.advanceTimersByTime(300);
      
      expect(manager.answers.sedentaryImpact).toBe('yes');
      expect(manager.currentStep).toBe('question-2');
    });

    it('should update UI with selected answer', () => {
      manager.showQuestion(1);
      const yesButton = document.querySelector('[data-answer="sedentary"][data-value="yes"]') as HTMLElement;
      
      manager.handleAnswer('sedentary', 'yes');
      
      expect(yesButton.classList.contains('selected')).toBe(true);
    });
  });

  describe('toggleDiscomfort', () => {
    beforeEach(() => {
      manager.showQuestion(2);
    });

    it('should add discomfort to answers', () => {
      manager.toggleDiscomfort('Back');
      
      expect(manager.answers.discomforts).toContain('Back');
    });

    it('should remove discomfort if already selected', () => {
      manager.answers.discomforts = ['Back'];
      manager.toggleDiscomfort('Back');
      
      expect(manager.answers.discomforts).not.toContain('Back');
    });

    it('should clear others when "None" is selected', () => {
      manager.answers.discomforts = ['Back', 'Neck'];
      manager.toggleDiscomfort('None');
      
      expect(manager.answers.discomforts).toEqual(['None']);
    });

    it('should remove "None" when other discomfort is selected', () => {
      manager.answers.discomforts = ['None'];
      manager.toggleDiscomfort('Back');
      
      expect(manager.answers.discomforts).not.toContain('None');
      expect(manager.answers.discomforts).toContain('Back');
    });
  });

  describe('toggleDiscipline', () => {
    beforeEach(() => {
      manager.showQuestion(3);
    });

    it('should add discipline to answers', () => {
      manager.toggleDiscipline('Pilates');
      
      expect(manager.answers.primaryDiscipline).toContain('Pilates');
    });

    it('should remove discipline if already selected', () => {
      manager.answers.primaryDiscipline = ['Pilates'];
      manager.toggleDiscipline('Pilates');
      
      expect(manager.answers.primaryDiscipline).not.toContain('Pilates');
    });

    it('should enable continue button when disciplines selected', () => {
      manager.toggleDiscipline('Pilates');
      
      const continueBtn = document.getElementById('discipline-complete') as HTMLElement;
      expect(continueBtn.hasAttribute('disabled')).toBe(false);
    });

    it('should disable continue button when no disciplines selected', () => {
      manager.answers.primaryDiscipline = ['Pilates'];
      manager.toggleDiscipline('Pilates'); // Remove it
      
      const continueBtn = document.getElementById('discipline-complete') as HTMLElement;
      expect(continueBtn.hasAttribute('disabled')).toBe(true);
    });
  });

  describe('completeOnboarding', () => {
    beforeEach(async () => {
      manager.answers = {
        sedentaryImpact: 'yes',
        discomforts: ['Back'],
        primaryDiscipline: ['Pilates'],
      };
      
      const storageModule = await import('../../../js/core/storage.js');
      vi.mocked(storageModule.saveOnboardingData).mockResolvedValue(undefined);
      vi.mocked(storageModule.setUserRole).mockResolvedValue(undefined);
    });

    it('should save onboarding data and role', async () => {
      const storageModule = await import('../../../js/core/storage.js');
      
      await manager.completeOnboarding();
      vi.advanceTimersByTime(300);
      
      expect(storageModule.saveOnboardingData).toHaveBeenCalledWith(manager.answers);
      expect(storageModule.setUserRole).toHaveBeenCalledWith('athlete');
    });

    it('should hide overlay after completion', async () => {
      await manager.completeOnboarding();
      vi.advanceTimersByTime(300);
      
      const overlay = document.getElementById('onboarding-overlay');
      expect(overlay?.classList.contains('hidden')).toBe(true);
    });

    it('should call onComplete callback', async () => {
      await manager.completeOnboarding();
      vi.advanceTimersByTime(300);
      
      expect(onComplete).toHaveBeenCalledWith('athlete');
    });
  });

  describe('handleVoiceInput', () => {
    it('should start voice input for current question', () => {
      manager.currentStep = 'question-1';
      manager.handleVoiceInput();
      
      expect(manager.voiceManager.startListening).toHaveBeenCalled();
    });

    it('should stop voice input if already listening', () => {
      manager.voiceManager.isListening = true;
      manager.handleVoiceInput();
      
      expect(manager.voiceManager.stopListening).toHaveBeenCalled();
    });
  });
});

