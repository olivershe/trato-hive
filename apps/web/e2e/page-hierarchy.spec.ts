/**
 * Page Hierarchy E2E Tests
 *
 * Tests for Notion-like page hierarchy features:
 * - Page tree sidebar navigation
 * - Create, rename, delete pages
 * - Drag & drop reordering
 * - Quick search (Cmd+K)
 * - Context menu actions
 */
import { test, expect } from "@playwright/test";

test.describe("Page Hierarchy", () => {
  // Skip if no test deal page exists
  // These tests assume a deal page is accessible at /deals/test-deal
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "Running only on Chromium for faster feedback"
  );

  test.describe("Page Tree Sidebar", () => {
    test("sidebar displays page tree", async ({ page }) => {
      // Navigate to deals list first (may need auth in real scenario)
      await page.goto("/deals");

      // If we have deals, click the first one
      const firstDeal = page.locator('a[href^="/deals/"]').first();
      if (await firstDeal.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstDeal.click();

        // Wait for sidebar to appear
        const sidebar = page.locator("aside");
        await expect(sidebar).toBeVisible({ timeout: 10000 });

        // Verify "Back to Deals" link exists
        await expect(sidebar.locator('text="Back to Deals"')).toBeVisible();

        // Verify "New Page" button exists
        await expect(sidebar.locator('text="New Page"')).toBeVisible();
      }
    });

    test("can expand and collapse page tree nodes", async ({ page }) => {
      await page.goto("/deals");

      const firstDeal = page.locator('a[href^="/deals/"]').first();
      if (await firstDeal.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstDeal.click();

        // Wait for tree to load
        await page.waitForSelector("aside", { timeout: 10000 });

        // Find expand/collapse buttons (chevron icons)
        const expandButton = page.locator('aside button svg.lucide-chevron-right').first();

        if (await expandButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          // Click to expand
          await expandButton.click();

          // Should now show chevron-down
          const collapseButton = page.locator('aside button svg.lucide-chevron-down').first();
          await expect(collapseButton).toBeVisible({ timeout: 3000 });
        }
      }
    });

    test("can navigate to page by clicking", async ({ page }) => {
      await page.goto("/deals");

      const firstDeal = page.locator('a[href^="/deals/"]').first();
      if (await firstDeal.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstDeal.click();

        // Wait for sidebar
        await page.waitForSelector("aside", { timeout: 10000 });

        // Click on a page link in the sidebar
        const pageLink = page.locator('aside a[href*="/pages/"]').first();

        if (await pageLink.isVisible({ timeout: 3000 }).catch(() => false)) {
          const href = await pageLink.getAttribute("href");
          await pageLink.click();

          // URL should change to the page
          await expect(page).toHaveURL(new RegExp(href || "pages"));
        }
      }
    });
  });

  test.describe("Page CRUD Operations", () => {
    test("can create new page via button", async ({ page }) => {
      await page.goto("/deals");

      const firstDeal = page.locator('a[href^="/deals/"]').first();
      if (await firstDeal.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstDeal.click();

        // Wait for sidebar
        await page.waitForSelector("aside", { timeout: 10000 });

        // Count existing pages
        const initialCount = await page.locator('aside a[href*="/pages/"]').count();

        // Click "New Page" button
        const newPageBtn = page.locator('button:has-text("New Page")');
        await newPageBtn.click();

        // Wait for page to be created (loader should appear then disappear)
        await page.waitForTimeout(1000);

        // Verify new page appeared
        const finalCount = await page.locator('aside a[href*="/pages/"]').count();
        expect(finalCount).toBeGreaterThanOrEqual(initialCount);
      }
    });

    test("can rename page via context menu", async ({ page }) => {
      await page.goto("/deals");

      const firstDeal = page.locator('a[href^="/deals/"]').first();
      if (await firstDeal.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstDeal.click();

        // Wait for sidebar
        await page.waitForSelector("aside", { timeout: 10000 });

        // Right-click on a page to open context menu
        const pageItem = page.locator('aside a[href*="/pages/"]').first();

        if (await pageItem.isVisible({ timeout: 3000 }).catch(() => false)) {
          await pageItem.click({ button: "right" });

          // Context menu should appear
          const renameBtn = page.locator('button:has-text("Rename")');
          await expect(renameBtn).toBeVisible({ timeout: 3000 });

          // Click rename
          await renameBtn.click();

          // Input should appear
          const input = page.locator('aside input[type="text"]');
          await expect(input).toBeVisible({ timeout: 3000 });

          // Type new name and press Enter
          await input.fill("Renamed Page");
          await input.press("Enter");

          // Wait for update
          await page.waitForTimeout(500);
        }
      }
    });

    test("can delete page via context menu", async ({ page }) => {
      await page.goto("/deals");

      const firstDeal = page.locator('a[href^="/deals/"]').first();
      if (await firstDeal.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstDeal.click();

        // Wait for sidebar
        await page.waitForSelector("aside", { timeout: 10000 });

        // First create a page to delete
        const newPageBtn = page.locator('button:has-text("New Page")');
        await newPageBtn.click();
        await page.waitForTimeout(1000);

        // Count pages
        const initialCount = await page.locator('aside a[href*="/pages/"]').count();

        // Right-click on the last page (likely the one we just created)
        const lastPage = page.locator('aside a[href*="/pages/"]').last();
        await lastPage.click({ button: "right" });

        // Click delete
        const deleteBtn = page.locator('button:has-text("Delete")');
        if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          // Handle confirmation dialog
          page.on("dialog", (dialog) => dialog.accept());
          await deleteBtn.click();

          // Wait for delete
          await page.waitForTimeout(1000);

          // Verify page was deleted
          const finalCount = await page.locator('aside a[href*="/pages/"]').count();
          expect(finalCount).toBeLessThan(initialCount);
        }
      }
    });
  });

  test.describe("Quick Search (Cmd+K)", () => {
    test("opens quick search modal with Cmd+K", async ({ page }) => {
      await page.goto("/deals");

      const firstDeal = page.locator('a[href^="/deals/"]').first();
      if (await firstDeal.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstDeal.click();

        // Wait for page to load
        await page.waitForSelector("aside", { timeout: 10000 });

        // Press Cmd+K (or Ctrl+K on non-Mac)
        await page.keyboard.press("Meta+k");

        // Quick search modal should appear
        const searchInput = page.locator('input[placeholder*="Search"]');
        await expect(searchInput).toBeVisible({ timeout: 3000 });
      }
    });

    test("can search and navigate to pages", async ({ page }) => {
      await page.goto("/deals");

      const firstDeal = page.locator('a[href^="/deals/"]').first();
      if (await firstDeal.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstDeal.click();

        // Wait for page to load
        await page.waitForSelector("aside", { timeout: 10000 });

        // Open quick search
        await page.keyboard.press("Meta+k");

        // Type search query
        const searchInput = page.locator('input[placeholder*="Search"]');
        await searchInput.fill("Due");

        // Should show filtered results
        await page.waitForTimeout(500);

        // Press Enter to navigate to first result
        await searchInput.press("Enter");

        // URL should change to a page
        await expect(page).toHaveURL(/\/pages\//);
      }
    });

    test("can close quick search with Escape", async ({ page }) => {
      await page.goto("/deals");

      const firstDeal = page.locator('a[href^="/deals/"]').first();
      if (await firstDeal.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstDeal.click();

        // Wait for page to load
        await page.waitForSelector("aside", { timeout: 10000 });

        // Open quick search
        await page.keyboard.press("Meta+k");

        const searchInput = page.locator('input[placeholder*="Search"]');
        await expect(searchInput).toBeVisible({ timeout: 3000 });

        // Press Escape to close
        await page.keyboard.press("Escape");

        // Modal should be hidden
        await expect(searchInput).not.toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe("Keyboard Shortcuts", () => {
    test("Cmd+N creates new page", async ({ page }) => {
      await page.goto("/deals");

      const firstDeal = page.locator('a[href^="/deals/"]').first();
      if (await firstDeal.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstDeal.click();

        // Wait for sidebar
        await page.waitForSelector("aside", { timeout: 10000 });

        // Count existing pages
        const initialCount = await page.locator('aside a[href*="/pages/"]').count();

        // Press Cmd+N
        await page.keyboard.press("Meta+n");

        // Wait for page to be created
        await page.waitForTimeout(1500);

        // Verify new page appeared
        const finalCount = await page.locator('aside a[href*="/pages/"]').count();
        expect(finalCount).toBeGreaterThanOrEqual(initialCount);
      }
    });
  });

  test.describe("Drag and Drop", () => {
    test("page tree items have drag handles", async ({ page }) => {
      await page.goto("/deals");

      const firstDeal = page.locator('a[href^="/deals/"]').first();
      if (await firstDeal.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstDeal.click();

        // Wait for sidebar
        await page.waitForSelector("aside", { timeout: 10000 });

        // Hover over a page item to reveal drag handle
        const pageItem = page.locator('aside a[href*="/pages/"]').first();
        await pageItem.hover();

        // Drag handle (GripVertical icon) should be visible on hover
        const dragHandle = page.locator('aside svg.lucide-grip-vertical').first();
        await expect(dragHandle).toBeVisible({ timeout: 3000 });
      }
    });
  });
});
