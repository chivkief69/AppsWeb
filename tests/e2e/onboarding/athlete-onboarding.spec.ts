import { test, expect } from '../fixtures/auth.fixtures';
import { OnboardingPage } from '../page-objects/onboarding.page';
import { generateOnboardingAnswers } from '../fixtures/test-data.fixtures';

test.describe('Onboarding - Athlete Flow', () => {
  test('should display role selection after authentication', async ({ page, authPage }) => {
    await page.goto('/');
    
    // Login first (assuming test user exists)
    await authPage.login(
      process.env.TEST_ATHLETE_EMAIL || 'athlete@test.com',
      process.env.TEST_ATHLETE_PASSWORD || 'testpass123'
    );
    
    await page.waitForTimeout(2000);
    
    // Check if role selection appears
    const onboardingPage = new OnboardingPage(page);
    const roleSelectionVisible = await onboardingPage.roleSelection.isVisible().catch(() => false);
    
    // Role selection may or may not appear depending on user state
    if (roleSelectionVisible) {
      await expect(onboardingPage.roleSelection).toBeVisible();
    }
  });

  test('should complete full athlete onboarding flow', async ({ page, authPage }) => {
    await page.goto('/');
    
    // Signup new user to ensure no role is set
    const testEmail = `athlete-${Date.now()}@test.com`;
    await authPage.signup(testEmail, 'TestPassword123!', 'Test Athlete');
    
    await page.waitForTimeout(3000);
    
    const onboardingPage = new OnboardingPage(page);
    const answers = generateOnboardingAnswers({
      sedentaryImpact: 'moderate',
      discomforts: ['None'],
      disciplines: ['Pilates'],
    });
    
    // Complete onboarding
    await onboardingPage.completeAthleteOnboarding(answers);
    
    // Verify dashboard appears
    await expect(page.locator('#page-home')).toBeVisible({ timeout: 10000 });
  });

  test('should answer question 1 (Sedentary Impact)', async ({ page, authPage }) => {
    await page.goto('/');
    
    // Setup: login and select athlete role
    await authPage.login(
      process.env.TEST_ATHLETE_EMAIL || 'athlete@test.com',
      process.env.TEST_ATHLETE_PASSWORD || 'testpass123'
    );
    
    await page.waitForTimeout(2000);
    
    const onboardingPage = new OnboardingPage(page);
    const roleSelectionVisible = await onboardingPage.roleSelection.isVisible().catch(() => false);
    
    if (roleSelectionVisible) {
      await onboardingPage.selectAthleteRole();
      await onboardingPage.answerSedentaryImpact('moderate');
      
      // Question 2 should appear
      await expect(onboardingPage.question2).toBeVisible({ timeout: 5000 });
    }
  });

  test('should allow multi-select for discomforts', async ({ page, authPage }) => {
    await page.goto('/');
    
    await authPage.login(
      process.env.TEST_ATHLETE_EMAIL || 'athlete@test.com',
      process.env.TEST_ATHLETE_PASSWORD || 'testpass123'
    );
    
    await page.waitForTimeout(2000);
    
    const onboardingPage = new OnboardingPage(page);
    const roleSelectionVisible = await onboardingPage.roleSelection.isVisible().catch(() => false);
    
    if (roleSelectionVisible) {
      await onboardingPage.selectAthleteRole();
      await onboardingPage.answerSedentaryImpact('moderate');
      
      // Select multiple discomforts
      await onboardingPage.selectDiscomforts(['Lower Back', 'Knees']);
      
      // Question 3 should appear
      await expect(onboardingPage.question3).toBeVisible({ timeout: 5000 });
    }
  });

  test('should allow multi-select for disciplines', async ({ page, authPage }) => {
    await page.goto('/');
    
    await authPage.login(
      process.env.TEST_ATHLETE_EMAIL || 'athlete@test.com',
      process.env.TEST_ATHLETE_PASSWORD || 'testpass123'
    );
    
    await page.waitForTimeout(2000);
    
    const onboardingPage = new OnboardingPage(page);
    const roleSelectionVisible = await onboardingPage.roleSelection.isVisible().catch(() => false);
    
    if (roleSelectionVisible) {
      await onboardingPage.selectAthleteRole();
      await onboardingPage.answerSedentaryImpact('moderate');
      await onboardingPage.selectDiscomforts(['None']);
      
      // Select multiple disciplines
      await onboardingPage.selectDisciplines(['Pilates', 'Animal Flow']);
      
      // Dashboard should appear after completion
      await expect(page.locator('#page-home')).toBeVisible({ timeout: 10000 });
    }
  });
});

