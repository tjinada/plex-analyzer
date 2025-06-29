import axios, { AxiosInstance } from 'axios';
import { API_TIMEOUTS } from '../config/constants';
import { ApiError } from '../models';

export interface TautulliLibraryStats {
  sectionId: string;
  sectionName: string;
  count: number;
  totalFileSize: number;
  totalDuration: number;
}

export interface TautulliWatchHistory {
  id: number;
  date: number;
  started: number;
  stopped: number;
  duration: number;
  pausedCounter: number;
  userId: number;
  userName: string;
  title: string;
  year: number;
  mediaType: string;
  ratingKey: string;
  parentRatingKey: string;
  grandparentRatingKey: string;
}

export class TautulliService {
  private client: AxiosInstance | null = null;
  private isConfigured = false;

  /**
   * Configure the Tautulli service with server URL and API key
   */
  configure(serverUrl: string, apiKey: string): void {
    console.log('[TautulliService] Configuring with:', {
      serverUrl,
      apiKeyLength: apiKey?.length || 0,
      apiKeyPreview: apiKey ? `${apiKey.substring(0, 4)}...` : 'none'
    });
    
    this.client = axios.create({
      baseURL: serverUrl,
      timeout: API_TIMEOUTS.TAUTULLI,
      params: {
        apikey: apiKey,
      },
    });
    this.isConfigured = true;
    
    console.log('[TautulliService] Configuration complete');
  }

  /**
   * Test connection to Tautulli server
   */
  async testConnection(): Promise<boolean> {
    console.log('[TautulliService] Starting connection test...');
    
    if (!this.isConfigured || !this.client) {
      console.error('[TautulliService] Service not configured');
      throw new Error('Tautulli service not configured');
    }

    try {
      console.log('[TautulliService] Attempting to get server info from /api/v2');
      console.log('[TautulliService] Using base URL:', this.client.defaults.baseURL);
      console.log('[TautulliService] API key present:', !!this.client.defaults.params?.apikey);
      
      const response = await this.client.get('/api/v2', {
        params: { cmd: 'get_server_info' },
      });
      
      console.log('[TautulliService] Response status:', response.status);
      console.log('[TautulliService] Response result:', response.data?.response?.result);
      console.log('[TautulliService] Response data:', JSON.stringify(response.data, null, 2));
      
      const success = response.data?.response?.result === 'success';
      console.log('[TautulliService] Connection test result:', success);
      
      return success;
    } catch (error: any) {
      console.error('[TautulliService] Connection test error:', {
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
   * Get libraries with enhanced statistics from Tautulli
   */
  async getLibraries(): Promise<TautulliLibraryStats[]> {
    if (!this.isConfigured || !this.client) {
      throw this.createError('Tautulli service not configured', 500);
    }

    try {
      const response = await this.client.get('/api/v2', {
        params: { cmd: 'get_libraries' },
      });

      if (response.data?.response?.result !== 'success') {
        throw this.createError('Failed to fetch libraries from Tautulli', 500);
      }

      const libraries = response.data.response.data || [];
      return libraries.map((lib: any) => ({
        sectionId: lib.section_id,
        sectionName: lib.section_name,
        count: parseInt(lib.count, 10) || 0,
        totalFileSize: parseInt(lib.total_file_size, 10) || 0,
        totalDuration: parseInt(lib.total_duration, 10) || 0,
      }));
    } catch (error) {
      console.error('Failed to fetch libraries from Tautulli:', error);
      throw this.createError('Failed to fetch libraries', 500);
    }
  }

  /**
   * Get watch history for a specific time period
   */
  async getHistory(days = 30, limit = 100): Promise<TautulliWatchHistory[]> {
    if (!this.isConfigured || !this.client) {
      throw this.createError('Tautulli service not configured', 500);
    }

    try {
      const response = await this.client.get('/api/v2', {
        params: {
          cmd: 'get_history',
          length: limit,
          after: Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60),
        },
      });

      if (response.data?.response?.result !== 'success') {
        throw this.createError('Failed to fetch history from Tautulli', 500);
      }

      const history = response.data.response.data?.data || [];
      return history.map((item: any) => ({
        id: item.id,
        date: item.date,
        started: item.started,
        stopped: item.stopped,
        duration: item.duration,
        pausedCounter: item.paused_counter,
        userId: item.user_id,
        userName: item.user,
        title: item.full_title || item.title,
        year: item.year,
        mediaType: item.media_type,
        ratingKey: item.rating_key,
        parentRatingKey: item.parent_rating_key,
        grandparentRatingKey: item.grandparent_rating_key,
      }));
    } catch (error) {
      console.error('Failed to fetch history from Tautulli:', error);
      throw this.createError('Failed to fetch history', 500);
    }
  }

  /**
   * Get detailed metadata for a specific item
   */
  async getMetadata(ratingKey: string): Promise<any> {
    if (!this.isConfigured || !this.client) {
      throw this.createError('Tautulli service not configured', 500);
    }

    try {
      const response = await this.client.get('/api/v2', {
        params: {
          cmd: 'get_metadata',
          rating_key: ratingKey,
        },
      });

      if (response.data?.response?.result !== 'success') {
        return null;
      }

      return response.data.response.data;
    } catch (error) {
      console.error(`Failed to fetch metadata for ${ratingKey}:`, error);
      throw this.createError('Failed to fetch metadata', 500);
    }
  }

  /**
   * Get server information
   */
  async getServerInfo(): Promise<any> {
    if (!this.isConfigured || !this.client) {
      throw this.createError('Tautulli service not configured', 500);
    }

    try {
      const response = await this.client.get('/api/v2', {
        params: { cmd: 'get_server_info' },
      });

      if (response.data?.response?.result !== 'success') {
        throw this.createError('Failed to fetch server info', 500);
      }

      return response.data.response.data;
    } catch (error) {
      console.error('Failed to fetch server info from Tautulli:', error);
      throw this.createError('Failed to fetch server info', 500);
    }
  }

  /**
   * Get detailed media information for a library including file sizes
   */
  async getLibraryMediaInfo(sectionId: string, options: {
    orderColumn?: string;
    orderDir?: 'asc' | 'desc';
    start?: number;
    length?: number;
    search?: string;
  } = {}): Promise<any> {
    if (!this.isConfigured || !this.client) {
      throw this.createError('Tautulli service not configured', 500);
    }

    try {
      const response = await this.client.get('/api/v2', {
        params: {
          cmd: 'get_library_media_info',
          section_id: sectionId,
          order_column: options.orderColumn || 'file_size',
          order_dir: options.orderDir || 'desc',
          start: options.start || 0,
          length: options.length || 1000,
          search: options.search || '',
        },
      });

      if (response.data?.response?.result !== 'success') {
        throw this.createError('Failed to fetch library media info from Tautulli', 500);
      }

      return response.data.response.data;
    } catch (error) {
      console.error('Failed to fetch library media info from Tautulli:', error);
      throw this.createError('Failed to fetch library media info', 500);
    }
  }

  /**
   * Get aggregated media statistics for a library
   */
  async getLibraryMediaStats(sectionId: string): Promise<any> {
    if (!this.isConfigured || !this.client) {
      throw this.createError('Tautulli service not configured', 500);
    }

    try {
      const response = await this.client.get('/api/v2', {
        params: {
          cmd: 'get_library_media_stats',
          section_id: sectionId,
        },
      });

      if (response.data?.response?.result !== 'success') {
        throw this.createError('Failed to fetch library media stats from Tautulli', 500);
      }

      return response.data.response.data;
    } catch (error) {
      console.error('Failed to fetch library media stats from Tautulli:', error);
      throw this.createError('Failed to fetch library media stats', 500);
    }
  }

  /**
   * Get enhanced libraries table with detailed statistics
   */
  async getLibrariesTable(options: {
    orderColumn?: string;
    orderDir?: 'asc' | 'desc';
  } = {}): Promise<any> {
    if (!this.isConfigured || !this.client) {
      throw this.createError('Tautulli service not configured', 500);
    }

    try {
      const response = await this.client.get('/api/v2', {
        params: {
          cmd: 'get_libraries_table',
          order_column: options.orderColumn || 'section_name',
          order_dir: options.orderDir || 'asc',
        },
      });

      if (response.data?.response?.result !== 'success') {
        throw this.createError('Failed to fetch libraries table from Tautulli', 500);
      }

      return response.data.response.data;
    } catch (error) {
      console.error('Failed to fetch libraries table from Tautulli:', error);
      throw this.createError('Failed to fetch libraries table', 500);
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
export const tautulliService = new TautulliService();