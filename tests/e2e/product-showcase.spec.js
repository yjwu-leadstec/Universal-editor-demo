import { test, expect } from '@playwright/test';

const PATH = '/drafts/tmp/product-showcase';

function attachConsoleErrorCollector(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  return errors;
}

test.describe('product-showcase block', () => {
  test('renders cards, background slides, and no console errors', async ({ page }) => {
    const errors = attachConsoleErrorCollector(page);
    await page.goto(PATH);

    const block = page.locator('.product-showcase').first();
    await expect(block).toBeVisible();

    const cards = block.locator('.product-showcase-card');
    await expect(cards).toHaveCount(10);

    const firstCard = cards.first();
    await expect(firstCard.locator('.product-showcase-card-image picture')).toBeVisible();
    await expect(firstCard.locator('.product-showcase-card-title')).toHaveText('Li i6');
    await expect(firstCard.locator('.product-showcase-card-subtitle')).toHaveText(/Flagship/);
    await expect(firstCard.locator('a.product-showcase-card-link')).toHaveAttribute('href', '/products/li-i6');

    const slides = block.locator('.product-showcase-bg-slide');
    await expect(slides).toHaveCount(3);
    await expect(block.locator('.product-showcase-bg-slide.is-active')).toHaveCount(1);

    expect(errors).toEqual([]);
  });

  test('background slides auto-rotate', async ({ page }) => {
    await page.goto(PATH);
    const block = page.locator('.product-showcase').first();
    await expect(block).toBeVisible();

    const firstActive = await block.locator('.product-showcase-bg-slide').first().getAttribute('class');
    expect(firstActive).toContain('is-active');

    await expect(block.locator('.product-showcase-bg-slide').nth(1)).toHaveClass(/is-active/, { timeout: 6000 });
  });

  test('card link is keyboard-focusable and has accessible name', async ({ page }) => {
    await page.goto(PATH);
    const firstLink = page.locator('a.product-showcase-card-link').first();
    await firstLink.focus();
    await expect(firstLink).toBeFocused();
    const accessibleName = await firstLink.evaluate((el) => el.getAttribute('aria-label') || el.textContent.trim());
    expect(accessibleName).toBeTruthy();
  });
});
