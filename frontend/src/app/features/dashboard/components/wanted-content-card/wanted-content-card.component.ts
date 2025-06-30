import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable, Subject, combineLatest } from 'rxjs';
import { Inject } from '@angular/core';
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
    MatMenuModule,
    MatDialogModule
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
            <div class="stat-item movies clickable" (click)="viewWantedMovies()">
              <div class="service-badge radarr">
                <mat-icon>movie</mat-icon>
                <span>Radarr</span>
              </div>
              <div class="stat-number">{{ totalWantedMovies }}</div>
              <div class="stat-label">Movies</div>
              <div class="click-hint" *ngIf="totalWantedMovies > 0">Click to view</div>
            </div>
            <div class="stat-item episodes clickable" (click)="viewWantedEpisodes()">
              <div class="service-badge sonarr">
                <mat-icon>tv</mat-icon>
                <span>Sonarr</span>
              </div>
              <div class="stat-number">{{ totalWantedEpisodes }}</div>
              <div class="stat-label">Episodes</div>
              <div class="click-hint" *ngIf="totalWantedEpisodes > 0">Click to view</div>
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
      background-color: rgba(33, 150, 243, 0.08);
      border: 2px solid #2196f3;
    }

    .stat-item.episodes {
      background-color: rgba(156, 39, 176, 0.08);
      border: 2px solid #9c27b0;
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
    private contentManagementService: ContentManagementService,
    private dialog: MatDialog
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
          
          // Debug logging
          console.log('Wanted content debug:', {
            movies: this.totalWantedMovies,
            episodes: this.totalWantedEpisodes,
            rawMoviesData: data.movies,
            rawEpisodesData: data.episodes
          });
          
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
   * View wanted movies in detail
   */
  viewWantedMovies(): void {
    if (this.totalWantedMovies === 0) return;
    
    this.contentManagementService.getAllWantedContent()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.openContentDialog('Wanted Movies', data.movies, 'movie');
        },
        error: (error) => {
          console.error('Failed to load wanted movies for dialog:', error);
        }
      });
  }

  /**
   * View wanted episodes in detail
   */
  viewWantedEpisodes(): void {
    if (this.totalWantedEpisodes === 0) return;
    
    this.contentManagementService.getAllWantedContent()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.openContentDialog('Wanted Episodes', data.episodes, 'episode');
        },
        error: (error) => {
          console.error('Failed to load wanted episodes for dialog:', error);
        }
      });
  }

  /**
   * Open content detail dialog
   */
  private openContentDialog(title: string, items: any[], type: 'movie' | 'episode'): void {
    this.dialog.open(ContentDetailDialogComponent, {
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

// Content Detail Dialog Component
@Component({
  selector: 'app-content-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatCardModule
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>{{ data.title }}</h2>
      <button mat-icon-button mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>
    
    <mat-dialog-content class="dialog-content">
      <div class="items-count">
        <span>{{ data.items.length }} items</span>
      </div>
      
      <div class="items-list">
        <div *ngFor="let item of data.items" class="content-item">
          <div class="item-info">
            <div class="item-title">{{ getDisplayTitle(item) }}</div>
            <div class="item-subtitle">{{ getDisplaySubtitle(item) }}</div>
            <div class="item-meta">
              <span class="meta-item" *ngIf="getDisplayYear(item)">{{ getDisplayYear(item) }}</span>
              <span class="meta-item" *ngIf="getDisplayQuality(item)">{{ getDisplayQuality(item) }}</span>
              <span class="meta-item status" [class]="getStatusClass(item)">{{ getDisplayStatus(item) }}</span>
            </div>
          </div>
          <div class="item-actions">
            <button mat-icon-button 
                    (click)="triggerSearch(item)"
                    matTooltip="Search for this item"
                    color="primary">
              <mat-icon>search</mat-icon>
            </button>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
      <button mat-raised-button color="primary" (click)="searchAll()">
        <mat-icon>search</mat-icon>
        Search All
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 24px;
      border-bottom: 1px solid #e0e0e0;
    }

    .dialog-header h2 {
      margin: 0;
      color: #333;
    }

    .dialog-content {
      padding: 24px;
      max-height: 60vh;
      overflow-y: auto;
    }

    .items-count {
      margin-bottom: 16px;
      padding: 8px 12px;
      background-color: rgba(33, 150, 243, 0.1);
      border-radius: 4px;
      font-size: 14px;
      color: #1976d2;
      font-weight: 500;
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .content-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background-color: #fafafa;
      transition: all 0.2s ease;
    }

    .content-item:hover {
      background-color: #f0f0f0;
      border-color: #ccc;
    }

    .item-info {
      flex: 1;
    }

    .item-title {
      font-size: 16px;
      font-weight: 500;
      color: #333;
      margin-bottom: 4px;
    }

    .item-subtitle {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }

    .item-meta {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .meta-item {
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 12px;
      background-color: rgba(0, 0, 0, 0.1);
      color: #666;
    }

    .meta-item.status {
      font-weight: 500;
    }

    .meta-item.status.announced {
      background-color: rgba(255, 193, 7, 0.2);
      color: #f57c00;
    }

    .meta-item.status.available {
      background-color: rgba(76, 175, 80, 0.2);
      color: #2e7d32;
    }

    .meta-item.status.missing {
      background-color: rgba(244, 67, 54, 0.2);
      color: #c62828;
    }

    .item-actions {
      margin-left: 16px;
    }
  `]
})
export class ContentDetailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ContentDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  getDisplayTitle(item: any): string {
    if (this.data.type === 'queue') {
      return item.title || 'Unknown Title';
    } else if (this.data.type === 'movie') {
      return `${item.title} (${item.year})`;
    } else {
      return `${item.series.title} - S${item.seasonNumber.toString().padStart(2, '0')}E${item.episodeNumber.toString().padStart(2, '0')}`;
    }
  }

  getDisplaySubtitle(item: any): string {
    if (this.data.type === 'queue') {
      const progress = item.size > 0 ? ((item.size - item.sizeleft) / item.size * 100).toFixed(1) : '0';
      return `${progress}% complete • ${item.downloadClient} • ${item.protocol}`;
    } else if (this.data.type === 'movie') {
      return item.overview ? item.overview.substring(0, 100) + '...' : 'No description available';
    } else {
      return item.title || `Episode ${item.episodeNumber}`;
    }
  }

  getDisplayYear(item: any): string {
    if (this.data.type === 'queue') {
      return item.sourceService === 'radarr' ? 'Movie' : 'TV Show';
    } else if (this.data.type === 'movie') {
      return item.year?.toString() || '';
    } else {
      return item.airDate ? new Date(item.airDate).getFullYear().toString() : '';
    }
  }

  getDisplayQuality(item: any): string {
    if (this.data.type === 'queue') {
      return item.quality?.quality?.name || 'Unknown Quality';
    } else {
      return item.monitored ? 'Monitored' : 'Not Monitored';
    }
  }

  getDisplayStatus(item: any): string {
    if (this.data.type === 'queue') {
      return item.status || 'Unknown';
    } else if (this.data.type === 'movie') {
      return item.status || 'Unknown';
    } else {
      return item.hasFile ? 'Available' : 'Missing';
    }
  }

  getStatusClass(item: any): string {
    const status = this.getDisplayStatus(item).toLowerCase();
    if (this.data.type === 'queue') {
      if (status.includes('downloading')) return 'available';
      if (status.includes('completed')) return 'available';
      if (status.includes('failed')) return 'missing';
      return 'announced';
    }
    if (status.includes('announced')) return 'announced';
    if (status.includes('available')) return 'available';
    return 'missing';
  }

  triggerSearch(item: any): void {
    if (this.data.type === 'queue') {
      // For queue items, we could cancel/remove instead of search
      console.log('Queue item action - not yet implemented');
      return;
    }
    
    const contentType = this.data.type === 'movie' ? 'movie' : 'episode';
    const itemId = this.data.type === 'movie' ? item.id : [item.id];
    
    this.data.contentManagementService.triggerSearch(contentType, itemId).subscribe({
      next: () => {
        console.log(`Search triggered for ${contentType}:`, item.id);
      },
      error: (error: any) => {
        console.error(`Failed to trigger search for ${contentType}:`, error);
      }
    });
  }

  searchAll(): void {
    // Trigger search for all items
    console.log('Search all items - not yet implemented');
    this.dialogRef.close();
  }
}