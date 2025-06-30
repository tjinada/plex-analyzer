/**
 * TypeScript models for Radarr and Sonarr frontend integration
 * These models match the backend data structures for consistency
 */

export interface QualityProfile {
  id: number;
  name: string;
}

export interface QualityInfo {
  quality: {
    id: number;
    name: string;
    source: string;
    resolution: number;
  };
  revision: {
    version: number;
    real: number;
  };
}

export interface Movie {
  id: number;
  title: string;
  originalTitle: string;
  year: number;
  path: string;
  qualityProfileId: number;
  hasFile: boolean;
  monitored: boolean;
  runtime: number;
  cleanTitle: string;
  imdbId: string;
  tmdbId: number;
  titleSlug: string;
  genres: string[];
  tags: number[];
  added: string;
  status: string;
  overview: string;
  inCinemas: string;
  physicalRelease: string;
  digitalRelease: string;
  isAvailable: boolean;
  minimumAvailability: string;
  sizeOnDisk: number;
  movieFile?: MovieFile;
}

export interface MovieFile {
  id: number;
  movieId: number;
  relativePath: string;
  path: string;
  size: number;
  dateAdded: string;
  quality: QualityInfo;
}

export interface Series {
  id: number;
  title: string;
  alternateTitles: Array<{
    title: string;
    seasonNumber: number;
  }>;
  sortTitle: string;
  seasonCount: number;
  totalEpisodeCount: number;
  episodeCount: number;
  episodeFileCount: number;
  sizeOnDisk: number;
  status: string;
  overview: string;
  previousAiring: string;
  nextAiring: string;
  network: string;
  airTime: string;
  seasons: Season[];
  year: number;
  path: string;
  qualityProfileId: number;
  monitored: boolean;
  runtime: number;
  tvdbId: number;
  imdbId: string;
  titleSlug: string;
  genres: string[];
  tags: number[];
  added: string;
}

export interface Season {
  seasonNumber: number;
  monitored: boolean;
  statistics: {
    episodeFileCount: number;
    episodeCount: number;
    totalEpisodeCount: number;
    sizeOnDisk: number;
    percentOfEpisodes: number;
  };
}

export interface Episode {
  seriesId: number;
  episodeFileId: number;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  airDate: string;
  airDateUtc: string;
  overview: string;
  hasFile: boolean;
  monitored: boolean;
  absoluteEpisodeNumber: number;
  id: number;
  series: Series;
}

export interface QueueItem {
  id: number;
  seriesId?: number;
  movieId?: number;
  episodeId?: number;
  language: {
    id: number;
    name: string;
  };
  quality: QualityInfo;
  size: number;
  title: string;
  sizeleft: number;
  timeleft: string;
  estimatedCompletionTime: string;
  status: string;
  trackedDownloadStatus: string;
  trackedDownloadState: string;
  statusMessages: Array<{
    title: string;
    messages: string[];
  }>;
  errorMessage: string;
  downloadId: string;
  protocol: string;
  downloadClient: string;
  indexer: string;
  outputPath: string;
  downloadForced: boolean;
  sourceService?: 'radarr' | 'sonarr'; // Added by content manager
}

// Type aliases for clarity
export type WantedMovie = Movie;
export type MissingMovie = Movie;
export type WantedEpisode = Episode;
export type MissingEpisode = Episode;

// Summary interfaces for dashboard cards
export interface ContentSummary {
  wanted: {
    movies: number;
    episodes: number;
  };
  missing: {
    movies: number;
    episodes: number;
  };
  queue: {
    totalItems: number;
    totalSize: number;
    downloading: number;
    completed: number;
    failed: number;
  };
}

export interface QueueSummary {
  totalItems: number;
  totalSize: number;
  totalSizeLeft: number;
  downloading: number;
  completed: number;
  failed: number;
  paused: number;
  items: QueueItem[];
}

// Filter interfaces
export interface MovieFilters {
  monitored?: boolean;
  hasFile?: boolean;
  qualityProfileId?: number;
  minimumAvailability?: string;
  year?: number;
  genres?: string[];
  sortBy?: 'title' | 'year' | 'added' | 'inCinemas' | 'physicalRelease';
  sortDirection?: 'asc' | 'desc';
}

export interface EpisodeFilters {
  seriesId?: number;
  seasonNumber?: number;
  monitored?: boolean;
  hasFile?: boolean;
  airDateCutoff?: string;
  sortBy?: 'airDate' | 'series' | 'season' | 'episode';
  sortDirection?: 'asc' | 'desc';
}

export interface QueueFilters {
  status?: string;
  protocol?: string;
  downloadClient?: string;
  includeUnknownSeriesItems?: boolean;
  includeUnknownMovieItems?: boolean;
}

// Service status interface
export interface ServicesStatus {
  radarr: {
    configured: boolean;
    connected: boolean;
    error?: string;
  };
  sonarr: {
    configured: boolean;
    connected: boolean;
    error?: string;
  };
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface MovieListResponse {
  movies: Movie[];
  count: number;
  filters?: MovieFilters;
}

export interface EpisodeListResponse {
  episodes: Episode[];
  count: number;
  filters?: EpisodeFilters;
  seriesId?: number;
}

export interface QueueResponse {
  queue: QueueItem[];
  count: number;
  filters?: QueueFilters;
}

export interface QualityProfileResponse {
  profiles: QualityProfile[];
  count: number;
}

export interface SearchResponse {
  success: boolean;
  message: string;
  movieId?: number;
  seriesId?: number;
  episodeIds?: number[];
}

export interface QueueActionResponse {
  success: boolean;
  message: string;
  queueId: number;
}

export interface ConnectionTestResponse {
  connected: boolean;
  message: string;
}

// Enums for better type safety
export enum QueueStatus {
  DOWNLOADING = 'downloading',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused',
  QUEUED = 'queued'
}

export enum Protocol {
  TORRENT = 'torrent',
  USENET = 'usenet'
}

export enum MinimumAvailability {
  ANNOUNCED = 'announced',
  IN_CINEMAS = 'inCinemas',
  RELEASED = 'released',
  PRE_DB = 'preDB'
}

export enum SeriesStatus {
  CONTINUING = 'continuing',
  ENDED = 'ended',
  UPCOMING = 'upcoming'
}