import { test, expect } from '@playwright/test';
import { ensureE2EAuth } from './auth';

test.describe('Product modal', () => {
  test.beforeEach(async ({ page }) => {
    await ensureE2EAuth(page, 'admin');
    // Mock endpoints used by the page
    await page.route('**/api/v2/products', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/public/products', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.goto('/products');
  });

  test('open create modal and validate required fields', async ({ page }) => {
    await page.getByRole('button', { name: /New Product/i }).click();
    await expect(page.getByRole('heading', { name: /Create New Product/i })).toBeVisible();

    // Try to submit empty form and expect validation error in modal (client-side)
    await page.getByRole('button', { name: /Create Product/i }).click();
    await expect(page.getByText('Product name is required')).toBeVisible();
  });

  test('submit form successfully (mock POST)', async ({ page }) => {
    // Intercept create call and respond with created product
    await page.route('**/api/v2/products', route => {
      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        body.id = 9999;
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(body) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      }
    });

    await page.getByRole('button', { name: /New Product/i }).click();
    await page.getByPlaceholder('Enter product name').fill('E2E Test Product');
    await page.getByPlaceholder('Enter product description').fill('Desc');
    await page.getByPlaceholder('Enter category').fill('E2E');
    await page.getByPlaceholder('0.00').fill('9.99');
    await page.getByRole('button', { name: /Create Product/i }).click();

    // Expect success message to appear (from UI after fetch)
    await expect(page.getByText(/Product created successfully/i)).toBeVisible();
  });
});
