import axios, { AxiosInstance } from 'axios';
import { API_TIMEOUTS } from '../config/constants';
import { ApiError } from '../models';
import { WantedMovie, MissingMovie, QueueItem, MovieFilters, QueueFilters } from '../models/arr-models';

export interface RadarrMovie {
  id: number;
  title: string;
  originalTitle: string;
  year: number;
  path: string;
  qualityProfileId: number;
  hasFile: boolean;
  monitored: boolean;
  runtime: number;
  lastInfoSync: string;
  cleanTitle: string;
  imdbId: string;
  tmdbId: number;
  titleSlug: string;
  genres: string[];
  tags: number[];
  added: string;
  movieFile?: RadarrMovieFile;
}

export interface RadarrMovieFile {
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
      isRepack: boolean;
    };
  };
  mediaInfo: {
    containerFormat: string;
    videoFormat: string;
    videoCodecID: string;
    videoProfile: string;
    videoCodecLibrary: string;
    videoBitrate: number;
    videoBitDepth: number;
    videoMultiViewCount: number;
    videoColourPrimaries: string;
    videoTransferCharacteristics: string;
    width: number;
    height: number;
    audioFormat: string;
    audioCodecID: string;
    audioCodecLibrary: string;
    audioAdditionalFeatures: string;
    audioBitrate: number;
    runTime: string;
    audioStreamCount: number;
    audioChannels: number;
    audioChannelPositions: string;
    audioChannelPositionsText: string;
    audioLanguages: string[];
    subtitles: string[];
  };
}

export interface RadarrQualityProfile {
  id: number;
  name: string;
  cutoff: {
    id: number;
    name: string;
    source: string;
    resolution: number;
  };
  items: Array<{
    quality: {
      id: number;
      name: string;
      source: string;
      resolution: number;
    };
    allowed: boolean;
  }>;
}

export class RadarrService {
  private client: AxiosInstance | null = null;
  private isConfigured = false;

  /**
   * Configure the Radarr service with server URL and API key
   */
  configure(serverUrl: string, apiKey: string): void {
    console.log('[RadarrService] Configuring with:', {
      serverUrl,
      apiKeyLength: apiKey?.length || 0,
      apiKeyPreview: apiKey ? `${apiKey.substring(0, 4)}...` : 'none'
    });
    
    this.client = axios.create({
      baseURL: `${serverUrl}/api/v3`,
      timeout: API_TIMEOUTS.RADARR,
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });
    this.isConfigured = true;
    
    console.log('[RadarrService] Configuration complete');
  }

  /**
   * Test connection to Radarr server
   */
  async testConnection(): Promise<boolean> {
    console.log('[RadarrService] Starting connection test...');
    
    if (!this.isConfigured || !this.client) {
      console.error('[RadarrService] Service not configured');
      throw new Error('Radarr service not configured');
    }

    try {
      console.log('[RadarrService] Attempting to get system status from /system/status');
      console.log('[RadarrService] Using base URL:', this.client.defaults.baseURL);
      console.log('[RadarrService] API key present:', !!this.client.defaults.headers['X-Api-Key']);
      
      const response = await this.client.get('/system/status');
      
      console.log('[RadarrService] Response status:', response.status);
      console.log('[RadarrService] Response data:', JSON.stringify(response.data, null, 2));
      
      const success = response.status === 200;
      console.log('[RadarrService] Connection test result:', success);
      
      return success;
    } catch (error: any) {
      console.error('[RadarrService] Connection test error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code
      });
      return false;
    }
  }

  /**
   * Get all movies from Radarr
   */
  async getMovies(): Promise<RadarrMovie[]> {
    if (!this.isConfigured || !this.client) {
      throw this.createError('Radarr service not configured', 500);
    }

    try {
      const response = await this.client.get('/movie');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch movies from Radarr:', error);
      throw this.createError('Failed to fetch movies', 500);
    }
  }

  /**
   * Get all movie files from Radarr
   */
  async getMovieFiles(): Promise<RadarrMovieFile[]> {
    if (!this.isConfigured || !this.client) {
      throw this.createError('Radarr service not configured', 500);
    }

    try {
      const response = await this.client.get('/moviefile');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch movie files from Radarr:', error);
      throw this.createError('Failed to fetch movie files', 500);
    }
  }

  /**
   * Get quality profiles from Radarr
   */
  async getQualityProfiles(): Promise<RadarrQualityProfile[]> {
    if (!this.isConfigured || !this.client) {
      throw this.createError('Radarr service not configured', 500);
    }

    try {
      const response = await this.client.get('/qualityprofile');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch quality profiles from Radarr:', error);
      throw this.createError('Failed to fetch quality profiles', 500);
    }
  }

  /**
   * Get system status from Radarr
   */
  async getSystemStatus(): Promise<any> {
    if (!this.isConfigured || !this.client) {
      throw this.createError('Radarr service not configured', 500);
    }

    try {
      const response = await this.client.get('/system/status');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch system status from Radarr:', error);
      throw this.createError('Failed to fetch system status', 500);
    }
  }

  /**
   * Get movie by ID
   */
  async getMovie(movieId: number): Promise<RadarrMovie | null> {
    if (!this.isConfigured || !this.client) {
      throw this.createError('Radarr service not configured', 500);
    }

    try {
      const response = await this.client.get(`/movie/${movieId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      console.error(`Failed to fetch movie ${movieId} from Radarr:`, error);
      throw this.createError('Failed to fetch movie', 500);
    }
  }

  /**
   * Get wanted movies (monitored movies without files)
   */
  async getWantedMovies(filters?: MovieFilters): Promise<WantedMovie[]> {
    if (!this.isConfigured || !this.client) {
      throw this.createError('Radarr service not configured', 500);
    }

    try {
      // Build query parameters
      const params: any = {};
      
      if (filters?.monitored !== undefined) {
        params.monitored = filters.monitored;
      }
      if (filters?.qualityProfileId) {
        params.qualityProfileId = filters.qualityProfileId;
      }
      if (filters?.minimumAvailability) {
        params.minimumAvailability = filters.minimumAvailability;
      }
      if (filters?.sortBy) {
        params.sortKey = filters.sortBy;
        params.sortDirection = filters.sortDirection || 'asc';
      }

      const response = await this.client.get('/wanted/missing', { params });
      
      // Filter client-side for additional criteria
      let movies = response.data.records || response.data || [];
      
      if (filters?.hasFile !== undefined) {
        movies = movies.filter((movie: any) => movie.hasFile === filters.hasFile);
      }
      
      if (filters?.year) {
        movies = movies.filter((movie: any) => movie.year === filters.year);
      }
      
      if (filters?.genres && filters.genres.length > 0) {
        movies = movies.filter((movie: any) => 
          movie.genres && movie.genres.some((genre: string) => filters.genres!.includes(genre))
        );
      }

      return movies;
    } catch (error) {
      console.error('Failed to fetch wanted movies from Radarr:', error);
      throw this.createError('Failed to fetch wanted movies', 500);
    }
  }

  /**
   * Get missing movies (monitored movies that are available but not downloaded)
   */
  async getMissingMovies(filters?: MovieFilters): Promise<MissingMovie[]> {
    if (!this.isConfigured || !this.client) {
      throw this.createError('Radarr service not configured', 500);
    }

    try {
      const params: any = {};
      
      if (filters?.sortBy) {
        params.sortKey = filters.sortBy;
        params.sortDirection = filters.sortDirection || 'asc';
      }

      const response = await this.client.get('/wanted/missing', { params });
      
      // Filter for missing movies (available but not downloaded)
      let movies = response.data.records || response.data || [];
      movies = movies.filter((movie: any) => movie.isAvailable && !movie.hasFile);
      
      // Apply additional filters
      if (filters?.monitored !== undefined) {
        movies = movies.filter((movie: any) => movie.monitored === filters.monitored);
      }
      
      if (filters?.qualityProfileId) {
        movies = movies.filter((movie: any) => movie.qualityProfileId === filters.qualityProfileId);
      }
      
      if (filters?.year) {
        movies = movies.filter((movie: any) => movie.year === filters.year);
      }

      return movies;
    } catch (error) {
      console.error('Failed to fetch missing movies from Radarr:', error);
      throw this.createError('Failed to fetch missing movies', 500);
    }
  }

  /**
   * Get download queue from Radarr
   */
  async getQueue(filters?: QueueFilters): Promise<QueueItem[]> {
    if (!this.isConfigured || !this.client) {
      throw this.createError('Radarr service not configured', 500);
    }

    try {
      const params: any = {};
      
      if (filters?.includeUnknownMovieItems !== undefined) {
        params.includeUnknownMovieItems = filters.includeUnknownMovieItems;
      }

      const response = await this.client.get('/queue', { params });
      
      let queueItems = response.data.records || response.data || [];
      
      // Apply filters
      if (filters?.status) {
        queueItems = queueItems.filter((item: any) => item.status === filters.status);
      }
      
      if (filters?.protocol) {
        queueItems = queueItems.filter((item: any) => item.protocol === filters.protocol);
      }
      
      if (filters?.downloadClient) {
        queueItems = queueItems.filter((item: any) => item.downloadClient === filters.downloadClient);
      }

      return queueItems;
    } catch (error) {
      console.error('Failed to fetch queue from Radarr:', error);
      throw this.createError('Failed to fetch queue', 500);
    }
  }

  /**
   * Trigger manual search for a movie
   */
  async searchMovie(movieId: number): Promise<boolean> {
    if (!this.isConfigured || !this.client) {
      throw this.createError('Radarr service not configured', 500);
    }

    try {
      await this.client.post('/command', {
        name: 'MoviesSearch',
        movieIds: [movieId]
      });
      return true;
    } catch (error) {
      console.error(`Failed to trigger search for movie ${movieId}:`, error);
      throw this.createError('Failed to trigger movie search', 500);
    }
  }

  /**
   * Remove item from queue
   */
  async removeFromQueue(queueId: number, removeFromClient: boolean = false, blacklist: boolean = false): Promise<boolean> {
    if (!this.isConfigured || !this.client) {
      throw this.createError('Radarr service not configured', 500);
    }

    try {
      const params = {
        removeFromClient: removeFromClient.toString(),
        blacklist: blacklist.toString()
      };

      await this.client.delete(`/queue/${queueId}`, { params });
      return true;
    } catch (error) {
      console.error(`Failed to remove queue item ${queueId}:`, error);
      throw this.createError('Failed to remove queue item', 500);
    }
  }

  /**
   * Get queue summary statistics
   */
  async getQueueSummary(): Promise<{
    totalItems: number;
    totalSize: number;
    totalSizeLeft: number;
    downloading: number;
    completed: number;
    failed: number;
    paused: number;
  }> {
    const queue = await this.getQueue();
    
    const summary = {
      totalItems: queue.length,
      totalSize: queue.reduce((sum, item) => sum + (item.size || 0), 0),
      totalSizeLeft: queue.reduce((sum, item) => sum + (item.sizeleft || 0), 0),
      downloading: queue.filter(item => item.status === 'downloading').length,
      completed: queue.filter(item => item.status === 'completed').length,
      failed: queue.filter(item => item.status === 'failed').length,
      paused: queue.filter(item => item.status === 'paused').length
    };

    return summary;
  }

  /**
   * Check if service is configured
   */
  isReady(): boolean {
    return this.isConfigured && this.client !== null;
  }

  /**
   * Create standardized error
   */
  private createError(message: string, statusCode: number): ApiError {
    const error = new Error(message) as ApiError;
    error.statusCode = statusCode;
    return error;
  }
}

// Export singleton instance
export const radarrService = new RadarrService();