import { config } from '../config';
import { analyzerService as plexAnalyzerService } from './analyzer.service';
import { tautulliAnalyzerService } from './tautulli-analyzer.service';

/**
 * Factory to get the appropriate analyzer service based on configuration
 */
export function getAnalyzerService() {
  const dataSource = config.settings.dataSource;
  
  console.log(`[AnalyzerFactory] Using data source: ${dataSource}`);
  
  if (dataSource === 'tautulli') {
    // Check if Tautulli is configured and enabled
    if (!config.services.tautulli.enabled || !config.services.tautulli.url || !config.services.tautulli.apiKey) {
      console.warn('[AnalyzerFactory] Tautulli selected but not properly configured, falling back to Plex');
      return plexAnalyzerService;
    }
    return tautulliAnalyzerService;
  }
  
  // Default to Plex
  return plexAnalyzerService;
}

// Export a dynamic analyzer service that uses the factory
export const analyzerService = getAnalyzerService();