import { test, expect } from '../fixtures/auth.fixtures';
import { generateTestEmail } from '../fixtures/test-data.fixtures';

test.describe('Authentication - Signup', () => {
  test('should display signup form when switching to signup tab', async ({ page, authPage }) => {
    await page.goto('/');
    await authPage.waitForAuthOverlay();
    await authPage.switchToSignup();
    
    await expect(authPage.displayNameInput).toBeVisible();
    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.passwordInput).toBeVisible();
    await expect(authPage.signupButton).toBeVisible();
  });

  test('should successfully signup with valid credentials', async ({ page, authPage }) => {
    await page.goto('/');
    
    const testEmail = generateTestEmail('signup');
    const testPassword = 'TestPassword123!';
    const testDisplayName = 'Test User';
    
    await authPage.signup(testEmail, testPassword, testDisplayName);
    
    // Wait for signup to complete
    await page.waitForTimeout(3000);
    
    // Auth overlay should disappear or role selection should appear
    const authHidden = await authPage.authOverlay.isHidden().catch(() => false);
    const roleSelectionVisible = await page.locator('#onboarding-role-selection').isVisible().catch(() => false);
    
    expect(authHidden || roleSelectionVisible).toBeTruthy();
  });

  test('should show error for invalid email format', async ({ page, authPage }) => {
    await page.goto('/');
    await authPage.switchToSignup();
    
    await authPage.displayNameInput.fill('Test User');
    await authPage.emailInput.fill('invalid-email');
    await authPage.passwordInput.fill('TestPassword123!');
    await authPage.signupButton.click();
    
    // Wait for validation error
    await page.waitForTimeout(1000);
    
    // Check for email validation error (browser native or custom)
    const emailInput = authPage.emailInput;
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  test('should show error for weak password', async ({ page, authPage }) => {
    await page.goto('/');
    await authPage.switchToSignup();
    
    await authPage.displayNameInput.fill('Test User');
    await authPage.emailInput.fill(generateTestEmail('signup'));
    await authPage.passwordInput.fill('weak');
    await authPage.signupButton.click();
    
    // Wait for validation
    await page.waitForTimeout(1000);
    
    // Check for password validation error
    const passwordInput = authPage.passwordInput;
    const isInvalid = await passwordInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });
});

