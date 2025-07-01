import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Observable, Subject, interval } from 'rxjs';
import { takeUntil, startWith, switchMap } from 'rxjs/operators';

import { ContentManagementService } from '../../../../core/services/content-management.service';
import { QueueItem, QueueSummary } from '../../../../models/arr-models';
import { BytesPipe } from '../../../../shared/pipes/bytes.pipe';

@Component({
  selector: 'app-download-queue-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatBadgeModule,
    MatTooltipModule,
    MatMenuModule,
    MatChipsModule,
    MatDialogModule,
    BytesPipe
  ],
  template: `
    <mat-card class="download-queue-card">
      <mat-card-header>
        <div mat-card-avatar class="card-avatar">
          <mat-icon>cloud_download</mat-icon>
        </div>
        <mat-card-title>Download Queue</mat-card-title>
        <mat-card-subtitle>Active downloads and queue</mat-card-subtitle>
        <div class="card-actions">
          <button mat-icon-button 
                  [disabled]="loading$ | async"
                  (click)="refreshData()"
                  matTooltip="Refresh queue">
            <mat-icon>refresh</mat-icon>
          </button>
          <button mat-icon-button [matMenuTriggerFor]="menu" matTooltip="Options">
            <mat-icon>more_vert</mat-icon>
          </button>
          <mat-menu #menu="matMenu">
            <button mat-menu-item (click)="viewFullQueue()">
              <mat-icon>list</mat-icon>
              <span>View Full Queue</span>
            </button>
            <button mat-menu-item (click)="pauseAll()" [disabled]="!hasActiveDownloads">
              <mat-icon>pause</mat-icon>
              <span>Pause All</span>
            </button>
            <button mat-menu-item (click)="clearCompleted()" [disabled]="completedCount === 0">
              <mat-icon>clear_all</mat-icon>
              <span>Clear Completed</span>
            </button>
          </mat-menu>
        </div>
      </mat-card-header>

      <mat-card-content>
        <div *ngIf="loading$ | async" class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading download queue...</p>
        </div>

        <div *ngIf="error$ | async as error" class="error-container">
          <mat-icon color="warn">error</mat-icon>
          <p>{{ error }}</p>
          <button mat-stroked-button (click)="refreshData()">Retry</button>
        </div>

        <div *ngIf="!(loading$ | async) && !(error$ | async)" class="content-stats">
          <!-- Queue Summary -->
          <div class="queue-summary">
            <div class="summary-header">
              <h4>Download Queue Summary</h4>
              <div class="service-indicators">
                <div class="service-badge radarr-sonarr">
                  <mat-icon>movie</mat-icon>
                  <mat-icon>tv</mat-icon>
                  <span>Radarr + Sonarr</span>
                </div>
              </div>
            </div>
            <div class="summary-stats">
              <div class="stat-item total clickable" (click)="viewAllQueue()">
                <div class="stat-number">{{ totalItems }}</div>
                <div class="stat-label">Total Items</div>
                <div class="click-hint" *ngIf="totalItems > 0">Click to view</div>
              </div>
              <div class="stat-item downloading clickable" (click)="viewActiveDownloads()">
                <div class="stat-number">{{ downloadingCount }}</div>
                <div class="stat-label">Downloading</div>
                <div class="click-hint" *ngIf="downloadingCount > 0">Click to view</div>
              </div>
              <div class="stat-item size">
                <div class="stat-number">{{ totalSize | bytes }}</div>
                <div class="stat-label">Total Size</div>
              </div>
            </div>
          </div>

          <!-- Active Downloads -->
          <div class="active-downloads" *ngIf="activeDownloads.length > 0">
            <h4>Active Downloads</h4>
            <div class="download-list">
              <div *ngFor="let item of activeDownloads" class="download-item">
                <div class="item-service-badge" 
                     [class.radarr]="item.sourceService === 'radarr'"
                     [class.sonarr]="item.sourceService === 'sonarr'">
                  <mat-icon>{{ item.sourceService === 'radarr' ? 'movie' : 'tv' }}</mat-icon>
                  <span>{{ item.sourceService === 'radarr' ? 'Radarr' : 'Sonarr' }}</span>
                </div>
                <div class="download-info">
                  <div class="download-title">{{ getDownloadTitle(item) }}</div>
                  <div class="download-details">
                    <span class="download-size">{{ item.size | bytes }}</span>
                    <span class="download-eta" *ngIf="item.timeleft">{{ item.timeleft }} remaining</span>
                    <mat-chip class="client-chip">{{ item.downloadClient }}</mat-chip>
                  </div>
                  <mat-progress-bar 
                    [value]="getDownloadProgress(item)" 
                    [color]="getProgressColor(item)"
                    class="download-progress">
                  </mat-progress-bar>
                </div>
                <div class="download-actions">
                  <button mat-icon-button 
                          (click)="pauseDownload(item)"
                          matTooltip="Pause download"
                          class="pause-button">
                    <mat-icon>pause</mat-icon>
                  </button>
                  <button mat-icon-button 
                          (click)="cancelDownload(item)"
                          matTooltip="Cancel download"
                          class="cancel-button">
                    <mat-icon>cancel</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Queue Status -->
          <div class="queue-status" *ngIf="queueItems.length > activeDownloads.length">
            <h4>Queue Status</h4>
            <div class="status-grid">
              <div class="status-item completed" *ngIf="completedCount > 0">
                <mat-icon>check_circle</mat-icon>
                <span>{{ completedCount }} completed</span>
              </div>
              <div class="status-item failed" *ngIf="failedCount > 0">
                <mat-icon>error</mat-icon>
                <span>{{ failedCount }} failed</span>
              </div>
              <div class="status-item queued" *ngIf="queuedCount > 0">
                <mat-icon>schedule</mat-icon>
                <span>{{ queuedCount }} queued</span>
              </div>
            </div>
          </div>

          <!-- Failed Downloads -->
          <div class="failed-downloads" *ngIf="failedDownloads.length > 0">
            <h4>Failed Downloads</h4>
            <div class="failed-list">
              <div *ngFor="let item of failedDownloads" class="failed-item">
                <div class="failed-info">
                  <div class="failed-title">{{ getDownloadTitle(item) }}</div>
                  <div class="failed-error" *ngIf="item.errorMessage">{{ item.errorMessage }}</div>
                </div>
                <div class="failed-actions">
                  <button mat-icon-button 
                          (click)="retryDownload(item)"
                          matTooltip="Retry download"
                          class="retry-button">
                    <mat-icon>replay</mat-icon>
                  </button>
                  <button mat-icon-button 
                          (click)="removeFromQueue(item)"
                          matTooltip="Remove from queue"
                          class="remove-button">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="totalItems === 0" class="empty-state">
            <mat-icon>cloud_done</mat-icon>
            <h3>No Downloads</h3>
            <p>Download queue is empty</p>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .download-queue-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .card-avatar {
      background-color: var(--primary-color);
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

    .queue-summary {
      background-color: rgba(33, 150, 243, 0.05);
      border: 2px solid var(--primary-color);
      border-radius: 8px;
      padding: 16px;
    }

    .summary-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .summary-header h4 {
      margin: 0;
      color: var(--text-primary);
      font-size: 14px;
      font-weight: 600;
    }

    .service-indicators {
      display: flex;
      gap: 8px;
    }

    .service-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 12px;
    }

    .service-badge.radarr-sonarr {
      background: linear-gradient(45deg, #2196f3 0%, #2196f3 50%, #9c27b0 50%, #9c27b0 100%);
      color: white;
    }

    .service-badge mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .summary-stats {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
    }

    .stat-item {
      text-align: center;
      transition: all 0.3s ease;
      position: relative;
    }

    .stat-item.clickable {
      cursor: pointer;
      padding: 12px;
      border-radius: 6px;
    }

    .stat-item.clickable:hover {
      background-color: rgba(33, 150, 243, 0.1);
      transform: translateY(-2px);
    }

    .click-hint {
      position: absolute;
      bottom: -2px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 9px;
      color: var(--text-secondary);
      opacity: 0.7;
      font-style: italic;
    }

    .stat-number {
      font-size: 18px;
      font-weight: bold;
      color: var(--text-primary);
    }

    .stat-label {
      font-size: 11px;
      color: var(--text-secondary);
      margin-top: 4px;
    }

    .active-downloads h4,
    .queue-status h4,
    .failed-downloads h4 {
      margin: 0 0 12px 0;
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 500;
    }

    .download-list,
    .failed-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .download-item,
    .failed-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      background-color: var(--surface-elevated);
      border-radius: 8px;
      border: 1px solid var(--border-color);
      position: relative;
    }

    .item-service-badge {
      position: absolute;
      top: 6px;
      right: 6px;
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 8px;
      z-index: 1;
    }

    .item-service-badge.radarr {
      background-color: var(--primary-color);
      color: white;
    }

    .item-service-badge.sonarr {
      background-color: #9c27b0;
      color: white;
    }

    .item-service-badge mat-icon {
      font-size: 12px;
      width: 12px;
      height: 12px;
    }

    .download-info,
    .failed-info {
      flex: 1;
    }

    .download-title,
    .failed-title {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
      line-height: 1.2;
      margin-bottom: 6px;
    }

    .download-details {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .download-size,
    .download-eta {
      font-size: 11px;
      color: var(--text-secondary);
    }

    .client-chip {
      font-size: 10px;
      min-height: 18px;
      line-height: 18px;
      background-color: rgba(33, 150, 243, 0.2);
      color: var(--primary-color);
    }

    .download-progress {
      height: 4px;
      border-radius: 2px;
    }

    .download-actions,
    .failed-actions {
      display: flex;
      gap: 4px;
      margin-left: 12px;
    }

    .pause-button {
      color: var(--accent-color);
    }

    .cancel-button,
    .remove-button {
      color: var(--warn-color);
    }

    .retry-button {
      color: var(--success-color);
    }

    .status-grid {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      padding: 6px 12px;
      border-radius: 16px;
    }

    .status-item.completed {
      background-color: rgba(76, 175, 80, 0.1);
      color: var(--success-dark);
    }

    .status-item.failed {
      background-color: rgba(244, 67, 54, 0.1);
      color: var(--error-color);
    }

    .status-item.queued {
      background-color: var(--surface-elevated);
      color: var(--text-secondary);
    }

    .status-item mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .failed-error {
      font-size: 11px;
      color: var(--error-color);
      margin-top: 4px;
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
      color: var(--success-color);
    }

    .empty-state h3 {
      margin: 0;
      color: var(--text-primary);
      font-size: 16px;
    }

    .empty-state p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 14px;
    }

    @media (max-width: 768px) {
      .summary-stats {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .download-item,
      .failed-item {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
      }

      .download-actions,
      .failed-actions {
        justify-content: center;
        margin-left: 0;
      }
    }
  `]
})
export class DownloadQueueCardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Observables
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  
  // Data properties
  totalItems = 0;
  downloadingCount = 0;
  completedCount = 0;
  failedCount = 0;
  queuedCount = 0;
  totalSize = 0;
  queueItems: QueueItem[] = [];
  activeDownloads: QueueItem[] = [];
  failedDownloads: QueueItem[] = [];

  constructor(
    private contentManagementService: ContentManagementService,
    private dialog: MatDialog
  ) {
    this.loading$ = this.contentManagementService.loading$;
    this.error$ = this.contentManagementService.error$;
  }

  ngOnInit(): void {
    this.loadQueueData();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load queue data
   */
  loadQueueData(): void {
    this.contentManagementService.getCombinedQueue()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (queue) => {
          this.queueItems = queue;
          this.processQueueData(queue);
        },
        error: (error) => {
          console.error('Failed to load queue data:', error);
        }
      });
  }

  /**
   * Process queue data and categorize items
   */
  private processQueueData(queue: QueueItem[]): void {
    this.totalItems = queue.length;
    this.totalSize = queue.reduce((total, item) => total + item.size, 0);
    
    // Categorize items
    this.activeDownloads = queue.filter(item => item.status === 'downloading').slice(0, 3);
    this.failedDownloads = queue.filter(item => item.status === 'failed').slice(0, 3);
    
    // Count by status
    this.downloadingCount = queue.filter(item => item.status === 'downloading').length;
    this.completedCount = queue.filter(item => item.status === 'completed').length;
    this.failedCount = queue.filter(item => item.status === 'failed').length;
    this.queuedCount = queue.filter(item => item.status === 'queued').length;
  }

  /**
   * Start auto-refresh for active downloads
   */
  private startAutoRefresh(): void {
    interval(30000) // Refresh every 30 seconds
      .pipe(
        startWith(0),
        switchMap(() => this.contentManagementService.getCombinedQueue()),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (queue) => {
          // Only update if there are active downloads to avoid unnecessary updates
          if (this.hasActiveDownloads) {
            this.queueItems = queue;
            this.processQueueData(queue);
          }
        },
        error: (error) => {
          console.error('Auto-refresh failed:', error);
        }
      });
  }

  /**
   * Get computed properties
   */
  get hasActiveDownloads(): boolean {
    return this.downloadingCount > 0;
  }

  /**
   * Refresh data manually
   */
  refreshData(): void {
    this.loadQueueData();
  }

  /**
   * Get download title
   */
  getDownloadTitle(item: QueueItem): string {
    return item.title || 'Unknown Title';
  }

  /**
   * Get download progress percentage
   */
  getDownloadProgress(item: QueueItem): number {
    if (!item.size || item.size === 0) return 0;
    return ((item.size - item.sizeleft) / item.size) * 100;
  }

  /**
   * Get progress bar color based on status
   */
  getProgressColor(item: QueueItem): string {
    switch (item.status) {
      case 'downloading': return 'primary';
      case 'completed': return 'accent';
      case 'failed': return 'warn';
      default: return 'primary';
    }
  }

  /**
   * Pause specific download
   */
  pauseDownload(item: QueueItem): void {
    console.log(`Pause download: ${item.title} - not yet implemented`);
  }

  /**
   * Cancel specific download
   */
  cancelDownload(item: QueueItem): void {
    if (item.sourceService) {
      this.contentManagementService.removeFromQueue(item.sourceService, item.id, { removeFromClient: true })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log(`Download cancelled: ${item.title}`);
            this.refreshData();
          },
          error: (error) => {
            console.error('Failed to cancel download:', error);
          }
        });
    }
  }

  /**
   * Retry failed download
   */
  retryDownload(item: QueueItem): void {
    console.log(`Retry download: ${item.title} - not yet implemented`);
  }

  /**
   * Remove item from queue
   */
  removeFromQueue(item: QueueItem): void {
    if (item.sourceService) {
      this.contentManagementService.removeFromQueue(item.sourceService, item.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log(`Removed from queue: ${item.title}`);
            this.refreshData();
          },
          error: (error) => {
            console.error('Failed to remove from queue:', error);
          }
        });
    }
  }

  /**
   * Pause all downloads
   */
  pauseAll(): void {
    console.log('Pause all downloads - not yet implemented');
  }

  /**
   * Clear completed downloads
   */
  clearCompleted(): void {
    console.log('Clear completed downloads - not yet implemented');
  }

  /**
   * View full queue
   */
  viewFullQueue(): void {
    console.log('View full queue - not yet implemented');
  }

  /**
   * View all queue items
   */
  viewAllQueue(): void {
    if (this.totalItems === 0) return;
    
    this.openQueueDialog('Download Queue', this.queueItems);
  }

  /**
   * View active downloads only
   */
  viewActiveDownloads(): void {
    if (this.downloadingCount === 0) return;
    
    this.openQueueDialog('Active Downloads', this.activeDownloads);
  }

  /**
   * Open queue detail dialog
   */
  private openQueueDialog(title: string, items: QueueItem[]): void {
    // Import the dialog component
    import('../wanted-content-card/wanted-content-card.component').then(module => {
      this.dialog.open(module.ContentDetailDialogComponent, {
        width: '80%',
        maxWidth: '1000px',
        maxHeight: '80vh',
        data: {
          title,
          items,
          type: 'queue',
          contentManagementService: this.contentManagementService
        }
      });
    });
  }
}