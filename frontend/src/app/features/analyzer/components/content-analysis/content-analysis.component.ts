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
import { ChartConfiguration } from 'chart.js';

import { AnalyzerService } from '../../../../core/services/analyzer.service';
import { LoadingComponent } from '../../../../shared';
import { ChartService, ChartDataPoint } from '../../../../shared/services/chart.service';
import { ChartComponent } from '../../../../shared/components/chart/chart.component';

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
    LoadingComponent,
    ChartComponent
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

  // Chart configurations
  genreChart: ChartConfiguration | null = null;
  yearChart: ChartConfiguration | null = null;
  runtimeChart: ChartConfiguration | null = null;

  constructor(
    private analyzerService: AnalyzerService,
    private snackBar: MatSnackBar,
    private chartService: ChartService
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
      this.generateCharts();
    } catch (error) {
      console.error('Failed to load content analysis:', error);
      this.snackBar.open('Failed to load content analysis', 'Close', { duration: 5000 });
    } finally {
      this.isLoading = false;
    }
  }

  private generateCharts(): void {
    if (!this.contentData) return;

    // Genre distribution chart (top 10)
    if (this.contentData.genreDistribution && this.contentData.genreDistribution.length > 0) {
      const genreData: ChartDataPoint[] = this.contentData.genreDistribution
        .slice(0, 10)
        .map(item => ({
          label: item.genre,
          value: item.count
        }));
      this.genreChart = this.chartService.createBarChart(genreData, 'Top Genres', true);
    }

    // Year distribution chart (recent years)
    if (this.contentData.yearDistribution && this.contentData.yearDistribution.length > 0) {
      const yearData: ChartDataPoint[] = this.contentData.yearDistribution
        .slice(-20) // Last 20 years
        .map(item => ({
          label: item.year.toString(),
          value: item.count
        }));
      this.yearChart = this.chartService.createBarChart(yearData, 'Release Years (Recent)', false);
    }

    // Runtime distribution chart
    if (this.contentData.runtimeDistribution && this.contentData.runtimeDistribution.length > 0) {
      const runtimeData: ChartDataPoint[] = this.contentData.runtimeDistribution.map(item => ({
        label: item.range,
        value: item.count
      }));
      this.runtimeChart = this.chartService.createBarChart(runtimeData, 'Runtime Distribution', false);
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