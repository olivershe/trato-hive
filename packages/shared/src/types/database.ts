/**
 * Database Types (Inline Database System)
 * Based on Prisma schema: packages/db/prisma/schema.prisma
 */

/**
 * DatabaseColumnType - Supported column types for inline databases
 */
export const DatabaseColumnType = {
  TEXT: 'TEXT',
  NUMBER: 'NUMBER',
  SELECT: 'SELECT',
  MULTI_SELECT: 'MULTI_SELECT',
  DATE: 'DATE',
  PERSON: 'PERSON',
  CHECKBOX: 'CHECKBOX',
  URL: 'URL',
} as const

export type DatabaseColumnTypeValue =
  (typeof DatabaseColumnType)[keyof typeof DatabaseColumnType]

/**
 * DatabaseColumn - Definition for a single column in the database schema
 */
export interface DatabaseColumn {
  id: string
  name: string
  type: DatabaseColumnTypeValue
  options?: string[] // For SELECT/MULTI_SELECT types
  width?: number // Column width in pixels (default: 150)
}

/**
 * DatabaseSchema - Complete schema definition for a database
 */
export interface DatabaseSchema {
  columns: DatabaseColumn[]
}

/**
 * Database - User-created inline database (Notion-style)
 */
export interface Database {
  id: string
  organizationId: string
  name: string
  description: string | null
  schema: DatabaseSchema
  createdById: string
  createdAt: Date
  updatedAt: Date
}

/**
 * DatabaseEntry - A single row in a database
 */
export interface DatabaseEntry {
  id: string
  databaseId: string
  properties: Record<string, unknown> // Column values keyed by column ID
  suggestedBy: string | null // AI agent that suggested this entry
  factIds: string[] // Source fact IDs for citation trail
  createdById: string
  createdAt: Date
  updatedAt: Date
}

/**
 * DatabaseWithEntries - Database with all its entries loaded
 * Used for: Inline database view, full database page
 */
export interface DatabaseWithEntries extends Database {
  entries: DatabaseEntry[]
  _count?: {
    entries: number
  }
}

/**
 * DatabaseWithCreator - Database with creator info
 * Used for: Database list views, audit displays
 */
export interface DatabaseWithCreator extends Database {
  creator: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

/**
 * DatabaseEntryWithCreator - Entry with creator info
 * Used for: Entry detail views, activity feeds
 */
export interface DatabaseEntryWithCreator extends DatabaseEntry {
  creator: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

/**
 * DatabaseEntryWithFacts - Entry with linked facts for citations
 * Used for: AI-suggested entries, citation displays
 */
export interface DatabaseEntryWithFacts extends DatabaseEntry {
  facts?: Array<{
    id: string
    type: string
    subject: string
    predicate: string
    object: string
    confidence: number
    sourceText: string | null
    documentName?: string
  }>
}

/**
 * DatabaseTemplate - Predefined database configurations
 * Used for: Quick database creation from templates
 */
export interface DatabaseTemplate {
  id: string
  name: string
  description: string
  schema: DatabaseSchema
}

/**
 * Default database templates for M&A workflows
 */
export const DATABASE_TEMPLATES: DatabaseTemplate[] = [
  {
    id: 'dd-tracker',
    name: 'Due Diligence Tracker',
    description: 'Track due diligence tasks and status',
    schema: {
      columns: [
        { id: 'task', name: 'Task', type: 'TEXT' },
        { id: 'category', name: 'Category', type: 'SELECT', options: ['Legal', 'Financial', 'Technical', 'Commercial', 'HR'] },
        { id: 'status', name: 'Status', type: 'SELECT', options: ['To Do', 'In Progress', 'Review', 'Done'] },
        { id: 'assignee', name: 'Assignee', type: 'PERSON' },
        { id: 'dueDate', name: 'Due Date', type: 'DATE' },
        { id: 'priority', name: 'Priority', type: 'SELECT', options: ['Low', 'Medium', 'High', 'Critical'] },
      ],
    },
  },
  {
    id: 'contact-list',
    name: 'Contact List',
    description: 'Manage key contacts for the deal',
    schema: {
      columns: [
        { id: 'name', name: 'Name', type: 'TEXT' },
        { id: 'role', name: 'Role', type: 'TEXT' },
        { id: 'company', name: 'Company', type: 'TEXT' },
        { id: 'email', name: 'Email', type: 'URL' },
        { id: 'phone', name: 'Phone', type: 'TEXT' },
        { id: 'notes', name: 'Notes', type: 'TEXT' },
      ],
    },
  },
  {
    id: 'document-log',
    name: 'Document Log',
    description: 'Track document requests and status',
    schema: {
      columns: [
        { id: 'document', name: 'Document', type: 'TEXT' },
        { id: 'category', name: 'Category', type: 'SELECT', options: ['Financial', 'Legal', 'Corporate', 'Technical', 'Other'] },
        { id: 'status', name: 'Status', type: 'SELECT', options: ['Requested', 'Received', 'Under Review', 'Approved'] },
        { id: 'requestDate', name: 'Requested', type: 'DATE' },
        { id: 'receivedDate', name: 'Received', type: 'DATE' },
        { id: 'notes', name: 'Notes', type: 'TEXT' },
      ],
    },
  },
  {
    id: 'risk-register',
    name: 'Risk Register',
    description: 'Track and assess deal risks',
    schema: {
      columns: [
        { id: 'risk', name: 'Risk', type: 'TEXT' },
        { id: 'category', name: 'Category', type: 'SELECT', options: ['Financial', 'Legal', 'Operational', 'Market', 'Regulatory'] },
        { id: 'likelihood', name: 'Likelihood', type: 'SELECT', options: ['Low', 'Medium', 'High'] },
        { id: 'impact', name: 'Impact', type: 'SELECT', options: ['Low', 'Medium', 'High'] },
        { id: 'mitigation', name: 'Mitigation', type: 'TEXT' },
        { id: 'owner', name: 'Owner', type: 'PERSON' },
      ],
    },
  },
]
