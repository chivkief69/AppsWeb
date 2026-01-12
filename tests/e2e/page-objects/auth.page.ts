import { Page, Locator } from '@playwright/test';

/**
 * Auth Page Object Model
 * 
 * Encapsulates authentication UI interactions for E2E tests.
 */
export class AuthPage {
  readonly page: Page;
  readonly authOverlay: Locator;
  readonly loginTab: Locator;
  readonly signupTab: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly displayNameInput: Locator;
  readonly loginButton: Locator;
  readonly signupButton: Locator;
  readonly googleLoginButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.authOverlay = page.locator('#auth-overlay');
    this.loginTab = page.locator('[data-tab="login"]');
    this.signupTab = page.locator('[data-tab="signup"]');
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.displayNameInput = page.locator('input[name="displayName"]');
    this.loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In")');
    this.signupButton = page.locator('button:has-text("Sign Up"), button:has-text("Create Account")');
    this.googleLoginButton = page.locator('button:has-text("Google")');
    this.forgotPasswordLink = page.locator('a:has-text("Forgot"), a:has-text("Reset")');
    this.errorMessage = page.locator('.error-message, .auth-error');
  }

  /**
   * Wait for auth overlay to be visible
   */
  async waitForAuthOverlay() {
    // Wait for the overlay element to exist first (don't check visibility yet)
    await this.page.waitForSelector('#auth-overlay', { state: 'attached', timeout: 10000 });
    
    // Also wait for template content to be loaded (check for inner content)
    await this.page.waitForFunction(
      () => {
        const overlay = document.getElementById('auth-overlay');
        if (!overlay) return false;
        // Check if template content has been loaded
        const hasContent = overlay.innerHTML.trim() !== '' || 
                         overlay.querySelector('#auth-login') !== null ||
                         overlay.querySelector('.auth-overlay') !== null;
        return hasContent;
      },
      { timeout: 10000 }
    );
    
    // Then wait for it to be visible (not hidden and display is not none)
    await this.page.waitForFunction(
      () => {
        const overlay = document.getElementById('auth-overlay');
        if (!overlay) return false;
        const hasHidden = overlay.classList.contains('hidden');
        const computedStyle = window.getComputedStyle(overlay);
        const display = computedStyle.display;
        const visibility = computedStyle.visibility;
        const opacity = computedStyle.opacity;
        
        // Overlay is visible if:
        // 1. Doesn't have 'hidden' class
        // 2. Display is not 'none'
        // 3. Visibility is not 'hidden'
        // 4. Opacity is not '0'
        const isVisible = !hasHidden && 
                         display !== 'none' && 
                         visibility !== 'hidden' && 
                         opacity !== '0';
        
        // Also check if the inner template content is visible
        const templateContent = overlay.querySelector('.auth-overlay') || overlay.firstElementChild;
        if (templateContent) {
          const templateStyle = window.getComputedStyle(templateContent);
          const templateDisplay = templateStyle.display;
          const templateVisibility = templateStyle.visibility;
          const templateOpacity = templateStyle.opacity;
          
          return isVisible && 
                 templateDisplay !== 'none' && 
                 templateVisibility !== 'hidden' && 
                 templateOpacity !== '0';
        }
        
        return isVisible;
      },
      { timeout: 15000 }
    );
  }

  /**
   * Switch to login tab
   */
  async switchToLogin() {
    await this.loginTab.click();
  }

  /**
   * Switch to signup tab
   */
  async switchToSignup() {
    await this.signupTab.click();
  }

  /**
   * Fill login form and submit
   */
  async login(email: string, password: string) {
    await this.waitForAuthOverlay();
    await this.switchToLogin();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /**
   * Fill signup form and submit
   */
  async signup(email: string, password: string, displayName: string) {
    await this.waitForAuthOverlay();
    await this.switchToSignup();
    await this.displayNameInput.fill(displayName);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signupButton.click();
  }

  /**
   * Click Google login button
   */
  async loginWithGoogle() {
    await this.waitForAuthOverlay();
    await this.googleLoginButton.click();
  }

  /**
   * Initiate password reset
   */
  async resetPassword(email: string) {
    await this.waitForAuthOverlay();
    await this.switchToLogin();
    await this.forgotPasswordLink.click();
    await this.emailInput.fill(email);
    // Assuming there's a submit button for password reset
    await this.page.locator('button:has-text("Send"), button:has-text("Reset")').click();
  }

  /**
   * Check if error message is visible
   */
  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }
}

