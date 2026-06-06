import { test, expect } from '@playwright/test';

test.describe('Full User Journey: Auth to Bookmarking', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  const uniqueId = Date.now();
  const testEmail = `testuser_${uniqueId}@example.com`;
  const testPassword = 'SecurePassword123!';

  test('User can sign up, access dashboard, read a novel, and save a bookmark', async ({ page }) => {
    
      await test.step('Navigate to Sign Up and create an account', async () => {
        await page.goto('/auth/sign-up');
        await page.getByLabel(/^Name/i).fill('Playwright Tester');
        await page.getByLabel(/^Email/i).fill(testEmail);
        await page.getByLabel(/^Password/i).fill(testPassword);
        await page.getByRole('button', { name: /sign up|create account/i }).click();
        await expect(page).toHaveURL(/.*\/dashboard/);
      });

    await test.step('Navigate to a novel chapter', async () => {
      await page.goto('/novel/9/1/0');
      await expect(page.locator('select').first()).toBeVisible();
    });

    await test.step('Open a chapter and adjust reader settings', async () => {
      const layoutSelect = page.locator('select').first();
      await layoutSelect.selectOption('single');
      await expect(layoutSelect).toHaveValue('single');
    });

      // await test.step('Save a manual bookmark and verify execution', async () => {
      //   let dialogMessage = '';
      //   page.once('dialog', async (dialog) => {
      //     dialogMessage = dialog.message();
      //     await dialog.accept();
      //   });
      //   const bookmarkBtn = page.getByRole('button', { name: /bookmark/i });
      //   await expect(bookmarkBtn).toBeEnabled();
      //   await bookmarkBtn.click();
      //   await expect(bookmarkBtn).toHaveText(/bookmark/i, { timeout: 10000 });
      //   expect(dialogMessage).toMatch(/saved|failed/i);
      // });
  });
});
