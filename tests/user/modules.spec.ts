import { test, expect } from '@playwright/test'; 

test.describe('User Dashboard Module', () => { 
  test('should load dashboard successfully', async ({ page }) => { 
    await page.goto('/dashboard'); 
    await expect(page.locator('h1, h2, .text-2xl')).toContainText(/Dashboard|Overview|Welcome/i); 
  }); 
}); 

test.describe('User Feed Module', () => { 
  test('should load feed successfully', async ({ page }) => { 
    await page.goto('/feed'); 
    await expect(page).toHaveURL(/.*feed/); 
    await expect(page.locator('h1, h2, .text-2xl')).toContainText(/Feed|Social|Community/i); 
  }); 
}); 

test.describe('User Marketplace Module', () => { 
  test('should load marketplace successfully', async ({ page }) => { 
    await page.goto('/marketplace'); 
    await expect(page).toHaveURL(/.*marketplace/); 
    await expect(page.locator('h1, h2, .text-2xl')).toContainText(/Marketplace|Shop|Products/i); 
  }); 
}); 

test.describe('User Profile Module', () => { 
  test('should load profile successfully', async ({ page }) => { 
    await page.goto('/profile'); 
    await expect(page).toHaveURL(/.*profile/); 
    await expect(page.locator('h1, h2, .text-2xl')).toContainText(/Profile|Account|Settings/i); 
  }); 
}); 

test.describe('User Events Module', () => { 
  test('should load events successfully', async ({ page }) => { 
    await page.goto('/events'); 
    await expect(page).toHaveURL(/.*events/); 
    await expect(page.locator('h1, h2, .text-2xl')).toContainText(/Events|Calendar/i); 
  }); 
});