import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { Router } from '@angular/router';

import { ConfigService } from '../../../../core/services/config.service';
import { AppConfig } from '../../../../models';
import { LoadingComponent } from '../../../../shared';

@Component({
  selector: 'app-setup-wizard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatStepperModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSnackBarModule,
    MatListModule,
    LoadingComponent
  ],
  templateUrl: './setup-wizard.component.html',
  styleUrl: './setup-wizard.component.scss'
})
export class SetupWizardComponent implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;
  
  plexForm: FormGroup;
  tautulliForm: FormGroup;
  radarrForm: FormGroup;
  sonarrForm: FormGroup;
  
  isLoading = false;
  connectionResults: { [key: string]: boolean } = {};
  
  // Individual connection test states
  isTestingPlex = false;
  plexConnectionStatus: boolean | null = null;
  
  isTestingTautulli = false;
  tautulliConnectionStatus: boolean | null = null;
  
  isTestingRadarr = false;
  radarrConnectionStatus: boolean | null = null;
  
  isTestingSonarr = false;
  sonarrConnectionStatus: boolean | null = null;

  constructor(
    private fb: FormBuilder,
    private configService: ConfigService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.plexForm = this.fb.group({
      url: ['http://localhost:32400', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      token: ['', Validators.required]
    });

    this.tautulliForm = this.fb.group({
      url: ['http://localhost:8181', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      apiKey: ['', Validators.required]
    });

    this.radarrForm = this.fb.group({
      url: ['http://localhost:7878', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      apiKey: ['', Validators.required]
    });

    this.sonarrForm = this.fb.group({
      url: ['http://localhost:8989', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      apiKey: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Load existing configuration if available
    this.configService.loadConfigStatus().subscribe(status => {
      if (status.isConfigured) {
        this.populateExistingConfig(status);
      }
    });

    // Reset connection status when forms change
    this.plexForm.valueChanges.subscribe(() => {
      this.plexConnectionStatus = null;
    });

    this.tautulliForm.valueChanges.subscribe(() => {
      this.tautulliConnectionStatus = null;
    });

    this.radarrForm.valueChanges.subscribe(() => {
      this.radarrConnectionStatus = null;
    });

    this.sonarrForm.valueChanges.subscribe(() => {
      this.sonarrConnectionStatus = null;
    });
  }

  private populateExistingConfig(status: any): void {
    if (status.services.plex?.configured) {
      this.plexForm.patchValue({
        url: status.services.plex.url || 'http://localhost:32400'
      });
    }

    // Populate other services
    if (status.services.tautulli?.configured) {
      this.tautulliForm.patchValue({
        url: status.services.tautulli.url || 'http://localhost:8181',
        apiKey: status.services.tautulli.apiKey || ''
      });
    }

    if (status.services.radarr?.configured) {
      this.radarrForm.patchValue({
        url: status.services.radarr.url || 'http://localhost:7878',
        apiKey: status.services.radarr.apiKey || ''
      });
    }

    if (status.services.sonarr?.configured) {
      this.sonarrForm.patchValue({
        url: status.services.sonarr.url || 'http://localhost:8989',
        apiKey: status.services.sonarr.apiKey || ''
      });
    }
  }

  async testConnections(): Promise<void> {
    this.isLoading = true;
    this.connectionResults = {};

    try {
      const config = this.buildConfig();
      await this.configService.updateConfig(config).toPromise();
      
      const testResults = await this.configService.testConnections().toPromise();
      this.connectionResults = testResults.data;
      
      const allGood = this.connectionResults['plex'];
      if (allGood) {
        this.snackBar.open('Connection test successful!', 'Close', { duration: 3000 });
      } else {
        this.snackBar.open('Plex connection failed. Please check your configuration.', 'Close', { duration: 5000 });
      }
    } catch (error) {
      this.snackBar.open('Connection test failed. Please check your configuration.', 'Close', { duration: 5000 });
    } finally {
      this.isLoading = false;
    }
  }

  async saveConfiguration(): Promise<void> {
    if (this.plexForm.invalid) {
      this.snackBar.open('Please fill in all required Plex fields.', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;

    try {
      const config = this.buildConfig();
      await this.configService.updateConfig(config).toPromise();
      
      this.snackBar.open('Configuration saved successfully!', 'Close', { duration: 3000 });
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      const message = error?.error?.error?.message || 'Failed to save configuration';
      this.snackBar.open(message, 'Close', { duration: 5000 });
    } finally {
      this.isLoading = false;
    }
  }

  private buildConfig(): AppConfig {
    const config: AppConfig = {
      plex: {
        url: this.plexForm.value.url,
        token: this.plexForm.value.token
      },
      tautulli: {
        url: this.tautulliForm.value.url,
        apiKey: this.tautulliForm.value.apiKey,
        enabled: true
      },
      radarr: {
        url: this.radarrForm.value.url,
        apiKey: this.radarrForm.value.apiKey,
        enabled: true
      },
      sonarr: {
        url: this.sonarrForm.value.url,
        apiKey: this.sonarrForm.value.apiKey,
        enabled: true
      }
    };

    return config;
  }

  getConnectionIcon(service: string): string {
    if (this.connectionResults[service] === true) return '✅';
    if (this.connectionResults[service] === false) return '❌';
    return '⚪';
  }

  /**
   * Check if Plex step is completed (saved successfully)
   */
  isPlexStepCompleted(): boolean {
    // Step is completed when form is valid, connection tested successfully, and configuration saved
    return this.plexForm.valid && this.plexConnectionStatus === true;
  }

  /**
   * Test Plex connection individually
   */
  async testPlexConnection(): Promise<void> {
    if (this.plexForm.invalid) return;
    
    this.isTestingPlex = true;
    this.plexConnectionStatus = null;

    try {
      // Test connection without saving to persistent storage
      const testData = {
        plex: {
          url: this.plexForm.value.url,
          token: this.plexForm.value.token
        }
      };

      // Use a dedicated test endpoint that doesn't save configuration
      const testResults = await this.configService.testConnectionOnly(testData).toPromise();
      
      this.plexConnectionStatus = testResults.data.plex;
      
      if (this.plexConnectionStatus) {
        this.snackBar.open('Plex connection successful!', 'Close', { duration: 3000 });
      } else {
        this.snackBar.open('Plex connection failed. Please check your settings.', 'Close', { duration: 5000 });
      }
    } catch (error: any) {
      this.plexConnectionStatus = false;
      const message = error?.error?.error?.message || 'Failed to test connection';
      this.snackBar.open(message, 'Close', { duration: 5000 });
    } finally {
      this.isTestingPlex = false;
    }
  }

  /**
   * Test Tautulli connection
   */
  async testTautulliConnection(): Promise<void> {
    console.log('[Frontend] Starting Tautulli connection test...');
    
    if (this.tautulliForm.invalid) {
      console.log('[Frontend] Tautulli form is invalid');
      return;
    }
    
    const tautulliConfig = this.tautulliForm.value;
    console.log('[Frontend] Tautulli config:', tautulliConfig);
    
    this.isTestingTautulli = true;
    this.tautulliConnectionStatus = null;

    try {
      // Test connection without saving to persistent storage
      const testData = {
        tautulli: {
          url: tautulliConfig.url,
          apiKey: tautulliConfig.apiKey,
          enabled: true
        }
      };

      console.log('[Frontend] Testing Tautulli connection without saving...');
      const testResults = await this.configService.testConnectionOnly(testData).toPromise();
      console.log('[Frontend] Test results received:', testResults);
      
      this.tautulliConnectionStatus = testResults.data.tautulli;
      
      if (this.tautulliConnectionStatus) {
        this.snackBar.open('Tautulli connection successful!', 'Close', { duration: 3000 });
      } else {
        this.snackBar.open('Tautulli connection failed. Please check your settings.', 'Close', { duration: 5000 });
      }
    } catch (error) {
      this.tautulliConnectionStatus = false;
      this.snackBar.open('Failed to test Tautulli connection', 'Close', { duration: 5000 });
    } finally {
      this.isTestingTautulli = false;
    }
  }

  /**
   * Test Radarr connection
   */
  async testRadarrConnection(): Promise<void> {
    if (this.radarrForm.invalid) return;
    
    const radarrConfig = this.radarrForm.value;
    
    this.isTestingRadarr = true;
    this.radarrConnectionStatus = null;

    try {
      // Test connection without saving to persistent storage
      const testData = {
        radarr: {
          url: radarrConfig.url,
          apiKey: radarrConfig.apiKey,
          enabled: true
        }
      };

      const testResults = await this.configService.testConnectionOnly(testData).toPromise();
      
      this.radarrConnectionStatus = testResults.data.radarr;
      
      if (this.radarrConnectionStatus) {
        this.snackBar.open('Radarr connection successful!', 'Close', { duration: 3000 });
      } else {
        this.snackBar.open('Radarr connection failed. Please check your settings.', 'Close', { duration: 5000 });
      }
    } catch (error) {
      this.radarrConnectionStatus = false;
      this.snackBar.open('Failed to test Radarr connection', 'Close', { duration: 5000 });
    } finally {
      this.isTestingRadarr = false;
    }
  }

  /**
   * Test Sonarr connection
   */
  async testSonarrConnection(): Promise<void> {
    if (this.sonarrForm.invalid) return;
    
    const sonarrConfig = this.sonarrForm.value;
    
    this.isTestingSonarr = true;
    this.sonarrConnectionStatus = null;

    try {
      // Test connection without saving to persistent storage
      const testData = {
        sonarr: {
          url: sonarrConfig.url,
          apiKey: sonarrConfig.apiKey,
          enabled: true
        }
      };

      const testResults = await this.configService.testConnectionOnly(testData).toPromise();
      
      this.sonarrConnectionStatus = testResults.data.sonarr;
      
      if (this.sonarrConnectionStatus) {
        this.snackBar.open('Sonarr connection successful!', 'Close', { duration: 3000 });
      } else {
        this.snackBar.open('Sonarr connection failed. Please check your settings.', 'Close', { duration: 5000 });
      }
    } catch (error) {
      this.sonarrConnectionStatus = false;
      this.snackBar.open('Failed to test Sonarr connection', 'Close', { duration: 5000 });
    } finally {
      this.isTestingSonarr = false;
    }
  }

  /**
   * Save and proceed to Tautulli step
   */
  async saveAndProceedToTautulli(): Promise<void> {
    console.log('[Frontend] saveAndProceedToTautulli called');
    console.log('[Frontend] plexConnectionStatus:', this.plexConnectionStatus);
    console.log('[Frontend] plexForm.valid:', this.plexForm.valid);
    
    if (this.plexConnectionStatus === true) {
      console.log('[Frontend] Saving Plex configuration...');
      try {
        const config: AppConfig = {
          plex: {
            url: this.plexForm.value.url,
            token: this.plexForm.value.token
          }
        };
        console.log('[Frontend] Config to save:', config);
        
        const result = await this.configService.updateConfig(config).toPromise();
        console.log('[Frontend] Config saved successfully:', result);
        
        console.log('[Frontend] Advancing to next step...');
        
        // Force stepper to advance using setTimeout to ensure DOM is updated
        setTimeout(() => {
          this.stepper.selectedIndex = 1; // Go to Tautulli step (index 1)
          console.log('[Frontend] Stepper advanced to index:', this.stepper.selectedIndex);
        }, 100);
      } catch (error) {
        console.error('[Frontend] Failed to save Plex configuration:', error);
        this.snackBar.open('Failed to save Plex configuration', 'Close', { duration: 5000 });
      }
    } else {
      console.log('[Frontend] Cannot proceed - connection not successful');
    }
  }

  /**
   * Save and proceed to Radarr step
   */
  async saveAndProceedToRadarr(): Promise<void> {
    if (this.tautulliConnectionStatus === true) {
      // Save Tautulli configuration
      try {
        const config: AppConfig = {
          plex: {
            url: this.plexForm.value.url,
            token: this.plexForm.value.token
          },
          tautulli: {
            url: this.tautulliForm.value.url,
            apiKey: this.tautulliForm.value.apiKey,
            enabled: true
          }
        };
        await this.configService.updateConfig(config).toPromise();
        this.stepper.next();
      } catch (error) {
        this.snackBar.open('Failed to save Tautulli configuration', 'Close', { duration: 5000 });
      }
    }
  }

  /**
   * Save and proceed to Sonarr step
   */
  async saveAndProceedToSonarr(): Promise<void> {
    if (this.radarrConnectionStatus === true) {
      // Save Radarr configuration
      try {
        const config: AppConfig = {
          plex: {
            url: this.plexForm.value.url,
            token: this.plexForm.value.token
          },
          tautulli: {
            url: this.tautulliForm.value.url,
            apiKey: this.tautulliForm.value.apiKey,
            enabled: true
          },
          radarr: {
            url: this.radarrForm.value.url,
            apiKey: this.radarrForm.value.apiKey,
            enabled: true
          }
        };
        await this.configService.updateConfig(config).toPromise();
        this.stepper.next();
      } catch (error) {
        this.snackBar.open('Failed to save Radarr configuration', 'Close', { duration: 5000 });
      }
    }
  }

  /**
   * Save and complete setup
   */
  async saveAndComplete(): Promise<void> {
    // Validate all connections are successful before completing
    if (this.plexConnectionStatus !== true ||
        this.tautulliConnectionStatus !== true ||
        this.radarrConnectionStatus !== true ||
        this.sonarrConnectionStatus !== true) {
      this.snackBar.open('Please test and verify all service connections before completing setup', 'Close', { duration: 5000 });
      return;
    }

    this.isLoading = true;

    try {
      // Build final configuration with all services
      const config: AppConfig = {
        plex: {
          url: this.plexForm.value.url,
          token: this.plexForm.value.token
        },
        tautulli: {
          url: this.tautulliForm.value.url,
          apiKey: this.tautulliForm.value.apiKey,
          enabled: true
        },
        radarr: {
          url: this.radarrForm.value.url,
          apiKey: this.radarrForm.value.apiKey,
          enabled: true
        },
        sonarr: {
          url: this.sonarrForm.value.url,
          apiKey: this.sonarrForm.value.apiKey,
          enabled: true
        }
      };

      await this.configService.updateConfig(config).toPromise();
      
      this.snackBar.open('Setup completed successfully!', 'Close', { duration: 3000 });
      this.router.navigate(['/dashboard']);
    } catch (error) {
      this.snackBar.open('Failed to complete setup', 'Close', { duration: 5000 });
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Navigation methods
   */
  goBackToPlex(): void {
    this.stepper.previous();
  }

  goBackToTautulli(): void {
    this.stepper.previous();
  }

  goBackToRadarr(): void {
    this.stepper.previous();
  }

}
