import { plexService } from './plex.service';
import { tautulliService } from './tautulli.service';
import { radarrService } from './radarr.service';
import { sonarrService } from './sonarr.service';
import { cache } from '../utils/cache.util';
import { ApiError } from '../models';

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
  type: 'movie' | 'episode';
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

      // Generate all analyses
      const [sizeAnalysis, qualityAnalysis, contentAnalysis] = await Promise.all([
        this.generateSizeAnalysis(items),
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
   * Get size analysis for a library
   */
  async getSizeAnalysis(libraryId: string, limit?: number): Promise<SizeAnalysis> {
    const cacheKey = `${this.CACHE_PREFIX}size:${libraryId}:${limit || 'all'}`;
    const cached = cache.get<SizeAnalysis>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const items = await plexService.getLibraryItems(libraryId);
    console.log(`[AnalyzerService] Retrieved ${items?.length || 0} items for library ${libraryId}`);
    
    if (!items || items.length === 0) {
      console.warn(`[AnalyzerService] No items found in library ${libraryId}`);
      throw this.createError('No items found in library', 404);
    }

    const sizeAnalysis = await this.generateSizeAnalysis(items, limit);
    cache.set(cacheKey, sizeAnalysis, this.CACHE_TTL);
    
    return sizeAnalysis;
  }

  /**
   * Get quality analysis for a library
   */
  async getQualityAnalysis(libraryId: string, limit?: number): Promise<QualityAnalysis> {
    const cacheKey = `${this.CACHE_PREFIX}quality:${libraryId}:${limit || 'all'}`;
    const cached = cache.get<QualityAnalysis>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const items = await plexService.getLibraryItems(libraryId);
    if (!items || items.length === 0) {
      throw this.createError('No items found in library', 404);
    }

    const qualityAnalysis = await this.generateQualityAnalysis(items, limit);
    cache.set(cacheKey, qualityAnalysis, this.CACHE_TTL);
    
    return qualityAnalysis;
  }

  /**
   * Get content analysis for a library
   */
  async getContentAnalysis(libraryId: string, limit?: number): Promise<ContentAnalysis> {
    const cacheKey = `${this.CACHE_PREFIX}content:${libraryId}:${limit || 'all'}`;
    const cached = cache.get<ContentAnalysis>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const items = await plexService.getLibraryItems(libraryId);
    if (!items || items.length === 0) {
      throw this.createError('No items found in library', 404);
    }

    const contentAnalysis = await this.generateContentAnalysis(items, limit);
    cache.set(cacheKey, contentAnalysis, this.CACHE_TTL);
    
    return contentAnalysis;
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
    
    console.log(`[AnalyzerService] Cleared analysis cache for library ${libraryId}`);
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
   * Generate size analysis from library items
   */
  private async generateSizeAnalysis(items: any[], limit?: number): Promise<SizeAnalysis> {
    console.log(`[AnalyzerService] Generating size analysis for ${items.length} items`);
    
    // For size analysis, we need episode-level data for TV shows
    // Check if this is a TV show library by examining the first item
    const isShowLibrary = items.length > 0 && items[0].type === 'show';
    let analysisItems = items;
    
    if (isShowLibrary) {
      console.log(`[AnalyzerService] TV show library detected, fetching episodes for size analysis`);
      // Get the libraryId from the first item
      const libraryId = items[0].libraryId;
      analysisItems = await plexService.getLibraryItemsWithEpisodes(libraryId);
      console.log(`[AnalyzerService] Retrieved ${analysisItems.length} episodes for size analysis`);
    }
    
    const mediaFiles: MediaFile[] = [];
    
    // Extract media file information
    for (const item of analysisItems) {
      console.log(`[AnalyzerService] Processing item: ${item.title} (type: ${item.type})`);
      console.log(`[AnalyzerService] Item structure:`, {
        hasMedia: !!item.Media,
        mediaIsArray: Array.isArray(item.Media),
        mediaLength: item.Media?.length || 0
      });
      
      if (item.Media && Array.isArray(item.Media)) {
        for (const media of item.Media) {
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

    // Sort by file size (largest first) and apply limit
    const limitToApply = limit && limit > 0 ? limit : 50; // Default to 50 if no limit or invalid limit
    const largestFiles = mediaFiles
      .sort((a, b) => b.fileSize - a.fileSize)
      .slice(0, limit === -1 ? mediaFiles.length : limitToApply); // -1 means ALL

    // Calculate size distribution
    const sizeDistribution = this.calculateSizeDistribution(mediaFiles);
    
    // Calculate average file size
    const averageFileSize = mediaFiles.length > 0 ? totalSize / mediaFiles.length : 0;

    console.log(`[AnalyzerService] Size analysis summary:`);
    console.log(`  - Total files: ${mediaFiles.length}`);
    console.log(`  - Total size: ${totalSize} bytes`);
    console.log(`  - Average file size: ${averageFileSize} bytes`);
    console.log(`  - Size distribution: ${sizeDistribution.length} ranges`);

    return {
      largestFiles,
      sizeDistribution,
      averageFileSize,
      totalSize // Add total size to the return value
    };
  }

  /**
   * Generate quality analysis from library items
   */
  private async generateQualityAnalysis(items: any[], limit?: number): Promise<QualityAnalysis> {
    const resolutionCounts = new Map<string, number>();
    const codecCounts = new Map<string, number>();
    
    // Apply limit to items if specified
    const limitToApply = limit && limit > 0 ? limit : items.length;
    const itemsToAnalyze = limit === -1 ? items : items.slice(0, limitToApply);
    
    for (const item of itemsToAnalyze) {
      if (item.Media && Array.isArray(item.Media)) {
        for (const media of item.Media) {
          const resolution = this.extractResolution(media);
          const codec = this.extractCodec(media);
          
          resolutionCounts.set(resolution, (resolutionCounts.get(resolution) || 0) + 1);
          codecCounts.set(codec, (codecCounts.get(codec) || 0) + 1);
        }
      }
    }

    const totalItems = itemsToAnalyze.length;
    
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
   * Generate content analysis from library items
   */
  private async generateContentAnalysis(items: any[], limit?: number): Promise<ContentAnalysis> {
    const genreCounts = new Map<string, number>();
    const yearCounts = new Map<number, number>();
    const runtimeRanges = new Map<string, { count: number; totalRuntime: number }>();

    // Apply limit to items if specified
    const limitToApply = limit && limit > 0 ? limit : items.length;
    const itemsToAnalyze = limit === -1 ? items : items.slice(0, limitToApply);

    for (const item of itemsToAnalyze) {
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

    const totalItems = itemsToAnalyze.length;

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
   * Create standardized error
   */
  private createError(message: string, statusCode: number): ApiError {
    const error = new Error(message) as ApiError;
    error.statusCode = statusCode;
    return error;
  }
}

export const analyzerService = new AnalyzerService();