import { Component, OnInit, OnChanges, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

import { AnalyzerService } from '../../../../core/services/analyzer.service';
import { LoadingComponent } from '../../../../shared';

export interface ContentAnalysis {
  genreDistribution: GenreData[];
  yearDistribution: YearData[];
  runtimeDistribution: RuntimeData[];
}

export interface GenreData {
  genre: string;
  count: number;
  percentage: number;
}

export interface YearData {
  year: number;
  count: number;
}

export interface RuntimeData {
  range: string;
  count: number;
  averageRuntime: number;
}

@Component({
  selector: 'app-content-analysis',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    LoadingComponent
  ],
  templateUrl: './content-analysis.component.html',
  styleUrl: './content-analysis.component.scss'
})
export class ContentAnalysisComponent implements OnInit, OnChanges {
  @Input() libraryId!: string;
  
  contentData: ContentAnalysis | null = null;
  isLoading = true;
  
  genreColumns: string[] = ['genre', 'count', 'percentage'];
  yearColumns: string[] = ['year', 'count'];
  runtimeColumns: string[] = ['range', 'count', 'averageRuntime'];

  constructor(
    private analyzerService: AnalyzerService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (this.libraryId) {
      this.loadContentAnalysis();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // No limit changes to handle anymore
  }

  private async loadContentAnalysis(): Promise<void> {
    this.isLoading = true;
    
    try {
      const response = await this.analyzerService.getContentAnalysis(this.libraryId, -1).toPromise();
      this.contentData = response?.data || null;
    } catch (error) {
      console.error('Failed to load content analysis:', error);
      this.snackBar.open('Failed to load content analysis', 'Close', { duration: 5000 });
    } finally {
      this.isLoading = false;
    }
  }

  async refreshAnalysis(): Promise<void> {
    await this.loadContentAnalysis();
    this.snackBar.open('Content analysis refreshed', 'Close', { duration: 3000 });
  }

  formatPercentage(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }

  formatRuntime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  getTopGenres(): GenreData[] {
    return this.contentData?.genreDistribution.slice(0, 5) || [];
  }

  getRecentYears(): YearData[] {
    return this.contentData?.yearDistribution.slice(-10) || [];
  }
}