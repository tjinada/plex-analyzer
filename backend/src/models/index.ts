// Configuration Models
export interface ServiceConfig {
  url: string;
  apiKey?: string;
  token?: string;
  enabled?: boolean;
}

export interface AppConfig {
  plex: ServiceConfig;
  tautulli?: ServiceConfig;
  radarr?: ServiceConfig;
  sonarr?: ServiceConfig;
}

// Library Models
export interface Library {
  id: string;
  title: string;
  type: string;
  agent: string;
  scanner: string;
  language: string;
  uuid: string;
  createdAt: Date;
  updatedAt: Date;
  itemCount: number;
  totalSize: number;
}

// Media Item Models
export interface MediaItem {
  id: string;
  title: string;
  year?: number;
  rating?: number;
  summary?: string;
  duration?: number;
  addedAt: Date;
  updatedAt: Date;
  libraryId: string;
  files: MediaFile[];
}

export interface MediaFile {
  id: string;
  path: string;
  size: number;
  container: string;
  bitrate?: number;
  resolution?: string;
  videoCodec?: string;
  audioCodec?: string;
  audioChannels?: number;
}

// Statistics Models
export interface LibraryStats {
  libraryId: string;
  totalItems: number;
  totalSize: number;
  averageFileSize: number;
  largestFile: MediaFile;
  qualityDistribution: QualityDistribution;
  formatDistribution: FormatDistribution;
  sizeDistribution: SizeDistribution;
}

export interface QualityDistribution {
  [resolution: string]: {
    count: number;
    size: number;
    percentage: number;
  };
}

export interface FormatDistribution {
  [format: string]: {
    count: number;
    size: number;
    percentage: number;
  };
}

export interface SizeDistribution {
  [range: string]: {
    count: number;
    size: number;
    percentage: number;
  };
}

export interface GlobalStats {
  totalLibraries: number;
  totalItems: number;
  totalSize: number;
  averageFileSize: number;
  libraryBreakdown: Array<{
    libraryId: string;
    title: string;
    type: string;
    itemCount: number;
    size: number;
    percentage: number;
  }>;
}

// Pagination Models
export interface PaginationMeta {
  offset: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

// API Response Models
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginatedApiResponse<T = any> extends ApiResponse {
  data: T;
  pagination: PaginationMeta;
}

// Error Models
export interface ApiError extends Error {
  statusCode: number;
  code?: string;
  details?: any;
}