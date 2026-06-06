import { test, expect, chromium, type Browser, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

async function login(page: Page) {
  await page.goto(`${BASE_URL}/auth/sign-in`);
  await page.fill('input[type="email"]', 'asdfg@gmail.com');
  await page.fill('input[type="password"]', 'jingyaoii');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  await expect(page.locator('h1', { hasText: 'Your collection' })).toBeVisible({ timeout: 10000 });
}

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('reader', () => {
  let browser: Browser;
  let page: Page;

  const novelId = 4;
  const chapterId = 5;
  const readerUrl = `${BASE_URL}/novel/${novelId}/read/${chapterId}/0`;

  test.beforeAll(async () => {
    browser = await chromium.launch({ headless: false });
    page = await browser.newContext().then(ctx => ctx.newPage());
    await login(page);
  });

  test.afterAll(() => browser.close());

  test.beforeEach(async () => {
    await page.goto(readerUrl);
    await page.waitForTimeout(600);
  });

  test('renders chapter content', async () => {
    const article = page.locator('article').first();
    await expect(article).toBeVisible({ timeout: 10000 });
    await expect(article).not.toBeEmpty();
  });

  test('font family dropdown', async () => {
    const article = page.locator('article').first();
    const select = page.locator('select').nth(1);

    for (const font of ['font-sans', 'font-mono', 'font-serif']) {
      await select.selectOption(font);
      await expect(article).toHaveClass(new RegExp(font));
    }
  });

  test('font size slider', async () => {
    const slider = page.locator('input[type="range"]').first();
    const main = page.locator('main');

    for (const size of ['20', '24', '14']) {
      await slider.fill(size);
      await expect(main).toHaveCSS('font-size', `${size}px`);
    }
  });

  test('theme buttons', async () => {
    const wrapper = page.locator('div.transition-colors.w-full').first();

    await page.locator('button[class*="bg-\\[#fbfbfb\\]"]').click();
    await expect(wrapper).toHaveClass(/fbfbfb/, { timeout: 3000 });

    await page.locator('button[class*="bg-\\[#f4ecd8\\]"]').click();
    await expect(wrapper).toHaveClass(/f4ecd8/, { timeout: 3000 });

    await page.locator('button[class*="bg-\\[#121212\\]"]').click();
    await expect(wrapper).toHaveClass(/121212/, { timeout: 3000 });
  });

  test('scroll percentage updates url', async () => {
    await page.waitForTimeout(800);
    const urlBefore = page.url();

    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight * 0.5, behavior: 'instant' }));
    await page.waitForTimeout(100);
    await page.evaluate(() => window.scrollBy(0, 1));

    await page.waitForURL(url => url.toString() !== urlBefore, { timeout: 5000 });

    const parts = new URL(page.url()).pathname.split('/').filter(Boolean);
    expect(Number.isFinite(Number(parts.at(-1)))).toBe(true);
  });

  test('single page layout shows pagination', async () => {
    await page.locator('select').nth(0).selectOption('single');
    const pageSpan = page.locator('span').filter({ hasText: /Page \d+ of \d+/ });
    await expect(pageSpan).toContainText('Page 1 of', { timeout: 5000 });
    await expect(page.locator('button', { hasText: 'Prev' })).toBeDisabled();
  });

  test('double page layout shows pagination', async () => {
    await page.locator('select').nth(0).selectOption('double');
    const pageSpan = page.locator('span').filter({ hasText: /Page \d+ of \d+/ });
    await expect(pageSpan).toContainText('Page 1 of', { timeout: 5000 });
  });

  test('paginated next/prev navigation', async () => {
    await page.goto(`${BASE_URL}/novel/6/7/0`);
    await page.waitForTimeout(600);
    await page.locator('select').nth(0).selectOption('single');

    const nav = page.locator('div').filter({
      has: page.locator('button', { hasText: 'Prev' }),
    }).filter({
      has: page.locator('button', { hasText: 'Next' }),
    }).last();

    await expect(nav).toBeVisible({ timeout: 5000 });
    await expect(nav).not.toContainText('Page 1 of 0', { timeout: 5000 });

    const match = (await nav.innerText()).match(/Page \d+ of (\d+)/);
    const totalPages = match ? Number(match[1]) : 1;

    if (totalPages > 1) {
      await nav.locator('button', { hasText: 'Next' }).click();
      await expect(nav).toContainText('Page 2 of', { timeout: 3000 });
      await nav.locator('button', { hasText: 'Prev' }).click();
      await expect(nav).toContainText('Page 1 of', { timeout: 3000 });
    }

    await page.goto(readerUrl);
  });

  test('switching back to scroll layout', async () => {
    const select = page.locator('select').nth(0);
    await select.selectOption('single');
    await expect(page.locator('span').filter({ hasText: /Page \d+ of \d+/ })).toContainText('Page 1 of', { timeout: 5000 });
    await select.selectOption('scroll');
    await expect(page.locator('article').first()).toBeVisible({ timeout: 5000 });
  });

  test('bookmark button states', async () => {
    const btn = page.locator('button', { hasText: 'BOOKMARK' });
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(page.locator('button', { hasText: 'SAVING...' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'SAVED' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button', { hasText: 'BOOKMARK' })).toBeVisible({ timeout: 5000 });
  });

  test('bookmark api returns 200', async () => {
    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/bookmarks') && r.request().method() === 'POST'),
      page.locator('button', { hasText: 'BOOKMARK' }).click(),
    ]);
    expect(response.status()).toBe(200);
    expect((await response.json()).success).toBe(true);
  });

  test('bookmark api returns 401 when logged out', async () => {
    const ctx = await browser.newContext();
    const response = await ctx.request.post(`${BASE_URL}/api/bookmarks`, {
      headers: { 'Content-Type': 'application/json' },
      data: { novelId, chapterId, percentage: 50 },
    });
    await ctx.close();
    expect(response.status()).toBe(401);
  });

  test('table of contents link', async () => {
    await page.locator('a', { hasText: 'Table of Contents' }).click();
    await expect(page).toHaveURL(new RegExp(`/novel/${novelId}`), { timeout: 5000 });
  });
});

test.describe('dashboard', () => {
  let browser: Browser;
  let page: Page;

  const novel = {
    id: 6,
    title: 'A Novel for My Empty Dashboard',
    author: 'jingyao',
    synopsis: 'This is an amazing synposis',
  };

  test.beforeAll(async () => {
    browser = await chromium.launch({ headless: false });
    page = await browser.newContext().then(ctx => ctx.newPage());
    await login(page);
  });

  test.afterAll(() => browser.close());

  test('renders collection heading', async () => {
    await expect(page.locator('h1', { hasText: 'Your collection' })).toBeVisible();
  });

  test('novel card shows correct metadata', async () => {
    const card = page.locator('li').filter({ has: page.locator('a', { hasText: novel.title }) });
    await expect(card).toBeVisible({ timeout: 5000 });
    await expect(card).toContainText(novel.author);
    await expect(card).toContainText(novel.synopsis);
  });

  test('search filters collection', async () => {
    const input = page.locator('input[type="search"]');
    const card = page.locator('li').filter({ has: page.locator('a', { hasText: novel.title }) });

    await input.fill(novel.title.slice(0, 8));
    await expect(card).toBeVisible({ timeout: 3000 });

    await input.fill('nomatch');
    await expect(page.locator('text=None of the novels in your collection match your search query.')).toBeVisible({ timeout: 3000 });

    await input.fill('');
    await expect(card).toBeVisible({ timeout: 3000 });
  });

  test('novel card navigates to toc', async () => {
    await page.locator('a', { hasText: novel.title }).click();
    await expect(page).toHaveURL(new RegExp(`/novel/${novel.id}`), { timeout: 5000 });
    await expect(page.locator('h1', { hasText: novel.title })).toBeVisible({ timeout: 5000 });
  });
});

test.describe('toc', () => {
  let browser: Browser;
  let page: Page;

  const novel = {
    id: 6,
    title: 'A Novel for My Empty Dashboard',
    author: 'jingyao',
  };

  test.beforeAll(async () => {
    browser = await chromium.launch({ headless: false });
    page = await browser.newContext().then(ctx => ctx.newPage());
    await login(page);
    await page.goto(`${BASE_URL}/novel/${novel.id}`);
    await expect(page.locator('h1', { hasText: novel.title })).toBeVisible({ timeout: 10000 });
  });

  test.afterAll(() => browser.close());

  test('renders novel metadata', async () => {
    await expect(page.locator('h1', { hasText: novel.title })).toBeVisible();
    await expect(page.locator('p', { hasText: novel.author })).toBeVisible();
  });

  test('renders chapter list', async () => {
    await expect(page.locator('h2', { hasText: 'Chapters' })).toBeVisible();
    await expect(page.locator('h2', { hasText: 'Chapters' }).locator('~ ul a').first()).toBeVisible({ timeout: 5000 });
  });

  test('chapter link opens reader', async () => {
    await page.locator('h2', { hasText: 'Chapters' }).locator('~ ul a').first().click();
    await expect(page).toHaveURL(new RegExp(`/novel/${novel.id}/`), { timeout: 5000 });
    await expect(page.locator('article').first()).toBeVisible({ timeout: 10000 });
  });

  test('back to dashboard link', async () => {
    await page.goto(`${BASE_URL}/novel/${novel.id}`);
    await page.locator('a', { hasText: 'Back to Dashboard' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
    await expect(page.locator('h1', { hasText: 'Your collection' })).toBeVisible({ timeout: 5000 });
  });

  test('bookmarks section appears after saving', async () => {
    await page.goto(`${BASE_URL}/novel/${novel.id}`);
    await page.locator('h2', { hasText: 'Chapters' }).locator('~ ul a').first().click();
    await page.waitForTimeout(600);

    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/bookmarks') && r.request().method() === 'POST'),
      page.locator('button', { hasText: 'BOOKMARK' }).click(),
    ]);
    expect(response.status()).toBe(200);

    await page.goto(`${BASE_URL}/novel/${novel.id}`);
    await expect(page.locator('h2', { hasText: 'Bookmarks' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('h2', { hasText: 'Bookmarks' }).locator('~ ul a').first()).toBeVisible({ timeout: 3000 });
  });
});