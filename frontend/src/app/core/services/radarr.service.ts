import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { 
  Movie, 
  WantedMovie, 
  MissingMovie, 
  QueueItem, 
  QualityProfile,
  MovieFilters,
  QueueFilters,
  MovieListResponse,
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
export class RadarrService {
  private readonly baseUrl = '/api/radarr';
  
  // Loading states
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  // Error states
  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get all movies from Radarr
   */
  getMovies(): Observable<Movie[]> {
    this.setLoading(true);
    this.clearError();
    
    return this.http.get<MovieListResponse>(`${this.baseUrl}/movies`).pipe(
      map(response => response.movies),
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError('Failed to fetch movies', error))
    );
  }

  /**
   * Get wanted movies with optional filters
   */
  getWantedMovies(filters?: MovieFilters): Observable<WantedMovie[]> {
    this.setLoading(true);
    this.clearError();
    
    let params = new HttpParams();
    if (filters) {
      params = this.buildMovieFiltersParams(params, filters);
    }

    return this.http.get<MovieListResponse>(`${this.baseUrl}/wanted`, { params }).pipe(
      map(response => response.movies as WantedMovie[]),
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError('Failed to fetch wanted movies', error))
    );
  }

  /**
   * Get missing movies with optional filters
   */
  getMissingMovies(filters?: MovieFilters): Observable<MissingMovie[]> {
    this.setLoading(true);
    this.clearError();
    
    let params = new HttpParams();
    if (filters) {
      params = this.buildMovieFiltersParams(params, filters);
    }

    return this.http.get<MovieListResponse>(`${this.baseUrl}/missing`, { params }).pipe(
      map(response => response.movies as MissingMovie[]),
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError('Failed to fetch missing movies', error))
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
   * Trigger manual search for a movie
   */
  searchMovie(movieId: number): Observable<SearchResponse> {
    this.setLoading(true);
    this.clearError();
    
    return this.http.post<SearchResponse>(`${this.baseUrl}/search/${movieId}`, {}).pipe(
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError(`Failed to trigger search for movie ${movieId}`, error))
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
   * Test Radarr connection
   */
  testConnection(): Observable<ConnectionTestResponse> {
    this.setLoading(true);
    this.clearError();
    
    return this.http.get<ConnectionTestResponse>(`${this.baseUrl}/test`).pipe(
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError('Failed to test Radarr connection', error))
    );
  }

  /**
   * Build HTTP params from movie filters
   */
  private buildMovieFiltersParams(params: HttpParams, filters: MovieFilters): HttpParams {
    if (filters.monitored !== undefined) {
      params = params.set('monitored', filters.monitored.toString());
    }
    if (filters.hasFile !== undefined) {
      params = params.set('hasFile', filters.hasFile.toString());
    }
    if (filters.qualityProfileId) {
      params = params.set('qualityProfileId', filters.qualityProfileId.toString());
    }
    if (filters.minimumAvailability) {
      params = params.set('minimumAvailability', filters.minimumAvailability);
    }
    if (filters.year) {
      params = params.set('year', filters.year.toString());
    }
    if (filters.genres && filters.genres.length > 0) {
      params = params.set('genres', filters.genres.join(','));
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
    if (filters.includeUnknownMovieItems !== undefined) {
      params = params.set('includeUnknownMovieItems', filters.includeUnknownMovieItems.toString());
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
    console.error('[RadarrService]', message, error);
    
    return throwError(() => errorMessage);
  }

  /**
   * Check if Radarr service is available
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
}