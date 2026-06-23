import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Module', () => {
  test('should load admin dashboard successfully', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('h1, h2, .text-2xl')).toContainText(/Admin|Dashboard|Overview/i);
  });
});

test.describe('User Management Module', () => {
  test('should load users page successfully', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/.*admin\/users/);
    await expect(page.locator('h1, h2, .text-2xl')).toContainText(/Users|Management|Members/i);
  });
});

test.describe('CMS Module', () => {
  test('should load CMS pages successfully', async ({ page }) => {
    await page.goto('/admin/cms');
    await expect(page).toHaveURL(/.*admin\/cms/);
    await expect(page.locator('h1, h2, .text-2xl')).toContainText(/CMS|Content|Pages/i);
  });
});

test.describe('Settings Module', () => {
  test('should load settings page successfully', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page).toHaveURL(/.*admin\/settings/);
    await expect(page.locator('h1, h2, .text-2xl')).toContainText(/Settings|Configuration/i);
  });
});

test.describe('Financials Module', () => {
  test('should load financials page successfully', async ({ page }) => {
    await page.goto('/admin/financials');
    await expect(page).toHaveURL(/.*admin\/financials/);
    await expect(page.locator('h1, h2, .text-2xl')).toContainText(/Financials|Payments|Revenue/i);
  });
});
