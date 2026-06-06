import { test, expect } from '@playwright/test';

test('redirects if not authenticated', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  await expect(page).toHaveURL('http://localhost:3000/auth/sign-in');
});

/*
test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Click the get started link.
  await page.getByRole('link', { name: 'Get started' }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});
*/
