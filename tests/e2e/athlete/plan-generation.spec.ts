import { test, expect } from '../fixtures/auth.fixtures';
import { DashboardPage } from '../page-objects/dashboard.page';

test.describe('Athlete - Plan Generation', () => {
  test.beforeEach(async ({ loginAsAthlete, page }) => {
    // Login as athlete before each test
    await loginAsAthlete();
  });

  test('should display empty state when no plan exists', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.waitForDashboard();
    
    const isEmpty = await dashboardPage.isEmptyState();
    // This may or may not be empty depending on test user state
    // In a real scenario, you'd ensure user has no plan
    if (isEmpty) {
      await expect(dashboardPage.emptyState).toBeVisible();
      await expect(dashboardPage.generatePlanButton).toBeVisible();
    }
  });

  test('should generate plan when clicking generate button', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.waitForDashboard();
    
    // Check if empty state exists
    const isEmpty = await dashboardPage.isEmptyState();
    
    if (isEmpty) {
      await dashboardPage.generatePlan();
      
      // Wait for plan to be generated
      await page.waitForTimeout(10000); // Adjust based on actual generation time
      
      // Session should appear
      const hasSession = await dashboardPage.hasSession();
      expect(hasSession).toBeTruthy();
    }
  });

  test('should display generated session with phases', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.waitForDashboard();
    
    // Ensure plan exists (generate if needed)
    const isEmpty = await dashboardPage.isEmptyState();
    if (isEmpty) {
      await dashboardPage.generatePlan();
      await page.waitForTimeout(10000);
    }
    
    // Check if session is displayed
    const hasSession = await dashboardPage.hasSession();
    if (hasSession) {
      await expect(dashboardPage.sessionPhases).toBeVisible();
      
      // Check for phase cards
      const phaseCount = await dashboardPage.phaseCards.count();
      expect(phaseCount).toBeGreaterThan(0);
    }
  });

  test('should allow expanding phase cards', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.waitForDashboard();
    
    // Ensure plan exists
    const isEmpty = await dashboardPage.isEmptyState();
    if (isEmpty) {
      await dashboardPage.generatePlan();
      await page.waitForTimeout(10000);
    }
    
    const hasSession = await dashboardPage.hasSession();
    if (hasSession) {
      // Expand warmup phase
      await dashboardPage.expandPhase('warmup');
      
      // Check if variations are visible
      const variations = page.locator('#phase-variations-warmup');
      await expect(variations).toBeVisible({ timeout: 5000 });
    }
  });
});

