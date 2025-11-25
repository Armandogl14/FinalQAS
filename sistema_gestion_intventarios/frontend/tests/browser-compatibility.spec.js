const { test, expect } = require('@playwright/test');

test.describe('Browser Compatibility Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForTimeout(3000);

        // Handle Keycloak login if redirected
        const currentUrl = page.url();
        if (currentUrl.includes('keycloak') || currentUrl.includes('auth')) {
            await page.waitForSelector('#username', { timeout: 10000 });
            await page.fill('#username', 'dreynoso');
            //await page.fill('#username', 'admin');
            await page.fill('#password', 'admin');
            await page.click('#kc-login');
            await page.waitForURL('http://localhost:3000/**', { timeout: 15000 });
        }

        await page.waitForSelector('.app-container', { timeout: 10000 });
    });

    test('App loads and displays correctly across browsers', async ({ page, browserName }) => {
        console.log(`Testing on browser: ${browserName}`);

        // Verify main app elements
        await expect(page.locator('.app-container')).toBeVisible();
        await expect(page.locator('h1')).toContainText('Inventory Management System');
        await expect(page.locator('.user-info')).toBeVisible();
        await expect(page.locator('.product-table')).toBeVisible();
    });

    test('CSS styling renders correctly across browsers', async ({ page, browserName }) => {
        console.log(`Testing CSS rendering on: ${browserName}`);

        // Check header styling
        const header = page.locator('.app-header');
        await expect(header).toBeVisible();

        // Check statistics cards
        const statsCards = page.locator('.stat-card');
        const statsCount = await statsCards.count();
        expect(statsCount).toBeGreaterThan(0);

        // Check product table styling
        const table = page.locator('.product-table');
        await expect(table).toBeVisible();
    });

    test('Interactive elements work across browsers', async ({ page, browserName }) => {
        console.log(`Testing interactions on: ${browserName}`);

        // Test add product button
        await expect(page.locator('.add-product-button')).toBeVisible();
        await page.click('.add-product-button');

        // Test modal functionality
        await page.waitForSelector('.modal-content');
        await expect(page.locator('.modal-content')).toBeVisible();

        // Test form inputs
        await page.fill('input[name="name"]', 'Browser Test Product');
        await page.fill('input[name="price"]', '99.99');

        // Close modal
        await page.click('.modal-close');
        await page.waitForSelector('.modal-content', { state: 'hidden' });
    });

    test('Search functionality works across browsers', async ({ page, browserName }) => {
        console.log(`Testing search on: ${browserName}`);

        // Test search input
        const searchInput = page.locator('input[placeholder*="Search"]');
        await expect(searchInput).toBeVisible();

        await searchInput.fill('test search');
        await page.waitForTimeout(500);

        // Clear search
        await searchInput.clear();
    });

    test('Responsive behavior works across browsers', async ({ page, browserName, isMobile }) => {
        console.log(`Testing responsive design on: ${browserName}, mobile: ${isMobile}`);

        // Check that main elements are still visible
        await expect(page.locator('.app-container')).toBeVisible();

        if (isMobile) {
            // Mobile-specific checks
            const viewport = page.viewportSize();
            expect(viewport.width).toBeLessThanOrEqual(768);

            // Ensure mobile layout doesn't break
            await expect(page.locator('.add-product-button')).toBeVisible();
        } else {
            // Desktop checks
            const viewport = page.viewportSize();
            expect(viewport.width).toBeGreaterThan(768);
        }
    });

    test('JavaScript functionality works across browsers', async ({ page, browserName }) => {
        console.log(`Testing JavaScript on: ${browserName}`);

        // Test that statistics update dynamically
        const statsCards = page.locator('.stat-card');
        const jsStatsCount = await statsCards.count();
        expect(jsStatsCount).toBeGreaterThan(0);

        // Test filter functionality
        const categorySelect = page.locator('.filter-group select').first();
        if (await categorySelect.isVisible()) {
            await categorySelect.selectOption({ index: 1 });
            await page.waitForTimeout(500);
        }

        // Test pagination if present
        const paginationButtons = page.locator('.pagination button');
        if (await paginationButtons.first().isVisible()) {
            const pageBtnCount = await paginationButtons.count();
            expect(pageBtnCount).toBeGreaterThan(0);
        }
    });
});