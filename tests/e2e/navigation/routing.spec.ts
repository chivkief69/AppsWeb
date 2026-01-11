import { test, expect } from '../fixtures/auth.fixtures';

test.describe('Navigation - Routing', () => {
  test.beforeEach(async ({ loginAsAthlete, page }) => {
    await loginAsAthlete();
  });

  test('should navigate to home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#page-home', { timeout: 10000 });
    
    const homePage = page.locator('#page-home');
    await expect(homePage).toBeVisible();
  });

  test('should navigate to calendar page', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.nav-item[data-page="calendar"]', { timeout: 5000 });
    
    await page.click('.nav-item[data-page="calendar"]');
    await page.waitForTimeout(1000);
    
    const calendarPage = page.locator('#page-calendar');
    await expect(calendarPage).toBeVisible();
  });

  test('should navigate to explore page', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.nav-item[data-page="explore"]', { timeout: 5000 });
    
    await page.click('.nav-item[data-page="explore"]');
    await page.waitForTimeout(1000);
    
    const explorePage = page.locator('#page-explore');
    await expect(explorePage).toBeVisible();
  });

  test('should navigate to profile page', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.nav-item[data-page="profile"]', { timeout: 5000 });
    
    await page.click('.nav-item[data-page="profile"]');
    await page.waitForTimeout(1000);
    
    const profilePage = page.locator('#page-profile');
    await expect(profilePage).toBeVisible();
  });

  test('should update active nav item on navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.nav-item', { timeout: 5000 });
    
    // Click calendar
    const calendarNav = page.locator('.nav-item[data-page="calendar"]');
    await calendarNav.click();
    await page.waitForTimeout(500);
    
    // Check if calendar nav is active
    await expect(calendarNav).toHaveClass(/active/);
    
    // Click home
    const homeNav = page.locator('.nav-item[data-page="home"]');
    await homeNav.click();
    await page.waitForTimeout(500);
    
    // Check if home nav is active
    await expect(homeNav).toHaveClass(/active/);
  });
});

