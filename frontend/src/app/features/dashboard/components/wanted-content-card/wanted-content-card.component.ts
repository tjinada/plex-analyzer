import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil, startWith, switchMap } from 'rxjs/operators';

import { ContentManagementService } from '../../../../core/services/content-management.service';
import { WantedMovie, WantedEpisode } from '../../../../models/arr-models';

@Component({
  selector: 'app-wanted-content-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatTooltipModule,
    MatMenuModule
  ],
  template: `
    <mat-card class="wanted-content-card">
      <mat-card-header>
        <div mat-card-avatar class="card-avatar">
          <mat-icon>download_for_offline</mat-icon>
        </div>
        <mat-card-title>Wanted Content</mat-card-title>
        <mat-card-subtitle>Monitored content without files</mat-card-subtitle>
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
            <button mat-menu-item (click)="viewAllWanted()">
              <mat-icon>list</mat-icon>
              <span>View All</span>
            </button>
            <button mat-menu-item (click)="triggerSearchAll()">
              <mat-icon>search</mat-icon>
              <span>Search All</span>
            </button>
          </mat-menu>
        </div>
      </mat-card-header>

      <mat-card-content>
        <div *ngIf="loading$ | async" class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading wanted content...</p>
        </div>

        <div *ngIf="error$ | async as error" class="error-container">
          <mat-icon color="warn">error</mat-icon>
          <p>{{ error }}</p>
          <button mat-stroked-button (click)="refreshData()">Retry</button>
        </div>

        <div *ngIf="!(loading$ | async) && !(error$ | async)" class="content-stats">
          <!-- Summary Statistics -->
          <div class="stats-grid">
            <div class="stat-item movies">
              <div class="service-badge radarr">
                <mat-icon>movie</mat-icon>
                <span>Radarr</span>
              </div>
              <div class="stat-number">{{ totalWantedMovies }}</div>
              <div class="stat-label">Movies</div>
            </div>
            <div class="stat-item episodes">
              <div class="service-badge sonarr">
                <mat-icon>tv</mat-icon>
                <span>Sonarr</span>
              </div>
              <div class="stat-number">{{ totalWantedEpisodes }}</div>
              <div class="stat-label">Episodes</div>
            </div>
          </div>

          <!-- Recent Wanted Items -->
          <div class="recent-items" *ngIf="recentWantedItems.length > 0">
            <h4>Recent Additions</h4>
            <div class="item-list">
              <div *ngFor="let item of recentWantedItems" class="wanted-item">
                <div class="item-info">
                  <div class="item-title">{{ getItemTitle(item) }}</div>
                  <div class="item-subtitle">{{ getItemSubtitle(item) }}</div>
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

          <!-- Empty State -->
          <div *ngIf="totalWantedMovies === 0 && totalWantedEpisodes === 0" class="empty-state">
            <mat-icon>check_circle</mat-icon>
            <h3>No Wanted Content</h3>
            <p>All monitored content has been downloaded!</p>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .wanted-content-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .card-avatar {
      background-color: #ff9800;
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
    }

    .stat-item.movies {
      background-color: rgba(33, 150, 243, 0.08);
      border: 2px solid #2196f3;
    }

    .stat-item.episodes {
      background-color: rgba(156, 39, 176, 0.08);
      border: 2px solid #9c27b0;
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
      background-color: #2196f3;
      color: white;
    }

    .service-badge.sonarr {
      background-color: #9c27b0;
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

    .recent-items h4 {
      margin: 0 0 12px 0;
      color: #666;
      font-size: 14px;
      font-weight: 500;
    }

    .item-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .wanted-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background-color: rgba(0, 0, 0, 0.02);
      border-radius: 4px;
      border: 1px solid rgba(0, 0, 0, 0.05);
    }

    .item-info {
      flex: 1;
    }

    .item-title {
      font-size: 13px;
      font-weight: 500;
      color: #333;
      line-height: 1.2;
    }

    .item-subtitle {
      font-size: 11px;
      color: #666;
      margin-top: 2px;
    }

    .item-actions {
      margin-left: 8px;
    }

    .search-button {
      color: #ff9800;
    }

    .search-button:hover {
      background-color: rgba(255, 152, 0, 0.1);
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
export class WantedContentCardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Observables
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  
  // Data properties
  totalWantedMovies = 0;
  totalWantedEpisodes = 0;
  recentWantedItems: (WantedMovie | WantedEpisode)[] = [];

  constructor(
    private contentManagementService: ContentManagementService
  ) {
    this.loading$ = this.contentManagementService.loading$;
    this.error$ = this.contentManagementService.error$;
  }

  ngOnInit(): void {
    this.loadWantedContent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load wanted content data
   */
  loadWantedContent(): void {
    this.contentManagementService.getAllWantedContent()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.totalWantedMovies = data.movies.length;
          this.totalWantedEpisodes = data.episodes.length;
          
          // Get recent items (last 5 items, sorted by date added)
          const allItems = [...data.movies, ...data.episodes];
          this.recentWantedItems = allItems
            .sort((a, b) => {
              const dateA = this.getItemDate(a);
              const dateB = this.getItemDate(b);
              return dateB.getTime() - dateA.getTime();
            })
            .slice(0, 5);
        },
        error: (error) => {
          console.error('Failed to load wanted content:', error);
        }
      });
  }

  /**
   * Refresh data
   */
  refreshData(): void {
    this.loadWantedContent();
  }

  /**
   * Get display title for item
   */
  getItemTitle(item: WantedMovie | WantedEpisode): string {
    if ('title' in item && 'year' in item) {
      // Movie
      return `${item.title} (${item.year})`;
    } else {
      // Episode
      const episode = item as WantedEpisode;
      return `${episode.series.title} - S${episode.seasonNumber.toString().padStart(2, '0')}E${episode.episodeNumber.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Get subtitle for item
   */
  getItemSubtitle(item: WantedMovie | WantedEpisode): string {
    if ('title' in item && 'year' in item) {
      // Movie
      const movie = item as WantedMovie;
      return movie.status === 'announced' ? 'Not yet available' : 'Available for download';
    } else {
      // Episode
      const episode = item as WantedEpisode;
      return episode.title || `Episode ${episode.episodeNumber}`;
    }
  }

  /**
   * Trigger search for specific item
   */
  triggerSearch(item: WantedMovie | WantedEpisode): void {
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
   * Trigger search for all wanted content
   */
  triggerSearchAll(): void {
    // This would be implemented to trigger searches for all wanted content
    // For now, just log the action
    console.log('Trigger search for all wanted content - not yet implemented');
  }

  /**
   * View all wanted content in detail
   */
  viewAllWanted(): void {
    // This would navigate to a detailed view of all wanted content
    // For now, just log the action
    console.log('View all wanted content - not yet implemented');
  }

  /**
   * Get date for sorting (handles difference between movies and episodes)
   */
  private getItemDate(item: WantedMovie | WantedEpisode): Date {
    if ('added' in item) {
      // Movie - has 'added' property
      return new Date(item.added);
    } else {
      // Episode - use series added date or air date
      const episode = item as WantedEpisode;
      return new Date(episode.series.added || episode.airDate);
    }
  }
}