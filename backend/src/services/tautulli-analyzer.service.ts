import { tautulliService } from './tautulli.service';
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
   * Get size analysis for a library
   */
  async getSizeAnalysis(libraryId: string): Promise<SizeAnalysis> {
    const cacheKey = `${this.CACHE_PREFIX}size:${libraryId}`;
    const cached = cache.get<SizeAnalysis>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const mediaInfo = await tautulliService.getLibraryMediaInfo(libraryId, { 
      orderColumn: 'file_size',
      orderDir: 'desc',
      length: 5000 
    });
    
    const items = mediaInfo.data || [];
    console.log(`[TautulliAnalyzerService] Retrieved ${items.length} items for library ${libraryId}`);
    
    if (!items || items.length === 0) {
      console.warn(`[TautulliAnalyzerService] No items found in library ${libraryId}`);
      throw this.createError('No items found in library', 404);
    }

    const sizeAnalysis = await this.generateSizeAnalysis(items);
    cache.set(cacheKey, sizeAnalysis, this.CACHE_TTL);
    
    return sizeAnalysis;
  }

  /**
   * Get quality analysis for a library
   */
  async getQualityAnalysis(libraryId: string): Promise<QualityAnalysis> {
    const cacheKey = `${this.CACHE_PREFIX}quality:${libraryId}`;
    const cached = cache.get<QualityAnalysis>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const mediaInfo = await tautulliService.getLibraryMediaInfo(libraryId, { length: 5000 });
    const items = mediaInfo.data || [];
    
    if (!items || items.length === 0) {
      throw this.createError('No items found in library', 404);
    }

    const qualityAnalysis = await this.generateQualityAnalysis(items);
    cache.set(cacheKey, qualityAnalysis, this.CACHE_TTL);
    
    return qualityAnalysis;
  }

  /**
   * Get content analysis for a library
   */
  async getContentAnalysis(libraryId: string): Promise<ContentAnalysis> {
    const cacheKey = `${this.CACHE_PREFIX}content:${libraryId}`;
    const cached = cache.get<ContentAnalysis>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const mediaInfo = await tautulliService.getLibraryMediaInfo(libraryId, { length: 5000 });
    const items = mediaInfo.data || [];
    
    if (!items || items.length === 0) {
      throw this.createError('No items found in library', 404);
    }

    const contentAnalysis = await this.generateContentAnalysis(items);
    cache.set(cacheKey, contentAnalysis, this.CACHE_TTL);
    
    return contentAnalysis;
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
  private async generateSizeAnalysis(items: any[]): Promise<SizeAnalysis> {
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

    // Sort by file size (largest first)
    const largestFiles = mediaFiles
      .sort((a, b) => b.fileSize - a.fileSize)
      .slice(0, 50); // Top 50

    // Calculate size distribution
    const sizeDistribution = this.calculateSizeDistribution(mediaFiles);
    
    // Calculate average file size
    const totalSize = mediaFiles.reduce((sum, file) => sum + file.fileSize, 0);
    const averageFileSize = mediaFiles.length > 0 ? totalSize / mediaFiles.length : 0;

    return {
      largestFiles,
      sizeDistribution,
      averageFileSize
    };
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
   * Create standardized error
   */
  private createError(message: string, statusCode: number): ApiError {
    const error = new Error(message) as ApiError;
    error.statusCode = statusCode;
    return error;
  }
}

export const tautulliAnalyzerService = new TautulliAnalyzerService();