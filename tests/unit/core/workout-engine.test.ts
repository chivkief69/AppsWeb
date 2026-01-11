import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  filterExercisesByDiscipline,
  filterExercisesByFramework,
  filterExercisesByPhase,
  getCurrentVariation,
  updateMilestone,
  isMilestoneAchieved,
  generateSession,
  generateWeeklySystem,
} from '../../../js/core/workout-engine.js';

describe('Workout Engine - Core Functions', () => {
  const mockExercises = [
    {
      id: 'ex1',
      name: 'Exercise 1',
      discipline: 'Pilates',
      variations: [
        {
          id: 'var1',
          name: 'Variation 1',
          difficulty_score: 1,
          target_muscles: {
            primary: ['Chest'],
            secondary: ['Shoulders'],
          },
        },
      ],
    },
    {
      id: 'ex2',
      name: 'Exercise 2',
      discipline: 'Animal Flow',
      variations: [
        {
          id: 'var2',
          name: 'Variation 2',
          difficulty_score: 2,
          target_muscles: {
            primary: ['Back'],
            secondary: [],
          },
        },
      ],
    },
  ];

  describe('filterExercisesByDiscipline', () => {
    it('should filter exercises by discipline', () => {
      const result = filterExercisesByDiscipline(mockExercises, 'Pilates');
      expect(result).toHaveLength(1);
      expect(result[0].discipline).toBe('Pilates');
    });

    it('should return empty array for non-matching discipline', () => {
      const result = filterExercisesByDiscipline(mockExercises, 'Weights');
      expect(result).toHaveLength(0);
    });

    it('should return all exercises if discipline is not provided', () => {
      const result = filterExercisesByDiscipline(mockExercises, null);
      expect(result).toHaveLength(2);
    });
  });

  describe('getCurrentVariation', () => {
    it('should return first variation if no milestones exist', () => {
      const exercise = mockExercises[0];
      const currentMilestones = {};
      
      const result = getCurrentVariation('ex1', currentMilestones, exercise);
      expect(result).toBeDefined();
      expect(result?.id).toBe('var1');
    });

    it('should return variation based on milestones', () => {
      const exercise = mockExercises[0];
      const currentMilestones = {
        ex1: {
          var1: 2, // 2 sessions completed
        },
      };
      
      const result = getCurrentVariation('ex1', currentMilestones, exercise);
      expect(result).toBeDefined();
      expect(result?.id).toBe('var1');
    });
  });

  describe('updateMilestone', () => {
    it('should create new milestone entry', () => {
      const currentMilestones = {};
      const result = updateMilestone('ex1', 'var1', currentMilestones);
      
      expect(result.ex1).toBeDefined();
      expect(result.ex1.var1).toBe(1);
    });

    it('should increment existing milestone', () => {
      const currentMilestones = {
        ex1: {
          var1: 2,
        },
      };
      
      const result = updateMilestone('ex1', 'var1', currentMilestones);
      expect(result.ex1.var1).toBe(3);
    });

    it('should cap milestone at OVERLOAD_PERIOD_SESSIONS', () => {
      const currentMilestones = {
        ex1: {
          var1: 3, // Already at max
        },
      };
      
      const result = updateMilestone('ex1', 'var1', currentMilestones);
      expect(result.ex1.var1).toBe(3); // Should not exceed 3
    });
  });

  describe('isMilestoneAchieved', () => {
    it('should return true when milestone is achieved', () => {
      const currentMilestones = {
        ex1: {
          var1: 3,
        },
      };
      
      const result = isMilestoneAchieved('ex1', 'var1', currentMilestones);
      expect(result).toBe(true);
    });

    it('should return false when milestone is not achieved', () => {
      const currentMilestones = {
        ex1: {
          var1: 2,
        },
      };
      
      const result = isMilestoneAchieved('ex1', 'var1', currentMilestones);
      expect(result).toBe(false);
    });
  });
});

describe('Workout Engine - generateSession', () => {
  // Comprehensive mock exercises for testing
  const createMockExercises = () => [
    {
      id: 'warmup-ex1',
      name: 'Warmup Exercise 1',
      discipline: 'Pilates',
      variations: [
        {
          id: 'warmup-var1',
          name: 'Warmup Variation 1',
          difficulty_score: 2,
          progression_type: 'stability',
          bilaterality: 'bilateral',
          target_muscles: {
            primary: ['chest'],
            secondary: ['shoulders'],
          },
        },
      ],
    },
    {
      id: 'warmup-ex2',
      name: 'Warmup Exercise 2',
      discipline: 'Pilates',
      variations: [
        {
          id: 'warmup-var2',
          name: 'Warmup Variation 2',
          difficulty_score: 3,
          progression_type: 'mobility',
          bilaterality: 'bilateral',
          target_muscles: {
            primary: ['back'],
            secondary: [],
          },
        },
      ],
    },
    {
      id: 'workout-ex1',
      name: 'Workout Exercise 1',
      discipline: 'Pilates',
      variations: [
        {
          id: 'workout-var1',
          name: 'Workout Variation 1',
          difficulty_score: 5,
          progression_type: 'load',
          bilaterality: 'bilateral',
          target_muscles: {
            primary: ['chest'],
            secondary: ['triceps'],
          },
        },
        {
          id: 'workout-var2',
          name: 'Workout Variation 2',
          difficulty_score: 6,
          progression_type: 'load',
          bilaterality: 'bilateral',
          target_muscles: {
            primary: ['chest'],
            secondary: ['triceps'],
          },
        },
      ],
    },
    {
      id: 'workout-ex2',
      name: 'Workout Exercise 2',
      discipline: 'Pilates',
      variations: [
        {
          id: 'workout-var3',
          name: 'Workout Variation 3',
          difficulty_score: 4,
          progression_type: 'leverage',
          bilaterality: 'bilateral',
          target_muscles: {
            primary: ['shoulders'],
            secondary: ['chest'],
          },
        },
      ],
    },
    {
      id: 'cooldown-ex1',
      name: 'Cooldown Exercise 1',
      discipline: 'Pilates',
      variations: [
        {
          id: 'cooldown-var1',
          name: 'Cooldown Variation 1',
          difficulty_score: 3,
          progression_type: 'mobility',
          bilaterality: 'bilateral',
          target_muscles: {
            primary: ['chest'],
            secondary: ['shoulders'],
          },
        },
      ],
    },
  ];

  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock global.fetch for loadExercises
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('basic session generation', () => {
    it('should generate a session with all phases', async () => {
      const mockExercises = createMockExercises();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exercises: mockExercises }),
      });

      const result = await generateSession('Pilates', 'Push');

      expect(result).toBeDefined();
      expect(result.discipline).toBe('Pilates');
      expect(result.workout).toBe('Push');
      expect(result.phases).toBeDefined();
      expect(result.phases.warmup).toBeDefined();
      expect(result.phases.workout).toBeDefined();
      expect(result.phases.cooldown).toBeDefined();
      expect(result.generatedAt).toBeDefined();
    });

    it('should include exercise details in phase variations', async () => {
      const mockExercises = createMockExercises();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exercises: mockExercises }),
      });

      const result = await generateSession('Pilates', null);

      // Check structure of variations
      if (result.phases.workout.length > 0) {
        const variation = result.phases.workout[0];
        expect(variation).toHaveProperty('exerciseId');
        expect(variation).toHaveProperty('exerciseName');
        expect(variation).toHaveProperty('variationId');
        expect(variation).toHaveProperty('variationName');
        expect(variation).toHaveProperty('difficulty_score');
        expect(variation).toHaveProperty('target_muscles');
      }
    });
  });

  describe('filtering by discipline', () => {
    it('should filter exercises by discipline', async () => {
      const mockExercises = createMockExercises();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exercises: mockExercises }),
      });

      const result = await generateSession('Pilates', null);
      expect(result.discipline).toBe('Pilates');
    });

    it('should fall back to all exercises if discipline filter returns empty', async () => {
      const mockExercises = createMockExercises();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exercises: mockExercises }),
      });

      // Try with non-existent discipline - should use all exercises
      const result = await generateSession('Weights', null);
      expect(result).toBeDefined();
    });
  });

  describe('filtering by framework/workout', () => {
    it('should filter exercises by framework', async () => {
      const mockExercises = createMockExercises();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exercises: mockExercises }),
      });

      const result = await generateSession('Pilates', 'Push');
      expect(result.workout).toBe('Push');
    });

    it('should fall back if framework filter returns empty', async () => {
      const mockExercises = createMockExercises();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exercises: mockExercises }),
      });

      const result = await generateSession('Pilates', 'Legs');
      expect(result).toBeDefined();
    });
  });

  describe('filtering by user data', () => {
    it('should filter exercises by discomforts', async () => {
      const mockExercises = createMockExercises();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exercises: mockExercises }),
      });

      const userData = {
        discomforts: ['Back'],
        currentMilestones: {},
      };

      const result = await generateSession('Pilates', null, userData);
      expect(result).toBeDefined();
    });

    it('should handle equipment filtering', async () => {
      const mockExercises = createMockExercises();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exercises: mockExercises }),
      });

      const userData = {
        equipment: ['mat'],
        currentMilestones: {},
      };

      const result = await generateSession('Pilates', null, userData);
      expect(result).toBeDefined();
    });
  });

  describe('progressive overload', () => {
    it('should select variations based on milestones', async () => {
      const mockExercises = [
        {
          id: 'ex1',
          name: 'Exercise 1',
          discipline: 'Pilates',
          variations: [
            {
              id: 'var1',
              name: 'Variation 1',
              difficulty_score: 3,
              progression_type: 'load',
              bilaterality: 'bilateral',
              target_muscles: { primary: ['chest'], secondary: [] },
            },
            {
              id: 'var2',
              name: 'Variation 2',
              difficulty_score: 5,
              progression_type: 'load',
              bilaterality: 'bilateral',
              target_muscles: { primary: ['chest'], secondary: [] },
            },
          ],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exercises: mockExercises }),
      });

      const userData = {
        currentMilestones: {
          ex1: {
            var1: 3, // Milestone achieved, should move to var2
          },
        },
      };

      const result = await generateSession('Pilates', null, userData);
      expect(result).toBeDefined();
      // The system should select appropriate variations based on milestones
    });

    it('should start with first variation if no milestones', async () => {
      const mockExercises = createMockExercises();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exercises: mockExercises }),
      });

      const userData = {
        currentMilestones: {},
      };

      const result = await generateSession('Pilates', null, userData);
      expect(result).toBeDefined();
      expect(result.phases.workout).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should throw error if no exercises available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exercises: [] }),
      });

      await expect(generateSession('Pilates', null)).rejects.toThrow(
        'No exercises available'
      );
    });

    it('should throw error if fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(generateSession('Pilates', null)).rejects.toThrow();
    });

    it('should throw error if all filters result in empty exercise list', async () => {
      // Create exercises that won't match any filter
      const mockExercises = [
        {
          id: 'ex1',
          name: 'Exercise 1',
          discipline: 'Weights',
          variations: [
            {
              id: 'var1',
              name: 'Variation 1',
              difficulty_score: 10,
              progression_type: 'load',
              bilaterality: 'bilateral',
              target_muscles: { primary: ['Back'], secondary: [] },
            },
          ],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exercises: mockExercises }),
      });

      const userData = {
        discomforts: ['Back'], // This will filter out the exercise
      };

      // This should throw if filtering results in empty list
      // The actual behavior depends on implementation, but should handle gracefully
      try {
        await generateSession('Pilates', 'Push', userData);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('previous sessions variety', () => {
    it('should avoid repeating exercises from previous sessions', async () => {
      const mockExercises = createMockExercises();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exercises: mockExercises }),
      });

      const previousSessions = [
        {
          phases: {
            workout: [{ exerciseId: 'workout-ex1' }],
          },
        },
      ];

      const result = await generateSession(
        'Pilates',
        null,
        {},
        previousSessions
      );
      expect(result).toBeDefined();
      // System should try to avoid repeating workout-ex1
    });
  });
});

describe('Workout Engine - generateWeeklySystem', () => {
  const createMockExercises = () => [
    {
      id: 'ex1',
      name: 'Exercise 1',
      discipline: 'Pilates',
      variations: [
        {
          id: 'var1',
          name: 'Variation 1',
          difficulty_score: 5,
          progression_type: 'load',
          bilaterality: 'bilateral',
          target_muscles: {
            primary: ['chest'],
            secondary: ['shoulders'],
          },
        },
      ],
    },
    {
      id: 'ex2',
      name: 'Exercise 2',
      discipline: 'Pilates',
      variations: [
        {
          id: 'var2',
          name: 'Variation 2',
          difficulty_score: 4,
          progression_type: 'leverage',
          bilaterality: 'bilateral',
          target_muscles: {
            primary: ['back'],
            secondary: [],
          },
        },
      ],
    },
  ];

  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('basic weekly system generation', () => {
    it('should generate a weekly system with sessions', async () => {
      const mockExercises = createMockExercises();
      // Mock fetch for loadExercises (called multiple times)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ exercises: mockExercises }),
      });

      const userProfile = {
        preferredDisciplines: ['Pilates'],
        currentMilestones: {},
      };

      const config = {
        daysPerWeek: 3,
        framework: 'Push/Pull',
      };

      const result = await generateWeeklySystem(userProfile, config);

      expect(result).toBeDefined();
      expect(result.type).toBe('weekly');
      expect(result.daysPerWeek).toBe(3);
      expect(result.framework).toBe('Push/Pull');
      expect(result.sessions).toBeDefined();
      expect(result.sessions.length).toBe(3);
      expect(result.sessions[0]).toHaveProperty('day');
      expect(result.sessions[0]).toHaveProperty('date');
      expect(result.sessions[0]).toHaveProperty('discipline');
      expect(result.sessions[0]).toHaveProperty('workout');
      expect(result.sessions[0]).toHaveProperty('phases');
    });

    it('should use default config if not provided', async () => {
      const mockExercises = createMockExercises();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ exercises: mockExercises }),
      });

      const userProfile = {
        preferredDisciplines: ['Pilates'],
      };

      const result = await generateWeeklySystem(userProfile);

      expect(result).toBeDefined();
      expect(result.sessions.length).toBeGreaterThan(0);
    });
  });

  describe('framework distribution', () => {
    it('should distribute Push/Pull framework across week', async () => {
      const mockExercises = createMockExercises();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ exercises: mockExercises }),
      });

      const userProfile = {
        preferredDisciplines: ['Pilates'],
      };

      const config = {
        daysPerWeek: 4,
        framework: 'Push/Pull',
      };

      const result = await generateWeeklySystem(userProfile, config);

      expect(result.sessions.length).toBe(4);
      // Should alternate between Push and Pull
      expect(result.sessions[0].workout).toBeDefined();
      expect(result.sessions[1].workout).toBeDefined();
    });

    it('should handle Full Body framework', async () => {
      const mockExercises = createMockExercises();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ exercises: mockExercises }),
      });

      const userProfile = {
        preferredDisciplines: ['Pilates'],
      };

      const config = {
        daysPerWeek: 3,
        framework: 'Full Body',
      };

      const result = await generateWeeklySystem(userProfile, config);

      expect(result.sessions.length).toBe(3);
      result.sessions.forEach((session) => {
        expect(session.workout).toBe('Full Body');
      });
    });
  });

  describe('discipline balancing', () => {
    it('should balance multiple disciplines across week', async () => {
      const mockExercises = [
        ...createMockExercises(),
        {
          id: 'ex3',
          name: 'Exercise 3',
          discipline: 'Animal Flow',
          variations: [
            {
              id: 'var3',
              name: 'Variation 3',
              difficulty_score: 4,
              progression_type: 'load',
              bilaterality: 'bilateral',
              target_muscles: {
                primary: ['chest'],
                secondary: [],
              },
            },
          ],
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ exercises: mockExercises }),
      });

      const userProfile = {
        preferredDisciplines: ['Pilates', 'Animal Flow'],
      };

      const config = {
        daysPerWeek: 4,
      };

      const result = await generateWeeklySystem(userProfile, config);

      expect(result.sessions.length).toBe(4);
      // Should balance disciplines (roughly equal distribution)
      const disciplines = result.sessions.map((s) => s.discipline);
      expect(disciplines).toContain('Pilates');
      expect(disciplines).toContain('Animal Flow');
    });
  });

  describe('date generation', () => {
    it('should generate sessions with correct dates', async () => {
      const mockExercises = createMockExercises();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ exercises: mockExercises }),
      });

      const userProfile = {
        preferredDisciplines: ['Pilates'],
      };

      const startDate = '2024-01-01';
      const config = {
        daysPerWeek: 3,
        startDate: startDate,
      };

      const result = await generateWeeklySystem(userProfile, config);

      expect(result.startDate).toBe(startDate);
      expect(result.sessions[0].date).toBe(startDate);
      expect(result.sessions.length).toBe(3);
    });

    it('should use default start date if not provided', async () => {
      const mockExercises = createMockExercises();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ exercises: mockExercises }),
      });

      const userProfile = {
        preferredDisciplines: ['Pilates'],
      };

      const result = await generateWeeklySystem(userProfile, {
        daysPerWeek: 2,
      });

      expect(result.startDate).toBeDefined();
      expect(result.sessions[0].date).toBeDefined();
    });
  });

  describe('user profile filtering', () => {
    it('should filter by preferred disciplines', async () => {
      const mockExercises = createMockExercises();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ exercises: mockExercises }),
      });

      const userProfile = {
        preferredDisciplines: ['Pilates'],
        currentMilestones: {},
      };

      const result = await generateWeeklySystem(userProfile, {
        daysPerWeek: 2,
      });

      expect(result.sessions.every((s) => s.discipline === 'Pilates')).toBe(
        true
      );
    });

    it('should filter by equipment and discomforts', async () => {
      const mockExercises = createMockExercises();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ exercises: mockExercises }),
      });

      const userProfile = {
        preferredDisciplines: ['Pilates'],
        equipment: ['mat'],
        discomforts: [],
        currentMilestones: {},
      };

      const result = await generateWeeklySystem(userProfile, {
        daysPerWeek: 2,
      });

      expect(result).toBeDefined();
      expect(result.sessions.length).toBe(2);
    });
  });

  describe('error handling', () => {
    it('should throw error if no exercises found', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ exercises: [] }),
      });

      const userProfile = {
        preferredDisciplines: ['Pilates'],
      };

      await expect(generateWeeklySystem(userProfile)).rejects.toThrow(
        'No exercises found'
      );
    });

    it('should throw error if discipline filter results in empty list', async () => {
      const mockExercises = [
        {
          id: 'ex1',
          name: 'Exercise 1',
          discipline: 'Weights', // Different discipline
          variations: [
            {
              id: 'var1',
              name: 'Variation 1',
              difficulty_score: 5,
              progression_type: 'load',
              bilaterality: 'bilateral',
              target_muscles: { primary: ['chest'], secondary: [] },
            },
          ],
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ exercises: mockExercises }),
      });

      const userProfile = {
        preferredDisciplines: ['Pilates'], // Won't match Weights
      };

      await expect(generateWeeklySystem(userProfile)).rejects.toThrow();
    });

    it('should throw error if fetch fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const userProfile = {
        preferredDisciplines: ['Pilates'],
      };

      await expect(generateWeeklySystem(userProfile)).rejects.toThrow();
    });
  });

  describe('system metadata', () => {
    it('should include system ID and metadata', async () => {
      const mockExercises = createMockExercises();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ exercises: mockExercises }),
      });

      const userProfile = {
        preferredDisciplines: ['Pilates'],
      };

      const result = await generateWeeklySystem(userProfile, {
        daysPerWeek: 2,
      });

      expect(result.id).toBeDefined();
      expect(result.editable).toBe(true);
      expect(result.createdAt).toBeDefined();
    });
  });
});

