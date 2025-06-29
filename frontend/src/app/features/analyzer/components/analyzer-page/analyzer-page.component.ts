import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SizeAnalysisComponent } from '../size-analysis/size-analysis.component';
import { QualityAnalysisComponent } from '../quality-analysis/quality-analysis.component';
import { ContentAnalysisComponent } from '../content-analysis/content-analysis.component';

@Component({
  selector: 'app-analyzer-page',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    SizeAnalysisComponent,
    QualityAnalysisComponent,
    ContentAnalysisComponent
  ],
  templateUrl: './analyzer-page.component.html',
  styleUrl: './analyzer-page.component.scss'
})
export class AnalyzerPageComponent implements OnInit {
  libraryId: string | null = null;
  selectedTabIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.libraryId = params.get('libraryId');
      if (!this.libraryId) {
        this.router.navigate(['/dashboard']);
      }
    });

    // Handle tab navigation from query params
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      switch (tab) {
        case 'size':
          this.selectedTabIndex = 0;
          break;
        case 'quality':
          this.selectedTabIndex = 1;
          break;
        case 'content':
          this.selectedTabIndex = 2;
          break;
        default:
          this.selectedTabIndex = 0;
      }
    });
  }

  /**
   * Handle tab change
   */
  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    
    const tabNames = ['size', 'quality', 'content'];
    const tabName = tabNames[index];
    
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabName },
      queryParamsHandling: 'merge'
    });
  }

  /**
   * Navigate back to dashboard
   */
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}