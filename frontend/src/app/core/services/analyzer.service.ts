import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AnalysisCacheService } from './analysis-cache.service';
import { PaginatedResponse } from '../../models/pagination.model';

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

export interface EnhancedMediaFile extends MediaFile {
  // Technical details
  videoProfile: string;
  bitDepth: number;
  colorSpace: string;
  colorRange: string;
  chromaSubsampling: string;
  frameRate: number;
  hdrFormat?: string;
  scanType: string;
  
  // Quality metrics
  videoBitrate: number;
  audioBitrate: number;
  overallBitrate: number;
  bitrateEfficiency: number;
  sourceType: string;
  releaseGroup?: string;
  encodingTool: string;
  
  // Quality scoring
  qualityScore: number;
  qualityTier: QualityTier;
  upgradeCandidate: boolean;
  upgradeReasons: string[];
}

export enum QualityTier {
  EXCELLENT = 'Excellent',
  GOOD = 'Good',
  FAIR = 'Fair',
  POOR = 'Poor'
}

export interface QualityDistribution {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
}

export interface CodecDistribution {
  [codec: string]: {
    count: number;
    totalSize: number;
    averageQuality: number;
    percentage: number;
  };
}

export interface TechnicalBreakdown {
  hdrContent: {
    count: number;
    percentage: number;
    formats: { [format: string]: number };
  };
  bitDepthDistribution: {
    [depth: string]: number;
  };
  colorSpaceDistribution: {
    [space: string]: number;
  };
}

export interface UpgradeRecommendation {
  fileId: string;
  title: string;
  currentQuality: QualityTier;
  recommendedUpgrade: string;
  reasons: string[];
  potentialSavings?: number;
}

export interface EnhancedSizeAnalysis extends SizeAnalysis {
  largestFiles: EnhancedMediaFile[];
  episodeBreakdown?: EnhancedMediaFile[];
  qualityDistribution: QualityDistribution;
  codecDistribution: CodecDistribution;
  technicalBreakdown: TechnicalBreakdown;
  upgradeRecommendations: UpgradeRecommendation[];
  // Episode-level metrics for TV shows
  episodeQualityDistribution?: QualityDistribution;
  episodeCodecDistribution?: CodecDistribution;
  episodeTechnicalBreakdown?: TechnicalBreakdown;
  episodeUpgradeRecommendations?: UpgradeRecommendation[];
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

@Injectable({
  providedIn: 'root'
})
export class AnalyzerService {
  
  constructor(
    private apiService: ApiService,
    private cacheService: AnalysisCacheService
  ) {}

  /**
   * Get comprehensive library analysis
   */
  getLibraryAnalysis(libraryId: string): Observable<LibraryAnalysis> {
    return this.apiService.get<any>(`/analyzer/library/${libraryId}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get size analysis for a library with caching and pagination support
   */
  getSizeAnalysis(libraryId: string, limit: number = 25, offset: number = 0): Observable<PaginatedResponse<SizeAnalysis>> {
    // Check cache first
    const cached = this.cacheService.get(libraryId, 'size', limit, offset);
    if (cached) {
      console.log(`[AnalyzerService] Returning cached size analysis for library ${libraryId}`);
      return new Observable(observer => {
        observer.next({
          success: true,
          data: cached.data,
          pagination: cached.pagination,
          timestamp: cached.timestamp.toISOString()
        });
        observer.complete();
      });
    }

    const params: { [key: string]: string } = {
      limit: limit.toString(),
      offset: offset.toString()
    };

    return this.apiService.get<PaginatedResponse<SizeAnalysis>>(`/analyzer/library/${libraryId}/size`, params).pipe(
      tap(response => {
        // Cache the response
        this.cacheService.set(libraryId, 'size', limit, response.data, response.pagination, offset);
      })
    );
  }

  /**
   * Get quality analysis for a library with caching and pagination support
   */
  getQualityAnalysis(libraryId: string, limit: number = 50, offset: number = 0): Observable<PaginatedResponse<QualityAnalysis>> {
    // Check cache first
    const cached = this.cacheService.get(libraryId, 'quality', limit, offset);
    if (cached) {
      console.log(`[AnalyzerService] Returning cached quality analysis for library ${libraryId}`);
      return new Observable(observer => {
        observer.next({
          success: true,
          data: cached.data,
          pagination: cached.pagination,
          timestamp: cached.timestamp.toISOString()
        });
        observer.complete();
      });
    }

    const params: { [key: string]: string } = {
      limit: limit.toString(),
      offset: offset.toString()
    };

    return this.apiService.get<PaginatedResponse<QualityAnalysis>>(`/analyzer/library/${libraryId}/quality`, params).pipe(
      tap(response => {
        // Cache the response
        this.cacheService.set(libraryId, 'quality', limit, response.data, response.pagination, offset);
      })
    );
  }

  /**
   * Get content analysis for a library with caching and pagination support
   */
  getContentAnalysis(libraryId: string, limit: number = 50, offset: number = 0): Observable<PaginatedResponse<ContentAnalysis>> {
    // Check cache first
    const cached = this.cacheService.get(libraryId, 'content', limit, offset);
    if (cached) {
      console.log(`[AnalyzerService] Returning cached content analysis for library ${libraryId}`);
      return new Observable(observer => {
        observer.next({
          success: true,
          data: cached.data,
          pagination: cached.pagination,
          timestamp: cached.timestamp.toISOString()
        });
        observer.complete();
      });
    }

    const params: { [key: string]: string } = {
      limit: limit.toString(),
      offset: offset.toString()
    };

    return this.apiService.get<PaginatedResponse<ContentAnalysis>>(`/analyzer/library/${libraryId}/content`, params).pipe(
      tap(response => {
        // Cache the response
        this.cacheService.set(libraryId, 'content', limit, response.data, response.pagination, offset);
      })
    );
  }

  /**
   * Get enhanced size analysis with quality metrics
   */
  getEnhancedSizeAnalysis(libraryId: string, limit: number = -1, offset: number = 0): Observable<PaginatedResponse<EnhancedSizeAnalysis>> {
    const params: { [key: string]: string } = {
      limit: limit.toString(),
      offset: offset.toString()
    };

    return this.apiService.get<PaginatedResponse<EnhancedSizeAnalysis>>(`/analyzer/library/${libraryId}/enhanced`, params);
  }

  /**
   * Get quality metrics overview for a library
   */
  getQualityMetrics(libraryId: string): Observable<{
    qualityDistribution: QualityDistribution;
    codecDistribution: CodecDistribution;
    technicalBreakdown: TechnicalBreakdown;
    upgradeRecommendations: UpgradeRecommendation[];
  }> {
    return this.apiService.get<any>(`/analyzer/library/${libraryId}/quality-metrics`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get upgrade recommendations for a library
   */
  getUpgradeRecommendations(libraryId: string): Observable<{
    recommendations: UpgradeRecommendation[];
    summary: {
      totalItems: number;
      upgradeOpportunities: number;
      qualityDistribution: QualityDistribution;
    };
  }> {
    return this.apiService.get<any>(`/analyzer/library/${libraryId}/upgrade-recommendations`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get technical analysis for a specific file
   */
  getFileAnalysis(fileId: string): Observable<any> {
    return this.apiService.get<any>(`/analyzer/file/${fileId}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Refresh analysis data for a library
   */
  refreshAnalysis(libraryId: string): Observable<any> {
    return this.apiService.post<any>(`/analyzer/library/${libraryId}/refresh`, {});
  }
}