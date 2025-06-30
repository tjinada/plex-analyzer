import { Router, Request, Response, NextFunction } from 'express';
import { sonarrService } from '../services/sonarr.service';
import { EpisodeFilters, QueueFilters } from '../models/arr-models';

const router = Router();

/**
 * Get all series from Sonarr
 */
router.get('/series', async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    if (!sonarrService.isReady()) {
      res.status(503).json({ 
        error: 'Sonarr service not configured',
        message: 'Please configure Sonarr connection in settings'
      });
      return;
    }

    const series = await sonarrService.getSeries();
    res.json({ series, count: series.length });
  } catch (error) {
    console.error('Error fetching series:', error);
    res.status(500).json({ 
      error: 'Failed to fetch series',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get episodes for a specific series
 */
router.get('/series/:seriesId/episodes', async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    if (!sonarrService.isReady()) {
      res.status(503).json({ 
        error: 'Sonarr service not configured',
        message: 'Please configure Sonarr connection in settings'
      });
      return;
    }

    const seriesId = parseInt(req.params.seriesId, 10);
    if (isNaN(seriesId)) {
      res.status(400).json({ 
        error: 'Invalid series ID',
        message: 'Series ID must be a valid number'
      });
      return;
    }

    const episodes = await sonarrService.getEpisodes(seriesId);
    res.json({ episodes, count: episodes.length, seriesId });
  } catch (error) {
    console.error('Error fetching episodes:', error);
    res.status(500).json({ 
      error: 'Failed to fetch episodes',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get wanted episodes from Sonarr
 */
router.get('/wanted', async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    if (!sonarrService.isReady()) {
      res.status(503).json({ 
        error: 'Sonarr service not configured',
        message: 'Please configure Sonarr connection in settings'
      });
      return;
    }

    // Parse filters from query parameters
    const filters: EpisodeFilters = {};
    
    if (req.query.seriesId) {
      filters.seriesId = parseInt(req.query.seriesId as string, 10);
    }
    
    if (req.query.seasonNumber !== undefined) {
      filters.seasonNumber = parseInt(req.query.seasonNumber as string, 10);
    }
    
    if (req.query.monitored !== undefined) {
      filters.monitored = req.query.monitored === 'true';
    }
    
    if (req.query.hasFile !== undefined) {
      filters.hasFile = req.query.hasFile === 'true';
    }
    
    if (req.query.airDateCutoff) {
      filters.airDateCutoff = req.query.airDateCutoff as string;
    }
    
    if (req.query.sortBy) {
      filters.sortBy = req.query.sortBy as 'airDate' | 'series' | 'season' | 'episode';
      filters.sortDirection = (req.query.sortDirection as 'asc' | 'desc') || 'asc';
    }

    const wantedEpisodes = await sonarrService.getWantedEpisodes(filters);
    res.json({ 
      episodes: wantedEpisodes, 
      count: wantedEpisodes.length,
      filters: filters
    });
  } catch (error) {
    console.error('Error fetching wanted episodes:', error);
    res.status(500).json({ 
      error: 'Failed to fetch wanted episodes',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get missing episodes from Sonarr
 */
router.get('/missing', async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    if (!sonarrService.isReady()) {
      res.status(503).json({ 
        error: 'Sonarr service not configured',
        message: 'Please configure Sonarr connection in settings'
      });
      return;
    }

    // Parse filters from query parameters (same as wanted)
    const filters: EpisodeFilters = {};
    
    if (req.query.seriesId) {
      filters.seriesId = parseInt(req.query.seriesId as string, 10);
    }
    
    if (req.query.seasonNumber !== undefined) {
      filters.seasonNumber = parseInt(req.query.seasonNumber as string, 10);
    }
    
    if (req.query.monitored !== undefined) {
      filters.monitored = req.query.monitored === 'true';
    }
    
    if (req.query.sortBy) {
      filters.sortBy = req.query.sortBy as 'airDate' | 'series' | 'season' | 'episode';
      filters.sortDirection = (req.query.sortDirection as 'asc' | 'desc') || 'asc';
    }

    const missingEpisodes = await sonarrService.getMissingEpisodes(filters);
    res.json({ 
      episodes: missingEpisodes, 
      count: missingEpisodes.length,
      filters: filters
    });
  } catch (error) {
    console.error('Error fetching missing episodes:', error);
    res.status(500).json({ 
      error: 'Failed to fetch missing episodes',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get download queue from Sonarr
 */
router.get('/queue', async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    if (!sonarrService.isReady()) {
      res.status(503).json({ 
        error: 'Sonarr service not configured',
        message: 'Please configure Sonarr connection in settings'
      });
      return;
    }

    // Parse filters from query parameters
    const filters: QueueFilters = {};
    
    if (req.query.status) {
      filters.status = req.query.status as string;
    }
    
    if (req.query.protocol) {
      filters.protocol = req.query.protocol as string;
    }
    
    if (req.query.downloadClient) {
      filters.downloadClient = req.query.downloadClient as string;
    }
    
    if (req.query.includeUnknownSeriesItems !== undefined) {
      filters.includeUnknownSeriesItems = req.query.includeUnknownSeriesItems === 'true';
    }

    const queueItems = await sonarrService.getQueue(filters);
    res.json({ 
      queue: queueItems, 
      count: queueItems.length,
      filters: filters
    });
  } catch (error) {
    console.error('Error fetching queue:', error);
    res.status(500).json({ 
      error: 'Failed to fetch queue',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get queue summary statistics
 */
router.get('/queue/summary', async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    if (!sonarrService.isReady()) {
      res.status(503).json({ 
        error: 'Sonarr service not configured',
        message: 'Please configure Sonarr connection in settings'
      });
      return;
    }

    const summary = await sonarrService.getQueueSummary();
    res.json(summary);
  } catch (error) {
    console.error('Error fetching queue summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch queue summary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Trigger manual search for episodes
 */
router.post('/search/episodes', async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    if (!sonarrService.isReady()) {
      res.status(503).json({ 
        error: 'Sonarr service not configured',
        message: 'Please configure Sonarr connection in settings'
      });
      return;
    }

    const { episodeIds } = req.body;
    if (!Array.isArray(episodeIds) || episodeIds.length === 0) {
      res.status(400).json({ 
        error: 'Invalid episode IDs',
        message: 'Episode IDs must be a non-empty array of numbers'
      });
      return;
    }

    const validIds = episodeIds.filter(id => typeof id === 'number' && !isNaN(id));
    if (validIds.length === 0) {
      res.status(400).json({ 
        error: 'Invalid episode IDs',
        message: 'No valid episode IDs provided'
      });
      return;
    }

    const success = await sonarrService.searchEpisodes(validIds);
    res.json({ 
      success, 
      message: success ? 'Episode search triggered successfully' : 'Failed to trigger episode search',
      episodeIds: validIds 
    });
  } catch (error) {
    console.error('Error triggering episode search:', error);
    res.status(500).json({ 
      error: 'Failed to trigger search',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Trigger manual search for entire series
 */
router.post('/search/series/:seriesId', async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    if (!sonarrService.isReady()) {
      res.status(503).json({ 
        error: 'Sonarr service not configured',
        message: 'Please configure Sonarr connection in settings'
      });
      return;
    }

    const seriesId = parseInt(req.params.seriesId, 10);
    if (isNaN(seriesId)) {
      res.status(400).json({ 
        error: 'Invalid series ID',
        message: 'Series ID must be a valid number'
      });
      return;
    }

    const success = await sonarrService.searchSeries(seriesId);
    res.json({ 
      success, 
      message: success ? 'Series search triggered successfully' : 'Failed to trigger series search',
      seriesId 
    });
  } catch (error) {
    console.error('Error triggering series search:', error);
    res.status(500).json({ 
      error: 'Failed to trigger search',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Remove item from queue
 */
router.delete('/queue/:queueId', async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    if (!sonarrService.isReady()) {
      res.status(503).json({ 
        error: 'Sonarr service not configured',
        message: 'Please configure Sonarr connection in settings'
      });
      return;
    }

    const queueId = parseInt(req.params.queueId, 10);
    if (isNaN(queueId)) {
      res.status(400).json({ 
        error: 'Invalid queue ID',
        message: 'Queue ID must be a valid number'
      });
      return;
    }

    const removeFromClient = req.query.removeFromClient === 'true';
    const blacklist = req.query.blacklist === 'true';

    const success = await sonarrService.removeFromQueue(queueId, removeFromClient, blacklist);
    res.json({ 
      success, 
      message: success ? 'Queue item removed successfully' : 'Failed to remove queue item',
      queueId 
    });
  } catch (error) {
    console.error('Error removing queue item:', error);
    res.status(500).json({ 
      error: 'Failed to remove queue item',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get quality profiles
 */
router.get('/quality-profiles', async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    if (!sonarrService.isReady()) {
      res.status(503).json({ 
        error: 'Sonarr service not configured',
        message: 'Please configure Sonarr connection in settings'
      });
      return;
    }

    const profiles = await sonarrService.getQualityProfiles();
    res.json({ profiles, count: profiles.length });
  } catch (error) {
    console.error('Error fetching quality profiles:', error);
    res.status(500).json({ 
      error: 'Failed to fetch quality profiles',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Test Sonarr connection
 */
router.get('/test', async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    if (!sonarrService.isReady()) {
      res.status(503).json({ 
        error: 'Sonarr service not configured',
        message: 'Please configure Sonarr connection in settings'
      });
      return;
    }

    const isConnected = await sonarrService.testConnection();
    res.json({ 
      connected: isConnected,
      message: isConnected ? 'Connection successful' : 'Connection failed'
    });
  } catch (error) {
    console.error('Error testing Sonarr connection:', error);
    res.status(500).json({ 
      error: 'Failed to test connection',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;