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

import { AnalyzerService } from '../../../../core/services/analyzer.service';
import { LoadingComponent } from '../../../../shared';

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
    LoadingComponent
  ],
  templateUrl: './quality-analysis.component.html',
  styleUrl: './quality-analysis.component.scss'
})
export class QualityAnalysisComponent implements OnInit, OnChanges {
  @Input() libraryId!: string;
  @Input() limit: number = 50;
  
  qualityData: QualityAnalysis | null = null;
  isLoading = true;
  
  resolutionColumns: string[] = ['resolution', 'count', 'percentage'];
  codecColumns: string[] = ['codec', 'count', 'percentage'];

  constructor(
    private analyzerService: AnalyzerService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (this.libraryId) {
      this.loadQualityAnalysis();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['limit'] && !changes['limit'].firstChange) {
      this.loadQualityAnalysis();
    }
  }

  private async loadQualityAnalysis(): Promise<void> {
    this.isLoading = true;
    
    try {
      const response = await this.analyzerService.getQualityAnalysis(this.libraryId, this.limit).toPromise();
      this.qualityData = response?.data || null;
    } catch (error) {
      console.error('Failed to load quality analysis:', error);
      this.snackBar.open('Failed to load quality analysis', 'Close', { duration: 5000 });
    } finally {
      this.isLoading = false;
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