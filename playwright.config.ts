// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.', // Start looking for tests from the root directory.
  testMatch: ['**/*_test.e2e.{js,cjs,ts,tsx}', '**/*_test-**.e2e.ts'], // Adjust the extensions as needed.
  timeout: 30000,
  retries: 0,
  use: {
    headless: false,
    baseURL: 'http://localhost:6006', // Change if necessary.
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
