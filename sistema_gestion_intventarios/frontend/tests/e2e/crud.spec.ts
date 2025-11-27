import { test, expect } from '@playwright/test';
import { ensureE2EAuth } from './auth';

test.describe('CRUD flows (mocked backend)', () => {
  test.beforeEach(async ({ page }) => {
    await ensureE2EAuth(page, 'admin');
    await page.route('**/api/v2/products*', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      } else {
        route.continue();
      }
    });
    await page.route('**/api/public/products', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.goto('/products');
  });

  test('create, edit and delete product (mocked)', async ({ page }) => {
    // Mock create
    await page.route('**/api/v2/products', async route => {
      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        body.id = 1001;

        // Register a GET stub that returns the created product so the UI shows it
        const created = [{
          id: 1001,
          name: body.name || 'CRUD Product',
          description: body.description || 'Desc',
          category: body.category || 'E2E',
          price: body.price || 1.0,
          initialQuantity: body.initialQuantity || 0,
          minimumStock: body.minimumStock || 5
        }];
        await page.route('**/api/v2/products*', r => {
          if (r.request().method() === 'GET') {
            r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(created) });
          } else {
            r.continue();
          }
        });

        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(body) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      }
    });

    // Create
    await page.getByRole('button', { name: /New Product/i }).click();
    await page.getByPlaceholder('Enter product name').fill('CRUD Product');
    await page.getByPlaceholder('Enter product description').fill('Desc');
    await page.getByPlaceholder('Enter category').fill('E2E');
    await page.getByPlaceholder('0.00').fill('1.00');
    await page.getByRole('button', { name: /Create Product/i }).click();
    await expect(page.getByText(/Product created successfully/i)).toBeVisible();

    // wait a moment for the product list to refresh and render
    await page.waitForTimeout(250);

    // Mock update
    await page.route('**/api/v2/products/1001', async route => {
      if (route.request().method() === 'PUT') {
        const body = JSON.parse(route.request().postData() || '{}');
        body.id = 1001;
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      }
    });

    // Open edit modal by clicking the Edit button in the product row.
    const editBtn = page.getByTitle('Edit Product').first();
    // Wait for edit button to appear (UI refresh after creation)
    await expect(editBtn).toBeVisible({ timeout: 3000 });
    await editBtn.click();

    // Update fields
    await page.getByPlaceholder('Enter product name').fill('CRUD Product Updated');
    await page.getByRole('button', { name: /Update Product/i }).click();
    await expect(page.getByText(/Product updated successfully/i)).toBeVisible();

    // Mock delete
    await page.route('**/api/v2/products/1001', async route => {
      if (route.request().method() === 'DELETE') {
        // Return a small JSON body to avoid empty-response parsing issues in some browsers
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      }
    });

    // Click delete if exists
    const deleteBtn = page.getByTitle('Delete Product');
    if (await deleteBtn.count() > 0) {
      // Ensure confirm dialog returns true before triggering delete
      await page.evaluate(() => { window.confirm = () => true; });
      await deleteBtn.first().click();
      // Wait for success message after delete
      await expect(page.getByText(/Product deleted successfully/i)).toBeVisible({ timeout: 5000 });
    }
  });
});
