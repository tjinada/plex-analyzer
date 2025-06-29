import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { LibraryService } from '../../../../core/services/library.service';
import { Library, GlobalStats } from '../../../../models';
import { LoadingComponent, BytesPipe } from '../../../../shared';

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
    LoadingComponent,
    BytesPipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  libraries: Library[] = [];
  globalStats: GlobalStats | null = null;
  isLoading = true;
  isRefreshing = false;

  constructor(
    private libraryService: LibraryService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
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
}
