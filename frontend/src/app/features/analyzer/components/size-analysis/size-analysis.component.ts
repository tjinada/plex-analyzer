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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { 
  AnalyzerService, 
  SizeAnalysis, 
  MediaFile, 
  EnhancedSizeAnalysis, 
  EnhancedMediaFile,
  QualityTier 
} from '../../../../core/services/analyzer.service';
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
    MatSlideToggleModule,
    MatTooltipModule,
    MatChipsModule,
    FormsModule
  ],
  templateUrl: './size-analysis.component.html',
  styleUrl: './size-analysis.component.scss'
})
export class SizeAnalysisComponent implements OnInit, OnChanges {
  @Input() libraryId!: string;
  @Output() loadingStateChange = new EventEmitter<{ isLoading: boolean; hasError: boolean; errorMessage?: string }>();

  sizeAnalysis: SizeAnalysis | null = null;
  enhancedAnalysis: EnhancedSizeAnalysis | null = null;
  isLoading = false;
  error: string | null = null;
  pagination: PaginationMeta | null = null;

  // Enhanced features toggle
  showEnhancedView = false;

  // Dual view for TV shows
  showEpisodeView = false; // Toggle between show view and episode view
  currentDisplayData: (MediaFile | EnhancedMediaFile)[] = []; // Current data to display based on view

  // Table configuration
  basicColumns: string[] = ['title', 'fileSize', 'resolution', 'codec', 'filePath'];
  enhancedColumns: string[] = ['title', 'fileSize', 'technical', 'quality'];
  displayedColumns: string[] = this.basicColumns;
  
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

    if (this.showEnhancedView) {
      this.loadEnhancedAnalysis();
    } else {
      this.loadBasicAnalysis();
    }
  }

  private loadBasicAnalysis(): void {
    this.analyzerService.getSizeAnalysis(this.libraryId, -1).subscribe({
      next: (response) => {
        this.sizeAnalysis = response.data;
        this.pagination = response.pagination;
        this.displayedColumns = this.basicColumns;
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

  private loadEnhancedAnalysis(): void {
    this.analyzerService.getEnhancedSizeAnalysis(this.libraryId, -1).subscribe({
      next: (response) => {
        this.enhancedAnalysis = response.data;
        this.pagination = response.pagination;
        this.displayedColumns = this.enhancedColumns;
        this.updateDisplayData();
        this.isLoading = false;
        this.loadingStateChange.emit({ isLoading: false, hasError: false });
      },
      error: (error) => {
        this.error = 'Failed to load enhanced analysis';
        this.isLoading = false;
        this.loadingStateChange.emit({ 
          isLoading: false, 
          hasError: true, 
          errorMessage: this.error 
        });
        console.error('Error loading enhanced analysis:', error);
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
    const currentAnalysis = this.getCurrentAnalysis();
    
    if (!currentAnalysis) {
      this.currentDisplayData = [];
      return;
    }

    if (this.showEpisodeView && currentAnalysis.episodeBreakdown) {
      this.currentDisplayData = currentAnalysis.episodeBreakdown;
    } else {
      this.currentDisplayData = currentAnalysis.largestFiles;
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
   * Toggle enhanced view on/off
   */
  toggleEnhancedView(event: any): void {
    this.showEnhancedView = event.checked;
    console.log(`[SizeAnalysisComponent] Enhanced view toggled to: ${this.showEnhancedView}`);
    this.loadSizeAnalysis();
  }

  /**
   * Get current analysis data based on view mode
   */
  getCurrentAnalysis(): SizeAnalysis | EnhancedSizeAnalysis | null {
    return this.showEnhancedView ? this.enhancedAnalysis : this.sizeAnalysis;
  }

  /**
   * Check if TV show library has episodes
   */
  get hasEpisodes(): boolean {
    const currentAnalysis = this.getCurrentAnalysis();
    return currentAnalysis?.hasEpisodes || false;
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
    const currentAnalysis = this.getCurrentAnalysis();
    if (!currentAnalysis) return;

    const csvData = this.convertToCSV(this.currentDisplayData);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `size-analysis-${this.libraryId}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Check if a file is an enhanced media file
   */
  isEnhancedFile(file: MediaFile | EnhancedMediaFile): file is EnhancedMediaFile {
    return 'qualityScore' in file;
  }

  /**
   * Get quality tier color class
   */
  getQualityTierClass(tier: QualityTier): string {
    switch (tier) {
      case QualityTier.EXCELLENT: return 'tier-excellent';
      case QualityTier.GOOD: return 'tier-good';
      case QualityTier.FAIR: return 'tier-fair';
      case QualityTier.POOR: return 'tier-poor';
      default: return 'tier-unknown';
    }
  }

  /**
   * Get codec color class
   */
  getCodecClass(codec: string): string {
    const codecLower = codec.toLowerCase();
    if (codecLower.includes('av1')) return 'codec-av1';
    if (codecLower.includes('h.265') || codecLower.includes('hevc')) return 'codec-h265';
    if (codecLower.includes('h.264') || codecLower.includes('avc')) return 'codec-h264';
    if (codecLower.includes('vp9')) return 'codec-vp9';
    return 'codec-other';
  }

  /**
   * Format bitrate in human readable format
   */
  formatBitrate(bitrate: number): string {
    if (bitrate === 0) return 'Unknown';
    if (bitrate < 1000) return `${Math.round(bitrate)} bps`;
    if (bitrate < 1000000) return `${Math.round(bitrate / 1000)} Kbps`;
    return `${Math.round(bitrate / 1000000)} Mbps`;
  }

  private convertToCSV(files: (MediaFile | EnhancedMediaFile)[]): string {
    if (this.showEnhancedView && files.length > 0 && this.isEnhancedFile(files[0])) {
      // Enhanced CSV format
      const headers = [
        'Title', 'File Size (Bytes)', 'File Size (Formatted)', 'Resolution', 'Codec', 
        'Video Profile', 'Bit Depth', 'Video Bitrate', 'Quality Score', 'Quality Tier', 
        'File Path'
      ];
      const rows = files.map(file => {
        const enhanced = file as EnhancedMediaFile;
        return [
          enhanced.title,
          enhanced.fileSize.toString(),
          this.formatFileSize(enhanced.fileSize),
          enhanced.resolution,
          enhanced.codec,
          enhanced.videoProfile,
          enhanced.bitDepth.toString(),
          this.formatBitrate(enhanced.videoBitrate),
          enhanced.qualityScore.toString(),
          enhanced.qualityTier,
          enhanced.filePath
        ];
      });
      
      return [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
    } else {
      // Basic CSV format
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
}