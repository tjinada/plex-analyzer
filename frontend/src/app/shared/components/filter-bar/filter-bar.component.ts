import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { FilterService, FilterState } from '../../services/filter.service';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

@Component({
  selector: 'app-filter-bar',
  template: `
    <div class="filter-bar">
      <!-- Search Input -->
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search</mat-label>
        <input matInput 
               [(ngModel)]="searchText" 
               (ngModelChange)="onSearchChange($event)"
               placeholder="Search by title or path..."
               [disabled]="disabled">
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      <!-- File Type Filter -->
      <mat-form-field appearance="outline" class="filter-field" *ngIf="fileTypeOptions.length > 0">
        <mat-label>File Type</mat-label>
        <mat-select multiple 
                    [(ngModel)]="selectedFileTypes" 
                    (ngModelChange)="onFileTypeChange($event)"
                    [disabled]="disabled">
          <mat-option *ngFor="let option of fileTypeOptions" [value]="option.value">
            {{ option.label }}
            <span *ngIf="option.count" class="option-count">({{ option.count }})</span>
          </mat-option>
        </mat-select>
      </mat-form-field>

      <!-- Quality Tier Filter -->
      <mat-form-field appearance="outline" class="filter-field" *ngIf="qualityTierOptions.length > 0">
        <mat-label>Quality</mat-label>
        <mat-select multiple 
                    [(ngModel)]="selectedQualityTiers" 
                    (ngModelChange)="onQualityTierChange($event)"
                    [disabled]="disabled">
          <mat-option *ngFor="let option of qualityTierOptions" [value]="option.value">
            {{ option.label }}
            <span *ngIf="option.count" class="option-count">({{ option.count }})</span>
          </mat-option>
        </mat-select>
      </mat-form-field>

      <!-- Resolution Filter -->
      <mat-form-field appearance="outline" class="filter-field" *ngIf="resolutionOptions.length > 0">
        <mat-label>Resolution</mat-label>
        <mat-select multiple 
                    [(ngModel)]="selectedResolutions" 
                    (ngModelChange)="onResolutionChange($event)"
                    [disabled]="disabled">
          <mat-option *ngFor="let option of resolutionOptions" [value]="option.value">
            {{ option.label }}
            <span *ngIf="option.count" class="option-count">({{ option.count }})</span>
          </mat-option>
        </mat-select>
      </mat-form-field>

      <!-- Codec Filter -->
      <mat-form-field appearance="outline" class="filter-field" *ngIf="codecOptions.length > 0">
        <mat-label>Codec</mat-label>
        <mat-select multiple 
                    [(ngModel)]="selectedCodecs" 
                    (ngModelChange)="onCodecChange($event)"
                    [disabled]="disabled">
          <mat-option *ngFor="let option of codecOptions" [value]="option.value">
            {{ option.label }}
            <span *ngIf="option.count" class="option-count">({{ option.count }})</span>
          </mat-option>
        </mat-select>
      </mat-form-field>

      <!-- Clear Filters Button -->
      <button mat-icon-button 
              (click)="clearAllFilters()" 
              [disabled]="!hasActiveFilters || disabled"
              matTooltip="Clear all filters"
              class="clear-button">
        <mat-icon>clear</mat-icon>
      </button>

      <!-- Active Filter Count -->
      <div class="filter-count" *ngIf="activeFilterCount > 0">
        {{ activeFilterCount }} filter{{ activeFilterCount > 1 ? 's' : '' }} active
      </div>
    </div>
  `,
  styles: [`
    .filter-bar {
      display: flex;
      gap: 1rem;
      align-items: center;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .search-field {
      min-width: 250px;
      flex: 1;
    }

    .filter-field {
      min-width: 150px;
    }

    .clear-button {
      margin-left: auto;
    }

    .filter-count {
      font-size: 0.875rem;
      color: #1976d2;
      font-weight: 500;
      white-space: nowrap;
    }

    .option-count {
      color: #666;
      font-size: 0.8rem;
      margin-left: 0.5rem;
    }

    @media (max-width: 768px) {
      .filter-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .search-field,
      .filter-field {
        min-width: unset;
        width: 100%;
      }

      .clear-button {
        margin-left: 0;
        align-self: center;
      }
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    FormsModule
  ]
})
export class FilterBarComponent implements OnInit, OnDestroy {
  @Input() fileTypeOptions: FilterOption[] = [];
  @Input() qualityTierOptions: FilterOption[] = [];
  @Input() resolutionOptions: FilterOption[] = [];
  @Input() codecOptions: FilterOption[] = [];
  @Input() disabled = false;
  
  @Output() filtersChanged = new EventEmitter<FilterState>();

  searchText = '';
  selectedFileTypes: string[] = [];
  selectedQualityTiers: string[] = [];
  selectedResolutions: string[] = [];
  selectedCodecs: string[] = [];

  hasActiveFilters = false;
  activeFilterCount = 0;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(private filterService: FilterService) {}

  ngOnInit(): void {
    // Subscribe to filter state changes
    this.filterService.getFilterState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.updateLocalState(state);
        this.updateActiveFilterInfo();
        this.filtersChanged.emit(state);
      });

    // Debounce search input
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchText => {
        this.filterService.updateSearchText(searchText);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(searchText: string): void {
    this.searchSubject.next(searchText);
  }

  onFileTypeChange(fileTypes: string[]): void {
    this.filterService.updateFileType(fileTypes);
  }

  onQualityTierChange(qualityTiers: string[]): void {
    this.filterService.updateQualityTier(qualityTiers);
  }

  onResolutionChange(resolutions: string[]): void {
    this.filterService.updateResolution(resolutions);
  }

  onCodecChange(codecs: string[]): void {
    this.filterService.updateCodec(codecs);
  }

  clearAllFilters(): void {
    this.filterService.clearAllFilters();
  }

  private updateLocalState(state: FilterState): void {
    this.searchText = state.searchText;
    this.selectedFileTypes = [...state.fileType];
    this.selectedQualityTiers = [...state.qualityTier];
    this.selectedResolutions = [...state.resolution];
    this.selectedCodecs = [...state.codec];
  }

  private updateActiveFilterInfo(): void {
    this.hasActiveFilters = this.filterService.hasActiveFilters();
    this.activeFilterCount = this.filterService.getActiveFilterCount();
  }
}