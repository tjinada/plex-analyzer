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
import { AnalysisCacheService } from '../../../../core/services/analysis-cache.service';
import { TabLoadingState } from '../../../../models/pagination.model';

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
    { value: 25, label: '25 Items' },
    { value: 50, label: '50 Items' },
    { value: 100, label: '100 Items' },
    { value: 200, label: '200 Items' },
    { value: -1, label: 'All Items' }
  ];

  // Tab loading states (lazy loading)
  tabStates: { [key: string]: TabLoadingState } = {
    size: { isLoaded: false, isLoading: false, hasError: false },
    quality: { isLoaded: false, isLoading: false, hasError: false },
    content: { isLoaded: false, isLoading: false, hasError: false }
  };

  // Track which tab should load initially
  initialTabLoaded = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private libraryService: LibraryService,
    private cacheService: AnalysisCacheService
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
      
      // Load initial tab after library is loaded
      if (this.libraryId && !this.initialTabLoaded) {
        this.initialTabLoaded = true;
        const tabNames = ['size', 'quality', 'content'];
        const currentTab = tabNames[this.selectedTabIndex];
        this.loadTabDataIfNeeded(currentTab);
      }
    });
  }

  /**
   * Handle tab change with lazy loading
   */
  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    
    const tabNames = ['size', 'quality', 'content'];
    const tabName = tabNames[index];
    
    // Update URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabName },
      queryParamsHandling: 'merge'
    });

    // Load tab data if not already loaded (lazy loading)
    this.loadTabDataIfNeeded(tabName);
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
   * Handle limit change - clear cache and reload current tab
   */
  onLimitChange(): void {
    console.log(`[AnalyzerPage] Limit changed to: ${this.selectedLimit}`);
    
    // Clear cache for current library since limit changed
    if (this.libraryId) {
      this.cacheService.clearLibrary(this.libraryId);
    }
    
    // Mark all tabs as not loaded to force reload with new limit
    Object.keys(this.tabStates).forEach(tab => {
      this.tabStates[tab].isLoaded = false;
    });
    
    // Reload current tab
    const tabNames = ['size', 'quality', 'content'];
    const currentTab = tabNames[this.selectedTabIndex];
    this.loadTabDataIfNeeded(currentTab);
  }

  /**
   * Load tab data if needed (lazy loading implementation)
   */
  private loadTabDataIfNeeded(tabName: string): void {
    const tabState = this.tabStates[tabName];
    
    // Don't load if already loaded, loading, or library not ready
    if (tabState.isLoaded || tabState.isLoading || !this.libraryId) {
      return;
    }

    // Check if data is cached
    const isCached = this.cacheService.has(this.libraryId, tabName, this.selectedLimit);
    if (isCached) {
      console.log(`[AnalyzerPage] ${tabName} analysis is cached for library ${this.libraryId}`);
      tabState.isLoaded = true;
      return;
    }

    console.log(`[AnalyzerPage] Loading ${tabName} analysis for library ${this.libraryId}`);
    tabState.isLoading = true;
    tabState.hasError = false;
  }

  /**
   * Check if tab should show skeleton loader
   */
  shouldShowSkeleton(tabName: string): boolean {
    const tabState = this.tabStates[tabName];
    return !tabState.isLoaded && !tabState.isLoading;
  }

  /**
   * Check if tab is currently loading
   */
  isTabLoading(tabName: string): boolean {
    return this.tabStates[tabName].isLoading;
  }

  /**
   * Mark tab as loaded (called by child components)
   */
  markTabAsLoaded(tabName: string): void {
    const tabState = this.tabStates[tabName];
    tabState.isLoaded = true;
    tabState.isLoading = false;
    tabState.hasError = false;
    console.log(`[AnalyzerPage] ${tabName} analysis loaded for library ${this.libraryId}`);
  }

  /**
   * Mark tab as error (called by child components)
   */
  markTabAsError(tabName: string, errorMessage: string): void {
    const tabState = this.tabStates[tabName];
    tabState.isLoaded = false;
    tabState.isLoading = false;
    tabState.hasError = true;
    tabState.errorMessage = errorMessage;
    console.error(`[AnalyzerPage] ${tabName} analysis failed for library ${this.libraryId}:`, errorMessage);
  }

  /**
   * Handle loading state changes from size analysis component
   */
  onSizeAnalysisLoadingChange(event: { isLoading: boolean; hasError: boolean; errorMessage?: string }): void {
    const tabState = this.tabStates['size'];
    tabState.isLoading = event.isLoading;
    tabState.hasError = event.hasError;
    tabState.errorMessage = event.errorMessage;
    
    if (!event.isLoading && !event.hasError) {
      tabState.isLoaded = true;
    }
  }

  /**
   * Navigate back to dashboard
   */
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}