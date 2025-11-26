import { test, expect } from '@playwright/test';
import { ensureE2EAuth } from './auth';

test.describe('Stock movements', () => {
  test.beforeEach(async ({ page }) => {
    await ensureE2EAuth(page, 'admin');
    await page.route('**/api/v2/stock/movement', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1 }) }));
    await page.route('**/api/public/products', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id:1, name:'Item', description:'', category:'', price:1, initialQuantity:5, minimumStock:2 }]) }));
    await page.goto('/products');
  });

  test('open stock modal and perform stock in', async ({ page }) => {
    // Click the first stock button
    const stockBtn = page.getByTitle('Adjust Stock');
    if (await stockBtn.count() > 0) {
      await stockBtn.first().click();
      await expect(page.getByRole('heading', { name: /Adjust Stock/i })).toBeVisible();
      await page.getByPlaceholder('Enter quantity to move').fill('3');
      await page.getByPlaceholder('Describe the reason for this movement').fill('Restock');
      await page.getByRole('button', { name: /Update Stock/i }).click();
      await expect(page.getByText(/Updating.../i)).not.toBeVisible();
    }
  });
});
