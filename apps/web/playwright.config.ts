import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Configuration for Trato Hive Web App
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: './e2e',

    /* Run tests in parallel */
    fullyParallel: true,

    /* Fail the build on CI if you accidentally left test.only in the source code */
    forbidOnly: !!process.env.CI,

    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,

    /* Reporter to use */
    reporter: [
        ['html', { open: 'never' }],
        ['list'],
    ],

    /* Shared settings for all the projects below */
    use: {
        /* Base URL to use in actions like `await page.goto('/')` */
        baseURL: 'http://localhost:3000',

        /* Collect trace when retrying the failed test */
        trace: 'on-first-retry',

        /* Screenshot on failure */
        screenshot: 'only-on-failure',
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        // Uncomment for full browser coverage:
        // {
        //   name: 'firefox',
        //   use: { ...devices['Desktop Firefox'] },
        // },
        // {
        //   name: 'webkit',
        //   use: { ...devices['Desktop Safari'] },
        // },
    ],

    /**
     * Web server configuration - COMMENTED OUT
     * Due to monorepo workspace constraints, start the dev server manually first:
     *   pnpm --filter @trato-hive/web dev
     * Then run: pnpm --filter @trato-hive/web test:e2e
     */
    // webServer: {
    //   command: 'pnpm dev',
    //   url: 'http://localhost:3000',
    //   reuseExistingServer: true,
    //   timeout: 120000,
    // },
});
