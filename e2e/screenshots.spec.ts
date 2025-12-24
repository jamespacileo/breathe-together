import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

// Output directory for PR screenshots
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

test.describe('UI Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    // Wait for the app to load (breathing orb should be visible)
    await page.waitForSelector('.fixed.inset-0', { state: 'visible' });
    // Give animations time to settle
    await page.waitForTimeout(1500);
  });

  test('default view - breathing orb', async ({ page }, testInfo) => {
    // Capture the main breathing visualization
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `01-default-view-${testInfo.project.name}.png`),
      fullPage: true,
    });

    // Verify key elements are present
    await expect(page.getByRole('button', { name: /join the circle/i })).toBeVisible();
  });

  test('settings panel open', async ({ page }, testInfo) => {
    // Open settings panel
    const settingsButton = page.getByRole('button', { name: /open settings/i });
    await settingsButton.click();

    // Wait for panel animation
    await page.waitForTimeout(500);

    // Verify settings panel is open (use exact match to avoid matching "Advanced Settings")
    await expect(page.getByText('Settings', { exact: true })).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `02-settings-panel-${testInfo.project.name}.png`),
      fullPage: true,
    });
  });

  test('identity panel - join dialog', async ({ page }, testInfo) => {
    // Click the "Join the circle" button
    const joinButton = page.getByRole('button', { name: /join the circle/i });
    await joinButton.click();

    // Wait for modal animation
    await page.waitForTimeout(500);

    // Verify the dialog is open
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `03-identity-panel-${testInfo.project.name}.png`),
      fullPage: true,
    });
  });

  test('identity panel - with selections', async ({ page }, testInfo) => {
    // Open identity panel
    const joinButton = page.getByRole('button', { name: /join the circle/i });
    await joinButton.click();
    await page.waitForTimeout(500);

    // Verify dialog is open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill in name
    const nameInput = page.getByLabel(/your name/i);
    await nameInput.fill('Cosmic Explorer');

    // Select an avatar (click second one)
    const avatars = page.locator('button[aria-label^="Select avatar"]');
    await avatars.nth(2).click();

    // Select a mood - use one of the actual moods
    const moodButton = page.getByRole('button', { name: /taking a moment/i });
    await moodButton.click();

    await page.waitForTimeout(300);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `04-identity-filled-${testInfo.project.name}.png`),
      fullPage: true,
    });
  });

  test('pattern selector - box breathing', async ({ page }, testInfo) => {
    // Box breathing should be default, capture it
    await expect(page.getByRole('radio', { name: /box breathing/i })).toBeChecked();

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `05-pattern-box-${testInfo.project.name}.png`),
      fullPage: true,
    });
  });

  test('pattern selector - relaxation', async ({ page }, testInfo) => {
    // Switch to relaxation pattern
    const relaxationButton = page.getByRole('radio', { name: /4-7-8 relaxation/i });
    await relaxationButton.click();

    await page.waitForTimeout(500);

    await expect(relaxationButton).toBeChecked();

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `06-pattern-relaxation-${testInfo.project.name}.png`),
      fullPage: true,
    });
  });

  test('user badge after joining', async ({ page }, testInfo) => {
    // Join as a user
    const joinButton = page.getByRole('button', { name: /join the circle/i });
    await joinButton.click();
    await page.waitForTimeout(500);

    // Verify dialog is open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill in details
    await page.getByLabel(/your name/i).fill('Mindful User');
    await page.locator('button[aria-label^="Select avatar"]').first().click();
    // Use an actual mood from the app
    await page.getByRole('button', { name: /just here/i }).click();

    // Click join
    await page.getByRole('button', { name: 'Join' }).click();

    // Wait for modal to close and badge to appear
    await page.waitForTimeout(800);

    // Verify user badge is shown
    await expect(page.getByText('Mindful User')).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `07-user-badge-${testInfo.project.name}.png`),
      fullPage: true,
    });
  });

  test('settings with color customization', async ({ page }, testInfo) => {
    // Open settings
    await page.getByRole('button', { name: /open settings/i }).click();
    await page.waitForTimeout(500);

    // Change accent color to a different value
    const colorInput = page.locator('input[type="color"]').first();
    await colorInput.evaluate((el) => {
      (el as HTMLInputElement).value = '#ff6b9d';
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await page.waitForTimeout(300);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `08-settings-custom-color-${testInfo.project.name}.png`),
      fullPage: true,
    });
  });
});

// Separate test for capturing breathing phases at specific moments
test.describe('Breathing Phases', () => {
  test('capture multiple breathing states', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForSelector('.fixed.inset-0', { state: 'visible' });

    // Capture a few frames over time to show different states
    // The orb animates through breathing phases

    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `09-breathing-state-1-${testInfo.project.name}.png`),
      fullPage: true,
    });

    await page.waitForTimeout(4000); // Wait for phase change
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `10-breathing-state-2-${testInfo.project.name}.png`),
      fullPage: true,
    });

    await page.waitForTimeout(4000); // Wait for another phase
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `11-breathing-state-3-${testInfo.project.name}.png`),
      fullPage: true,
    });
  });
});
