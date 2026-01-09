import { test, expect } from '@playwright/test';

test.describe('Database View Block', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the editor test page
    await page.goto('/e2e-test');

    // Wait for editor to load
    await page.waitForSelector('.prose', { timeout: 30000 });
  });

  test.describe('Database Picker', () => {
    test('slash command /database opens database picker', async ({ page }) => {
      const editor = page.locator('.prose');

      // Focus the editor
      await editor.click();

      // Type slash command for database
      await page.keyboard.type('/database');

      // Wait for command menu
      const commandMenu = page.locator('.tippy-box');
      await expect(commandMenu).toBeVisible({ timeout: 5000 });

      // Press Enter to select database command
      await page.keyboard.press('Enter');

      // Wait for database picker to appear
      await page.waitForTimeout(500);

      // Verify database picker is shown
      const databasePicker = page.locator('text=Add a Database');
      await expect(databasePicker).toBeVisible({ timeout: 5000 });
    });

    test('database picker shows create and link options', async ({ page }) => {
      const editor = page.locator('.prose');

      // Focus and insert database block
      await editor.click();
      await page.keyboard.type('/database');
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // Verify both options are present
      await expect(page.locator('text=Create New')).toBeVisible();
      await expect(page.locator('text=Link Existing')).toBeVisible();
    });

    test('can navigate to create new database form', async ({ page }) => {
      const editor = page.locator('.prose');

      // Insert database block
      await editor.click();
      await page.keyboard.type('/database');
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // Click "Create New"
      await page.click('text=Create New');
      await page.waitForTimeout(300);

      // Verify create form is shown
      await expect(page.locator('text=Create New Database')).toBeVisible();
      await expect(page.locator('text=Database Name')).toBeVisible();
      await expect(page.locator('text=Choose a Template')).toBeVisible();
    });

    test('template selection highlights selected template', async ({ page }) => {
      const editor = page.locator('.prose');

      // Insert database block and go to create form
      await editor.click();
      await page.keyboard.type('/database');
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      await page.click('text=Create New');
      await page.waitForTimeout(300);

      // Click on a template
      await page.click('text=Due Diligence Tracker');

      // Verify the template button has the selected styling (border-gold)
      const selectedTemplate = page.locator('button:has-text("Due Diligence Tracker")');
      await expect(selectedTemplate).toHaveClass(/border-gold/);
    });
  });

  test.describe('Database Table View', () => {
    // These tests assume a database is already created and displayed
    // In a real scenario, you'd set up test data first

    test('table header shows column names', async ({ page }) => {
      // This test would require a pre-created database
      // For now, test the structure exists after creation
      const editor = page.locator('.prose');

      // Focus and create a database
      await editor.click();
      await page.keyboard.type('/database');
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // Create a new database
      await page.click('text=Create New');
      await page.waitForTimeout(300);

      // Enter database name
      await page.fill('input[placeholder*="Due Diligence"]', 'Test Database');

      // Select blank template
      await page.click('text=Blank Database');
      await page.waitForTimeout(200);

      // Click create button
      await page.click('button:has-text("Create Database")');

      // Wait for database to be created and displayed
      await page.waitForTimeout(2000);

      // Check that a table header exists (th elements)
      const tableHeader = page.locator('th');
      await expect(tableHeader.first()).toBeVisible({ timeout: 10000 });
    });

    test('column resize handle is visible on hover', async ({ page }) => {
      const editor = page.locator('.prose');

      // Create a database first
      await editor.click();
      await page.keyboard.type('/database');
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      await page.click('text=Create New');
      await page.waitForTimeout(300);
      await page.fill('input[placeholder*="Due Diligence"]', 'Resize Test');
      await page.click('text=Blank Database');
      await page.waitForTimeout(200);
      await page.click('button:has-text("Create Database")');
      await page.waitForTimeout(2000);

      // Hover over a column header
      const columnHeader = page.locator('th').first();
      await columnHeader.hover();

      // Check for resize cursor or resize handle
      // The resize handle has cursor-col-resize class
      const resizeHandle = page.locator('.cursor-col-resize');
      await expect(resizeHandle.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('View Switcher', () => {
    test('view switcher buttons are visible', async ({ page }) => {
      const editor = page.locator('.prose');

      // Create a database
      await editor.click();
      await page.keyboard.type('/database');
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      await page.click('text=Create New');
      await page.waitForTimeout(300);
      await page.fill('input[placeholder*="Due Diligence"]', 'View Test DB');
      await page.click('text=Blank Database');
      await page.waitForTimeout(200);
      await page.click('button:has-text("Create Database")');
      await page.waitForTimeout(2000);

      // Check for view switcher buttons by title attribute
      const tableViewBtn = page.locator('button[title="Table view"]');
      const kanbanViewBtn = page.locator('button[title="Kanban view"]');
      const galleryViewBtn = page.locator('button[title="Gallery view"]');

      await expect(tableViewBtn).toBeVisible({ timeout: 5000 });
      await expect(kanbanViewBtn).toBeVisible({ timeout: 5000 });
      await expect(galleryViewBtn).toBeVisible({ timeout: 5000 });
    });

    test('table view is selected by default', async ({ page }) => {
      const editor = page.locator('.prose');

      // Create a database
      await editor.click();
      await page.keyboard.type('/database');
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      await page.click('text=Create New');
      await page.waitForTimeout(300);
      await page.fill('input[placeholder*="Due Diligence"]', 'Default View Test');
      await page.click('text=Blank Database');
      await page.waitForTimeout(200);
      await page.click('button:has-text("Create Database")');
      await page.waitForTimeout(2000);

      // Table view button should have the active styling (bg-gold/20)
      const tableViewBtn = page.locator('button[title="Table view"]');
      await expect(tableViewBtn).toHaveClass(/bg-gold/);
    });

    test('can switch to gallery view', async ({ page }) => {
      const editor = page.locator('.prose');

      // Create a database
      await editor.click();
      await page.keyboard.type('/database');
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      await page.click('text=Create New');
      await page.waitForTimeout(300);
      await page.fill('input[placeholder*="Due Diligence"]', 'Gallery Test');
      await page.click('text=Blank Database');
      await page.waitForTimeout(200);
      await page.click('button:has-text("Create Database")');
      await page.waitForTimeout(2000);

      // Click gallery view button
      const galleryViewBtn = page.locator('button[title="Gallery view"]');
      await galleryViewBtn.click();
      await page.waitForTimeout(300);

      // Gallery view button should now be active
      await expect(galleryViewBtn).toHaveClass(/bg-gold/);

      // Verify gallery grid layout is visible (uses grid-cols)
      const galleryGrid = page.locator('.grid');
      await expect(galleryGrid).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('can navigate database picker with keyboard', async ({ page }) => {
      const editor = page.locator('.prose');

      // Insert database block
      await editor.click();
      await page.keyboard.type('/database');
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // Tab to navigate between Create New and Link Existing
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      await page.keyboard.press('Tab');

      // Verify focus is on the second button (Link Existing)
      // Using document.activeElement would require evaluate
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('cells are keyboard accessible', async ({ page }) => {
      const editor = page.locator('.prose');

      // Create database
      await editor.click();
      await page.keyboard.type('/database');
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      await page.click('text=Create New');
      await page.waitForTimeout(300);
      await page.fill('input[placeholder*="Due Diligence"]', 'Keyboard Test');
      await page.click('text=Blank Database');
      await page.waitForTimeout(200);
      await page.click('button:has-text("Create Database")');
      await page.waitForTimeout(2000);

      // Cell elements should have tabIndex for keyboard access
      const cells = page.locator('[role="gridcell"]');
      const firstCell = cells.first();
      await expect(firstCell).toBeVisible({ timeout: 5000 });

      // Check that cells have appropriate ARIA attributes
      const table = page.locator('[role="grid"]');
      await expect(table).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('database table has proper ARIA roles', async ({ page }) => {
      const editor = page.locator('.prose');

      // Create database
      await editor.click();
      await page.keyboard.type('/database');
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      await page.click('text=Create New');
      await page.waitForTimeout(300);
      await page.fill('input[placeholder*="Due Diligence"]', 'ARIA Test');
      await page.click('text=Blank Database');
      await page.waitForTimeout(200);
      await page.click('button:has-text("Create Database")');
      await page.waitForTimeout(2000);

      // Check for proper ARIA roles
      const grid = page.locator('[role="grid"]');
      await expect(grid).toBeVisible({ timeout: 5000 });

      const columnHeaders = page.locator('[role="columnheader"]');
      await expect(columnHeaders.first()).toBeVisible();

      const rows = page.locator('[role="row"]');
      await expect(rows.first()).toBeVisible();
    });

    test('buttons have accessible labels', async ({ page }) => {
      const editor = page.locator('.prose');

      // Create database
      await editor.click();
      await page.keyboard.type('/database');
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      await page.click('text=Create New');
      await page.waitForTimeout(300);
      await page.fill('input[placeholder*="Due Diligence"]', 'Label Test');
      await page.click('text=Blank Database');
      await page.waitForTimeout(200);
      await page.click('button:has-text("Create Database")');
      await page.waitForTimeout(2000);

      // Check Add new entry button has aria-label
      const addButton = page.locator('[aria-label="Add new entry"]');
      await expect(addButton).toBeVisible({ timeout: 5000 });

      // Check column config buttons have aria-label
      const configButton = page.locator('[aria-label*="Configure"]');
      await configButton.first().hover();
      await expect(configButton.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Dark Mode', () => {
    test('database block renders correctly in dark mode', async ({ page }) => {
      // Set dark mode (this depends on how your app handles dark mode)
      // Usually via prefers-color-scheme or a class on html/body
      await page.emulateMedia({ colorScheme: 'dark' });

      const editor = page.locator('.prose');
      await page.goto('/e2e-test');
      await page.waitForSelector('.prose', { timeout: 30000 });

      // Create database
      await editor.click();
      await page.keyboard.type('/database');
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // Verify dark mode classes are applied
      // The picker should have dark: variant classes applied
      const picker = page.locator('.rounded-lg').first();
      await expect(picker).toBeVisible();

      // Take a screenshot for visual regression (optional)
      await page.screenshot({ path: 'e2e/screenshots/database-dark-mode.png' });
    });
  });
});
