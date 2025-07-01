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
import { ChartConfiguration } from 'chart.js';
import { 
  AnalyzerService, 
  SizeAnalysis, 
  MediaFile, 
  EnhancedSizeAnalysis, 
  EnhancedMediaFile,
  QualityTier 
} from '../../../../core/services/analyzer.service';
import { PaginatedResponse, PaginationMeta } from '../../../../models/pagination.model';
import { ChartService, ChartDataPoint } from '../../../../shared/services/chart.service';
import { ChartComponent } from '../../../../shared/components/chart/chart.component';
import { FilterService, FilterState } from '../../../../shared/services/filter.service';
import { FilterBarComponent, FilterOption } from '../../../../shared/components/filter-bar/filter-bar.component';

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
    FormsModule,
    ChartComponent,
    FilterBarComponent
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
  enhancedColumns: string[] = ['title', 'fileSize', 'videoQuality', 'audioQuality', 'quality'];
  displayedColumns: string[] = this.basicColumns;

  // Chart configurations
  sizeDistributionChart: ChartConfiguration | null = null;
  qualityDistributionChart: ChartConfiguration | null = null;

  // Filtering
  allDisplayData: (MediaFile | EnhancedMediaFile)[] = []; // All data before filtering
  filteredDisplayData: (MediaFile | EnhancedMediaFile)[] = []; // Filtered data
  showFilters = false;
  filterOptions: {
    fileType: FilterOption[];
    qualityTier: FilterOption[];
    resolution: FilterOption[];
    codec: FilterOption[];
  } = {
    fileType: [],
    qualityTier: [],
    resolution: [],
    codec: []
  };
  
  constructor(
    private analyzerService: AnalyzerService,
    private chartService: ChartService,
    private filterService: FilterService
  ) {}

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
      this.allDisplayData = [];
      this.filteredDisplayData = [];
      this.currentDisplayData = [];
      this.sizeDistributionChart = null;
      this.qualityDistributionChart = null;
      return;
    }

    if (this.showEpisodeView && currentAnalysis.episodeBreakdown) {
      this.allDisplayData = currentAnalysis.episodeBreakdown;
    } else {
      this.allDisplayData = currentAnalysis.largestFiles;
    }

    // Update filter options
    this.updateFilterOptions();

    // Apply filters
    this.applyFilters();

    // Generate charts
    this.generateCharts();
  }

  /**
   * Update filter options based on current data
   */
  private updateFilterOptions(): void {
    if (this.allDisplayData.length === 0) return;

    // File type options
    const fileTypeCounts = this.getCountsByProperty(this.allDisplayData, 'type');
    this.filterOptions.fileType = Object.entries(fileTypeCounts).map(([value, count]) => ({
      value,
      label: value.charAt(0).toUpperCase() + value.slice(1),
      count
    }));

    // Resolution options
    const resolutionCounts = this.getCountsByProperty(this.allDisplayData, 'resolution');
    this.filterOptions.resolution = Object.entries(resolutionCounts).map(([value, count]) => ({
      value,
      label: value,
      count
    }));

    // Codec options
    const codecCounts = this.getCountsByProperty(this.allDisplayData, 'codec');
    this.filterOptions.codec = Object.entries(codecCounts).map(([value, count]) => ({
      value,
      label: value,
      count
    }));

    // Quality tier options (enhanced view only)
    if (this.showEnhancedView && this.allDisplayData.length > 0 && this.isEnhancedFile(this.allDisplayData[0])) {
      const qualityTierCounts = this.getCountsByProperty(this.allDisplayData as EnhancedMediaFile[], 'qualityTier');
      this.filterOptions.qualityTier = Object.entries(qualityTierCounts).map(([value, count]) => ({
        value,
        label: value,
        count
      }));
    } else {
      this.filterOptions.qualityTier = [];
    }
  }

  /**
   * Apply current filters to display data
   */
  applyFilters(): void {
    const filters = this.filterService.getCurrentFilters();
    
    this.filteredDisplayData = this.allDisplayData.filter(item => {
      // Search text filter
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const searchableText = `${item.title} ${item.filePath}`.toLowerCase();
        if (!searchableText.includes(searchLower)) {
          return false;
        }
      }

      // File type filter
      if (filters.fileType.length > 0 && !filters.fileType.includes(item.type)) {
        return false;
      }

      // Resolution filter
      if (filters.resolution.length > 0 && !filters.resolution.includes(item.resolution)) {
        return false;
      }

      // Codec filter
      if (filters.codec.length > 0 && !filters.codec.includes(item.codec)) {
        return false;
      }

      // Quality tier filter (enhanced view only)
      if (filters.qualityTier.length > 0 && this.isEnhancedFile(item)) {
        if (!filters.qualityTier.includes(item.qualityTier)) {
          return false;
        }
      }

      return true;
    });

    this.currentDisplayData = this.filteredDisplayData;
  }

  /**
   * Toggle filter visibility
   */
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  /**
   * Handle filter changes
   */
  onFiltersChanged(filters: FilterState): void {
    this.applyFilters();
  }

  /**
   * Get counts of items by property
   */
  private getCountsByProperty<T>(items: T[], property: keyof T): Record<string, number> {
    return items.reduce((counts, item) => {
      const value = String(item[property]);
      counts[value] = (counts[value] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }

  /**
   * Generate charts based on current data
   */
  private generateCharts(): void {
    const currentAnalysis = this.getCurrentAnalysis();
    if (!currentAnalysis) return;

    // Size distribution chart
    if (currentAnalysis.sizeDistribution && currentAnalysis.sizeDistribution.length > 0) {
      const sizeData: ChartDataPoint[] = currentAnalysis.sizeDistribution.map(dist => ({
        label: dist.range,
        value: dist.count
      }));
      this.sizeDistributionChart = this.chartService.createPieChart(sizeData, 'File Size Distribution');
    }

    // Quality distribution chart (enhanced view only)
    if (this.showEnhancedView && this.enhancedAnalysis) {
      const qualityDist = this.getCurrentQualityDistribution();
      const qualityData: ChartDataPoint[] = [
        { label: 'Excellent', value: qualityDist.excellent, color: '#4CAF50' },
        { label: 'Good', value: qualityDist.good, color: '#2196F3' },
        { label: 'Fair', value: qualityDist.fair, color: '#FF9800' },
        { label: 'Poor', value: qualityDist.poor, color: '#F44336' }
      ].filter(item => item.value > 0);

      if (qualityData.length > 0) {
        this.qualityDistributionChart = this.chartService.createDonutChart(
          qualityData, 
          'Quality Distribution', 
          'quality'
        );
      }
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
   * Get quality distribution based on current view (show vs episode)
   */
  getCurrentQualityDistribution(): any {
    if (!this.enhancedAnalysis) {
      return { excellent: 0, good: 0, fair: 0, poor: 0 };
    }
    
    if (this.showEpisodeView && this.enhancedAnalysis.episodeQualityDistribution) {
      return this.enhancedAnalysis.episodeQualityDistribution;
    }
    
    return this.enhancedAnalysis.qualityDistribution;
  }

  /**
   * Get technical breakdown based on current view
   */
  getCurrentTechnicalBreakdown(): any {
    if (!this.enhancedAnalysis) {
      return { 
        hdrContent: { count: 0, percentage: 0, formats: {} },
        bitDepthDistribution: {},
        colorSpaceDistribution: {}
      };
    }
    
    if (this.showEpisodeView && this.enhancedAnalysis.episodeTechnicalBreakdown) {
      return this.enhancedAnalysis.episodeTechnicalBreakdown;
    }
    
    return this.enhancedAnalysis.technicalBreakdown;
  }

  /**
   * Get upgrade recommendations based on current view
   */
  getCurrentUpgradeRecommendations(): any[] {
    if (!this.enhancedAnalysis) {
      return [];
    }
    
    if (this.showEpisodeView && this.enhancedAnalysis.episodeUpgradeRecommendations) {
      return this.enhancedAnalysis.episodeUpgradeRecommendations;
    }
    
    return this.enhancedAnalysis.upgradeRecommendations || [];
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

  /**
   * Get HDR format color class
   */
  getHDRClass(hdrFormat: string): string {
    const formatLower = hdrFormat.toLowerCase();
    if (formatLower.includes('dolby vision')) return 'hdr-dolby-vision';
    if (formatLower.includes('hdr10+')) return 'hdr-hdr10plus';
    if (formatLower.includes('hdr10')) return 'hdr-hdr10';
    if (formatLower.includes('hlg')) return 'hdr-hlg';
    return 'hdr-standard';
  }

  /**
   * Format audio channels in a user-friendly way
   */
  formatAudioChannels(channels: number): string {
    switch (channels) {
      case 1: return 'Mono';
      case 2: return '2.0';
      case 6: return '5.1';
      case 8: return '7.1';
      default: return `${channels}ch`;
    }
  }

  /**
   * Get audio codec from file data or filepath parsing
   */
  getAudioCodec(file: EnhancedMediaFile): string {
    // First try the audioCodec field if available
    if (file.audioCodec) {
      return file.audioCodec;
    }

    // Fall back to parsing from filepath
    const path = file.filePath?.toLowerCase() || '';
    
    // Common audio codec patterns in filenames
    if (path.includes('atmos')) return 'Atmos';
    if (path.includes('truehd')) return 'TrueHD';
    if (path.includes('dts-hd') || path.includes('dtshd')) return 'DTS-HD';
    if (path.includes('dts-x') || path.includes('dtsx')) return 'DTS:X';
    if (path.includes('dts')) return 'DTS';
    if (path.includes('ac3') || path.includes('dd5') || path.includes('dd+')) return 'AC3';
    if (path.includes('aac')) return 'AAC';
    if (path.includes('flac')) return 'FLAC';
    if (path.includes('mp3')) return 'MP3';
    
    return '';
  }

  /**
   * Get audio channels from file data or filepath parsing
   */
  getAudioChannels(file: EnhancedMediaFile): string {
    // First try the audioChannels field if available
    if (file.audioChannels) {
      return this.formatAudioChannels(file.audioChannels);
    }

    // Fall back to parsing from filepath
    const path = file.filePath?.toLowerCase() || '';
    
    // Common channel layout patterns in filenames
    if (path.includes('7.1') || path.includes('71')) return '7.1';
    if (path.includes('5.1') || path.includes('51')) return '5.1';
    if (path.includes('2.0') || path.includes('stereo')) return '2.0';
    if (path.includes('mono')) return 'Mono';
    
    // Try to extract from common patterns like [5.1] or (7.1)
    const channelMatch = path.match(/[\[\(]([0-9]\.[0-9])[\]\)]/);
    if (channelMatch) {
      return channelMatch[1];
    }
    
    return '';
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