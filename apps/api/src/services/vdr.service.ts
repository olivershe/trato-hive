/**
 * VDR (Virtual Data Room) Service
 *
 * Business logic for document listing, folder management, and file operations.
 * Enforces multi-tenancy via organizationId on all operations.
 */
import type { PrismaClient, Document, DocumentStatus, DocumentType } from '@trato-hive/db';
import { TRPCError } from '@trpc/server';
import { StorageClient, createStorageClientFromEnv } from '@trato-hive/data-plane';
import {
  type ListDocumentsInput,
  type GetFolderTreeInput,
  type GetUploadUrlInput,
  type CreateDocumentInput,
  type CreateFolderInput,
  type MoveDocumentInput,
  type DeleteDocumentInput,
  type RenameFolderInput,
  type UpdateDocumentTagsInput,
  type GetAvailableTagsInput,
  type ListDealsWithDocCountsInput,
} from '@trato-hive/shared';

// =============================================================================
// Types
// =============================================================================

export interface FolderNode {
  name: string;
  path: string;
  documentCount: number;
  children: FolderNode[];
}

export interface DocumentListItem {
  id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  fileSize: number;
  mimeType: string;
  folderPath: string | null;
  uploadedBy: {
    id: string;
    name: string | null;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
  // AI-Applied Tags (Document Vault)
  aiDocumentType: string | null;
  aiIndustry: string | null;
  contentTags: string[];
  tagsAppliedAt: Date | null;
  tagsConfidence: number | null;
  tagsOverridden: boolean;
}

export interface AvailableTags {
  documentTypes: string[];
  industries: string[];
  contentTags: string[];
}

export interface DealWithDocCount {
  id: string;
  name: string;
  stage: string;
  documentCount: number;
  company: {
    id: string;
    name: string;
  } | null;
}

export interface ListDocumentsResult {
  items: DocumentListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}

export interface UploadUrlResult {
  url: string;
  key: string;
  expiresIn: number;
}

// =============================================================================
// Service Class
// =============================================================================

export class VDRService {
  private storage: StorageClient | null = null;

  constructor(private db: PrismaClient) {}

  /**
   * Get or create storage client (lazy initialization)
   */
  private getStorage(): StorageClient {
    if (!this.storage) {
      try {
        this.storage = createStorageClientFromEnv();
      } catch {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Storage service not configured',
        });
      }
    }
    return this.storage;
  }

  /**
   * List documents with pagination and filtering
   */
  async listDocuments(
    organizationId: string,
    input: ListDocumentsInput
  ): Promise<ListDocumentsResult> {
    const { page, pageSize, folderPath, dealId, companyId, status, search, documentTypes, industries, contentTags } = input;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: Record<string, unknown> = {
      organizationId,
    };

    if (dealId) {
      where.dealId = dealId;
    }

    if (companyId) {
      where.companyId = companyId;
    }

    if (status) {
      where.status = status;
    }

    // Folder filtering - exact match or root (null)
    if (folderPath !== undefined) {
      if (folderPath === '' || folderPath === '/') {
        // Root folder - documents with no folder or empty folder
        where.OR = [{ folderPath: null }, { folderPath: '' }, { folderPath: '/' }];
      } else {
        where.folderPath = folderPath;
      }
    }

    // Search by name
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // AI Tag filters (Document Vault)
    if (documentTypes && documentTypes.length > 0) {
      where.aiDocumentType = { in: documentTypes };
    }

    if (industries && industries.length > 0) {
      where.aiIndustry = { in: industries };
    }

    if (contentTags && contentTags.length > 0) {
      // Use hasEvery for AND logic - document must have all specified tags
      where.contentTags = { hasEvery: contentTags };
    }

    const [documents, total] = await Promise.all([
      this.db.document.findMany({
        where,
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          fileSize: true,
          mimeType: true,
          folderPath: true,
          createdAt: true,
          updatedAt: true,
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          // AI Tag fields
          aiDocumentType: true,
          aiIndustry: true,
          contentTags: true,
          tagsAppliedAt: true,
          tagsConfidence: true,
          tagsOverridden: true,
        },
        orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
        skip,
        take: pageSize,
      }),
      this.db.document.count({ where }),
    ]);

    return {
      items: documents.map((doc) => ({
        ...doc,
        folderPath: doc.folderPath ?? null,
        aiDocumentType: doc.aiDocumentType ?? null,
        aiIndustry: doc.aiIndustry ?? null,
        contentTags: doc.contentTags ?? [],
        tagsAppliedAt: doc.tagsAppliedAt ?? null,
        tagsConfidence: doc.tagsConfidence ?? null,
        tagsOverridden: doc.tagsOverridden ?? false,
      })),
      pagination: {
        page,
        pageSize,
        total,
        hasMore: skip + documents.length < total,
      },
    };
  }

  /**
   * Build folder tree from document paths
   */
  async getFolderTree(
    organizationId: string,
    input: GetFolderTreeInput
  ): Promise<FolderNode[]> {
    const { dealId, companyId } = input;

    // Build where clause
    const where: Record<string, unknown> = {
      organizationId,
      folderPath: { not: null },
    };

    if (dealId) {
      where.dealId = dealId;
    }

    if (companyId) {
      where.companyId = companyId;
    }

    // Get all documents with folder paths
    const documents = await this.db.document.findMany({
      where,
      select: {
        folderPath: true,
      },
    });

    // Build folder tree from paths
    const folderMap = new Map<string, { count: number; children: Set<string> }>();

    for (const doc of documents) {
      if (!doc.folderPath) continue;

      // Normalize path
      const path = doc.folderPath.startsWith('/') ? doc.folderPath : `/${doc.folderPath}`;
      const parts = path.split('/').filter(Boolean);

      // Build all folder levels
      let currentPath = '';
      for (let i = 0; i < parts.length; i++) {
        const parentPath = currentPath;
        currentPath = `/${parts.slice(0, i + 1).join('/')}`;

        if (!folderMap.has(currentPath)) {
          folderMap.set(currentPath, { count: 0, children: new Set() });
        }

        // Add child to parent
        if (parentPath && folderMap.has(parentPath)) {
          folderMap.get(parentPath)!.children.add(currentPath);
        }

        // Increment count for the leaf folder
        if (i === parts.length - 1) {
          folderMap.get(currentPath)!.count++;
        }
      }
    }

    // Build tree structure
    const buildNode = (path: string): FolderNode => {
      const data = folderMap.get(path)!;
      const name = path.split('/').filter(Boolean).pop() || 'Root';

      return {
        name,
        path,
        documentCount: data.count,
        children: Array.from(data.children)
          .sort()
          .map((childPath) => buildNode(childPath)),
      };
    };

    // Find root folders (direct children of root)
    const rootFolders: FolderNode[] = [];
    for (const [path] of folderMap) {
      const parts = path.split('/').filter(Boolean);
      if (parts.length === 1) {
        rootFolders.push(buildNode(path));
      }
    }

    return rootFolders.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get single document by ID
   */
  async getDocument(
    organizationId: string,
    documentId: string
  ): Promise<Document> {
    const document = await this.db.document.findFirst({
      where: {
        id: documentId,
        organizationId,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Document not found',
      });
    }

    return document;
  }

  /**
   * Generate presigned upload URL
   */
  async getUploadUrl(
    organizationId: string,
    input: GetUploadUrlInput
  ): Promise<UploadUrlResult> {
    const { filename, folderPath, mimeType, fileSize } = input;
    const storage = this.getStorage();

    // Build storage key with folder path
    const folderPrefix = folderPath ? `${folderPath.replace(/^\//, '')}/` : '';
    const fullPath = `${folderPrefix}${filename}`;

    // Validate file size (100MB limit)
    const MAX_SIZE = 100 * 1024 * 1024;
    if (fileSize > MAX_SIZE) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `File size exceeds maximum allowed size of ${MAX_SIZE} bytes`,
      });
    }

    try {
      const { url, key } = await storage.getUploadUrl(organizationId, fullPath, {
        contentType: mimeType,
        expiresIn: 3600, // 1 hour
      });

      return {
        url,
        key,
        expiresIn: 3600,
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate upload URL',
        cause: error,
      });
    }
  }

  /**
   * Generate presigned download URL
   */
  async getDownloadUrl(
    organizationId: string,
    documentId: string
  ): Promise<string> {
    const document = await this.getDocument(organizationId, documentId);
    const storage = this.getStorage();

    try {
      // Use the stored fileUrl (S3 key) directly
      return await storage.getPresignedUrl(document.fileUrl, 3600);
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate download URL',
        cause: error,
      });
    }
  }

  /**
   * Create document record after S3 upload
   */
  async createDocument(
    organizationId: string,
    userId: string,
    input: CreateDocumentInput
  ): Promise<Document> {
    const { name, folderPath, dealId, companyId, fileUrl, fileSize, mimeType, type } = input;

    // Validate deal belongs to organization if provided
    if (dealId) {
      const deal = await this.db.deal.findFirst({
        where: { id: dealId, organizationId },
      });
      if (!deal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Deal not found',
        });
      }
    }

    // Validate company belongs to organization if provided
    if (companyId) {
      const company = await this.db.company.findFirst({
        where: { id: companyId, organizationId },
      });
      if (!company) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Company not found',
        });
      }
    }

    // Create document record
    const document = await this.db.document.create({
      data: {
        organizationId,
        uploadedById: userId,
        name,
        folderPath: folderPath || null,
        dealId: dealId || null,
        companyId: companyId || null,
        fileUrl,
        fileSize,
        mimeType,
        type: type as DocumentType,
        status: 'UPLOADING',
      },
    });

    // TODO: Queue document processing job
    // await documentQueue.addDocumentProcessingJob({
    //   documentId: document.id,
    //   fileUrl: document.fileUrl,
    //   organizationId,
    // });

    return document;
  }

  /**
   * Create virtual folder (by creating documents with that folder path)
   * Note: Folders are virtual - they exist only as document paths
   */
  async createFolder(
    organizationId: string,
    input: CreateFolderInput
  ): Promise<{ path: string; name: string }> {
    const { name, parentPath, dealId } = input;

    // Build full path
    const normalizedParent = parentPath ? (parentPath.startsWith('/') ? parentPath : `/${parentPath}`) : '';
    const fullPath = `${normalizedParent}/${name}`;

    // Validate deal if provided
    if (dealId) {
      const deal = await this.db.deal.findFirst({
        where: { id: dealId, organizationId },
      });
      if (!deal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Deal not found',
        });
      }
    }

    // For now, folders are virtual - they're created when documents are uploaded
    // We just return the path that would be created
    return {
      path: fullPath,
      name,
    };
  }

  /**
   * Move document to different folder
   */
  async moveDocument(
    organizationId: string,
    input: MoveDocumentInput
  ): Promise<Document> {
    const { documentId, targetFolderPath } = input;

    // Verify document belongs to organization
    const document = await this.getDocument(organizationId, documentId);

    // Update folder path
    return this.db.document.update({
      where: { id: document.id },
      data: {
        folderPath: targetFolderPath || null,
      },
    });
  }

  /**
   * Delete document
   */
  async deleteDocument(
    organizationId: string,
    input: DeleteDocumentInput
  ): Promise<void> {
    const { documentId, deleteFromStorage } = input;

    // Verify document belongs to organization
    const document = await this.getDocument(organizationId, documentId);

    // Delete from S3 if requested
    if (deleteFromStorage) {
      try {
        const storage = this.getStorage();
        // Extract filename from fileUrl (which is the S3 key)
        const key = document.fileUrl;
        // Parse org and filename from key
        const parts = key.split('/');
        if (parts.length >= 2) {
          const filename = parts.slice(1).join('/');
          await storage.delete(organizationId, filename);
        }
      } catch (error) {
        // Log but don't fail - document record should still be deleted
        console.error('Failed to delete file from storage:', error);
      }
    }

    // Delete document record (cascades to chunks and facts)
    await this.db.document.delete({
      where: { id: document.id },
    });
  }

  /**
   * Rename folder (updates all documents in that folder)
   */
  async renameFolder(
    organizationId: string,
    input: RenameFolderInput
  ): Promise<{ oldPath: string; newPath: string; documentsUpdated: number }> {
    const { folderPath, newName, dealId, companyId } = input;

    // Build where clause
    const where: Record<string, unknown> = {
      organizationId,
      folderPath: { startsWith: folderPath },
    };

    if (dealId) {
      where.dealId = dealId;
    }

    if (companyId) {
      where.companyId = companyId;
    }

    // Get all documents in this folder and subfolders
    const documents = await this.db.document.findMany({
      where,
      select: { id: true, folderPath: true },
    });

    if (documents.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No documents found in folder',
      });
    }

    // Calculate new folder path
    const parentPath = folderPath.split('/').slice(0, -1).join('/') || '';
    const newPath = `${parentPath}/${newName}`;

    // Update all documents
    let updated = 0;
    for (const doc of documents) {
      if (!doc.folderPath) continue;

      const updatedPath = doc.folderPath.replace(folderPath, newPath);
      await this.db.document.update({
        where: { id: doc.id },
        data: { folderPath: updatedPath },
      });
      updated++;
    }

    return {
      oldPath: folderPath,
      newPath,
      documentsUpdated: updated,
    };
  }

  /**
   * Update document tags (manual override)
   */
  async updateDocumentTags(
    organizationId: string,
    input: UpdateDocumentTagsInput
  ): Promise<Document> {
    const { documentId, aiDocumentType, aiIndustry, contentTags } = input;

    // Verify document belongs to organization
    const document = await this.getDocument(organizationId, documentId);

    // Build update data
    const updateData: Record<string, unknown> = {
      tagsOverridden: true,
    };

    if (aiDocumentType !== undefined) {
      updateData.aiDocumentType = aiDocumentType;
    }

    if (aiIndustry !== undefined) {
      updateData.aiIndustry = aiIndustry;
    }

    if (contentTags !== undefined) {
      updateData.contentTags = contentTags;
    }

    return this.db.document.update({
      where: { id: document.id },
      data: updateData,
    });
  }

  /**
   * Get available tags for filter dropdowns
   */
  async getAvailableTags(
    organizationId: string,
    input: GetAvailableTagsInput
  ): Promise<AvailableTags> {
    const { dealId } = input;

    // Build where clause
    const where: Record<string, unknown> = {
      organizationId,
    };

    if (dealId) {
      where.dealId = dealId;
    }

    // Get distinct values for each tag type
    const documents = await this.db.document.findMany({
      where,
      select: {
        aiDocumentType: true,
        aiIndustry: true,
        contentTags: true,
      },
    });

    // Extract unique values
    const documentTypes = new Set<string>();
    const industries = new Set<string>();
    const contentTags = new Set<string>();

    for (const doc of documents) {
      if (doc.aiDocumentType) {
        documentTypes.add(doc.aiDocumentType);
      }
      if (doc.aiIndustry) {
        industries.add(doc.aiIndustry);
      }
      for (const tag of doc.contentTags || []) {
        contentTags.add(tag);
      }
    }

    return {
      documentTypes: Array.from(documentTypes).sort(),
      industries: Array.from(industries).sort(),
      contentTags: Array.from(contentTags).sort(),
    };
  }

  /**
   * List deals with document counts (for Vault deal cards)
   */
  async listDealsWithDocCounts(
    organizationId: string,
    input: ListDealsWithDocCountsInput
  ): Promise<DealWithDocCount[]> {
    const { stage, search } = input;

    // Build where clause for deals
    const dealWhere: Record<string, unknown> = {
      organizationId,
    };

    // Filter by stage
    if (stage === 'ACTIVE') {
      dealWhere.stage = {
        notIn: ['CLOSED_WON', 'CLOSED_LOST'],
      };
    } else if (stage === 'CLOSED') {
      dealWhere.stage = {
        in: ['CLOSED_WON', 'CLOSED_LOST'],
      };
    }

    // Search by name
    if (search) {
      dealWhere.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Get deals with document counts
    const deals = await this.db.deal.findMany({
      where: dealWhere,
      select: {
        id: true,
        name: true,
        stage: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            documents: true,
          },
        },
      },
      orderBy: [{ updatedAt: 'desc' }],
    });

    return deals.map((deal) => ({
      id: deal.id,
      name: deal.name,
      stage: deal.stage,
      company: deal.company,
      documentCount: deal._count.documents,
    }));
  }

  /**
   * Apply AI tags to a document
   */
  async applyAITags(
    organizationId: string,
    documentId: string,
    tags: {
      aiDocumentType: string;
      aiIndustry: string;
      contentTags: string[];
      confidence: number;
    }
  ): Promise<Document> {
    // Verify document belongs to organization
    const document = await this.getDocument(organizationId, documentId);

    // Don't overwrite if user has manually edited tags
    if (document.tagsOverridden) {
      return document;
    }

    return this.db.document.update({
      where: { id: document.id },
      data: {
        aiDocumentType: tags.aiDocumentType,
        aiIndustry: tags.aiIndustry,
        contentTags: tags.contentTags,
        tagsAppliedAt: new Date(),
        tagsConfidence: tags.confidence,
      },
    });
  }
}
