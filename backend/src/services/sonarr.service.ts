import axios, { AxiosInstance } from 'axios';
import { API_TIMEOUTS } from '../config/constants';
import { ApiError } from '../models';

export interface SonarrSeries {
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
  network: string;
  airTime: string;
  images: Array<{
    coverType: string;
    url: string;
  }>;
  seasons: SonarrSeason[];
  year: number;
  path: string;
  qualityProfileId: number;
  languageProfileId: number;
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
  statistics: {
    seasonCount: number;
    episodeFileCount: number;
    episodeCount: number;
    totalEpisodeCount: number;
    sizeOnDisk: number;
    percentOfEpisodes: number;
  };
}

export interface SonarrSeason {
  seasonNumber: number;
  monitored: boolean;
  statistics: {
    previousAiring: string;
    episodeFileCount: number;
    episodeCount: number;
    totalEpisodeCount: number;
    sizeOnDisk: number;
    percentOfEpisodes: number;
  };
}

export interface SonarrEpisode {
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
}

export interface SonarrEpisodeFile {
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
    width: number;
    height: number;
    audioFormat: string;
    audioCodecID: string;
    audioCodecLibrary: string;
    audioBitrate: number;
    runTime: string;
    audioStreamCount: number;
    audioChannels: number;
    audioLanguages: string[];
    subtitles: string[];
  };
  id: number;
}

export interface SonarrQualityProfile {
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

export class SonarrService {
  private client: AxiosInstance | null = null;
  private isConfigured = false;

  /**
   * Configure the Sonarr service with server URL and API key
   */
  configure(serverUrl: string, apiKey: string): void {
    console.log('[SonarrService] Configuring with:', {
      serverUrl,
      apiKeyLength: apiKey?.length || 0,
      apiKeyPreview: apiKey ? `${apiKey.substring(0, 4)}...` : 'none'
    });
    
    this.client = axios.create({
      baseURL: `${serverUrl}/api/v3`,
      timeout: API_TIMEOUTS.SONARR,
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });
    this.isConfigured = true;
    
    console.log('[SonarrService] Configuration complete');
  }

  /**
   * Test connection to Sonarr server
   */
  async testConnection(): Promise<boolean> {
    console.log('[SonarrService] Starting connection test...');
    
    if (!this.isConfigured || !this.client) {
      console.error('[SonarrService] Service not configured');
      throw new Error('Sonarr service not configured');
    }

    try {
      console.log('[SonarrService] Attempting to get system status from /system/status');
      console.log('[SonarrService] Using base URL:', this.client.defaults.baseURL);
      console.log('[SonarrService] API key present:', !!this.client.defaults.headers['X-Api-Key']);
      
      const response = await this.client.get('/system/status');
      
      console.log('[SonarrService] Response status:', response.status);
      console.log('[SonarrService] Response data:', JSON.stringify(response.data, null, 2));
      
      const success = response.status === 200;
      console.log('[SonarrService] Connection test result:', success);
      
      return success;
    } catch (error: any) {
      console.error('[SonarrService] Connection test error:', {
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
   * Get all series from Sonarr
   */
  async getSeries(): Promise<SonarrSeries[]> {
    if (!this.isConfigured || !this.client) {
      throw this.createError('Sonarr service not configured', 500);
    }

    try {
      const response = await this.client.get('/series');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch series from Sonarr:', error);
      throw this.createError('Failed to fetch series', 500);
    }
  }

  /**
   * Get episodes for a specific series
   */
  async getEpisodes(seriesId: number): Promise<SonarrEpisode[]> {
    if (!this.isConfigured || !this.client) {
      throw this.createError('Sonarr service not configured', 500);
    }

    try {
      const response = await this.client.get('/episode', {
        params: { seriesId },
      });
      return response.data || [];
    } catch (error) {
      console.error(`Failed to fetch episodes for series ${seriesId}:`, error);
      throw this.createError('Failed to fetch episodes', 500);
    }
  }

  /**
   * Get all episode files from Sonarr
   */
  async getEpisodeFiles(): Promise<SonarrEpisodeFile[]> {
    if (!this.isConfigured || !this.client) {
      throw this.createError('Sonarr service not configured', 500);
    }

    try {
      const response = await this.client.get('/episodefile');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch episode files from Sonarr:', error);
      throw this.createError('Failed to fetch episode files', 500);
    }
  }

  /**
   * Get quality profiles from Sonarr
   */
  async getQualityProfiles(): Promise<SonarrQualityProfile[]> {
    if (!this.isConfigured || !this.client) {
      throw this.createError('Sonarr service not configured', 500);
    }

    try {
      const response = await this.client.get('/qualityprofile');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch quality profiles from Sonarr:', error);
      throw this.createError('Failed to fetch quality profiles', 500);
    }
  }

  /**
   * Get system status from Sonarr
   */
  async getSystemStatus(): Promise<any> {
    if (!this.isConfigured || !this.client) {
      throw this.createError('Sonarr service not configured', 500);
    }

    try {
      const response = await this.client.get('/system/status');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch system status from Sonarr:', error);
      throw this.createError('Failed to fetch system status', 500);
    }
  }

  /**
   * Get series by ID
   */
  async getSeriesById(seriesId: number): Promise<SonarrSeries | null> {
    if (!this.isConfigured || !this.client) {
      throw this.createError('Sonarr service not configured', 500);
    }

    try {
      const response = await this.client.get(`/series/${seriesId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      console.error(`Failed to fetch series ${seriesId} from Sonarr:`, error);
      throw this.createError('Failed to fetch series', 500);
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
export const sonarrService = new SonarrService();