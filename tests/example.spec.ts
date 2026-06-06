import { test, expect } from '@playwright/test';

test('redirects to dashboard', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  await expect(page).toHaveURL('http://localhost:3000/dashboard');
});
