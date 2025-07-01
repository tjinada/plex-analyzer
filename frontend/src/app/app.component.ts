import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ConfigService } from './core/services/config.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatProgressBarModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Plex Analyzer';
  isConfigured = false;
  isLoading = true;

  constructor(
    private configService: ConfigService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    // Initialize theme service (sets dark mode as default)
    // Theme service constructor handles initialization automatically
    
    // Subscribe to configuration status
    this.configService.configStatus$.subscribe(status => {
      if (status) {
        this.isConfigured = status.isConfigured;
        this.isLoading = false;
      }
    });
  }
}
