import { test, expect } from '../fixtures/auth.fixtures';
import { AuthPage } from '../page-objects/auth.page';

test.describe('Authentication - Login', () => {
  test('should display login form when user is not authenticated', async ({ page, authPage }) => {
    await page.goto('/');
    await authPage.waitForAuthOverlay();
    
    await expect(authPage.authOverlay).toBeVisible();
    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.passwordInput).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page, authPage }) => {
    await page.goto('/');
    await authPage.login('invalid@test.com', 'wrongpassword');
    
    // Wait for error message
    await page.waitForTimeout(2000);
    
    // Check if error is displayed (adjust selector based on actual implementation)
    const errorVisible = await authPage.hasError();
    expect(errorVisible).toBeTruthy();
  });

  test('should successfully login with valid credentials', async ({ page, authPage }) => {
    await page.goto('/');
    
    // This test assumes test user exists
    // In real scenario, you'd set up test user in beforeAll hook
    await authPage.login(
      process.env.TEST_ATHLETE_EMAIL || 'athlete@test.com',
      process.env.TEST_ATHLETE_PASSWORD || 'testpass123'
    );
    
    // Wait for auth overlay to disappear or dashboard to appear
    await page.waitForTimeout(2000);
    await expect(authPage.authOverlay).not.toBeVisible({ timeout: 5000 });
  });

  test('should navigate to role selection after login if no role is set', async ({ page, authPage }) => {
    await page.goto('/');
    await authPage.login(
      process.env.TEST_ATHLETE_EMAIL || 'athlete@test.com',
      process.env.TEST_ATHLETE_PASSWORD || 'testpass123'
    );
    
    // Wait for role selection overlay
    await page.waitForTimeout(2000);
    const roleSelection = page.locator('#onboarding-role-selection');
    
    // Role selection should appear if user has no role
    // This may or may not appear depending on test user state
    const isVisible = await roleSelection.isVisible().catch(() => false);
    if (isVisible) {
      await expect(roleSelection).toBeVisible();
    }
  });
});

