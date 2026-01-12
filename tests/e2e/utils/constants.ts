/**
 * E2E Test Constants
 * 
 * Shared constants for E2E tests
 */

export const TEST_TIMEOUTS = {
  SHORT: 2000,
  MEDIUM: 5000,
  LONG: 10000,
  VERY_LONG: 30000,
} as const;

export const SELECTORS = {
  // Pages
  ATHLETE_HOME: '#page-home',
  COACH_HOME: '#page-coach-home',
  CALENDAR: '#page-calendar',
  EXPLORE: '#page-explore',
  PROFILE: '#page-profile',
  
  // Auth
  AUTH_OVERLAY: '#auth-overlay',
  LOGIN_FORM: '[data-tab="login"]',
  SIGNUP_FORM: '[data-tab="signup"]',
  
  // Onboarding
  ONBOARDING_OVERLAY: '#onboarding-overlay',
  ROLE_SELECTION: '#onboarding-role-selection',
  
  // Dashboard
  DAILY_SESSION_CARD: '#daily-session-card',
  START_SESSION_BUTTON: '#start-session-btn',
  GENERATE_PLAN_BUTTON: '#generate-plan-btn',
  
  // Navigation
  SIDEBAR: '#sidebar-container',
  NAV_ITEMS: '.nav-item',
} as const;

export const TEST_DATA = {
  VALID_EMAIL: 'test@example.com',
  VALID_PASSWORD: 'TestPassword123!',
  VALID_DISPLAY_NAME: 'Test User',
} as const;

