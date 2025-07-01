import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { ThemeService } from '../../../core/services/theme.service';
import { Subject, takeUntil } from 'rxjs';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-chart',
  template: `
    <div class="chart-container" [style.height]="height">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [`
    .chart-container {
      position: relative;
      width: 100%;
      min-height: 300px;
    }
    canvas {
      max-width: 100%;
      max-height: 100%;
    }
  `],
  standalone: true
})
export class ChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input() config!: ChartConfiguration;
  @Input() height: string = '300px';
  @ViewChild('chartCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;
  private destroy$ = new Subject<void>();

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // Subscribe to theme changes
    this.themeService.theme$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.config) {
        this.createOrUpdateChart();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && this.config) {
      this.createOrUpdateChart();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private createOrUpdateChart(): void {
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (ctx) {
      this.chart = new Chart(ctx, this.config);
    }
  }
}