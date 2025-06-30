import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';

export interface NotificationConfig {
  duration?: number;
  action?: string;
  panelClass?: string[];
  horizontalPosition?: 'start' | 'center' | 'end' | 'left' | 'right';
  verticalPosition?: 'top' | 'bottom';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private defaultConfig: MatSnackBarConfig = {
    duration: 4000,
    horizontalPosition: 'end',
    verticalPosition: 'bottom'
  };

  constructor(private snackBar: MatSnackBar) {}

  /**
   * Show a success notification
   */
  success(message: string, config?: NotificationConfig): MatSnackBarRef<SimpleSnackBar> {
    const snackBarConfig: MatSnackBarConfig = {
      ...this.defaultConfig,
      ...config,
      panelClass: ['success-snackbar', ...(config?.panelClass || [])]
    };

    return this.snackBar.open(message, config?.action || '✓', snackBarConfig);
  }

  /**
   * Show an error notification
   */
  error(message: string, config?: NotificationConfig): MatSnackBarRef<SimpleSnackBar> {
    const snackBarConfig: MatSnackBarConfig = {
      ...this.defaultConfig,
      duration: config?.duration || 6000, // Longer duration for errors
      ...config,
      panelClass: ['error-snackbar', ...(config?.panelClass || [])]
    };

    return this.snackBar.open(message, config?.action || '✗', snackBarConfig);
  }

  /**
   * Show a warning notification
   */
  warning(message: string, config?: NotificationConfig): MatSnackBarRef<SimpleSnackBar> {
    const snackBarConfig: MatSnackBarConfig = {
      ...this.defaultConfig,
      ...config,
      panelClass: ['warning-snackbar', ...(config?.panelClass || [])]
    };

    return this.snackBar.open(message, config?.action || '⚠', snackBarConfig);
  }

  /**
   * Show an info notification
   */
  info(message: string, config?: NotificationConfig): MatSnackBarRef<SimpleSnackBar> {
    const snackBarConfig: MatSnackBarConfig = {
      ...this.defaultConfig,
      ...config,
      panelClass: ['info-snackbar', ...(config?.panelClass || [])]
    };

    return this.snackBar.open(message, config?.action || 'ℹ', snackBarConfig);
  }

  /**
   * Show a loading notification with indefinite duration
   */
  loading(message: string, config?: NotificationConfig): MatSnackBarRef<SimpleSnackBar> {
    const snackBarConfig: MatSnackBarConfig = {
      ...this.defaultConfig,
      duration: 0, // Indefinite duration
      ...config,
      panelClass: ['loading-snackbar', ...(config?.panelClass || [])]
    };

    return this.snackBar.open(message, config?.action || '⏳', snackBarConfig);
  }

  /**
   * Dismiss all active notifications
   */
  dismiss(): void {
    this.snackBar.dismiss();
  }

  /**
   * Show a custom notification
   */
  show(message: string, action?: string, config?: NotificationConfig): MatSnackBarRef<SimpleSnackBar> {
    const snackBarConfig: MatSnackBarConfig = {
      ...this.defaultConfig,
      ...config
    };

    return this.snackBar.open(message, action, snackBarConfig);
  }
}