import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env') });

// Configuration file path
const CONFIG_FILE_PATH = path.join(__dirname, '..', '..', '..', 'config.json');

interface ConfigData {
  services: {
    plex: {
      url: string;
      token: string;
    };
    tautulli: {
      url: string;
      apiKey: string;
      enabled: boolean;
    };
    radarr: {
      url: string;
      apiKey: string;
      enabled: boolean;
    };
    sonarr: {
      url: string;
      apiKey: string;
      enabled: boolean;
    };
  };
  settings?: {
    dataSource?: 'plex' | 'tautulli'; // Default to 'plex' if not specified
    qualityPreferences?: {
      movies?: {
        preferredResolution?: '4K' | '1080p' | '720p' | '480p';
        acceptableResolutions?: string[];
      };
      tvShows?: {
        preferredResolution?: '4K' | '1080p' | '720p' | '480p';
        acceptableResolutions?: string[];
      };
    };
  };
  lastUpdated: string | null;
}

/**
 * Load configuration from config.json file
 */
function loadConfigFromFile(): ConfigData | null {
  try {
    if (!fs.existsSync(CONFIG_FILE_PATH)) {
      console.log('[Config] config.json not found, will create on first save');
      return null;
    }

    // Check file permissions
    try {
      fs.accessSync(CONFIG_FILE_PATH, fs.constants.R_OK);
    } catch (permissionError) {
      console.error('[Config] No read permission for config.json:', permissionError);
      return null;
    }

    const configContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
    
    // Validate JSON content
    if (!configContent.trim()) {
      console.warn('[Config] config.json is empty, using defaults');
      return null;
    }

    const parsedConfig = JSON.parse(configContent);
    
    // Validate config structure
    if (!parsedConfig.services) {
      console.warn('[Config] Invalid config structure, missing services section');
      return null;
    }
    
    console.log('[Config] Successfully loaded configuration from file');
    return parsedConfig;
  } catch (error: any) {
    if (error.name === 'SyntaxError') {
      console.error('[Config] Invalid JSON in config.json, using defaults:', error.message);
    } else {
      console.error('[Config] Error loading config from file:', error.message);
    }
    return null;
  }
}

/**
 * Save configuration to config.json file
 */
function saveConfigToFile(configData: ConfigData): boolean {
  try {
    // Check directory permissions
    const configDir = path.dirname(CONFIG_FILE_PATH);
    if (!fs.existsSync(configDir)) {
      console.error('[Config] Config directory does not exist:', configDir);
      return false;
    }

    try {
      fs.accessSync(configDir, fs.constants.W_OK);
    } catch (permissionError) {
      console.error('[Config] No write permission for config directory:', permissionError);
      return false;
    }

    // Check file permissions if file exists
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      try {
        fs.accessSync(CONFIG_FILE_PATH, fs.constants.W_OK);
      } catch (permissionError) {
        console.error('[Config] No write permission for config.json:', permissionError);
        return false;
      }
    }

    configData.lastUpdated = new Date().toISOString();
    const configContent = JSON.stringify(configData, null, 2);
    
    // Write to temporary file first, then rename for atomic operation
    const tempFilePath = CONFIG_FILE_PATH + '.tmp';
    fs.writeFileSync(tempFilePath, configContent, 'utf8');
    fs.renameSync(tempFilePath, CONFIG_FILE_PATH);
    
    console.log('[Config] Successfully saved configuration to file');
    return true;
  } catch (error: any) {
    console.error('[Config] Error saving config to file:', error.message);
    
    // Clean up temporary file if it exists
    const tempFilePath = CONFIG_FILE_PATH + '.tmp';
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (cleanupError) {
      console.warn('[Config] Could not clean up temporary file:', cleanupError);
    }
    
    return false;
  }
}

// Load initial configuration from file or use defaults
const fileConfig = loadConfigFromFile();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // API Configuration
  apiPrefix: process.env.API_PREFIX || '/api',
  apiVersion: process.env.API_VERSION || 'v1',
  
  // CORS Configuration
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  
  // Cache Configuration
  cacheEnabled: process.env.CACHE_ENABLED !== 'false',
  cacheTtl: parseInt(process.env.CACHE_TTL || '300000', 10), // 5 minutes default
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Service URLs - load from file if available, otherwise use environment variables
  services: {
    plex: {
      url: fileConfig?.services.plex.url || process.env.PLEX_URL || '',
      token: fileConfig?.services.plex.token || process.env.PLEX_TOKEN || '',
    },
    tautulli: {
      url: fileConfig?.services.tautulli.url || process.env.TAUTULLI_URL || '',
      apiKey: fileConfig?.services.tautulli.apiKey || process.env.TAUTULLI_API_KEY || '',
      enabled: fileConfig?.services.tautulli.enabled ?? (process.env.TAUTULLI_ENABLED === 'true'),
    },
    radarr: {
      url: fileConfig?.services.radarr.url || process.env.RADARR_URL || '',
      apiKey: fileConfig?.services.radarr.apiKey || process.env.RADARR_API_KEY || '',
      enabled: fileConfig?.services.radarr.enabled ?? (process.env.RADARR_ENABLED === 'true'),
    },
    sonarr: {
      url: fileConfig?.services.sonarr.url || process.env.SONARR_URL || '',
      apiKey: fileConfig?.services.sonarr.apiKey || process.env.SONARR_API_KEY || '',
      enabled: fileConfig?.services.sonarr.enabled ?? (process.env.SONARR_ENABLED === 'true'),
    },
  },
  
  // Settings - load from file if available, otherwise use defaults
  settings: {
    dataSource: fileConfig?.settings?.dataSource || (process.env.DATA_SOURCE as 'plex' | 'tautulli') || 'plex',
    qualityPreferences: fileConfig?.settings?.qualityPreferences || {
      movies: {
        preferredResolution: '4K' as const,
        acceptableResolutions: ['4K', '1080p']
      },
      tvShows: {
        preferredResolution: '1080p' as const,
        acceptableResolutions: ['1080p', '720p']
      }
    },
  },
};

/**
 * Update configuration and save to file
 */
export function updateConfig(newConfig: Partial<ConfigData>): boolean {
  try {
    // Update in-memory config
    if (newConfig.services?.plex) {
      config.services.plex.url = newConfig.services.plex.url || config.services.plex.url;
      config.services.plex.token = newConfig.services.plex.token || config.services.plex.token;
    }
    
    if (newConfig.services?.tautulli) {
      config.services.tautulli.url = newConfig.services.tautulli.url || config.services.tautulli.url;
      config.services.tautulli.apiKey = newConfig.services.tautulli.apiKey || config.services.tautulli.apiKey;
      config.services.tautulli.enabled = newConfig.services.tautulli.enabled ?? config.services.tautulli.enabled;
    }
    
    if (newConfig.services?.radarr) {
      config.services.radarr.url = newConfig.services.radarr.url || config.services.radarr.url;
      config.services.radarr.apiKey = newConfig.services.radarr.apiKey || config.services.radarr.apiKey;
      config.services.radarr.enabled = newConfig.services.radarr.enabled ?? config.services.radarr.enabled;
    }
    
    if (newConfig.services?.sonarr) {
      config.services.sonarr.url = newConfig.services.sonarr.url || config.services.sonarr.url;
      config.services.sonarr.apiKey = newConfig.services.sonarr.apiKey || config.services.sonarr.apiKey;
      config.services.sonarr.enabled = newConfig.services.sonarr.enabled ?? config.services.sonarr.enabled;
    }
    
    // Update settings if provided
    if (newConfig.settings) {
      config.settings.dataSource = newConfig.settings.dataSource || config.settings.dataSource;
      if (newConfig.settings.qualityPreferences) {
        config.settings.qualityPreferences = {
          ...config.settings.qualityPreferences,
          ...newConfig.settings.qualityPreferences
        };
      }
    }

    // Save to file
    const configToSave: ConfigData = {
      services: { ...config.services },
      settings: { ...config.settings },
      lastUpdated: null // Will be set by saveConfigToFile
    };
    
    return saveConfigToFile(configToSave);
  } catch (error) {
    console.error('[Config] Error updating configuration:', error);
    return false;
  }
}

// Configure services automatically on startup if config is available
function configureServicesOnStartup(): void {
  console.log('[Config] Configuring services on startup...');
  
  // Import services (using dynamic import to avoid circular dependencies)
  import('../services/plex.service').then(({ plexService }) => {
    if (config.services.plex.url && config.services.plex.token) {
      console.log('[Config] Auto-configuring Plex service');
      plexService.configure(config.services.plex.url, config.services.plex.token);
    }
  });

  import('../services/tautulli.service').then(({ tautulliService }) => {
    if (config.services.tautulli.url && config.services.tautulli.apiKey && config.services.tautulli.enabled) {
      console.log('[Config] Auto-configuring Tautulli service');
      tautulliService.configure(config.services.tautulli.url, config.services.tautulli.apiKey);
    }
  });

  import('../services/radarr.service').then(({ radarrService }) => {
    if (config.services.radarr.url && config.services.radarr.apiKey && config.services.radarr.enabled) {
      console.log('[Config] Auto-configuring Radarr service');
      radarrService.configure(config.services.radarr.url, config.services.radarr.apiKey);
    }
  });

  import('../services/sonarr.service').then(({ sonarrService }) => {
    if (config.services.sonarr.url && config.services.sonarr.apiKey && config.services.sonarr.enabled) {
      console.log('[Config] Auto-configuring Sonarr service');
      sonarrService.configure(config.services.sonarr.url, config.services.sonarr.apiKey);
    }
  });
}

// Configure services on startup
configureServicesOnStartup();

export default config;