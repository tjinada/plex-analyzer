import { Router, Request, Response, NextFunction } from 'express';
import { radarrService } from '../services/radarr.service';
import { MovieFilters, QueueFilters } from '../models/arr-models';

const router = Router();

/**
 * Get all movies from Radarr
 */
router.get('/movies', async (_req: Request, res: Response, __next: NextFunction): Promise<void> => {
  try {
    if (!radarrService.isReady()) {
      res.status(503).json({ 
        error: 'Radarr service not configured',
        message: 'Please configure Radarr connection in settings'
      });
      return;
    }

    const movies = await radarrService.getMovies();
    res.json({ movies, count: movies.length });
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ 
      error: 'Failed to fetch movies',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get wanted movies from Radarr
 */
router.get('/wanted', async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    if (!radarrService.isReady()) {
      res.status(503).json({ 
        error: 'Radarr service not configured',
        message: 'Please configure Radarr connection in settings'
      });
      return;
    }

    // Parse filters from query parameters
    const filters: MovieFilters = {};
    
    if (req.query.monitored !== undefined) {
      filters.monitored = req.query.monitored === 'true';
    }
    
    if (req.query.hasFile !== undefined) {
      filters.hasFile = req.query.hasFile === 'true';
    }
    
    if (req.query.qualityProfileId) {
      filters.qualityProfileId = parseInt(req.query.qualityProfileId as string, 10);
    }
    
    if (req.query.minimumAvailability) {
      filters.minimumAvailability = req.query.minimumAvailability as string;
    }
    
    if (req.query.year) {
      filters.year = parseInt(req.query.year as string, 10);
    }
    
    if (req.query.genres) {
      const genresParam = req.query.genres as string;
      filters.genres = genresParam.split(',').map(g => g.trim());
    }
    
    if (req.query.sortBy) {
      filters.sortBy = req.query.sortBy as 'title' | 'year' | 'added' | 'inCinemas' | 'physicalRelease';
      filters.sortDirection = (req.query.sortDirection as 'asc' | 'desc') || 'asc';
    }

    const wantedMovies = await radarrService.getWantedMovies(filters);
    res.json({ 
      movies: wantedMovies, 
      count: wantedMovies.length,
      filters: filters
    });
  } catch (error) {
    console.error('Error fetching wanted movies:', error);
    res.status(500).json({ 
      error: 'Failed to fetch wanted movies',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get missing movies from Radarr
 */
router.get('/missing', async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    if (!radarrService.isReady()) {
      res.status(503).json({ 
        error: 'Radarr service not configured',
        message: 'Please configure Radarr connection in settings'
      });
      return;
    }

    // Parse filters from query parameters (same as wanted)
    const filters: MovieFilters = {};
    
    if (req.query.monitored !== undefined) {
      filters.monitored = req.query.monitored === 'true';
    }
    
    if (req.query.qualityProfileId) {
      filters.qualityProfileId = parseInt(req.query.qualityProfileId as string, 10);
    }
    
    if (req.query.year) {
      filters.year = parseInt(req.query.year as string, 10);
    }
    
    if (req.query.sortBy) {
      filters.sortBy = req.query.sortBy as 'title' | 'year' | 'added' | 'inCinemas' | 'physicalRelease';
      filters.sortDirection = (req.query.sortDirection as 'asc' | 'desc') || 'asc';
    }

    const missingMovies = await radarrService.getMissingMovies(filters);
    res.json({ 
      movies: missingMovies, 
      count: missingMovies.length,
      filters: filters
    });
  } catch (error) {
    console.error('Error fetching missing movies:', error);
    res.status(500).json({ 
      error: 'Failed to fetch missing movies',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get download queue from Radarr
 */
router.get('/queue', async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    if (!radarrService.isReady()) {
      res.status(503).json({ 
        error: 'Radarr service not configured',
        message: 'Please configure Radarr connection in settings'
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
    
    if (req.query.includeUnknownMovieItems !== undefined) {
      filters.includeUnknownMovieItems = req.query.includeUnknownMovieItems === 'true';
    }

    const queueItems = await radarrService.getQueue(filters);
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
    if (!radarrService.isReady()) {
      res.status(503).json({ 
        error: 'Radarr service not configured',
        message: 'Please configure Radarr connection in settings'
      });
      return;
    }

    const summary = await radarrService.getQueueSummary();
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
 * Trigger manual search for a movie
 */
router.post('/search/:movieId', async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    if (!radarrService.isReady()) {
      res.status(503).json({ 
        error: 'Radarr service not configured',
        message: 'Please configure Radarr connection in settings'
      });
      return;
    }

    const movieId = parseInt(req.params.movieId, 10);
    if (isNaN(movieId)) {
      res.status(400).json({ 
        error: 'Invalid movie ID',
        message: 'Movie ID must be a valid number'
      });
      return;
    }

    const success = await radarrService.searchMovie(movieId);
    res.json({ 
      success, 
      message: success ? 'Search triggered successfully' : 'Failed to trigger search',
      movieId 
    });
  } catch (error) {
    console.error('Error triggering movie search:', error);
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
    if (!radarrService.isReady()) {
      res.status(503).json({ 
        error: 'Radarr service not configured',
        message: 'Please configure Radarr connection in settings'
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

    const success = await radarrService.removeFromQueue(queueId, removeFromClient, blacklist);
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
    if (!radarrService.isReady()) {
      res.status(503).json({ 
        error: 'Radarr service not configured',
        message: 'Please configure Radarr connection in settings'
      });
      return;
    }

    const profiles = await radarrService.getQualityProfiles();
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
 * Test Radarr connection
 */
router.get('/test', async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    if (!radarrService.isReady()) {
      res.status(503).json({ 
        error: 'Radarr service not configured',
        message: 'Please configure Radarr connection in settings'
      });
      return;
    }

    const isConnected = await radarrService.testConnection();
    res.json({ 
      connected: isConnected,
      message: isConnected ? 'Connection successful' : 'Connection failed'
    });
  } catch (error) {
    console.error('Error testing Radarr connection:', error);
    res.status(500).json({ 
      error: 'Failed to test connection',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;