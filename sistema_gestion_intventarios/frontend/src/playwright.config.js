/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
    testDir: '../tests',
    testMatch: ['**/*.spec.js'],

    projects: [
        {
            name: 'chromium',
            use: {
                browserName: 'chromium',
                viewport: { width: 1280, height: 720 }
            },
        },
        {
            name: 'firefox',
            use: {
                browserName: 'firefox',
                viewport: { width: 1280, height: 720 }
            },
        },
        {
            name: 'webkit',
            use: {
                browserName: 'webkit',
                viewport: { width: 1280, height: 720 }
            },
        },
        {
            name: 'mobile-chrome',
            use: {
                browserName: 'chromium',
                viewport: { width: 375, height: 667 }, // iPhone-like
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
                isMobile: true,
            },
        },
    ],

    use: {
        baseURL: 'http://localhost:3000',
        headless: false, // Show browser during development
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'on-first-retry',
    },

    // Global test settings
    retries: 2,
    workers: 1, // Run tests serially to avoid conflicts
    timeout: 30000, // 30 seconds per test
    expect: {
        timeout: 10000 // 10 seconds for assertions
    },

    // Web server configuration (optional)
    webServer: {
        command: 'npm start',
        port: 3000,
        reuseExistingServer: !process.env.CI,
        timeout: 120000, // 2 minutes to start
    },
};
module.exports = config;