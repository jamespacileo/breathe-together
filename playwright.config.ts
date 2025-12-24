import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 7'],
        // Use Chromium instead of Android WebView for CI compatibility
        browserName: 'chromium',
      },
    },
  ],

  /* Run static server before tests (serves built client files) */
  webServer: {
    command: 'npx serve dist/client -l 4173 -s',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30 * 1000,
  },

  /* Output directory for screenshots */
  outputDir: './e2e/screenshots',
});
