import { test, expect } from '@playwright/test';

test.describe('Block Editor', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the editor test page
        await page.goto('/e2e-test');

        // Wait for editor to load (Liveblocks connection + editor initialization)
        // The editor displays a loading spinner while connecting
        await page.waitForSelector('.prose', { timeout: 30000 });
    });

    test('editor loads and is visible', async ({ page }) => {
        // Verify the page title/header
        await expect(page.locator('h1')).toContainText('E2E Test Editor');

        // Verify the editor canvas is present
        const editor = page.locator('.prose');
        await expect(editor).toBeVisible();
    });

    test('can type text in the editor', async ({ page }) => {
        const editor = page.locator('.prose');

        // Click to focus the editor
        await editor.click();

        // Type some text
        await page.keyboard.type('Hello, Trato Hive!');

        // Verify the text appears in the editor
        await expect(editor).toContainText('Hello, Trato Hive!');
    });

    test('slash command menu opens on /', async ({ page }) => {
        const editor = page.locator('.prose');

        // Focus the editor
        await editor.click();

        // Type slash to trigger command menu
        await page.keyboard.type('/');

        // Wait for the command menu to appear
        // Tippy.js creates elements with .tippy-box class inside [data-tippy-root]
        const commandMenu = page.locator('.tippy-box');
        await expect(commandMenu).toBeVisible({ timeout: 5000 });

        // Verify some command options are shown
        await expect(commandMenu).toContainText('Ask AI');
        await expect(commandMenu).toContainText('Heading 1');
    });

    test('can insert heading via slash command', async ({ page }) => {
        const editor = page.locator('.prose');

        // Focus the editor
        await editor.click();

        // Type slash and search for heading
        await page.keyboard.type('/heading 1');

        // Wait for command menu to appear
        const commandMenu = page.locator('.tippy-box');
        await expect(commandMenu).toBeVisible({ timeout: 3000 });

        // Press Enter to select the first matching command
        await page.keyboard.press('Enter');

        // Wait for heading to be inserted
        await page.waitForTimeout(500);

        // Type heading content
        await page.keyboard.type('My Heading');

        // Verify a heading element exists with timeout
        const heading = editor.locator('h1');
        await expect(heading).toContainText('My Heading', { timeout: 5000 });
    });

    test('can apply bold formatting with keyboard shortcut', async ({ page }) => {
        const editor = page.locator('.prose');

        // Focus and type text
        await editor.click();
        await page.keyboard.type('Bold text here');

        // Select all text (Cmd+A on Mac, Ctrl+A on others)
        await page.keyboard.press('Meta+a');

        // Apply bold (Cmd+B on Mac)
        await page.keyboard.press('Meta+b');

        // Verify bold is applied - look for <strong> or <b> element
        const boldText = editor.locator('strong, b');
        await expect(boldText).toContainText('Bold text here');
    });

    test('can apply italic formatting with keyboard shortcut', async ({ page }) => {
        const editor = page.locator('.prose');

        // Focus and type text
        await editor.click();
        await page.keyboard.type('Italic text here');

        // Select all text
        await page.keyboard.press('Meta+a');

        // Apply italic (Cmd+I)
        await page.keyboard.press('Meta+i');

        // Verify italic is applied
        const italicText = editor.locator('em, i');
        await expect(italicText).toContainText('Italic text here');
    });
});
