import { Router } from 'express';
import { configController } from '../controllers/config.controller';
import { libraryController } from '../controllers/library.controller';
import { statisticsController } from '../controllers/statistics.controller';
import { analyzerController } from '../controllers/analyzer.controller';
import { settingsController } from '../controllers/settings.controller';

const router = Router();

// API Information
router.get('/', (_req, res) => {
  res.json({
    message: 'Plex Analyzer API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      config: '/api/config',
      libraries: '/api/libraries',
      statistics: '/api/statistics',
    },
  });
});

// Configuration routes
router.get('/config', configController.getConfig.bind(configController));
router.post('/config', configController.updateConfig.bind(configController));
router.post('/config/test', configController.testConnections.bind(configController));
router.post('/config/test-only', configController.testConnectionsOnly.bind(configController));
router.delete('/config', configController.resetConfig.bind(configController));

// Library routes
router.get('/libraries', libraryController.getLibraries.bind(libraryController));
router.get('/libraries/:libraryId', libraryController.getLibrary.bind(libraryController));
router.get('/libraries/:libraryId/items', libraryController.getLibraryItems.bind(libraryController));
router.get('/libraries/:libraryId/refresh', libraryController.refreshLibrary.bind(libraryController));
router.get('/media/:itemId', libraryController.getMediaItem.bind(libraryController));

// Statistics routes
router.get('/statistics', statisticsController.getGlobalStatistics.bind(statisticsController));
router.get('/statistics/:libraryId', statisticsController.getLibraryStatistics.bind(statisticsController));
router.get('/statistics/quality/overview', statisticsController.getQualityOverview.bind(statisticsController));
router.get('/statistics/storage/breakdown', statisticsController.getStorageBreakdown.bind(statisticsController));
router.post('/statistics/refresh', statisticsController.refreshStatistics.bind(statisticsController));

// Analyzer routes
router.get('/analyzer/library/:libraryId', analyzerController.getLibraryAnalysis.bind(analyzerController));
router.get('/analyzer/library/:libraryId/size', analyzerController.getSizeAnalysis.bind(analyzerController));
router.get('/analyzer/library/:libraryId/quality', analyzerController.getQualityAnalysis.bind(analyzerController));
router.get('/analyzer/library/:libraryId/content', analyzerController.getContentAnalysis.bind(analyzerController));
router.post('/analyzer/library/:libraryId/refresh', analyzerController.refreshAnalysis.bind(analyzerController));

// Settings routes
router.get('/settings', settingsController.getSettings.bind(settingsController));
router.put('/settings', settingsController.updateSettings.bind(settingsController));

export default router;