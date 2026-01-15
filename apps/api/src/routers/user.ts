/**
 * User Router
 *
 * tRPC router for user-specific operations.
 * Uses protectedProcedure (requires auth, not org-specific).
 */
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc/init';
import type { SidebarItem } from '@trato-hive/shared';

/**
 * User preferences schema
 */
const sidebarItemSchema = z.object({
  id: z.string(),
  type: z.enum(['deal', 'company', 'document', 'page', 'module']),
  title: z.string(),
  icon: z.string(),
  href: z.string(),
  children: z.array(z.lazy(() => sidebarItemSchema)).optional(),
  metadata: z.record(z.unknown()).optional(),
}) as z.ZodType<SidebarItem>;

const sidebarPreferencesSchema = z.object({
  pinnedItems: z.array(sidebarItemSchema).max(7).default([]),
  recentItems: z.array(sidebarItemSchema).max(7).default([]),
});

const userPreferencesSchema = z.object({
  sidebar: sidebarPreferencesSchema.optional(),
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;

export const userRouter = router({
  /**
   * user.getPreferences - Get user preferences
   * Auth: protectedProcedure
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { preferences: true },
    });

    // Parse and validate preferences, return defaults if null or invalid
    if (!user?.preferences) {
      return { sidebar: { pinnedItems: [], recentItems: [] } };
    }

    const parsed = userPreferencesSchema.safeParse(user.preferences);
    if (!parsed.success) {
      return { sidebar: { pinnedItems: [], recentItems: [] } };
    }

    return parsed.data;
  }),

  /**
   * user.updateSidebarPreferences - Update sidebar preferences
   * Auth: protectedProcedure
   * Optimized: Only updates sidebar portion of preferences
   */
  updateSidebarPreferences: protectedProcedure
    .input(sidebarPreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      // Get current preferences
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { preferences: true },
      });

      const currentPrefs = user?.preferences as UserPreferences | null;

      // Merge sidebar preferences
      const updatedPrefs: UserPreferences = {
        ...currentPrefs,
        sidebar: {
          pinnedItems: input.pinnedItems,
          recentItems: input.recentItems,
        },
      };

      // Update user preferences (serialize for Prisma JSON field)
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { preferences: JSON.parse(JSON.stringify(updatedPrefs)) },
      });

      return { success: true };
    }),
});
