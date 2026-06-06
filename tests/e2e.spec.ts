import { test, expect } from '@playwright/test';

test.describe('Wn-Reader End-to-End Core Flows', () => {

  // UNAUTHENTICATED TESTS
  test.describe('Security & Guardrails', () => {
    // Explicitly wipe the global login state for this block
    test.use({ storageState: { cookies: [], origins: [] } });

    test('unauthenticated user is redirected from dashboard to sign-in', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/.*\/auth\/sign-in/);
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    });
  });

  // AUTHENTICATED TESTS
  test.describe('Reader UI Features', () => {
    // Inherits Andrew's global logged-in test user
    
    test('reader layout preferences persist across page reloads via localStorage', async ({ page }) => {
      await page.goto('/novel/9/1/0');

      const layoutSelect = page.locator('select').first();
      await expect(layoutSelect).toHaveValue('scroll');

      await layoutSelect.selectOption('single');
      await expect(layoutSelect).toHaveValue('single');

      await page.reload();

      const reloadedLayoutSelect = page.locator('select').first();
      await expect(reloadedLayoutSelect).toHaveValue('single');
    });
  });

});
