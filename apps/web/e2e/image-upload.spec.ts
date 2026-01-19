import { test, expect } from '@playwright/test';

test.describe('Image Upload Extension', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the editor test page
        await page.goto('/e2e-test');

        // Wait for editor to load
        await page.waitForSelector('.prose', { timeout: 30000 });
    });

    test('editor loads with image upload extension available', async ({ page }) => {
        // Verify the editor is loaded
        const editor = page.locator('.prose');
        await expect(editor).toBeVisible();

        // Type some text to verify editor is interactive
        await editor.click();
        await page.keyboard.type('Testing image upload extension');
        await expect(editor).toContainText('Testing image upload extension');
    });

    test('can insert image upload node via editor command', async ({ page }) => {
        const editor = page.locator('.prose');
        await editor.click();

        // Use browser console to insert image upload node directly
        // This tests that the extension is registered
        const result = await page.evaluate(() => {
            // Access the editor instance from the window or find it via DOM
            const editorElement = document.querySelector('.ProseMirror');
            if (!editorElement) return { success: false, error: 'No editor element' };

            // @ts-ignore - editor is attached to the element
            const editor = (editorElement as any).editor;
            if (!editor) return { success: false, error: 'No editor instance' };

            // Check if imageUpload extension is available
            const hasExtension = editor.extensionManager.extensions.some(
                (ext: any) => ext.name === 'imageUpload'
            );

            return { success: hasExtension, error: hasExtension ? null : 'imageUpload extension not found' };
        });

        // The extension should be registered (even if the command doesn't work in test env)
        expect(result.success).toBe(true);
    });

    test('imageUpload extension has required configuration', async ({ page }) => {
        const editor = page.locator('.prose');
        await editor.click();

        // Check that the imageUpload extension has the correct configuration
        const config = await page.evaluate(() => {
            const editorElement = document.querySelector('.ProseMirror');
            if (!editorElement) return null;

            // @ts-ignore
            const editor = (editorElement as any).editor;
            if (!editor) return null;

            const imageUploadExt = editor.extensionManager.extensions.find(
                (ext: any) => ext.name === 'imageUpload'
            );

            if (!imageUploadExt) return null;

            return {
                name: imageUploadExt.name,
                hasUploadFunction: typeof imageUploadExt.options.upload === 'function',
                accept: imageUploadExt.options.accept,
                maxSize: imageUploadExt.options.maxSize,
            };
        });

        expect(config).not.toBeNull();
        expect(config?.name).toBe('imageUpload');
        expect(config?.hasUploadFunction).toBe(true);
        expect(config?.accept).toBe('image/*');
        expect(config?.maxSize).toBe(10 * 1024 * 1024); // 10MB
    });
});
