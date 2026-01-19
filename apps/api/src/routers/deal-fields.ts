/**
 * Deal Fields Router
 *
 * tRPC router for custom field schema CRUD operations.
 * All procedures use organizationProtectedProcedure for multi-tenancy.
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { FieldType, Prisma } from '@trato-hive/db';
import { router, organizationProtectedProcedure } from '../trpc/init';
import {
  createFieldSchemaSchema,
  updateFieldSchemaSchema,
  deleteFieldSchemaSchema,
} from '@trato-hive/shared';

export const dealFieldsRouter = router({
  /**
   * dealField.list - List all custom field schemas for organization
   * Auth: organizationProtectedProcedure
   */
  list: organizationProtectedProcedure.query(async ({ ctx }) => {
    const fields = await ctx.db.dealFieldSchema.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { order: 'asc' },
    });
    return fields;
  }),

  /**
   * dealField.get - Get single field schema by ID
   * Auth: organizationProtectedProcedure
   */
  get: organizationProtectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const field = await ctx.db.dealFieldSchema.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.organizationId,
        },
      });

      if (!field) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Field schema not found',
        });
      }

      return field;
    }),

  /**
   * dealField.create - Create new custom field schema
   * Auth: organizationProtectedProcedure
   */
  create: organizationProtectedProcedure
    .input(createFieldSchemaSchema)
    .mutation(async ({ ctx, input }) => {
      // Check for duplicate name
      const existing = await ctx.db.dealFieldSchema.findFirst({
        where: {
          organizationId: ctx.organizationId,
          name: input.name,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `A field with name "${input.name}" already exists`,
        });
      }

      // Get max order for new field
      const maxOrder = await ctx.db.dealFieldSchema.aggregate({
        where: { organizationId: ctx.organizationId },
        _max: { order: true },
      });

      const field = await ctx.db.dealFieldSchema.create({
        data: {
          organizationId: ctx.organizationId,
          name: input.name,
          type: input.type as FieldType,
          options: input.options ?? Prisma.JsonNull,
          required: input.required ?? false,
          order: input.order ?? (maxOrder._max.order ?? -1) + 1,
        },
      });

      return field;
    }),

  /**
   * dealField.update - Update custom field schema
   * Auth: organizationProtectedProcedure
   */
  update: organizationProtectedProcedure
    .input(updateFieldSchemaSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Verify field exists and belongs to org
      const existing = await ctx.db.dealFieldSchema.findFirst({
        where: {
          id,
          organizationId: ctx.organizationId,
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Field schema not found',
        });
      }

      // Check for duplicate name if name is being changed
      if (data.name && data.name !== existing.name) {
        const duplicate = await ctx.db.dealFieldSchema.findFirst({
          where: {
            organizationId: ctx.organizationId,
            name: data.name,
            id: { not: id },
          },
        });

        if (duplicate) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `A field with name "${data.name}" already exists`,
          });
        }
      }

      const updateData: Prisma.DealFieldSchemaUpdateInput = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.type !== undefined) updateData.type = data.type as FieldType;
      if (data.options !== undefined) {
        updateData.options = data.options ?? Prisma.JsonNull;
      }
      if (data.required !== undefined) updateData.required = data.required;
      if (data.order !== undefined) updateData.order = data.order;

      const field = await ctx.db.dealFieldSchema.update({
        where: { id },
        data: updateData,
      });

      return field;
    }),

  /**
   * dealField.delete - Delete custom field schema
   * Auth: organizationProtectedProcedure
   * Note: This removes the field definition but leaves values in Deal.customFields
   */
  delete: organizationProtectedProcedure
    .input(deleteFieldSchemaSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify field exists and belongs to org
      const existing = await ctx.db.dealFieldSchema.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.organizationId,
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Field schema not found',
        });
      }

      await ctx.db.dealFieldSchema.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * dealField.reorder - Reorder custom field schemas
   * Auth: organizationProtectedProcedure
   */
  reorder: organizationProtectedProcedure
    .input(
      z.object({
        fieldIds: z.array(z.string().cuid()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Update order for each field
      await ctx.db.$transaction(
        input.fieldIds.map((id, index) =>
          ctx.db.dealFieldSchema.updateMany({
            where: {
              id,
              organizationId: ctx.organizationId,
            },
            data: { order: index },
          })
        )
      );

      return { success: true };
    }),
});
