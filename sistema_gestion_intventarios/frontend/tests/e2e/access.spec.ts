import { test, expect } from '@playwright/test';
import { ensureE2EAuth } from './auth';

test('admin sees create button; guest does not', async ({ page, baseURL }) => {
  // Admin
  await ensureE2EAuth(page, 'admin');
  await page.goto(`${baseURL}/products`);
  await expect(page.getByRole('button', { name: /New Product/i })).toBeVisible();

  // Guest
  await page.context().clearCookies();
  await ensureE2EAuth(page, 'guest');
  await page.goto(`${baseURL}/products`);
  await expect(page.getByRole('button', { name: /New Product/i })).not.toBeVisible();
});
