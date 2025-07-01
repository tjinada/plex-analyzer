/**
 * Data models for Radarr and Sonarr integration
 */

export interface QualityProfile {
  id: number;
  name: string;
}

export interface MovieFile {
  id: number;
  movieId: number;
  relativePath: string;
  path: string;
  size: number;
  dateAdded: string;
  quality: {
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
  };
}

export interface Movie {
  id: number;
  title: string;
  originalTitle: string;
  alternateTitles: Array<{
    sourceType: string;
    movieId: number;
    title: string;
    sourceId: number;
    votes: number;
    voteCount: number;
    language: string;
    id: number;
  }>;
  sortTitle: string;
  sizeOnDisk: number;
  status: string;
  overview: string;
  inCinemas: string;
  physicalRelease: string;
  digitalRelease: string;
  images: Array<{
    coverType: string;
    url: string;
  }>;
  website: string;
  year: number;
  hasFile: boolean;
  youTubeTrailerId: string;
  studio: string;
  path: string;
  rootFolderPath: string;
  qualityProfileId: number;
  monitored: boolean;
  minimumAvailability: string;
  isAvailable: boolean;
  folderName: string;
  runtime: number;
  cleanTitle: string;
  imdbId: string;
  tmdbId: number;
  titleSlug: string;
  certification: string;
  genres: string[];
  tags: number[];
  added: string;
  ratings: {
    votes: number;
    value: number;
    type: string;
  };
  movieFile?: MovieFile;
  collection?: {
    name: string;
    tmdbId: number;
    images: Array<{
      coverType: string;
      url: string;
    }>;
  };
}

export interface WantedMovie extends Movie {
  // Wanted movies are essentially regular movies that are monitored but don't have files
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
  images: Array<{
    coverType: string;
    url: string;
  }>;
  seasons: Season[];
  year: number;
  path: string;
  rootFolderPath: string;
  qualityProfileId: number;
  seasonFolder: boolean;
  monitored: boolean;
  useSceneNumbering: boolean;
  runtime: number;
  tvdbId: number;
  tvRageId: number;
  tvMazeId: number;
  firstAired: string;
  lastInfoSync: string;
  seriesType: string;
  cleanTitle: string;
  imdbId: string;
  titleSlug: string;
  certification: string;
  genres: string[];
  tags: number[];
  added: string;
  ratings: {
    votes: number;
    value: number;
    type: string;
  };
  languageProfileId: number;
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
  unverifiedSceneNumbering: boolean;
  id: number;
  series: Series;
}

export interface WantedEpisode extends Episode {
  // Wanted episodes are episodes that are monitored but don't have files
}

export interface EpisodeFile {
  seriesId: number;
  seasonNumber: number;
  relativePath: string;
  path: string;
  size: number;
  dateAdded: string;
  quality: {
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
  };
  language: {
    id: number;
    name: string;
  };
  mediaInfo: {
    audioBitrate: number;
    audioChannels: number;
    audioCodec: string;
    audioLanguages: string;
    audioStreamCount: number;
    videoBitDepth: number;
    videoBitrate: number;
    videoCodec: string;
    videoFps: number;
    resolution: string;
    runTime: string;
    scanType: string;
    subtitles: string;
  };
  originalFilePath: string;
  sceneName: string;
  releaseGroup: string;
  id: number;
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
  quality: {
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
  };
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
}

export interface MissingMovie extends Movie {
  // Missing movies have specific fields for tracking availability
  physicalReleaseNote?: string;
  digitalReleaseNote?: string;
}

export interface MissingEpisode extends Episode {
  // Missing episodes with additional tracking info
  unverifiedSceneNumbering: boolean;
}

// Summary interfaces for dashboard
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