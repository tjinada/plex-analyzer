import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { 
  Series, 
  Episode,
  WantedEpisode, 
  MissingEpisode, 
  QueueItem, 
  QualityProfile,
  EpisodeFilters,
  QueueFilters,
  EpisodeListResponse,
  QueueResponse,
  QualityProfileResponse,
  SearchResponse,
  QueueActionResponse,
  ConnectionTestResponse,
  QueueSummary
} from '../../models/arr-models';

@Injectable({
  providedIn: 'root'
})
export class SonarrService {
  private readonly baseUrl = '/api/sonarr';
  
  // Loading states
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  // Error states
  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get all series from Sonarr
   */
  getSeries(): Observable<Series[]> {
    this.setLoading(true);
    this.clearError();
    
    return this.http.get<{series: Series[], count: number}>(`${this.baseUrl}/series`).pipe(
      map(response => response.series),
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError('Failed to fetch series', error))
    );
  }

  /**
   * Get episodes for a specific series
   */
  getEpisodes(seriesId: number): Observable<Episode[]> {
    this.setLoading(true);
    this.clearError();
    
    return this.http.get<EpisodeListResponse>(`${this.baseUrl}/series/${seriesId}/episodes`).pipe(
      map(response => response.episodes),
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError(`Failed to fetch episodes for series ${seriesId}`, error))
    );
  }

  /**
   * Get wanted episodes with optional filters
   */
  getWantedEpisodes(filters?: EpisodeFilters): Observable<WantedEpisode[]> {
    this.setLoading(true);
    this.clearError();
    
    let params = new HttpParams();
    if (filters) {
      params = this.buildEpisodeFiltersParams(params, filters);
    }

    return this.http.get<EpisodeListResponse>(`${this.baseUrl}/wanted`, { params }).pipe(
      map(response => response.episodes as WantedEpisode[]),
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError('Failed to fetch wanted episodes', error))
    );
  }

  /**
   * Get missing episodes with optional filters
   */
  getMissingEpisodes(filters?: EpisodeFilters): Observable<MissingEpisode[]> {
    this.setLoading(true);
    this.clearError();
    
    let params = new HttpParams();
    if (filters) {
      params = this.buildEpisodeFiltersParams(params, filters);
    }

    return this.http.get<EpisodeListResponse>(`${this.baseUrl}/missing`, { params }).pipe(
      map(response => response.episodes as MissingEpisode[]),
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError('Failed to fetch missing episodes', error))
    );
  }

  /**
   * Get download queue with optional filters
   */
  getQueue(filters?: QueueFilters): Observable<QueueItem[]> {
    this.setLoading(true);
    this.clearError();
    
    let params = new HttpParams();
    if (filters) {
      params = this.buildQueueFiltersParams(params, filters);
    }

    return this.http.get<QueueResponse>(`${this.baseUrl}/queue`, { params }).pipe(
      map(response => response.queue),
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError('Failed to fetch queue', error))
    );
  }

  /**
   * Get queue summary statistics
   */
  getQueueSummary(): Observable<QueueSummary> {
    this.setLoading(true);
    this.clearError();
    
    return this.http.get<QueueSummary>(`${this.baseUrl}/queue/summary`).pipe(
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError('Failed to fetch queue summary', error))
    );
  }

  /**
   * Get quality profiles
   */
  getQualityProfiles(): Observable<QualityProfile[]> {
    this.setLoading(true);
    this.clearError();
    
    return this.http.get<QualityProfileResponse>(`${this.baseUrl}/quality-profiles`).pipe(
      map(response => response.profiles),
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError('Failed to fetch quality profiles', error))
    );
  }

  /**
   * Trigger manual search for episodes
   */
  searchEpisodes(episodeIds: number[]): Observable<SearchResponse> {
    this.setLoading(true);
    this.clearError();
    
    return this.http.post<SearchResponse>(`${this.baseUrl}/search/episodes`, { episodeIds }).pipe(
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError(`Failed to trigger search for episodes ${episodeIds.join(', ')}`, error))
    );
  }

  /**
   * Trigger manual search for entire series
   */
  searchSeries(seriesId: number): Observable<SearchResponse> {
    this.setLoading(true);
    this.clearError();
    
    return this.http.post<SearchResponse>(`${this.baseUrl}/search/series/${seriesId}`, {}).pipe(
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError(`Failed to trigger search for series ${seriesId}`, error))
    );
  }

  /**
   * Remove item from queue
   */
  removeFromQueue(queueId: number, removeFromClient: boolean = false, blacklist: boolean = false): Observable<QueueActionResponse> {
    this.setLoading(true);
    this.clearError();
    
    let params = new HttpParams()
      .set('removeFromClient', removeFromClient.toString())
      .set('blacklist', blacklist.toString());

    return this.http.delete<QueueActionResponse>(`${this.baseUrl}/queue/${queueId}`, { params }).pipe(
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError(`Failed to remove queue item ${queueId}`, error))
    );
  }

  /**
   * Test Sonarr connection
   */
  testConnection(): Observable<ConnectionTestResponse> {
    this.setLoading(true);
    this.clearError();
    
    return this.http.get<ConnectionTestResponse>(`${this.baseUrl}/test`).pipe(
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError('Failed to test Sonarr connection', error))
    );
  }

  /**
   * Build HTTP params from episode filters
   */
  private buildEpisodeFiltersParams(params: HttpParams, filters: EpisodeFilters): HttpParams {
    if (filters.seriesId) {
      params = params.set('seriesId', filters.seriesId.toString());
    }
    if (filters.seasonNumber !== undefined) {
      params = params.set('seasonNumber', filters.seasonNumber.toString());
    }
    if (filters.monitored !== undefined) {
      params = params.set('monitored', filters.monitored.toString());
    }
    if (filters.hasFile !== undefined) {
      params = params.set('hasFile', filters.hasFile.toString());
    }
    if (filters.airDateCutoff) {
      params = params.set('airDateCutoff', filters.airDateCutoff);
    }
    if (filters.sortBy) {
      params = params.set('sortBy', filters.sortBy);
      if (filters.sortDirection) {
        params = params.set('sortDirection', filters.sortDirection);
      }
    }
    return params;
  }

  /**
   * Build HTTP params from queue filters
   */
  private buildQueueFiltersParams(params: HttpParams, filters: QueueFilters): HttpParams {
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.protocol) {
      params = params.set('protocol', filters.protocol);
    }
    if (filters.downloadClient) {
      params = params.set('downloadClient', filters.downloadClient);
    }
    if (filters.includeUnknownSeriesItems !== undefined) {
      params = params.set('includeUnknownSeriesItems', filters.includeUnknownSeriesItems.toString());
    }
    return params;
  }

  /**
   * Set loading state
   */
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  /**
   * Clear error state
   */
  private clearError(): void {
    this.errorSubject.next(null);
  }

  /**
   * Handle service errors
   */
  private handleError(message: string, error: any): Observable<never> {
    this.setLoading(false);
    
    let errorMessage = message;
    if (error?.error?.message) {
      errorMessage = `${message}: ${error.error.message}`;
    } else if (error?.message) {
      errorMessage = `${message}: ${error.message}`;
    }
    
    this.errorSubject.next(errorMessage);
    console.error('[SonarrService]', message, error);
    
    return throwError(() => errorMessage);
  }

  /**
   * Check if Sonarr service is available
   */
  isServiceAvailable(): Observable<boolean> {
    return this.testConnection().pipe(
      map(response => response.connected),
      catchError(() => [false])
    );
  }

  /**
   * Clear all cached data (if needed for refresh)
   */
  clearCache(): void {
    this.clearError();
    // Can be extended to clear any cached data if implemented
  }

  /**
   * Helper method to get series by ID
   */
  getSeriesById(seriesId: number): Observable<Series | undefined> {
    return this.getSeries().pipe(
      map(series => series.find(s => s.id === seriesId))
    );
  }

  /**
   * Helper method to get episodes by series and season
   */
  getEpisodesBySeriesAndSeason(seriesId: number, seasonNumber: number): Observable<Episode[]> {
    const filters: EpisodeFilters = {
      seriesId,
      seasonNumber
    };
    
    return this.getEpisodes(seriesId).pipe(
      map(episodes => episodes.filter(ep => ep.seasonNumber === seasonNumber))
    );
  }
}