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

export interface ConfigStatus {
  isConfigured: boolean;
  services: {
    [key: string]: {
      configured: boolean;
      enabled?: boolean;
      url?: string;
    };
  };
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

// Statistics Models
export interface LibraryStats {
  libraryId: string;
  totalItems: number;
  totalSize: number;
  averageFileSize: number;
  largestFile: {
    title?: string;
    size: number;
    path?: string;
  };
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