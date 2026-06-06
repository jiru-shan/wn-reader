import { test, expect } from '@playwright/test';

test.describe('Wn-Reader End-to-End Core Flows', () => {
  // TEST: Authentication & Routing Protection 
  // Adapted from Andrew's Contribution
  test('unauthenticated user is redirected from dashboard to sign-in', async ({ page }) => {
    // Attempt to access a protected route
    await page.goto('/dashboard');
    
    // Assert that the application intercepted the request and redirected to auth
    await expect(page).toHaveURL(/.*\/auth\/sign-in/);
    
    // Verify the Auth UI rendered correctly
    // Note: Adjust the exact text depending on Fuli's sign-in page design
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  // TEST: Reader UI Preferences Persistence
  test('reader layout preferences persist across page reloads via localStorage', async ({ page }) => {
    // Go to a dummy chapter route (the DB doesn't need to exist, the UI will still mount)
    await page.goto('/novel/9/1/0');

    // Locate the Layout dropdown (defaults to 'scroll')
    const layoutSelect = page.locator('select').first();
    await expect(layoutSelect).toHaveValue('scroll');

    // Change the layout to 'single'
    await layoutSelect.selectOption('single');
    await expect(layoutSelect).toHaveValue('single');

    // Force a hard page reload
    await page.reload();

    // Assert that the ReaderUI accurately read localStorage on mount and maintained 'single'
    const reloadedLayoutSelect = page.locator('select').first();
    await expect(reloadedLayoutSelect).toHaveValue('single');
  });

  // TEST: Server Action Auth Rejection
  test('bookmark button intercepts unauthenticated server action and alerts user', async ({ page }) => {
    await page.goto('/novel/9/1/0');

    // Set up a listener to catch the browser alert triggered by the BookmarkButton.tsx catch block
    let alertMessage = '';
    page.on('dialog', async (dialog) => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    // Locate and click the bookmark button
    const bookmarkBtn = page.locator('button', { hasText: 'Bookmark this page' });
    await expect(bookmarkBtn).toBeVisible();
    await bookmarkBtn.click();

    // Assert that the Server Action rejected the insertion (because there is no session)
    // and correctly bubbled the error up to the UI alert
    expect(alertMessage).toBe('Failed to save bookmark. Are you logged in?');
  });

});
