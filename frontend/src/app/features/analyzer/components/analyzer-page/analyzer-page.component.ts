import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { SizeAnalysisComponent } from '../size-analysis/size-analysis.component';
import { QualityAnalysisComponent } from '../quality-analysis/quality-analysis.component';
import { ContentAnalysisComponent } from '../content-analysis/content-analysis.component';
import { LibraryService } from '../../../../core/services/library.service';
import { Library } from '../../../../models';

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
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    SizeAnalysisComponent,
    QualityAnalysisComponent,
    ContentAnalysisComponent
  ],
  templateUrl: './analyzer-page.component.html',
  styleUrl: './analyzer-page.component.scss'
})
export class AnalyzerPageComponent implements OnInit {
  libraryId: string | null = null;
  library: Library | null = null;
  selectedTabIndex = 0;
  isLoadingLibrary = true;

  // Analysis configuration
  selectedLimit: number = 50;
  limitOptions = [
    { value: 10, label: '10 Items' },
    { value: 50, label: '50 Items' },
    { value: 100, label: '100 Items' },
    { value: 200, label: '200 Items' },
    { value: -1, label: 'ALL Items' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private libraryService: LibraryService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.libraryId = params.get('libraryId');
      if (!this.libraryId) {
        this.router.navigate(['/dashboard']);
      } else {
        this.loadLibrary();
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
   * Load library information
   */
  private async loadLibrary(): Promise<void> {
    if (!this.libraryId) return;
    
    this.isLoadingLibrary = true;
    console.log(`[AnalyzerPage] Loading library with ID: ${this.libraryId}`);
    
    try {
      const result = await this.libraryService.getLibrary(this.libraryId).toPromise();
      this.library = result || null;
      console.log(`[AnalyzerPage] Loaded library:`, this.library);
    } catch (error) {
      console.error('Failed to load library:', error);
      // If library not found, redirect to dashboard
      this.router.navigate(['/dashboard']);
    } finally {
      this.isLoadingLibrary = false;
      console.log(`[AnalyzerPage] Loading finished. Library:`, this.library);
    }
  }

  /**
   * Get page title based on library state
   */
  getPageTitle(): string {
    if (this.isLoadingLibrary) {
      return 'Library Analysis';
    }
    if (this.library) {
      return `Library Analysis - ${this.library.title}`;
    }
    return 'Library Analysis';
  }

  /**
   * Handle limit change
   */
  onLimitChange(): void {
    // The child components will react to the @Input change
    console.log(`[AnalyzerPage] Limit changed to: ${this.selectedLimit}`);
  }

  /**
   * Navigate back to dashboard
   */
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}