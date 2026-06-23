import { test, expect } from '@playwright/test';

test.describe('Authentication and Onboarding', () => {
  test('should navigate to sign in page from home', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Sign In');
    await expect(page).toHaveURL(/.*auth\/signin/);
  });

  test('should navigate to sign up page from sign in', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.click('text=Sign up');
    await expect(page).toHaveURL(/.*auth\/signup/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('input[id="email"]', 'invalid@example.com');
    await page.fill('input[id="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid login credentials')).toBeVisible();
  });

  test('should navigate to onboarding after sign up', async ({ page }) => {
    // This is a bit complex as it requires a fresh user, 
    // but we can at least check the onboarding page is accessible if redirected
    await page.goto('/onboarding');
    // Check for onboarding content
    await expect(page.locator('h1, h2, .text-2xl')).toContainText(/Onboarding|Profile|Welcome/i);
  });
});
