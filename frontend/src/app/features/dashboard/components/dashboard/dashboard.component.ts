import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { LibraryService } from '../../../../core/services/library.service';
import { ContentManagementService } from '../../../../core/services/content-management.service';
import { Library, GlobalStats } from '../../../../models';
import { ServicesStatus } from '../../../../models/arr-models';
import { LoadingComponent, BytesPipe } from '../../../../shared';
import { WantedContentCardComponent } from '../wanted-content-card/wanted-content-card.component';
import { MissingContentCardComponent } from '../missing-content-card/missing-content-card.component';
import { DownloadQueueCardComponent } from '../download-queue-card/download-queue-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    LoadingComponent,
    BytesPipe,
    WantedContentCardComponent,
    MissingContentCardComponent,
    DownloadQueueCardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  libraries: Library[] = [];
  globalStats: GlobalStats | null = null;
  isLoading = true;
  isRefreshing = false;
  showContentManagementCards = false;
  servicesStatus: ServicesStatus | null = null;

  constructor(
    private libraryService: LibraryService,
    private contentManagementService: ContentManagementService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.checkContentManagementServices();
  }

  private async loadDashboardData(): Promise<void> {
    this.isLoading = true;
    
    try {
      // Load libraries and global stats in parallel
      const [libraries, globalStats] = await Promise.all([
        this.libraryService.getLibraries().toPromise(),
        this.libraryService.getGlobalStats().toPromise()
      ]);

      this.libraries = libraries || [];
      this.globalStats = globalStats || null;
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      this.snackBar.open('Failed to load dashboard data', 'Close', { duration: 5000 });
    } finally {
      this.isLoading = false;
    }
  }

  async refreshData(): Promise<void> {
    this.isRefreshing = true;
    
    try {
      await this.libraryService.refreshAllStats().toPromise();
      await this.loadDashboardData();
      this.snackBar.open('Data refreshed successfully', 'Close', { duration: 3000 });
    } catch (error) {
      this.snackBar.open('Failed to refresh data', 'Close', { duration: 5000 });
    } finally {
      this.isRefreshing = false;
    }
  }


  getLibraryIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'movie': return 'movie';
      case 'show': return 'tv';
      case 'artist': return 'library_music';
      case 'photo': return 'photo_library';
      default: return 'folder';
    }
  }

  getLibraryTypeLabel(type: string): string {
    switch (type.toLowerCase()) {
      case 'movie': return 'Movies';
      case 'show': return 'TV Shows';
      case 'artist': return 'Music';
      case 'photo': return 'Photos';
      default: return 'Media';
    }
  }

  /**
   * Check if content management services are available
   */
  private checkContentManagementServices(): void {
    // Get detailed service status
    this.contentManagementService.getServicesStatus().subscribe({
      next: (status) => {
        this.servicesStatus = status;
        // Show cards if at least one service is available
        this.showContentManagementCards = status.radarr.connected || status.sonarr.connected;
      },
      error: (error) => {
        console.warn('Content management services not available:', error);
        this.showContentManagementCards = false;
        this.servicesStatus = null;
      }
    });
  }
}
