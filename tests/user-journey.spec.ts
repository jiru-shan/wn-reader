import { test, expect } from '@playwright/test';

test.describe('Full User Journey: Auth to Bookmarking', () => {
  
  // Use a timestamp to generate a mathematically unique test user every time the test runs.
  // This guarantees the test never fails due to PostgreSQL unique constraint violations.
  const uniqueId = Date.now();
  const testEmail = `testuser_${uniqueId}@example.com`;
  const testPassword = 'SecurePassword123!';

  test('User can sign up, access dashboard, read a novel, and save a bookmark', async ({ page }) => {
    
    // ==========================================
    // Phase 1: Authentication (Fuli's Domain)
    // ==========================================
    await test.step('Navigate to Sign Up and create an account', async () => {
      await page.goto('/auth/sign-up');
      
      // Target standard accessible input fields
      await page.getByPlaceholder(/name/i).fill('Playwright Tester');
      await page.getByPlaceholder(/email/i).fill(testEmail);
      await page.getByPlaceholder(/password/i).fill(testPassword);
      
      // Submit and wait for the redirect to the dashboard
      await page.getByRole('button', { name: /sign up|register/i }).click();
      await expect(page).toHaveURL(/.*\/dashboard/);
    });

    // ==========================================
    // Phase 2: Dashboard Navigation (Matthew's Domain)
    // ==========================================
    await test.step('Navigate from dashboard to a novel table of contents', async () => {
      // Wait for the dashboard collection to load
      await expect(page.getByRole('heading', { name: /dashboard|collection/i })).toBeVisible();

      // Click on the first available novel link (assumes the database has seeded novels)
      // Playwright will find the first anchor tag pointing to a novel
      const firstNovelLink = page.locator('a[href^="/novel/"]').first();
      await expect(firstNovelLink).toBeVisible();
      await firstNovelLink.click();

      // Verify we arrived at the Table of Contents
      await expect(page.getByRole('heading', { name: /chapters|table of contents/i })).toBeVisible();
    });

    // ==========================================
    // Phase 3: Reader Interface (Jingyao's Domain)
    // ==========================================
    await test.step('Open a chapter and adjust reader settings', async () => {
      // Click the link for Chapter 1
      const chapterOneLink = page.locator('a[href*="/1/0"]').first();
      await chapterOneLink.click();

      // Verify the Reader UI loaded by checking for the layout dropdown
      const layoutSelect = page.locator('select').first();
      await expect(layoutSelect).toBeVisible();

      // Simulate a user preferring single-page view
      await layoutSelect.selectOption('single');
      await expect(layoutSelect).toHaveValue('single');
    });

    // ==========================================
    // Phase 4: Database Actions (David's Domain)
    // ==========================================
    await test.step('Save a manual bookmark and verify execution', async () => {
      // Set up a listener to catch the successful alert from BookmarkButton.tsx
      const dialogPromise = page.waitForEvent('dialog');

      // Click the bookmark button
      const bookmarkBtn = page.getByRole('button', { name: /bookmark this page/i });
      await expect(bookmarkBtn).toBeEnabled();
      await bookmarkBtn.click();

      // Assert the Server Action executed successfully and triggered the UI alert
      const dialog = await dialogPromise;
      expect(dialog.message()).toBe('Bookmark saved!');
      await dialog.accept();
    });

  });
});
