import { PaginationMeta, PaginationParams } from '../models';

/**
 * Default page sizes for different analysis types (YAGNI principle)
 */
export const DEFAULT_PAGE_SIZES = {
  size: 25,     // File processing intensive
  quality: 50,  // Metadata only
  content: 50,  // Lightweight data
} as const;

/**
 * Maximum allowed page size to prevent memory issues
 */
export const MAX_PAGE_SIZE = 500;

/**
 * Get default page size for analysis type (KISS principle)
 */
export function getDefaultPageSize(analysisType: string): number {
  switch (analysisType) {
    case 'size':
      return DEFAULT_PAGE_SIZES.size;
    case 'quality':
      return DEFAULT_PAGE_SIZES.quality;
    case 'content':
      return DEFAULT_PAGE_SIZES.content;
    default:
      return DEFAULT_PAGE_SIZES.quality;
  }
}

/**
 * Validate and normalize pagination parameters
 */
export function validatePaginationParams(
  params: PaginationParams,
  analysisType: string
): { limit: number; offset: number } {
  const defaultLimit = getDefaultPageSize(analysisType);
  
  let limit = params.limit || defaultLimit;
  let offset = params.offset || 0;

  // Handle "All Items" case (-1)
  if (limit === -1) {
    limit = Number.MAX_SAFE_INTEGER; // Return all items
  } else {
    // Validate and constrain values (KISS principle)
    limit = Math.max(1, Math.min(limit, MAX_PAGE_SIZE));
  }
  
  offset = Math.max(0, offset);

  return { limit, offset };
}

/**
 * Create pagination metadata for response
 */
export function createPaginationMeta(
  offset: number,
  limit: number,
  totalItems: number
): PaginationMeta {
  return {
    offset,
    limit,
    total: totalItems,
    hasMore: offset + limit < totalItems
  };
}

/**
 * Apply pagination to array (SOLID - Single Responsibility)
 */
export function paginateArray<T>(
  items: T[],
  offset: number,
  limit: number
): T[] {
  return items.slice(offset, offset + limit);
}

/**
 * Calculate total pages for given total and page size
 */
export function calculateTotalPages(total: number, pageSize: number): number {
  return Math.ceil(total / pageSize);
}

/**
 * Calculate current page number from offset and limit
 */
export function calculateCurrentPage(offset: number, limit: number): number {
  return Math.floor(offset / limit) + 1;
}