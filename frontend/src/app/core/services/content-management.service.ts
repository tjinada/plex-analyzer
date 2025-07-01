import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError, combineLatest, of } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { 
  ContentSummary,
  QueueItem,
  ServicesStatus,
  ApiResponse,
  WantedMovie,
  MissingMovie,
  WantedEpisode,
  MissingEpisode,
  QueueSummary
} from '../../models/arr-models';
import { RadarrService } from './radarr.service';
import { SonarrService } from './sonarr.service';

@Injectable({
  providedIn: 'root'
})
export class ContentManagementService {
  private readonly baseUrl = '/api/content';
  
  // Loading states
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  // Error states
  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();
  
  // Content summary cache
  private contentSummarySubject = new BehaviorSubject<ContentSummary | null>(null);
  public contentSummary$ = this.contentSummarySubject.asObservable();
  
  // Services status cache
  private servicesStatusSubject = new BehaviorSubject<ServicesStatus | null>(null);
  public servicesStatus$ = this.servicesStatusSubject.asObservable();

  constructor(
    private radarrService: RadarrService,
    private sonarrService: SonarrService
  ) {}

  /**
   * Get comprehensive content summary from both services
   */
  getContentSummary(forceRefresh: boolean = false): Observable<ContentSummary> {
    // Return cached data if available and not forcing refresh
    if (!forceRefresh && this.contentSummarySubject.value) {
      return of(this.contentSummarySubject.value);
    }

    this.setLoading(true);
    this.clearError();

    return combineLatest([
      this.getWantedCounts(),
      this.getMissingCounts(),
      this.getQueueSummary()
    ]).pipe(
      map(([wanted, missing, queue]) => {
        const summary: ContentSummary = {
          wanted,
          missing,
          queue
        };
        this.contentSummarySubject.next(summary);
        return summary;
      }),
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError('Failed to fetch content summary', error))
    );
  }

  /**
   * Get combined download queue from both services
   */
  getCombinedQueue(): Observable<QueueItem[]> {
    this.setLoading(true);
    this.clearError();

    return combineLatest([
      this.radarrService.getQueue().pipe(catchError(() => of([]))),
      this.sonarrService.getQueue().pipe(catchError(() => of([])))
    ]).pipe(
      map(([radarrQueue, sonarrQueue]) => {
        // Add service source to items
        const radarrItems = radarrQueue.map(item => ({ ...item, sourceService: 'radarr' as const }));
        const sonarrItems = sonarrQueue.map(item => ({ ...item, sourceService: 'sonarr' as const }));
        
        // Combine and sort by priority/status
        return [...radarrItems, ...sonarrItems].sort((a, b) => {
          // Sort downloading items first, then by size (largest first)
          if (a.status === 'downloading' && b.status !== 'downloading') return -1;
          if (b.status === 'downloading' && a.status !== 'downloading') return 1;
          return b.size - a.size;
        });
      }),
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError('Failed to fetch combined queue', error))
    );
  }

  /**
   * Get services connection status
   */
  getServicesStatus(forceRefresh: boolean = false): Observable<ServicesStatus> {
    // Return cached data if available and not forcing refresh
    if (!forceRefresh && this.servicesStatusSubject.value) {
      return of(this.servicesStatusSubject.value);
    }

    this.setLoading(true);
    this.clearError();

    return combineLatest([
      this.radarrService.testConnection().pipe(catchError((error) => {
        console.warn('Radarr connection test failed:', error);
        return of({ connected: false, message: 'Connection failed' });
      })),
      this.sonarrService.testConnection().pipe(catchError((error) => {
        console.warn('Sonarr connection test failed:', error);
        return of({ connected: false, message: 'Connection failed' });
      }))
    ]).pipe(
      map(([radarrTest, sonarrTest]) => {
        const status: ServicesStatus = {
          radarr: {
            configured: true, // Assume configured if we can attempt connection
            connected: radarrTest.connected,
            error: radarrTest.connected ? undefined : radarrTest.message
          },
          sonarr: {
            configured: true, // Assume configured if we can attempt connection
            connected: sonarrTest.connected,
            error: sonarrTest.connected ? undefined : sonarrTest.message
          }
        };
        this.servicesStatusSubject.next(status);
        return status;
      }),
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError('Failed to check services status', error))
    );
  }

  /**
   * Get all wanted content (movies + episodes)
   */
  getAllWantedContent(): Observable<{movies: WantedMovie[], episodes: WantedEpisode[]}> {
    this.setLoading(true);
    this.clearError();

    return combineLatest([
      this.radarrService.getWantedMovies().pipe(catchError(() => of([]))),
      this.sonarrService.getWantedEpisodes().pipe(catchError(() => of([])))
    ]).pipe(
      map(([movies, episodes]) => ({ movies, episodes })),
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError('Failed to fetch wanted content', error))
    );
  }

  /**
   * Get all missing content (movies + episodes)
   */
  getAllMissingContent(): Observable<{movies: MissingMovie[], episodes: MissingEpisode[]}> {
    this.setLoading(true);
    this.clearError();

    return combineLatest([
      this.radarrService.getMissingMovies().pipe(catchError(() => of([]))),
      this.sonarrService.getMissingEpisodes().pipe(catchError(() => of([])))
    ]).pipe(
      map(([movies, episodes]) => ({ movies, episodes })),
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError('Failed to fetch missing content', error))
    );
  }

  /**
   * Trigger search for specific content
   */
  triggerSearch(contentType: 'movie' | 'episode' | 'series', id: number | number[]): Observable<any> {
    this.setLoading(true);
    this.clearError();

    let searchObservable: Observable<any>;

    switch (contentType) {
      case 'movie':
        searchObservable = this.radarrService.searchMovie(id as number);
        break;
      case 'episode':
        searchObservable = this.sonarrService.searchEpisodes(id as number[]);
        break;
      case 'series':
        searchObservable = this.sonarrService.searchSeries(id as number);
        break;
      default:
        return throwError(() => 'Invalid content type for search');
    }

    return searchObservable.pipe(
      tap(() => {
        this.setLoading(false);
        // Refresh content summary after search
        setTimeout(() => this.refreshContentSummary(), 2000);
      }),
      catchError(error => this.handleError(`Failed to trigger ${contentType} search`, error))
    );
  }

  /**
   * Remove item from download queue
   */
  removeFromQueue(service: 'radarr' | 'sonarr', queueId: number, options: { removeFromClient?: boolean, blacklist?: boolean } = {}): Observable<any> {
    this.setLoading(true);
    this.clearError();

    const serviceInstance = service === 'radarr' ? this.radarrService : this.sonarrService;
    
    return serviceInstance.removeFromQueue(queueId, options.removeFromClient, options.blacklist).pipe(
      tap(() => {
        this.setLoading(false);
        // Refresh queue after removal
        setTimeout(() => this.refreshContentSummary(), 1000);
      }),
      catchError(error => this.handleError(`Failed to remove item from ${service} queue`, error))
    );
  }

  /**
   * Check if both services are available
   */
  areServicesAvailable(): Observable<boolean> {
    return combineLatest([
      this.radarrService.isServiceAvailable(),
      this.sonarrService.isServiceAvailable()
    ]).pipe(
      map(([radarrAvailable, sonarrAvailable]) => radarrAvailable || sonarrAvailable),
      catchError(() => of(false))
    );
  }

  /**
   * Refresh all cached data
   */
  refreshAllData(): Observable<void> {
    return this.getContentSummary(true).pipe(
      switchMap(() => this.getServicesStatus(true)),
      map(() => void 0),
      catchError(error => this.handleError('Failed to refresh data', error))
    );
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.contentSummarySubject.next(null);
    this.servicesStatusSubject.next(null);
    this.radarrService.clearCache();
    this.sonarrService.clearCache();
    this.clearError();
  }

  /**
   * Get wanted content counts
   */
  private getWantedCounts(): Observable<{movies: number, episodes: number}> {
    return combineLatest([
      this.radarrService.getWantedMovies().pipe(
        map(movies => movies.length),
        catchError(() => of(0))
      ),
      this.sonarrService.getWantedEpisodes().pipe(
        map(episodes => episodes.length),
        catchError(() => of(0))
      )
    ]).pipe(
      map(([movies, episodes]) => ({ movies, episodes }))
    );
  }

  /**
   * Get missing content counts
   */
  private getMissingCounts(): Observable<{movies: number, episodes: number}> {
    return combineLatest([
      this.radarrService.getMissingMovies().pipe(
        map(movies => movies.length),
        catchError(() => of(0))
      ),
      this.sonarrService.getMissingEpisodes().pipe(
        map(episodes => episodes.length),
        catchError(() => of(0))
      )
    ]).pipe(
      map(([movies, episodes]) => ({ movies, episodes }))
    );
  }

  /**
   * Get combined queue summary
   */
  private getQueueSummary(): Observable<{totalItems: number, totalSize: number, downloading: number, completed: number, failed: number}> {
    return combineLatest([
      this.radarrService.getQueueSummary().pipe(catchError(() => of({
        totalItems: 0, totalSize: 0, totalSizeLeft: 0,
        downloading: 0, completed: 0, failed: 0, paused: 0, items: []
      } as QueueSummary))),
      this.sonarrService.getQueueSummary().pipe(catchError(() => of({
        totalItems: 0, totalSize: 0, totalSizeLeft: 0,
        downloading: 0, completed: 0, failed: 0, paused: 0, items: []
      } as QueueSummary)))
    ]).pipe(
      map(([radarrSummary, sonarrSummary]) => ({
        totalItems: radarrSummary.totalItems + sonarrSummary.totalItems,
        totalSize: radarrSummary.totalSize + sonarrSummary.totalSize,
        downloading: radarrSummary.downloading + sonarrSummary.downloading,
        completed: radarrSummary.completed + sonarrSummary.completed,
        failed: radarrSummary.failed + sonarrSummary.failed
      }))
    );
  }

  /**
   * Refresh content summary
   */
  private refreshContentSummary(): void {
    this.getContentSummary(true).subscribe();
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
    console.error('[ContentManagementService]', message, error);
    
    return throwError(() => errorMessage);
  }
}