import axios, { AxiosInstance } from 'axios';
import { API_TIMEOUTS } from '../config/constants';
import { Library, MediaItem, ApiError } from '../models';

export class PlexService {
  private client: AxiosInstance | null = null;
  private isConfigured = false;

  /**
   * Configure the Plex service with server URL and token
   */
  configure(serverUrl: string, token: string): void {
    console.log('[PlexService] Configuring with:', {
      serverUrl,
      tokenLength: token?.length || 0,
      tokenPreview: token ? `${token.substring(0, 4)}...` : 'none'
    });
    
    this.client = axios.create({
      baseURL: serverUrl,
      timeout: API_TIMEOUTS.PLEX,
      headers: {
        'X-Plex-Token': token,
        'Accept': 'application/json',
      },
    });
    this.isConfigured = true;
    
    console.log('[PlexService] Configuration complete');
  }

  /**
   * Test connection to Plex server and validate API token
   */
  async testConnection(): Promise<boolean> {
    console.log('[PlexService] Starting connection test...');
    
    if (!this.isConfigured || !this.client) {
      console.error('[PlexService] Service not configured');
      throw new Error('Plex service not configured');
    }

    try {
      console.log('[PlexService] Attempting to fetch libraries from /library/sections');
      console.log('[PlexService] Using base URL:', this.client.defaults.baseURL);
      console.log('[PlexService] Token present:', !!this.client.defaults.headers['X-Plex-Token']);
      
      // Attempt to fetch libraries - this requires valid authentication
      const response = await this.client.get('/library/sections');
      
      console.log('[PlexService] Response status:', response.status);
      console.log('[PlexService] Response data:', JSON.stringify(response.data, null, 2));
      
      const hasLibraries = response.data?.MediaContainer?.Directory !== undefined;
      console.log('[PlexService] Has libraries in response:', hasLibraries);
      
      return response.status === 200 && hasLibraries;
    } catch (error: any) {
      console.error('[PlexService] Connection test error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
      
      if (error.response?.status === 401) {
        console.error('[PlexService] Authentication failed: Invalid token');
      } else {
        console.error('[PlexService] Connection test failed:', error.message);
      }
      return false;
    }
  }

  /**
   * Get all libraries from Plex server
   */
  async getLibraries(): Promise<Library[]> {
    if (!this.isConfigured || !this.client) {
      throw this.createError('Plex service not configured', 500);
    }

    try {
      const response = await this.client.get('/library/sections');
      const sections = response.data?.MediaContainer?.Directory || [];

      return sections.map((section: any) => ({
        id: section.key,
        key: section.key, // Add key property for backward compatibility
        title: section.title,
        type: section.type,
        agent: section.agent,
        scanner: section.scanner,
        language: section.language,
        uuid: section.uuid,
        createdAt: new Date(section.createdAt * 1000),
        updatedAt: new Date(section.updatedAt * 1000),
        itemCount: parseInt(section.count, 10) || 0,
        totalSize: 0, // Will be calculated separately
      }));
    } catch (error) {
      console.error('Failed to fetch libraries from Plex:', error);
      throw this.createError('Failed to fetch libraries', 500);
    }
  }

  /**
   * Get a specific library by ID
   */
  async getLibrary(libraryId: string): Promise<Library | null> {
    if (!this.isConfigured || !this.client) {
      throw this.createError('Plex service not configured', 500);
    }

    try {
      const libraries = await this.getLibraries();
      return libraries.find(lib => (lib as any).key === libraryId) || null;
    } catch (error) {
      console.error(`Failed to fetch library ${libraryId}:`, error);
      throw this.createError('Failed to fetch library', 500);
    }
  }

  /**
   * Get all items from a specific library
   */
  async getLibraryItems(libraryId: string): Promise<MediaItem[]> {
    if (!this.isConfigured || !this.client) {
      throw this.createError('Plex service not configured', 500);
    }

    try {
      // Add includeMedia parameter to ensure we get media information
      const response = await this.client.get(`/library/sections/${libraryId}/all`, {
        params: {
          includeChildren: 1,
          includeMedia: 1,
          includeFile: 1
        }
      });
      const items = response.data?.MediaContainer?.Metadata || [];
      
      console.log(`[PlexService] Retrieved ${items.length} items from library ${libraryId}`);
      
      // For all content types, process normally - don't auto-fetch episodes
      console.log(`[PlexService] Processing ${items[0]?.type || 'unknown'} library normally`);
      return items.map((item: any) => ({
        id: item.ratingKey,
        ratingKey: item.ratingKey, // Add this for analyzer compatibility
        title: item.title,
        type: item.type, // Add type (movie, episode, show, etc.)
        year: item.year,
        rating: item.rating,
        summary: item.summary,
        duration: item.duration,
        addedAt: new Date(item.addedAt * 1000),
        updatedAt: new Date(item.updatedAt * 1000),
        libraryId,
        files: [], // Will be populated by getMediaDetails
        // Include raw media data for analyzer service
        Media: item.Media, // This is the key missing piece!
        Genre: item.Genre // Also include genre data
      }));
    } catch (error) {
      console.error(`Failed to fetch items from library ${libraryId}:`, error);
      throw this.createError('Failed to fetch library items', 500);
    }
  }

  /**
   * Get all items from a specific library with episodes for TV shows (for size analysis)
   */
  async getLibraryItemsWithEpisodes(libraryId: string): Promise<MediaItem[]> {
    if (!this.isConfigured || !this.client) {
      throw this.createError('Plex service not configured', 500);
    }

    try {
      // Add includeMedia parameter to ensure we get media information
      const response = await this.client.get(`/library/sections/${libraryId}/all`, {
        params: {
          includeChildren: 1,
          includeMedia: 1,
          includeFile: 1
        }
      });
      const items = response.data?.MediaContainer?.Metadata || [];
      
      console.log(`[PlexService] Retrieved ${items.length} items from library ${libraryId}`);
      
      // Check if this is a TV show library by looking at the first item
      const isShowLibrary = items.length > 0 && items[0].type === 'show';
      
      if (isShowLibrary) {
        console.log(`[PlexService] Detected TV show library, getting episodes for size analysis...`);
        return await this.getEpisodesFromShows(items, libraryId);
      }
      
      // For movies or other content, process normally
      console.log(`[PlexService] Processing ${items[0]?.type || 'unknown'} library normally`);
      return items.map((item: any) => ({
        id: item.ratingKey,
        ratingKey: item.ratingKey, // Add this for analyzer compatibility
        title: item.title,
        type: item.type, // Add type (movie, episode, etc.)
        year: item.year,
        rating: item.rating,
        summary: item.summary,
        duration: item.duration,
        addedAt: new Date(item.addedAt * 1000),
        updatedAt: new Date(item.updatedAt * 1000),
        libraryId,
        files: [], // Will be populated by getMediaDetails
        // Include raw media data for analyzer service
        Media: item.Media, // This is the key missing piece!
        Genre: item.Genre // Also include genre data
      }));
    } catch (error) {
      console.error(`Failed to fetch items from library ${libraryId}:`, error);
      throw this.createError('Failed to fetch library items', 500);
    }
  }

  /**
   * Get detailed information about a media item including files
   */
  async getMediaDetails(itemId: string): Promise<MediaItem | null> {
    if (!this.isConfigured || !this.client) {
      throw this.createError('Plex service not configured', 500);
    }

    try {
      const response = await this.client.get(`/library/metadata/${itemId}`);
      const item = response.data?.MediaContainer?.Metadata?.[0];

      if (!item) {
        return null;
      }

      const files = [];
      if (item.Media) {
        for (const media of item.Media) {
          if (media.Part) {
            for (const part of media.Part) {
              files.push({
                id: part.id,
                path: part.file,
                size: parseInt(part.size, 10) || 0,
                container: part.container,
                bitrate: media.bitrate,
                resolution: `${media.width}x${media.height}`,
                videoCodec: media.videoCodec,
                audioCodec: media.audioCodec,
                audioChannels: media.audioChannels,
              });
            }
          }
        }
      }

      return {
        id: item.ratingKey,
        title: item.title,
        year: item.year,
        rating: item.rating,
        summary: item.summary,
        duration: item.duration,
        addedAt: new Date(item.addedAt * 1000),
        updatedAt: new Date(item.updatedAt * 1000),
        libraryId: item.librarySectionID,
        files,
      };
    } catch (error) {
      console.error(`Failed to fetch media details for ${itemId}:`, error);
      throw this.createError('Failed to fetch media details', 500);
    }
  }

  /**
   * Get episodes from TV shows for size analysis
   */
  private async getEpisodesFromShows(shows: any[], libraryId: string): Promise<MediaItem[]> {
    const episodes: MediaItem[] = [];
    
    console.log(`[PlexService] Processing ${shows.length} shows to get episodes`);
    
    for (const show of shows) { // Process all shows for accurate size analysis
      try {
        console.log(`[PlexService] Getting episodes for show: ${show.title}`);
        
        // Get seasons for this show
        const seasonsResponse = await this.client!.get(`/library/metadata/${show.ratingKey}/children`);
        const seasons = seasonsResponse.data?.MediaContainer?.Metadata || [];
        
        for (const season of seasons) {
          // Get episodes for this season with media information
          const episodesResponse = await this.client!.get(`/library/metadata/${season.ratingKey}/children`, {
            params: {
              includeMedia: 1,
              includeFile: 1
            }
          });
          const seasonEpisodes = episodesResponse.data?.MediaContainer?.Metadata || [];
          
          episodes.push(...seasonEpisodes.map((episode: any) => ({
            id: episode.ratingKey,
            ratingKey: episode.ratingKey,
            title: `${show.title} - ${episode.title}`,
            type: 'episode',
            year: episode.year || show.year,
            rating: episode.rating,
            summary: episode.summary,
            duration: episode.duration,
            addedAt: new Date(episode.addedAt * 1000),
            updatedAt: new Date(episode.updatedAt * 1000),
            libraryId,
            files: [],
            Media: episode.Media,
            Genre: show.Genre // Use show's genre for episodes
          })));
        }
      } catch (error) {
        console.warn(`[PlexService] Failed to get episodes for show ${show.title}:`, error);
      }
    }
    
    console.log(`[PlexService] Retrieved ${episodes.length} episodes total`);
    return episodes;
  }

  /**
   * Get server information
   */
  async getServerInfo(): Promise<any> {
    if (!this.isConfigured || !this.client) {
      throw this.createError('Plex service not configured', 500);
    }

    try {
      const response = await this.client.get('/');
      return response.data?.MediaContainer;
    } catch (error) {
      console.error('Failed to fetch server info:', error);
      throw this.createError('Failed to fetch server info', 500);
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
export const plexService = new PlexService();