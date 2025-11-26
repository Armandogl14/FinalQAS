import { test, expect } from '@playwright/test';
import { ensureE2EAuth } from './auth';

test.describe('Public Products page', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure E2E mock auth is available (will be used by the app's keycloak mock)
    await ensureE2EAuth(page, 'guest');
  });

  test('loads products page and shows heading', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/products`);
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
  });

  test('search input filters results', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/products`);
    const search = page.getByPlaceholder('Search products...');
    await search.fill('nonexistent-product-12345');
    // expect no results (empty state)
    await expect(page.getByText('No products found')).toBeVisible();
  });
});
