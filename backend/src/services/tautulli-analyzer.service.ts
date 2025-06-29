import { tautulliService } from './tautulli.service';
import { cache } from '../utils/cache.util';
import { ApiError, PaginationMeta } from '../models';
import { createPaginationMeta, paginateArray } from '../utils/pagination.util';

export interface LibraryAnalysis {
  libraryId: string;
  libraryName: string;
  totalSize: number;
  totalItems: number;
  sizeAnalysis: SizeAnalysis;
  qualityAnalysis: QualityAnalysis;
  contentAnalysis: ContentAnalysis;
}

export interface SizeAnalysis {
  largestFiles: MediaFile[];
  sizeDistribution: SizeDistribution[];
  averageFileSize: number;
  totalSize: number;
  episodeBreakdown?: MediaFile[]; // For TV shows: original episode-level data
  hasEpisodes?: boolean; // Flag to indicate if this library has episodes
}

// Paginated response interfaces
export interface PaginatedSizeAnalysis {
  data: SizeAnalysis;
  pagination: PaginationMeta;
}

export interface PaginatedQualityAnalysis {
  data: QualityAnalysis;
  pagination: PaginationMeta;
}

export interface PaginatedContentAnalysis {
  data: ContentAnalysis;
  pagination: PaginationMeta;
}

export interface QualityAnalysis {
  qualityProfiles: QualityProfile[];
  resolutionDistribution: ResolutionData[];
  codecDistribution: CodecData[];
}

export interface ContentAnalysis {
  genreDistribution: GenreData[];
  yearDistribution: YearData[];
  runtimeDistribution: RuntimeData[];
}

export interface MediaFile {
  id: string;
  title: string;
  filePath: string;
  fileSize: number;
  resolution: string;
  codec: string;
  year?: number;
  type: 'movie' | 'episode' | 'show';
  showName?: string;  // For episodes, the parent show name
  episodeCount?: number;  // For shows, the number of episodes
}

export interface SizeDistribution {
  range: string;
  count: number;
  totalSize: number;
  percentage: number;
}

export interface QualityProfile {
  name: string;
  count: number;
  totalSize: number;
  percentage: number;
}

export interface ResolutionData {
  resolution: string;
  count: number;
  percentage: number;
}

export interface CodecData {
  codec: string;
  count: number;
  percentage: number;
}

export interface GenreData {
  genre: string;
  count: number;
  percentage: number;
}

export interface YearData {
  year: number;
  count: number;
}

export interface RuntimeData {
  range: string;
  count: number;
  averageRuntime: number;
}

export class TautulliAnalyzerService {
  private readonly CACHE_PREFIX = 'tautulli-analysis:';
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  /**
   * Get all libraries from Tautulli
   */
  async getLibraries(): Promise<any[]> {
    const cacheKey = `${this.CACHE_PREFIX}libraries`;
    const cached = cache.get<any[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const libraries = await tautulliService.getLibrariesTable();
      const libraryData = libraries.data || [];
      
      const mapped = libraryData.map((lib: any) => ({
        id: lib.section_id,
        key: lib.section_id,
        title: lib.section_name,
        type: lib.section_type,
        agent: lib.agent,
        scanner: lib.scanner,
        language: lib.language,
        uuid: lib.section_id,
        createdAt: new Date(),
        updatedAt: new Date(),
        itemCount: parseInt(lib.count, 10) || 0,
        totalSize: parseInt(lib.total_file_size || '0', 10),
      }));
      
      cache.set(cacheKey, mapped, this.CACHE_TTL);
      return mapped;
    } catch (error) {
      console.error('[TautulliAnalyzerService] Failed to get libraries:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive library analysis using Tautulli data
   */
  async getLibraryAnalysis(libraryId: string): Promise<LibraryAnalysis> {
    const cacheKey = `${this.CACHE_PREFIX}library:${libraryId}`;
    const cached = cache.get<LibraryAnalysis>(cacheKey);
    
    if (cached) {
      console.log(`[TautulliAnalyzerService] Returning cached analysis for library ${libraryId}`);
      return cached;
    }

    console.log(`[TautulliAnalyzerService] Generating analysis for library ${libraryId}`);

    try {
      // Get library information
      const libraries = await this.getLibraries();
      const library = libraries.find(lib => lib.id === libraryId);
      
      if (!library) {
        throw this.createError('Library not found', 404);
      }

      // Get media items from Tautulli
      const mediaInfo = await tautulliService.getLibraryMediaInfo(libraryId, { length: 5000 });
      const items = mediaInfo.data || [];
      
      if (!items || items.length === 0) {
        throw this.createError('No items found in library', 404);
      }

      // Generate all analyses
      const [sizeAnalysis, qualityAnalysis, contentAnalysis] = await Promise.all([
        this.generateSizeAnalysis(items),
        this.generateQualityAnalysis(items),
        this.generateContentAnalysis(items)
      ]);

      const analysis: LibraryAnalysis = {
        libraryId,
        libraryName: library.title,
        totalSize: parseInt(mediaInfo.total_file_size || '0', 10),
        totalItems: items.length,
        sizeAnalysis,
        qualityAnalysis,
        contentAnalysis
      };

      // Cache the result
      cache.set(cacheKey, analysis, this.CACHE_TTL);
      
      return analysis;
    } catch (error) {
      console.error(`[TautulliAnalyzerService] Error analyzing library ${libraryId}:`, error);
      throw error;
    }
  }

  /**
   * Get size analysis for a library with pagination support
   */
  async getSizeAnalysis(libraryId: string, limit: number = 25, offset: number = 0): Promise<PaginatedSizeAnalysis> {
    const cacheKey = `${this.CACHE_PREFIX}size:${libraryId}:${limit}:${offset}`;
    const cached = cache.get<PaginatedSizeAnalysis>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const mediaInfo = await tautulliService.getLibraryMediaInfo(libraryId, { 
      orderColumn: 'file_size',
      orderDir: 'desc',
      length: 5000 
    });
    
    const items = mediaInfo.data || [];
    console.log(`[TautulliAnalyzerService] Retrieved ${items.length} total items for library ${libraryId}`);
    
    if (!items || items.length === 0) {
      console.warn(`[TautulliAnalyzerService] No items found in library ${libraryId}`);
      throw this.createError('No items found in library', 404);
    }

    // Generate analysis on ALL items first
    const totalItems = items.length;
    const fullSizeAnalysis = await this.generateSizeAnalysis(items, limit, offset);
    
    console.log(`[TautulliAnalyzerService] Generated analysis with ${fullSizeAnalysis.largestFiles.length} items (limit: ${limit}, offset: ${offset})`);

    const pagination = createPaginationMeta(offset, limit, totalItems);
    
    const result: PaginatedSizeAnalysis = {
      data: fullSizeAnalysis,
      pagination
    };
    
    cache.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  /**
   * Get quality analysis for a library with pagination support
   */
  async getQualityAnalysis(libraryId: string, limit: number = 50, offset: number = 0): Promise<PaginatedQualityAnalysis> {
    const cacheKey = `${this.CACHE_PREFIX}quality:${libraryId}:${limit}:${offset}`;
    const cached = cache.get<PaginatedQualityAnalysis>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const mediaInfo = await tautulliService.getLibraryMediaInfo(libraryId, { length: 5000 });
    const items = mediaInfo.data || [];
    
    if (!items || items.length === 0) {
      throw this.createError('No items found in library', 404);
    }

    // Apply pagination to the analysis items
    const totalItems = items.length;
    const paginatedItems = paginateArray(items, offset, limit);

    const qualityAnalysis = await this.generateQualityAnalysis(paginatedItems);
    const pagination = createPaginationMeta(offset, limit, totalItems);
    
    const result: PaginatedQualityAnalysis = {
      data: qualityAnalysis,
      pagination
    };
    
    cache.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  /**
   * Get content analysis for a library with pagination support
   */
  async getContentAnalysis(libraryId: string, limit: number = 50, offset: number = 0): Promise<PaginatedContentAnalysis> {
    const cacheKey = `${this.CACHE_PREFIX}content:${libraryId}:${limit}:${offset}`;
    const cached = cache.get<PaginatedContentAnalysis>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const mediaInfo = await tautulliService.getLibraryMediaInfo(libraryId, { length: 5000 });
    const items = mediaInfo.data || [];
    
    if (!items || items.length === 0) {
      throw this.createError('No items found in library', 404);
    }

    // Apply pagination to the analysis items
    const totalItems = items.length;
    const paginatedItems = paginateArray(items, offset, limit);

    const contentAnalysis = await this.generateContentAnalysis(paginatedItems);
    const pagination = createPaginationMeta(offset, limit, totalItems);
    
    const result: PaginatedContentAnalysis = {
      data: contentAnalysis,
      pagination
    };
    
    cache.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  /**
   * Get library total size (for library cards)
   */
  async getLibraryTotalSize(libraryId: string): Promise<number> {
    try {
      const mediaInfo = await tautulliService.getLibraryMediaInfo(libraryId, { length: 1 });
      return parseInt(mediaInfo.total_file_size || '0', 10);
    } catch (error) {
      console.error(`[TautulliAnalyzerService] Error getting library total size for ${libraryId}:`, error);
      return 0;
    }
  }

  /**
   * Get global statistics across all libraries
   */
  async getGlobalStats(): Promise<any> {
    const cacheKey = `${this.CACHE_PREFIX}global:stats`;
    const cached = cache.get<any>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const libraries = await this.getLibraries();
      let totalSize = 0;
      let totalItems = 0;
      const libraryBreakdown = [];

      for (const library of libraries) {
        try {
          const libraryId = library.id || library.key;
          console.log(`[TautulliAnalyzerService] Processing library: ${library.title} (ID: ${libraryId})`);
          
          if (!libraryId) {
            console.warn(`[TautulliAnalyzerService] Library has no ID:`, library);
            continue;
          }
          
          // Get stats from Tautulli
          const mediaInfo = await tautulliService.getLibraryMediaInfo(libraryId, { length: 1 });
          const size = parseInt(mediaInfo.total_file_size || '0', 10);
          const itemCount = parseInt(mediaInfo.recordsTotal || '0', 10);
          
          totalSize += size;
          totalItems += itemCount;
          
          libraryBreakdown.push({
            id: libraryId,
            title: library.title,
            type: library.type,
            size: size,
            itemCount: itemCount,
            percentage: 0 // Will be calculated after
          });
        } catch (error) {
          console.warn(`Failed to get analysis for library ${library.title}:`, error);
        }
      }

      // Calculate percentages
      libraryBreakdown.forEach(lib => {
        lib.percentage = totalSize > 0 ? (lib.size / totalSize) * 100 : 0;
      });

      const globalStats = {
        totalSize,
        totalItems,
        averageFileSize: totalItems > 0 ? totalSize / totalItems : 0,
        libraryBreakdown: libraryBreakdown.sort((a, b) => b.size - a.size),
        libraryCount: libraries.length
      };

      cache.set(cacheKey, globalStats, this.CACHE_TTL);
      return globalStats;
    } catch (error) {
      console.error('[TautulliAnalyzerService] Error generating global stats:', error);
      throw error;
    }
  }

  /**
   * Get library statistics
   */
  async getLibraryStats(libraryId: string): Promise<any> {
    const analysis = await this.getLibraryAnalysis(libraryId);
    
    // Transform analysis data to match expected statistics format
    const qualityDistribution: Record<string, { count: number; size: number }> = {};
    
    // Group by resolution
    analysis.qualityAnalysis.resolutionDistribution.forEach(res => {
      qualityDistribution[res.resolution] = {
        count: res.count,
        size: 0 // Would need file size data by resolution
      };
    });

    return {
      libraryId: analysis.libraryId,
      libraryName: analysis.libraryName,
      totalSize: analysis.totalSize,
      totalItems: analysis.totalItems,
      qualityDistribution,
      sizeDistribution: analysis.sizeAnalysis.sizeDistribution,
      averageFileSize: analysis.sizeAnalysis.averageFileSize
    };
  }

  /**
   * Refresh analysis data for a library
   */
  async refreshAnalysis(libraryId: string): Promise<void> {
    const cacheKeys = [
      `${this.CACHE_PREFIX}library:${libraryId}`,
      `${this.CACHE_PREFIX}size:${libraryId}`,
      `${this.CACHE_PREFIX}quality:${libraryId}`,
      `${this.CACHE_PREFIX}content:${libraryId}`
    ];

    // Clear cache
    cacheKeys.forEach(key => cache.delete(key));
    
    console.log(`[TautulliAnalyzerService] Cleared analysis cache for library ${libraryId}`);
  }

  /**
   * Generate size analysis from Tautulli media items
   */
  private async generateSizeAnalysis(items: any[], limit: number = 50, offset: number = 0): Promise<SizeAnalysis> {
    console.log(`[TautulliAnalyzerService] Generating size analysis for ${items.length} items`);
    const mediaFiles: MediaFile[] = [];
    
    // Extract media file information from Tautulli data
    for (const item of items) {
      const fileSize = parseInt(item.file_size || '0', 10);
      
      if (fileSize > 0) {
        const file: MediaFile = {
          id: item.rating_key || item.id,
          title: item.title || 'Unknown',
          filePath: item.file || 'Unknown',
          fileSize: fileSize,
          resolution: item.video_resolution || 'Unknown',
          codec: item.video_codec ? item.video_codec.toUpperCase() : 'Unknown',
          year: parseInt(item.year) || undefined,
          type: item.media_type === 'movie' ? 'movie' : 'episode'
        };
        mediaFiles.push(file);
      }
    }
    
    console.log(`[TautulliAnalyzerService] Total media files with size data: ${mediaFiles.length}`);

    // For TV show libraries, aggregate episodes by show for better user experience
    const hasEpisodes = mediaFiles.some(file => file.type === 'episode');
    let processedFiles = mediaFiles;
    
    if (hasEpisodes) {
      console.log(`[TautulliAnalyzerService] TV show library detected, aggregating episodes by show`);
      processedFiles = this.aggregateEpisodesByShow(mediaFiles);
      console.log(`[TautulliAnalyzerService] Aggregated ${mediaFiles.length} episodes into ${processedFiles.length} shows/movies`);
    }

    // Sort by file size (largest first) and apply pagination
    const sortedFiles = processedFiles.sort((a, b) => b.fileSize - a.fileSize);
    
    // Apply pagination based on limit and offset
    const largestFiles = limit === Number.MAX_SAFE_INTEGER 
      ? sortedFiles // Return all items if limit is max (from -1)
      : sortedFiles.slice(offset, offset + limit);

    // Calculate size distribution using processed files
    const sizeDistribution = this.calculateSizeDistribution(processedFiles);
    
    // Calculate average file size using processed files (but total size from original data)
    const totalSize = mediaFiles.reduce((sum, file) => sum + file.fileSize, 0);
    const averageFileSize = processedFiles.length > 0 ? totalSize / processedFiles.length : 0;

    const result: SizeAnalysis = {
      largestFiles,
      sizeDistribution,
      averageFileSize,
      totalSize,
      hasEpisodes
    };

    // For TV show libraries, include episode breakdown with same pagination
    if (hasEpisodes) {
      const sortedEpisodes = mediaFiles.sort((a, b) => b.fileSize - a.fileSize);
      result.episodeBreakdown = limit === Number.MAX_SAFE_INTEGER 
        ? sortedEpisodes
        : sortedEpisodes.slice(offset, offset + limit);
    }

    return result;
  }

  /**
   * Generate quality analysis from Tautulli media items
   */
  private async generateQualityAnalysis(items: any[]): Promise<QualityAnalysis> {
    const resolutionCounts = new Map<string, number>();
    const codecCounts = new Map<string, number>();
    
    for (const item of items) {
      const resolution = item.video_resolution || 'Unknown';
      const codec = item.video_codec ? item.video_codec.toUpperCase() : 'Unknown';
      
      resolutionCounts.set(resolution, (resolutionCounts.get(resolution) || 0) + 1);
      codecCounts.set(codec, (codecCounts.get(codec) || 0) + 1);
    }

    const totalItems = items.length;
    
    const resolutionDistribution: ResolutionData[] = Array.from(resolutionCounts.entries())
      .map(([resolution, count]) => ({
        resolution,
        count,
        percentage: count / totalItems
      }))
      .sort((a, b) => b.count - a.count);

    const codecDistribution: CodecData[] = Array.from(codecCounts.entries())
      .map(([codec, count]) => ({
        codec,
        count,
        percentage: count / totalItems
      }))
      .sort((a, b) => b.count - a.count);

    return {
      qualityProfiles: [], // Tautulli doesn't provide quality profiles
      resolutionDistribution,
      codecDistribution
    };
  }

  /**
   * Generate content analysis from Tautulli media items
   */
  private async generateContentAnalysis(items: any[]): Promise<ContentAnalysis> {
    const genreCounts = new Map<string, number>();
    const yearCounts = new Map<number, number>();
    const runtimeRanges = new Map<string, { count: number; totalRuntime: number }>();

    for (const item of items) {
      // Genre distribution
      if (item.genres) {
        const genres = item.genres.split(';').map((g: string) => g.trim());
        for (const genre of genres) {
          if (genre) {
            genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
          }
        }
      }

      // Year distribution
      const year = parseInt(item.year);
      if (year && !isNaN(year)) {
        yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
      }

      // Runtime distribution
      const duration = parseInt(item.duration);
      if (duration && !isNaN(duration)) {
        const runtime = Math.floor(duration / 60000); // Convert to minutes
        const range = this.getRuntimeRange(runtime);
        const current = runtimeRanges.get(range) || { count: 0, totalRuntime: 0 };
        runtimeRanges.set(range, {
          count: current.count + 1,
          totalRuntime: current.totalRuntime + runtime
        });
      }
    }

    const totalItems = items.length;

    const genreDistribution: GenreData[] = Array.from(genreCounts.entries())
      .map(([genre, count]) => ({
        genre,
        count,
        percentage: count / totalItems
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 genres

    const yearDistribution: YearData[] = Array.from(yearCounts.entries())
      .map(([year, count]) => ({
        year,
        count
      }))
      .sort((a, b) => a.year - b.year);

    const runtimeDistribution: RuntimeData[] = Array.from(runtimeRanges.entries())
      .map(([range, data]) => ({
        range,
        count: data.count,
        averageRuntime: data.count > 0 ? data.totalRuntime / data.count : 0
      }))
      .sort((a, b) => a.averageRuntime - b.averageRuntime);

    return {
      genreDistribution,
      yearDistribution,
      runtimeDistribution
    };
  }

  /**
   * Calculate size distribution ranges
   */
  private calculateSizeDistribution(files: MediaFile[]): SizeDistribution[] {
    const ranges = [
      { name: '< 1 GB', min: 0, max: 1024 * 1024 * 1024 },
      { name: '1-5 GB', min: 1024 * 1024 * 1024, max: 5 * 1024 * 1024 * 1024 },
      { name: '5-10 GB', min: 5 * 1024 * 1024 * 1024, max: 10 * 1024 * 1024 * 1024 },
      { name: '10-20 GB', min: 10 * 1024 * 1024 * 1024, max: 20 * 1024 * 1024 * 1024 },
      { name: '> 20 GB', min: 20 * 1024 * 1024 * 1024, max: Infinity }
    ];

    const totalFiles = files.length;

    return ranges.map(range => {
      const filesInRange = files.filter(file => 
        file.fileSize >= range.min && file.fileSize < range.max
      );
      
      const sizeInRange = filesInRange.reduce((sum, file) => sum + file.fileSize, 0);
      
      return {
        range: range.name,
        count: filesInRange.length,
        totalSize: sizeInRange,
        percentage: totalFiles > 0 ? filesInRange.length / totalFiles : 0
      };
    }).filter(dist => dist.count > 0);
  }

  /**
   * Get runtime range category
   */
  private getRuntimeRange(runtime: number): string {
    if (runtime < 30) return '< 30 min';
    if (runtime < 60) return '30-60 min';
    if (runtime < 90) return '60-90 min';
    if (runtime < 120) return '90-120 min';
    if (runtime < 180) return '120-180 min';
    return '> 180 min';
  }

  /**
   * Aggregate TV show episodes by show for better user experience
   * Note: Tautulli might use different data structure than Plex
   */
  private aggregateEpisodesByShow(mediaFiles: MediaFile[]): MediaFile[] {
    const episodes = mediaFiles.filter(file => file.type === 'episode');
    const movies = mediaFiles.filter(file => file.type === 'movie');
    
    if (episodes.length === 0) {
      // If no episodes, return original data (movies only)
      return mediaFiles;
    }
    
    // Group episodes by show name (adapt to Tautulli data structure)
    const showGroups = episodes.reduce((groups, episode) => {
      // For Tautulli, try to extract show name from title or use parent_title if available
      let showName = episode.title;
      
      // If title contains " - " format (like Plex), extract show name
      if (episode.title.includes(' - ')) {
        showName = episode.title.split(' - ')[0];
      }
      // Otherwise, use the full title as show name (Tautulli might structure differently)
      
      if (!groups[showName]) {
        groups[showName] = [];
      }
      groups[showName].push(episode);
      return groups;
    }, {} as Record<string, MediaFile[]>);
    
    // Create aggregated show entries
    const aggregatedShows: MediaFile[] = Object.entries(showGroups).map(([showName, showEpisodes]) => {
      // Calculate total size for the show
      const totalSize = showEpisodes.reduce((sum, episode) => sum + episode.fileSize, 0);
      
      // Find the most common resolution and codec
      const resolutions = showEpisodes.map(ep => ep.resolution);
      const codecs = showEpisodes.map(ep => ep.codec);
      const mostCommonResolution = this.getMostCommon(resolutions);
      const mostCommonCodec = this.getMostCommon(codecs);
      
      // Use the show's year (from first episode)
      const year = showEpisodes[0]?.year;
      
      return {
        id: `show-${showName.replace(/[^a-zA-Z0-9]/g, '-')}`, // Generate show ID
        title: showName,
        filePath: `${showEpisodes.length} episodes`, // Show episode count instead of file path
        fileSize: totalSize,
        resolution: mostCommonResolution,
        codec: mostCommonCodec,
        year: year,
        type: 'show' as const,
        showName: showName,
        episodeCount: showEpisodes.length
      };
    });
    
    // Return aggregated shows combined with movies
    return [...aggregatedShows, ...movies];
  }
  
  /**
   * Helper function to find the most common item in an array
   */
  private getMostCommon<T>(items: T[]): T {
    if (items.length === 0) return 'Unknown' as T;
    
    const counts = items.reduce((acc, item) => {
      acc[item as string] = (acc[item as string] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0] as T;
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

export const tautulliAnalyzerService = new TautulliAnalyzerService();