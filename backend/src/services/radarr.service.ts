import axios, { AxiosInstance } from 'axios';
import { API_TIMEOUTS } from '../config/constants';
import { ApiError } from '../models';

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