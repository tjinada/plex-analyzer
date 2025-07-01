import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

import { ConfigService } from '../../../../core/services/config.service';
import { AppConfig, ServiceConfig, ConfigStatus } from '../../../../models';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSnackBarModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <div class="settings-container">
      <div class="settings-header">
        <h1>Settings</h1>
        <p>Manage your service connections and API keys</p>
      </div>

      <mat-tab-group class="settings-tabs" animationDuration="300ms">
        <!-- Plex Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>movie</mat-icon>
            Plex
          </ng-template>
          <div class="tab-content">
            <mat-card class="service-card">
              <mat-card-header>
                <div mat-card-avatar class="plex-avatar">
                  <mat-icon>movie</mat-icon>
                </div>
                <mat-card-title>Plex Media Server</mat-card-title>
                <mat-card-subtitle>Configure your Plex server connection</mat-card-subtitle>
              </mat-card-header>
              
              <mat-card-content>
                <form [formGroup]="plexForm" class="service-form">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Server URL</mat-label>
                    <input matInput formControlName="url" placeholder="http://localhost:32400">
                    <mat-icon matPrefix>link</mat-icon>
                    <mat-error *ngIf="plexForm.get('url')?.hasError('required')">
                      Server URL is required
                    </mat-error>
                    <mat-error *ngIf="plexForm.get('url')?.hasError('pattern')">
                      Please enter a valid URL
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Token</mat-label>
                    <input matInput formControlName="token" type="password" placeholder="Your Plex token">
                    <mat-icon matPrefix>key</mat-icon>
                    <mat-error *ngIf="plexForm.get('token')?.hasError('required')">
                      Token is required
                    </mat-error>
                  </mat-form-field>

                  <div class="connection-status" *ngIf="plexStatus">
                    <mat-chip-listbox>
                      <mat-chip-option [class]="plexStatus.connected ? 'status-success' : 'status-error'">
                        <mat-icon>{{ plexStatus.connected ? 'check_circle' : 'error' }}</mat-icon>
                        {{ plexStatus.connected ? 'Connected' : 'Connection Failed' }}
                      </mat-chip-option>
                    </mat-chip-listbox>
                    <p class="status-message" *ngIf="plexStatus.message">{{ plexStatus.message }}</p>
                  </div>
                </form>
              </mat-card-content>

              <mat-card-actions align="end">
                <button mat-button (click)="testConnection('plex')" [disabled]="plexTesting || plexForm.invalid">
                  <mat-spinner diameter="20" *ngIf="plexTesting"></mat-spinner>
                  <mat-icon *ngIf="!plexTesting">wifi</mat-icon>
                  Test Connection
                </button>
                <button mat-raised-button color="primary" (click)="saveSettings('plex')" [disabled]="plexForm.invalid || plexSaving">
                  <mat-spinner diameter="20" *ngIf="plexSaving"></mat-spinner>
                  <mat-icon *ngIf="!plexSaving">save</mat-icon>
                  Save Settings
                </button>
              </mat-card-actions>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tautulli Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>analytics</mat-icon>
            Tautulli
          </ng-template>
          <div class="tab-content">
            <mat-card class="service-card">
              <mat-card-header>
                <div mat-card-avatar class="tautulli-avatar">
                  <mat-icon>analytics</mat-icon>
                </div>
                <mat-card-title>Tautulli</mat-card-title>
                <mat-card-subtitle>Configure your Tautulli connection</mat-card-subtitle>
              </mat-card-header>
              
              <mat-card-content>
                <form [formGroup]="tautulliForm" class="service-form">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Server URL</mat-label>
                    <input matInput formControlName="url" placeholder="http://localhost:8181">
                    <mat-icon matPrefix>link</mat-icon>
                    <mat-error *ngIf="tautulliForm.get('url')?.hasError('required')">
                      Server URL is required
                    </mat-error>
                    <mat-error *ngIf="tautulliForm.get('url')?.hasError('pattern')">
                      Please enter a valid URL
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>API Key</mat-label>
                    <input matInput formControlName="apiKey" type="password" placeholder="Your Tautulli API key">
                    <mat-icon matPrefix>key</mat-icon>
                    <mat-error *ngIf="tautulliForm.get('apiKey')?.hasError('required')">
                      API Key is required
                    </mat-error>
                  </mat-form-field>

                  <div class="connection-status" *ngIf="tautulliStatus">
                    <mat-chip-listbox>
                      <mat-chip-option [class]="tautulliStatus.connected ? 'status-success' : 'status-error'">
                        <mat-icon>{{ tautulliStatus.connected ? 'check_circle' : 'error' }}</mat-icon>
                        {{ tautulliStatus.connected ? 'Connected' : 'Connection Failed' }}
                      </mat-chip-option>
                    </mat-chip-listbox>
                    <p class="status-message" *ngIf="tautulliStatus.message">{{ tautulliStatus.message }}</p>
                  </div>
                </form>
              </mat-card-content>

              <mat-card-actions align="end">
                <button mat-button (click)="testConnection('tautulli')" [disabled]="tautulliTesting || tautulliForm.invalid">
                  <mat-spinner diameter="20" *ngIf="tautulliTesting"></mat-spinner>
                  <mat-icon *ngIf="!tautulliTesting">wifi</mat-icon>
                  Test Connection
                </button>
                <button mat-raised-button color="primary" (click)="saveSettings('tautulli')" [disabled]="tautulliForm.invalid || tautulliSaving">
                  <mat-spinner diameter="20" *ngIf="tautulliSaving"></mat-spinner>
                  <mat-icon *ngIf="!tautulliSaving">save</mat-icon>
                  Save Settings
                </button>
              </mat-card-actions>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Radarr Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>movie_filter</mat-icon>
            Radarr
          </ng-template>
          <div class="tab-content">
            <mat-card class="service-card">
              <mat-card-header>
                <div mat-card-avatar class="radarr-avatar">
                  <mat-icon>movie_filter</mat-icon>
                </div>
                <mat-card-title>Radarr</mat-card-title>
                <mat-card-subtitle>Configure your Radarr connection</mat-card-subtitle>
              </mat-card-header>
              
              <mat-card-content>
                <form [formGroup]="radarrForm" class="service-form">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Server URL</mat-label>
                    <input matInput formControlName="url" placeholder="http://localhost:7878">
                    <mat-icon matPrefix>link</mat-icon>
                    <mat-error *ngIf="radarrForm.get('url')?.hasError('required')">
                      Server URL is required
                    </mat-error>
                    <mat-error *ngIf="radarrForm.get('url')?.hasError('pattern')">
                      Please enter a valid URL
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>API Key</mat-label>
                    <input matInput formControlName="apiKey" type="password" placeholder="Your Radarr API key">
                    <mat-icon matPrefix>key</mat-icon>
                    <mat-error *ngIf="radarrForm.get('apiKey')?.hasError('required')">
                      API Key is required
                    </mat-error>
                  </mat-form-field>

                  <div class="connection-status" *ngIf="radarrStatus">
                    <mat-chip-listbox>
                      <mat-chip-option [class]="radarrStatus.connected ? 'status-success' : 'status-error'">
                        <mat-icon>{{ radarrStatus.connected ? 'check_circle' : 'error' }}</mat-icon>
                        {{ radarrStatus.connected ? 'Connected' : 'Connection Failed' }}
                      </mat-chip-option>
                    </mat-chip-listbox>
                    <p class="status-message" *ngIf="radarrStatus.message">{{ radarrStatus.message }}</p>
                  </div>
                </form>
              </mat-card-content>

              <mat-card-actions align="end">
                <button mat-button (click)="testConnection('radarr')" [disabled]="radarrTesting || radarrForm.invalid">
                  <mat-spinner diameter="20" *ngIf="radarrTesting"></mat-spinner>
                  <mat-icon *ngIf="!radarrTesting">wifi</mat-icon>
                  Test Connection
                </button>
                <button mat-raised-button color="primary" (click)="saveSettings('radarr')" [disabled]="radarrForm.invalid || radarrSaving">
                  <mat-spinner diameter="20" *ngIf="radarrSaving"></mat-spinner>
                  <mat-icon *ngIf="!radarrSaving">save</mat-icon>
                  Save Settings
                </button>
              </mat-card-actions>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Sonarr Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>tv</mat-icon>
            Sonarr
          </ng-template>
          <div class="tab-content">
            <mat-card class="service-card">
              <mat-card-header>
                <div mat-card-avatar class="sonarr-avatar">
                  <mat-icon>tv</mat-icon>
                </div>
                <mat-card-title>Sonarr</mat-card-title>
                <mat-card-subtitle>Configure your Sonarr connection</mat-card-subtitle>
              </mat-card-header>
              
              <mat-card-content>
                <form [formGroup]="sonarrForm" class="service-form">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Server URL</mat-label>
                    <input matInput formControlName="url" placeholder="http://localhost:8989">
                    <mat-icon matPrefix>link</mat-icon>
                    <mat-error *ngIf="sonarrForm.get('url')?.hasError('required')">
                      Server URL is required
                    </mat-error>
                    <mat-error *ngIf="sonarrForm.get('url')?.hasError('pattern')">
                      Please enter a valid URL
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>API Key</mat-label>
                    <input matInput formControlName="apiKey" type="password" placeholder="Your Sonarr API key">
                    <mat-icon matPrefix>key</mat-icon>
                    <mat-error *ngIf="sonarrForm.get('apiKey')?.hasError('required')">
                      API Key is required
                    </mat-error>
                  </mat-form-field>

                  <div class="connection-status" *ngIf="sonarrStatus">
                    <mat-chip-listbox>
                      <mat-chip-option [class]="sonarrStatus.connected ? 'status-success' : 'status-error'">
                        <mat-icon>{{ sonarrStatus.connected ? 'check_circle' : 'error' }}</mat-icon>
                        {{ sonarrStatus.connected ? 'Connected' : 'Connection Failed' }}
                      </mat-chip-option>
                    </mat-chip-listbox>
                    <p class="status-message" *ngIf="sonarrStatus.message">{{ sonarrStatus.message }}</p>
                  </div>
                </form>
              </mat-card-content>

              <mat-card-actions align="end">
                <button mat-button (click)="testConnection('sonarr')" [disabled]="sonarrTesting || sonarrForm.invalid">
                  <mat-spinner diameter="20" *ngIf="sonarrTesting"></mat-spinner>
                  <mat-icon *ngIf="!sonarrTesting">wifi</mat-icon>
                  Test Connection
                </button>
                <button mat-raised-button color="primary" (click)="saveSettings('sonarr')" [disabled]="sonarrForm.invalid || sonarrSaving">
                  <mat-spinner diameter="20" *ngIf="sonarrSaving"></mat-spinner>
                  <mat-icon *ngIf="!sonarrSaving">save</mat-icon>
                  Save Settings
                </button>
              </mat-card-actions>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .settings-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 2rem;
      min-height: 100vh;
      background: var(--background-color);
    }

    .settings-header {
      text-align: center;
      margin-bottom: 2rem;
      
      h1 {
        margin: 0 0 0.5rem 0;
        color: var(--text-primary);
        font-size: 2rem;
        font-weight: 500;
      }
      
      p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 1.1rem;
      }
    }

    .settings-tabs {
      background: var(--surface-color);
      border-radius: 12px;
      box-shadow: var(--shadow-elevation-1);
      
      ::ng-deep .mat-mdc-tab-header {
        background: var(--surface-elevated);
        border-radius: 12px 12px 0 0;
        
        .mat-mdc-tab-label {
          color: var(--text-secondary);
          
          &.mdc-tab--active {
            color: var(--primary-color);
          }
          
          .mat-mdc-tab-label-content {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            
            mat-icon {
              font-size: 20px;
              width: 20px;
              height: 20px;
            }
          }
        }
      }
      
      ::ng-deep .mat-mdc-tab-body-wrapper {
        background: var(--surface-color);
        border-radius: 0 0 12px 12px;
      }
    }

    .tab-content {
      padding: 2rem;
    }

    .service-card {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      box-shadow: var(--shadow-elevation-1);
      
      mat-card-header {
        margin-bottom: 1rem;
        
        mat-card-title {
          color: var(--text-primary);
          font-size: 1.5rem;
          font-weight: 600;
        }
        
        mat-card-subtitle {
          color: var(--text-secondary);
          font-size: 1rem;
        }
      }
    }

    .plex-avatar {
      background: linear-gradient(135deg, #e5a00d 0%, #f2c94c 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .tautulli-avatar {
      background: linear-gradient(135deg, #ff8a65 0%, #ff7043 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .radarr-avatar {
      background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .sonarr-avatar {
      background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .service-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      
      .full-width {
        width: 100%;
      }
      
      mat-form-field {
        ::ng-deep .mat-mdc-form-field-subscript-wrapper {
          margin-top: 0.5rem;
        }
      }
    }

    .connection-status {
      margin-top: 1rem;
      padding: 1rem;
      background: var(--surface-elevated);
      border-radius: 8px;
      border: 1px solid var(--border-color);
      
      mat-chip-listbox {
        display: flex;
        
        .status-success {
          background: rgba(76, 175, 80, 0.15);
          color: var(--success-color);
          border: 1px solid rgba(76, 175, 80, 0.3);
        }
        
        .status-error {
          background: rgba(244, 67, 54, 0.15);
          color: var(--warn-color);
          border: 1px solid rgba(244, 67, 54, 0.3);
        }
        
        mat-chip-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          
          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }
      }
      
      .status-message {
        margin: 0.5rem 0 0 0;
        color: var(--text-secondary);
        font-size: 0.9rem;
      }
    }

    mat-card-actions {
      padding: 1rem 1.5rem;
      
      button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-left: 0.5rem;
        
        mat-spinner {
          margin-right: 0.25rem;
        }
        
        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
    }

    @media (max-width: 768px) {
      .settings-container {
        padding: 1rem;
      }
      
      .settings-header h1 {
        font-size: 1.5rem;
      }
      
      .tab-content {
        padding: 1rem;
      }
      
      mat-card-actions {
        flex-direction: column;
        align-items: stretch;
        
        button {
          margin: 0.25rem 0;
          justify-content: center;
        }
      }
    }
  `]
})
export class SettingsPageComponent implements OnInit {
  plexForm!: FormGroup;
  tautulliForm!: FormGroup;
  radarrForm!: FormGroup;
  sonarrForm!: FormGroup;

  // Loading states
  plexTesting = false;
  plexSaving = false;
  tautulliTesting = false;
  tautulliSaving = false;
  radarrTesting = false;
  radarrSaving = false;
  sonarrTesting = false;
  sonarrSaving = false;

  // Connection status
  plexStatus: { connected: boolean; message?: string } | null = null;
  tautulliStatus: { connected: boolean; message?: string } | null = null;
  radarrStatus: { connected: boolean; message?: string } | null = null;
  sonarrStatus: { connected: boolean; message?: string } | null = null;

  private urlPattern = /^https?:\/\/.+/;

  constructor(
    private fb: FormBuilder,
    private configService: ConfigService,
    private snackBar: MatSnackBar
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadCurrentSettings();
  }

  private initializeForms(): void {
    this.plexForm = this.fb.group({
      url: ['', [Validators.required, Validators.pattern(this.urlPattern)]],
      token: ['', Validators.required]
    });

    this.tautulliForm = this.fb.group({
      url: ['', [Validators.required, Validators.pattern(this.urlPattern)]],
      apiKey: ['', Validators.required]
    });

    this.radarrForm = this.fb.group({
      url: ['', [Validators.required, Validators.pattern(this.urlPattern)]],
      apiKey: ['', Validators.required]
    });

    this.sonarrForm = this.fb.group({
      url: ['', [Validators.required, Validators.pattern(this.urlPattern)]],
      apiKey: ['', Validators.required]
    });
  }

  private loadCurrentSettings(): void {
    const currentStatus = this.configService.getCurrentStatus();
    if (currentStatus && currentStatus.services) {
      // Load from current configuration status
      if (currentStatus.services['plex']) {
        this.plexForm.patchValue({
          url: currentStatus.services['plex'].url || '',
          token: '' // Token not stored in status for security
        });
      }

      if (currentStatus.services['tautulli']) {
        this.tautulliForm.patchValue({
          url: currentStatus.services['tautulli'].url || '',
          apiKey: '' // API key not stored in status for security
        });
      }

      if (currentStatus.services['radarr']) {
        this.radarrForm.patchValue({
          url: currentStatus.services['radarr'].url || '',
          apiKey: '' // API key not stored in status for security
        });
      }

      if (currentStatus.services['sonarr']) {
        this.sonarrForm.patchValue({
          url: currentStatus.services['sonarr'].url || '',
          apiKey: '' // API key not stored in status for security
        });
      }
    }
  }

  testConnection(service: 'plex' | 'tautulli' | 'radarr' | 'sonarr'): void {
    const form = this.getFormForService(service);
    if (form.invalid) return;

    this.setTestingState(service, true);
    
    // Create a minimal config for testing this specific service
    const serviceConfig: ServiceConfig = {
      url: form.get('url')?.value,
      apiKey: form.get('apiKey')?.value,
      token: form.get('token')?.value,
      enabled: true
    };

    // Create a test config with only this service
    const testConfig: any = {};
    testConfig[service] = serviceConfig;

    this.configService.testConnectionOnly(testConfig).subscribe({
      next: (result) => {
        this.setConnectionStatus(service, { connected: true, message: 'Connection successful' });
        this.snackBar.open(`${service.charAt(0).toUpperCase() + service.slice(1)} connection successful!`, 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.setConnectionStatus(service, { connected: false, message: error.message || 'Connection failed' });
        this.snackBar.open(`${service.charAt(0).toUpperCase() + service.slice(1)} connection failed!`, 'Close', { duration: 5000 });
      },
      complete: () => {
        this.setTestingState(service, false);
      }
    });
  }

  saveSettings(service: 'plex' | 'tautulli' | 'radarr' | 'sonarr'): void {
    const form = this.getFormForService(service);
    if (form.invalid) return;

    this.setSavingState(service, true);
    
    // Get current configuration
    const currentStatus = this.configService.getCurrentStatus();
    
    // Create updated config
    const serviceConfig: ServiceConfig = {
      url: form.get('url')?.value,
      apiKey: form.get('apiKey')?.value,
      token: form.get('token')?.value,
      enabled: true
    };

    // Build the complete config with current values and the updated service
    const updatedConfig: AppConfig = {
      plex: service === 'plex' ? serviceConfig : {
        url: currentStatus?.services['plex']?.url || '',
        token: '', // Will need to be re-entered
        enabled: currentStatus?.services['plex']?.enabled || false
      },
      tautulli: service === 'tautulli' ? serviceConfig : currentStatus?.services['tautulli'] ? {
        url: currentStatus.services['tautulli'].url || '',
        apiKey: '', // Will need to be re-entered
        enabled: currentStatus.services['tautulli'].enabled || false
      } : undefined,
      radarr: service === 'radarr' ? serviceConfig : currentStatus?.services['radarr'] ? {
        url: currentStatus.services['radarr'].url || '',
        apiKey: '', // Will need to be re-entered
        enabled: currentStatus.services['radarr'].enabled || false
      } : undefined,
      sonarr: service === 'sonarr' ? serviceConfig : currentStatus?.services['sonarr'] ? {
        url: currentStatus.services['sonarr'].url || '',
        apiKey: '', // Will need to be re-entered
        enabled: currentStatus.services['sonarr'].enabled || false
      } : undefined
    };

    this.configService.updateConfig(updatedConfig).subscribe({
      next: () => {
        this.snackBar.open(`${service.charAt(0).toUpperCase() + service.slice(1)} settings saved successfully!`, 'Close', { duration: 3000 });
        // Reload the current status to get updated information
        this.configService.loadConfigStatus().subscribe();
      },
      error: (error) => {
        this.snackBar.open(`Failed to save ${service} settings: ${error.message}`, 'Close', { duration: 5000 });
      },
      complete: () => {
        this.setSavingState(service, false);
      }
    });
  }

  private getFormForService(service: string): FormGroup {
    switch (service) {
      case 'plex': return this.plexForm;
      case 'tautulli': return this.tautulliForm;
      case 'radarr': return this.radarrForm;
      case 'sonarr': return this.sonarrForm;
      default: throw new Error(`Unknown service: ${service}`);
    }
  }

  private setTestingState(service: string, testing: boolean): void {
    switch (service) {
      case 'plex': this.plexTesting = testing; break;
      case 'tautulli': this.tautulliTesting = testing; break;
      case 'radarr': this.radarrTesting = testing; break;
      case 'sonarr': this.sonarrTesting = testing; break;
    }
  }

  private setSavingState(service: string, saving: boolean): void {
    switch (service) {
      case 'plex': this.plexSaving = saving; break;
      case 'tautulli': this.tautulliSaving = saving; break;
      case 'radarr': this.radarrSaving = saving; break;
      case 'sonarr': this.sonarrSaving = saving; break;
    }
  }

  private setConnectionStatus(service: string, status: { connected: boolean; message?: string }): void {
    switch (service) {
      case 'plex': this.plexStatus = status; break;
      case 'tautulli': this.tautulliStatus = status; break;
      case 'radarr': this.radarrStatus = status; break;
      case 'sonarr': this.sonarrStatus = status; break;
    }
  }
}