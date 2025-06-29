import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { AnalyzerService, SizeAnalysis, MediaFile } from '../../../../core/services/analyzer.service';
import { PaginatedResponse, PaginationMeta } from '../../../../models/pagination.model';

@Component({
  selector: 'app-size-analysis',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatSortModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule
  ],
  templateUrl: './size-analysis.component.html',
  styleUrl: './size-analysis.component.scss'
})
export class SizeAnalysisComponent implements OnInit, OnChanges {
  @Input() libraryId!: string;
  @Output() loadingStateChange = new EventEmitter<{ isLoading: boolean; hasError: boolean; errorMessage?: string }>();

  sizeAnalysis: SizeAnalysis | null = null;
  isLoading = false;
  error: string | null = null;
  pagination: PaginationMeta | null = null;

  // Dual view for TV shows
  showEpisodeView = false; // Toggle between show view and episode view
  currentDisplayData: MediaFile[] = []; // Current data to display based on view

  // Table configuration
  displayedColumns: string[] = ['title', 'fileSize', 'resolution', 'codec', 'filePath'];
  
  constructor(private analyzerService: AnalyzerService) {}

  ngOnInit(): void {
    this.loadSizeAnalysis();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['libraryId'] && !changes['libraryId'].firstChange) {
      this.loadSizeAnalysis();
    }
  }

  private loadSizeAnalysis(): void {
    if (!this.libraryId) return;

    this.isLoading = true;
    this.error = null;
    this.loadingStateChange.emit({ isLoading: true, hasError: false });

    this.analyzerService.getSizeAnalysis(this.libraryId, -1).subscribe({
      next: (response) => {
        this.sizeAnalysis = response.data;
        this.pagination = response.pagination;
        this.updateDisplayData();
        this.isLoading = false;
        this.loadingStateChange.emit({ isLoading: false, hasError: false });
      },
      error: (error) => {
        this.error = 'Failed to load size analysis';
        this.isLoading = false;
        this.loadingStateChange.emit({ 
          isLoading: false, 
          hasError: true, 
          errorMessage: this.error 
        });
        console.error('Error loading size analysis:', error);
      }
    });
  }

  /**
   * Format file size in human readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format percentage
   */
  formatPercentage(value: number): string {
    return (value * 100).toFixed(1) + '%';
  }

  /**
   * Update display data based on current view
   */
  private updateDisplayData(): void {
    if (!this.sizeAnalysis) {
      this.currentDisplayData = [];
      return;
    }

    if (this.showEpisodeView && this.sizeAnalysis.episodeBreakdown) {
      this.currentDisplayData = this.sizeAnalysis.episodeBreakdown;
    } else {
      this.currentDisplayData = this.sizeAnalysis.largestFiles;
    }
  }

  /**
   * Toggle between show and episode view
   */
  toggleView(): void {
    this.showEpisodeView = !this.showEpisodeView;
    this.updateDisplayData();
  }

  /**
   * Check if TV show library has episodes
   */
  get hasEpisodes(): boolean {
    return this.sizeAnalysis?.hasEpisodes || false;
  }

  /**
   * Get current view label
   */
  get viewLabel(): string {
    return this.showEpisodeView ? 'Episode View' : 'Show View';
  }

  /**
   * Get toggle button label
   */
  get toggleButtonLabel(): string {
    return this.showEpisodeView ? 'Show by TV Shows' : 'Show by Episodes';
  }

  /**
   * Refresh the analysis data
   */
  refresh(): void {
    this.loadSizeAnalysis();
  }

  /**
   * Export size analysis data
   */
  exportData(): void {
    if (!this.sizeAnalysis) return;

    const csvData = this.convertToCSV(this.currentDisplayData);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `size-analysis-${this.libraryId}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private convertToCSV(files: MediaFile[]): string {
    const headers = ['Title', 'File Size (Bytes)', 'File Size (Formatted)', 'Resolution', 'Codec', 'File Path'];
    const rows = files.map(file => [
      file.title,
      file.fileSize.toString(),
      this.formatFileSize(file.fileSize),
      file.resolution,
      file.codec,
      file.filePath
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
}