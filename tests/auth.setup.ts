import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

// mostly following https://playwright.dev/docs/auth
setup('authenticate', async ({ page }) => {
  await page.goto('http://localhost:3000/auth/sign-in');
  await page.getByLabel('Email').fill('test-user@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  // Wait until the page receives the cookies.
  //
  // Sometimes login flow sets cookies in the process of several redirects.
  // Wait for the final URL to ensure that the cookies are actually set.
  await page.waitForURL('http://localhost:3000/dashboard');

  await page.context().storageState({ path: authFile });
});
