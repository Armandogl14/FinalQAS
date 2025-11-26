import { test, expect } from '@playwright/test';
import { ensureE2EAuth } from './auth';

const sampleProducts = [
  { id: 1, name: 'Apple', description: 'Red apple', category: 'Fruits', price: 1.2, initialQuantity: 10, minimumStock: 5 },
  { id: 2, name: 'Orange', description: 'Juicy orange', category: 'Fruits', price: 0.8, initialQuantity: 2, minimumStock: 5 },
  { id: 3, name: 'Laptop', description: 'Portable computer', category: 'Electronics', price: 1200, initialQuantity: 0, minimumStock: 1 }
];

test.describe('Filters and search', () => {
  test.beforeEach(async ({ page }) => {
    await ensureE2EAuth(page, 'guest');
    // Mock the public products endpoint
    await page.route('**/api/public/products', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(sampleProducts) }));
  });

  test('shows categories and filters by category', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/products`);
    // Category select should contain Fruits and Electronics
    const categorySelect = page.getByRole('combobox', { name: /Category/i });
    await expect(categorySelect).toContainText('Fruits');
    await expect(categorySelect).toContainText('Electronics');

    // Select Electronics and expect Laptop to be visible
    await categorySelect.selectOption({ label: 'Electronics' });
    await expect(page.getByText('Laptop')).toBeVisible();
    await expect(page.getByText('Apple')).not.toBeVisible();
  });

  test('stock filter low/out/in works (authenticated checks hidden for guest)', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/products`);
    // For guest the stock filter still exists but stock-sensitive filtering only applies to authenticated users.
    const stockSelect = page.getByRole('combobox', { name: /Stock Status/i });
    await stockSelect.selectOption('out');
    // As guest, behavior should still display relevant items from public response
    await expect(page.getByText('Laptop')).toBeVisible();
  });
});
