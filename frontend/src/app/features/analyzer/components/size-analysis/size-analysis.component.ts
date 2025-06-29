import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
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
  @Input() limit: number = 50;

  sizeAnalysis: SizeAnalysis | null = null;
  isLoading = false;
  error: string | null = null;

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
    if (changes['limit'] && !changes['limit'].firstChange) {
      this.loadSizeAnalysis();
    }
  }

  private loadSizeAnalysis(): void {
    if (!this.libraryId) return;

    this.isLoading = true;
    this.error = null;

    this.analyzerService.getSizeAnalysis(this.libraryId, this.limit).subscribe({
      next: (analysis) => {
        this.sizeAnalysis = analysis;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load size analysis';
        this.isLoading = false;
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

    const csvData = this.convertToCSV(this.sizeAnalysis.largestFiles);
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