import { Injectable } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { ThemeService } from '../../core/services/theme.service';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ChartColors {
  primary: string[];
  quality: string[];
  resolution: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ChartService {

  constructor(private themeService: ThemeService) {}
  
  private readonly defaultColors: ChartColors = {
    primary: [
      '#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0',
      '#00BCD4', '#8BC34A', '#FFC107', '#E91E63', '#3F51B5'
    ],
    quality: [
      '#4CAF50', // Excellent - Green
      '#2196F3', // Good - Blue  
      '#FF9800', // Fair - Orange
      '#F44336'  // Poor - Red
    ],
    resolution: [
      '#9C27B0', // 4K - Purple (more distinct from 1080p)
      '#2196F3', // 1080p - Blue
      '#4CAF50', // 720p - Green
      '#FF9800', // 480p - Orange
      '#F44336'  // Other - Red
    ]
  };

  /**
   * Get theme-aware text color
   */
  private getTextColor(): string {
    const isDarkMode = this.themeService.isDarkTheme();
    return isDarkMode ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  }

  /**
   * Get theme-aware grid color
   */
  private getGridColor(): string {
    const isDarkMode = this.themeService.isDarkTheme();
    return isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  }

  /**
   * Create pie chart configuration
   */
  createPieChart(data: ChartDataPoint[], title: string): ChartConfiguration<'pie'> {
    const textColor = this.getTextColor();
    return {
      type: 'pie',
      data: this.transformToPieData(data),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: title,
            font: { size: 16 },
            color: textColor
          },
          legend: {
            position: 'bottom',
            labels: { 
              usePointStyle: true,
              color: textColor
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const percentage = ((context.parsed / context.dataset.data.reduce((a: number, b: number) => a + b, 0)) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        }
      }
    };
  }

  /**
   * Create donut chart configuration
   */
  createDonutChart(data: ChartDataPoint[], title: string, colorType: keyof ChartColors = 'primary'): ChartConfiguration<'doughnut'> {
    const textColor = this.getTextColor();
    return {
      type: 'doughnut',
      data: this.transformToDonutData(data, colorType),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: title,
            font: { size: 16 },
            color: textColor
          },
          legend: {
            position: 'bottom',
            labels: { 
              usePointStyle: true,
              color: textColor
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        },
        cutout: '50%'
      }
    };
  }

  /**
   * Create bar chart configuration
   */
  createBarChart(data: ChartDataPoint[], title: string, horizontal: boolean = false): ChartConfiguration<'bar'> {
    const textColor = this.getTextColor();
    const gridColor = this.getGridColor();
    return {
      type: 'bar',
      data: this.transformToBarData(data),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: horizontal ? 'y' : 'x',
        plugins: {
          title: {
            display: true,
            text: title,
            font: { size: 16 },
            color: textColor
          },
          legend: { display: false }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { 
              display: horizontal,
              color: gridColor
            },
            ticks: {
              color: textColor
            }
          },
          y: {
            beginAtZero: true,
            grid: { 
              display: !horizontal,
              color: gridColor
            },
            ticks: {
              color: textColor
            }
          }
        }
      }
    };
  }

  /**
   * Transform data for pie charts
   */
  private transformToPieData(data: ChartDataPoint[]): ChartData<'pie'> {
    return {
      labels: data.map(d => d.label),
      datasets: [{
        data: data.map(d => d.value),
        backgroundColor: data.map((d, i) => d.color || this.defaultColors.primary[i % this.defaultColors.primary.length]),
        borderWidth: 1,
        borderColor: '#fff'
      }]
    };
  }

  /**
   * Transform data for donut charts
   */
  private transformToDonutData(data: ChartDataPoint[], colorType: keyof ChartColors): ChartData<'doughnut'> {
    const colors = this.defaultColors[colorType];
    return {
      labels: data.map(d => d.label),
      datasets: [{
        data: data.map(d => d.value),
        backgroundColor: data.map((d, i) => d.color || colors[i % colors.length]),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  }

  /**
   * Transform data for bar charts
   */
  private transformToBarData(data: ChartDataPoint[]): ChartData<'bar'> {
    return {
      labels: data.map(d => d.label),
      datasets: [{
        data: data.map(d => d.value),
        backgroundColor: data.map((d, i) => d.color || this.defaultColors.primary[i % this.defaultColors.primary.length]),
        borderWidth: 1,
        borderColor: '#fff'
      }]
    };
  }

  /**
   * Get colors for specific data types
   */
  getColorsForType(type: keyof ChartColors): string[] {
    return this.defaultColors[type];
  }
}