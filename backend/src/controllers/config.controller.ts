import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '../config/constants';
import { config, updateConfig } from '../config';
import { plexService } from '../services/plex.service';
import { tautulliService } from '../services/tautulli.service';
import { radarrService } from '../services/radarr.service';
import { sonarrService } from '../services/sonarr.service';
import { cache } from '../utils/cache.util';
import { ApiResponse, AppConfig } from '../models';

export class ConfigController {
  /**
   * Get current configuration status
   */
  async getConfig(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check if all services are configured
      const allServicesConfigured = this.areAllServicesConfigured();
      
      const response: ApiResponse<any> = {
        success: true,
        data: {
          isConfigured: allServicesConfigured,
          services: {
            plex: {
              configured: !!config.services.plex.url && !!config.services.plex.token,
              url: config.services.plex.url ? this.maskUrl(config.services.plex.url) : '',
            },
            tautulli: {
              configured: !!config.services.tautulli.url && !!config.services.tautulli.apiKey,
              enabled: config.services.tautulli.enabled,
              url: config.services.tautulli.url ? this.maskUrl(config.services.tautulli.url) : '',
            },
            radarr: {
              configured: !!config.services.radarr.url && !!config.services.radarr.apiKey,
              enabled: config.services.radarr.enabled,
              url: config.services.radarr.url ? this.maskUrl(config.services.radarr.url) : '',
            },
            sonarr: {
              configured: !!config.services.sonarr.url && !!config.services.sonarr.apiKey,
              enabled: config.services.sonarr.enabled,
              url: config.services.sonarr.url ? this.maskUrl(config.services.sonarr.url) : '',
            },
          },
        },
        timestamp: new Date().toISOString(),
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update configuration
   */
  async updateConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const newConfig: AppConfig = req.body;

      // Validate required Plex configuration
      if (!newConfig.plex?.url || !newConfig.plex?.token) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Plex URL and token are required',
            code: 'INVALID_CONFIG',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Update config and save to file
      const configToSave = {
        services: {
          plex: {
            url: newConfig.plex.url,
            token: newConfig.plex.token,
          },
          tautulli: {
            url: newConfig.tautulli?.url || '',
            apiKey: newConfig.tautulli?.apiKey || '',
            enabled: newConfig.tautulli?.enabled || false,
          },
          radarr: {
            url: newConfig.radarr?.url || '',
            apiKey: newConfig.radarr?.apiKey || '',
            enabled: newConfig.radarr?.enabled || false,
          },
          sonarr: {
            url: newConfig.sonarr?.url || '',
            apiKey: newConfig.sonarr?.apiKey || '',
            enabled: newConfig.sonarr?.enabled || false,
          },
        },
      };

      const saveSuccess = updateConfig(configToSave);
      if (!saveSuccess) {
        console.warn('[ConfigController] Failed to save configuration to file, continuing with in-memory only');
      }

      // Configure services
      console.log('[ConfigController] Configuring Plex service with:', {
        url: config.services.plex.url,
        tokenLength: config.services.plex.token?.length || 0
      });
      plexService.configure(config.services.plex.url, config.services.plex.token);

      if (config.services.tautulli.enabled && config.services.tautulli.url && config.services.tautulli.apiKey) {
        console.log('[ConfigController] Configuring Tautulli service with:', {
          url: config.services.tautulli.url,
          apiKeyLength: config.services.tautulli.apiKey?.length || 0
        });
        tautulliService.configure(config.services.tautulli.url, config.services.tautulli.apiKey);
      }

      if (config.services.radarr.enabled && config.services.radarr.url && config.services.radarr.apiKey) {
        console.log('[ConfigController] Configuring Radarr service with:', {
          url: config.services.radarr.url,
          apiKeyLength: config.services.radarr.apiKey?.length || 0
        });
        radarrService.configure(config.services.radarr.url, config.services.radarr.apiKey);
      }

      if (config.services.sonarr.enabled && config.services.sonarr.url && config.services.sonarr.apiKey) {
        console.log('[ConfigController] Configuring Sonarr service with:', {
          url: config.services.sonarr.url,
          apiKeyLength: config.services.sonarr.apiKey?.length || 0
        });
        sonarrService.configure(config.services.sonarr.url, config.services.sonarr.apiKey);
      }

      // Test Plex connection (required)
      const isPlexConnected = await plexService.testConnection();
      if (!isPlexConnected) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Unable to connect to Plex server. Please check URL and token.',
            code: 'PLEX_CONNECTION_FAILED',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Clear cache after configuration change
      cache.clear();

      const response: ApiResponse = {
        success: true,
        data: {
          message: 'Configuration updated successfully',
          isConfigured: true,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Test service connections without saving configuration
   */
  async testConnectionsOnly(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const testConfig: AppConfig = req.body;
      console.log('[ConfigController] Testing connections without saving:', testConfig);
      
      const results = {
        plex: false,
        tautulli: false,
        radarr: false,
        sonarr: false,
      };

      // Test Plex connection if provided
      if (testConfig.plex?.url && testConfig.plex?.token) {
        console.log('[ConfigController] Testing Plex connection (temp)...');
        try {
          // Temporarily configure Plex service for testing
          plexService.configure(testConfig.plex.url, testConfig.plex.token);
          results.plex = await plexService.testConnection();
          console.log('[ConfigController] Plex test result:', results.plex);
        } catch (error) {
          console.warn('[ConfigController] Plex test failed:', error);
          results.plex = false;
        }
      }

      // Test Tautulli connection if provided
      if (testConfig.tautulli?.url && testConfig.tautulli?.apiKey) {
        console.log('[ConfigController] Testing Tautulli connection (temp)...');
        try {
          tautulliService.configure(testConfig.tautulli.url, testConfig.tautulli.apiKey);
          results.tautulli = await tautulliService.testConnection();
          console.log('[ConfigController] Tautulli test result:', results.tautulli);
        } catch (error) {
          console.warn('[ConfigController] Tautulli test failed:', error);
          results.tautulli = false;
        }
      }

      // Test Radarr connection if provided
      if (testConfig.radarr?.url && testConfig.radarr?.apiKey) {
        console.log('[ConfigController] Testing Radarr connection (temp)...');
        try {
          radarrService.configure(testConfig.radarr.url, testConfig.radarr.apiKey);
          results.radarr = await radarrService.testConnection();
          console.log('[ConfigController] Radarr test result:', results.radarr);
        } catch (error) {
          console.warn('[ConfigController] Radarr test failed:', error);
          results.radarr = false;
        }
      }

      // Test Sonarr connection if provided
      if (testConfig.sonarr?.url && testConfig.sonarr?.apiKey) {
        console.log('[ConfigController] Testing Sonarr connection (temp)...');
        try {
          sonarrService.configure(testConfig.sonarr.url, testConfig.sonarr.apiKey);
          results.sonarr = await sonarrService.testConnection();
          console.log('[ConfigController] Sonarr test result:', results.sonarr);
        } catch (error) {
          console.warn('[ConfigController] Sonarr test failed:', error);
          results.sonarr = false;
        }
      }

      // Re-configure services with actual saved configuration
      if (config.services.plex.url && config.services.plex.token) {
        plexService.configure(config.services.plex.url, config.services.plex.token);
      }
      if (config.services.tautulli.enabled && config.services.tautulli.url && config.services.tautulli.apiKey) {
        tautulliService.configure(config.services.tautulli.url, config.services.tautulli.apiKey);
      }
      if (config.services.radarr.enabled && config.services.radarr.url && config.services.radarr.apiKey) {
        radarrService.configure(config.services.radarr.url, config.services.radarr.apiKey);
      }
      if (config.services.sonarr.enabled && config.services.sonarr.url && config.services.sonarr.apiKey) {
        sonarrService.configure(config.services.sonarr.url, config.services.sonarr.apiKey);
      }

      const response: ApiResponse = {
        success: true,
        data: results,
        timestamp: new Date().toISOString(),
      };

      console.log('[ConfigController] Test-only results:', results);
      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Test service connections
   */
  async testConnections(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('[ConfigController] Starting connection tests...');
      console.log('[ConfigController] Current config state:', {
        plex: {
          url: config.services.plex.url ? 'SET' : 'NOT SET',
          token: config.services.plex.token ? 'SET' : 'NOT SET'
        },
        tautulli: {
          url: config.services.tautulli.url ? 'SET' : 'NOT SET',
          apiKey: config.services.tautulli.apiKey ? 'SET' : 'NOT SET',
          enabled: config.services.tautulli.enabled
        }
      });
      
      const results = {
        plex: false,
        tautulli: false,
        radarr: false,
        sonarr: false,
      };

      // Test all service connections
      console.log('[ConfigController] Testing Plex connection...');
      console.log('[ConfigController] Plex service ready:', plexService.isReady());
      
      if (plexService.isReady()) {
        results.plex = await plexService.testConnection();
        console.log('[ConfigController] Plex connection result:', results.plex);
      } else {
        console.log('[ConfigController] Plex service not ready/configured');
      }

      console.log('[ConfigController] Testing Tautulli connection...');
      console.log('[ConfigController] Tautulli service ready:', tautulliService.isReady());
      
      if (tautulliService.isReady()) {
        try {
          results.tautulli = await tautulliService.testConnection();
          console.log('[ConfigController] Tautulli connection result:', results.tautulli);
        } catch (error) {
          console.warn('[ConfigController] Tautulli connection test failed:', error);
          results.tautulli = false;
        }
      } else {
        console.log('[ConfigController] Tautulli service not ready/configured');
      }

      console.log('[ConfigController] Testing Radarr connection...');
      console.log('[ConfigController] Radarr service ready:', radarrService.isReady());
      
      if (radarrService.isReady()) {
        try {
          results.radarr = await radarrService.testConnection();
          console.log('[ConfigController] Radarr connection result:', results.radarr);
        } catch (error) {
          console.warn('[ConfigController] Radarr connection test failed:', error);
          results.radarr = false;
        }
      } else {
        console.log('[ConfigController] Radarr service not ready/configured');
      }

      console.log('[ConfigController] Testing Sonarr connection...');
      console.log('[ConfigController] Sonarr service ready:', sonarrService.isReady());
      
      if (sonarrService.isReady()) {
        try {
          results.sonarr = await sonarrService.testConnection();
          console.log('[ConfigController] Sonarr connection result:', results.sonarr);
        } catch (error) {
          console.warn('[ConfigController] Sonarr connection test failed:', error);
          results.sonarr = false;
        }
      } else {
        console.log('[ConfigController] Sonarr service not ready/configured');
      }

      const response: ApiResponse = {
        success: true,
        data: results,
        timestamp: new Date().toISOString(),
      };

      console.log('[ConfigController] Connection test results:', results);
      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset configuration
   */
  async resetConfig(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Clear configuration
      const emptyConfig = {
        services: {
          plex: {
            url: '',
            token: '',
          },
          tautulli: {
            url: '',
            apiKey: '',
            enabled: false,
          },
          radarr: {
            url: '',
            apiKey: '',
            enabled: false,
          },
          sonarr: {
            url: '',
            apiKey: '',
            enabled: false,
          },
        },
      };

      const saveSuccess = updateConfig(emptyConfig);
      if (!saveSuccess) {
        console.warn('[ConfigController] Failed to save reset configuration to file');
      }

      // Clear cache
      cache.clear();

      const response: ApiResponse = {
        success: true,
        data: {
          message: 'Configuration reset successfully',
        },
        timestamp: new Date().toISOString(),
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if all required services are configured
   */
  private areAllServicesConfigured(): boolean {
    // Plex is required
    const plexConfigured = !!config.services.plex.url && !!config.services.plex.token;
    
    // Tautulli is required
    const tautulliConfigured = !!config.services.tautulli.url && !!config.services.tautulli.apiKey;
    
    // Radarr is required
    const radarrConfigured = !!config.services.radarr.url && !!config.services.radarr.apiKey;
    
    // Sonarr is required
    const sonarrConfigured = !!config.services.sonarr.url && !!config.services.sonarr.apiKey;
    
    const allConfigured = plexConfigured && tautulliConfigured && radarrConfigured && sonarrConfigured;
    
    console.log('[ConfigController] All services configuration check:', {
      plex: plexConfigured,
      tautulli: tautulliConfigured,
      radarr: radarrConfigured,
      sonarr: sonarrConfigured,
      allConfigured
    });
    
    return allConfigured;
  }

  /**
   * Mask sensitive parts of URLs for display
   */
  private maskUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}:${urlObj.port || ''}`;
    } catch {
      return url.substring(0, 20) + '...';
    }
  }
}

export const configController = new ConfigController();