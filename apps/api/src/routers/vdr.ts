/**
 * VDR (Virtual Data Room) Router
 *
 * tRPC router for document management, folder structure, and file operations.
 * All procedures use organizationProtectedProcedure for multi-tenancy.
 */
import { z } from 'zod';
import { router, organizationProtectedProcedure } from '../trpc/init';
import { VDRService } from '../services/vdr.service';
import {
  listDocumentsInputSchema,
  getFolderTreeInputSchema,
  getUploadUrlInputSchema,
  getDownloadUrlInputSchema,
  createDocumentInputSchema,
  createFolderInputSchema,
  moveDocumentInputSchema,
  deleteDocumentInputSchema,
  getDocumentInputSchema,
  renameFolderInputSchema,
  updateDocumentTagsInputSchema,
  getAvailableTagsInputSchema,
  listDealsWithDocCountsInputSchema,
} from '@trato-hive/shared';

export const vdrRouter = router({
  /**
   * vdr.listDocuments - List documents with filtering and pagination
   * Auth: organizationProtectedProcedure
   */
  listDocuments: organizationProtectedProcedure
    .input(listDocumentsInputSchema)
    .query(async ({ ctx, input }) => {
      const service = new VDRService(ctx.db);
      return service.listDocuments(ctx.organizationId, input);
    }),

  /**
   * vdr.getFolderTree - Get hierarchical folder structure
   * Auth: organizationProtectedProcedure
   */
  getFolderTree: organizationProtectedProcedure
    .input(getFolderTreeInputSchema)
    .query(async ({ ctx, input }) => {
      const service = new VDRService(ctx.db);
      return service.getFolderTree(ctx.organizationId, input);
    }),

  /**
   * vdr.getDocument - Get single document by ID
   * Auth: organizationProtectedProcedure
   */
  getDocument: organizationProtectedProcedure
    .input(getDocumentInputSchema)
    .query(async ({ ctx, input }) => {
      const service = new VDRService(ctx.db);
      return service.getDocument(ctx.organizationId, input.id);
    }),

  /**
   * vdr.getUploadUrl - Generate presigned URL for uploading a file
   * Auth: organizationProtectedProcedure
   */
  getUploadUrl: organizationProtectedProcedure
    .input(getUploadUrlInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new VDRService(ctx.db);
      return service.getUploadUrl(ctx.organizationId, input);
    }),

  /**
   * vdr.getDownloadUrl - Generate presigned URL for downloading a file
   * Auth: organizationProtectedProcedure
   */
  getDownloadUrl: organizationProtectedProcedure
    .input(getDownloadUrlInputSchema)
    .query(async ({ ctx, input }) => {
      const service = new VDRService(ctx.db);
      const url = await service.getDownloadUrl(ctx.organizationId, input.documentId);
      return { url };
    }),

  /**
   * vdr.createDocument - Create document record after S3 upload
   * Auth: organizationProtectedProcedure
   */
  createDocument: organizationProtectedProcedure
    .input(createDocumentInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new VDRService(ctx.db);
      return service.createDocument(ctx.organizationId, ctx.session.user.id, input);
    }),

  /**
   * vdr.createFolder - Create virtual folder
   * Auth: organizationProtectedProcedure
   */
  createFolder: organizationProtectedProcedure
    .input(createFolderInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new VDRService(ctx.db);
      return service.createFolder(ctx.organizationId, input);
    }),

  /**
   * vdr.moveDocument - Move document to different folder
   * Auth: organizationProtectedProcedure
   */
  moveDocument: organizationProtectedProcedure
    .input(moveDocumentInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new VDRService(ctx.db);
      return service.moveDocument(ctx.organizationId, input);
    }),

  /**
   * vdr.deleteDocument - Delete document
   * Auth: organizationProtectedProcedure
   */
  deleteDocument: organizationProtectedProcedure
    .input(deleteDocumentInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new VDRService(ctx.db);
      await service.deleteDocument(ctx.organizationId, input);
      return { success: true };
    }),

  /**
   * vdr.renameFolder - Rename folder (updates all documents in that folder)
   * Auth: organizationProtectedProcedure
   */
  renameFolder: organizationProtectedProcedure
    .input(renameFolderInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new VDRService(ctx.db);
      return service.renameFolder(ctx.organizationId, input);
    }),

  /**
   * vdr.updateTags - Update document tags (manual override)
   * Auth: organizationProtectedProcedure
   */
  updateTags: organizationProtectedProcedure
    .input(updateDocumentTagsInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new VDRService(ctx.db);
      return service.updateDocumentTags(ctx.organizationId, input);
    }),

  /**
   * vdr.getAvailableTags - Get available tags for filter dropdowns
   * Auth: organizationProtectedProcedure
   */
  getAvailableTags: organizationProtectedProcedure
    .input(getAvailableTagsInputSchema)
    .query(async ({ ctx, input }) => {
      const service = new VDRService(ctx.db);
      return service.getAvailableTags(ctx.organizationId, input);
    }),

  /**
   * vdr.listDealsWithDocCounts - List deals with document counts for Vault
   * Auth: organizationProtectedProcedure
   */
  listDealsWithDocCounts: organizationProtectedProcedure
    .input(listDealsWithDocCountsInputSchema)
    .query(async ({ ctx, input }) => {
      const service = new VDRService(ctx.db);
      return service.listDealsWithDocCounts(ctx.organizationId, input);
    }),
});
