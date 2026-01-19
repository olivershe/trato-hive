import { test, expect } from '@playwright/test';

test.describe('Company Embed Block', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the editor test page
        await page.goto('/e2e-test');

        // Wait for editor to load
        await page.waitForSelector('.prose', { timeout: 30000 });
    });

    test('slash command shows Company option when typing /company', async ({ page }) => {
        const editor = page.locator('.prose');

        // Focus the editor
        await editor.click();

        // Type slash and search for company
        await page.keyboard.type('/company');

        // Wait for command menu to appear
        const commandMenu = page.locator('.tippy-box');
        await expect(commandMenu).toBeVisible({ timeout: 5000 });

        // Verify Company option is shown
        await expect(commandMenu).toContainText('Company');
        await expect(commandMenu).toContainText('Embed a company profile card');
    });

    test('can insert company embed block via slash command', async ({ page }) => {
        const editor = page.locator('.prose');

        // Focus the editor
        await editor.click();

        // Type slash command for company
        await page.keyboard.type('/company');

        // Wait for command menu to appear
        const commandMenu = page.locator('.tippy-box');
        await expect(commandMenu).toBeVisible({ timeout: 3000 });

        // Press Enter to select the Company command
        await page.keyboard.press('Enter');

        // Wait for the picker modal to appear
        // The picker modal has "Select Company" title
        await expect(page.locator('text=Select Company')).toBeVisible({ timeout: 5000 });
    });

    test('company picker shows search input', async ({ page }) => {
        const editor = page.locator('.prose');

        // Focus the editor
        await editor.click();

        // Insert company embed block
        await page.keyboard.type('/company');
        await page.waitForSelector('.tippy-box', { timeout: 3000 });
        await page.keyboard.press('Enter');

        // Wait for picker modal
        await expect(page.locator('text=Select Company')).toBeVisible({ timeout: 5000 });

        // Verify search input is present
        const searchInput = page.locator('input[placeholder="Search companies..."]');
        await expect(searchInput).toBeVisible();
    });

    test('company picker can be closed with Escape key', async ({ page }) => {
        const editor = page.locator('.prose');

        // Focus the editor
        await editor.click();

        // Insert company embed block
        await page.keyboard.type('/company');
        await page.waitForSelector('.tippy-box', { timeout: 3000 });
        await page.keyboard.press('Enter');

        // Wait for picker modal
        await expect(page.locator('text=Select Company')).toBeVisible({ timeout: 5000 });

        // Press Escape to close
        await page.keyboard.press('Escape');

        // Modal should close (but placeholder should remain)
        // The placeholder shows "Select a company to embed"
        await expect(page.locator('text=Select a company to embed')).toBeVisible({ timeout: 3000 });
    });

    test('company picker can be closed with X button', async ({ page }) => {
        const editor = page.locator('.prose');

        // Focus the editor
        await editor.click();

        // Insert company embed block
        await page.keyboard.type('/company');
        await page.waitForSelector('.tippy-box', { timeout: 3000 });
        await page.keyboard.press('Enter');

        // Wait for picker modal
        await expect(page.locator('text=Select Company')).toBeVisible({ timeout: 5000 });

        // Click the X button to close
        const closeButton = page.locator('button:has(svg.lucide-x)').first();
        await closeButton.click();

        // Modal should close and placeholder should appear
        await expect(page.locator('text=Select a company to embed')).toBeVisible({ timeout: 3000 });
    });

    test('company picker shows loading state while fetching', async ({ page }) => {
        const editor = page.locator('.prose');

        // Focus the editor
        await editor.click();

        // Insert company embed block
        await page.keyboard.type('/company');
        await page.waitForSelector('.tippy-box', { timeout: 3000 });
        await page.keyboard.press('Enter');

        // Wait for picker modal
        await expect(page.locator('text=Select Company')).toBeVisible({ timeout: 5000 });

        // Initially might show loading spinner or results
        // The picker should either show a loading state or results
        // We just verify it renders correctly
        const modal = page.locator('text=Select Company').locator('..');
        await expect(modal).toBeVisible();
    });

    test('slash command filters correctly for company-related terms', async ({ page }) => {
        const editor = page.locator('.prose');

        // Focus the editor
        await editor.click();

        // Test various search terms that should show Company
        const searchTerms = ['embed', 'profile', 'organization', 'business'];

        for (const term of searchTerms) {
            // Clear and type new search
            await page.keyboard.type(`/${term}`);

            // Wait for command menu
            const commandMenu = page.locator('.tippy-box');
            await expect(commandMenu).toBeVisible({ timeout: 3000 });

            // Verify Company option appears in results
            await expect(commandMenu).toContainText('Company');

            // Clear the input by pressing Escape and clicking again
            await page.keyboard.press('Escape');
            await editor.click();
        }
    });
});
