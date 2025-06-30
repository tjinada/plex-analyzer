import { Injectable } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

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
      '#1976D2', // 4K - Dark Blue
      '#2196F3', // 1080p - Blue
      '#4CAF50', // 720p - Green
      '#FF9800', // 480p - Orange
      '#F44336'  // Other - Red
    ]
  };

  /**
   * Create pie chart configuration
   */
  createPieChart(data: ChartDataPoint[], title: string): ChartConfiguration<'pie'> {
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
            font: { size: 16 }
          },
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true }
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
            font: { size: 16 }
          },
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true }
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
            font: { size: 16 }
          },
          legend: { display: false }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { display: horizontal }
          },
          y: {
            beginAtZero: true,
            grid: { display: !horizontal }
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