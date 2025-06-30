import { Injectable } from '@angular/core';
import { CachedAnalysisData } from '../../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class AnalysisCacheService {
  private cache = new Map<string, CachedAnalysisData>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes TTL

  /**
   * Generate cache key for analysis data
   */
  private getCacheKey(libraryId: string, analysisType: string, limit: number, offset: number = 0): string {
    return `${libraryId}:${analysisType}:${limit}:${offset}`;
  }

  /**
   * Store analysis data in cache
   */
  set(
    libraryId: string,
    analysisType: string,
    limit: number,
    data: any,
    pagination: any,
    offset: number = 0
  ): void {
    const key = this.getCacheKey(libraryId, analysisType, limit, offset);
    const cachedData: CachedAnalysisData = {
      data,
      pagination,
      timestamp: new Date(),
      libraryId,
      limit
    };
    
    this.cache.set(key, cachedData);
    console.log(`[AnalysisCache] Cached ${analysisType} analysis for library ${libraryId}`);
  }

  /**
   * Retrieve analysis data from cache
   */
  get(libraryId: string, analysisType: string, limit: number, offset: number = 0): CachedAnalysisData | null {
    const key = this.getCacheKey(libraryId, analysisType, limit, offset);
    const cachedData = this.cache.get(key);
    
    if (!cachedData) {
      return null;
    }

    // Check if cache has expired
    const now = new Date();
    const age = now.getTime() - cachedData.timestamp.getTime();
    
    if (age > this.TTL) {
      console.log(`[AnalysisCache] Cache expired for ${analysisType} analysis of library ${libraryId}`);
      this.cache.delete(key);
      return null;
    }

    console.log(`[AnalysisCache] Retrieved cached ${analysisType} analysis for library ${libraryId}`);
    return cachedData;
  }

  /**
   * Check if analysis data is cached and fresh
   */
  has(libraryId: string, analysisType: string, limit: number, offset: number = 0): boolean {
    return this.get(libraryId, analysisType, limit, offset) !== null;
  }

  /**
   * Clear cache for specific library
   */
  clearLibrary(libraryId: string): void {
    const keysToDelete: string[] = [];
    
    for (const [key, data] of this.cache.entries()) {
      if (data.libraryId === libraryId) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`[AnalysisCache] Cleared cache for library ${libraryId}`);
  }

  /**
   * Clear cache for specific analysis type across all libraries
   */
  clearAnalysisType(analysisType: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(`:${analysisType}:`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`[AnalysisCache] Cleared cache for ${analysisType} analysis`);
  }

  /**
   * Clear entire cache
   */
  clearAll(): void {
    this.cache.clear();
    console.log(`[AnalysisCache] Cleared entire cache`);
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; entries: Array<{ key: string; age: number; libraryId: string }> } {
    const now = new Date();
    const entries = Array.from(this.cache.entries()).map(([key, data]) => ({
      key,
      age: now.getTime() - data.timestamp.getTime(),
      libraryId: data.libraryId
    }));

    return {
      size: this.cache.size,
      entries
    };
  }
}