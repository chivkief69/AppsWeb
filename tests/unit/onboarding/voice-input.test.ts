import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VoiceInputManager } from '../../../js/onboarding/voice-input.js';

describe('VoiceInputManager', () => {
  let manager: VoiceInputManager;
  let mockRecognition: any;
  let mockSpeechRecognition: any;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="onboarding-question-1" class="">
        <div class="voice-transcription hidden"></div>
      </div>
      <button class="voice-mic-button"></button>
    `;

    // Mock SpeechRecognition
    mockRecognition = {
      continuous: false,
      interimResults: true,
      lang: 'en-US',
      start: vi.fn(),
      stop: vi.fn(),
      onstart: null,
      onresult: null,
      onerror: null,
      onend: null,
    };

    mockSpeechRecognition = vi.fn(() => mockRecognition);
    (global as any).window.SpeechRecognition = mockSpeechRecognition;
    (global as any).window.webkitSpeechRecognition = mockSpeechRecognition;

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('constructor and init', () => {
    it('should initialize with SpeechRecognition support', () => {
      manager = new VoiceInputManager();
      
      expect(mockSpeechRecognition).toHaveBeenCalled();
      expect(manager.recognition).toBeDefined();
      expect(manager.isListening).toBe(false);
    });

    it('should handle missing SpeechRecognition gracefully', () => {
      delete (global as any).window.SpeechRecognition;
      delete (global as any).window.webkitSpeechRecognition;
      
      manager = new VoiceInputManager();
      
      expect(manager.recognition).toBeNull();
    });
  });

  describe('startListening', () => {
    beforeEach(() => {
      manager = new VoiceInputManager();
    });

    it('should start recognition with callback', () => {
      const callback = vi.fn();
      manager.startListening('sedentary', callback);
      
      expect(mockRecognition.start).toHaveBeenCalled();
      expect(manager.onResultCallback).toBe(callback);
      expect(manager.questionType).toBe('sedentary');
    });

    it('should not start if recognition not available', () => {
      manager.recognition = null;
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      manager.startListening('sedentary', vi.fn());
      
      expect(alertSpy).toHaveBeenCalledWith('Speech recognition is not supported in your browser');
      alertSpy.mockRestore();
    });

    it('should trigger onstart handler', () => {
      manager.startListening('sedentary', vi.fn());
      
      expect(mockRecognition.onstart).toBeDefined();
      mockRecognition.onstart();
      
      expect(manager.isListening).toBe(true);
    });
  });

  describe('stopListening', () => {
    beforeEach(() => {
      manager = new VoiceInputManager();
    });

    it('should stop recognition if listening', () => {
      manager.isListening = true;
      manager.stopListening();
      
      expect(mockRecognition.stop).toHaveBeenCalled();
    });

    it('should not stop if not listening', () => {
      manager.isListening = false;
      manager.stopListening();
      
      expect(mockRecognition.stop).not.toHaveBeenCalled();
    });

    it('should not stop if recognition not available', () => {
      manager.recognition = null;
      manager.isListening = true;
      
      expect(() => manager.stopListening()).not.toThrow();
    });
  });

  describe('updateTranscription', () => {
    beforeEach(() => {
      manager = new VoiceInputManager();
    });

    it('should update transcription element', () => {
      const transcriptionEl = document.querySelector('.voice-transcription') as HTMLElement;
      
      manager.updateTranscription('test transcript');
      
      expect(transcriptionEl.textContent).toBe('test transcript');
      expect(transcriptionEl.classList.contains('hidden')).toBe(false);
    });

    it('should handle missing transcription element gracefully', () => {
      document.body.innerHTML = '<div id="onboarding-question-1"></div>';
      
      expect(() => manager.updateTranscription('test')).not.toThrow();
    });
  });

  describe('updateUIState', () => {
    beforeEach(() => {
      manager = new VoiceInputManager();
    });

    it('should update UI state to listening', () => {
      const micButton = document.querySelector('.voice-mic-button') as HTMLElement;
      
      manager.updateUIState('listening');
      
      expect(micButton.classList.contains('voice-listening')).toBe(true);
    });

    it('should update UI state to processing', () => {
      const micButton = document.querySelector('.voice-mic-button') as HTMLElement;
      
      manager.updateUIState('processing');
      
      expect(micButton.classList.contains('voice-processing')).toBe(true);
    });

    it('should update UI state to success', () => {
      const micButton = document.querySelector('.voice-mic-button') as HTMLElement;
      
      manager.updateUIState('success');
      
      expect(micButton.classList.contains('voice-success')).toBe(true);
    });

    it('should update UI state to error', () => {
      const micButton = document.querySelector('.voice-mic-button') as HTMLElement;
      
      manager.updateUIState('error');
      
      expect(micButton.classList.contains('voice-error')).toBe(true);
    });

    it('should handle missing mic button gracefully', () => {
      document.body.innerHTML = '';
      
      expect(() => manager.updateUIState('listening')).not.toThrow();
    });
  });

  describe('parseAnswer', () => {
    beforeEach(() => {
      manager = new VoiceInputManager();
    });

    describe('sedentary question type', () => {
      it('should parse "yes"', () => {
        const result = manager.parseAnswer('yes', 'sedentary');
        expect(result).toBe('yes');
      });

      it('should parse "no"', () => {
        const result = manager.parseAnswer('no', 'sedentary');
        expect(result).toBe('no');
      });

      it('should parse numbers 1-5', () => {
        expect(manager.parseAnswer('3', 'sedentary')).toBe('3');
        expect(manager.parseAnswer('five', 'sedentary')).toBe('5');
      });

      it('should return null for invalid input', () => {
        const result = manager.parseAnswer('maybe', 'sedentary');
        expect(result).toBeNull();
      });
    });

    describe('discomforts question type', () => {
      it('should parse back discomfort', () => {
        const result = manager.parseAnswer('back pain', 'discomforts');
        expect(result).toEqual(['Back']);
      });

      it('should parse multiple discomforts', () => {
        const result = manager.parseAnswer('back and neck', 'discomforts');
        expect(result).toContain('Back');
        expect(result).toContain('Neck');
      });

      it('should parse joint keywords', () => {
        const result = manager.parseAnswer('knee pain', 'discomforts');
        expect(result).toEqual(['Joints']);
      });

      it('should return None if "none" is mentioned', () => {
        const result = manager.parseAnswer('none', 'discomforts');
        expect(result).toEqual(['None']);
      });

      it('should return null for unrecognized discomforts', () => {
        const result = manager.parseAnswer('stomach', 'discomforts');
        expect(result).toBeNull();
      });
    });

    describe('discipline question type', () => {
      it('should parse Pilates', () => {
        const result = manager.parseAnswer('pilates', 'discipline');
        expect(result).toBe('Pilates');
      });

      it('should parse Animal Flow', () => {
        expect(manager.parseAnswer('animal flow', 'discipline')).toBe('Animal Flow');
        expect(manager.parseAnswer('animalflow', 'discipline')).toBe('Animal Flow');
      });

      it('should parse Weights', () => {
        expect(manager.parseAnswer('weight training', 'discipline')).toBe('Weights');
        expect(manager.parseAnswer('lifting', 'discipline')).toBe('Weights');
        expect(manager.parseAnswer('strength training', 'discipline')).toBe('Weights');
      });

      it('should parse Crossfit', () => {
        expect(manager.parseAnswer('crossfit', 'discipline')).toBe('Crossfit');
        expect(manager.parseAnswer('cross fit', 'discipline')).toBe('Crossfit');
      });

      it('should parse Calisthenics', () => {
        expect(manager.parseAnswer('calisthenics', 'discipline')).toBe('Calisthenics');
        expect(manager.parseAnswer('calisthenic', 'discipline')).toBe('Calisthenics');
      });

      it('should return null for unrecognized discipline', () => {
        const result = manager.parseAnswer('yoga', 'discipline');
        expect(result).toBeNull();
      });
    });
  });

  describe('handleFinalResult', () => {
    beforeEach(() => {
      manager = new VoiceInputManager();
      document.body.innerHTML = `
        <div id="onboarding-question-1" class="">
          <div class="voice-transcription"></div>
        </div>
        <button class="voice-mic-button"></button>
      `;
    });

    it('should call callback with parsed result', () => {
      const callback = vi.fn();
      manager.onResultCallback = callback;
      manager.questionType = 'sedentary';
      
      manager.handleFinalResult('yes');
      
      vi.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledWith('yes');
    });

    it('should update UI state to success on valid result', () => {
      manager.onResultCallback = vi.fn();
      manager.questionType = 'sedentary';
      
      manager.handleFinalResult('yes');
      vi.advanceTimersByTime(500);
      
      const micButton = document.querySelector('.voice-mic-button') as HTMLElement;
      expect(micButton.classList.contains('voice-success')).toBe(true);
    });

    it('should update UI state to error on invalid result', () => {
      manager.questionType = 'sedentary';
      
      manager.handleFinalResult('invalid');
      vi.advanceTimersByTime(2000);
      
      const micButton = document.querySelector('.voice-mic-button') as HTMLElement;
      expect(micButton.classList.contains('voice-error')).toBe(true);
    });
  });
});

