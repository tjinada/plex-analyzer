/**
 * Pagination metadata interface
 */
export interface PaginationMeta {
  offset: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

/**
 * Paginated API response interface
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T;
  pagination: PaginationMeta;
  timestamp: string;
}

/**
 * Tab loading state interface
 */
export interface TabLoadingState {
  isLoaded: boolean;
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
  data?: any;
  pagination?: PaginationMeta;
}

/**
 * Analysis cache entry interface
 */
export interface CachedAnalysisData {
  data: any;
  pagination: PaginationMeta;
  timestamp: Date;
  libraryId: string;
  limit: number;
}