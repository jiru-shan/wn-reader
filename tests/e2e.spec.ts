// tests/e2e.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Wn-Reader End-to-End Core Flows', () => {

  // UNAUTHENTICATED TESTS
  test.describe('Security & Guardrails', () => {
    // Override global auth to simulate a logged-out user
    test.use({ storageState: { cookies: [], origins: [] } });

    test('unauthenticated user is redirected from dashboard to sign-in', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/.*\/auth\/sign-in/);
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    });

    test('bookmark button intercepts unauthenticated server action and alerts user', async ({ page }) => {
      await page.goto('/novel/9/1/0');
      let alertMessage = '';
      page.on('dialog', async (dialog) => {
        alertMessage = dialog.message();
        await dialog.accept();
      });

      // Updated locator fix applied here too
      const bookmarkBtn = page.getByRole('button', { name: /bookmark/i });
      await expect(bookmarkBtn).toBeVisible();
      await bookmarkBtn.click();

      expect(alertMessage).toBe('Failed to save bookmark. Are you logged in?');
    });
  });

  // AUTHENTICATED TESTS
  test.describe('Reader UI Features', () => {
    test('reader layout preferences persist across page reloads via localStorage', async ({ page }) => {
      await page.goto('/novel/9/1/0');
      const layoutSelect = page.locator('select').first();
      await expect(layoutSelect).toHaveValue('scroll');
      await layoutSelect.selectOption('single');
      await page.reload();
      const reloadedLayoutSelect = page.locator('select').first();
      await expect(reloadedLayoutSelect).toHaveValue('single');
    });
  });

});
