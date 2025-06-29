import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';

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

@Injectable({
  providedIn: 'root'
})
export class AnalyzerService {
  
  constructor(private apiService: ApiService) {}

  /**
   * Get comprehensive library analysis
   */
  getLibraryAnalysis(libraryId: string): Observable<LibraryAnalysis> {
    return this.apiService.get<any>(`/analyzer/library/${libraryId}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get size analysis for a library
   */
  getSizeAnalysis(libraryId: string, limit?: number): Observable<SizeAnalysis> {
    const params: { [key: string]: string } = {};
    if (limit && (limit > 0 || limit === -1)) {
      params['limit'] = limit.toString();
    }
    return this.apiService.get<any>(`/analyzer/library/${libraryId}/size`, params).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get quality analysis for a library
   */
  getQualityAnalysis(libraryId: string, limit?: number): Observable<QualityAnalysis> {
    const params: { [key: string]: string } = {};
    if (limit && (limit > 0 || limit === -1)) {
      params['limit'] = limit.toString();
    }
    return this.apiService.get<any>(`/analyzer/library/${libraryId}/quality`, params).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get content analysis for a library
   */
  getContentAnalysis(libraryId: string, limit?: number): Observable<ContentAnalysis> {
    const params: { [key: string]: string } = {};
    if (limit && (limit > 0 || limit === -1)) {
      params['limit'] = limit.toString();
    }
    return this.apiService.get<any>(`/analyzer/library/${libraryId}/content`, params).pipe(
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