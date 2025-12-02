/**
 * API Types - Response wrappers and error handling
 */

/**
 * ErrorCode - Standard API error codes
 */
export const ErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  CONFLICT: 'CONFLICT',
  BAD_REQUEST: 'BAD_REQUEST',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode]

/**
 * ApiResponse - Standard API response wrapper
 * Used for: All API endpoints
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: ErrorCodeValue
    message: string
    details?: unknown
  }
}

/**
 * PaginatedResponse - Paginated list response
 * Used for: List endpoints with pagination
 */
export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

/**
 * AppError - Custom application error class
 * Used for: Throwing typed errors in services
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCodeValue,
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}
