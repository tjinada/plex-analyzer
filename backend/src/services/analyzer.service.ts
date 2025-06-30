import { plexService } from './plex.service';
// Commented out unused imports to fix TypeScript errors
// import { tautulliService } from './tautulli.service';
// import { radarrService } from './radarr.service';
// import { sonarrService } from './sonarr.service';
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

export class AnalyzerService {
  private readonly CACHE_PREFIX = 'analysis:';
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  /**
   * Get comprehensive library analysis
   */
  async getLibraryAnalysis(libraryId: string): Promise<LibraryAnalysis> {
    const cacheKey = `${this.CACHE_PREFIX}library:${libraryId}`;
    const cached = cache.get<LibraryAnalysis>(cacheKey);
    
    if (cached) {
      console.log(`[AnalyzerService] Returning cached analysis for library ${libraryId}`);
      return cached;
    }

    console.log(`[AnalyzerService] Generating analysis for library ${libraryId}`);

    try {
      // Get library information
      const library = await plexService.getLibrary(libraryId);
      if (!library) {
        throw this.createError('Library not found', 404);
      }

      // Get library items with media details
      const items = await plexService.getLibraryItems(libraryId);
      if (!items || items.length === 0) {
        throw this.createError('No items found in library', 404);
      }

      // For size analysis, we need episode-level data for TV shows to get accurate file sizes
      const isShowLibrary = items.length > 0 && (items[0] as any).type === 'show';
      let sizeAnalysisItems = items;
      
      if (isShowLibrary) {
        console.log(`[AnalyzerService] TV show library detected, fetching episodes for size analysis`);
        
        // Cache episode data separately since it's expensive to fetch
        const episodeCacheKey = `${this.CACHE_PREFIX}episodes:${libraryId}`;
        const cachedEpisodes = cache.get<any[]>(episodeCacheKey);
        
        if (cachedEpisodes) {
          console.log(`[AnalyzerService] Using cached episodes for library ${libraryId} (${cachedEpisodes.length} episodes)`);
          sizeAnalysisItems = cachedEpisodes;
        } else {
          console.log(`[AnalyzerService] Fetching episodes from Plex for library ${libraryId}`);
          sizeAnalysisItems = await plexService.getLibraryItemsWithEpisodes(libraryId);
          console.log(`[AnalyzerService] Retrieved ${sizeAnalysisItems.length} episodes for size analysis`);
          
          // Cache episodes with same TTL as other data
          cache.set(episodeCacheKey, sizeAnalysisItems, this.CACHE_TTL);
          console.log(`[AnalyzerService] Cached episodes for library ${libraryId}`);
        }
      }

      // Generate all analyses
      const [sizeAnalysis, qualityAnalysis, contentAnalysis] = await Promise.all([
        this.generateSizeAnalysis(sizeAnalysisItems),
        this.generateQualityAnalysis(items),
        this.generateContentAnalysis(items)
      ]);

      const analysis: LibraryAnalysis = {
        libraryId,
        libraryName: library.title,
        totalSize: sizeAnalysis.totalSize,
        totalItems: items.length,
        sizeAnalysis,
        qualityAnalysis,
        contentAnalysis
      };

      // Cache the result
      cache.set(cacheKey, analysis, this.CACHE_TTL);
      
      return analysis;
    } catch (error) {
      console.error(`[AnalyzerService] Error analyzing library ${libraryId}:`, error);
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
      console.log(`[AnalyzerService] Returning cached size analysis for library ${libraryId}`);
      return cached;
    }

    console.log(`[AnalyzerService] Generating size analysis for library ${libraryId} (limit: ${limit}, offset: ${offset})`);

    const items = await plexService.getLibraryItems(libraryId);
    console.log(`[AnalyzerService] Retrieved ${items?.length || 0} total items for library ${libraryId}`);
    
    if (!items || items.length === 0) {
      console.warn(`[AnalyzerService] No items found in library ${libraryId}`);
      throw this.createError('No items found in library', 404);
    }

    // For size analysis, we need episode-level data for TV shows to get accurate file sizes
    const isShowLibrary = items.length > 0 && (items[0] as any).type === 'show';
    let analysisItems = items;
    
    if (isShowLibrary) {
      console.log(`[AnalyzerService] TV show library detected, fetching episodes for size analysis`);
      
      // Cache episode data separately since it's expensive to fetch
      const episodeCacheKey = `${this.CACHE_PREFIX}episodes:${libraryId}`;
      const cachedEpisodes = cache.get<any[]>(episodeCacheKey);
      
      if (cachedEpisodes) {
        console.log(`[AnalyzerService] Using cached episodes for library ${libraryId} (${cachedEpisodes.length} episodes)`);
        analysisItems = cachedEpisodes;
      } else {
        console.log(`[AnalyzerService] Fetching episodes from Plex for library ${libraryId}`);
        analysisItems = await plexService.getLibraryItemsWithEpisodes(libraryId);
        console.log(`[AnalyzerService] Retrieved ${analysisItems.length} episodes for size analysis`);
        
        // Cache episodes with same TTL as other data
        cache.set(episodeCacheKey, analysisItems, this.CACHE_TTL);
        console.log(`[AnalyzerService] Cached episodes for library ${libraryId}`);
      }
    }

    // Apply pagination to the analysis items (KISS principle)
    const totalItems = analysisItems.length;
    const paginatedItems = paginateArray(analysisItems, offset, limit);
    
    console.log(`[AnalyzerService] Processing ${paginatedItems.length} items (${offset}-${offset + paginatedItems.length} of ${totalItems})`);

    const sizeAnalysis = await this.generateSizeAnalysis(paginatedItems);
    const pagination = createPaginationMeta(offset, limit, totalItems);
    
    const result: PaginatedSizeAnalysis = {
      data: sizeAnalysis,
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
      console.log(`[AnalyzerService] Returning cached quality analysis for library ${libraryId}`);
      return cached;
    }

    console.log(`[AnalyzerService] Generating quality analysis for library ${libraryId} (limit: ${limit}, offset: ${offset})`);

    // Get items, using episodes for TV shows since quality data comes from video files
    const items = await plexService.getLibraryItems(libraryId);
    if (!items || items.length === 0) {
      throw this.createError('No items found in library', 404);
    }

    // Check if this is a TV show library and get episodes for quality analysis
    const isShowLibrary = items.length > 0 && (items[0] as any).type === 'show';
    let analysisItems = items;
    
    if (isShowLibrary) {
      console.log(`[AnalyzerService] TV show library detected for quality analysis, fetching episodes`);
      
      // Cache episode data separately since it's expensive to fetch
      const episodeCacheKey = `${this.CACHE_PREFIX}episodes:${libraryId}`;
      const cachedEpisodes = cache.get<any[]>(episodeCacheKey);
      
      if (cachedEpisodes) {
        console.log(`[AnalyzerService] Using cached episodes for library ${libraryId} (${cachedEpisodes.length} episodes)`);
        analysisItems = cachedEpisodes;
      } else {
        console.log(`[AnalyzerService] Fetching episodes from Plex for library ${libraryId}`);
        analysisItems = await plexService.getLibraryItemsWithEpisodes(libraryId);
        console.log(`[AnalyzerService] Retrieved ${analysisItems.length} episodes for quality analysis`);
        
        // Cache episodes with same TTL as other data
        cache.set(episodeCacheKey, analysisItems, this.CACHE_TTL);
        console.log(`[AnalyzerService] Cached episodes for library ${libraryId}`);
      }
    }

    // Apply pagination to the analysis items
    const totalItems = analysisItems.length;
    const paginatedItems = paginateArray(analysisItems, offset, limit);
    
    console.log(`[AnalyzerService] Processing ${paginatedItems.length} items (${offset}-${offset + paginatedItems.length} of ${totalItems})`);

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
      console.log(`[AnalyzerService] Returning cached content analysis for library ${libraryId}`);
      return cached;
    }

    console.log(`[AnalyzerService] Generating content analysis for library ${libraryId} (limit: ${limit}, offset: ${offset})`);

    // Get items, using episodes for TV shows for more granular content analysis
    const items = await plexService.getLibraryItems(libraryId);
    if (!items || items.length === 0) {
      throw this.createError('No items found in library', 404);
    }

    // Check if this is a TV show library and get episodes for content analysis
    const isShowLibrary = items.length > 0 && (items[0] as any).type === 'show';
    let analysisItems = items;
    
    if (isShowLibrary) {
      console.log(`[AnalyzerService] TV show library detected for content analysis, fetching episodes`);
      
      // Cache episode data separately since it's expensive to fetch
      const episodeCacheKey = `${this.CACHE_PREFIX}episodes:${libraryId}`;
      const cachedEpisodes = cache.get<any[]>(episodeCacheKey);
      
      if (cachedEpisodes) {
        console.log(`[AnalyzerService] Using cached episodes for library ${libraryId} (${cachedEpisodes.length} episodes)`);
        analysisItems = cachedEpisodes;
      } else {
        console.log(`[AnalyzerService] Fetching episodes from Plex for library ${libraryId}`);
        analysisItems = await plexService.getLibraryItemsWithEpisodes(libraryId);
        console.log(`[AnalyzerService] Retrieved ${analysisItems.length} episodes for content analysis`);
        
        // Cache episodes with same TTL as other data
        cache.set(episodeCacheKey, analysisItems, this.CACHE_TTL);
        console.log(`[AnalyzerService] Cached episodes for library ${libraryId}`);
      }
    }

    // Apply pagination to the analysis items
    const totalItems = analysisItems.length;
    const paginatedItems = paginateArray(analysisItems, offset, limit);
    
    console.log(`[AnalyzerService] Processing ${paginatedItems.length} items (${offset}-${offset + paginatedItems.length} of ${totalItems})`);

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
   * Get total size for a library (used by library cards - no pagination needed)
   */
  async getLibraryTotalSize(libraryId: string): Promise<number> {
    const cacheKey = `${this.CACHE_PREFIX}total_size:${libraryId}`;
    const cached = cache.get<number>(cacheKey);
    
    if (cached !== undefined && cached !== null) {
      return cached;
    }

    console.log(`[AnalyzerService] Calculating total size for library ${libraryId}`);

    const items = await plexService.getLibraryItems(libraryId);
    if (!items || items.length === 0) {
      return 0;
    }

    // Check if this is a TV show library and get episodes for accurate size
    const isShowLibrary = items.length > 0 && (items[0] as any).type === 'show';
    let analysisItems = items;
    
    if (isShowLibrary) {
      console.log(`[AnalyzerService] TV show library detected, fetching episodes for total size`);
      
      // Cache episode data separately since it's expensive to fetch
      const episodeCacheKey = `${this.CACHE_PREFIX}episodes:${libraryId}`;
      const cachedEpisodes = cache.get<any[]>(episodeCacheKey);
      
      if (cachedEpisodes) {
        console.log(`[AnalyzerService] Using cached episodes for library ${libraryId} (${cachedEpisodes.length} episodes)`);
        analysisItems = cachedEpisodes;
      } else {
        console.log(`[AnalyzerService] Fetching episodes from Plex for library ${libraryId}`);
        analysisItems = await plexService.getLibraryItemsWithEpisodes(libraryId);
        
        // Cache episodes with same TTL as other data
        cache.set(episodeCacheKey, analysisItems, this.CACHE_TTL);
        console.log(`[AnalyzerService] Cached episodes for library ${libraryId}`);
      }
    }

    // Calculate total size from all files
    let totalSize = 0;
    for (const item of analysisItems) {
      if ((item as any).Media && Array.isArray((item as any).Media)) {
        for (const media of (item as any).Media) {
          if (media.Part && Array.isArray(media.Part)) {
            for (const part of media.Part) {
              totalSize += parseInt(part.size) || 0;
            }
          }
        }
      }
    }

    console.log(`[AnalyzerService] Total size for library ${libraryId}: ${totalSize} bytes`);
    cache.set(cacheKey, totalSize, this.CACHE_TTL);
    return totalSize;
  }

  /**
   * Refresh analysis data for a library
   */
  async refreshAnalysis(libraryId: string): Promise<void> {
    // Clear all cache entries for this library (including paginated variations)
    const allKeys = cache.getStats().keys;
    const libraryKeyPattern = `${this.CACHE_PREFIX}`;
    const keysToDelete = allKeys.filter(key => 
      key.startsWith(libraryKeyPattern) && key.includes(`:${libraryId}`)
    );

    keysToDelete.forEach(key => cache.delete(key));
    
    console.log(`[AnalyzerService] Cleared ${keysToDelete.length} cache entries for library ${libraryId}`);
  }

  /**
   * Get all libraries (delegated to Plex service)
   */
  async getLibraries(): Promise<any[]> {
    return await plexService.getLibraries();
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
          // Use library.id for library ID (based on how we mapped it in getLibraries)
          const libraryId = library.id || library.key;
          console.log(`[AnalyzerService] Processing library: ${library.title} (ID: ${libraryId})`);
          
          if (!libraryId) {
            console.warn(`[AnalyzerService] Library has no ID:`, library);
            continue;
          }
          
          const analysis = await this.getLibraryAnalysis(libraryId);
          totalSize += analysis.totalSize;
          totalItems += analysis.totalItems;
          
          libraryBreakdown.push({
            id: libraryId,
            title: library.title,
            type: library.type,
            size: analysis.totalSize,
            itemCount: analysis.totalItems,
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
        totalLibraries: libraries.length,
        libraryBreakdown: libraryBreakdown.sort((a, b) => b.size - a.size)
      };

      cache.set(cacheKey, globalStats, this.CACHE_TTL);
      return globalStats;
    } catch (error) {
      console.error('[AnalyzerService] Error generating global stats:', error);
      throw error;
    }
  }

  /**
   * Get library statistics for a specific library
   */
  async getLibraryStats(libraryId: string): Promise<any> {
    const analysis = await this.getLibraryAnalysis(libraryId);
    
    // Transform analysis data to match expected statistics format
    const qualityDistribution: Record<string, { count: number; size: number }> = {};
    
    // Group by resolution
    analysis.qualityAnalysis.resolutionDistribution.forEach(res => {
      qualityDistribution[res.resolution] = {
        count: res.count,
        size: 0 // Would need file size data by resolution, simplified for now
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
   * Generate size analysis from library items (already paginated)
   */
  private async generateSizeAnalysis(items: any[]): Promise<SizeAnalysis> {
    console.log(`[AnalyzerService] Generating size analysis for ${items.length} items (already paginated)`);
    
    // Items are already paginated and episode-level if needed
    const analysisItems = items;
    
    const mediaFiles: MediaFile[] = [];
    
    // Extract media file information
    for (const item of analysisItems) {
      console.log(`[AnalyzerService] Processing item: ${item.title} (type: ${item.type})`);
      console.log(`[AnalyzerService] Item structure:`, {
        hasMedia: !!(item as any).Media,
        mediaIsArray: Array.isArray((item as any).Media),
        mediaLength: (item as any).Media?.length || 0
      });
      
      if ((item as any).Media && Array.isArray((item as any).Media)) {
        for (const media of (item as any).Media) {
          console.log(`[AnalyzerService] Processing media:`, {
            hasPart: !!media.Part,
            partIsArray: Array.isArray(media.Part),
            partLength: media.Part?.length || 0
          });
          
          if (media.Part && Array.isArray(media.Part)) {
            for (const part of media.Part) {
              console.log(`[AnalyzerService] Processing part:`, {
                file: part.file,
                size: part.size,
                hasSize: !!part.size,
                sizeType: typeof part.size,
                rawPart: JSON.stringify(part, null, 2)
              });
              
              const file: MediaFile = {
                id: item.ratingKey,
                title: item.title,
                filePath: part.file || 'Unknown',
                fileSize: parseInt(part.size) || 0,
                resolution: this.extractResolution(media),
                codec: this.extractCodec(media),
                year: item.year || undefined,
                type: item.type === 'movie' ? 'movie' : 'episode'
              };
              mediaFiles.push(file);
              console.log(`[AnalyzerService] Added file:`, file);
            }
          }
        }
      }
    }
    
    console.log(`[AnalyzerService] Total media files extracted: ${mediaFiles.length}`);
    
    // Calculate statistics for debugging
    const filesWithSize = mediaFiles.filter(f => f.fileSize > 0);
    const filesWithoutSize = mediaFiles.filter(f => f.fileSize === 0);
    const totalSize = mediaFiles.reduce((sum, file) => sum + file.fileSize, 0);
    
    console.log(`[AnalyzerService] Size analysis debug info:`);
    console.log(`  - Total files: ${mediaFiles.length}`);
    console.log(`  - Files with size data: ${filesWithSize.length}`);
    console.log(`  - Files without size data: ${filesWithoutSize.length}`);
    console.log(`  - Total size: ${totalSize} bytes (${(totalSize / (1024*1024*1024)).toFixed(2)} GB)`);
    
    if (filesWithoutSize.length > 0) {
      console.log(`[AnalyzerService] Sample files without size data:`, 
        filesWithoutSize.slice(0, 3).map(f => ({ title: f.title, type: f.type })));
    }

    // For TV show libraries, aggregate episodes by show for better user experience
    const hasEpisodes = mediaFiles.some(file => file.type === 'episode');
    let processedFiles = mediaFiles;
    
    if (hasEpisodes) {
      console.log(`[AnalyzerService] TV show library detected, aggregating episodes by show`);
      processedFiles = this.aggregateEpisodesByShow(mediaFiles);
      console.log(`[AnalyzerService] Aggregated ${mediaFiles.length} episodes into ${processedFiles.length} shows/movies`);
    }

    // Sort by file size (largest first) - pagination already applied
    const largestFiles = processedFiles
      .sort((a, b) => b.fileSize - a.fileSize);

    // Calculate size distribution using processed files
    const sizeDistribution = this.calculateSizeDistribution(processedFiles);
    
    // Calculate average file size using processed files
    const averageFileSize = processedFiles.length > 0 ? totalSize / processedFiles.length : 0;

    console.log(`[AnalyzerService] Size analysis summary:`);
    console.log(`  - Original files: ${mediaFiles.length}`);
    console.log(`  - Processed files: ${processedFiles.length}`);
    console.log(`  - Total size: ${totalSize} bytes`);
    console.log(`  - Average file size: ${averageFileSize} bytes`);
    console.log(`  - Size distribution: ${sizeDistribution.length} ranges`);

    const result: SizeAnalysis = {
      largestFiles,
      sizeDistribution,
      averageFileSize,
      totalSize,
      hasEpisodes
    };

    // For TV show libraries, include episode breakdown
    if (hasEpisodes) {
      result.episodeBreakdown = mediaFiles
        .sort((a, b) => b.fileSize - a.fileSize);
    }

    return result;
  }

  /**
   * Generate quality analysis from library items (already paginated)
   */
  private async generateQualityAnalysis(items: any[]): Promise<QualityAnalysis> {
    const resolutionCounts = new Map<string, number>();
    const codecCounts = new Map<string, number>();
    
    // Items are already paginated
    for (const item of items) {
      if ((item as any).Media && Array.isArray((item as any).Media)) {
        for (const media of (item as any).Media) {
          const resolution = this.extractResolution(media);
          const codec = this.extractCodec(media);
          
          resolutionCounts.set(resolution, (resolutionCounts.get(resolution) || 0) + 1);
          codecCounts.set(codec, (codecCounts.get(codec) || 0) + 1);
        }
      }
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
      qualityProfiles: [], // Will be enhanced with Radarr/Sonarr data
      resolutionDistribution,
      codecDistribution
    };
  }

  /**
   * Generate content analysis from library items (already paginated)
   */
  private async generateContentAnalysis(items: any[]): Promise<ContentAnalysis> {
    const genreCounts = new Map<string, number>();
    const yearCounts = new Map<number, number>();
    const runtimeRanges = new Map<string, { count: number; totalRuntime: number }>();

    // Items are already paginated
    for (const item of items) {
      // Genre distribution
      if (item.Genre && Array.isArray(item.Genre)) {
        for (const genre of item.Genre) {
          const genreName = genre.tag || 'Unknown';
          genreCounts.set(genreName, (genreCounts.get(genreName) || 0) + 1);
        }
      }

      // Year distribution
      if (item.year) {
        yearCounts.set(item.year, (yearCounts.get(item.year) || 0) + 1);
      }

      // Runtime distribution
      if (item.duration) {
        const runtime = Math.floor(item.duration / 60000); // Convert to minutes
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
   * Extract resolution from media object
   */
  private extractResolution(media: any): string {
    if (media.videoResolution) {
      return media.videoResolution + 'p';
    }
    if (media.height) {
      return media.height + 'p';
    }
    return 'Unknown';
  }

  /**
   * Extract codec from media object
   */
  private extractCodec(media: any): string {
    if (media.videoCodec) {
      return media.videoCodec.toUpperCase();
    }
    return 'Unknown';
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
   */
  private aggregateEpisodesByShow(mediaFiles: MediaFile[]): MediaFile[] {
    const episodes = mediaFiles.filter(file => file.type === 'episode');
    const movies = mediaFiles.filter(file => file.type === 'movie');
    
    if (episodes.length === 0) {
      // If no episodes, return original data (movies only)
      return mediaFiles;
    }
    
    // Group episodes by show name
    const showGroups = episodes.reduce((groups, episode) => {
      // Extract show name from episode title format: "Show Name - Episode Title"
      const showName = episode.title.split(' - ')[0];
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
      
      // Find the most common resolution and codec (could be enhanced)
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

export const analyzerService = new AnalyzerService();