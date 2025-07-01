import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = 'dark'; // Only dark mode available

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly PERMANENT_THEME: Theme = 'dark';
  
  private themeSubject = new BehaviorSubject<Theme>(this.PERMANENT_THEME);
  public theme$ = this.themeSubject.asObservable();

  constructor() {
    this.initializeTheme();
  }

  /**
   * Initialize permanent dark theme
   */
  private initializeTheme(): void {
    this.applyThemeToDOM(this.PERMANENT_THEME);
    this.themeSubject.next(this.PERMANENT_THEME);
  }

  /**
   * Get current theme (always dark)
   */
  getCurrentTheme(): Theme {
    return this.PERMANENT_THEME;
  }

  /**
   * Check if current theme is dark (always true)
   */
  isDarkTheme(): boolean {
    return true;
  }

  /**
   * Check if current theme is light (always false)
   */
  isLightTheme(): boolean {
    return false;
  }

  /**
   * Apply dark theme classes to document body
   */
  private applyThemeToDOM(theme: Theme): void {
    const body = document.body;
    
    // Remove any existing theme classes (cleanup)
    body.classList.remove('light-theme', 'dark-theme');
    
    // Add dark theme class
    body.classList.add('dark-theme');
    
    // Set data attribute for easier CSS targeting
    body.setAttribute('data-theme', 'dark');
  }

  /**
   * Get theme colors (always dark theme colors)
   */
  getThemeColors(): { primary: string; accent: string; background: string; surface: string; text: string } {
    return {
      primary: '#2196f3',
      accent: '#ff9800',
      background: '#121212',
      surface: '#1e1e1e',
      text: 'rgba(255, 255, 255, 0.87)'
    };
  }

  /**
   * Get CSS custom property value
   */
  getCSSCustomProperty(property: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(property);
  }

  /**
   * Set CSS custom property value
   */
  setCSSCustomProperty(property: string, value: string): void {
    document.documentElement.style.setProperty(property, value);
  }

  /**
   * Apply theme-specific chart colors
   */
  getChartColors(): {
    backgroundColor: string[];
    borderColor: string[];
    textColor: string;
    gridColor: string;
  } {
    const isDark = this.isDarkTheme();
    
    return {
      backgroundColor: isDark 
        ? ['#2196f3', '#ff9800', '#4caf50', '#f44336', '#9c27b0', '#00bcd4', '#ffeb3b', '#795548']
        : ['#1976d2', '#f57c00', '#388e3c', '#d32f2f', '#7b1fa2', '#0097a7', '#fbc02d', '#5d4037'],
      borderColor: isDark
        ? ['#64b5f6', '#ffb74d', '#81c784', '#e57373', '#ba68c8', '#4dd0e1', '#fff176', '#a1887f']
        : ['#1565c0', '#ef6c00', '#2e7d32', '#c62828', '#6a1b9a', '#00838f', '#f9a825', '#4e342e'],
      textColor: isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)',
      gridColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'
    };
  }
}