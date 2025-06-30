import { Component, OnInit, OnChanges, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { ChartConfiguration } from 'chart.js';

import { AnalyzerService } from '../../../../core/services/analyzer.service';
import { LoadingComponent } from '../../../../shared';
import { ChartService, ChartDataPoint } from '../../../../shared/services/chart.service';
import { ChartComponent } from '../../../../shared/components/chart/chart.component';

export interface QualityAnalysis {
  qualityProfiles: QualityProfile[];
  resolutionDistribution: ResolutionData[];
  codecDistribution: CodecData[];
}

export interface QualityProfile {
  name: string;
  count: number;
  totalSize: number;
  percentage: number;
}

export interface ResolutionData {
  resolution: string;
  count: number;
  percentage: number;
}

export interface CodecData {
  codec: string;
  count: number;
  percentage: number;
}

@Component({
  selector: 'app-quality-analysis',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    LoadingComponent,
    ChartComponent
  ],
  templateUrl: './quality-analysis.component.html',
  styleUrl: './quality-analysis.component.scss'
})
export class QualityAnalysisComponent implements OnInit, OnChanges {
  @Input() libraryId!: string;
  
  qualityData: QualityAnalysis | null = null;
  isLoading = true;
  
  resolutionColumns: string[] = ['resolution', 'count', 'percentage'];
  codecColumns: string[] = ['codec', 'count', 'percentage'];

  // Chart configurations
  resolutionChart: ChartConfiguration | null = null;
  codecChart: ChartConfiguration | null = null;

  constructor(
    private analyzerService: AnalyzerService,
    private snackBar: MatSnackBar,
    private chartService: ChartService
  ) {}

  ngOnInit(): void {
    if (this.libraryId) {
      this.loadQualityAnalysis();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // No limit changes to handle anymore
  }

  private async loadQualityAnalysis(): Promise<void> {
    this.isLoading = true;
    
    try {
      const response = await this.analyzerService.getQualityAnalysis(this.libraryId, -1).toPromise();
      this.qualityData = response?.data || null;
      this.generateCharts();
    } catch (error) {
      console.error('Failed to load quality analysis:', error);
      this.snackBar.open('Failed to load quality analysis', 'Close', { duration: 5000 });
    } finally {
      this.isLoading = false;
    }
  }

  private generateCharts(): void {
    if (!this.qualityData) return;

    // Resolution distribution chart
    if (this.qualityData.resolutionDistribution && this.qualityData.resolutionDistribution.length > 0) {
      const resolutionData: ChartDataPoint[] = this.qualityData.resolutionDistribution.map(item => ({
        label: item.resolution,
        value: item.count
      }));
      this.resolutionChart = this.chartService.createDonutChart(resolutionData, 'Resolution Distribution', 'resolution');
    }

    // Codec distribution chart
    if (this.qualityData.codecDistribution && this.qualityData.codecDistribution.length > 0) {
      const codecData: ChartDataPoint[] = this.qualityData.codecDistribution.map(item => ({
        label: item.codec,
        value: item.count
      }));
      this.codecChart = this.chartService.createBarChart(codecData, 'Codec Distribution', true);
    }
  }

  async refreshAnalysis(): Promise<void> {
    await this.loadQualityAnalysis();
    this.snackBar.open('Quality analysis refreshed', 'Close', { duration: 3000 });
  }

  formatPercentage(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }
}