import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ContentManagementService } from '../../../../core/services/content-management.service';
import { MissingMovie, MissingEpisode } from '../../../../models/arr-models';

@Component({
  selector: 'app-missing-content-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatTooltipModule,
    MatMenuModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <mat-card class="missing-content-card">
      <mat-card-header>
        <div mat-card-avatar class="card-avatar">
          <mat-icon>schedule</mat-icon>
        </div>
        <mat-card-title>Missing Content</mat-card-title>
        <mat-card-subtitle>Available but not downloaded</mat-card-subtitle>
        <div class="card-actions">
          <button mat-icon-button 
                  [disabled]="loading$ | async"
                  (click)="refreshData()"
                  matTooltip="Refresh data">
            <mat-icon>refresh</mat-icon>
          </button>
          <button mat-icon-button [matMenuTriggerFor]="menu" matTooltip="Options">
            <mat-icon>more_vert</mat-icon>
          </button>
          <mat-menu #menu="matMenu">
            <button mat-menu-item (click)="viewAllMissing()">
              <mat-icon>list</mat-icon>
              <span>View All</span>
            </button>
            <button mat-menu-item (click)="searchAllMissing()">
              <mat-icon>search</mat-icon>
              <span>Search All</span>
            </button>
            <button mat-menu-item (click)="sortByDate()">
              <mat-icon>sort</mat-icon>
              <span>Sort by Date</span>
            </button>
          </mat-menu>
        </div>
      </mat-card-header>

      <mat-card-content>
        <div *ngIf="loading$ | async" class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading missing content...</p>
        </div>

        <div *ngIf="error$ | async as error" class="error-container">
          <mat-icon color="warn">error</mat-icon>
          <p>{{ error }}</p>
          <button mat-stroked-button (click)="refreshData()">Retry</button>
        </div>

        <div *ngIf="!(loading$ | async) && !(error$ | async)" class="content-stats">
          <!-- Summary Statistics -->
          <div class="stats-grid">
            <div class="stat-item movies clickable" (click)="viewMissingMovies()">
              <div class="service-badge radarr">
                <mat-icon>movie</mat-icon>
                <span>Radarr</span>
              </div>
              <div class="stat-number">{{ totalMissingMovies }}</div>
              <div class="stat-label">Movies</div>
              <div class="click-hint" *ngIf="totalMissingMovies > 0">Click to view</div>
            </div>
            <div class="stat-item episodes clickable" (click)="viewMissingEpisodes()">
              <div class="service-badge sonarr">
                <mat-icon>tv</mat-icon>
                <span>Sonarr</span>
              </div>
              <div class="stat-number">{{ totalMissingEpisodes }}</div>
              <div class="stat-label">Episodes</div>
              <div class="click-hint" *ngIf="totalMissingEpisodes > 0">Click to view</div>
            </div>
          </div>

          <!-- Priority Missing Items -->
          <div class="priority-items" *ngIf="priorityMissingItems.length > 0">
            <h4>Recently Available</h4>
            <div class="item-list">
              <div *ngFor="let item of priorityMissingItems" class="missing-item">
                <div class="item-info">
                  <div class="item-title">{{ getItemTitle(item) }}</div>
                  <div class="item-subtitle">{{ getItemSubtitle(item) }}</div>
                  <div class="item-status">
                    <mat-chip class="availability-chip" [ngClass]="getAvailabilityClass(item)">
                      {{ getAvailabilityStatus(item) }}
                    </mat-chip>
                  </div>
                </div>
                <div class="item-actions">
                  <button mat-icon-button 
                          (click)="triggerSearch(item)"
                          matTooltip="Search for this item"
                          class="search-button">
                    <mat-icon>search</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Missing Series Summary (for TV shows) -->
          <div class="series-summary" *ngIf="missingSeries.length > 0">
            <h4>Series with Missing Episodes</h4>
            <div class="series-list">
              <div *ngFor="let series of missingSeries" class="series-item">
                <div class="series-info">
                  <div class="series-title">{{ series.title }}</div>
                  <div class="episode-count">{{ series.missingCount }} missing episodes</div>
                </div>
                <button mat-icon-button 
                        (click)="searchSeries(series.id)"
                        matTooltip="Search entire series">
                  <mat-icon>search</mat-icon>
                </button>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="totalMissingMovies === 0 && totalMissingEpisodes === 0" class="empty-state">
            <mat-icon>check_circle</mat-icon>
            <h3>No Missing Content</h3>
            <p>All available content has been downloaded!</p>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .missing-content-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .card-avatar {
      background-color: #ff5722;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-actions {
      margin-left: auto;
      display: flex;
      gap: 4px;
    }

    mat-card-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .loading-container,
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      gap: 16px;
    }

    .error-container mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .content-stats {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      border-radius: 8px;
      position: relative;
      min-height: 100px;
      justify-content: center;
      gap: 8px;
      transition: all 0.3s ease;
    }

    .stat-item.clickable {
      cursor: pointer;
    }

    .stat-item.clickable:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .stat-item.movies {
      background-color: rgba(255, 87, 34, 0.08);
      border: 2px solid #ff5722;
    }

    .stat-item.episodes {
      background-color: rgba(255, 152, 0, 0.08);
      border: 2px solid #ff9800;
    }

    .click-hint {
      position: absolute;
      bottom: 4px;
      font-size: 10px;
      color: #666;
      opacity: 0.7;
      font-style: italic;
    }

    .service-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 12px;
      position: absolute;
      top: 8px;
      left: 8px;
    }

    .service-badge.radarr {
      background-color: #ff5722;
      color: white;
    }

    .service-badge.sonarr {
      background-color: #ff9800;
      color: white;
    }

    .service-badge mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .stat-number {
      font-size: 28px;
      font-weight: bold;
      color: #333;
      margin-top: 8px;
    }

    .stat-label {
      font-size: 13px;
      color: #666;
      font-weight: 500;
    }

    .priority-items h4,
    .series-summary h4 {
      margin: 0 0 12px 0;
      color: #666;
      font-size: 14px;
      font-weight: 500;
    }

    .item-list,
    .series-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .missing-item,
    .series-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background-color: rgba(0, 0, 0, 0.02);
      border-radius: 4px;
      border: 1px solid rgba(0, 0, 0, 0.05);
    }

    .item-info,
    .series-info {
      flex: 1;
    }

    .item-title,
    .series-title {
      font-size: 13px;
      font-weight: 500;
      color: #333;
      line-height: 1.2;
    }

    .item-subtitle,
    .episode-count {
      font-size: 11px;
      color: #666;
      margin-top: 2px;
    }

    .item-status {
      margin-top: 4px;
    }

    .availability-chip {
      font-size: 10px;
      min-height: 18px;
      line-height: 18px;
    }

    .availability-chip.available {
      background-color: rgba(76, 175, 80, 0.2);
      color: #2e7d32;
    }

    .availability-chip.upcoming {
      background-color: rgba(255, 193, 7, 0.2);
      color: #f57c00;
    }

    .availability-chip.unknown {
      background-color: rgba(158, 158, 158, 0.2);
      color: #616161;
    }

    .item-actions {
      margin-left: 8px;
    }

    .search-button {
      color: #ff5722;
    }

    .search-button:hover {
      background-color: rgba(255, 87, 34, 0.1);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      gap: 12px;
      padding: 24px;
      text-align: center;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #4caf50;
    }

    .empty-state h3 {
      margin: 0;
      color: #333;
      font-size: 16px;
    }

    .empty-state p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
      
      .stat-item {
        min-height: 60px;
        padding: 12px;
      }
      
      .stat-number {
        font-size: 20px;
      }
    }
  `]
})
export class MissingContentCardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Observables
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  
  // Data properties
  totalMissingMovies = 0;
  totalMissingEpisodes = 0;
  priorityMissingItems: (MissingMovie | MissingEpisode)[] = [];
  missingSeries: Array<{id: number, title: string, missingCount: number}> = [];

  constructor(
    private contentManagementService: ContentManagementService,
    private dialog: MatDialog
  ) {
    this.loading$ = this.contentManagementService.loading$;
    this.error$ = this.contentManagementService.error$;
  }

  ngOnInit(): void {
    this.loadMissingContent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load missing content data
   */
  loadMissingContent(): void {
    this.contentManagementService.getAllMissingContent()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.totalMissingMovies = data.movies.length;
          this.totalMissingEpisodes = data.episodes.length;
          
          // Debug logging
          console.log('Missing content debug:', {
            movies: this.totalMissingMovies,
            episodes: this.totalMissingEpisodes,
            rawMoviesData: data.movies,
            rawEpisodesData: data.episodes
          });
          
          // Get priority items (recently available, sorted by availability date)
          const allItems = [...data.movies, ...data.episodes];
          this.priorityMissingItems = allItems
            .filter(item => this.isRecentlyAvailable(item))
            .sort((a, b) => this.getAvailabilityDate(b).getTime() - this.getAvailabilityDate(a).getTime())
            .slice(0, 5);

          // Group episodes by series for series summary
          this.groupEpisodesBySeries(data.episodes);
        },
        error: (error) => {
          console.error('Failed to load missing content:', error);
        }
      });
  }

  /**
   * Group episodes by series
   */
  private groupEpisodesBySeries(episodes: MissingEpisode[]): void {
    const seriesMap = new Map<number, {id: number, title: string, missingCount: number}>();
    
    episodes.forEach(episode => {
      const seriesId = episode.seriesId;
      if (seriesMap.has(seriesId)) {
        seriesMap.get(seriesId)!.missingCount++;
      } else {
        seriesMap.set(seriesId, {
          id: seriesId,
          title: episode.series.title,
          missingCount: 1
        });
      }
    });

    this.missingSeries = Array.from(seriesMap.values())
      .sort((a, b) => b.missingCount - a.missingCount)
      .slice(0, 5);
  }

  /**
   * Check if item is recently available
   */
  private isRecentlyAvailable(item: MissingMovie | MissingEpisode): boolean {
    const availabilityDate = this.getAvailabilityDate(item);
    const now = new Date();
    const daysDiff = (now.getTime() - availabilityDate.getTime()) / (1000 * 3600 * 24);
    return daysDiff <= 30; // Recently available = within last 30 days
  }

  /**
   * Get availability date for item
   */
  private getAvailabilityDate(item: MissingMovie | MissingEpisode): Date {
    if ('physicalRelease' in item) {
      // Movie
      const movie = item as MissingMovie;
      return new Date(movie.physicalRelease || movie.digitalRelease || movie.inCinemas);
    } else {
      // Episode
      const episode = item as MissingEpisode;
      return new Date(episode.airDate);
    }
  }

  /**
   * Refresh data
   */
  refreshData(): void {
    this.loadMissingContent();
  }

  /**
   * Get display title for item
   */
  getItemTitle(item: MissingMovie | MissingEpisode): string {
    if ('title' in item && 'year' in item) {
      // Movie
      return `${item.title} (${item.year})`;
    } else {
      // Episode
      const episode = item as MissingEpisode;
      return `${episode.series.title} - S${episode.seasonNumber.toString().padStart(2, '0')}E${episode.episodeNumber.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Get subtitle for item
   */
  getItemSubtitle(item: MissingMovie | MissingEpisode): string {
    if ('title' in item && 'year' in item) {
      // Movie
      const movie = item as MissingMovie;
      const releaseDate = movie.physicalRelease || movie.digitalRelease || movie.inCinemas;
      return releaseDate ? `Available since ${new Date(releaseDate).toLocaleDateString()}` : 'Release date unknown';
    } else {
      // Episode
      const episode = item as MissingEpisode;
      return episode.title || `Aired ${new Date(episode.airDate).toLocaleDateString()}`;
    }
  }

  /**
   * Get availability status
   */
  getAvailabilityStatus(item: MissingMovie | MissingEpisode): string {
    if ('title' in item && 'year' in item) {
      // Movie
      const movie = item as MissingMovie;
      if (movie.isAvailable) return 'Available';
      if (movie.status === 'announced') return 'Upcoming';
      return 'Unknown';
    } else {
      // Episode
      const episode = item as MissingEpisode;
      const airDate = new Date(episode.airDate);
      const now = new Date();
      return airDate <= now ? 'Available' : 'Upcoming';
    }
  }

  /**
   * Get availability CSS class
   */
  getAvailabilityClass(item: MissingMovie | MissingEpisode): string {
    const status = this.getAvailabilityStatus(item);
    return status.toLowerCase();
  }

  /**
   * Trigger search for specific item
   */
  triggerSearch(item: MissingMovie | MissingEpisode): void {
    if ('title' in item && 'year' in item) {
      // Movie
      this.contentManagementService.triggerSearch('movie', item.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log(`Search triggered for movie: ${item.title}`);
          },
          error: (error) => {
            console.error('Failed to trigger movie search:', error);
          }
        });
    } else {
      // Episode
      this.contentManagementService.triggerSearch('episode', [item.id])
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log(`Search triggered for episode: ${item.id}`);
          },
          error: (error) => {
            console.error('Failed to trigger episode search:', error);
          }
        });
    }
  }

  /**
   * Search entire series
   */
  searchSeries(seriesId: number): void {
    this.contentManagementService.triggerSearch('series', seriesId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log(`Search triggered for series: ${seriesId}`);
        },
        error: (error) => {
          console.error('Failed to trigger series search:', error);
        }
      });
  }

  /**
   * Search all missing content
   */
  searchAllMissing(): void {
    console.log('Search all missing content - not yet implemented');
  }

  /**
   * View all missing content
   */
  viewAllMissing(): void {
    console.log('View all missing content - not yet implemented');
  }

  /**
   * Sort by date
   */
  sortByDate(): void {
    console.log('Sort by date - not yet implemented');
  }

  /**
   * View missing movies in detail
   */
  viewMissingMovies(): void {
    if (this.totalMissingMovies === 0) return;
    
    this.contentManagementService.getAllMissingContent()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.openContentDialog('Missing Movies', data.movies, 'movie');
        },
        error: (error) => {
          console.error('Failed to load missing movies for dialog:', error);
        }
      });
  }

  /**
   * View missing episodes in detail
   */
  viewMissingEpisodes(): void {
    if (this.totalMissingEpisodes === 0) return;
    
    this.contentManagementService.getAllMissingContent()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.openContentDialog('Missing Episodes', data.episodes, 'episode');
        },
        error: (error) => {
          console.error('Failed to load missing episodes for dialog:', error);
        }
      });
  }

  /**
   * Open content detail dialog
   */
  private openContentDialog(title: string, items: any[], type: 'movie' | 'episode'): void {
    // Import the dialog component from the wanted content card
    import('../wanted-content-card/wanted-content-card.component').then(module => {
      this.dialog.open(module.ContentDetailDialogComponent, {
        width: '80%',
        maxWidth: '1000px',
        maxHeight: '80vh',
        data: {
          title,
          items,
          type,
          contentManagementService: this.contentManagementService
        }
      });
    });
  }
}