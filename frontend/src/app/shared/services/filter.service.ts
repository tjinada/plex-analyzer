import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface FilterState {
  searchText: string;
  fileType: string[];
  qualityTier: string[];
  resolution: string[];
  codec: string[];
}

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  
  private defaultState: FilterState = {
    searchText: '',
    fileType: [],
    qualityTier: [],
    resolution: [],
    codec: []
  };

  private filterState = new BehaviorSubject<FilterState>(this.defaultState);

  /**
   * Get current filter state as observable
   */
  getFilterState(): Observable<FilterState> {
    return this.filterState.asObservable();
  }

  /**
   * Get current filter state value
   */
  getCurrentFilters(): FilterState {
    return this.filterState.value;
  }

  /**
   * Update search text filter
   */
  updateSearchText(searchText: string): void {
    this.updateFilter({ searchText });
  }

  /**
   * Update file type filter
   */
  updateFileType(fileType: string[]): void {
    this.updateFilter({ fileType });
  }

  /**
   * Update quality tier filter
   */
  updateQualityTier(qualityTier: string[]): void {
    this.updateFilter({ qualityTier });
  }

  /**
   * Update resolution filter
   */
  updateResolution(resolution: string[]): void {
    this.updateFilter({ resolution });
  }

  /**
   * Update codec filter
   */
  updateCodec(codec: string[]): void {
    this.updateFilter({ codec });
  }

  /**
   * Clear all filters
   */
  clearAllFilters(): void {
    this.filterState.next(this.defaultState);
  }

  /**
   * Check if any filters are active
   */
  hasActiveFilters(): boolean {
    const current = this.filterState.value;
    return current.searchText !== '' ||
           current.fileType.length > 0 ||
           current.qualityTier.length > 0 ||
           current.resolution.length > 0 ||
           current.codec.length > 0;
  }

  /**
   * Get count of active filters
   */
  getActiveFilterCount(): number {
    const current = this.filterState.value;
    let count = 0;
    
    if (current.searchText !== '') count++;
    if (current.fileType.length > 0) count++;
    if (current.qualityTier.length > 0) count++;
    if (current.resolution.length > 0) count++;
    if (current.codec.length > 0) count++;
    
    return count;
  }

  /**
   * Update filter state partially
   */
  private updateFilter(updates: Partial<FilterState>): void {
    const currentState = this.filterState.value;
    const newState = { ...currentState, ...updates };
    this.filterState.next(newState);
  }
}