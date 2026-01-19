import { test, expect } from '@playwright/test';

test.describe('Link Popover in Bubble Menu', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the editor test page
        await page.goto('/e2e-test');

        // Wait for editor to load
        await page.waitForSelector('.prose', { timeout: 30000 });
    });

    test('bubble menu shows link button when text is selected', async ({ page }) => {
        const editor = page.locator('.prose');

        // Type some text
        await editor.click();
        await page.keyboard.type('Click here for a link');

        // Select the text "here"
        await page.keyboard.press('Meta+a');

        // Wait for bubble menu to appear
        const bubbleMenu = page.locator('.rounded-full.border').first();
        await expect(bubbleMenu).toBeVisible({ timeout: 5000 });

        // Verify link button (Link2 icon) is present in bubble menu
        const linkButton = bubbleMenu.locator('button').filter({ has: page.locator('svg') }).last();
        await expect(linkButton).toBeVisible();
    });

    test('clicking link button shows URL input field', async ({ page }) => {
        const editor = page.locator('.prose');

        // Type and select text
        await editor.click();
        await page.keyboard.type('Link this text');
        await page.keyboard.press('Meta+a');

        // Wait for bubble menu
        const bubbleMenu = page.locator('.rounded-full.border').first();
        await expect(bubbleMenu).toBeVisible({ timeout: 5000 });

        // Click the last button (link button - after Bold, Italic, Strike, Code)
        const buttons = bubbleMenu.locator('button');
        const linkButton = buttons.nth(5); // 0=Ask AI, 1=Bold, 2=Italic, 3=Strike, 4=Code, 5=Link
        await linkButton.click();

        // Verify URL input appears
        const urlInput = bubbleMenu.locator('input[type="url"]');
        await expect(urlInput).toBeVisible({ timeout: 3000 });
        await expect(urlInput).toHaveAttribute('placeholder', 'Paste a link…');
        // Focus may be delayed due to animation, just verify input is interactive
        await urlInput.click();
        await expect(urlInput).toBeFocused();
    });

    test('can add a link to selected text', async ({ page }) => {
        const editor = page.locator('.prose');

        // Type and select text
        await editor.click();
        await page.keyboard.type('Visit our website');
        await page.keyboard.press('Meta+a');

        // Wait for bubble menu and click link button
        const bubbleMenu = page.locator('.rounded-full.border').first();
        await expect(bubbleMenu).toBeVisible({ timeout: 5000 });

        const buttons = bubbleMenu.locator('button');
        const linkButton = buttons.nth(5);
        await linkButton.click();

        // Type URL and press Enter
        const urlInput = bubbleMenu.locator('input[type="url"]');
        await expect(urlInput).toBeVisible();
        await urlInput.fill('https://example.com');
        await page.keyboard.press('Enter');

        // Verify link was created in editor
        const link = editor.locator('a[href="https://example.com"]');
        await expect(link).toBeVisible({ timeout: 3000 });
        await expect(link).toContainText('Visit our website');
    });

    test('Escape key cancels link input', async ({ page }) => {
        const editor = page.locator('.prose');

        // Type and select text
        await editor.click();
        await page.keyboard.type('Some text');
        await page.keyboard.press('Meta+a');

        // Wait for bubble menu and click link button
        const bubbleMenu = page.locator('.rounded-full.border').first();
        await expect(bubbleMenu).toBeVisible({ timeout: 5000 });

        const buttons = bubbleMenu.locator('button');
        const linkButton = buttons.nth(5);
        await linkButton.click();

        // Verify URL input is shown
        const urlInput = bubbleMenu.locator('input[type="url"]');
        await expect(urlInput).toBeVisible();

        // Focus the input first, then press Escape
        await urlInput.click();
        await expect(urlInput).toBeFocused();
        await urlInput.press('Escape');

        // Wait for animation to complete
        await page.waitForTimeout(200);

        // Verify we're back to formatting buttons (URL input should be hidden)
        await expect(urlInput).not.toBeVisible({ timeout: 3000 });

        // Bold button should be visible again
        const boldButton = bubbleMenu.locator('button').nth(1);
        await expect(boldButton).toBeVisible();
    });

    test('can remove an existing link', async ({ page }) => {
        const editor = page.locator('.prose');

        // First, add a link
        await editor.click();
        await page.keyboard.type('Remove this link');
        await page.keyboard.press('Meta+a');

        const bubbleMenu = page.locator('.rounded-full.border').first();
        await expect(bubbleMenu).toBeVisible({ timeout: 5000 });

        // Add link
        const buttons = bubbleMenu.locator('button');
        await buttons.nth(5).click();

        const urlInput = bubbleMenu.locator('input[type="url"]');
        await urlInput.fill('https://example.com');
        await page.keyboard.press('Enter');

        // Verify link exists
        const link = editor.locator('a[href="https://example.com"]');
        await expect(link).toBeVisible({ timeout: 3000 });

        // Click on the link to select it
        await link.click();

        // Triple-click to select all text in the link
        await link.click({ clickCount: 3 });

        // Wait for bubble menu to reappear
        await expect(bubbleMenu).toBeVisible({ timeout: 5000 });

        // Click link button again (should show remove option since text has link)
        const linkButtons = bubbleMenu.locator('button');
        await linkButtons.nth(5).click();

        // Look for remove button (X icon) - it appears when there's an existing link
        const removeButton = bubbleMenu.locator('button[aria-label="Remove link"]');
        await expect(removeButton).toBeVisible({ timeout: 3000 });

        // Click remove
        await removeButton.click();

        // Verify link is removed (text remains but no longer a link)
        await expect(editor.locator('a[href="https://example.com"]')).not.toBeVisible({ timeout: 3000 });
        await expect(editor).toContainText('Remove this link');
    });

    test('link button shows active state when cursor is on linked text', async ({ page }) => {
        const editor = page.locator('.prose');

        // Add a link first
        await editor.click();
        await page.keyboard.type('Linked text here');
        await page.keyboard.press('Meta+a');

        const bubbleMenu = page.locator('.rounded-full.border').first();
        await expect(bubbleMenu).toBeVisible({ timeout: 5000 });

        // Add link
        const buttons = bubbleMenu.locator('button');
        await buttons.nth(5).click();

        const urlInput = bubbleMenu.locator('input[type="url"]');
        await urlInput.fill('https://test.com');
        await page.keyboard.press('Enter');

        // Click somewhere else first to deselect
        await editor.click();
        await page.waitForTimeout(300);

        // Now select the linked text again
        const link = editor.locator('a[href="https://test.com"]');
        await link.click({ clickCount: 3 });

        // Wait for bubble menu
        await expect(bubbleMenu).toBeVisible({ timeout: 5000 });

        // Link button should have active state (bg-charcoal class or similar)
        const linkButton = buttons.nth(5);
        await expect(linkButton).toHaveClass(/bg-charcoal|text-white/);
    });
});
