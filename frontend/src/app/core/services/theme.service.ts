import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'plex-analyzer-theme';
  private readonly DEFAULT_THEME: Theme = 'dark'; // Dark mode as default
  
  private themeSubject = new BehaviorSubject<Theme>(this.DEFAULT_THEME);
  public theme$ = this.themeSubject.asObservable();

  constructor() {
    this.initializeTheme();
  }

  /**
   * Initialize theme from localStorage or use default
   */
  private initializeTheme(): void {
    const savedTheme = this.getSavedTheme();
    const theme = savedTheme || this.DEFAULT_THEME;
    this.setTheme(theme);
  }

  /**
   * Get saved theme from localStorage
   */
  private getSavedTheme(): Theme | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const saved = localStorage.getItem(this.THEME_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return null;
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): Theme {
    return this.themeSubject.value;
  }

  /**
   * Check if current theme is dark
   */
  isDarkTheme(): boolean {
    return this.getCurrentTheme() === 'dark';
  }

  /**
   * Check if current theme is light
   */
  isLightTheme(): boolean {
    return this.getCurrentTheme() === 'light';
  }

  /**
   * Set theme and apply to DOM
   */
  setTheme(theme: Theme): void {
    this.applyThemeToDOM(theme);
    this.saveTheme(theme);
    this.themeSubject.next(theme);
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme(): void {
    const newTheme: Theme = this.isDarkTheme() ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  /**
   * Apply theme classes to document body
   */
  private applyThemeToDOM(theme: Theme): void {
    const body = document.body;
    
    // Remove existing theme classes
    body.classList.remove('light-theme', 'dark-theme');
    
    // Add new theme class
    body.classList.add(`${theme}-theme`);
    
    // Set data attribute for easier CSS targeting
    body.setAttribute('data-theme', theme);
  }

  /**
   * Save theme to localStorage
   */
  private saveTheme(theme: Theme): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.THEME_KEY, theme);
    }
  }

  /**
   * Get theme colors for dynamic use
   */
  getThemeColors(): { primary: string; accent: string; background: string; surface: string; text: string } {
    const isDark = this.isDarkTheme();
    
    return {
      primary: '#2196f3',
      accent: '#ff9800',
      background: isDark ? '#121212' : '#f5f5f5',
      surface: isDark ? '#1e1e1e' : '#ffffff',
      text: isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)'
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