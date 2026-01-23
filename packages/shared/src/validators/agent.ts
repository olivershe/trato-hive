/**
 * Custom Agent Validators
 * Input schemas for agent CRUD operations and execution
 */
import { z } from 'zod'

/**
 * Agent Output Format enum matching Prisma schema
 */
export const AgentOutputFormat = {
  FREEFORM: 'FREEFORM',
  TABLE: 'TABLE',
  BULLETS: 'BULLETS',
  SUMMARY: 'SUMMARY',
  JSON: 'JSON',
} as const

export type AgentOutputFormat = (typeof AgentOutputFormat)[keyof typeof AgentOutputFormat]

const agentOutputFormatValues = Object.values(AgentOutputFormat) as [string, ...string[]]

/**
 * File Attachment Schema - for multimodal AI inputs
 * Note: url can be either a full URL or an S3 key (which gets resolved to a signed URL)
 */
export const fileAttachmentSchema = z.object({
  url: z.string().min(1, 'File URL or S3 key is required'),
  contentType: z.string().optional(),
  name: z.string().optional(),
})

export type FileAttachment = z.infer<typeof fileAttachmentSchema>

/**
 * Create Agent Input - For creating new custom agents
 */
export const createAgentSchema = z.object({
  name: z
    .string()
    .min(1, 'Agent name is required')
    .max(100, 'Agent name must be at most 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  promptTemplate: z
    .string()
    .min(10, 'Prompt template must be at least 10 characters')
    .max(10000, 'Prompt template must be at most 10000 characters'),
  outputFormat: z.enum(agentOutputFormatValues).default('FREEFORM'),
  icon: z.string().max(10, 'Icon must be at most 10 characters').optional(),
  color: z.string().max(20, 'Color must be at most 20 characters').optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
})

export type CreateAgentInput = z.infer<typeof createAgentSchema>

/**
 * Update Agent Input - For updating existing agents
 */
export const updateAgentSchema = z.object({
  id: z.string().cuid('Invalid agent ID'),
  name: z
    .string()
    .min(1, 'Agent name is required')
    .max(100, 'Agent name must be at most 100 characters')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .nullable()
    .optional(),
  promptTemplate: z
    .string()
    .min(10, 'Prompt template must be at least 10 characters')
    .max(10000, 'Prompt template must be at most 10000 characters')
    .optional(),
  outputFormat: z.enum(agentOutputFormatValues).optional(),
  icon: z.string().max(10).nullable().optional(),
  color: z.string().max(20).nullable().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  isActive: z.boolean().optional(),
})

export type UpdateAgentInput = z.infer<typeof updateAgentSchema>

/**
 * Get Agent Input
 */
export const getAgentSchema = z.object({
  id: z.string().cuid('Invalid agent ID'),
})

export type GetAgentInput = z.infer<typeof getAgentSchema>

/**
 * Delete Agent Input
 */
export const deleteAgentSchema = z.object({
  id: z.string().cuid('Invalid agent ID'),
})

export type DeleteAgentInput = z.infer<typeof deleteAgentSchema>

/**
 * List Agents Input
 */
export const listAgentsSchema = z.object({
  activeOnly: z.boolean().optional().default(false),
  search: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
})

export type ListAgentsInput = z.infer<typeof listAgentsSchema>

/**
 * Search Agents Input - For slash command autocomplete
 */
export const searchAgentsSchema = z.object({
  query: z.string().max(100),
  limit: z.number().int().min(1).max(20).default(10),
})

export type SearchAgentsInput = z.infer<typeof searchAgentsSchema>

/**
 * Agent Execution Context - Where the agent is being executed
 */
export const agentExecutionContextSchema = z.object({
  dealId: z.string().cuid('Invalid deal ID').optional(),
  companyId: z.string().cuid('Invalid company ID').optional(),
  pageId: z.string().cuid('Invalid page ID').optional(),
})

export type AgentExecutionContext = z.infer<typeof agentExecutionContextSchema>

/**
 * Execute Agent Input - For running custom agents
 */
export const executeAgentSchema = z.object({
  agentId: z.string().cuid('Invalid agent ID'),
  context: agentExecutionContextSchema.optional(),
  userPrompt: z.string().max(5000, 'User prompt must be at most 5000 characters').optional(),
  attachments: z.array(fileAttachmentSchema).max(10, 'Maximum 10 attachments allowed').optional(),
  documentIds: z.array(z.string().cuid('Invalid document ID')).max(10).optional(),
})

export type ExecuteAgentInput = z.infer<typeof executeAgentSchema>

/**
 * Agent Execution Result
 */
export interface AgentExecutionResult {
  content: string
  format: AgentOutputFormat
  attachmentsUsed: number
  tokensUsed?: {
    prompt: number
    completion: number
    total: number
  }
  processingTimeMs: number
}

/**
 * Available template variables for prompt interpolation
 */
export const TEMPLATE_VARIABLES = [
  { name: '{{dealName}}', description: 'Current deal name' },
  { name: '{{companyName}}', description: "Deal's target company name" },
  { name: '{{industry}}', description: "Deal's industry" },
  { name: '{{stage}}', description: 'Current deal stage' },
  { name: '{{dealValue}}', description: 'Deal value with currency' },
  { name: '{{documentCount}}', description: 'Number of attached documents' },
  { name: '{{documentList}}', description: 'Comma-separated list of document names' },
  { name: '{{userName}}', description: 'Current user name' },
  { name: '{{date}}', description: "Today's date" },
] as const
