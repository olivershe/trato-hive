/**
 * API Error Codes
 */
export const ErrorCode = {
  // Generic
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Auth
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EXPIRED_TOKEN: 'EXPIRED_TOKEN',

  // Resource
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT', // e.g., duplicate slug
} as const

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode]

/**
 * Mapping of ErrorCode to HTTP Status
 */
export const HTTP_STATUS: Record<ErrorCodeValue, number> = {
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.EXPIRED_TOKEN]: 401,
  [ErrorCode.RESOURCE_CONFLICT]: 409,
}
