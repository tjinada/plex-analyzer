import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Observable } from 'rxjs';

import { ThemeService, Theme } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSlideToggleModule
  ],
  template: `
    <div class="theme-toggle-container" [class.toggle-style]="style === 'toggle'" [class.button-style]="style === 'button'">
      
      <!-- Toggle Switch Style -->
      <div *ngIf="style === 'toggle'" class="toggle-wrapper">
        <mat-icon class="theme-icon light-icon" [class.active]="(theme$ | async) === 'light'">light_mode</mat-icon>
        <mat-slide-toggle
          [checked]="(theme$ | async) === 'dark'"
          (change)="toggleTheme()"
          [color]="color"
          [matTooltip]="(theme$ | async) === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
        </mat-slide-toggle>
        <mat-icon class="theme-icon dark-icon" [class.active]="(theme$ | async) === 'dark'">dark_mode</mat-icon>
      </div>

      <!-- Button Style -->
      <button *ngIf="style === 'button'" 
              mat-icon-button 
              (click)="toggleTheme()"
              [matTooltip]="(theme$ | async) === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
              class="theme-button">
        <mat-icon>{{ (theme$ | async) === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
      </button>

      <!-- Fab Style -->
      <button *ngIf="style === 'fab'" 
              mat-fab 
              (click)="toggleTheme()"
              [matTooltip]="(theme$ | async) === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
              class="theme-fab"
              [color]="color">
        <mat-icon>{{ (theme$ | async) === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
      </button>

      <!-- Mini Fab Style -->
      <button *ngIf="style === 'mini-fab'" 
              mat-mini-fab 
              (click)="toggleTheme()"
              [matTooltip]="(theme$ | async) === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
              class="theme-mini-fab"
              [color]="color">
        <mat-icon>{{ (theme$ | async) === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
      </button>

    </div>
  `,
  styles: [`
    .theme-toggle-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .toggle-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border-radius: 24px;
      background-color: var(--surface-elevated);
      border: 1px solid var(--border-color);
    }

    .theme-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--text-disabled);
      transition: color 0.3s ease, transform 0.3s ease;
    }

    .theme-icon.active {
      color: var(--primary-color);
      transform: scale(1.1);
    }

    .light-icon.active {
      color: #ffa726;
    }

    .dark-icon.active {
      color: #5c6bc0;
    }

    .theme-button {
      transition: all 0.3s ease;
    }

    .theme-button:hover {
      background-color: var(--surface-elevated);
      transform: rotate(180deg);
    }

    .theme-fab,
    .theme-mini-fab {
      transition: all 0.3s ease;
    }

    .theme-fab:hover,
    .theme-mini-fab:hover {
      transform: rotate(180deg) scale(1.05);
    }

    .button-style,
    .toggle-style {
      user-select: none;
    }

    /* Animation for theme transition */
    @keyframes themeTransition {
      0% { transform: scale(1) rotate(0deg); }
      50% { transform: scale(1.1) rotate(180deg); }
      100% { transform: scale(1) rotate(360deg); }
    }

    .theme-button.animating,
    .theme-fab.animating,
    .theme-mini-fab.animating {
      animation: themeTransition 0.6s ease-in-out;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .toggle-wrapper {
        padding: 6px 10px;
        gap: 8px;
      }
      
      .theme-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }
  `]
})
export class ThemeToggleComponent {
  @Input() style: 'button' | 'toggle' | 'fab' | 'mini-fab' = 'button';
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() showAnimation: boolean = true;

  theme$: Observable<Theme>;

  constructor(private themeService: ThemeService) {
    this.theme$ = this.themeService.theme$;
  }

  toggleTheme(): void {
    if (this.showAnimation) {
      this.animateToggle();
    }
    this.themeService.toggleTheme();
  }

  private animateToggle(): void {
    const button = document.querySelector('.theme-button, .theme-fab, .theme-mini-fab');
    if (button) {
      button.classList.add('animating');
      setTimeout(() => {
        button.classList.remove('animating');
      }, 600);
    }
  }
}